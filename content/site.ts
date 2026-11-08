/*
 * Site chrome copy: header, footer, settings, the "?" sheet, egg
 * announcements and shared labels. A slim module: client components load it
 * (through src/lib/hand-data.ts), so it holds short labels only and imports
 * no page text (D7). Contract: docs/contracts.md#content-schema.
 */
import type { Site } from './schema'

export const site: Site = {
  name: 'Moritz Lauber',
  description: 'UX Team Lead and Senior UX Designer in Bern, Switzerland.',
  wordmark: 'MJLS',
  skipLink: 'Skip to main content',
  introSkip: 'Skip intro',
  header: {
    homeLabel: 'MJLS, home',
    back: 'Back',
    about: 'About',
    moreProjects: 'More projects',
    contact: 'Contact',
  },
  footer: { note: 'Moritz Lauber · Bern, Switzerland · Last updated November 2026' },
  settings: {
    heading: 'Display',
    calm: 'Calm motion',
    calmHint: 'Fewer moving parts. Reduced motion in your system settings always wins.',
    calmOn: 'Calm motion on',
    calmOff: 'Calm motion off',
  },
  shortcuts: {
    title: 'Keyboard shortcuts',
    close: 'Close',
    items: [
      { keys: '← →', label: 'Move along the cards' },
      { keys: 'Enter', label: 'Open the focused card' },
      { keys: 'Hold Space', label: 'Look closer at the focused card' },
      { keys: 'Esc', label: 'Back to the start' },
      { keys: 'T', label: 'Turn the focused card sideways' },
      { keys: 'M', label: 'Deal a new hand (start page)' },
      { keys: 'draw', label: 'Type it on the start page' },
      { keys: '?', label: 'This list' },
    ],
  },
  eggs: {
    dealt: 'New hand dealt.',
    turned: 'Turned sideways: {line}',
    rare: 'A rare card.',
    coffeeDealt: 'One more card: {title}',
    tableFlipped: '{label}: {value}',
  },
  labels: {
    facts: 'Facts',
    next: 'Next project',
    viewing: 'Viewing',
    sections: 'Sections',
    contactTitle: 'Contact',
    contactText: 'If something here is useful to you, I would like to hear about it.',
    contactLink: 'Write to me',
    meta: { client: 'Client', timeframe: 'Timeframe', role: 'Role', team: 'Team', type: 'Type' },
    decision: { decision: 'Decision', chose: 'I chose', tradeOff: 'Trade-off', why: 'Why it was worth it' },
    owned: 'What I owned',
    notOwned: "What I didn't",
    workshop: { duration: 'Duration', who: 'Who', outcome: 'Outcome' },
  },
}
