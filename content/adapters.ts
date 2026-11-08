/*
 * Adapters: the existing content files (site.json, case-studies.json,
 * projects.json, workshops.json and the MDX bodies) shaped into the page
 * types of content/schema.ts. They exist so the redesign compiles against the
 * schema before the content pass; the Content & Images session replaces them
 * with schema-native content and deletes what is no longer read.
 *
 *   - Site chrome is in content/site.ts, the hand and the Coffee card in
 *     content/hand.ts (slim modules the client loads); this file is
 *     server-only page text.
 *   - The MDX bodies (work/*.mdx, management.mdx, about.mdx) are transcribed
 *     here; the .mdx files stay as the source until the content pass.
 *   - Labels the old files do not have are marked NEW; missing copy is TBD
 *     ("To be written."), in the counts the contract fixes.
 */
import caseStudiesJson from './case-studies.json'
import { cardIdentity, railLabel } from './cards'
import projectsJson from './projects.json'
import type {
  About,
  CaseStudy,
  CaseStudySections,
  Contact,
  ContentIllustration,
  Decision,
  Home,
  ImageId,
  Management,
  Metric,
  MoreProjects,
  NotFound,
  ProjectType,
  WorkshopMethods,
} from './schema'
import siteJson from './site.json'
import workshopsJson from './workshops.json'

const TBD = 'To be written.'
/** `n` placeholder strings. */
const tbd = (n: number) => Array.from({ length: n }, () => TBD)
/** Five placeholder metrics (the contract fixes five per case study and on Management). */
const metricsTbd = (keep: Metric[] = []): Metric[] => [
  ...keep,
  ...Array.from({ length: 5 - keep.length }, () => ({ value: '—', label: TBD })),
]

type LegacyStudy = (typeof caseStudiesJson)[number]
const fact = (study: LegacyStudy, label: string) => study.facts.find((f) => f.label === label)?.value ?? TBD

export const home: Home = {
  label: TBD,
  ...siteJson.home,
  onTheTableNow: { label: 'On the table now', items: tbd(3) }, // label NEW
}

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

function caseStudy(study: LegacyStudy, index: number): CaseStudy {
  const body = bodies[study.slug]
  if (!body) throw new Error(`content/adapters.ts has no body for "${study.slug}".`)
  const id = study.slug as keyof typeof railLabel
  return {
    slug: study.slug,
    number: String(index + 1).padStart(2, '0'),
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
    metrics: metricsTbd(),
    sections: {
      context: { label: 'Context', title: 'Context', body: [study.summary] },
      problem: { label: 'Problem', title: 'The problem', body: body.problem },
      role: { label: 'Role', title: 'Role', body: [], owned: tbd(3), notOwned: tbd(2) },
      approach: {
        label: 'Approach',
        ...body.approach,
        steps: Array.from({ length: 4 }, (_, k) => ({ title: `Step ${k + 1}`, body: TBD })),
      },
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
  }
}

export const caseStudies: CaseStudy[] = caseStudiesJson.map(caseStudy)

// ---------------------------------------------------------------------------
// Management. Of management.mdx only the rituals and the three numbers fit
// the new sections; the rest is TBD. Section labels are NEW.

export const management: Management = {
  slug: 'management',
  identity: cardIdentity.management,
  title: siteJson.management.projectType, // "How I lead"
  lead: siteJson.management.summary,
  principles: {
    label: 'Principles',
    items: Array.from({ length: 5 }, () => ({ title: TBD, evidence: TBD })),
  },
  team: {
    label: 'Team',
    members: [{ initials: '—', role: TBD, fte: '—', focus: TBD }],
    note: TBD,
  },
  rituals: {
    label: 'Rituals',
    title: 'How I run a week',
    items: [
      { name: 'Monday plan', cadence: 'Weekly', purpose: 'Three outcomes, written where everyone can see them' },
      {
        name: 'Critique',
        cadence: 'Weekly, Wednesday',
        purpose: 'A fixed shape: context, the question, feedback on that question only',
      },
      { name: 'One-to-ones', cadence: 'Every two weeks', purpose: 'The other person sets the agenda' },
      { name: 'Friday note', cadence: 'Weekly', purpose: 'What shipped, what slipped and why' },
    ],
  },
  hiring: {
    label: 'Hiring',
    steps: [{ title: TBD, duration: '—', purpose: TBD }],
    note: TBD,
  },
  growth: { label: 'Growth', body: TBD, levels: tbd(1), dimensions: tbd(1) },
  workshops: {
    label: 'Workshops',
    title: 'When a room gets stuck',
    formats: [{ name: TBD, duration: '—', who: TBD, outcome: TBD }],
    drawButton: siteJson.management.workshopButton,
  },
  metrics: {
    label: 'Numbers',
    title: 'Numbers I trust',
    items: metricsTbd([
      { value: '92', unit: '%', label: 'Of planned outcomes shipped per quarter' },
      { value: '11', unit: 'days', label: 'Median time from idea to first user test' },
      { value: '4', unit: 'of 5', label: 'Team health score, asked every month' },
    ]),
  },
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

const years = projectsJson.map((p) => Number(p.year))

export const moreProjects: MoreProjects = {
  title: siteJson.projects.title,
  intro: `${projectsJson.length} projects · ${Math.min(...years)}–${Math.max(...years)}`,
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
// About (site.json "about" + about.mdx, transcribed where it fits). Section labels are NEW.

export const about: About = {
  title: siteJson.about.title,
  lead: siteJson.about.intro,
  story: {
    label: 'Story',
    body: [
      'I like to work close to the material. That means sketching in code early, testing with the people who will use the thing, and keeping the design and the implementation in the same conversation instead of handing one over to the other.',
      'Most of my projects sit somewhere between product design and front-end engineering: design systems, data-heavy tools, and the small moments of motion and feedback that make an interface feel solid.',
    ],
  },
  timeline: {
    label: 'Timeline',
    items: Array.from({ length: 7 }, () => ({ years: '—', title: TBD })),
  },
  howIWork: {
    label: 'How I work',
    items: [
      { title: 'Accessibility as a starting point, not a final check', body: TBD },
      { title: 'Interfaces that stay usable with animation, colour or images turned off', body: TBD },
      { title: 'Writing that says what a button does', body: TBD },
      { title: TBD, body: TBD },
    ],
  },
  tcg: { label: 'Cards', title: TBD, body: TBD, lessons: [{ title: TBD, body: TBD }], stats: TBD },
  roots: {
    label: 'Roots',
    title: TBD,
    body: 'Away from the screen I print with letterpress, walk long coastal paths and keep a slowly growing collection of timetables.',
  },
  onTheTable: {
    label: 'On the table',
    title: siteJson.about.table.label,
    items: [
      ...siteJson.about.table.cards.map((c) => ({ label: c.name, value: c.line })),
      { label: TBD, value: TBD },
      { label: TBD, value: TBD },
    ],
  },
  creditsTitle: TBD,
  topo: {
    label: siteJson.about.topoLabel,
    attribution: siteJson.about.attribution,
    placeholderNote: siteJson.about.placeholderNote,
  },
}

export const contact: Contact = {
  label: TBD,
  title: siteJson.contact.title,
  body: siteJson.contact.sentence,
  email: siteJson.contact.email,
  links: [
    { label: 'LinkedIn', value: TBD },
    { label: 'Location', value: TBD },
  ],
  note: TBD,
}
export const notFound: NotFound = siteJson.notFound

export const workshopMethods: WorkshopMethods = {
  again: siteJson.eggs.workshopAgain,
  drawn: siteJson.eggs.workshopDrawn,
  methods: workshopsJson,
}
