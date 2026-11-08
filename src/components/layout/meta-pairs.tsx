import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export type MetaPair = { label: string; value: ReactNode }

type Props = {
  /** Five pairs on case studies (client, timeframe, role, team, type). */
  items: MetaPair[]
  /** Accessible name of the list. */
  label?: string
  className?: string
}

/*
 * A ruled row of key / value pairs: five across from 1024 px, two columns
 * below. Keys in the label token. Contract: docs/contracts.md#metapairs.
 */
export function MetaPairs({ items, label, className }: Props) {
  return (
    <dl className={cx('meta-pairs', className)} aria-label={label} data-count={items.length}>
      {items.map((item) => (
        <div key={item.label} className="meta-pair">
          <dt className="meta-pair-label t-label">{item.label}</dt>
          <dd className="meta-pair-value">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
