#!/usr/bin/env node
// INKWAKE brush pipeline.
//
//   brush/illustrations/*.mjs   centrelines (data) per illustration
//   brush/scans/<id>.svg        optional scanned art (outline + centreline per stroke)
//        │
//        ▼  perfect-freehand (or the scan) → filled outline (visual layer)
//        ▼  centreline → per-stroke mask (width ≈ 1.15 × widest point, pathLength=1)
//        ▼  grain field → edge modulation + dry-brush breakup
//        ▼  SVGO (stable ids, viewBox kept)
//   src/generated/brush/<Name>.astro + <id>.timeline.json + manifest.json
//   src/generated/brush/masks/<id>.svg   (CSS mask images for UI chrome)
//   src/generated/textures/grain-{light,dark}.png
import { readdir, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getStroke } from 'perfect-freehand';
import { optimize } from 'svgo';
import { BRUSHES } from '../../brush/presets.mjs';
import { createGrain, hashString, mulberry32 } from './noise.mjs';
import { encodeGrayPng } from './png.mjs';
import {
  sampleSpline,
  centrelinePath,
  outlineToPath,
  offsetSamples,
  modulateOutline,
  polygonArea,
  samplePathD,
  widestPoint,
} from './geometry.mjs';
import { duration, motionRules } from '../../src/design/tokens.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = join(ROOT, 'brush/illustrations');
const SCANS = join(ROOT, 'brush/scans');
const OUT = join(ROOT, 'src/generated/brush');
const OUT_MASKS = join(OUT, 'masks');
const OUT_TEX = join(ROOT, 'src/generated/textures');

const LIMITS = {
  hero: { strokes: 30, brushes: 3, ink: 0.4 },
  portrait: { strokes: 20, brushes: 3, ink: 0.4 },
  spot: { strokes: 7, brushes: 3, ink: 0.4 },
  icon: { strokes: 7, brushes: 3, ink: 0.5 },
  ui: { strokes: 12, brushes: 3, ink: Infinity },
  stamp: { strokes: 1, brushes: 1, ink: 1 },
};
const WIDTH_RULES = { primary: [6, 18], dry: [6, 40], detail: [2, 4] };

const grain = createGrain();
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);

// ── stroke generation ─────────────────────────────────────────────────────

function strokeOptions(preset, size, length) {
  // Tapers shorter than the brush collapse the outline: cap those ends instead.
  const st = preset.startTaper * length;
  const et = preset.endTaper * length;
  return {
    size,
    thinning: preset.thinning,
    smoothing: preset.smoothing,
    streamline: preset.streamline,
    simulatePressure: false,
    easing: (t) => t,
    start: { cap: true, taper: st < size * 0.75 ? 0 : st },
    end: { cap: true, taper: et < size * 0.75 ? 0 : et },
    last: true,
  };
}

