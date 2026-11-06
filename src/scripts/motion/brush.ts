// Brush player: draws generated (or scanned) illustrations stroke by stroke.
//
// Each stroke = filled outline (visual layer, .bv) masked by its own
// centreline (.bm, pathLength="1"). We animate the mask with DrawSVG, in
// drawing order, with the brush ease. Stroke width is never animated.
import { gsap, stats } from './core';
import type { Tier } from './tier';

export interface StrokeEntry {
  id: string;
  order: number;
  duration: number;
  delay: number;
  ease: string;
  layer: 'line' | 'paint';
}

const parsed = new WeakMap<SVGSVGElement, StrokeEntry[]>();
export function timelineOf(svg: SVGSVGElement): StrokeEntry[] {
  let t = parsed.get(svg);
  if (!t) {
    t = JSON.parse(svg.dataset.timeline || '[]') as StrokeEntry[];
    parsed.set(svg, t);
  }
  return t;
}

function strokeEls(svg: SVGSVGElement, entry: StrokeEntry) {
  const g = svg.querySelector<SVGGElement>(`.bs[data-o="${entry.order}"]`)!;
  const id = g.id;
  const mask = svg.querySelector<SVGPathElement>(`[id="${id}-m"] .bm`)!;
  return { g, mask, vis: g.querySelector<SVGGElement>('.bv')! };
}

/**
 * DrawSVG measures with getTotalLength(); our masks declare pathLength="1",
 * which rescales dash values. Report the declared length so DrawSVG's
 * dash maths happen in the same 0–1 space the browser uses.
 */
function adaptPathLength(p: SVGPathElement) {
  const declared = Number(p.getAttribute('pathLength'));
  if (declared > 0 && !(p as any).__inkLen) {
    (p as any).__inkLen = true;
    p.getTotalLength = () => declared;
  }
}

export interface ArmOptions {
  layer?: 'line' | 'paint' | 'all';
}

/** Hide strokes (mask at 0) so they can be drawn. */
export function arm(svg: SVGSVGElement, opts: ArmOptions = {}) {
  for (const e of select(svg, opts.layer)) {
    const { g, mask } = strokeEls(svg, e);
    adaptPathLength(mask);
    gsap.set(mask, { drawSVG: '0% 0%' });
    gsap.set(g, { visibility: 'hidden' });
  }
  svg.classList.add('is-armed');
}

/** Final state, no animation (Still tier, or after a skip). */
export function reveal(svg: SVGSVGElement) {
  for (const e of timelineOf(svg)) {
    const { g, mask } = strokeEls(svg, e);
    gsap.set(mask, { clearProps: 'strokeDasharray,strokeDashoffset' });
    gsap.set(g, { clearProps: 'visibility' });
  }
  svg.classList.add('is-armed');
}

function select(svg: SVGSVGElement, layer: ArmOptions['layer'] = 'all') {
  const t = timelineOf(svg);
  return layer === 'all' ? t : t.filter((e) => (e.layer || 'line') === layer);
}

export interface DrawOptions {
  layer?: 'line' | 'paint' | 'all';
  /** Fit the whole drawing into this many ms (keeps order and overlap). */
  total?: number;
  /** Override the per-stroke stagger (ms) instead of the authored delays. */
  stagger?: number;
  paused?: boolean;
  /** Settle filter on the last stroke (small elements only). */
  settleLast?: boolean;
  onComplete?: () => void;
}

/** Build a timeline that draws the strokes in authored order. */
export function draw(svg: SVGSVGElement, opts: DrawOptions = {}): gsap.core.Timeline {
  const entries = select(svg, opts.layer);
  arm(svg, { layer: opts.layer });
  const tl = gsap.timeline({ paused: opts.paused, onComplete: opts.onComplete });
  if (!entries.length) return tl;
  // recompute delays for the chosen subset with the same overlap rule
  const authored = (opts.layer ?? 'all') === 'all';
  let t = 0;
  const timed = entries.map((e, i) => {
    let delay: number;
    if (opts.stagger != null) delay = i * opts.stagger;
    else if (authored) delay = e.delay;
    else {
      delay = t;
      t += e.duration * 0.85;
    }
    return { ...e, delay };
  });
  const natural = Math.max(...timed.map((e) => e.delay + e.duration));
  const k = opts.total ? opts.total / natural : 1;
  timed.forEach((e, i) => {
    const { g, mask, vis } = strokeEls(svg, e);
    const last = i === timed.length - 1;
    tl.to(
      mask,
      {
        drawSVG: '0% 100%',
        duration: (e.duration * k) / 1000,
        ease: e.ease || 'brush',
        onStart: () => {
          gsap.set(g, { visibility: 'visible' });
          stats.activeMasks++;
          stats.maxActiveMasks = Math.max(stats.maxActiveMasks, stats.activeMasks);
        },
        onComplete: () => {
          stats.activeMasks = Math.max(0, stats.activeMasks - 1);
          if (last && opts.settleLast) settle(vis);
        },
        onInterrupt: () => {
          stats.activeMasks = Math.max(0, stats.activeMasks - 1);
        },
        // scrubbed back to the start: hide the round-cap dot again
        onReverseComplete: () => {
          gsap.set(g, { visibility: 'hidden' });
        },
      },
      (e.delay * k) / 1000,
    );
  });
  return tl;
}

/** Calm tier: the whole illustration fades in (200 ms). */
export function fade(svg: SVGSVGElement, delay = 0) {
  reveal(svg);
  return gsap.fromTo(svg, { opacity: 0 }, { opacity: 1, duration: 0.2, delay, ease: 'ui' });
}

/** Play an illustration according to the tier. */
export function play(svg: SVGSVGElement, tier: Tier, opts: DrawOptions = {}) {
  if (tier === 'still') {
    reveal(svg);
    return null;
  }
  if (tier === 'calm') return fade(svg);
  return draw(svg, opts);
}

// ── settle: one-shot feTurbulence + feDisplacementMap, 3 → 0 in 400 ms ──
let activeSettle: { el: Element; tween: gsap.core.Tween } | null = null;

function clearSettle() {
  if (!activeSettle) return;
  const { el, tween } = activeSettle;
  activeSettle = null;
  tween.kill();
  el.removeAttribute('filter');
  (el as HTMLElement).style?.removeProperty('filter');
  stats.activeFilters = 0;
}

export function settle(el: Element | null) {
  if (!el || document.documentElement.dataset.motion !== 'full') return;
  const fe = document.querySelector<SVGFEDisplacementMapElement>('#ink-settle feDisplacementMap');
  if (!fe) return;
  clearSettle(); // at most one active filter at a time
  if (el instanceof SVGElement) el.setAttribute('filter', 'url(#ink-settle)');
  else (el as HTMLElement).style.filter = 'url(#ink-settle)';
  stats.activeFilters = 1;
  stats.maxActiveFilters = Math.max(stats.maxActiveFilters, 1);
  const proxy = { s: 3 };
  fe.setAttribute('scale', '3');
  const tween = gsap.to(proxy, {
    s: 0,
    duration: 0.4,
    ease: 'lift',
    onUpdate: () => fe.setAttribute('scale', proxy.s.toFixed(2)),
    onComplete: clearSettle,
    onInterrupt: clearSettle,
  });
  activeSettle = { el, tween };
}

export function killSettle() {
  clearSettle();
}
