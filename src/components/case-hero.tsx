'use client'

import { type ReactNode, useEffect, useRef, useState, ViewTransition } from 'react'
import { headerHeight } from '@/design/layout'
import { cardNumber, pad2 } from '@/lib/format'
import { type HandCard, handCards } from '@/lib/hand-data'
import { cardName, heroShare, heroTitleShare, pageEnter, pageExit, titleName } from '@/motion/transitions'
import { PageTitle } from './page-title'
import { Reveal } from './reveals'

type Props = {
  card: HandCard
  /** The h1 (default: the card's title; Management passes "How I lead"). */
  title?: string
  /** Mono label beside the counter, e.g. "Platform · 2024". */
  label: string
  /** Case study summary, or Management's lead. */
  summary: string
  /**
   * What the played card becomes: the hero <Picture priority> (never inside an
   * image reveal) or an illustration. Rendered by the server page, so this
   * client component never imports page content (D7).
   */
  media: ReactNode
  /** "image" crops a photo to the frame; "illustration" sets a drawing on the card's field. */
  mediaKind?: 'image' | 'illustration'
}

/*
 * The detail hero continues the played card: 72vh on desktop, 64vh on phones.
 * The card's colour is already the page; the card itself lands in the media
 * frame, which slides off the right edge of the table ([data-hero-target],
 * D3). The frame carries the card's view-transition name while it is in view,
 * the h1 carries the title's, so play / switch / return morph into and out of
 * it. Once the frame has scrolled away a 40x56 mini card takes the name, so
 * Back still flies a card into the hand.
 *
 *   desktop   counter + label in the index column; frame from column 6 to the
 *             right edge, full height; the display h1 runs onto the frame,
 *             summary below it in columns 1–5
 *   mobile    counter + label, frame (content start to the right edge), h1
 *             overlapping the frame's lower edge, summary
 */
export function CaseHero({ card, title = card.title, label, summary, media, mediaKind = 'image' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
    })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])

  return (
    <header className="case-hero spread-grid" data-identity={card.identity} data-media={mediaKind}>
      <p className="case-hero-meta t-label">
        <span className="case-hero-counter">
          <span className="case-hero-index">{cardNumber(card.index)}</span> / {pad2(handCards.length)}
        </span>
        <span className="case-hero-label">{label}</span>
      </p>
      <ViewTransition name={inView ? cardName(card.id) : undefined} share={heroShare} enter={pageEnter} exit={pageExit}>
        <div ref={ref} className="case-hero-frame" data-hero-target="">
          {media}
        </div>
      </ViewTransition>
      <div className="case-hero-text">
        <ViewTransition name={titleName(card.id)} share={heroTitleShare} enter="none" exit="none" default="none">
          <PageTitle className="case-hero-title t-display">{title}</PageTitle>
        </ViewTransition>
        <Reveal as="p" kind="lines" order={1} className="case-hero-summary t-lead">
          {summary}
        </Reveal>
      </div>
      {!inView && (
        <ViewTransition name={cardName(card.id)} share={heroShare} default="none">
          <span className="hero-mini" data-identity={card.identity} aria-hidden="true">
            <span className="mono">{cardNumber(card.index)}</span>
          </span>
        </ViewTransition>
      )}
    </header>
  )
}
