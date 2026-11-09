/*
 * Typed content for pages and server components (content/index.ts, typed by
 * content/schema.ts), plus the build-time checks of the counts the contract
 * fixes. Server side: client components import from src/lib/hand-data.ts
 * instead, so page text stays out of the client bundle.
 */
import { content } from '@content/index'
import { handCards } from './hand-data'

export type * from '@content/schema'
export { aboutSectionKeys, caseStudySectionKeys, managementSectionKeys } from '@content/schema'
export { images } from '@content/index'
export { cardNumber, fill, pad2 } from './format'

export const { site, hand, home, management, moreProjects, about, contact, notFound, coffeeEgg, workshopMethods } =
  content

/** Fails the build with a pointer to the contract when content breaks a fixed count. */
function expect(ok: boolean, message: string) {
  if (!ok) throw new Error(`Content contract (docs/contracts.md#content-schema): ${message}`)
}
const count = (what: string, list: unknown[], n: number) =>
  expect(list.length === n, `${what} must have exactly ${n}, found ${list.length}.`)

function validate() {
  const studies = content.caseStudies
  count('caseStudies', studies, 3)
  expect(new Set(studies.map((c) => c.slug)).size === studies.length, 'case-study slugs must be unique.')
  studies.forEach((c, i) => {
    expect(/^[a-z0-9-]+$/.test(c.slug), `invalid case-study slug "${c.slug}".`)
    expect(c.number === String(i + 1).padStart(2, '0'), `"${c.slug}".number must be "0${i + 1}".`)
    count(`"${c.slug}".metrics`, c.metrics, 5)
    count(`"${c.slug}".sections.decisions.items`, c.sections.decisions.items, 4)
    count(`"${c.slug}".sections.approach.steps`, c.sections.approach.steps, 4)
    const card = handCards.find((h) => h.id === c.slug)
    expect(Boolean(card), `"${c.slug}" is not a hand card (content/hand.ts).`)
    expect(card?.title === c.title, `hand card title "${card?.title}" must equal the case study title "${c.title}".`)
    expect(card?.identity === c.identity, `"${c.slug}".identity must equal hand.identity.`)
  })
  count('management.principles.items', content.management.principles.items, 5)
  count('management.metrics.items', content.management.metrics.items, 5)
  count('about.timeline.items', content.about.timeline.items, 7)
  count('about.howIWork.items', content.about.howIWork.items, 4)
  count('about.onTheTable.items', content.about.onTheTable.items, 5)
  count('home.bring.items', content.home.bring.items, 3)
}
validate()

export const caseStudies = content.caseStudies

export function getCaseStudy(slug: string) {
  const index = caseStudies.findIndex((c) => c.slug === slug)
  if (index === -1) return null
  return { study: caseStudies[index], index }
}
