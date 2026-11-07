import Link from 'next/link'
import type { CaseStudy } from '@/lib/content'
import { CardFrame, CardFront } from './card'
import styles from './layouts.module.css'

type Props = {
  study: CaseStudy
  index: number
  /** Visible label above the card, inside the link, e.g. "Next case study". */
  label?: string
  headingLevel?: 'h3' | 'p'
  transitionTypes?: string[]
}

/**
 * A case-study card that is a link. Its name comes from its visible text
 * (label, title, discipline and year); the corner number is decorative.
 */
export function CaseStudyCard({ study, index, label, headingLevel, transitionTypes }: Props) {
  return (
    <Link
      href={`/work/${study.slug}`}
      className={styles.cardLink}
      data-return-focus={`/work/${study.slug}`}
      transitionTypes={transitionTypes}
    >
      {label && <span className={`meta ${styles.cardLabel}`}>{label}</span>}
      <CardFrame>
        <CardFront study={study} index={index} headingLevel={headingLevel} />
      </CardFrame>
    </Link>
  )
}
