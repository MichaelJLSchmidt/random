'use client'

import { useEffect, useRef, useState, ViewTransition } from 'react'
import type { HandCard } from '@/lib/cards'
import { cardNumber, site } from '@/lib/content'
import { cardName, heroShare, heroTitleShare, pageEnter, pageExit, titleName } from '@/motion/transitions'
import { PageTitle } from './page-title'

/*
 * The played card, lying on the table: the same face as the hand card at hero
 * size, with the H1 in its band and the facts at the bottom. It shares the
 * card's view-transition name, so playing is a same-shape zoom from the hand
 * and returning flies it back into its slot. On wide screens it stays in view
 * (sticky, left of the content); on narrow ones a 40x56 mini card takes the
 * name once it has scrolled away.
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
      <div className="hero-slot">
        <ViewTransition
          name={inView ? cardName(card.id) : undefined}
          share={heroShare}
          enter={pageEnter}
          exit={pageExit}
        >
          <div ref={ref} className="card-face hero-card" data-identity={card.identity}>
            <p className="card-top" aria-hidden="true">
              <span>{cardNumber(card.index)}</span>
              <span className="card-year">{card.year}</span>
            </p>
            <div className="card-band">
              <ViewTransition name={titleName(card.id)} share={heroTitleShare} enter="none" exit="none" default="none">
                <PageTitle className="card-title">{card.title}</PageTitle>
              </ViewTransition>
              <p className="card-type">{card.projectType}</p>
            </div>
            <p className="card-summary">{card.inspect}</p>
            <dl className="card-facts" aria-label={site.caseStudy.factsLabel}>
              {card.facts.map((f) => (
                <div key={f.label} className="card-fact">
                  <dt className="card-fact-label">{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </ViewTransition>
      </div>
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
