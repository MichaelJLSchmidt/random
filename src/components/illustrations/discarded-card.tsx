import { Group, IllustrationFrame, useIllustrationIds } from './frame'
import { roundRect, space } from './geometry'
import type { IllustrationProps } from './types'

const S = space(132, 184)
const W = 78
const HGT = 108
const R = 7

type Card = { x: number; y: number; deg: number }

/** The pile, bottom to top, then the discarded card on top of it (tilted −12°). */
const pile: Card[] = [
  { x: 75, y: 121, deg: 10 },
  { x: 58, y: 124, deg: -7 },
  { x: 69, y: 116, deg: 2 },
]
const top: Card = { x: 57, y: 74, deg: -12 }

const outline = roundRect(-W / 2, -HGT / 2, W, HGT, R)
const place = (c: Card) => `translate(${c.x} ${c.y}) rotate(${c.deg})`

/**
 * 404: a card discarded face down, tilted about −12°, above a loose pile of three card outlines.
 * Hidden lines are removed with masks (each card hides what lies under it), so the pile reads as
 * stacked paper, not wireframe. 132×184, plain (no labels). Groups: 1 the pile, 2 the card.
 */
export function DiscardedCard({ className, titleId, title = 'A discarded card', description }: IllustrationProps) {
  const ids = useIllustrationIds('discarded-card', titleId)
  const above = (i: number) => [...pile.slice(i + 1), top]
  return (
    <IllustrationFrame
      slug="discarded-card"
      viewBox={S}
      title={title}
      desc={
        description ??
        'A single card lies face down on top of a loose discard pile of three cards, turned at a slight angle as if just thrown there.'
      }
      className={className}
      ids={ids}
    >
      <defs>
        {pile.map((_, i) => (
          <mask key={i} id={`${ids.uid}-m${i}`} maskUnits="userSpaceOnUse" x={-20} y={-20} width={172} height={224}>
            <rect x={-20} y={-20} width={172} height={224} fill="white" stroke="none" />
            {above(i).map((c, j) => (
              <path
                key={j}
                d={outline}
                transform={place(c)}
                fill="black"
                stroke="black"
                strokeWidth={5}
                strokeOpacity={1}
              />
            ))}
          </mask>
        ))}
      </defs>
      <Group n={1}>
        {pile.map((c, i) => (
          <g key={i} mask={`url(#${ids.uid}-m${i})`}>
            <path d={outline} transform={place(c)} pathLength="1" data-draw="" />
          </g>
        ))}
      </Group>
      <Group n={2}>
        <g transform={place(top)}>
          <path d={outline} data-draw-fill="" />
          <path d={outline} pathLength="1" data-draw="" />
          <path
            d={roundRect(-W / 2 + 7, -HGT / 2 + 7, W - 14, HGT - 14, R - 3)}
            className="il-faint"
            pathLength="1"
            data-draw=""
          />
        </g>
      </Group>
    </IllustrationFrame>
  )
}
