/*
 * Adapters: the existing content files (site.json, case-studies.json,
 * projects.json, workshops.json, cards.ts and the MDX bodies) shaped into the
 * schema (content/schema.ts). They exist so the redesign compiles against the
 * schema before the content pass; the Content & Images session replaces them
 * with schema-native content and deletes what is no longer read.
 *
 *   - The MDX bodies (work/*.mdx, management.mdx, about.mdx) are transcribed
 *     into sections below; the .mdx files stay as the source until then.
 *   - Copy the old files do not have (labels for the new layout) is marked NEW.
 *   - Sections the old content has no text for say TBD.
 */
import caseStudiesJson from './case-studies.json'
import { cardIdentity, handLabels, handOrder, managementCard, railLabel } from './cards'
import projectsJson from './projects.json'
import type {
  About,
  CaseStudy,
  CaseStudySections,
  CoffeeEgg,
  Contact,
  ContentIllustration,
  Decision,
  HandContent,
  Home,
  ImageId,
  Management,
  MoreProjects,
  NotFound,
  ProjectType,
  Site,
  WorkshopMethods,
} from './schema'
import siteJson from './site.json'
import workshopsJson from './workshops.json'

const TBD = 'To be written.'

type LegacyStudy = (typeof caseStudiesJson)[number]
const fact = (study: LegacyStudy, label: string) => study.facts.find((f) => f.label === label)?.value ?? TBD

// ---------------------------------------------------------------------------

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
  eggs: { dealt: siteJson.eggs.dealt, turned: siteJson.eggs.turned, rare: siteJson.eggs.rare },
  labels: {
    facts: siteJson.caseStudy.factsLabel,
    next: siteJson.caseStudy.nextLabel,
    viewing: siteJson.caseStudy.viewingLabel,
    sections: 'Sections', // NEW
    contactTitle: siteJson.caseStudy.contactTitle,
    contactText: siteJson.caseStudy.contactText,
    contactLink: siteJson.caseStudy.contactLink,
    // NEW
    meta: { client: 'Client', timeframe: 'Timeframe', role: 'Role', team: 'Team', type: 'Type' },
    // NEW
    decision: { decision: 'Decision', chose: 'Chose', tradeOff: 'Trade-off', why: 'Why' },
  },
}

export const hand: HandContent = {
  order: handOrder,
  identity: cardIdentity,
  railLabel,
  labels: handLabels,
}

export const home: Home = siteJson.home

// ---------------------------------------------------------------------------
// Case studies

const decisionsTbd = (): CaseStudySections['decisions']['items'] => {
  const d = (n: number): Decision => ({ decision: `Decision ${n}: ${TBD}`, chose: TBD, tradeOff: TBD, why: TBD })
  return [d(1), d(2), d(3), d(4)]
}

/** Transcribed MDX bodies (content/work/<slug>.mdx) and the illustrations each case study shows. */
const bodies: Record<
  string,
  {
    problem: string[]
    approach: { title: string; body: string[]; list: string[] }
    outcomes: string[]
    artefacts: [ContentIllustration, string][]
  }
