/*
 * The slim, client-safe content layer: the four hand cards (metadata only),
 * the Coffee card and the site chrome labels. Client components (the hand,
 * header, eggs, table store, play, case hero, DealRow) import content from
 * here, never from src/lib/content.ts, so page text (case-study sections,
 * About, Management) stays out of the shared client bundle.
 * Foundation-owned. Contract: docs/contracts.md#hand.
 */
import { coffeeEgg, hand } from '@content/hand'
import type { Fact } from '@content/schema'
import { site } from '@content/site'
import type { Identity } from '@/design/palette'

export { coffeeEgg, site }

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

/** The hand: exactly four cards (three case studies and Management), in content order. */
export const handCards: HandCard[] = hand.order.map((id, index) => {
  const card = hand.cards[id]
  if (!card) throw new Error(`content/hand.ts lists "${id}" in order but has no card for it.`)
  return {
    id,
    href: id === 'management' ? '/management' : `/work/${id}`,
    title: card.title,
    projectType: card.type,
    identity: hand.identity[id],
    railLabel: hand.railLabel[id],
    inspect: card.inspect,
    tapLine: card.tapLine,
    year: card.year,
    facts: card.facts,
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
