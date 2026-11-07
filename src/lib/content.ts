import caseStudiesJson from '@content/case-studies.json'
import contactJson from '@content/contact.json'
import projectsJson from '@content/projects.json'
import siteJson from '@content/site.json'

export type Motif = 'rings' | 'grid' | 'waves'
export type Theme = 'people-leadership' | 'platform' | 'service-delivery'

export type CaseStudy = {
  slug: string
  title: string
  theme: Theme
  summary: string
  /** One large statement, filled word by word as it crosses the viewport. */
  statement: string
  year: string
  discipline: string
  motif: Motif
  facts: { label: string; value: string }[]
}

export type Project = {
  title: string
  year: string
  kind: string
  description: string
  href?: string
}

export const site = siteJson
export const contact = contactJson
export const projects: Project[] = projectsJson

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
  return {
    study: caseStudies[index],
    index,
    previous: caseStudies[index - 1] ?? null,
    next: caseStudies[index + 1] ?? null,
  }
}

/** "01", "02", "03": the card number shown in the corner. */
export const cardNumber = (index: number) => String(index + 1).padStart(2, '0')
