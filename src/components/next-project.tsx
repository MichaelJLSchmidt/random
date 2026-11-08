import { cardById, nextCard } from '@/lib/cards'
import { site } from '@/lib/content'
import { SWITCH } from '@/motion/transitions'
import { CardFace } from './hand/card-face'
import { PlayLink } from './play-link'

/**
 * "Next project": the next card of the hand (or `next`), face up; it plays
 * that card from the hand (a switch).
 */
export function NextProject({ current, next: nextId }: { current: string; next?: string }) {
  const next = cardById(nextId) ?? nextCard(current)
  return (
    <section className="next-project" aria-labelledby="next-project-title" data-reveal="draw">
      <p id="next-project-title" className="meta">
        {site.labels.next}
      </p>
      <PlayLink id={next.id} href={next.href} className="next-card" transitionTypes={[SWITCH]}>
        <span className="next-card-face" aria-hidden="true">
          <CardFace card={next} named={false} />
        </span>
        <span className="next-card-text">
          <span className="next-card-title">{next.title}</span>
          <span className="next-card-type">{next.projectType}</span>
        </span>
      </PlayLink>
    </section>
  )
}
