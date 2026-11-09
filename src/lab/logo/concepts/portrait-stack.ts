import { type Pt, clipBand, clipPath, g, path, pathOf, stroke, strokeOutline, valleyFor } from '../geometry'
import { ACCENT, type Concept, NEUTRAL, type Seq, type SvgNode, type Variant, idOf, urlOf } from '../model'
import { calmWeigh, chase, draw, exitCalm, exitFull, shift, wave } from '../motion-kit'

/*
 * 2 · Portrait Stack. The mark fills the hand's card ratio (132:184,
 * 33 × 46 units, centred): one tall shared stem; the F in the top 40 % (top
 * arm right, short middle arm), the M in the bottom 55 % with its own left
 * stem, its valley at 70 % of its height, and the lower part of the shared
 * stem as its right stem. Stroke 5.
 */
const PARTS = ['m-branch', 'f-top', 'f-mid', 'stem']

type Spec = {
  sw: number
  diag: number
  box: [x0: number, y0: number, x1: number, y1: number]
  stemX: number
  leftX: number
  fTop: number
  fMid: number
  fTopEnd: number
  fMidEnd: number
  mTop: number
  /** Valley tip as a share of the M's height. */
  valley: number
  midPaint: string
}

function build(s: Spec, label: string): Variant {
  const [, y0, , y1] = s.box
  const h = s.sw / 2
  const mH = y1 - s.mTop
  const apexL: Pt = [s.leftX, s.mTop + h]
  const apexR: Pt = [s.stemX, s.mTop + h]
  const tip = s.mTop + s.valley * mH + 0.5
  const v = valleyFor(apexL, apexR, (s.leftX + s.stemX) / 2, tip, s.diag / 2)
  // From inside the shared stem, so the M branches out of it: up to its apex,
  // down to the valley, up to the left apex, down the left stem.
  const pts: Pt[] = [[s.stemX, s.mTop + h + 6], apexR, v, apexL, [s.leftX, y1]]
  const outline = clipBand(strokeOutline(pts, [h, s.diag / 2, s.diag / 2, h]), s.mTop, y1)
  const defs: SvgNode[] = [clipPath(idOf('m-outline'), path({ d: pathOf(outline, true) }))]
  return {
    label,
    defs,
    body: [
      g({ 'clip-path': urlOf('m-outline') }, stroke('m-branch', pathOf(pts), NEUTRAL, s.sw)),
      stroke('f-top', `M${s.stemX} ${s.fTop}H${s.fTopEnd}`, NEUTRAL, s.sw),
      stroke('f-mid', `M${s.stemX} ${s.fMid}H${s.fMidEnd}`, s.midPaint, s.sw),
      // Drawn upward: from the baseline to the top.
      stroke('stem', `M${s.stemX} ${y1}V${y0}`, NEUTRAL, s.sw),
    ],
    metrics: { cap: s.mTop, base: y1, stem: s.sw },
  }
}

/** Master: box x 7.5–40.5, y 1–47 (33 × 46); stem at x 25.5; F zone y 1–19.4, M zone y 21.7–47. */
const masterBase = build(
  {
    sw: 5,
    diag: 4.5,
    box: [7.5, 1, 40.5, 47],
    stemX: 25.5,
    leftX: 10,
    fTop: 3.5,
    fMid: 11.5,
    fTopEnd: 40.5,
    fMidEnd: 36.5,
    mTop: 47 - 0.55 * 46,
    valley: 0.7,
    midPaint: ACCENT,
  },
  'Master',
)
// Ink centroid (22.3, 24.3): the M side is heavier.
const master: Variant = { ...masterBase, nudge: [1, 0] }

/**
 * Favicon (16 px grid, 3 units per pixel): 12 × 16 px, stems 3 px, F arms
 * 3 px and 2 px. The M gets a 4 px counter and a shallower valley (50 %) so
 * its V stays open; the box runs the full height of the icon.
 */
const favicon = build(
  {
    sw: 9,
    diag: 4.5,
    box: [6, 0, 42, 48],
    stemX: 31.5,
    leftX: 10.5,
    fTop: 4.5,
    fMid: 16.5,
    fTopEnd: 42,
    fMidEnd: 39,
    mTop: 24,
    valley: 0.5,
    midPaint: NEUTRAL,
  },
  'Favicon',
)

/** The flip: the whole mark turns about its vertical axis and lands in the next identity's colour. */
const flip: Seq = [
  {
    part: ':root',
    at: 0,
    dur: 500,
    ease: 'linear',
    frames: [
      { transform: 'perspective(800px) rotateY(0deg)', easing: 'cubic-bezier(0.3, 0, 0.8, 0.15)' },
      { transform: 'perspective(800px) rotateY(90deg)', offset: 0.5 },
      { transform: 'perspective(800px) rotateY(-90deg)', offset: 0.5, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
      { transform: 'perspective(800px) rotateY(0deg)' },
    ],
  },
  { kind: 'cue', at: 250, cue: 'next-identity' },
]

const flick = (part: string, at: number): Seq => [
  {
    part,
    at,
    dur: 260,
    ease: 'enter',
    origin: '25.5px 0px',
    frames: [{ transform: 'scale(0, 1)' }, { transform: 'scale(1, 1)' }],
  },
]

export const portraitStack: Concept = {
  n: 2,
  slug: 'portrait-stack',
  name: 'Portrait Stack',
  idea: 'One tall stem in the card ratio: the F flies at the top, the M stands at the bottom.',
  parts: PARTS,
  accent: ['f-mid'],
  variants: { master, favicon },
  motion: {
    reveal: {
      label: 'Stem, then branches',
      full: [draw('stem', 0, 500), draw('m-branch', 500, 420), ...flick('f-top', 580), ...flick('f-mid', 660)],
      calm: calmWeigh(
        [
          { part: 'stem', from: 2, to: 5 },
          { part: 'm-branch', from: 2, to: 5 },
          { part: 'f-top', from: 2, to: 5 },
          { part: 'f-mid', from: 2, to: 5 },
        ],
        80,
      ),
    },
    extra: { label: 'Card flip', full: flip, calm: null },
    hover: { label: 'Hover', full: shift(['f-mid'], 1), calm: shift(['f-mid'], 1) },
    loading: { label: 'Loading', full: [chase('stem'), chase('m-branch')], calm: wave(PARTS) },
    exit: { label: 'Exit', full: exitFull(PARTS), calm: exitCalm(PARTS) },
  },
  notes: [
    'Ink box 33 × 46 units (132:184), centred; F zone = top 40 % (y 1–19.4), M zone = bottom 55 % (y 21.7–47).',
    'The M is one stroke that starts inside the shared stem, so it can branch out of it; its right apex is the stem.',
    'Valley tip at 70 % of the M height (+0.5 overshoot); diagonals 4.5.',
    'Favicon: stroke 9, a 50 % valley and a 4 px counter so the M stays open at 16 px.',
  ],
}
