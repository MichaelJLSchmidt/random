import type { Identity } from '@/design/palette'

/*
 * The hand: four cards, in this order, as the site's primary navigation.
 * Edit here to change which colour identity a case study uses, the order of
 * the hand, the short labels on the mobile rail and the Management card.
 * Case-study titles and summaries come from case-studies.json.
 */
export const handOrder = ['team-of-teams', 'shared-foundations', 'front-door', 'management'] as const

/** Colour identity per case study (ember / tide / grove) and for Management (saffron). */
export const cardIdentity: Record<(typeof handOrder)[number], Identity> = {
  'team-of-teams': 'ember',
  'shared-foundations': 'tide',
  'front-door': 'grove',
  management: 'saffron',
}

/** Short plain labels for the mobile peek rail. */
export const railLabel: Record<(typeof handOrder)[number], string> = {
  'team-of-teams': 'Teams',
  'shared-foundations': 'Platform',
  'front-door': 'Service',
  management: 'Management',
}

/** The fourth card. Its page lives at /management. */
export const managementCard = {
  id: 'management',
  title: 'Management',
  projectType: 'How I lead',
  summary: 'How I run teams: rituals, metrics I trust and the workshop methods I reach for.',
  tapLine: 'The best retro format is the one the team picks.',
}

/** Labels for the hand. */
export const handLabels = {
  nav: 'Work',
  viewing: 'Viewing',
  moreProjects: 'More projects',
}
