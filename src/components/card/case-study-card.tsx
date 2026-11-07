import Link from 'next/link'
import type { CaseStudy } from '@/lib/content'
import { cardType, navForward } from '@/motion/transitions'
import { CardBack, CardFrame, CardFront } from './card'
import { CardMorph } from './card-morph'
import styles from './layouts.module.css'

type Props = {
  study: CaseStudy
  index: number
  /** Visible label above the card, inside the link, e.g. "Next case study". */
  label?: string
  headingLevel?: 'h3' | 'p'
  /** Direction of the navigation this card starts. */
  direction?: string
  /** Give the card a back face so it can be dealt face down and flipped. */
  flippable?: boolean
}

/**
 * A case-study card that is a link. Its name comes from its visible text
 * (label, title, discipline and year); the corner number is decorative.
 */
export function CaseStudyCard({ study, index, label, headingLevel, direction = navForward, flippable }: Props) {
  const front = <CardFront study={study} index={index} headingLevel={headingLevel} />
  return (
    <Link
      href={`/work/${study.slug}`}
      className={styles.cardLink}
      data-return-focus={`/work/${study.slug}`}
      transitionTypes={[direction, cardType(study.slug)]}
    >
      {label && <span className={`meta ${styles.cardLabel}`}>{label}</span>}
      <CardMorph slug={study.slug}>
        <CardFrame>
          {flippable ? (
            <div className={styles.flipper} data-flipper="">
              {front}
              <CardBack />
            </div>
          ) : (
            front
          )}
        </CardFrame>
      </CardMorph>
    </Link>
  )
}
