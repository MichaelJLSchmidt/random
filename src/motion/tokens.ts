import { breakpoints } from '@/design/layout'
import { type as typeScale } from '@/design/type'

/*
 * Motion tokens: the only source of easings, springs, durations, staggers,
 * distances, angles, weights and background-field parameters. JavaScript
 * imports them directly; CSS reads the custom properties that `motionCss()`
 * generates (injected in the root layout). No bounce, elastic or overshoot:
 * every bézier stays within [0, 1] and every spring is critically damped.
 * Contract: docs/contracts.md#motion-tokens. Foundation-owned; the reveal,
 * deal, timeline and discard values below were moved in from the Motion
 * session's choreography at integration.
 *
 * The scale (use these for new work):
 *   dur      xs 160, s 240, m 420, l 640, xl 900 ms        --dur-xs ... --dur-xl
 *   ease     outExpo, outQuint, inOut                       --ease-out-expo, --ease-out-quint, --ease-in-out
 *   stagger  words 70, lines 60, items 50, cards 80, svgGroups 120 ms
 *                                                           --stagger-words ... --stagger-svg-groups
 *   tiers    full x1, calm x0.6, reduced: 160 ms crossfades only
 *                                                           --motion-scale, --dur-reduced
 * Everything below the scale (duration.*, ease.outSoft, ...) is the table's
 * vocabulary (hand, play, field, eggs) plus the reveal choreography's fixed
 * values (reveal, deal, timeline, discard). Nothing here is unreferenced.
 */

export type MotionTier = 'full' | 'calm' | 'reduced'

/** The duration scale, in seconds (CSS: --dur-xs ... --dur-xl, tier-scaled). */
export const dur = { xs: 0.16, s: 0.24, m: 0.42, l: 0.64, xl: 0.9 } as const
export type DurationStep = keyof typeof dur

/** Tier multipliers for the scale. Reduced replaces every duration with one 160 ms crossfade. */
export const motionScale = { full: 1, calm: 0.6, reduced: 0 } as const satisfies Record<MotionTier, number>
export const reducedCrossfade = 0.16

/** A scale duration (s) for a tier: full as is, calm x0.6, reduced always 160 ms. */
export function durFor(tier: MotionTier, step: DurationStep) {
  return tier === 'reduced' ? reducedCrossfade : dur[step] * motionScale[tier]
}

const outExpo = [0.16, 1, 0.3, 1] as const
const outQuint = [0.22, 1, 0.36, 1] as const
const inOut = [0.65, 0, 0.35, 1] as const

/** Cubic béziers. The first three are the scale; the rest are the table's named curves. */
export const ease = {
  outExpo,
  outQuint,
  inOut,
  // Table vocabulary (aliases of the scale where they are the same curve).
  outSoft: outQuint,
  draw: outExpo,
  bloom: inOut,
  zoom: [0.76, 0, 0.24, 1],
  return: [0.32, 0.72, 0, 1],
  /** Content leaving the screen: a plain ease-in. */
  in: [0.4, 0, 1, 1],
} as const

/**
 * Springs (Motion options), critically damped (damping >= 2·sqrt(stiffness·mass)),
 * so they never overshoot. CSS gets them as linear() curves, see springCss().
 */
export const spring = {
  play: { type: 'spring', stiffness: 220, damping: 29, mass: 0.9 },
  hover: { type: 'spring', stiffness: 400, damping: 40, mass: 1 },
  land: { type: 'spring', stiffness: 300, damping: 35, mass: 1 },
} as const

/** Seconds. */
export const duration = {
  // Play / return / switch
  press: 0.09,
  gap: 0.28,
  zoom: 0.58,
  return: 0.52,
  switchIn: 0.56,
  switchDelay: 0.04,
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
  // Reveals (the rest use the scale, dur.*)
  /** Digits: one value's strips, from the first strip's start to the last strip's end. */
  digits: 0.7,
  /** SVG strokes (draw kind): full, and calm's own value (not × 0.6). */
  svgDraw: 1.2,
  svgDrawCalm: 0.5,
  /** New hand: each card flies off to the dealer. */
  gather: 0.44,
  /** Play: a lift whose route never changed (offline, error) settles back after this. */
  liftTimeout: 4,
  // UI
  underline: 0.16,
  rail: 0.2,
  sheet: 0.32,
  discard: 0.7,
  glint: 1.2,
  longPress: 0.8,
  inspectHold: 0.4,
  fast: 0.18,
} as const

/** Seconds between siblings. words / lines / items / cards / svgGroups are the scale. */
export const stagger = {
  words: 0.07,
  lines: 0.06,
  items: 0.05,
  cards: 0.08,
  svgGroups: 0.12,
  /** New hand: between cards flying off to the dealer. */
  gather: 0.06,
  /** Digits: between the strips of one Scoreboard value. */
  digits: 0.04,
} as const

/** Seconds from the start of a sequence. */
export const at = {
  /** Home, first visit (<FirstLoadSequence>): when each part starts (the hand is dealt at 0). */
  firstLoad: { title: 0.52, role: 0.9, intro: 1.0, rest: 1.3 },
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
  /** block reveal: rise. */
  block: 12,
  /** list reveal: items dealt in from the left. */
  list: 12,
  hoverLift: 28,
  spread: 12,
  landY: 10,
} as const

