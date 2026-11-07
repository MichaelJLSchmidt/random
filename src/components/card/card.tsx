import type { CaseStudy, Theme } from '@/lib/content'
import { cardNumber, site } from '@/lib/content'
import { TitleFill } from '../title-fill'
import styles from './card.module.css'
import { BackPattern, Motif } from './motif'

/*
 * Original 63:88 card. Faces are plain markup; layouts (deck, hand, stack) and
 * motion (flip, entrance, lift) are applied by the components that place them.
 * Text sits on solid surfaces only; the window and back pattern carry no text.
 */

type FrontProps = {
  study: CaseStudy
  index: number
  headingLevel?: 'h3' | 'p'
  /** Hover fill on the title (cards that are links). */
  fill?: boolean
}

export function CardFront({ study, index, headingLevel: Title = 'p', fill = false }: FrontProps) {
  return (
    <div className={`${styles.face} ${styles.front}`}>
      <div className={styles.topRow} aria-hidden="true">
        <span>
          {cardNumber(index)} <span className={styles.rareTag}>{site.eggs.rareTag}</span>
        </span>
        <span>{study.year}</span>
      </div>
      <Title className={styles.title}>{fill ? <TitleFill>{study.title}</TitleFill> : study.title}</Title>
      <div className={styles.window} data-motif={study.motif}>
        <Motif name={study.motif} />
        <span className={styles.foil} data-foil-layer aria-hidden="true" />
      </div>
      <p className={styles.meta}>
        {study.discipline}, {study.year}
      </p>
      {/* Printed along the long edge; readable once the card is tapped (turned 90°). */}
      <span className={styles.tapLine} data-tap-line="" aria-hidden="true">
        {study.tapLine}
      </span>
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
          <span className={styles.rareChip}>{site.eggs.rareTag}</span>
        </div>
      )}
    </div>
  )
}

/** The physical card: ratio, surface, border and container units for its contents. */
export function CardFrame({
  children,
  className = '',
  tint,
}: {
  children: React.ReactNode
  className?: string
  /** Case-study theme: re-weights the foil gradient for this card. */
  tint?: Theme
}) {
  return (
    <div className={`${styles.card} ${className}`} data-foil-surface data-tint={tint}>
      {children}
    </div>
  )
}
