import { type DrawGroup, Drawing, Label } from './frame'
import { type Space, space, spread } from './geometry'
import type { IllustrationProps } from './types'

export type AboutTimelineStop = { years: string; title: string }
export type AboutTimelineProps = IllustrationProps & {
  /** The stops, oldest first (About: seven, from the content module's about.timeline.items). */
  items?: readonly AboutTimelineStop[]
  /**
   * false: line and dots only (horizontal layout, 960×120), for a page that sets the years and
   * titles as HTML under the stops (About). The stops sit at the centres of equal cells,
   * x = (i + 0.5) × 960 / n, so HTML in n equal columns (or rows) lines up with them.
   */
  labels?: boolean
}

const H = space(960, 240)
const BARE = space(960, 120)
const V = space(360, 560)
const DOT = 6

const placeholder: AboutTimelineStop[] = [
  { years: '2008', title: 'Studies' },
  { years: '2011', title: 'First studio' },
  { years: '2014', title: 'Agency' },
  { years: '2016', title: 'Product team' },
  { years: '2019', title: 'Public sector' },
  { years: '2021', title: 'Design system' },
  { years: '2023', title: 'Team lead' },
]

/** Stop centres across the width: the middles of n equal cells. */
const cells = (n: number) => Array.from({ length: n }, (_, i) => ((i + 0.5) * 960) / n)

/** Wide: one line across, dots at the stops, years above, titles below (wrapped); or line and dots only. */
function horizontal(s: Space, items: readonly AboutTimelineStop[], labels = true): DrawGroup[] {
  const line = labels ? 104 : s.h / 2
  const xs = cells(items.length)
  const pitch = 960 / Math.max(1, items.length)
  const chars = Math.max(6, Math.floor((pitch * 0.58) / 7.92) - 1)
  return [
    { plate: <path d={`M16 ${line}H944`} className="il-faint" pathLength="1" data-draw="" /> },
    ...items.map((item, i): DrawGroup => ({
      plate: (
        <>
          {i === items.length - 1 && <circle cx={xs[i]} cy={line} r={DOT} data-draw-fill="" />}
          <circle cx={xs[i]} cy={line} r={DOT} pathLength="1" data-draw="" />
        </>
      ),
      pins: labels ? (
        <>
          <Label s={s} at={[xs[i], line - DOT]} dy={-10} anchor="middle" tone="accent" text={item.years} />
          <Label s={s} at={[xs[i], line + DOT]} dy={14} anchor="middle" valign="top" wrap={chars} text={item.title} />
        </>
      ) : undefined,
    })),
  ]
}

/** Narrow: one line down the left, dots at the stops, year and title to the right. */
function vertical(s: Space, items: readonly AboutTimelineStop[]): DrawGroup[] {
  const line = 40
  const ys = spread(48, 512, items.length)
  return [
    { plate: <path d={`M${line} 20V540`} className="il-faint" pathLength="1" data-draw="" /> },
    ...items.map((item, i): DrawGroup => ({
      plate: (
        <>
          {i === items.length - 1 && <circle cx={line} cy={ys[i]} r={DOT} data-draw-fill="" />}
          <circle cx={line} cy={ys[i]} r={DOT} pathLength="1" data-draw="" />
        </>
      ),
      pins: (
        <>
          <Label s={s} at={[line + DOT, ys[i]]} dx={14} dy={-1} tone="accent" text={item.years} />
          <Label s={s} at={[line + DOT, ys[i]]} dx={14} dy={7} valign="top" wrap={28} text={item.title} />
        </>
      ),
    })),
  ]
}

/**
 * About: the timeline of roles as stops on one line, oldest first; each stop has a dot, its years
 * in mono and a short title. The latest stop is tinted. Horizontal 960×240; vertical 360×560
 * below 640 px; `labels={false}`: line and dots only, 960×120. Groups: 1 the line, then one
 * per stop.
 */
export function AboutTimeline({
  items = placeholder,
  labels = true,
  title = 'Timeline',
  description,
  ...props
}: AboutTimelineProps) {
  const desc =
    description ??
    `A timeline of ${items.length} stops from ${items[0]?.years} to ${items.at(-1)?.years}: ${items.map((t) => `${t.years} ${t.title}`).join('; ')}.`
  return (
    <Drawing
      slug="about-timeline"
      title={title}
      desc={desc}
      {...props}
      variant={labels ? props.variant : 'horizontal'}
      h={labels ? [H, (s) => horizontal(s, items)] : [BARE, (s) => horizontal(s, items, false)]}
      v={[V, (s) => vertical(s, items)]}
    />
  )
}