function generateStroke(ill, s, index) {
  const preset = BRUSHES[s.brush];
  if (!preset) throw new Error(`${ill.id}: unknown brush "${s.brush}"`);
  const seed = hashString(`${ill.id}:${index}`);
  const rnd = mulberry32(seed);
  const spacing = Math.max(0.15, Math.min(2, s.size * 0.22));
  const { samples, length } = sampleSpline(s.points, spacing);
  const withPressure = samples.map(([x, y, t]) => [x, y, preset.pressure(t)]);
  const useGrain = ill.grain !== false && s.grain !== false;
  const gx = (rnd() * 256) | 0;
  const gy = (rnd() * 256) | 0;
  // grain field sampled in "brush space": features ≈ 0.4–3 × brush size
  const fScale = 26 / Math.max(2, s.size);
  const g = (x, y) => grain(x * fScale + gx, y * fScale + gy);

  const outlines = [];
  const body = getStroke(withPressure, strokeOptions(preset, s.size, length));
  const amp = preset.edgeGrain * s.size;
  outlines.push(useGrain ? modulateOutline(body, (x, y) => (g(x, y) - 0.5) * 2 * amp) : body);

  // Dry-brush tail: bristles run out of ink at different points; the grain
  // field decides where each one breaks.
  const br = preset.bristles;
  if (useGrain && br && length > s.size * 6) {
    const startIdx = samples.findIndex((p) => p[2] >= br.from);
    const r0 = (s.size / 2) * (1 - preset.thinning * (1 - 2 * preset.pressure(br.from)));
    for (let k = 0; k < br.count; k++) {
      const lane = br.count === 1 ? 0 : (k / (br.count - 1)) * 2 - 1;
      const off = lane * br.spread * r0 * 2 * (0.85 + rnd() * 0.3);
      const end = br.from + (1 - br.from) * (0.62 + rnd() * 0.42);
      const lanePts = offsetSamples(
        samples.slice(startIdx).filter((p) => p[2] <= Math.min(1, end)),
        (t) => off * (1 + 0.25 * (t - br.from)),
      );
      // break the bristle where the grain is thin
      let seg = [];
      const segs = [];
      for (const p of lanePts) {
        const gap = g(p[0] * 1.7, p[1] * 1.7) < 0.36 && p[2] > br.from + 0.08;
        if (gap) {
          if (seg.length > 3) segs.push(seg);
          seg = [];
        } else seg.push(p);
      }
      if (seg.length > 3) segs.push(seg);
      for (const sg of segs) {
        const bl = sg.length * spacing;
        if (bl < s.size * 0.6) continue;
        const bsize = s.size * br.size * (0.7 + rnd() * 0.6);
        const pts = sg.map(([x, y, t]) => [x, y, 0.55 - 0.25 * ((t - br.from) / (1 - br.from))]);
        const o = getStroke(pts, {
          size: bsize,
          thinning: 0.5,
          smoothing: 0.5,
          streamline: 0.3,
          simulatePressure: false,
          start: { cap: true, taper: bl * 0.25 },
          end: { cap: true, taper: bl * 0.6 },
          last: true,
        });
        if (o.length > 4) outlines.push(o);
      }
    }
  }
  return { outlines, samples, length };
}

// ── scanned art ───────────────────────────────────────────────────────────

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : undefined;
};

async function readScan(id) {
  const file = join(SCANS, `${id}.svg`);
  if (!existsSync(file)) return null;
  const svg = (await readFile(file, 'utf8')).replace(/<!--[\s\S]*?-->/g, '');
  const tags = svg.match(/<path\b[^>]*>/g) || [];
  const byStroke = new Map();
  for (const tag of tags) {
    const pid = attr(tag, 'id') || '';
    const m = pid.match(/^(.+)-(outline|centreline|centerline)$/);
    if (!m) continue;
    const key = m[1];
    const entry = byStroke.get(key) || { key };
    if (m[2] === 'outline') {
      entry.outline = attr(tag, 'd');
      entry.tone = attr(tag, 'data-tone');
      entry.layer = attr(tag, 'data-layer');
      entry.brush = attr(tag, 'data-brush');
    } else entry.centreline = attr(tag, 'd');
    byStroke.set(key, entry);
  }
  const strokes = [...byStroke.values()]
    .filter((e) => e.outline && e.centreline)
    .sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true }));
  if (!strokes.length) throw new Error(`${file}: no <path id="NN-outline"> / <path id="NN-centreline"> pairs found`);
  return strokes;
}

// ── assembly ──────────────────────────────────────────────────────────────

const fmtFor = (vbW) => {
  const p = vbW < 100 ? 3 : 2;
  return (n) => {
    const v = Number(n.toFixed(p));
    return Object.is(v, -0) ? '0' : String(v);
  };
};

function durationFor(length, diag) {
  const r = length / diag;
  if (r < 0.18) return duration['stroke-s'];
  if (r < 0.6) return duration['stroke-m'];
  return duration['stroke-l'];
}

