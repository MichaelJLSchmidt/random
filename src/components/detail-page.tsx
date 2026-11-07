import Link from 'next/link'
import type { Fact } from '@/lib/content'
import { cardNumber, site } from '@/lib/content'
import type { HandCard } from '@/lib/cards'
import { NAV } from '@/motion/transitions'
import { CaseHero } from './case-hero'
import { NextProject } from './next-project'
import { PageTransition } from './page-transition'

type Props = {
  card: HandCard
  facts: Fact[]
  summary: string
  statement?: string
  children: React.ReactNode
  /** Extra block after the body (e.g. the workshop draw on Management). */
  extra?: React.ReactNode
}

/*
 * Case study and Management share one structure: hero (morph) → H1 → facts row
 * → summary → body on scroll → breaker → "Next project" → contact block.
 */
export function DetailPage({ card, facts, summary, statement, children, extra }: Props) {
  return (
    <PageTransition>
      <article className="detail" data-identity={card.identity} data-detail={card.id}>
        <CaseHero card={card} />
        <div className="detail-body">
          <dl className="facts" data-reveal="tags" data-order="facts" aria-label={site.caseStudy.factsLabel}>
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className="summary" data-reveal="paragraph" data-order="summary">
            {summary}
          </p>
          <div className="prose">{children}</div>
          {extra}
        </div>
        {statement && (
          <section className="breaker" data-reveal="breaker" aria-label={`${cardNumber(card.index)} · ${card.title}`}>
            <p data-reveal="paragraph">{statement}</p>
          </section>
        )}
        <NextProject current={card.id} />
        <section className="contact-block" aria-labelledby="contact-block-title" data-reveal="tags">
          <h2 id="contact-block-title">{site.caseStudy.contactTitle}</h2>
          <p className="muted">{site.caseStudy.contactText}</p>
          <p>
            <Link href="/contact" className="link" transitionTypes={[NAV]}>
              {site.caseStudy.contactLink}
            </Link>
          </p>
        </section>
      </article>
    </PageTransition>
  )
}
