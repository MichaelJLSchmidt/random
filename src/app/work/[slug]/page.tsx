import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CardBack, CardFront } from '@/components/card/card'
import { CaseStudyCard } from '@/components/card/case-study-card'
import cardStyles from '@/components/card/layouts.module.css'
import { FlipCard } from '@/components/card/flip-card'
import { PageTransition } from '@/components/page-transition'
import { Statement } from '@/components/statement'
import { cardNumber, caseStudies, getCaseStudy, site } from '@/lib/content'
import { cardType, navBack, navForward } from '@/motion/transitions'
import { PageTitle } from '@/components/page-title'

export const dynamicParams = false

export function generateStaticParams() {
  return caseStudies.map(({ slug }) => ({ slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getCaseStudy((await params).slug)
  return entry ? { title: entry.study.title, description: entry.study.summary } : {}
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const entry = getCaseStudy(slug)
  if (!entry) notFound()
  const { study, index, previous, next } = entry
  const { default: Body } = await import(`@content/work/${slug}.mdx`)

  const facts = (
    <dl>
      {study.facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )

  return (
    <PageTransition>
      <article className="page case-study" data-tint={study.theme}>
        <div className="case-grid">
          <header className="case-intro">
            <p className="back">
              <Link href="/" className="link" transitionTypes={[navBack, cardType(study.slug)]}>
                {site.caseStudy.backLink}
              </Link>
            </p>
            <p className="meta">
              {cardNumber(index)} · {study.discipline} · {study.year}
            </p>
            <PageTitle>{study.title}</PageTitle>
            <p className="lede">{study.summary}</p>
          </header>
          <div className="case-card" data-hero="">
            <FlipCard
              slug={study.slug}
              labels={{
                toBack: site.caseStudy.flipToBack,
                toFront: site.caseStudy.flipToFront,
                showingBack: site.caseStudy.showingBack,
                showingFront: site.caseStudy.showingFront,
              }}
              front={<CardFront study={study} index={index} />}
              back={
                <CardBack>
                  <section className={cardStyles.facts} aria-labelledby="facts-heading">
                    <h2 id="facts-heading">{site.caseStudy.factsHeading}</h2>
                    {facts}
                  </section>
                </CardBack>
              }
              noScript={
                <section className="facts-fallback" aria-label={site.caseStudy.factsHeading}>
                  {facts}
                </section>
              }
            />
          </div>

          <div className="case-statement">
            <Statement>{study.statement}</Statement>
          </div>

          <div className="prose">
            <Body />
          </div>
        </div>

        <nav className="pager" aria-label="Case studies" data-reveal="">
          {[previous, next].map((other, i) =>
            other ? (
              <div key={other.slug} className="pager-item" data-rel={i === 0 ? 'prev' : 'next'}>
                <CaseStudyCard
                  study={other}
                  index={caseStudies.indexOf(other)}
                  label={i === 0 ? site.caseStudy.previousLabel : site.caseStudy.nextLabel}
                  direction={i === 0 ? navBack : navForward}
                />
              </div>
            ) : null,
          )}
        </nav>
      </article>
    </PageTransition>
  )
}
