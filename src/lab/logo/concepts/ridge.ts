import { BASE, CAP, type Pt, clipPath, g, rect, stroke } from '../geometry'
import { ACCENT, type Concept, NEUTRAL, type Variant, idOf, urlOf } from '../model'
import { calmWeigh, chase, exitCalm, exitFull, shift, wave } from '../motion-kit'
import { type MSpec, mLine, outlineD } from './m-line'
import { pathOf } from '../geometry'

/*
 * 6 · Ridge. Concept 1 with an asymmetric M: the left stem tops 2 units
 * higher (y 7) than the right (y 9) and the valley sits off-centre (x 18,
 * tip y 26.5), so the top edge reads as a ridge line; the F's top arm runs on
 * off the right peak like a horizon. No other mountain cues.
 */
const PARTS = ['m-line', 'f-arm', 'stem']

const MASTER: MSpec = {
  sw: 6,
  diag: 5.5,
  leftX: 9,
  apexL: [9, 10],
  apexR: [30, 12],
  valleyX: 18,
  tip: 26.5,
  armEnd: 42,
  band: [7, BASE],
}

/** The contour the M flattens into: same five points, stroke 3, below the middle arm. */
const CONTOUR: Pt[] = [
  [3, 31.5],
  [12, 28.5],
  [21, 31.5],
  [33, 29],
  [45, 30.5],
]

function master(): Variant {
  const m = mLine(MASTER, NEUTRAL)
  return {
    label: 'Master',
    defs: [...m.defs, clipPath(idOf('f-slot'), rect({ x: 31, y: 0, width: 18, height: 48 }))],
    body: [
      m.wrap(stroke('m-line', m.d, NEUTRAL, 6)),
      g({ 'clip-path': urlOf('f-slot') }, stroke('f-arm', 'M30 24H39', ACCENT, 6)),
      stroke('stem', 'M30 9V39', NEUTRAL, 6),
    ],
    metrics: { cap: CAP, base: BASE, stem: 6 },
    // Ink centroid (21.9, 21.4).
    nudge: [1, 1],
  }
}

/** Favicon: concept 1's favicon grid; the left peak one pixel (3 units) higher. */
function favicon(): Variant {
  const m = mLine(
    {
      sw: 9,
      diag: 4.5,
      leftX: 7.5,
      apexL: [7.5, 10.5],
      apexR: [31.5, 13.5],
      valleyX: 18,
      tip: 22.5,
      armEnd: 45,
      band: [6, BASE],
    },
    NEUTRAL,
  )
  return {
    label: 'Favicon',
    defs: [...m.defs, clipPath(idOf('f-slot'), rect({ x: 32.5, y: 0, width: 18, height: 48 }))],
    body: [
      m.wrap(stroke('m-line', m.d, NEUTRAL, 9)),
      g({ 'clip-path': urlOf('f-slot') }, stroke('f-arm', 'M31.5 28.5H42', NEUTRAL, 9)),
      stroke('stem', 'M31.5 9V39', NEUTRAL, 9),
    ],
    metrics: { cap: CAP, base: BASE, stem: 9 },
  }
}

const ridge = mLine(MASTER, NEUTRAL)
const ridgeD = ridge.d
const contourD = pathOf(CONTOUR)
const ridgeShape = outlineD(ridge.pts, ridge.half)
// The clip follows loosely (half width 3), so the thinning stroke is never cut.
const contourShape = outlineD(CONTOUR, 3)

const contourMorph = [
  {
    kind: 'morph' as const,
    part: 'm-line',
    at: 0,
    dur: 1800,
    ease: 'move' as const,
    attr: 'd' as const,
    values: [ridgeD, contourD, contourD, ridgeD],
  },
  {
    kind: 'morph' as const,
    part: 'm-shape',
    at: 0,
    dur: 1800,
    ease: 'move' as const,
    attr: 'd' as const,
    values: [ridgeShape, contourShape, contourShape, ridgeShape],
  },
  {
    part: 'm-line',
    at: 0,
    dur: 1800,
    ease: 'move' as const,
    frames: [{ strokeWidth: '6px' }, { strokeWidth: '3px' }, { strokeWidth: '3px' }, { strokeWidth: '6px' }],
  },
]

export const ridgeConcept: Concept = {
  n: 6,
  slug: 'ridge',
  name: 'Ridge',
  idea: "Concept 1 with an asymmetric M whose top edge reads as a ridge; the F's arm runs on as a horizon.",
  parts: PARTS,
  accent: ['f-arm'],
  variants: { master: master(), favicon: favicon() },
  motion: {
    reveal: {
      label: 'Ridge draws',
      full: [
        {
          part: 'm-line',
          at: 0,
          dur: 800,
          ease: 'enter',
          frames: [
            { strokeDasharray: '1 1', strokeDashoffset: 1 },
            { strokeDasharray: '1 1', strokeDashoffset: 0 },
          ],
        },
        { part: 'stem', at: 800, dur: 200, ease: 'enter', frames: [{ opacity: 0 }, { opacity: 1 }] },
        {
          part: 'f-arm',
          at: 900,
          dur: 250,
          ease: 'enter',
          frames: [
            { transform: 'translate(-9px, 0px)', stroke: '@neutral' },
            { transform: 'translate(0px, 0px)', stroke: '@accent' },
          ],
        },
      ],
      calm: calmWeigh([
        { part: 'm-line', from: 3, to: 6 },
        { part: 'stem', from: 3, to: 6 },
        { part: 'f-arm', from: 3, to: 6 },
      ]),
    },
    extra: { label: 'Contour line', full: contourMorph, calm: null },
    hover: { label: 'Hover', full: shift(['f-arm'], 1), calm: shift(['f-arm'], 1) },
    loading: { label: 'Loading', full: [chase('m-line')], calm: wave(PARTS) },
    exit: { label: 'Exit', full: exitFull(PARTS), calm: exitCalm(PARTS) },
  },
  notes: [
    'The left peak breaks the shared cap line on purpose (y 7): it is the concept. Every other top edge sits on y 9.',
    'Valley tip y 26.5 at x 18 (the brief’s 18 / 26, read as the visible tip like concept 1).',
    'Contour moment: the M line and its clip morph point for point (same five-point path) to a gentle contour, stroke 6 → 3, and back.',
  ],
}