/** Degrees. */
export const angle = {
  hand: [-9, -3, 3, 9],
  /** Home title words turn up from this angle (rotateX). */
  word: -35,
  /** Play: a lifted card tips back this far (rotateX). */
  lift: -8,
  /** 404: the discarded card's resting tilt (--angle-discard). */
  discard: -12,
  tap: 90,
} as const

/**
 * Font weights and optical sizes (Bricolage display, Hanken text). Animated
 * headlines settle on the type scale (src/design/type.ts): h1 on display, h2 on h2.
 */
export const weight = {
  body: 400,
  label: 600,
  card: 620,
  h1Start: 280,
  h1: typeScale.display.weight,
  h2Start: 360,
  h2: typeScale.h2.weight,
  h3: typeScale.h3.weight,
} as const

export const opsz = {
  start: 24,
  end: typeScale.display.opsz,
  h2: typeScale.h2.opsz,
  h3: typeScale.h3.opsz,
} as const

/** Background field. */
export const field = {
  breathScale: 0.06,
  breathLum: 0.04,
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
  /** Resolution factor while a pinned scene holds the viewport (half of renderScale). */
  pinnedDetail: 0.5,
} as const

/** Reveals: trigger (Motion inView) and the kinds' fixed geometry. */
export const reveal = {
  amount: 0.25,
  margin: '0px 0px -10% 0px',
  /** lines and title words rise from this share of their own height below the mask (110%). */
  mask: 1.1,
  /** image: clip inset at the start (share of the box) and the inner image's start scale. */
  image: { inset: 0.1, scale: 1.12 },
  /** digits: cells a strip rolls through before it lands (blank first). */
  digitRoll: 5,
  /** After a play or switch the page starts revealing once this share of the card zoom has run. */
  zoomLanded: 0.6,
  /** Below 1024 px: reveal jobs that may run at once (the rest queue). */
  mobileJobs: 8,
  /** Case hero image drift (full tier, CSS --hero-drift): translateY of its own height while it exits. */
  heroDrift: 0.06,
} as const

/** The deal: the pinned decisions scene (stage, phases, tilt) and dealing hand cards from off screen. */
export const deal = {
  /** Pinned stage height (svh). */
  stage: 250,
  /** Scroll progress where each phase ends: four cards, then the settle. */
  phases: [0.2, 0.4, 0.6, 0.8, 1],
  /** A dealt card lands with this share of its hand-fan angle (removed in the settle). */
  landTilt: 0.25,
  /** Card flip perspective (px; every card that turns over, incl. the workshop draw), toss angle (deg)
   *  and how far below the screen the dealer sits (card heights). */
  flipPerspective: 800,
  toss: 28,
  below: 0.6,
} as const

/** About timeline (full tier): strokes linked to the drawing's view progress. */
export const timeline = {
  start: 'entry 100%',
  end: 'cover 60%',
  /** Each group draws over this share of the range. */
  groupSpan: 0.5,
} as const

/** 404 discard: drop height (× distance.exitPlay) and the share of the fall in which the card fades in. */
export const discard = { drop: 5, fade: 0.4 } as const

/** Hand geometry. */
export const hand = {
  card: { w: 176, h: 246 },
  cardSm: { w: 100, h: 140 },
  /** Hover / focus lifts a card until this much of it shows (pages show 45%). */
  reveal: 0.9,
  overlap: 28,
  visibleHome: 0.72,
  visiblePage: 0.45,
  visibleHomeSm: 0.7,
  /** Played card (detail hero) width: clamp(min, vw, max), shrunk to fit the height. */
  hero: { min: 280, vw: 0.28, max: 400, phoneVw: 0.72, phoneMax: 320 },
  perspective: 1200,
  rail: 48,
  sheet: 0.4,
  scrim: 0.4,
  railHideAfter: 120,
  liftScale: 1.5,
  pressScale: 0.97,
  hoverScale: 1.06,
  inspectScale: 2,
  breakpoint: breakpoints.md,
} as const

/*
 * Tiers. full (default), calm (site toggle), reduced (prefers-reduced-motion,
 * overrides calm). For the table vocabulary: `vt` scales view-transition
 * timings (reduced: near-instant), `ui` scales hover/fill/underline timings,
 * `travel` scales distances. The scale (dur) uses motionScale instead.
 */
export const tiers = {
  full: { vt: 1, ui: 1, travel: 1 },
  calm: { vt: 1, ui: motionScale.calm, travel: 0 },
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
    // Critically damped springs never pass 1; clamp the integration error too.
    return Number(Math.min(1, value).toFixed(4))
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
  // The scale: --dur-xs ... --dur-xl.
  for (const k of Object.keys(dur) as DurationStep[]) out.push(`--dur-${k}:${ms(durFor(tier, k))}`)
  out.push(`--motion-scale:${motionScale[tier]}`)
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
    `--dur-reduced:${ms(reducedCrossfade)}`,
    `--angle-discard:${angle.discard}deg`,
    `--angle-tap:${angle.tap}deg`,
    `--hero-drift:${reveal.heroDrift * 100}%`,
  ]
  return [
    `:root{${constants.join(';')};${vars('full')}}`,
    `:root[data-motion="calm"]{${vars('calm')}}`,
    `:root[data-motion="reduced"]{${vars('reduced')}}`,
    // No-JS fallback: the pre-paint script normally sets data-motion="reduced".
    `@media (prefers-reduced-motion:reduce){:root{${vars('reduced')}}}`,
  ].join('')
}
