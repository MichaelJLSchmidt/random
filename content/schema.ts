/*
 * Content schema: the types every piece of visible text and every image
 * reference must satisfy. Pages read typed content only through
 * content/index.ts (re-exported by src/lib/content.ts), never from JSON or MDX
 * directly. Foundation-owned; read-only in Wave 1 (Content & Images asks for
 * changes in its handoff). Contract: docs/contracts.md#content-schema.
 *
 * Field names follow the existing content (content/cards.ts, site.json,
 * case-studies.json, management.mdx). Copy rules: plain labels, no personal
 * names, no job-seeking language, no CV, no testimonials.
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

/** A number with a unit and a label (Scoreboard, Management's numbers). */
export type Metric = { value: string; unit?: string; label: string }

/** Ids of the four hand cards: three case-study slugs and "management". */
export type CardId = string

// ---------------------------------------------------------------------------
// Images (content/images.ts)

export type ImageFormat = 'avif' | 'webp' | 'jpeg'

/**
 * One image. Either local renditions written by scripts/images to
 * public/images/<id>-<width>.<ext> (ext: avif, webp, jpg), or a hotlinked
 * source whose URL contains {w} for the width. `alt` is required; an empty
 * string marks the image decorative.
 */
export type ImageEntry = {
  alt: string
  /** Intrinsic size of the largest rendition (sets width/height, avoids layout shift). */
  width: number
  height: number
  local?: { widths: number[]; formats: ImageFormat[] }
  remote?: { src: string; widths: number[] }
  /** Solid colour shown before the image decodes. */
  placeholder?: string
  /** Source / licence line, if any. */
  credit?: string
}

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
  /** Hand eggs: new hand, tap, rare pull (announced in the live region). */
  eggs: { dealt: string; turned: Template; rare: string }
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
  }
}

/** The hand (content/cards.ts). Exactly four cards. */
export type HandContent = {
  order: readonly [CardId, CardId, CardId, CardId]
  identity: Record<CardId, Identity>
  /** Short labels on the mobile peek rail. */
  railLabel: Record<CardId, string>
  labels: {
    nav: string
    viewing: string
    moreProjects: string
    /** Screen-reader text of the card counter: "Card {n} of {total}: {title}". */
    counter: Template
  }
}

/** What a hand card shows besides title and facts. */
export type CardCopy = {
  /** Years on the card face, e.g. "2025" or "Since 2016". */
  year: string
  /** One line shown when a card is inspected (and on the card face). */
  inspect: string
  /** Printed along the long edge; readable when the card is turned sideways. */
  tapLine: string
}

// ---------------------------------------------------------------------------
// Pages

export type Home = {
  title: string
  role: string
  intro: Paragraph
  hint: string
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

export type CaseStudySections = {
  context: SectionCopy
  problem: SectionCopy
  role: SectionCopy
  approach: SectionCopy
  decisions: SectionCopy & { items: Decisions }
  artefacts: SectionCopy & { items: Artefact[] }
  outcomes: SectionCopy & { items?: string[] }
  differently: SectionCopy & { items?: string[] }
  /** The next card. `card` defaults to the next one in hand order. */
  next: Pick<SectionCopy, 'label' | 'title'> & { card?: CardId }
}

export type CaseStudy = {
  slug: string
  /** Colour identity: ember, tide or grove. */
  identity: Identity
  /** Short label (mobile rail). */
  label: string
  title: string
  summary: Paragraph
  /** One large statement (full-bleed breaker). */
  statement?: string
  heroImage: ImageId
  meta: CaseStudyMeta
  /** Scoreboard: up to five. */
  metrics: Metric[]
  sections: CaseStudySections
  card: CardCopy
}

/** Management sections, from management.mdx. */
export const managementSectionKeys = ['week', 'numbers', 'stuck'] as const
export type ManagementSectionKey = (typeof managementSectionKeys)[number]

export type Management = {
  slug: 'management'
  identity: Identity
  label: string
  title: string
  /** Project type on the card band, e.g. "How I lead". */
  projectType: string
  summary: Paragraph
  heroImage?: ImageId
  /** Role, team, timeframe, client type. */
  facts: Fact[]
  sections: {
    /** "How I run a week": rituals and a callout. */
    week: SectionCopy & { rituals: string[]; callout?: string }
    /** "Numbers I trust". */
    numbers: SectionCopy & { metrics: Metric[] }
    /** "When a room gets stuck": the workshop draw follows. */
    stuck: SectionCopy
  }
  card: CardCopy
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
  intro: Paragraph
  columns: { number: string; title: string; year: string; projectType: string; clientType: string }
  /** Visible label per project type (the glyph's neighbour). */
  projectTypeLabels: Record<ProjectType, string>
  items: MoreProjectItem[]
  end: string
}

export type AboutSection = { key: string; label: string; title: string; body: Paragraph[]; list?: string[] }

export type About = {
  title: string
  intro: Paragraph
  sections: AboutSection[]
  portrait?: ImageId
  /** "What's on the table": three face-down cards named after games. */
  table: { label: string; cards: { name: string; line: string }[]; flipped: Template }
  topo: { label: string; attribution: string; placeholderNote: string }
}

export type Contact = { title: string; sentence: Paragraph; email: string }

export type NotFound = { title: string; body: Paragraph; back: string }

/** Typing "draw" on home deals a fifth card, "Coffee?", which opens /contact. */
export type CoffeeEgg = { title: string; projectType: string; dealt: string }

/** "Draw a workshop method" on /management. */
export type WorkshopMethods = {
  button: string
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
