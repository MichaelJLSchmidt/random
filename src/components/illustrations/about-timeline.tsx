import { type DrawGroup, Drawing, Label } from './frame'
import { type Space, space, spread } from './geometry'
import type { IllustrationProps } from './types'

export type AboutTimelineStop = { years: string; title: string }
export type AboutTimelineProps = IllustrationProps & {
  /** The stops, oldest first (About: seven, from the content module's about.timeline.items). */
  items?: readonly AboutTimelineStop[]
}

const H = space(960, 240)
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

/** Wide: one line across, dots at the stops, years above, titles below (wrapped). */
function horizontal(s: Space, items: readonly AboutTimelineStop[]): DrawGroup[] {
  const line = 104
  const xs = spread(80, 880, items.length)
  const pitch = items.length > 1 ? xs[1] - xs[0] : 800
  const chars = Math.max(6, Math.floor((pitch * 0.58) / 7.92) - 1)
  return [
    { plate: <path d={`M32 ${line}H928`} className="il-faint" pathLength="1" data-draw="" /> },
    ...items.map((item, i): DrawGroup => ({
      plate: (
        <>
          {i === items.length - 1 && <circle cx={xs[i]} cy={line} r={DOT} data-draw-fill="" />}
          <circle cx={xs[i]} cy={line} r={DOT} pathLength="1" data-draw="" />
        </>
      ),
      pins: (
        <>
          <Label s={s} at={[xs[i], line - DOT]} dy={-10} anchor="middle" tone="accent" text={item.years} />
          <Label s={s} at={[xs[i], line + DOT]} dy={14} anchor="middle" valign="top" wrap={chars} text={item.title} />
        </>
      ),
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
 * below 640 px. Groups: 1 the line, then one per stop.
 */
export function AboutTimeline({ items = placeholder, title = 'Timeline', description, ...props }: AboutTimelineProps) {
  const desc =
    description ??
    `A timeline of ${items.length} stops from ${items[0]?.years} to ${items.at(-1)?.years}: ${items.map((t) => `${t.years} ${t.title}`).join('; ')}.`
  return (
    <Drawing
      slug="about-timeline"
      title={title}
      desc={desc}
      {...props}
      h={[H, (s) => horizontal(s, items)]}
      v={[V, (s) => vertical(s, items)]}
    />
  )
}
