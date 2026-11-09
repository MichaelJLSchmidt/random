import { BASE, CAP, CAP_H, clipPath, g, rect, stroke } from '../geometry'
import { ACCENT, type Concept, NEUTRAL, type Variant, idOf, urlOf } from '../model'
import { calmWeigh, chase, draw, exitCalm, exitFull, shift, wave, weigh } from '../motion-kit'
import { mLine } from './m-line'

/*
 * 1 · Shared Stem. The M's right stem is also the F's stem: three strokes.
 * The M runs on into the F's top arm; the valley stops at 60 % of the cap
 * height (visible tip, +0.5 overshoot); the F's middle arm is the accent.
 */
const PARTS = ['m-line', 'f-arm', 'stem']

/** Master: stroke 6, stems at x 9 and 30, arm to 42 → ink from x 6 to 42, y 9 to 39. */
function master(): Variant {
  const m = mLine(
    {
      sw: 6,
      diag: 5.5,
      leftX: 9,
      apexL: [9, 12],
      apexR: [30, 12],
      valleyX: 19.5,
      tip: CAP + 0.6 * CAP_H + 0.5,
      armEnd: 42,
      band: [CAP, BASE],
    },
    NEUTRAL,
  )
  return {
    label: 'Master',
    defs: [...m.defs, clipPath(idOf('f-slot'), rect({ x: 31, y: 0, width: 18, height: 48 }))],
    body: [
      m.wrap(stroke('m-line', m.d, NEUTRAL, 6)),
      // Under the stem, clipped from 1 unit right of its centre line: it slides out of the stem,
      // and while shifted it ends clear of the clip edge (no anti-aliased sliver).
      g({ 'clip-path': urlOf('f-slot') }, stroke('f-arm', 'M30 24H39', ACCENT, 6)),
      stroke('stem', 'M30 9V39', NEUTRAL, 6),
    ],
    metrics: { cap: CAP, base: BASE, stem: 6 },
    // Ink centroid (22.3, 21.9): left- and top-heavy.
    nudge: [1, 1],
  }
}

/**
 * Favicon: stroke 9 (3 px at 16 px), every edge on the 3-unit grid:
 * stems x 3–12 and 27–36, arm to 45, middle arm y 24–33. Only 5 px sit
 * between the stems, so the diagonals are thin (4.5) and the valley stops at
 * half the cap height (tip y 24): the notch between them stays open at 16 px.
 */
function favicon(): Variant {
  const m = mLine(
    {
      sw: 9,
      diag: 4.5,
      leftX: 7.5,
      apexL: [7.5, 13.5],
      apexR: [31.5, 13.5],
      valleyX: 19.5,
      tip: 24,
      armEnd: 45,
      band: [CAP, BASE],
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

const thinToBold = [weigh('m-line', 0, 700, 2, 6), weigh('stem', 0, 700, 2, 6), weigh('f-arm', 0, 700, 2, 6)]

export const sharedStem: Concept = {
  n: 1,
  slug: 'shared-stem',
  name: 'Shared Stem',
  idea: "The M's right stem is also the F's stem; the M runs on into the F's top arm.",
  parts: PARTS,
  accent: ['f-arm'],
  variants: { master: master(), favicon: favicon() },
  motion: {
    reveal: {
      label: 'Draw',
      full: [
        draw('m-line', 0, 600),
        {
          part: 'stem',
          at: 600,
          dur: 200,
          ease: 'enter',
          frames: [
            { opacity: 0, transform: 'translate(0px, -6px)' },
            { opacity: 1, transform: 'translate(0px, 0px)' },
          ],
        },
        {
          part: 'f-arm',
          at: 800,
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
    alt: {
      label: 'Thin to bold',
      full: thinToBold,
      calm: calmWeigh(
        [
          { part: 'm-line', from: 3, to: 6 },
          { part: 'stem', from: 3, to: 6 },
          { part: 'f-arm', from: 3, to: 6 },
        ],
        0,
      ),
    },
    extra: { label: 'Thin to bold', full: thinToBold, calm: null },
    hover: { label: 'Hover', full: shift(['f-arm'], 1), calm: shift(['f-arm'], 1) },
    loading: { label: 'Loading', full: [chase('m-line')], calm: wave(PARTS) },
    exit: { label: 'Exit', full: exitFull(PARTS), calm: exitCalm(PARTS) },
  },
  notes: [
    'Cap line = top edge (y 9), baseline y 39: the top arm runs at y 12 so its top edge sits on the cap line.',
    'Valley tip at 60 % of the cap height + 0.5 overshoot (y 27.5); the centreline vertex is solved from it.',
    'Diagonals 5.5 instead of 6 (clip outline); the apex miter spike is trimmed by a cap-line band.',
    'The middle arm sits under the stem, so the stem stays one neutral stroke and the accent starts at its edge.',
  ],
}
