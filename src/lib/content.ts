/*
 * Typed content for pages and components (content/index.ts, typed by
 * content/schema.ts), plus small lookups. Import content from here, never from
 * the JSON or MDX files.
 */
import { content } from '@content/index'
import type { CaseStudy } from '@content/schema'

export type * from '@content/schema'
export { caseStudySectionKeys, managementSectionKeys } from '@content/schema'
export { images } from '@content/index'

export const { site, hand, home, management, moreProjects, about, contact, notFound, coffeeEgg, workshopMethods } =
  content

function validateCaseStudies(list: CaseStudy[]): CaseStudy[] {
  if (list.length !== 3) {
    throw new Error(`Content must have exactly three case studies, found ${list.length}.`)
  }
  const slugs = new Set(list.map((c) => c.slug))
  if (slugs.size !== list.length) throw new Error('Case-study slugs must be unique.')
  for (const c of list) {
    if (!/^[a-z0-9-]+$/.test(c.slug)) throw new Error(`Invalid case-study slug "${c.slug}".`)
    if (c.sections.decisions.items.length !== 4) throw new Error(`"${c.slug}" needs exactly four decisions.`)
    if (c.metrics.length > 5) throw new Error(`"${c.slug}" has more than five metrics.`)
  }
  return list
}

export const caseStudies = validateCaseStudies(content.caseStudies)

export function getCaseStudy(slug: string) {
  const index = caseStudies.findIndex((c) => c.slug === slug)
  if (index === -1) return null
  return { study: caseStudies[index], index }
}

/** "01" … "09": two-digit index labels (cards, sections, counter). */
export const pad2 = (n: number) => String(n).padStart(2, '0')

/** "01" … "04": the small index on a card (0-based input). */
export const cardNumber = (index: number) => pad2(index + 1)

/** Fills {placeholders} in a content template. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? `{${k}}`))
