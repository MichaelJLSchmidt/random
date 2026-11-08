import { ViewTransition } from 'react'
import { cardNumber } from '@/lib/format'
import type { HandCard } from '@/lib/hand-data'
import { cardName, handShare, handTitleShare, titleName } from '@/motion/transitions'

/*
 * A card's face, one design at every size (it scales with container-query
 * units): index and years, an ink-on-glow band with the title and project
 * type, a one-line summary and the facts. The field colour carries a soft glow
 * from the bottom left and a 1px accent edge at 30%. Original design: no
 * frames, symbols or icons from any card game.
 *
 * In the hand the face carries the view-transition names (card-<slug>,
 * card-title-<slug>), so it is rendered once per card: the open card's slot
 * shows the ghost instead, and the "Next project" copy is unnamed. The detail
 * hero (case-hero.tsx) renders the same face with the H1 in the band.
 */
export function CardFace({ card, named = true }: { card: HandCard; named?: boolean }) {
  const title = <span className="card-title">{card.title}</span>
  const face = (
    <span className="card-face" data-identity={card.identity}>
      <span className="card-top" aria-hidden="true">
        <span>{cardNumber(card.index)}</span>
        <span className="card-year">{card.year}</span>
      </span>
      <span className="card-band">
        {named ? (
          <ViewTransition name={titleName(card.id)} share={handTitleShare} default="none">
            {title}
          </ViewTransition>
        ) : (
          title
        )}
        <span className="card-type">{card.projectType}</span>
      </span>
      <span className="card-summary" aria-hidden="true">
        {card.inspect}
      </span>
      <span className="card-facts" aria-hidden="true">
        {card.facts.map((f) => (
          <span key={f.label} className="card-fact">
            <span className="card-fact-label">{f.label}</span>
            <span>{f.value}</span>
          </span>
        ))}
      </span>
      {/* Tap egg: the line on the long edge, readable once the card is turned sideways (announced). */}
      <span className="card-tapline" aria-hidden="true">
        {card.tapLine}
      </span>
    </span>
  )
  return named ? (
    <ViewTransition name={cardName(card.id)} share={handShare} default="none">
      {face}
    </ViewTransition>
  ) : (
    face
  )
}

/** The back of a card: fine diagonal lines in a thin inner frame, with a small two-card mark. */
export function CardBack() {
  return <span className="card-back" aria-hidden="true" />
}
