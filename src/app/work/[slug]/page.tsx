import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DetailPage } from '@/components/detail-page'
import { Spread } from '@/components/layout'
import { cardById } from '@/lib/cards'
import { caseStudies, caseStudySectionKeys, getCaseStudy, site } from '@/lib/content'
import { CaseSections } from './case-sections'

export const dynamicParams = false

export function generateStaticParams() {
  return caseStudies.map(({ slug }) => ({ slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = getCaseStudy((await params).slug)
  return entry ? { title: entry.study.title, description: entry.study.summary } : {}
}

/** A case study (skeleton): hero zone, the hero image as a Spread, sections 01 Context … 09 Next. */
export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const entry = getCaseStudy(slug)
  const card = cardById(slug)
  if (!entry || !card) notFound()
  const { study } = entry
  const labels = site.labels.meta
  const meta = (['client', 'timeframe', 'role', 'team', 'type'] as const).map((k) => ({
    label: labels[k],
    value: study.meta[k],
  }))
  const sections = caseStudySectionKeys.map((key) => ({ id: key, label: study.sections[key].label }))
  return (
    <DetailPage
      card={card}
      summary={study.summary}
      meta={meta}
      metrics={study.metrics}
      statement={study.statement}
      sections={sections}
    >
      <Spread image={study.heroImage} caption={study.title} />
      <CaseSections study={study} />
    </DetailPage>
  )
}
