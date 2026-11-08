/*
 * Content schema: the types every piece of visible text and every image
 * reference must satisfy. Pages read typed content only through
 * src/lib/content.ts (which re-exports content/index.ts); client components
 * read only the slim modules through src/lib/hand-data.ts. Never import JSON
 * or MDX content directly. Foundation-owned; read-only in Wave 1 (Content &
 * Images asks for changes in its handoff). Contract: docs/contracts.md#content-schema.
 *
 * Shapes fit the final persona content (a fictional UX team lead). Counts
 * that the contract fixes (four decisions, five metrics, seven timeline
 * stops, ...) are checked at build time in src/lib/content.ts.
 * Copy rules: plain labels, no personal names (the fictional persona is
 * fine), no job-seeking language, no CV, no testimonials.
 */
import type { ContentIllustration, ProjectType } from '@/components/illustrations/types'
import type { Identity } from '@/design/palette'
import type { ImageId } from './images'

export type { ContentIllustration, Identity, ImageId, ProjectType }

/** A string with {placeholders} filled at runtime, e.g. "Turned sideways: {line}". */
export type Template = string

/** One paragraph of plain text (no markup). */
export type Paragraph = string

export type Fact = { label: string; value: string }

/** A number with a unit and a label (Scoreboard). */
export type Metric = { value: string; unit?: string; label: string }

/** Ids of the four hand cards: three case-study slugs and "management". */
export type CardId = string

/**
 * The head every Management and About section carries: a short label for
 * SectionIndex and the Minimap, and an optional h2 (defaults to the label).
 */
export type SectionHead = { label: string; title?: string; image?: ImageId }

// ---------------------------------------------------------------------------
// Images (content/images.ts)

export type ImageFormat = 'avif' | 'webp' | 'jpeg'

/** Where a photo comes from; the About colophon credits and links each one. */
export type ImageCredit = {
  photographer: string
  photographerUrl: string
  /** The photo's own page (e.g. on the stock site). */
  pageUrl: string
}

type ImageBase = {
  /** Required; an empty string marks the image decorative. */
  alt: string
  /** Intrinsic size of the largest rendition (sets width/height, avoids layout shift). */
  width: number
  height: number
  /** Renditions written by scripts/images to public/images/<id>-<width>.<ext> (avif, webp, jpg). */
  local?: { widths: number[]; formats: ImageFormat[] }
  /** Hotlinked source; the URL contains {w} for the width. */
  remote?: { src: string; widths: number[] }
  /** Solid colour shown before the image decodes. */
  placeholder?: string
}

/** One image: a photo (credit required) or a generated placeholder (credit optional). */
export type ImageEntry =
  (ImageBase & { kind: 'photo' } & ImageCredit) | (ImageBase & { kind: 'generated' } & Partial<ImageCredit>)

// ---------------------------------------------------------------------------
// Site chrome (header, footer, settings, shortcut sheet, shared labels)

export type Site = {
  name: string
  description: string
  /** Header wordmark (initials or short name). */
  wordmark: string
  skipLink: string
  introSkip: string
  header: { homeLabel: string; back: string; about: string; moreProjects: string; contact: string }
  footer: { note: string }
  settings: { heading: string; calm: string; calmHint: string; calmOn: string; calmOff: string }
  /** The "?" sheet. */
  shortcuts: { title: string; close: string; items: { keys: string; label: string }[] }
  /** Egg announcements (live region): new hand, tap, rare pull, Coffee dealt, an About card flipped. */
  eggs: {
    dealt: string
    turned: Template
    rare: string
    /** "One more card: {title}" */
    coffeeDealt: Template
    /** "{label}: {value}" */
    tableFlipped: Template
  }
  labels: {
    /** aria-label of the facts list on a card. */
    facts: string
    next: string
    viewing: string
    /** aria-label of the Minimap nav. */
    sections: string
    contactTitle: string
    contactText: string
    contactLink: string
    meta: Record<keyof CaseStudyMeta, string>
    decision: Record<keyof Decision, string>
    /** Column labels of the case-study role section: "What I owned", "What I didn't". */
    owned: string
    notOwned: string
  }
}

