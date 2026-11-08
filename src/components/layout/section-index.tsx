import { pad2 } from '@/lib/content'
import { cx } from '@/lib/cx'

type Props = {
  /** 1-based section number, shown as "01". */
  number: number
  /** Short label, e.g. "Context". */
  label: string
  className?: string
}

/*
 * The section's index label ("01  Context"), sticky in the index column
 * (columns 1–3) from 1024 px; above the section body below that. Label type
 * token. Contract: docs/contracts.md#sectionindex.
 */
export function SectionIndex({ number, label, className }: Props) {
  return (
    <p className={cx('section-index t-label', className)} data-section-index={number}>
      <span className="section-index-number">{pad2(number)}</span>
      <span className="section-index-label">{label}</span>
    </p>
  )
}
