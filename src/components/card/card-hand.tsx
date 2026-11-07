import type { CSSProperties, ReactNode } from 'react'
import styles from './layouts.module.css'

/*
 * The hand: a fan on wide screens, an overlapping stack on narrow ones (pure
 * CSS, so first paint and no-JS show the final layout). Each card sits in a
 * slot (moved by the intro deal) inside a lift wrapper (hover/focus lift).
 */
export function CardHand({ items, labelledBy }: { items: ReactNode[]; labelledBy?: string }) {
  const count = items.length
  return (
    <ol className={styles.hand} aria-labelledby={labelledBy} data-hand="">
      {items.map((item, i) => {
        const offset = i - (count - 1) / 2
        return (
          <li key={i} style={{ '--offset': offset, '--lift': Math.abs(offset) } as CSSProperties}>
            <div className={styles.slot} data-card-slot="">
              <div className={styles.lift}>{item}</div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
