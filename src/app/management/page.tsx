import type { Metadata } from 'next'
import Body from '@content/management.mdx'
import { DetailPage } from '@/components/detail-page'
import { cardById } from '@/lib/cards'
import { site } from '@/lib/content'

export const metadata: Metadata = { title: site.management.title, description: site.management.summary }

export default function ManagementPage() {
  const card = cardById('management')!
  return (
    <DetailPage card={card} facts={site.management.facts} summary={site.management.summary}>
      <Body />
    </DetailPage>
  )
}
