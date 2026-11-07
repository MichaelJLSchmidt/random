import Link from 'next/link'
import type { CaseStudy } from '@/lib/content'
import { cardType, navForward } from '@/motion/transitions'
import { CardFrame, CardFront } from './card'
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
}

/**
 * A case-study card that is a link. Its name comes from its visible text
 * (label, title, discipline and year); the corner number is decorative.
 */
export function CaseStudyCard({ study, index, label, headingLevel, direction = navForward }: Props) {
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
          <CardFront study={study} index={index} headingLevel={headingLevel} />
        </CardFrame>
      </CardMorph>
    </Link>
  )
}
