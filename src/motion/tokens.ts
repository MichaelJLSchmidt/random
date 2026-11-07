/*
 * Motion tokens: the only source of easings, springs, durations, staggers,
 * distances, angles, weights and background-field parameters. JavaScript
 * imports them directly; CSS reads the custom properties that `motionCss()`
 * generates (injected in the root layout). No bounce or elastic easing.
 */

export type MotionTier = 'full' | 'calm' | 'reduced'

/** Cubic béziers. */
export const ease = {
  outSoft: [0.22, 1, 0.36, 1],
  draw: [0.16, 1, 0.3, 1],
  zoom: [0.76, 0, 0.24, 1],
  return: [0.32, 0.72, 0, 1],
  bloom: [0.65, 0, 0.35, 1],
  settle: [0.33, 0, 0.15, 1],
  /** Content leaving the screen (not in the spec's list: a plain ease-in). */
  in: [0.4, 0, 1, 1],
} as const

/** Springs (Motion options). CSS gets them as linear() curves, see springCss(). */
export const spring = {
  play: { type: 'spring', stiffness: 220, damping: 28, mass: 0.9 },
  hover: { type: 'spring', stiffness: 400, damping: 32, mass: 1 },
  land: { type: 'spring', stiffness: 300, damping: 26, mass: 1 },
} as const

/** Seconds. */
export const duration = {
  // Play / return / switch
  press: 0.09,
  lift: 0.34,
  gap: 0.28,
  zoom: 0.58,
  return: 0.52,
  switchIn: 0.56,
  switchDelay: 0.04,
  switchLift: 0.31,
  exitPlay: 0.22,
  exitReturn: 0.2,
  exitSwitch: 0.2,
  // Background field
  bloom: 0.8,
  unbloom: 0.8,
  toInk: 1,
  crossfade: 0.8,
  hoverIn: 0.7,
  hoverOut: 1.1,
  hoverIntent: 0.08,
  breath: 9,
  fieldIn: 1.2,
  topo: 1.6,
  topoBand: 40,
  calmBloom: 0.5,
  reducedSwap: 0.2,
  // Reveals
  draw: 0.62,
  words: 0.7,
  settle: 1.6,
  repeatTitle: 0.6,
  returnTitle: 0.5,
  h2: 1.1,
  line: 0.7,
  list: 0.52,
  image: 0.9,
  imageScale: 1.2,
  metric: 0.42,
  tags: 0.4,
  callout: 0.3,
  divider: 0.8,
  buttons: 0.4,
  calmReveal: 0.3,
  reducedReveal: 0.2,
  // UI
  fill: 0.45,
  underline: 0.16,
  emailUnderline: 0.6,
  rail: 0.2,
  sheet: 0.32,
  discard: 0.7,
  glint: 1.2,
  longPress: 0.8,
  inspectHold: 0.4,
  fast: 0.18,
} as const

/** Seconds between siblings. */
export const stagger = {
  draw: 0.11,
  words: 0.07,
  introLines: 0.08,
  lines: 0.06,
  list: 0.07,
  metric: 0.04,
  tags: 0.04,
  rows: 0.05,
} as const

/** Seconds from the start of a sequence. */
export const at = {
  // Home, first visit
  draw: 0.2,
  title: 0.95,
  lines: 1.5,
  chrome: 1.9,
  // Case study / Management after the H1
  facts: 0.1,
  summary: 0.25,
  // Metric label after its digits; buttons after their parent
  label: 0.15,
  buttons: 0.4,
  // Play: when the route change starts (press + lift)
  navigate: 0.43,
  switchNavigate: 0.4,
} as const

/** Pixels unless noted. */
export const distance = {
  exitPlay: 24,
  exitReturn: 20,
  exitSwitch: 24,
  reveal: 4,
  paragraph: 16,
  list: 12,
  hoverLift: 28,
  spread: 12,
  landY: 10,
} as const

/** Degrees. */
export const angle = {
  hand: [-9, -3, 3, 9],
  handTilt: 8,
  word: -35,
  metric: -90,
  discard: -12,
  tap: 90,
} as const

/** Font weights and optical sizes (Bricolage display, Hanken text). */
export const weight = {
  body: 400,
  medium: 500,
  label: 600,
  card: 620,
  h1Start: 280,
  h1: 680,
  h2Start: 360,
  h2: 700,
} as const

export const opsz = { start: 24, end: 96 } as const

