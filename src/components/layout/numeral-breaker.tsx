import { pad2 } from '@/lib/content'
import { cx } from '@/lib/cx'

type Props = {
  /** The number to show; numbers are padded to two digits ("02"). */
  value: number | string
  className?: string
}

/*
 * A large outlined numeral (numeral token, outline variant) before a section.
 * It overlaps the next block by a third of its height; the next block sits
 * above it. Decorative: the SectionIndex carries the number for screen
 * readers. Contract: docs/contracts.md#numeralbreaker.
 */
export function NumeralBreaker({ value, className }: Props) {
  return (
    <div className={cx('numeral-breaker', className)} aria-hidden="true" data-numeral={value}>
      <span className="t-numeral t-numeral-outline">{typeof value === 'number' ? pad2(value) : value}</span>
    </div>
  )
}
