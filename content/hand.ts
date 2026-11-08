/*
 * The hand's data: the four cards' metadata (ids, order, identities, rail
 * labels, card copy) and the Coffee egg card. A slim module: the hand ships in
 * every page's client bundle and loads only this (through
 * src/lib/hand-data.ts), so it imports no page text (D7). Page modules may
 * import from here, never the other way round.
 * Contract: docs/contracts.md#hand and #content-schema.
 */
import type { CoffeeEgg, HandCardCopy, HandContent, Identity } from './schema'

/** The four cards, in hand order: the three case studies, then Management. */
const order = ['team-of-teams', 'shared-foundations', 'front-door', 'management'] as const

type HandCardId = (typeof order)[number]

export const hand: HandContent = {
  order,
  identity: {
    'team-of-teams': 'ember',
    'shared-foundations': 'tide',
    'front-door': 'grove',
    management: 'saffron',
  } satisfies Record<HandCardId, Identity>,
  railLabel: {
    'team-of-teams': 'Teams',
    'shared-foundations': 'Platform',
    'front-door': 'Service',
    management: 'Management',
  } satisfies Record<HandCardId, string>,
  cards: {
    'team-of-teams': {
      title: 'Building the team',
      type: 'People leadership',
      year: '2021–2025',
      inspect: 'From two designers to a team of five, with a front door and a career framework.',
      tapLine: 'First hire: a researcher, not a designer.',
      facts: [
        { label: 'Team', value: '2 → 5 people' },
        { label: 'Timeframe', value: '2021–2025' },
      ],
    },
    'shared-foundations': {
      title: 'Allmend design system',
      type: 'Design system',
      year: 'Since 2022',
      inspect: 'Nine of twelve product teams build with it, and nobody was told to.',
      tapLine: 'Allmend is Swiss German for common land.',
      facts: [
        { label: 'Teams', value: '9 of 12' },
        { label: 'Contributed', value: '41% of components' },
      ],
    },
    'front-door': {
      title: 'Moving house, once',
      type: 'Public service',
      year: '2023–2025',
      inspect: 'One online service that tells five offices about a move at once.',
      tapLine: 'Most asked question: "Do I also need to tell the tax office?"',
      facts: [
        { label: 'Completion', value: '54% → 83%' },
        { label: 'Municipalities', value: '27 of 27' },
      ],
    },
    management: {
      title: 'Management',
      type: 'How I lead',
      year: 'Since 2021',
      inspect: 'Five people, six rituals and the workshop methods I reach for.',
      tapLine: 'The best retro format is the one the team picks.',
      facts: [
        { label: 'Team', value: '5 people, 4.0 FTE' },
        { label: 'Rituals', value: '6' },
      ],
    },
  } satisfies Record<HandCardId, HandCardCopy>,
  labels: {
    nav: 'Work',
    viewing: 'Viewing',
    moreProjects: 'More projects',
    counter: 'Card {n} of {total}: {title}',
  },
}

export const coffeeEgg: CoffeeEgg = {
  title: 'Coffee?',
  body: 'You typed "draw". Here\'s a card that leads to a conversation.',
  cta: 'Go to contact',
}
