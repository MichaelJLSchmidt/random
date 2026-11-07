import type { HandCard } from '@/lib/cards'
import { cardNumber } from '@/lib/content'

/*
 * A hand card's face: the identity's field with a soft glow from the bottom
 * left, a 1px accent inner edge at 30%, a small mono index and an
 * ink-on-glow band with the plain title and project type. Original design:
 * no frames, symbols or icons from any card game.
 */
export function CardFace({ card }: { card: HandCard }) {
  return (
    <span className="card-face" data-identity={card.identity}>
      <span className="card-index" aria-hidden="true">
        {cardNumber(card.index)}
      </span>
      <span className="card-band">
        <span className="card-title" data-card-title={card.id}>
          {card.title}
        </span>
        <span className="card-type">{card.projectType}</span>
      </span>
    </span>
  )
}

/** The back of a card: fine diagonal lines in a thin inner frame, with a small two-card mark. */
export function CardBack() {
  return <span className="card-back" aria-hidden="true" />
}