> = {
  'team-of-teams': {
    problem: [
      'The design group had grown by hiring good people one at a time. Each new person learned the job by watching someone else, and by the time there were nine of us, three different ways of running critique, research and hand-off were in use at once.',
    ],
    approach: {
      title: 'What we changed',
      body: [
        'We wrote down how we work, then practised it in the open until it was true.',
        'Every change started as a small experiment with an end date. We kept what the team asked to keep and dropped the rest without ceremony.',
      ],
      list: [
        'A weekly critique with a fixed shape: context, the question, then feedback on that question only',
        'A career framework built with the team, with examples from our own work instead of generic levels',
        'Rotating ownership of rituals, so no practice depended on one person',
      ],
    },
    outcomes: [
      'The practice grew to eighteen people across three product areas. New designers shipped in their second week, and the yearly survey moved from "unclear expectations" to "clear and fair" as the most common answer.',
    ],
    artefacts: [
      ['TeamGrowthTimeline', 'Team growth over two years'],
      ['TeamConstellation', 'Team constellation'],
      ['CareerMatrix', 'Career framework'],
    ],
  },
  'shared-foundations': {
    problem: [
      'Twelve product teams were building the same buttons, forms and tables in slightly different ways. Fixing an accessibility bug meant twelve tickets, and a brand change meant a quarter of rework.',
    ],
    approach: {
      title: 'What we changed',
      body: [
        'We treated the design system as a product with its own users: the teams.',
        'Components were built in React with tokens generated from one source. Every release ran through visual and accessibility checks in CI before a team could upgrade.',
      ],
      list: [
        'Tokens and components shipped as code first, documentation second',
        'A public roadmap and office hours, so teams could shape what came next',
        'Contribution guidelines that made changing the platform as easy as using it',
      ],
    },
    outcomes: [
      'All twelve teams moved onto the platform within a year. Accessibility fixes now ship once, and two of the most-used components were contributed by product teams rather than the platform team.',
    ],
    artefacts: [
      ['DesignSystemLayers', 'Design system layers'],
      ['ContributionLoop', 'Contribution loop'],
      ['AdoptionBars', 'Platform adoption by team'],
    ],
  },
  'front-door': {
    problem: [
      'The service had three front doors: a web form, a phone line and a counter. Each asked different questions in a different order, and people who switched channels had to start again.',
    ],
    approach: {
      title: 'What we changed',
      body: [
        'We designed one journey and let each channel present it in its own way.',
        'We tested every change with people using the service and with the staff answering the phones, often in the same week, so both sides of the conversation moved together.',
      ],
      list: [
        'A shared question set with the same wording on screen, in scripts and on paper',
        'A reference number that carries progress between channels',
        'Plain-language letters that explain what happens next and when',
      ],
    },
    outcomes: [
      'Repeat contacts fell by a third in the first six months, and the average time to a decision dropped from weeks to days for the most common cases.',
    ],
    artefacts: [
      ['IntakeBeforeAfter', 'Intake before and after'],
      ['ServiceBlueprint', 'Service blueprint'],
      ['JourneyEmotionCurve', 'Journey emotion curve'],
    ],
  },
}

function caseStudy(study: LegacyStudy): CaseStudy {
  const body = bodies[study.slug]
  if (!body) throw new Error(`content/adapters.ts has no body for "${study.slug}".`)
  const id = study.slug as (typeof handOrder)[number]
  return {
    slug: study.slug,
    identity: cardIdentity[id],
    label: railLabel[id],
    title: study.title,
    summary: study.summary,
    statement: study.statement,
    heroImage: `${study.slug}-hero` as ImageId,
    meta: {
      client: fact(study, 'Client type'),
      timeframe: fact(study, 'Timeframe'),
      role: fact(study, 'Role'),
      team: fact(study, 'Team'),
      type: study.projectType,
    },
    metrics: [],
    sections: {
      context: { label: 'Context', title: 'Context', body: [study.summary] },
      problem: { label: 'Problem', title: 'The problem', body: body.problem },
      role: { label: 'Role', title: 'Role', body: [TBD] },
      approach: { label: 'Approach', ...body.approach },
      decisions: { label: 'Decisions', title: 'Decisions', body: [], items: decisionsTbd() },
      artefacts: {
        label: 'Artefacts',
        title: 'Artefacts',
        body: [],
        items: body.artefacts.map(([illustration, title]) => ({ title, illustration })),
      },
      outcomes: { label: 'Outcomes', title: 'Outcome', body: body.outcomes },
      differently: { label: 'Differently', title: "What I'd do differently", body: [TBD] },
      next: { label: 'Next', title: siteJson.caseStudy.nextLabel },
    },
    card: { year: study.year, inspect: study.inspect, tapLine: study.tapLine },
  }
}

export const caseStudies: CaseStudy[] = caseStudiesJson.map(caseStudy)

// ---------------------------------------------------------------------------
// Management (transcribed from management.mdx)

