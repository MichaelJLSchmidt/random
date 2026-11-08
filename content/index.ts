/*
 * The one typed entry point for content (server side). Pages and server
 * components import it via src/lib/content.ts. Every export is typed by
 * content/schema.ts; how the values are stored is up to the Content & Images
 * session, as long as these exports keep their names and types.
 *
 *   content/site.ts   site chrome           (slim: client components load it)
 *   content/hand.ts   hand + Coffee card    (slim: client components load it)
 *   adapters.ts       every page's text     (server only)
 */
import * as adapted from './adapters'
import { coffeeEgg, hand } from './hand'
import type { Content } from './schema'
import { site } from './site'

export const content = {
  site,
  hand,
  home: adapted.home,
  caseStudies: adapted.caseStudies,
  management: adapted.management,
  moreProjects: adapted.moreProjects,
  about: adapted.about,
  contact: adapted.contact,
  notFound: adapted.notFound,
  coffeeEgg,
  workshopMethods: adapted.workshopMethods,
} satisfies Content

export const { home, caseStudies, management, moreProjects, about, contact, notFound, workshopMethods } = content

export { coffeeEgg, hand, site }
export { images } from './images'
