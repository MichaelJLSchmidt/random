import type { Metadata } from 'next'
import Link from 'next/link'
import { NotFoundCard, RandomPage } from '@/components/not-found-card'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { caseStudies, site } from '@/lib/content'

export const metadata: Metadata = { title: site.notFound.title }

const routes = ['/', '/projects', '/about', '/contact', ...caseStudies.map((c) => `/work/${c.slug}`)]

export default function NotFound() {
  return (
    <PageTransition>
      <div className="page not-found">
        <NotFoundCard />
        <header className="page-header">
          <p className="meta">404</p>
          <PageTitle>{site.notFound.title}</PageTitle>
          <p className="lede">{site.notFound.body}</p>
          <p className="nf-actions">
            <Link href="/" className="link">
              {site.notFound.homeLink}
            </Link>
            <RandomPage label={site.notFound.randomPage} routes={routes} />
          </p>
        </header>
      </div>
    </PageTransition>
  )
}
