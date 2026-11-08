import type { Identity } from '@/design/palette'
import { type Fact, caseStudies, hand, management, site } from './content'

/** One card of the hand (navigation). */
export type HandCard = {
  id: string
  href: string
  title: string
  projectType: string
  identity: Identity
  railLabel: string
  /** One line for Inspect. */
  inspect: string
  /** Printed along the long edge; readable when the card is turned sideways (Tap). */
  tapLine: string
  /** Shown on the card face: years, then role / team / timeframe / client. */
  year: string
  facts: Fact[]
  index: number
}

const { meta: metaLabels } = site.labels

/** The hand: exactly four cards (three case studies and Management), in content order. */
export const handCards: HandCard[] = hand.order.map((id, index) => {
  if (id === 'management') {
    return {
      id,
      href: '/management',
      title: management.title,
      projectType: management.projectType,
      identity: hand.identity[id],
      railLabel: hand.railLabel[id],
      inspect: management.card.inspect,
      tapLine: management.card.tapLine,
      year: management.card.year,
      facts: management.facts,
      index,
    }
  }
  const study = caseStudies.find((c) => c.slug === id)
  if (!study) throw new Error(`content/cards.ts lists "${id}", which is not a case study.`)
  return {
    id,
    href: `/work/${id}`,
    title: study.title,
    projectType: study.meta.type,
    identity: hand.identity[id],
    railLabel: hand.railLabel[id],
    inspect: study.card.inspect,
    tapLine: study.card.tapLine,
    year: study.card.year,
    facts: [
      { label: metaLabels.role, value: study.meta.role },
      { label: metaLabels.team, value: study.meta.team },
      { label: metaLabels.timeframe, value: study.meta.timeframe },
      { label: metaLabels.client, value: study.meta.client },
    ],
    index,
  }
})

if (handCards.length !== 4) throw new Error(`The hand must have exactly four cards, found ${handCards.length}.`)

export const cardById = (id: string | null | undefined) => handCards.find((c) => c.id === id) ?? null

/** The hand card a path belongs to (/work/<slug> or /management), if any. */
export function cardForPath(pathname: string) {
  const path = pathname.replace(/\/$/, '') || '/'
  return handCards.find((c) => c.href === path) ?? null
}

/** The card after `id` in hand order (wraps), for "Next project". */
export function nextCard(id: string) {
  const i = handCards.findIndex((c) => c.id === id)
  return handCards[(i + 1) % handCards.length]
}

export const handLabels = hand.labels
