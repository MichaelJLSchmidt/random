import Link from 'next/link'
import type { ReactNode } from 'react'
import { type Metric, site } from '@/lib/content'
import type { HandCard } from '@/lib/cards'
import { NAV } from '@/motion/transitions'
import { CaseHero } from './case-hero'
import { type MetaPair, MetaPairs, Minimap, type MinimapSection, Scoreboard } from './layout'
import { PageTransition } from './page-transition'

type Props = {
  card: HandCard
  summary: string
  /** Five pairs on case studies, the facts on Management. */
  meta?: MetaPair[]
  metrics?: Metric[]
  statement?: string
  /** Sections for the Minimap (ids of the [data-section] blocks in children). */
  sections?: MinimapSection[]
  /** The numbered sections (Spread grid). */
  children: ReactNode
}

/*
 * Case study and Management (skeleton; Layout & Pages owns it in Wave 1).
 *   hero zone   the played card lies on the table at the left (sticky, shares
 *               the hand card's view-transition name), summary, MetaPairs and
 *               Scoreboard on its right; narrow screens stack
 *   sections    full-width Spread grid sections (children), the statement
 *   end         contact block; the Minimap at the right edge from 1024 px
 */
export function DetailPage({ card, summary, meta, metrics, statement, sections, children }: Props) {
  return (
    <PageTransition>
      <article className="detail-page" data-identity={card.identity} data-detail={card.id}>
        <div className="detail">
          <CaseHero card={card} />
          <div className="detail-body">
            <p className="summary" data-reveal="paragraph" data-order="summary">
              {summary}
            </p>
            {meta && <MetaPairs items={meta} label={site.labels.facts} />}
            {metrics && <Scoreboard metrics={metrics} />}
          </div>
        </div>
        <div className="detail-sections">{children}</div>
        {statement && (
          <section className="spread-grid detail-statement" aria-label={card.title}>
            <div className="breaker col-content" data-reveal="breaker">
              <p data-reveal="paragraph">{statement}</p>
            </div>
          </section>
        )}
        <div className="spread-grid detail-end">
          <section className="contact-block col-content" aria-labelledby="contact-block-title" data-reveal="tags">
            <h2 id="contact-block-title">{site.labels.contactTitle}</h2>
            <p>{site.labels.contactText}</p>
            <p>
              <Link href="/contact" className="button" transitionTypes={[NAV]}>
                {site.labels.contactLink}
              </Link>
            </p>
          </section>
        </div>
        {sections && sections.length > 0 && <Minimap sections={sections} />}
      </article>
    </PageTransition>
  )
}
