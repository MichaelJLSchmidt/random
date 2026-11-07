import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { site } from '@/lib/content'
import { RETURN } from '@/motion/transitions'

export const metadata: Metadata = { title: site.notFound.title }

export default function NotFound() {
  return (
    <PageTransition>
      <div className="page not-found" data-identity="ink">
        <div className="discard" aria-hidden="true">
          <span className="discard-zone" />
          <span className="discard-card" data-discard="" />
        </div>
        <PageTitle>{site.notFound.title}</PageTitle>
        <p className="lede muted" data-reveal="paragraph" data-order="summary">
          {site.notFound.body}
        </p>
        <p data-reveal="tags" data-order="chrome">
          <Link href="/" className="link" transitionTypes={[RETURN]}>
            {site.notFound.back}
          </Link>
        </p>
      </div>
    </PageTransition>
  )
}
