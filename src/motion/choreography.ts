import { type DurationStep, type MotionTier, durFor, motionScale, reducedCrossfade } from './tokens'

/*
 * The reveal choreography's timing helpers and the few values the spec fixes
 * that src/motion/tokens.ts (Foundation, read-only in Wave 1) does not carry
 * yet. Everything else reads the tokens directly. Contract change request:
 * move `pending` into tokens.ts (docs/handoff/motion.md).
 *
 * Tier rules, applied here once so every caller gets them:
 *   full     as given
 *   calm     every duration, offset and stagger × motionScale.calm (0.6)
 *   reduced  durations become one reducedCrossfade (160 ms); offsets and
 *            staggers × motionScale.reduced (0), so everything crossfades at once
 */

/** Values the spec fixes that have no token yet (seconds unless noted). */
export const pending = {
  /** After a play or switch, the page starts revealing once this fraction of the card zoom has run. */
  zoomLanded: 0.6,
  /** Home first visit: when each part starts, from the start of the sequence. */
  firstLoad: { title: 0.52, role: 0.9, intro: 1.0, rest: 1.3 },
  /** Digits: one value's strips, from the first start to the last end. */
  digitsTotal: 0.7,
  /** Cells a digit strip rolls through before it lands (blank first). */
  digitRoll: 5,
  /** SVG strokes: full, and calm's own value (not × 0.6). */
  draw: 1.2,
  drawCalm: 0.5,
  /** Lines and title words rise from 110% of their own height below the mask. */
  maskTravel: 1.1,
  /** Image: clip inset at the start (fraction of the box), inner image start scale. */
  imageInset: 0.1,
  imageScale: 1.12,
  /** Below 1024 px: reveal jobs that may run at once (the rest queue). */
  mobileJobs: 8,
  /** Pinned deal: stage height (svh) and the progress where each phase ends. */
  dealStage: 250,
  dealPhases: [0.2, 0.4, 0.6, 0.8, 1],
  /** Pinned deal: a dealt card lands with this fraction of its hand-fan angle, removed in the settle phase. */
  dealLandTilt: 0.25,
  /** About timeline (view progress): where group drawing starts and ends. */
  timelineRange: { start: 'entry 100%', end: 'cover 60%' },
} as const

/** A scale step for a tier, in ms (full; calm × 0.6; reduced 160). */
export const msFor = (tier: MotionTier, step: DurationStep) => durFor(tier, step) * 1000

/** Any other duration (s) for a tier, in ms: full as given, calm × 0.6, reduced 160. */
export const spanFor = (tier: MotionTier, seconds: number) =>
  (tier === 'reduced' ? reducedCrossfade : seconds * motionScale[tier]) * 1000

/** An offset or stagger (s) for a tier, in ms: full as given, calm × 0.6, reduced 0. */
export const gapFor = (tier: MotionTier, seconds: number) => seconds * motionScale[tier] * 1000

/** SVG stroke duration for a tier, in ms. */
export const drawFor = (tier: MotionTier) =>
  (tier === 'reduced' ? reducedCrossfade : tier === 'calm' ? pending.drawCalm : pending.draw) * 1000

export const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`
