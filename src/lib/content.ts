import caseStudiesJson from '@content/case-studies.json'
import projectsJson from '@content/projects.json'
import siteJson from '@content/site.json'
import workshopsJson from '@content/workshops.json'

export type Fact = { label: string; value: string }

export type CaseStudy = {
  slug: string
  title: string
  /** Short plain type shown on the card band, e.g. "Platform". */
  projectType: string
  summary: string
  /** One-line summary shown when a card is inspected. */
  inspect: string
  /** The case study's one large statement (full-bleed breaker). */
  statement: string
  /** Printed along the card's long edge; readable when the card is tapped. */
  tapLine: string
  year: string
  /** Role, team, timeframe, client type. */
  facts: Fact[]
}

export type Project = { title: string; year: string; projectType: string; clientType: string }

export const site = siteJson
export const projects: Project[] = projectsJson
export const workshops: { title: string; howTo: string }[] = workshopsJson

function validateCaseStudies(list: CaseStudy[]): CaseStudy[] {
  if (list.length !== 3) {
    throw new Error(`content/case-studies.json must list exactly three case studies, found ${list.length}.`)
  }
  const slugs = new Set(list.map((c) => c.slug))
  if (slugs.size !== list.length) throw new Error('Case-study slugs must be unique.')
  for (const c of list) {
    if (!/^[a-z0-9-]+$/.test(c.slug)) throw new Error(`Invalid case-study slug "${c.slug}".`)
  }
  return list
}

export const caseStudies = validateCaseStudies(caseStudiesJson as CaseStudy[])

export function getCaseStudy(slug: string) {
  const index = caseStudies.findIndex((c) => c.slug === slug)
  if (index === -1) return null
  return { study: caseStudies[index], index }
}

/** "01" … "04": the small index on a card. */
export const cardNumber = (index: number) => String(index + 1).padStart(2, '0')
