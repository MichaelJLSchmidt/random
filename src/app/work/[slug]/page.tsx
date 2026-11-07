import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DetailPage } from '@/components/detail-page'
import { cardById } from '@/lib/cards'
import { caseStudies, getCaseStudy } from '@/lib/content'

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
  const card = cardById(slug)
  if (!entry || !card) notFound()
  const { study } = entry
  const { default: Body } = await import(`@content/work/${slug}.mdx`)
  return (
    <DetailPage card={card} summary={study.summary} statement={study.statement}>
      <Body />
    </DetailPage>
  )
}
