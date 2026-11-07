import type { CSSProperties } from 'react'
import { CardBack, CardFrame } from './card'
import styles from './layouts.module.css'

/** The draw pile beside the hand: face-down cards. The intro deals from here. */
export function DeckPile({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.pile} data-deck="" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.pileCard} data-deck-card="" style={{ '--i': i } as CSSProperties}>
          <CardFrame>
            <CardBack />
          </CardFrame>
        </div>
      ))}
    </div>
  )
}