function buildTimeline(ill, strokes) {
  const [, , w, h] = ill.viewBox;
  const diag = Math.hypot(w, h);
  const overlap = Math.min(motionRules.maxStrokeOverlap, ill.overlap ?? motionRules.maxStrokeOverlap);
  let t = 0;
  const entries = strokes.map((s, i) => {
    const d = s.duration ?? durationFor(s.length, diag);
    const e = { id: s.id, order: i, duration: d, delay: t, ease: s.ease || 'brush', layer: s.layer };
    t += d * (1 - overlap);
    return e;
  });
  const natural = entries.length ? entries.at(-1).delay + entries.at(-1).duration : 0;
  const budget = ill.budget;
  const k = budget && natural > budget ? budget / natural : 1;
  for (const e of entries) {
    e.duration = Math.round(e.duration * k);
    e.delay = Math.round(e.delay * k);
  }
  return { id: ill.id, total: Math.round(natural * k), strokes: entries };
}

function pascal(id) {
  return id.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
}

function svgoClean(svg, vbW) {
  return optimize(svg, {
    multipass: false,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            cleanupIds: false, // stable, prefixed ids
            mergePaths: false, // one path per brush shape
            collapseGroups: false, // keep stroke/visual layer groups
            moveElemsAttrsToGroup: false,
            moveGroupAttrsToElems: false,
            removeHiddenElems: false,
            convertShapeToPath: false,
            removeUselessDefs: false,
            convertPathData: { floatPrecision: vbW < 100 ? 3 : 2, makeArcs: false },
            cleanupNumericValues: { floatPrecision: vbW < 100 ? 3 : 2 },
          },
        },
      },
    ],
  }).data;
}

