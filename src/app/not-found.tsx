import type { Metadata } from 'next'
import Link from 'next/link'
import { DiscardedCard } from '@/components/illustrations'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { Reveal } from '@/components/reveals'
import { notFound } from '@/lib/content'
import { RETURN } from '@/motion/transitions'

export const metadata: Metadata = { title: notFound.title }

/**
 * 404: a card lies tilted on the discard pile (DiscardedCard, drawn on first),
 * "This card isn't in the deck." and the way back to the table.
 */
export default function NotFound() {
  return (
    <PageTransition>
      <div className="lost spread-grid" data-identity="ink">
        <div className="lost-discard" aria-hidden="true">
          <span className="lost-zone" />
          <Reveal kind="draw" order={0} className="lost-card">
            <DiscardedCard titleId="discarded-card-title" />
          </Reveal>
        </div>
        <PageTitle className="lost-title t-display">{notFound.title}</PageTitle>
        <Reveal as="p" kind="lines" order={1} className="lost-body t-lead">
          {notFound.body}
        </Reveal>
        <p className="lost-back">
          <Link href="/" className="button" transitionTypes={[RETURN]}>
            {notFound.back}
          </Link>
        </p>
      </div>
    </PageTransition>
  )
}
