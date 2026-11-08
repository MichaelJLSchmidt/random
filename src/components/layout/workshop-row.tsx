'use client'

import { type CSSProperties, useRef } from 'react'
import type { WorkshopFormat } from '@/lib/content'
import { pad2 } from '@/lib/format'
import { useDealScene } from '@/motion/scenes/deal-scene'
import { cx } from '@/lib/cx'
import { useDealPosition } from './use-deal-position'

type Props = {
  formats: WorkshopFormat[]
  className?: string
}

/*
 * Management's workshop formats as a deal row: the same stage, scene hook
 * (data-scene="deal", one [data-deal-card] per format) and mobile "n / N"
 * label as DealRow, with workshop fields (name, duration · who, outcome)
 * instead of the four decision fields. DealRow keeps its contract props.
 */
export function WorkshopRow({ formats, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const position = useRef<HTMLParagraphElement>(null)
  const { active } = useDealScene(ref, { cards: formats.length })
  useDealPosition(list, position)
  return (
    <div
      ref={ref}
      className={cx('deal-row deal-row-workshops', className)}
      data-scene="deal"
      data-scene-active={active ? '' : undefined}
      style={{ '--deal-count': formats.length } as CSSProperties}
    >
      <ol ref={list} className="deal-row-list">
        {formats.map((f, i) => (
          <li key={i} className="deal-card" data-deal-card={i + 1}>
            <p className="deal-card-index t-label">
              <span className="deal-card-number">{pad2(i + 1)}</span>
              <span>{f.duration}</span>
            </p>
            <h3 className="deal-card-title t-h3">{f.name}</h3>
            <p className="deal-card-who t-label">{f.who}</p>
            <p className="deal-card-outcome">{f.outcome}</p>
          </li>
        ))}
      </ol>
      <p ref={position} className="deal-row-position t-label" aria-hidden="true" data-deal-position="">
        1 / {formats.length}
      </p>
    </div>
  )
}
