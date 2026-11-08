import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

type Props = {
  children: ReactNode
  /** Accessible name when the note needs one. */
  label?: string
  className?: string
}

/*
 * A short note beside the text: in column 12 + the outer track from 1440 px
 * (.col-margin), an inline aside below the body otherwise.
 * Contract: docs/contracts.md#marginnote.
 */
export function MarginNote({ children, label, className }: Props) {
  return (
    <aside className={cx('margin-note col-margin', className)} aria-label={label} data-margin-note="">
      {children}
    </aside>
  )
}
