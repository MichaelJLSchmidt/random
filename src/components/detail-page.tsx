import Link from 'next/link'
import { site } from '@/lib/content'
import type { HandCard } from '@/lib/cards'
import { NAV } from '@/motion/transitions'
import { CaseHero } from './case-hero'
import { NextProject } from './next-project'
import { PageTransition } from './page-transition'

type Props = {
  card: HandCard
  summary: string
  statement?: string
  children: React.ReactNode
  /** Extra block after the body (e.g. the workshop draw on Management). */
  extra?: React.ReactNode
}

/*
 * Case study and Management share one structure: the played card (hero, with
 * the H1 and the facts) lies on the table at the left; the page reads on its
 * right: summary, body, statement, "Next project", contact block. On narrow
 * screens everything stacks under the card.
 */
export function DetailPage({ card, summary, statement, children, extra }: Props) {
  return (
    <PageTransition>
      <article className="detail" data-identity={card.identity} data-detail={card.id}>
        <CaseHero card={card} />
        <div className="detail-body">
          <p className="summary" data-reveal="paragraph" data-order="summary">
            {summary}
          </p>
          <div className="prose">{children}</div>
          {extra}
          {statement && (
            <section className="breaker" data-reveal="breaker" aria-label={card.title}>
              <p data-reveal="paragraph">{statement}</p>
            </section>
          )}
          <NextProject current={card.id} />
          <section className="contact-block" aria-labelledby="contact-block-title" data-reveal="tags">
            <h2 id="contact-block-title">{site.caseStudy.contactTitle}</h2>
            <p>{site.caseStudy.contactText}</p>
            <p>
              <Link href="/contact" className="button" transitionTypes={[NAV]}>
                {site.caseStudy.contactLink}
              </Link>
            </p>
          </section>
        </div>
      </article>
    </PageTransition>
  )
}
