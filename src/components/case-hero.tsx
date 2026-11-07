import type { HandCard } from '@/lib/cards'
import { cardNumber } from '@/lib/content'
import { PageTitle } from './page-title'

/** Full-bleed hero in the card's colour (72vh); the H1 sits in its band. */
export function CaseHero({ card }: { card: HandCard }) {
  return (
    <header className="hero" data-identity={card.identity}>
      <div className="hero-card">
        <p className="hero-index mono">{cardNumber(card.index)}</p>
        <div className="hero-band">
          <PageTitle className="hero-title">{card.title}</PageTitle>
          <p className="hero-type">{card.projectType}</p>
        </div>
      </div>
    </header>
  )
}
