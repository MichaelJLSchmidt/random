import { type Pt, pathOf } from '../geometry'
import { fontUnits, glyphs } from '../glyphs'
import { ACCENT, type Concept, NEUTRAL, type Variant } from '../model'
import { exitCalm, exitFull, shift } from '../motion-kit'
import { interpolator } from '../path-morph'

/*
 * 5 · Typeface Ligature. The M and the F of the site's display face
 * (Bricolage Grotesque, opsz 96) as filled outlines, wght 800, with the M's
 * right stem lying on the F's stem. They stay two overlapping paths (no
 * boolean merge), so the wght 200 and wght 800 instances, which share their
 * point structure, interpolate point for point. The F is the accent.
 *
 * The face's M is wide: at a 30-unit cap height the pair would be 47.4 units
 * wide, edge to edge in the 48 box. The master uses a 27-unit cap height
 * (42.7 wide), so its ink box matches the other concepts' margins.
 */
/**
 * An instance at any weight from 200 to 800. The font has two wght masters at
 * opsz 96, so points move linearly between the extracted 200 and 800 outlines.
 */
function instance(g: 'M' | 'F', wght: number) {
  const t = (wght - 200) / 600
  const a = glyphs[g]['200'].contours
  const b = glyphs[g]['800'].contours
  return a.map((c, i) => c.map((p, j) => [p[0] + (b[i][j][0] - p[0]) * t, p[1] + (b[i][j][1] - p[1]) * t]))
}

/** Outlines of one weight, scaled to `cap` units and centred on x = cx with the baseline at `base`. */
function pair(wght: number, cap: number, base: number, cx = 24) {
  const s = cap / fontUnits.cap
  const M = instance('M', wght)
  const F = instance('F', wght)
  // The M's right stem: its inner (left) edge is the second-largest x on the baseline.
  const onBase = [
    ...new Set(
      M.flat()
        .filter((p) => p[1] === 0)
        .map((p) => p[0]),
    ),
  ].sort((a, b) => a - b)
  const mRightStem = onBase[onBase.length - 2]
  const fStem = Math.min(...F[0].map((p) => p[0]))
  const dx = mRightStem - fStem
  const xs = [...M.flat().map((p) => p[0]), ...F.flat().map((p) => p[0] + dx)]
  const ox = cx - (s * (Math.min(...xs) + Math.max(...xs))) / 2
  const tf =
    (shiftX: number) =>
    (p: number[]): Pt => [ox + s * (p[0] + shiftX), base - s * p[1]]
  return {
    m: M.map((c) => pathOf(c.map(tf(0)), true)).join(''),
    f: F.map((c) => pathOf(c.map(tf(dx)), true)).join(''),
    stem: s * (F[0][2][0] - F[0][0][0]),
  }
}

const CAP = 27
const BASE = 24 + CAP / 2
const heavy = pair(800, CAP, BASE)
const light = pair(200, CAP, BASE)

const glyph = (part: string, d: string, paint: string, extra: Record<string, string | number> = {}) => ({
  tag: 'path',
  attrs: { 'data-part': part, d, fill: paint, ...extra },
})

const master: Variant = {
  label: 'Master (wght 800)',
  body: [glyph('m-glyph', heavy.m, NEUTRAL), glyph('f-glyph', heavy.f, ACCENT)],
  metrics: { cap: BASE - CAP, base: BASE, stem: heavy.stem },
  // Ink centroid (21.7, 23.0): the M is the heavy half.
  nudge: [1, 0.5],
}

const lightVariant: Variant = {
  label: 'wght 200',
  body: [glyph('m-glyph', light.m, NEUTRAL), glyph('f-glyph', light.f, ACCENT)],
  metrics: { cap: BASE - CAP, base: BASE, stem: light.stem },
  nudge: [1, 0.5],
}

/**
 * Favicon: at wght 800 the M's lower counters close at 16 px. The favicon
 * takes the wght 620 instance (wider counters) at a 28.5-unit cap and
 * emboldens it with a 1.5-unit stroke in the same colour: stems 6.8 units
 * (2.3 px), a little under the 7.5 floor, because any heavier closes the M's
 * lower counters again. No accent.
 */