async function buildIllustration(ill) {
  const lim = LIMITS[ill.kind];
  if (!lim) throw new Error(`${ill.id}: unknown kind "${ill.kind}"`);
  const [vx, vy, vw, vh] = ill.viewBox;
  const fmt = fmtFor(vw);
  const scan = await readScan(ill.id);
  const P = '__P__';
  const strokes = [];

  if (scan) {
    scan.forEach((e, i) => {
      const centre = samplePathD(e.centreline, Math.max(0.25, vw / 600));
      const outline = samplePathD(e.outline, Math.max(0.25, vw / 600));
      strokes.push({
        id: `${P}-s${i + 1}`,
        brush: e.brush || 'scan',
        tone: e.tone || 'ink',
        layer: e.layer || 'line',
        outlineD: [e.outline],
        centreD: e.centreline,
        outlinePts: [outline.points],
        samples: centre.points,
        length: centre.length,
        scanned: true,
      });
    });
  } else {
    ill.strokes.forEach((s, i) => {
      const g = generateStroke(ill, s, i);
      strokes.push({
        id: `${P}-s${i + 1}`,
        brush: s.brush,
        tone: s.tone || 'ink',
        layer: s.layer || 'line',
        size: s.size,
        duration: s.duration,
        ease: s.ease,
        outlineD: g.outlines.map((o) => outlineToPath(o, fmt)),
        centreD: centrelinePath(s.points, fmt),
        outlinePts: g.outlines,
        samples: g.samples,
        length: g.length,
      });
    });
  }

  // ── rules ──
  if (strokes.length > lim.strokes) fail(`${ill.id}: ${strokes.length} strokes > ${lim.strokes} allowed for ${ill.kind}`);
  const brushes = new Set(strokes.map((s) => s.brush));
  if (brushes.size > lim.brushes) fail(`${ill.id}: ${brushes.size} brushes > ${lim.brushes}`);
  const accents = new Set(strokes.map((s) => s.tone).filter((t) => !['ink', 'wash', 'graphite', 'paper'].includes(t)));
  if (ill.kind !== 'ui' && ill.kind !== 'stamp' && accents.size > 1) fail(`${ill.id}: more than one accent (${[...accents]})`);
  let inkArea = 0;
  for (const s of strokes) {
    s.widest = widestPoint(s.outlinePts.flat(), s.samples);
    s.maskWidth = s.widest * 1.15;
    for (const o of s.outlinePts) inkArea += polygonArea(o);
    if (!s.scanned && ill.display1440 && WIDTH_RULES[s.brush] && ill.kind !== 'ui') {
      for (const px of [].concat(ill.display1440)) {
        const w = (s.widest * px) / vw;
        const [lo, hi] = WIDTH_RULES[s.brush];
        if (w < lo - 0.25 || w > hi + 0.25)
          fail(`${ill.id} ${s.id.replace(P, '')}: ${s.brush} stroke is ${w.toFixed(1)}px wide at ${px}px display (rule ${lo}–${hi}px)`);
      }
    }
  }
  const ink = inkArea / (vw * vh);
  if (ink > lim.ink) fail(`${ill.id}: ink covers ${(ink * 100).toFixed(0)}% (needs ≥${((1 - lim.ink) * 100).toFixed(0)}% negative space)`);

  // ── svg ──
  const defs = strokes
    .map(
      (s) =>
        `<mask id="${s.id}-m"><path class="bm" d="${s.centreD}" pathLength="1" fill="none" stroke="#fff" stroke-width="${fmt(
          s.maskWidth,
        )}" stroke-linecap="round" stroke-linejoin="round"/></mask>`,
    )
    .join('');
  const body = strokes
    .map(
      (s, i) =>
        `<g class="bs" id="${s.id}" data-o="${i}" data-tone="${s.tone}" data-layer="${s.layer}" mask="url(#${s.id}-m)"><g class="bv">${s.outlineD
          .map((d) => `<path d="${d}"/>`)
          .join('')}</g></g>`,
    )
    .join('');
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}"><defs>${defs}</defs>${body}</svg>`;
  const clean = svgoClean(raw, vw);
  const inner = clean.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const timeline = buildTimeline(
    ill,
    strokes.map((s) => ({ ...s, id: s.id.replace(`${P}-`, '') })),
  );

  // Static mask image for CSS (UI chrome): final shape, white, no masks.
  if (ill.exportMask) {
    const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="none">${
      ill.exportMask.solid ? `<rect x="${ill.exportMask.solid[0]}" y="${vy}" width="${ill.exportMask.solid[1]}" height="${vh}" fill="#fff"/>` : ''
    }<g fill="#fff">${strokes.flatMap((s) => s.outlineD.map((d) => `<path d="${d}"/>`)).join('')}</g></svg>`;
    await writeFile(join(OUT_MASKS, `${ill.id}.svg`), svgoClean(maskSvg, vw));
  }

  const name = ill.component || pascal(ill.id);
  const label = ill.label || '';
  const component = `---
// AUTO-GENERATED by scripts/brush/build.mjs from brush/${scan ? `scans/${ill.id}.svg` : `illustrations/${ill.id}.mjs`}.
// Do not edit: change the source data and run \`npm run brush\`.
import { prefixed } from '../../lib/brush';
interface Props {
  /** Unique per page when the same illustration is used twice. */
  idPrefix?: string;
  class?: string;
  /** Accessible label. Omit + decorative for purely decorative use. */
  label?: string;
  decorative?: boolean;
  /** When the strokes draw: on load, on scroll into view, or by script. */
  anim?: 'load' | 'scroll' | 'manual' | 'none';
  [key: string]: unknown;
}
const { idPrefix = '${ill.id}', class: className, label = ${JSON.stringify(label)}, decorative = ${ill.decorative ? 'true' : 'false'}, anim = 'scroll', ...rest } = Astro.props;
const markup = prefixed(${JSON.stringify(inner)}, idPrefix);
const timeline = ${JSON.stringify(JSON.stringify(timeline.strokes))};
---
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="${vx} ${vy} ${vw} ${vh}"
  ${ill.preserveAspectRatio ? `preserveAspectRatio="${ill.preserveAspectRatio}"` : ''}
  class:list={['brush', 'brush--${ill.kind}', className]}
  data-brush="${ill.id}"
  data-anim={anim}
  data-timeline={timeline}
  role={decorative ? undefined : 'img'}
  aria-label={decorative ? undefined : label}
  aria-hidden={decorative ? 'true' : undefined}
  focusable="false"
  {...rest}
  set:html={markup}
/>
`;
  await writeFile(join(OUT, `${name}.astro`), component);
  await writeFile(join(OUT, `${ill.id}.timeline.json`), JSON.stringify(timeline, null, 2));

  return {
    id: ill.id,
    component: name,
    kind: ill.kind,
    title: ill.title || ill.id,
    source: scan ? 'scan' : 'generated',
    viewBox: ill.viewBox,
    strokes: strokes.length,
    brushes: [...brushes],
    accents: [...accents],
    negativeSpace: Number((1 - Math.min(1, ink)).toFixed(3)),
    total: timeline.total,
    anchors: ill.anchors || null,
    centrelines: ill.exportCentrelines ? strokes.map((s) => s.centreD) : undefined,
    widths: strokes.map((s) => Number(s.widest.toFixed(2))),
  };
}

// ── seal (stamp) ──────────────────────────────────────────────────────────

async function buildSeal() {
  // A square stamp whose edge and speckle come from the grain field.
  const S = 100;
  const rnd = mulberry32(hashString('seal'));
  const pts = [];
  const inset = 6;
  const corners = [
    [inset, inset],
    [S - inset, inset],
    [S - inset, S - inset],
    [inset, S - inset],
  ];
  for (let c = 0; c < 4; c++) {
    const a = corners[c];
    const b = corners[(c + 1) % 4];
    for (let i = 0; i < 28; i++) {
      const t = i / 28;
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      const n = grain(x * 6 + 40, y * 6 + 90) - 0.5;
      const nx = b[1] - a[1] ? Math.sign(b[1] - a[1]) : 0;
      const ny = b[0] - a[0] ? -Math.sign(b[0] - a[0]) : 0;
      const j = n * 3.2 + (rnd() - 0.5) * 0.6;
      pts.push([x + nx * j, y + ny * j]);
    }
  }
  const f = fmtFor(S);
  let d = `M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
  // uninked speckles (evenodd holes)
  for (let i = 0; i < 26; i++) {
    const x = 12 + rnd() * 76;
    const y = 12 + rnd() * 76;
    if (grain(x * 9, y * 9) > 0.44) continue;
    const r = 0.5 + rnd() * 1.3;
    d += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r * 0.7)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r * 0.7)} 0 1 0 ${f(-r * 2)} 0Z`;
  }
  await writeFile(join(OUT, 'seal-shape.json'), JSON.stringify({ viewBox: [0, 0, S, S], d }));
}

// ── textures ──────────────────────────────────────────────────────────────

async function buildTextures() {
  const N = 256;
  const light = new Uint8Array(N * N);
  const dark = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = grain(x, y);
      const c = Math.min(1, Math.max(0, (v - 0.3) / 0.45)); // contrast
      // light: darkening fibres for multiply (white = no change)
      const l = 1 - 0.6 * (1 - c) ** 2.2;
      // dark: lightening fibres for screen (black = no change)
      const dk = 0.7 * c ** 2;
      const q = (n) => Math.round(Math.round(n * 31) * (255 / 31)); // 32 levels
      light[y * N + x] = q(l);
      dark[y * N + x] = q(dk);
    }
  }
  await writeFile(join(OUT_TEX, 'grain-light.png'), encodeGrayPng(N, N, light));
  await writeFile(join(OUT_TEX, 'grain-dark.png'), encodeGrayPng(N, N, dark));
}

// ── main ──────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT_MASKS, { recursive: true });
  await mkdir(OUT_TEX, { recursive: true });
  const files = (await readdir(SRC)).filter((f) => f.endsWith('.mjs')).sort();
  const manifest = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(SRC, f)).href);
    const list = [].concat(mod.default);
    for (const ill of list) manifest.push(await buildIllustration(ill));
  }
  await buildSeal();
  await buildTextures();
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  for (const w of warnings) console.warn(`  ! ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    console.error(`brush: ${errors.length} rule violation(s)`);
    process.exit(1);
  }
  console.log(`brush: ${manifest.length} illustrations, ${manifest.reduce((a, m) => a + m.strokes, 0)} strokes in ${Date.now() - t0}ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
