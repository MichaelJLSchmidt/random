import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cardNumber, caseStudies, getCaseStudy, site } from '@/lib/content'

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

  return (
    <article className="page case-study">
      <header className="case-header">
        <p className="back">
          <Link href="/">{site.caseStudy.backLink}</Link>
        </p>
        <p className="meta">
          {cardNumber(index)} · {study.discipline} · {study.year}
        </p>
        <h1 id="page-heading" tabIndex={-1}>
          {study.title}
        </h1>
        <p className="lede">{study.summary}</p>
        <section aria-labelledby="facts-heading">
          <h2 id="facts-heading" className="sr-only">
            {site.caseStudy.factsHeading}
          </h2>
          <dl className="facts">
            {study.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </header>

      <div className="prose">
        <Body />
      </div>

      <nav className="pager" aria-label="Case studies">
        {previous && (
          <Link href={`/work/${previous.slug}`} rel="prev">
            <span className="meta">{site.caseStudy.previous}</span>
            <span>{previous.title}</span>
          </Link>
        )}
        {next && (
          <Link href={`/work/${next.slug}`} rel="next">
            <span className="meta">{site.caseStudy.next}</span>
            <span>{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  )
}
