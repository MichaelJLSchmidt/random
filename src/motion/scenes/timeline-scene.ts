import { bezier, pending } from '../choreography'
import { drawGroups } from '../kinds'
import { ease } from '../tokens'

/*
 * About timeline (full tier): its strokes are linked to the SVG's view
 * progress instead of a timed draw. Groups draw in order across the range
 * (each over half of it, starting evenly spread), tints fade in after their
 * group. Native ViewTimeline only; without it the caller falls back to the
 * normal draw reveal. Nothing moves at rest: the drawing follows the scroll.
 */
type ViewTimelineCtor = new (options: { subject: Element; axis?: 'block' | 'inline' }) => AnimationTimeline
type RangedOptions = KeyframeAnimationOptions & { rangeStart?: string; rangeEnd?: string }

const linkedName = 'about-timeline'
export const isLinkedTimeline = (svg: Element | null): svg is SVGSVGElement =>
  svg?.getAttribute('data-illustration') === linkedName

/** Links the drawing of `svg` to its view progress. Returns the cleanup, or null when unsupported. */
export function linkTimeline(svg: SVGSVGElement): (() => void) | null {
  const Ctor = (globalThis as { ViewTimeline?: ViewTimelineCtor }).ViewTimeline
  const groups = drawGroups(svg)
  if (!Ctor || !groups.length) return null
  const timeline = new Ctor({ subject: svg, axis: 'block' })
  const options: RangedOptions = {
    timeline,
    rangeStart: pending.timelineRange.start,
    rangeEnd: pending.timelineRange.end,
    fill: 'both',
  }
  const anims: Animation[] = []
  const undo: (() => void)[] = []
  const n = groups.length
  // Each group draws over half the range, its tints over the next quarter; starts spread evenly.
  const span = 1 / 2
  const tail = span / 2
  groups.forEach(({ strokes, tints }, gi) => {
    const from = n > 1 ? (gi / (n - 1)) * (1 - span - tail) : 0
    const to = from + span
    for (const s of strokes) {
      const drawn = s.hasAttribute('pathLength')
      if (drawn) {
        const dash = s.style.strokeDasharray
        s.style.strokeDasharray = '1'
        undo.push(() => (s.style.strokeDasharray = dash))
      }
      const [a, b] = drawn ? [{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }] : [{ opacity: 0 }, { opacity: 1 }]
      anims.push(
        s.animate(
          [
            { offset: 0, ...a },
            { offset: from, ...a, easing: bezier(ease.inOut) },
            { offset: to, ...b },
            { offset: 1, ...b },
          ],
          options,
        ),
      )
    }
    const tintEnd = to + tail
    for (const t of tints)
      anims.push(
        t.animate(
          [
            { offset: 0, opacity: 0 },
            { offset: to, opacity: 0 },
            { offset: tintEnd, opacity: 1 },
            { offset: 1, opacity: 1 },
          ],
          options,
        ),
      )
  })
  return () => {
    for (const a of anims) a.cancel()
    for (const fn of undo) fn()
  }
}
