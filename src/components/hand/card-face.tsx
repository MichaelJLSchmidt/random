import { ViewTransition } from 'react'
import type { HandCard } from '@/lib/cards'
import { cardNumber } from '@/lib/content'
import { cardName, handShare, handTitleShare, titleName } from '@/motion/transitions'

/*
 * A hand card's face: the identity's field with a soft glow from the bottom
 * left, a 1px accent inner edge at 30%, a small mono index and an
 * ink-on-glow band with the plain title and project type. Original design:
 * no frames, symbols or icons from any card game. It carries the card's
 * view-transition names (card-<slug>, card-title-<slug>), so it must only be
 * rendered once per card: the open card's slot shows the ghost instead.
 */
export function CardFace({ card }: { card: HandCard }) {
  return (
    <ViewTransition name={cardName(card.id)} share={handShare} default="none">
      <span className="card-face" data-identity={card.identity}>
        <span className="card-index" aria-hidden="true">
          {cardNumber(card.index)}
        </span>
        <span className="card-band">
          <ViewTransition name={titleName(card.id)} share={handTitleShare} default="none">
            <span className="card-title">{card.title}</span>
          </ViewTransition>
          <span className="card-type">{card.projectType}</span>
        </span>
      </span>
    </ViewTransition>
  )
}

/** The back of a card: fine diagonal lines in a thin inner frame, with a small two-card mark. */
export function CardBack() {
  return <span className="card-back" aria-hidden="true" />
}
