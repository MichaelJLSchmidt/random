'use client'

import { useEffect, useRef, useState, ViewTransition } from 'react'
import type { HandCard } from '@/lib/cards'
import { cardNumber } from '@/lib/content'
import { cardName, heroShare, heroTitleShare, pageEnter, pageExit, titleName } from '@/motion/transitions'
import { PageTitle } from './page-title'

/*
 * Full-bleed hero in the card's colour (72vh); the H1 sits in its ink-on-glow
 * band. It holds the card's view-transition name (the hand card morphs into it
 * on play and back on return) until it scrolls out of view; then a 40x56 mini
 * card fixed at the top left takes the name, so a return from far down the
 * page still flies into the slot.
 */
export function CaseHero({ card }: { card: HandCard }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) * 16 || 64
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: `-${header}px 0px 0px 0px`,
    })
    io.observe(ref.current!)
    return () => io.disconnect()
  }, [])

  return (
    <header className="hero" data-identity={card.identity}>
      <ViewTransition name={inView ? cardName(card.id) : undefined} share={heroShare} enter={pageEnter} exit={pageExit}>
        <div ref={ref} className="hero-card">
          <p className="hero-index mono" aria-hidden="true">
            {cardNumber(card.index)}
          </p>
          <div className="hero-band">
            <ViewTransition name={titleName(card.id)} share={heroTitleShare} enter="none" exit="none" default="none">
              <PageTitle className="hero-title">{card.title}</PageTitle>
            </ViewTransition>
            <p className="hero-type">{card.projectType}</p>
          </div>
        </div>
      </ViewTransition>
      {!inView && (
        <ViewTransition name={cardName(card.id)} share={heroShare} default="none">
          <span className="hero-mini" aria-hidden="true">
            <span className="mono">{cardNumber(card.index)}</span>
          </span>
        </ViewTransition>
      )}
    </header>
  )
}
