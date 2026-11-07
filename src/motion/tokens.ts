/*
 * Motion tokens: the only source of durations, easings, springs, staggers,
 * distances and angles. JavaScript imports these directly; CSS reads the
 * custom properties that `motionCss()` generates (injected in the root layout).
 * Nothing else in the codebase may hard-code motion values.
 */

export type MotionTier = 'full' | 'calm' | 'reduced'

/** Seconds. */
export const duration = {
  instant: 0.1,
  fast: 0.18,
  base: 0.28,
  slow: 0.42,
  slower: 0.64,
  /** Idle foil drift, one loop. */
  ambient: 16,
  /** Page h1 weight-in on a return visit or after client navigation. */
  weightIn: 0.5,
  /** First-visit intro: h1 weight-in (plus word stagger). */
  introTitle: 0.7,
  /** First-visit intro: the deck's riffle cut. */
  riffle: 0.26,
  /** First-visit intro: one card travelling from the deck to its slot (flip included). */
  deal: 0.42,
  /** The Glint: one sweep, never loops. */
  glint: 0.7,
} as const

/** Cubic béziers. */
export const ease = {
  standard: [0.2, 0, 0, 1],
  out: [0.16, 1, 0.3, 1],
  in: [0.5, 0, 0.75, 0],
  inOut: [0.65, 0, 0.35, 1],
} as const

/** Motion springs. `pointer` is for useSpring (no `type`). */
export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 40, mass: 0.9 },
  gentle: { type: 'spring', stiffness: 220, damping: 28, mass: 1 },
  flip: { type: 'spring', stiffness: 240, damping: 24, mass: 1 },
  pointer: { stiffness: 300, damping: 30, mass: 0.6 },
} as const

/** Seconds between siblings. */
export const stagger = {
  text: 0.035,
  cards: 0.07,
  /** Word stagger of the first-visit h1 weight-in. */
  words: 0.045,
  /** Lines of a section title rising from their mask. */
  lines: 0.06,
  /** Cards dealt into the hand. */
  deal: 0.08,
} as const

/*
 * Scroll. Sections reveal once when 35% of them (or 35% of the viewport, for
 * tall ones) is in view; the statement fills between these scroll offsets.
 */
export const scroll = {
  revealAt: 0.35,
  statementOffset: ['start 0.85', 'end 0.45'] as ['start 0.85', 'end 0.45'],
  /** Smoothing of each statement word towards its scroll-linked weight. */
  statementCatchUp: 0.16,
} as const

/**
 * First-visit intro budget (seconds). riffle + 2 × deal stagger + deal + glint
 * = 0.26 + 0.16 + 0.42 + 0.7 = 1.54, under the 1.6 s limit.
 */
export const introBudget = 1.6

/** Pixels of travel. */
export const distance = {
  nudge: 4,
  rise: 16,
  slide: 32,
  lift: 14,
  /** Section reveal travel on narrow and wide screens. */
  revealSm: 24,
  revealLg: 40,
} as const

/*
 * Font weights (Mona Sans, wght 200–900). Kept here because several of them are
 * animation endpoints; motionCss() also emits them as --wght-<name>.
 * Every element whose weight animates reserves the box of its final weight.
 */
export const weight = {
  thin: 200,
  body: 400,
  medium: 520,
  strong: 600,
  card: 640,
  h2: 680,
  h1: 760,
  /** Case-study statement, filled from thin to this as it crosses the viewport. */
  statement: 760,
} as const

/** Degrees. */
export const angle = {
  tilt: 7,
} as const

/*
 * Tiers. `full` is the default, `calm` is a user toggle (localStorage, applied
 * before first paint), `reduced` follows prefers-reduced-motion and overrides calm.
 *   time:   multiplier for durations and staggers
 *   travel: multiplier for distances and angles (0 = opacity only)
 */
export const tiers = {
  full: { time: 1, travel: 1, tilt: true, ambient: true, textReveal: 'words' },
  calm: { time: 0.7, travel: 0, tilt: false, ambient: false, textReveal: 'fade' },
  reduced: { time: 0, travel: 0, tilt: false, ambient: false, textReveal: 'none' },
} as const satisfies Record<MotionTier, unknown>

type DurationKey = keyof typeof duration
type EaseKey = keyof typeof ease

/** A tween for Motion, scaled for the tier. */
export function tween(tier: MotionTier, d: DurationKey = 'base', e: EaseKey = 'standard', delay = 0) {
  const t = tiers[tier].time
  return { duration: duration[d] * t, ease: ease[e], delay: delay * t }
}

/** Distance in px for the tier. */
export function travel(tier: MotionTier, d: keyof typeof distance) {
  return distance[d] * tiers[tier].travel
}

const ms = (s: number) => `${Math.round(s * 1000)}ms`
const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`

function vars(tier: MotionTier): string {
  const { time, travel: tr, ambient } = tiers[tier]
  const out: string[] = []
  for (const [k, v] of Object.entries(duration)) {
    if (k !== 'ambient') out.push(`--dur-${kebab(k)}:${ms(v * time)}`)
  }
  out.push(`--dur-ambient:${ms(duration.ambient)}`, `--ambient:${ambient ? 'running' : 'paused'}`)
  for (const [k, v] of Object.entries(stagger)) out.push(`--stagger-${kebab(k)}:${ms(v * time)}`)
  for (const [k, v] of Object.entries(distance)) out.push(`--travel-${kebab(k)}:${v * tr}px`)
  out.push(`--angle-tilt:${angle.tilt * tr}deg`)
  out.push(`--statement-catch-up:${ms(scroll.statementCatchUp * time)}`)
  return out.join(';')
}

/** CSS custom properties for every tier. */
export function motionCss(): string {
  const easings = Object.entries(ease)
    .map(([k, v]) => `--ease-${kebab(k)}:${bezier(v)}`)
    .join(';')
  const weights = Object.entries(weight)
    .map(([k, v]) => `--wght-${k}:${v}`)
    .join(';')
  return [
    `:root{${easings};${weights};${vars('full')}}`,
    `:root[data-motion="calm"]{${vars('calm')}}`,
    `:root[data-motion="reduced"]{${vars('reduced')}}`,
    // No-JS fallback: the pre-paint script normally sets data-motion="reduced".
    `@media (prefers-reduced-motion:reduce){:root{${vars('reduced')}}}`,
  ].join('')
}
