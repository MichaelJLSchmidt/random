import type { Metadata } from 'next'
import Link from 'next/link'
import { DiscardedCard } from '@/components/illustrations'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { notFound } from '@/lib/content'
import { RETURN } from '@/motion/transitions'

export const metadata: Metadata = { title: notFound.title }

/** 404: a card falls face down into the discard zone (egg), then the way back. */
export default function NotFound() {
  return (
    <PageTransition>
      <div className="page not-found" data-identity="ink">
        <div className="discard" aria-hidden="true" data-reveal="discard" data-order="title">
          <span className="discard-zone" />
          <span className="discard-card" data-discard="" />
          <DiscardedCard className="discard-illustration" titleId="discarded-card-title" />
        </div>
        <PageTitle>{notFound.title}</PageTitle>
        <p className="lede muted" data-reveal="paragraph" data-order="summary">
          {notFound.body}
        </p>
        <p data-reveal="tags" data-order="chrome">
          <Link href="/" className="link" transitionTypes={[RETURN]}>
            {notFound.back}
          </Link>
        </p>
      </div>
    </PageTransition>
  )
}
