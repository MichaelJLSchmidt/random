/*
 * The one typed entry point for content. Pages and components import it via
 * src/lib/content.ts. Every export is typed by content/schema.ts; how the
 * values are stored (JSON, TS, MDX transcribed into TS) is up to the Content &
 * Images session, as long as these exports keep their names and types.
 *
 * Today they come from content/adapters.ts (the existing files, adapted).
 */
import * as adapted from './adapters'
import type { Content } from './schema'

export const content = {
  site: adapted.site,
  hand: adapted.hand,
  home: adapted.home,
  caseStudies: adapted.caseStudies,
  management: adapted.management,
  moreProjects: adapted.moreProjects,
  about: adapted.about,
  contact: adapted.contact,
  notFound: adapted.notFound,
  coffeeEgg: adapted.coffeeEgg,
  workshopMethods: adapted.workshopMethods,
} satisfies Content

export const {
  site,
  hand,
  home,
  caseStudies,
  management,
  moreProjects,
  about,
  contact,
  notFound,
  coffeeEgg,
  workshopMethods,
} = content

export { images } from './images'
