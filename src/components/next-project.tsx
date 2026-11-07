import { handCards } from '@/lib/cards'
import { cardNumber, site } from '@/lib/content'
import { SWITCH } from '@/motion/transitions'
import { PlayLink } from './play-link'

/** "Next project": a mini card for the next card in the hand; it plays that card from the hand (a switch). */
export function NextProject({ current }: { current: string }) {
  const i = handCards.findIndex((c) => c.id === current)
  const next = handCards[(i + 1) % handCards.length]
  return (
    <section className="next-project" aria-labelledby="next-project-title" data-reveal="draw">
      <p id="next-project-title" className="meta">
        {site.caseStudy.nextLabel}
      </p>
      <PlayLink
        id={next.id}
        href={next.href}
        className="next-card"
        data-identity={next.identity}
        transitionTypes={[SWITCH]}
      >
        <span className="next-card-face" aria-hidden="true">
          <span className="mono">{cardNumber(next.index)}</span>
        </span>
        <span className="next-card-text">
          <span className="next-card-title">{next.title}</span>
          <span className="muted">{next.projectType}</span>
        </span>
      </PlayLink>
    </section>
  )
}
