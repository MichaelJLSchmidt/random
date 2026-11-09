import { BASE, CAP, CAP_H, clipPath, g, rect, stroke } from '../geometry'
import { ACCENT, type Concept, NEUTRAL, type Seq, type Variant, idOf } from '../model'
import { calmFade, chase, draw, exitCalm, exitFull, shift, wave, weigh } from '../motion-kit'
import { mLine } from './m-line'

/*
 * 7 · Umlaut Dots. Concept 1's geometry, but the F's middle arm is two square
 * accent dots (5 × 5, 3 apart). The dots need 16 units beside the stem
 * (gap 3, dot, gap 3, dot), so the whole mark moves 3 units left and the top
 * arm runs on to the end of the second dot.
 */
const STROKES = ['m-line', 'stem']
const PARTS = ['m-line', 'stem', 'dot-1', 'dot-2']

const dot = (part: string, x: number, y: number, size: number, paint: string) =>
  rect({ 'data-part': part, x, y, width: size, height: size, fill: paint })

function master(): Variant {
  const m = mLine(
    {
      sw: 6,
      diag: 5.5,
      leftX: 6,
      apexL: [6, 12],
      apexR: [27, 12],
      valleyX: 16.5,
      tip: CAP + 0.6 * CAP_H + 0.5,
      armEnd: 46,
      band: [CAP, BASE],
    },
    NEUTRAL,
  )
  return {
    label: 'Master',
    defs: m.defs,
    body: [
      m.wrap(stroke('m-line', m.d, NEUTRAL, 6)),
      stroke('stem', 'M27 9V39', NEUTRAL, 6),
      dot('dot-1', 33, 21, 5, ACCENT),
      dot('dot-2', 41, 21, 5, ACCENT),
    ],
    metrics: { cap: CAP, base: BASE, stem: 6 },
    // Ink centroid (21.7, 21.3); the box is already 0.5 right of centre.
    nudge: [0, 1],
  }
}

/**
 * Favicon (16 px = 3 units per pixel): stems 3 px, a 4 px counter, the first
 * dot against the stem and a 1 px gap before the second; the top arm and the
 * second dot reach the right edge. Two 2 px dots beside a 3 px stem do not fit
 * in 16 px any other way.
 */
function favicon(): Variant {
  const m = mLine(
    {
      sw: 9,
      diag: 4.5,
      leftX: 7.5,
      apexL: [7.5, 13.5],
      apexR: [28.5, 13.5],
      valleyX: 18,
      tip: 24,
      armEnd: 48,
      band: [CAP, BASE],
    },
    NEUTRAL,
  )
  return {
    label: 'Favicon',
    defs: m.defs,
    body: [
      m.wrap(stroke('m-line', m.d, NEUTRAL, 9)),
      stroke('stem', 'M28.5 9V39', NEUTRAL, 9),
      dot('dot-1', 33, 24, 6, NEUTRAL),
      dot('dot-2', 42, 24, 6, NEUTRAL),
    ],
    metrics: { cap: CAP, base: BASE, stem: 9 },
  }
}

const dropIn = (part: string, at: number): Seq => [
  {
    part,
    at,
    dur: 250,
    ease: 'enter',
    frames: [
      { opacity: 0, transform: 'translate(0px, -6px)' },
      { opacity: 1, transform: 'translate(0px, 0px)' },
    ],
  },
]

/** The dots lift out and drop back in, 100 ms apart. */
const redot = (part: string, at: number): Seq => [
  {
    part,
    at,
    dur: 650,
    ease: 'move',
    frames: [
      { opacity: 1, transform: 'translate(0px, 0px)', offset: 0 },
      { opacity: 0, transform: 'translate(0px, -6px)', offset: 0.35 },
      { opacity: 0, transform: 'translate(0px, -6px)', offset: 0.45 },
      { opacity: 1, transform: 'translate(0px, 0px)', offset: 1 },
    ],
  },
]

export const umlautDots: Concept = {
  n: 7,
  slug: 'umlaut-dots',
  name: 'Umlaut Dots',
  idea: "Concept 1's shared stem, with the F's middle arm replaced by two accent dots.",
  parts: PARTS,
  accent: ['dot-1', 'dot-2'],
  variants: { master: master(), favicon: favicon() },
  motion: {
    reveal: {
      label: 'Draw, then dots',
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
        ...dropIn('dot-1', 800),
        ...dropIn('dot-2', 900),
      ],
      calm: [
        {
          ...weigh('m-line', 0, 500, 3, 6),
          frames: [
            { strokeWidth: '3px', opacity: 0 },
            { strokeWidth: '6px', opacity: 1 },
          ],
        },
        {
          ...weigh('stem', 0, 500, 3, 6),
          frames: [
            { strokeWidth: '3px', opacity: 0 },
            { strokeWidth: '6px', opacity: 1 },
          ],
        },
        ...calmFade(['dot-1', 'dot-2']).map((t, i) => ({ ...t, at: 400 + i * 100 })),
      ],
    },
    extra: { label: 'Dots again', full: [...redot('dot-1', 0), ...redot('dot-2', 100)], calm: null },
    hover: { label: 'Hover', full: shift(['dot-1', 'dot-2'], 1), calm: shift(['dot-1', 'dot-2'], 1) },
    loading: { label: 'Loading', full: [chase('m-line'), ...wave(['dot-1', 'dot-2'])], calm: wave(PARTS) },
    exit: { label: 'Exit', full: exitFull(PARTS), calm: exitCalm(PARTS) },
  },
  notes: [
    'Mark moved 3 units left (stems at x 6 and 27) so gap · dot · gap · dot fits; ink spans x 3–46.',
    'The top arm runs to x 46, the end of the second dot, so the F keeps a clean right edge.',
    `Strokes: ${STROKES.join(', ')}; dots are filled squares (filled by nature).`,
  ],
}
