'use client'

import { useRef } from 'react'
import type { Decision, Decisions } from '@/lib/content'
import { site } from '@/lib/hand-data'
import { useDealScene } from '@/motion/scenes/deal-scene'
import { cx } from '@/lib/cx'

type Props = {
  /** Exactly four decisions. */
  decisions: Decisions
  /** Field labels (default: site.labels.decision). */
  labels?: Record<keyof Decision, string>
  className?: string
}

/*
 * Four decision cards. Desktop (from 1024 px): a static row of four. Mobile: a
 * horizontal scroll-snap row with a "1 / 4" position label. The Motion session
 * deals the cards through useDealScene(ref, { cards: 4 }) on [data-scene="deal"].
 * Contract: docs/contracts.md#dealrow.
 */
export function DealRow({ decisions, labels = site.labels.decision, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { active } = useDealScene(ref, { cards: 4 })
  return (
    <div ref={ref} className={cx('deal-row', className)} data-scene="deal" data-scene-active={active ? '' : undefined}>
      <ol className="deal-row-list">
        {decisions.map((d, i) => (
          <li key={i} className="deal-card" data-deal-card={i + 1}>
            <p className="deal-card-index t-label">
              {labels.decision} {i + 1}
            </p>
            <h3 className="deal-card-title t-h3">{d.decision}</h3>
            <dl className="deal-card-fields">
              <div>
                <dt className="t-label">{labels.chose}</dt>
                <dd>{d.chose}</dd>
              </div>
              <div>
                <dt className="t-label">{labels.tradeOff}</dt>
                <dd>{d.tradeOff}</dd>
              </div>
              <div>
                <dt className="t-label">{labels.why}</dt>
                <dd>{d.why}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
      <p className="deal-row-position t-label" aria-hidden="true" data-deal-position="">
        1 / {decisions.length}
      </p>
    </div>
  )
}
