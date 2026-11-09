import { type Pt, clipPath, g, num, rect } from '../geometry'
import { ACCENT, type Concept, NEUTRAL, type Seq, type Variant, idOf, urlOf } from '../model'
import { exitCalm, exitFull, shift, wave } from '../motion-kit'

/*
 * 4 · Dealt Modules. Every stroke is a slim card bar (6 wide, corner radius
 * 1) in two lengths, 30 and 12. The M: two long bars and two short bars
 * turned ±32° that meet in a valley. The F shares the right long bar and adds
 * two short horizontal bars (the lower one trimmed to 9). Six rects: the
 * brief counts seven, but with the shared bar there are six.
 *
 * The short horizontal bars start at the shared bar's centre and lie under
 * it (like dealt cards), so their visible length is 9 and 6, as in concept 1.
 * The turned bars slide under the cap line (a clip, like cards under a
 * ruler) with their outer corners under the long bars, so the M's shoulders
 * are flat and closed. A 12-unit bar at 32° only spans 13.4 units of height,
 * so the valley ends at 35 %, not 55 %: hung lower, the bars float below the
 * cap line and their rounded tops read as a heart.
 */
type Spec = {
  w: number
  r: number
  short: number
  /** Width of the turned bars (the favicon keeps them slimmer than its long bars). */
  dw: number
  angle: number
  left: number
  shared: number
  top: number
  base: number
  /** How far the turned bars' outer corners reach under the long bars. */
  tuck: number
  fTop: [x: number, y: number, len: number]
  fMid: [x: number, y: number, len: number]
  midPaint: string
}

/** Corners of a dw × short bar turned by deg about its centre (offsets from the centre). */
function corners(s: Spec, deg: number): Pt[] {
  const a = (deg * Math.PI) / 180
  return (
    [
      [-s.dw / 2, -s.short / 2],
      [s.dw / 2, -s.short / 2],
      [s.dw / 2, s.short / 2],
      [-s.dw / 2, s.short / 2],
    ] as Pt[]
  ).map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)])
}

/**
 * A turned bar under the cap line: placed so its top end edge runs through
 * the long bar's top inner corner, its outer corner `tuck` units under the
 * long bar; the cap clip trims what rises above. The part is a group (so the
 * deal moves it in view-box space) inside the static clip.
 */
function turned(part: string, s: Spec, side: -1 | 1, paint: string) {
  // The left bar leans like a backslash (top turned left, counter-clockwise), the right like a slash.
  const deg = side * s.angle
  const c = corners(s, deg)
  const outer = c.reduce((m, p) => (side * p[0] > side * m[0] ? p : m))
  const edge = side < 0 ? s.left + s.w : s.shared
  const cx = edge + side * s.tuck - outer[0]
  const cy = s.top + s.tuck * Math.tan((s.angle * Math.PI) / 180) - outer[1]
  return g(
    { 'clip-path': urlOf('cap') },
    g(
      { 'data-part': part },
      g(
        { transform: `translate(${num(cx)} ${num(cy)}) rotate(${num(deg)})` },
        rect({ x: -s.dw / 2, y: -s.short / 2, width: s.dw, height: s.short, rx: s.r, fill: paint }),
      ),
    ),
  )
}

/** Where the turned bars bottom out (notes, QA). */
export function valleyOf(s: Spec) {
  const c = corners(s, -s.angle)
  const outer = c.reduce((m, p) => (p[0] < m[0] ? p : m))
  const low = c.reduce((m, p) => (p[1] > m[1] ? p : m))
  return s.top + s.tuck * Math.tan((s.angle * Math.PI) / 180) + (low[1] - outer[1])
}

function build(label: string, s: Spec): Variant {
  const bar = (part: string, x: number, y: number, w: number, h: number, paint: string) =>
    rect({ 'data-part': part, x, y, width: w, height: h, rx: s.r, fill: paint })
  return {
    label,
    defs: [clipPath(idOf('cap'), rect({ x: -12, y: s.top, width: 72, height: 60 }))],
    body: [
      bar('f-top', s.fTop[0], s.fTop[1], s.fTop[2], s.w, NEUTRAL),
      bar('f-mid', s.fMid[0], s.fMid[1], s.fMid[2], s.w, s.midPaint),
      turned('diag-l', s, -1, NEUTRAL),
      turned('diag-r', s, 1, NEUTRAL),
      bar('bar-m', s.left, s.top, s.w, s.base - s.top, NEUTRAL),
      bar('bar-f', s.shared, s.top, s.w, s.base - s.top, NEUTRAL),
    ],
    metrics: { cap: s.top, base: s.base, stem: s.w },
  }
}