/** Background field. */
export const field = {
  breathScale: 0.06,
  breathLum: 0.04,
  drift: 0.012,
  intensityRest: 0.35,
  intensityHover: 0.55,
  intensityPage: 0.45,
  breaker: 0.1,
  grain: 0.02,
  renderScale: 0.5,
  fps: 30,
  maxFrameMs: 24,
  frameWindow: 60,
  switchDip: 0.06,
  topoLine: 0.22,
  topoIndex: 0.38,
} as const

/** Reveal trigger (Motion inView). */
export const reveal = { amount: 0.25, margin: '0px 0px -10% 0px' } as const

/** Hand geometry. */
export const hand = {
  card: { w: 132, h: 184 },
  cardSm: { w: 84, h: 118 },
  overlap: 28,
  visibleHome: 0.72,
  visiblePage: 0.45,
  visibleHomeSm: 0.7,
  perspective: 1200,
  deckGap: 24,
  rail: 48,
  sheet: 0.4,
  scrim: 0.4,
  railHideAfter: 120,
  liftScale: 1.5,
  pressScale: 0.97,
  hoverScale: 1.06,
  inspectScale: 2,
  breakpoint: 1024,
} as const

/*
 * Tiers. full (default), calm (site toggle), reduced (prefers-reduced-motion,
 * overrides calm). `vt` scales view-transition timings (reduced: near-instant),
 * `ui` scales hover/fill/underline timings, `travel` scales distances.
 */
export const tiers = {
  full: { vt: 1, ui: 1, travel: 1 },
  calm: { vt: 1, ui: 0.7, travel: 0 },
  reduced: { vt: 0.1, ui: 0, travel: 0 },
} as const satisfies Record<MotionTier, unknown>

type Bezier = readonly number[]
const ms = (s: number) => `${Math.round(s * 1000)}ms`
const bezier = (b: Bezier) => `cubic-bezier(${b.join(',')})`
const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/**
 * A spring as a CSS easing: simulate x'' = (-k(x-1) - c·v)/m from rest until it
 * settles and sample it into linear(). Returns the curve and its duration.
 */
export function springCss({ stiffness, damping, mass }: { stiffness: number; damping: number; mass: number }) {
  const dt = 1 / 600
  let x = 0
  let v = 0
  let t = 0
  const trace: number[] = [0]
  while (t < 3) {
    const a = (-stiffness * (x - 1) - damping * v) / mass
    v += a * dt
    x += v * dt
    t += dt
    trace.push(x)
    if (Math.abs(x - 1) < 0.0005 && Math.abs(v) < 0.005) break
  }
  const points = 40
  const values = Array.from({ length: points + 1 }, (_, i) => {
    const value = trace[Math.round((i / points) * (trace.length - 1))]
    return Number(value.toFixed(4))
  })
  values[points] = 1
  return { easing: `linear(${values.join(',')})`, duration: t }
}

const springs = Object.fromEntries(Object.entries(spring).map(([k, s]) => [k, springCss(s)])) as Record<
  keyof typeof spring,
  { easing: string; duration: number }
>

const VT_KEYS = ['zoom', 'return', 'switchIn', 'switchDelay', 'exitPlay', 'exitReturn', 'exitSwitch'] as const

function vars(tier: MotionTier): string {
  const { vt, ui, travel } = tiers[tier]
  const out: string[] = []
  for (const [k, v] of Object.entries(duration)) {
    const scale = (VT_KEYS as readonly string[]).includes(k) ? vt : ui
    out.push(`--dur-${kebab(k)}:${ms(v * scale)}`)
  }
  for (const [k, s] of Object.entries(springs)) out.push(`--spring-${k}-dur:${ms(s.duration * ui)}`)
  for (const [k, v] of Object.entries(distance)) out.push(`--travel-${kebab(k)}:${v * travel}px`)
  return out.join(';')
}

/** CSS custom properties for every tier. */
export function motionCss(): string {
  const constants = [
    ...Object.entries(ease).map(([k, v]) => `--ease-${kebab(k)}:${bezier(v)}`),
    ...Object.entries(springs).map(([k, s]) => `--spring-${k}:${s.easing}`),
    ...Object.entries(weight).map(([k, v]) => `--wght-${kebab(k)}:${v}`),
    `--opsz-start:${opsz.start}`,
    `--opsz-end:${opsz.end}`,
    ...Object.entries(stagger).map(([k, v]) => `--stagger-${kebab(k)}:${ms(v)}`),
  ]
  return [
    `:root{${constants.join(';')};${vars('full')}}`,
    `:root[data-motion="calm"]{${vars('calm')}}`,
    `:root[data-motion="reduced"]{${vars('reduced')}}`,
    // No-JS fallback: the pre-paint script normally sets data-motion="reduced".
    `@media (prefers-reduced-motion:reduce){:root{${vars('reduced')}}}`,
  ].join('')
}