export const management: Management = {
  slug: 'management',
  identity: cardIdentity.management,
  label: railLabel.management,
  title: siteJson.management.title,
  projectType: siteJson.management.projectType,
  summary: siteJson.management.summary,
  facts: siteJson.management.facts,
  sections: {
    week: {
      label: 'Week',
      title: 'How I run a week',
      body: ['A team runs on a few habits done well. These are the ones I keep, whatever the size of the team.'],
      rituals: [
        'A Monday plan of three outcomes, written where everyone can see it',
        'Critique on Wednesday with a fixed shape: context, the question, feedback on that question only',
        'One-to-ones every two weeks that the other person sets the agenda for',
        'A Friday note on what shipped, what slipped and why',
      ],
      callout: 'Rituals only work if someone can explain what each one is for. If nobody can, it goes.',
      illustration: 'WeekRing',
    },
    numbers: {
      label: 'Numbers',
      title: 'Numbers I trust',
      body: ['I look at a small set of numbers, and always next to the story behind them.'],
      metrics: [
        { value: '92', unit: '%', label: 'Of planned outcomes shipped per quarter' },
        { value: '11', unit: 'days', label: 'Median time from idea to first user test' },
        { value: '4', unit: 'of 5', label: 'Team health score, asked every month' },
      ],
    },
    stuck: {
      label: 'Workshops',
      title: 'When a room gets stuck',
      body: [
        'Most stuck meetings are missing structure, not ideas. I keep a small deck of workshop methods and pick one when a discussion goes in circles.',
      ],
      illustration: 'WorkshopGlyphs',
    },
  },
  card: { year: managementCard.year, inspect: managementCard.summary, tapLine: managementCard.tapLine },
}

// ---------------------------------------------------------------------------
// More projects (site.json "projects" + projects.json)

/** NEW: a glyph type per existing project (placeholder mapping until the content pass). */
const projectGlyph: Record<string, ProjectType> = {
  'Contrast checker for print': 'checklist',
  'Variable type specimen': 'portal',
  'Trail map tiles': 'map',
  'Meeting timer': 'calendar',
  'Onboarding handbook': 'checklist',
  'Grid notebook': 'dashboard',
  'Form patterns': 'form',
  'Booking flow audit': 'calendar',
  'Icon set refresh': 'dashboard',
  'Wayfinding prototype': 'map',
}

export const moreProjects: MoreProjects = {
  title: siteJson.projects.title,
  intro: siteJson.projects.intro,
  columns: { number: 'No.', ...siteJson.projects.columns }, // number: NEW
  // NEW
  projectTypeLabels: {
    form: 'Form',
    map: 'Map',
    dashboard: 'Dashboard',
    portal: 'Portal',
    calendar: 'Calendar',
    checklist: 'Checklist',
  },
  items: projectsJson.map((p, i) => ({
    number: i + 1,
    title: p.title,
    year: p.year,
    clientType: p.clientType,
    projectType: projectGlyph[p.title] ?? 'portal',
  })),
  end: siteJson.projects.end,
}

// ---------------------------------------------------------------------------
// About (site.json "about" + about.mdx, transcribed)

export const about: About = {
  title: siteJson.about.title,
  intro: siteJson.about.intro,
  sections: [
    {
      key: 'how-i-work',
      label: 'Work',
      title: 'How I work',
      body: [
        'I like to work close to the material. That means sketching in code early, testing with the people who will use the thing, and keeping the design and the implementation in the same conversation instead of handing one over to the other.',
        'Most of my projects sit somewhere between product design and front-end engineering: design systems, data-heavy tools, and the small moments of motion and feedback that make an interface feel solid.',
      ],
    },
    {
      key: 'what-i-care-about',
      label: 'Care',
      title: 'What I care about',
      body: [],
      list: [
        'Accessibility as a starting point, not a final check',
        'Interfaces that stay usable with animation, colour or images turned off',
        'Writing that says what a button does',
      ],
    },
    {
      key: 'outside-of-work',
      label: 'Outside',
      title: 'Outside of work',
      body: [
        'Away from the screen I print with letterpress, walk long coastal paths and keep a slowly growing collection of timetables.',
      ],
    },
  ],
  table: { ...siteJson.about.table, flipped: siteJson.eggs.tableFlipped },
  topo: {
    label: siteJson.about.topoLabel,
    attribution: siteJson.about.attribution,
    placeholderNote: siteJson.about.placeholderNote,
  },
}

export const contact: Contact = siteJson.contact
export const notFound: NotFound = siteJson.notFound

export const coffeeEgg: CoffeeEgg = { ...siteJson.eggs.coffee, dealt: siteJson.eggs.coffeeDealt }

export const workshopMethods: WorkshopMethods = {
  button: siteJson.management.workshopButton,
  again: siteJson.eggs.workshopAgain,
  drawn: siteJson.eggs.workshopDrawn,
  methods: workshopsJson,
}
