/*
 * The hand's data: the four cards' metadata (ids, labels, identities, card
 * copy) and the Coffee egg card. A slim module: the hand ships in every page's
 * client bundle and loads only this (through src/lib/hand-data.ts), so it must
 * never import page text (case-study sections, About, Management). Full page
 * modules may import from here, not the other way round.
 * Today it adapts cards.ts and the card fields of case-studies.json /
 * site.json; the Content & Images session may restructure it as long as it
 * keeps `hand: HandContent` and `coffeeEgg: CoffeeEgg`.
 */
import caseStudiesJson from './case-studies.json'
import { cardIdentity, handLabels, handOrder, managementCard, railLabel } from './cards'
import type { CoffeeEgg, Fact, HandCardCopy, HandContent } from './schema'
import siteJson from './site.json'

const TBD = 'To be written.'

/** Card facts: role, team, timeframe, client (the old "Client type" is shown as client). */
const cardFacts = (facts: Fact[]): Fact[] =>
  ['Role', 'Team', 'Timeframe', 'Client type'].map((label) => ({
    label: label === 'Client type' ? 'Client' : label,
    value: facts.find((f) => f.label === label)?.value ?? TBD,
  }))

const cards: Record<string, HandCardCopy> = Object.fromEntries(
  caseStudiesJson.map((c) => [
    c.slug,
    {
      title: c.title,
      type: c.projectType,
      year: c.year,
      inspect: c.inspect,
      tapLine: c.tapLine,
      facts: cardFacts(c.facts),
    },
  ]),
)
cards.management = {
  title: managementCard.title,
  type: managementCard.projectType,
  year: managementCard.year,
  inspect: managementCard.summary,
  tapLine: managementCard.tapLine,
  facts: cardFacts(siteJson.management.facts),
}

export const hand: HandContent = {
  order: handOrder,
  identity: cardIdentity,
  railLabel,
  cards,
  labels: handLabels,
}

export const coffeeEgg: CoffeeEgg = {
  title: siteJson.eggs.coffee.title,
  body: TBD,
  cta: siteJson.eggs.coffee.projectType,
}
