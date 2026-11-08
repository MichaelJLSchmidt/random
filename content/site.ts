/*
 * Site chrome copy: header, footer, settings, the "?" sheet, egg
 * announcements and shared labels. A slim module: client components load it
 * (through src/lib/hand-data.ts), so it must hold short labels only, never
 * page text. Today it adapts site.json; the Content & Images session may
 * replace the storage as long as it keeps `export const site: Site`.
 */
import type { Site } from './schema'
import siteJson from './site.json'

export const site: Site = {
  name: siteJson.name,
  description: siteJson.description,
  wordmark: siteJson.wordmark,
  skipLink: siteJson.skipLink,
  introSkip: siteJson.introSkip,
  header: {
    homeLabel: siteJson.header.homeLabel,
    back: siteJson.header.back,
    about: siteJson.header.about,
    moreProjects: siteJson.header.projects,
    contact: siteJson.header.contact,
  },
  footer: siteJson.footer,
  settings: siteJson.settings,
  shortcuts: {
    title: siteJson.eggs.shortcutsTitle,
    close: siteJson.eggs.shortcutsClose,
    items: siteJson.eggs.shortcuts,
  },
  eggs: {
    dealt: siteJson.eggs.dealt,
    turned: siteJson.eggs.turned,
    rare: siteJson.eggs.rare,
    coffeeDealt: 'One more card: {title}', // was "One more card: Coffee?"
    tableFlipped: '{label}: {value}', // was "{name}: {line}"
  },
  labels: {
    facts: siteJson.caseStudy.factsLabel,
    next: siteJson.caseStudy.nextLabel,
    viewing: siteJson.caseStudy.viewingLabel,
    sections: 'Sections', // NEW
    contactTitle: siteJson.caseStudy.contactTitle,
    contactText: siteJson.caseStudy.contactText,
    contactLink: siteJson.caseStudy.contactLink,
    meta: { client: 'Client', timeframe: 'Timeframe', role: 'Role', team: 'Team', type: 'Type' }, // NEW
    decision: { decision: 'Decision', chose: 'Chose', tradeOff: 'Trade-off', why: 'Why' }, // NEW
    owned: 'What I owned', // NEW
    notOwned: "What I didn't", // NEW
  },
}
