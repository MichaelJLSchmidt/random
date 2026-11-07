import type { CSSProperties } from 'react'
import { CardBack, CardFrame } from './card'
import styles from './layouts.module.css'

/** A small face-down pile. Purely decorative. */
export function Deck({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.deck} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ '--i': i } as CSSProperties}>
          <CardFrame>
            <CardBack />
          </CardFrame>
        </div>
      ))}
    </div>
  )
}
