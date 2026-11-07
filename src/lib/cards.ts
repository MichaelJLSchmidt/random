import { cardIdentity, handLabels, handOrder, managementCard, railLabel } from '@content/cards'
import type { Identity } from '@/design/palette'
import { caseStudies } from './content'

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
  index: number
}

export const handCards: HandCard[] = handOrder.map((id, index) => {
  if (id === 'management') {
    return {
      id,
      href: '/management',
      title: managementCard.title,
      projectType: managementCard.projectType,
      identity: cardIdentity[id],
      railLabel: railLabel[id],
      inspect: managementCard.summary,
      index,
    }
  }
  const study = caseStudies.find((c) => c.slug === id)
  if (!study) throw new Error(`content/cards.ts lists "${id}", which is not in case-studies.json.`)
  return {
    id,
    href: `/work/${id}`,
    title: study.title,
    projectType: study.projectType,
    identity: cardIdentity[id],
    railLabel: railLabel[id],
    inspect: study.inspect,
    index,
  }
})

export const cardById = (id: string | null | undefined) => handCards.find((c) => c.id === id) ?? null

/** The hand card a path belongs to (/work/<slug> or /management), if any. */
export function cardForPath(pathname: string) {
  const path = pathname.replace(/\/$/, '')
  return handCards.find((c) => c.href === path) ?? null
}

export { handLabels }