const FAV_CAP = 28.5
const FAV_WGHT = 620
const FAV_BOLD = 1.5
const fav = pair(FAV_WGHT, FAV_CAP - FAV_BOLD, 24 + (FAV_CAP - FAV_BOLD) / 2)
const bold = { stroke: NEUTRAL, 'stroke-width': FAV_BOLD, 'stroke-linejoin': 'miter', 'stroke-miterlimit': 4 }
const favicon: Variant = {
  label: 'Favicon',
  body: [glyph('m-glyph', fav.m, NEUTRAL, bold), glyph('f-glyph', fav.f, NEUTRAL, bold)],
  metrics: { cap: 24 - FAV_CAP / 2, base: 24 + FAV_CAP / 2, stem: fav.stem + FAV_BOLD },
}

const mMid = interpolator(light.m, heavy.m)(0.5)
const fMid = interpolator(light.f, heavy.f)(0.5)

const morph = (part: string, values: string[], dur: number, ease: 'move' | 'linear', at = 0) => ({
  kind: 'morph' as const,
  part,
  at,
  dur,
  ease,
  attr: 'd' as const,
  values,
})
const fade = (part: string) => ({
  part,
  at: 0,
  dur: 260,
  ease: 'enter' as const,
  frames: [{ opacity: 0 }, { opacity: 1 }],
})

export const ligature: Concept = {
  n: 5,
  slug: 'typeface-ligature',
  name: 'Typeface Ligature',
  idea: "The display face's own M and F, overlapping on one stem, in the site's heaviest weight.",
  parts: ['m-glyph', 'f-glyph'],
  accent: ['f-glyph'],
  variants: { master, favicon, light: lightVariant },
  motion: {
    reveal: {
      label: 'wght 200 → 800',
      full: [
        fade('m-glyph'),
        fade('f-glyph'),
        morph('m-glyph', [light.m, heavy.m], 700, 'move'),
        morph('f-glyph', [light.f, heavy.f], 700, 'move'),
      ],
      calm: [
        fade('m-glyph'),
        fade('f-glyph'),
        morph('m-glyph', [light.m, heavy.m], 700, 'move'),
        morph('f-glyph', [light.f, heavy.f], 700, 'move'),
      ],
    },
    extra: {
      label: 'Split the stem',
      full: [
        {
          part: 'f-glyph',
          at: 0,
          dur: 1000,
          ease: 'move',
          frames: [
            { transform: 'translate(0px, 0px)' },
            { transform: 'translate(4px, 0px)', offset: 0.35 },
            { transform: 'translate(4px, 0px)', offset: 0.6 },
            { transform: 'translate(0px, 0px)' },
          ],
        },
      ],
      calm: null,
    },
    hover: { label: 'Hover', full: shift(['f-glyph'], 1), calm: shift(['f-glyph'], 1) },
    loading: {
      label: 'Loading',
      full: [
        morph('m-glyph', [heavy.m, mMid, heavy.m], 1600, 'linear'),
        morph('f-glyph', [heavy.f, fMid, heavy.f], 1600, 'linear'),
      ],
      calm: [
        {
          part: 'm-glyph',
          at: 0,
          dur: 1600,
          ease: 'linear',
          frames: [{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }],
        },
        {
          part: 'f-glyph',
          at: 0,
          dur: 1600,
          ease: 'linear',
          frames: [{ opacity: 1 }, { opacity: 1, offset: 0.25 }, { opacity: 0.35, offset: 0.6 }, { opacity: 1 }],
        },
      ],
    },
    exit: { label: 'Exit', full: exitFull(['m-glyph', 'f-glyph']), calm: exitCalm(['m-glyph', 'f-glyph']) },
  },
  notes: [
    'Outlines extracted from src/fonts (tools/extract_glyphs.py): wght 800 / opsz 96 and wght 200 / opsz 96, same point structure.',
    'F moved so its stem’s left edge sits on the M’s right stem’s inner edge, per weight; both paths stay separate.',
    'Cap height 27 instead of 30: the face’s M is so wide that a 30-unit cap would fill the 48 box edge to edge.',
    'No ink trap: the opsz 96 outlines have none, and one would only blur at favicon sizes.',
    'Favicon: the wght 620 instance emboldened by a 1.5-unit stroke: stems 6.8 units (under the 7.5 floor) so the M’s counters stay open at 16 px.',
  ],
}
