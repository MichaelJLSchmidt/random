import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DetailPage } from '@/components/detail-page'
import { Picture } from '@/components/picture'
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

/**
 * A case study: the hero continues the played card, MetaPairs and the
 * Scoreboard, then 01 Context … 09 Next on the Spread grid, Minimap at the
 * right edge. One template for all three cases.
 */
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
      label={`${card.projectType} · ${card.year}`}
      summary={study.summary}
      media={
        <Picture
          id={study.heroImage}
          priority
          sizes="(min-width: 1440px) 66vw, (min-width: 1024px) 62vw, 92vw"
          className="case-hero-picture hero-drift"
        />
      }
      meta={meta}
      metrics={study.metrics}
      sections={sections}
    >
      <CaseSections study={study} />
    </DetailPage>
  )
}