/** What a hand card shows. */
export type HandCardCopy = {
  /** Must equal the page title (case study title; "Management" for the fourth card). */
  title: string
  /** Project type on the card band, e.g. "Platform" or "How I lead". */
  type: string
  /** Years on the card face, e.g. "2025" or "Since 2016". */
  year: string
  /** One line shown when a card is inspected (and on the card face). */
  inspect: string
  /** Printed along the long edge; readable when the card is turned sideways. */
  tapLine: string
  /** Four facts on the card face: role, team, timeframe, client. */
  facts: Fact[]
}

/**
 * The hand: exactly four cards. Lives in content/hand.ts, the slim module the
 * client bundle loads, so it holds card metadata only (no page text).
 */
export type HandContent = {
  order: readonly [CardId, CardId, CardId, CardId]
  identity: Record<CardId, Identity>
  /** Short labels on the mobile peek rail. */
  railLabel: Record<CardId, string>
  cards: Record<CardId, HandCardCopy>
  labels: {
    nav: string
    viewing: string
    moreProjects: string
    /** Screen-reader text of the card counter: "Card {n} of {total}: {title}". */
    counter: Template
  }
}

/** Typing "draw" on home deals a fifth card, "Coffee?", which opens /contact (content/hand.ts). */
export type CoffeeEgg = {
  title: string
  /** One line on the card face. */
  body: string
  /** On the card band, e.g. "Say hello". */
  cta: string
}

// ---------------------------------------------------------------------------
// Pages

export type Home = {
  /** Above the title, e.g. "Bern, Switzerland — UX Team Lead". */
  label: string
  title: string
  role: string
  intro: Paragraph
  hint: string
  /** "On the table now": three short items. */
  onTheTableNow: { label: string; items: string[] }
}

export type CaseStudyMeta = {
  client: string
  timeframe: string
  role: string
  team: string
  /** Project type, e.g. "Platform" (also the card band's type). */
  type: string
}

export type Decision = { decision: string; chose: string; tradeOff: string; why: string }

/** Exactly four decisions (DealRow deals four cards). */
export type Decisions = [Decision, Decision, Decision, Decision]

export type Artefact = {
  title: string
  caption?: string
  image?: ImageId
  illustration?: ContentIllustration
}

/** The text every numbered section shares. */
export type SectionCopy = {
  /** Short index label (SectionIndex, Minimap), e.g. "Context". */
  label: string
  /** The section's h2. */
  title: string
  body: Paragraph[]
  /** A plain list after the body. */
  list?: string[]
  /** MarginNote next to the body. */
  note?: string
  illustration?: ContentIllustration
  image?: ImageId
}

/** Case-study sections in reading order: 01 Context … 09 Next. */
export const caseStudySectionKeys = [
  'context',
  'problem',
  'role',
  'approach',
  'decisions',
  'artefacts',
  'outcomes',
  'differently',
  'next',
] as const
export type CaseStudySectionKey = (typeof caseStudySectionKeys)[number]

export type ApproachStep = { title: string; body: Paragraph }

export type CaseStudySections = {
  context: SectionCopy
  problem: SectionCopy
  /** Two columns, labelled by site.labels.owned / notOwned. */
  role: SectionCopy & { owned: string[]; notOwned: string[] }
  /** Exactly four steps. */
  approach: SectionCopy & { steps: ApproachStep[] }
  decisions: SectionCopy & { items: Decisions }
  artefacts: SectionCopy & { items: Artefact[] }
  outcomes: SectionCopy & { items?: string[] }
  differently: SectionCopy & { items?: string[] }
  /** The next card. `card` defaults to the next one in hand order. */
  next: Pick<SectionCopy, 'label' | 'title'> & { card?: CardId }
}

export type CaseStudy = {
  slug: string
  /** "01" … "03", the case's position. */
  number: string
  /** Colour identity: ember, tide or grove (equals hand.identity[slug]). */
  identity: Identity
  /** Short label (mobile rail). */
  label: string
  /** Equals hand.cards[slug].title. */
  title: string
  summary: Paragraph
  /** One large statement (full-bleed breaker). */
  statement?: string
  heroImage: ImageId
  meta: CaseStudyMeta
  /** Scoreboard: exactly five. */
  metrics: Metric[]
  sections: CaseStudySections
}

