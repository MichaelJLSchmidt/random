import type { Metadata } from 'next'
import Link from 'next/link'
import { Deck } from '@/components/card/deck'
import { site } from '@/lib/content'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'

export const metadata: Metadata = { title: site.notFound.title }

export default function NotFound() {
  return (
    <PageTransition>
      <div className="page not-found">
        <Deck />
        <header className="page-header">
          <p className="meta">404</p>
          <PageTitle>{site.notFound.title}</PageTitle>
          <p className="lede">{site.notFound.body}</p>
          <p>
            <Link href="/" className="link">
              {site.notFound.homeLink}
            </Link>
          </p>
        </header>
      </div>
    </PageTransition>
  )
}
