import Link from 'next/link'
import { handCards } from '@/lib/cards'
import { cardNumber, site } from '@/lib/content'
import { SWITCH } from '@/motion/transitions'

/** "Next project": a mini card for the next card in the hand (plays a switch). */
export function NextProject({ current }: { current: string }) {
  const i = handCards.findIndex((c) => c.id === current)
  const next = handCards[(i + 1) % handCards.length]
  return (
    <section className="next-project" aria-labelledby="next-project-title" data-reveal="draw">
      <p id="next-project-title" className="meta">
        {site.caseStudy.nextLabel}
      </p>
      <Link
        href={next.href}
        className="next-card"
        data-identity={next.identity}
        data-play={next.id}
        transitionTypes={[SWITCH]}
      >
        <span className="next-card-face" aria-hidden="true">
          <span className="mono">{cardNumber(next.index)}</span>
        </span>
        <span className="next-card-text">
          <span className="next-card-title">{next.title}</span>
          <span className="muted">{next.projectType}</span>
        </span>
      </Link>
    </section>
  )
}