/** Management sections in reading order (after the hero). */
export const managementSectionKeys = [
  'principles',
  'team',
  'rituals',
  'hiring',
  'growth',
  'workshops',
  'metrics',
] as const
export type ManagementSectionKey = (typeof managementSectionKeys)[number]

export type Principle = { title: string; evidence: string }
/** Team members appear as initials only. */
export type TeamMember = { initials: string; role: string; fte: string; focus: string }
export type Ritual = { name: string; cadence: string; purpose: string }
export type HiringStep = { title: string; duration: string; purpose: string }
export type WorkshopFormat = { name: string; duration: string; who: string; outcome: string }

export type Management = {
  slug: 'management'
  /** saffron (equals hand.identity.management). */
  identity: Identity
  /** Hero heading, e.g. "How I lead" (the card itself stays "Management"). */
  title: string
  lead: Paragraph
  heroImage?: ImageId
  /** Exactly five. */
  principles: SectionHead & { items: Principle[] }
  team: SectionHead & { members: TeamMember[]; note: string }
  rituals: SectionHead & { items: Ritual[] }
  hiring: SectionHead & { steps: HiringStep[]; note: string }
  growth: SectionHead & { body: Paragraph; levels: string[]; dimensions: string[] }
  /** The workshop draw (egg) follows the formats; drawButton is its label. */
  workshops: SectionHead & { formats: WorkshopFormat[]; drawButton: string }
  /** Exactly five. */
  metrics: SectionHead & { items: Metric[] }
}

export type MoreProjectItem = {
  /** 1-based running number (shown padded, "01"). */
  number: number
  title: string
  year: string
  clientType: string
  projectType: ProjectType
}

export type MoreProjects = {
  title: string
  /** The count line, e.g. "13 projects · 2014–2025". */
  intro: Paragraph
  columns: { number: string; title: string; year: string; projectType: string; clientType: string }
  /** Visible label per project type (the glyph's neighbour). */
  projectTypeLabels: Record<ProjectType, string>
  items: MoreProjectItem[]
  /** The closing line. */
  end: string
}

/** About sections in reading order (after the hero). */
export const aboutSectionKeys = ['story', 'timeline', 'howIWork', 'tcg', 'roots', 'onTheTable'] as const
export type AboutSectionKey = (typeof aboutSectionKeys)[number]

export type About = {
  title: string
  lead: Paragraph
  story: SectionHead & { body: Paragraph[] }
  /** Exactly seven stops. */
  timeline: SectionHead & { items: { years: string; title: string }[] }
  /** Exactly four. */
  howIWork: SectionHead & { items: { title: string; body: string }[] }
  tcg: SectionHead & { title: string; body: Paragraph; lessons: { title: string; body: string }[]; stats: string }
  roots: SectionHead & { title: string; body: Paragraph }
  /** "What's on the table": exactly five mini cards, face down, each flipping to its value (egg). */
  onTheTable: SectionHead & { title: string; items: { label: string; value: string }[] }
  /** Heading of the colophon that credits every photo (ImageEntry kind "photo") and the topography. */
  creditsTitle: string
  topo: { label: string; attribution: string; placeholderNote: string }
}

export type ContactLink = { label: string; value: string; href?: string }

export type Contact = {
  label: string
  title: string
  body: Paragraph
  email: string
  /** e.g. LinkedIn, location. */
  links: ContactLink[]
  note: string
}

export type NotFound = { title: string; body: Paragraph; back: string }

/** "Draw a workshop method" on /management (the button label is management.workshops.drawButton). */
export type WorkshopMethods = {
  again: string
  /** Announced: "Workshop method: {title}. {howTo}" */
  drawn: Template
  methods: { title: string; howTo: string }[]
}

/** Everything content/index.ts exports. */
export type Content = {
  site: Site
  hand: HandContent
  home: Home
  caseStudies: CaseStudy[]
  management: Management
  moreProjects: MoreProjects
  about: About
  contact: Contact
  notFound: NotFound
  coffeeEgg: CoffeeEgg
  workshopMethods: WorkshopMethods
}