const MASTER: Spec = {
  w: 6,
  dw: 6,
  r: 1,
  short: 12,
  angle: 32,
  left: 6,
  shared: 27,
  top: 9,
  base: 39,
  tuck: 0.5,
  fTop: [30, 9, 12],
  fMid: [30, 21, 9],
  midPaint: ACCENT,
}
// Ink centroid (22.3, 20.8): left- and top-heavy.
const master: Variant = { ...build('Master', MASTER), nudge: [1, 1] }

/** Favicon: long and arm bars 9 wide (3 px at 16 px) on the 3-unit grid; the turned bars stay 6 so the V keeps its notch. */
const favicon = build('Favicon', {
  w: 9,
  dw: 6,
  r: 1.5,
  short: 12,
  angle: 32,
  left: 3,
  shared: 27,
  top: 9,
  base: 39,
  tuck: 0.75,
  fTop: [31.5, 9, 13.5],
  fMid: [31.5, 24, 10.5],
  midPaint: NEUTRAL,
})

/* ---------- Motion ---------- */

const ORDER = ['bar-m', 'diag-l', 'diag-r', 'bar-f', 'f-top', 'f-mid']
const DEAL = 450
const GAP = 60

const dealFrames: Keyframe[] = [
  { opacity: 0, transform: 'translate(0px, 12px) rotate(-8deg)', offset: 0 },
  { opacity: 1, offset: 0.5 },
  { opacity: 1, transform: 'translate(0px, 0px) rotate(0deg)', offset: 1 },
]
const dealIn = (start = 0): Seq =>
  ORDER.map((part, i) => ({
    part,
    at: start + i * GAP,
    dur: DEAL,
    ease: 'enter' as const,
    origin: '50% 50%',
    box: 'fill-box' as const,
    frames: dealFrames,
  }))
const REVEAL_END = (ORDER.length - 1) * GAP + DEAL

/** The deal played backwards (last bar first): the shuffle-out. */
const shuffleOut: Seq = ORDER.map((part, i) => ({
  part,
  at: (ORDER.length - 1 - i) * GAP,
  dur: DEAL,
  ease: 'exit' as const,
  origin: '50% 50%',
  box: 'fill-box' as const,
  frames: [...dealFrames].reverse().map((f) => ({ ...f, offset: 1 - (f.offset as number) })),
}))

export const dealtModules: Concept = {
  n: 4,
  slug: 'dealt-modules',
  name: 'Dealt Modules',
  idea: 'Every stroke is a slim card bar, dealt onto the table: the M and the F share one long bar.',
  parts: ORDER,
  accent: ['f-mid'],
  variants: { master, favicon },
  motion: {
    reveal: {
      label: 'Deal',
      full: dealIn(),
      calm: ORDER.map((part, i) => ({
        part,
        at: i * 40,
        dur: 400,
        ease: 'enter' as const,
        frames: [{ opacity: 0 }, { opacity: 1 }],
      })),
    },
    extra: {
      label: 'Shuffle out, deal again',
      // Out, a beat on the empty table, and dealt back in: ends on the static mark.
      full: [...shuffleOut, ...dealIn(REVEAL_END + 300)],
      calm: null,
    },
    hover: { label: 'Hover', full: shift(['f-mid'], 1), calm: shift(['f-mid'], 1) },
    loading: { label: 'Loading', full: wave(ORDER), calm: wave(ORDER) },
    exit: { label: 'Exit', full: exitFull(ORDER), calm: exitCalm(ORDER) },
  },
  notes: [
    'Six rects (the shared bar counts once); the brief’s “seven” double-counts it.',
    'Short horizontal bars start at the shared bar’s centre, under it: visible arms 9 and 6.',
    `Turned bars slide under a cap-line clip with their outer corners 0.5 under the long bars, so the shoulders close; the valley ends at y ${num(valleyOf(MASTER))} (${Math.round(((valleyOf(MASTER) - 9) / 30) * 100)} %). 12-unit bars at 32° cannot reach 55 % and still meet the stems: lower, they float and read as a heart.`,
  ],
}
