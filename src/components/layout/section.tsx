import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { MarginNote } from './margin-note'
import { NumeralBreaker } from './numeral-breaker'
import { SectionIndex } from './section-index'

type Props = {
  /** The section's id (anchor, Minimap target) and data-section value. */
  id: string
  /** 1-based number ("01" in the index). */
  number: number
  /** Index label, e.g. "Context". */
  label: string
  /** The h2. */
  title: string
  /** Show a NumeralBreaker before the section. */
  breaker?: boolean
  /** MarginNote text. */
  note?: ReactNode
  className?: string
  children?: ReactNode
}

/*
 * One numbered section on the Spread grid: optional NumeralBreaker (full
 * bleed), SectionIndex in the index column, the h2 and body in the content
 * column, an optional MarginNote. A composition of the stubs, not a contract
 * of its own; the Layout session may change or drop it.
 */
export function Section({ id, number, label, title, breaker, note, className, children }: Props) {
  const titleId = `${id}-title`
  return (
    <section id={id} className={cx('page-section spread-grid', className)} data-section={id} aria-labelledby={titleId}>
      {breaker && <NumeralBreaker value={number} className="col-full" />}
      <SectionIndex number={number} label={label} className="col-index" />
      <div className="section-body col-content">
        <h2 id={titleId} className="section-title t-h2">
          {title}
        </h2>
        {children}
      </div>
      {note && <MarginNote>{note}</MarginNote>}
    </section>
  )
}
