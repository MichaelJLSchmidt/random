import type { CaseStudy } from '@/lib/content'
import { cardNumber } from '@/lib/content'
import styles from './card.module.css'
import { BackPattern, Motif } from './motif'

/*
 * Original 63:88 card. Faces are plain markup; layouts (deck, hand, stack) and
 * motion (flip, entrance, lift) are applied by the components that place them.
 * Text sits on solid surfaces only; the window and back pattern carry no text.
 */

type FrontProps = { study: CaseStudy; index: number; headingLevel?: 'h3' | 'p' }

export function CardFront({ study, index, headingLevel: Title = 'p' }: FrontProps) {
  return (
    <div className={`${styles.face} ${styles.front}`}>
      <div className={styles.topRow} aria-hidden="true">
        <span>{cardNumber(index)}</span>
        <span>{study.year}</span>
      </div>
      <Title className={styles.title} data-text={study.title}>
        <span>{study.title}</span>
      </Title>
      <div className={styles.window} data-motif={study.motif}>
        <Motif name={study.motif} />
        <span className={styles.foil} data-foil-layer aria-hidden="true" />
      </div>
      <p className={styles.meta}>
        {study.discipline}, {study.year}
      </p>
    </div>
  )
}

export function CardBack({ children }: { children?: React.ReactNode }) {
  return (
    <div className={`${styles.face} ${styles.back}`}>
      {children ?? (
        <div className={styles.pattern} aria-hidden="true">
          <BackPattern />
          <span className={styles.foil} data-foil-layer aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

/** The physical card: ratio, surface, border and container units for its contents. */
export function CardFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>
}
