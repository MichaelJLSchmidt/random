# Contracts

The shared surface of the redesign. Four Wave 1 sessions (Layout & Pages, Motion, Illustrations,
Content & Images) worked in parallel against it; the Integration session merged them, applied the
[integration decisions](#integration-decisions-i1i27) and updated this file to match the code.
Everything here exists in the repository as typed code. Read this file, `docs/art-direction.md`,
`CLAUDE.md` and the files named below before planning.

Rules for Wave 1 (kept for future parallel waves):

- Edit only the paths your session owns ([ownership](#ownership-wave-1)). Everything else is
  read-only, including this file.
- Keep every name, prop, attribute and type listed here. If one has to change, do not change it:
  write a **contract change request** in your handoff (`docs/handoff/<agent>.md`) with the reason
  and the smallest change; Integration decides.
- Push only your own branch. Only the Foundation and Integration sessions push `main` (the deploy
  workflow runs only for `main`).
- No new dependencies. In particular no animation or smooth-scroll libraries (no GSAP, no Lenis):
  Motion 14, Motion+ 4 and CSS cover everything.
- Respect `BASE_PATH`: links through `next/link` (it adds the base path); raw URLs (`<img>`,
  `fetch`, `<a>` to files) through `withBase()` from `src/lib/site.ts`. Never a hard-coded
  leading `/` for assets.
- No personal names in code, comments, docs or commits (the fictional "Moritz Lauber" in test
  content is fine). Plain labels; no job-seeking language, CV download or testimonials.
- Calm by default: only the background field moves at rest. Everything else is still until the
  visitor scrolls or interacts, and every stub already renders its final, readable state.
- Run `npm run build` before you push (it type-checks; output in `dist/`).

Contents: [Decisions](#decisions) · [Integration decisions](#integration-decisions-i1i27) ·
[Ownership](#ownership-wave-1) · [Files](#file-map) · [Layout tokens](#layout-tokens) ·
[Type tokens](#type-tokens) · [Motion tokens](#motion-tokens) · [Colour](#colour) ·
[Hand](#hand) · [Layout components](#layout-components) · [Reveal](#reveal) ·
[Scenes](#scenes) · [Reading hairline](#reading-hairline) · [Illustrations](#illustrations) ·
[Picture](#picture) · [Content schema](#content-schema) · [Routes](#routes) ·
[Data attributes](#data-attributes) · [Eggs](#eggs) · [Checks](#checks)

---

## Decisions

Settled before Wave 1 so the four sessions do not decide them four ways. Each one is binding;
change requests go through the handoff like any other contract change.

**D1. Hand reserve.** The hand shows 72% of itself on home and 45% everywhere else, so every route
except home uses the collapsed reserve. The hand component (`src/components/hand/hand.tsx`) sets
`data-hand="collapsed"` on `<html>` on every route except home and removes it on home; the
pre-paint script (`src/motion/preferences.ts`) sets the same attribute from the URL, so the first
paint is already right. `layout.css` maps it to `--hand-reserve: 120px` from 1024 px (176 px on
home); below 1024 px the rail reserve applies on every route. *Implemented by Foundation.*

**D2. Margin notes.** From 1680 px wide (`--breakpoint-margin-notes` in `src/styles/layout.css`,
`breakpoints.marginNotes` and `media.marginNotes` in `src/design/layout.ts`), MarginNote and every
other `.col-margin` element sit in column 12 plus the right outer track. Below 1680 px a
MarginNote renders inline in the content column as an aside with a 1 px left rule.
*Implemented by Foundation.*

**D3. Hero target.** The case hero's media frame carries `data-hero-target`: the element that
frames the played card on a detail page (today `.hero-slot` in `case-hero.tsx`, already marked;
Layout keeps the attribute on the frame of its redesigned hero). Motion changes `heroTarget()` in
`src/motion/play.ts` to measure `[data-hero-target]` with `getBoundingClientRect()` at play time
and to fall back to the current computed values when the element is missing (for example when
playing from home, where no hero is mounted yet).

**D4. Reveals.** After Wave 1, `<Reveal>` kinds are the only reveal system. Layout uses only
`<Reveal>` (and `<FirstLoadSequence>` on home) in page markup, never the legacy `data-reveal`
presets or `data-order`. Motion implements the eight kinds on the new tier scale (calm: durations
× 0.6; reduced: 160 ms opacity crossfades) and removes the legacy kinds (`headline`, `paragraph`,
`line`, `tags`, …), `data-order` and the 300 / 200 ms `--reveal-calm` / `--reveal-reduced`
timings once nothing references them. Integration deletes any leftovers.

**D5. DealRow mobile counter.** The "1 / 4" position label is UI state and belongs to Layout:
DealRow tracks the snapped card with an IntersectionObserver on its `[data-deal-card]` items
inside the scroll row and writes the label (`[data-deal-position]`). Motion's `useDealScene`
reports no position; its return type stays `{ active: boolean }`.

**D6. Content.** Case sections 02–04 are `problem`, `role` (with `owned` / `notOwned`) and
`approach` (with four `steps`). Each More projects item carries its `projectType` (`form`, `map`,
`dashboard`, `portal`, `calendar`, `checklist`), which selects its ProjectTypeGlyph. Each case
study has exactly five metrics. The slugs stay `team-of-teams` (case 01, ember),
`shared-foundations` (case 02, tide) and `front-door` (case 03, grove). The fixed counts are
checked at build time in `src/lib/content.ts`.

**D7. Bundle.** The hand imports only card metadata (ids, labels, identities, card copy), not
the whole content module, so long page text stays out of the shared client bundle. Client
components read content only through `src/lib/hand-data.ts`, which loads the slim modules
`content/hand.ts` (the four cards and the Coffee card) and `content/site.ts` (chrome labels);
pure helpers are in `src/lib/format.ts`. Page text (case-study sections, Management, About) is
read only by server components through `src/lib/content.ts`; client egg components that need
page copy (workshop draw, "What's on the table") receive it as props from their server page.
`scripts/budget.mjs` stays advisory for this playground: report its number in your handoff; a
result over 170 KB does not block a push. *Implemented by Foundation.*

**D8. MDX.** The `@next/mdx` configuration, its packages and `src/mdx-components.tsx` are
removed: no route renders MDX. The Content session deletes the obsolete `.mdx` and JSON content
files (and `content/adapters.ts`) once its typed modules replace them. *Implemented by Foundation
(configuration) and Content & Images (files deleted).*

**D9. Pages.** Every page, including About, More projects, Contact and 404, moves to the Spread
grid (`.spread-grid` sections with `.col-*` placement); the legacy `.page` layout goes. That is
the Layout session's job in Wave 1. *Implemented by Layout; D3, D4 and D5 by Layout and Motion,
D4's leftovers deleted by Integration (I3).*

---

## Integration decisions (I1–I27)

Taken when the four Wave 1 branches were merged; they answer every contract change request in
the Wave 1 handoffs. Each one is implemented; `docs/handoff/integration.md` says where.

**Accent and identity**

- **I1. `--accent` follows the page identity.** Every `[data-identity]` scope emitted by
  `identityCss()` declares `--accent: var(--id-accent)`; the local workarounds in `globals.css`
  and `illustrations.css` are gone.

**Reveals and motion**

- **I2. Page titles.** `RevealTag` includes `h1`. `PageTitle` renders `<Reveal as="h1"
  kind="lines" order={0}>` (WeightText inside): it reveals on direct loads and client
  navigations. After a play or switch the card → hero morph delivers the case or Management
  title, so the engine marks it revealed at once. Home keeps `<FirstLoadSequence>` (its own title
  sequence). No page uses `data-reveal="headline"`.
- **I3. Tokens only.** The values Motion kept in `choreography.ts` live in `src/motion/tokens.ts`
  (`at.firstLoad`, `duration.digits`, `duration.svgDraw`, `duration.svgDrawCalm`,
  `distance.block`, `reveal.{mask, image, digitRoll, zoomLanded, mobileJobs, heroDrift}`,
  `deal.*`, `timeline.*`, `discard.*`, `field.pinnedDetail`, and for older literals
  `duration.gather`, `duration.liftTimeout`, `stagger.gather`, `angle.lift`, `angle.tap`;
  `deal.flipPerspective` serves every card that turns over); `choreography.ts` holds only the
  tier helpers. `stagger.metric` is `stagger.digits`. Retired: the legacy `data-reveal` presets and
  their aliases in `kindOf()`, `data-order`, `--reveal-calm`, `--reveal-reduced`, `--angle-word`,
  `--angle-metric`, every unreferenced `duration` / `stagger` / `at` entry (and `angle.handTilt`,
  `weight.medium`, `field.drift`, `ease.settle`), `src/components/blocks.tsx`,
  `section-title.tsx` and `title-fill.tsx` (D4).
- **I4. Illustration fills and labels** are `data-draw-fill` and `data-draw-label`. The `draw`
  kind fades a group's labels in as the group starts and its tints once its strokes are drawn.
  There is no fill heuristic and no `data-tint` (every tint carries `data-draw-fill`, checked in
  the browser on every page).
- **I5. Breaker lift.** Full-bleed breakers carry `data-breaker` (every `Spread`, and the case
  study's 02 Problem section with its statement); the background field's 10% lift reads
  `[data-breaker]` and holds while any breaker is in view (counted: adjacent breakers overlap).
- **I6. Hero drift.** `.hero-drift` sits on the hero `<picture>` inside the
  `[data-hero-target]` frame, which clips its overflow with `overflow: clip` (not `hidden`: a
  scroll container would capture the `view()` timeline, and the drift would never move).
- **I7. 404.** The discard fall animates `.lost-card` (the draw reveal around `DiscardedCard`)
  from above to its own resting pose.
- **I8. Minimap.** `aria-current="location"` is set by Layout's `MinimapObserver` only.
- **I9. Workshops.** Management's workshop formats are a static row on desktop (no pinned scene:
  the team structure is already pinned on that page) and a scroll-snap row with its "n / N"
  counter on mobile (`WorkshopRow`). `useDealScene` keeps its signature and is used only by the
  case-study `DealRow`.
- **I10. Reading hairline exception.** The rule "at most one scroll-linked effect per viewport"
  does not count the reading hairline: it is a 1 px progress indicator and may run next to one
  other scroll-linked effect (hero drift, the pinned deal, the About timeline).

**Illustrations**

- **I11. Labels are SVG `<text>`** in `--font-mono` (no font is embedded). Labelled drawings have
  no root `viewBox`: they keep their proportions with CSS `aspect-ratio`, and the root is a size
  container, so give it a definite width and size it by width only.
- **I12. Narrow columns.** A wide drawing in a narrow column takes its vertical layout: pass
  `variant="vertical"` when the column is narrow at every width. The Approach drawing is narrow
  only in the sticky column from 1024 px, so it renders both layouts (`auto`) and `detail.css`
  shows the vertical one there, capped by the viewport height so it stays in view while pinned;
  below 1024 it spans the reading column with the default layouts. Every placement was checked
  in the browser.
- **I13. Alignment with the page's HTML.** `AboutTimeline` places its stops at
  `x = (i + 0.5) × 960 / n` (with `labels={false}` it is line and dots only, 960×120);
  `CareerMatrix` with `axes={false}` spreads its levels and tracks evenly edge to edge, so HTML
  axis labels in equal columns and rows line up; `DiscardedCard` is one upright card (the page
  tilts it with `--angle-discard` and lays it on its pile).
- **I14. Content in data props.** About passes `about.timeline.items` to `AboutTimeline`.
  Each Management workshop format names its `WorkshopGlyph` (`glyph`): Kick-off canvas →
  `one-two-four-all`, Service blueprint jam → `fishbowl`, Design studio → `crazy-eights`, Retro
  with a twist → `dot-voting`. `CareerMatrix` takes `growth.levels` / `growth.dimensions`;
  `WeekRing` takes the weekly rituals the content names.
- **I15. Any section.** Illustrations may sit in any case-study section through
  `SectionCopy.illustration`, not only in the artefacts.

**Content and schema**

- **I16. Captions.** `SectionCopy` and `SectionHead` have an optional `caption` for their image.
  `Spread` shows a caption only when one is set, never the alt text or a fallback label.
- **I17. Workshop labels.** `site.labels.workshop` (`duration`, `who`, `outcome`) labels the
  fields on the workshop cards.
- **I18. Topography label**: "Interlaken, between Lake Thun and Lake Brienz" (attribution and
  placeholder note unchanged).
- **I19. Docs** follow the content: `HandCardCopy.facts` holds the card's own facts (two in the
  final content); deleted content files and placeholder seeds are no longer named.

**Page fixes**

- **I20. Phones never widen.** Scoreboard values wrap between words (`.scoreboard-word`), so
  "9 → 3 weeks" and "3 weeks → 4 days" fit at 390 px. Nothing may widen the viewport: overflow
  aborts the card view transitions on phones.
- **I21. Portrait photos** (`team-of-teams-hero`, `about-tcg2`) are rebuilt as 3:2 crops
  (`crop: [3, 2]` in the manifest → `fit=crop&crop=entropy&w=2048&h=1365`); the hero frame and
  the Spread use `object-fit: cover`.
- **I22. Dark placeholders.** `fetch-and-build.mjs` clamps every placeholder colour to at most
  the ink glow's luminance, so nothing flashes light before an image decodes.
- **I23. Hero priority.** The case hero `<Picture>` is `priority` (eager, `fetchpriority="high"`)
  and never inside an image reveal.
- **I24. Home clears the fan** at 1440×900 and 390×844 with the real intro: from 1024 px the
  role and intro sit beside the name (columns 7–12); on phones the hero starts under the header
  and the intro uses the body size.
- **I25. Closing contact.** After 09 Next (case studies) and Next (Management), `ClosingContact`
  renders one quiet line: `site.labels.contactTitle` in the index column, `contactText` and a
  `contactLink` mail link. No card.
- **I26. Open Graph.** The deploy workflow passes `SITE_URL` (the `base_url` output of
  `actions/configure-pages`) to the build; `about-og` (1280 px JPEG) becomes the default Open
  Graph image with `metadataBase` only when it is set. Never hard-coded; local builds have none.
- **I27. Smoke** reads card and page titles from `content/hand.ts` and
  `content/pages/not-found.ts` (Node type stripping) instead of hard-coding them.

---

## Ownership (Wave 1)

Wave 1 is merged; the table is kept as the default split for future parallel waves.

```text
- Foundation (read-only for everyone in Wave 1): docs/contracts.md, CLAUDE.md, src/design/**, src/styles/layout.css, src/styles/type.css, tokens.ts, content/schema.ts, src/components/hand/**, header.tsx structure, table-store.ts.
- Layout & Pages: app/** pages, src/components/layout/**, detail-page.tsx, case-hero.tsx, blocks.tsx, next-project.tsx, about-topo.tsx, src/styles/pages/**.
- Motion: src/motion/** except tokens.ts, src/components/reveals.tsx, src/components/reading-hairline.tsx, src/styles/reveal.css, src/styles/hand.css, src/components/background/**, src/eggs/** behaviour, scripts/smoke.mjs.
- Illustrations: src/components/illustrations/**.
- Content & Images: content/** except schema.ts, scripts/images/**, public/images/**, src/components/picture.tsx.
```

Paths the table does not name, and how to read the short names in it:

| Path | Owner |
| --- | --- |
| `tokens.ts` = `src/motion/tokens.ts`; `table-store.ts` = `src/motion/table-store.ts` | Foundation |
| `header.tsx structure` = the markup of `src/components/header.tsx` (links, order, the hairline mount) | Foundation |
| `src/components/header.module.css` (header look, not markup) | Layout & Pages |
| `src/lib/**` (`content.ts`, `hand-data.ts`, `format.ts`, `cards.ts`, `site.ts`, `cx.ts`), `src/styles/tokens.css`, `next.config.ts`, `tsconfig*.json`, `.github/**`, `docs/art-direction.md` | Foundation |
| `content/hand.ts`, `content/site.ts` (slim modules, D7) | Content & Images, under one rule: they import no page text |
| `src/app/**` (all of it: `layout.tsx`, `globals.css`, `fonts.ts`, routes) | Layout & Pages |
| `src/components/page-title.tsx`, `section-title.tsx`, `title-fill.tsx`, `page-transition.tsx`, `site-footer.*`, `display-settings.*` | Layout & Pages |
| `src/components/weight-text.tsx`, `play-link.tsx`, `route-focus.tsx`, `live-region.tsx`, `reading-hairline.module.css`, `src/styles/view-transitions.css`, `field.css`, `eggs.css` | Motion |
| `src/components/picture.css`, `scripts/topo/**`, `public/topo/**` | Content & Images |
| `docs/handoff/<agent>.md` | that agent |
| `README.md`, `package.json`, `package-lock.json`, `scripts/{budget,audit,vitals,lighthouse,serve-static}.mjs` | Integration (Wave 1 may run them, not change them) |

`src/app/globals.css` already imports every session's CSS entry point once (see its header), so no
session other than Layout needs to touch it.

Responsibilities the decisions place (no path changes owner):

- D1: `hand.tsx` (Foundation) and the pre-paint line in `src/motion/preferences.ts` (Motion keeps it).
- D3: `data-hero-target` on the hero frame: Layout; `heroTarget()`: Motion.
- D4: Layout writes only `<Reveal>`; Motion implements and removes the legacy kinds; Integration
  deletes leftovers.
- D5: DealRow's position label: Layout (not Motion).
- D7: the egg components' copy props (`WorkshopDraw`, `OnTheTable`): Motion owns the components,
  Layout passes the props from the pages.
- D8: deleting obsolete `.mdx` / JSON content and `adapters.ts`: Content & Images.

---

## File map

```
docs/
  contracts.md                 this file
  art-direction.md             "The Table": the brief every session designs to
  handoff/README.md            how each Wave 1 session reports; <agent>.md per session
content/
  schema.ts                    types for all content (Foundation)
  index.ts                     the typed entry point (server): export const content = {...} satisfies Content
  hand.ts                      slim: the four cards + the Coffee card (client-safe, D7)
  site.ts                      slim: chrome labels (client-safe, D7)
  cases/*.ts                   the three case studies (server only)
  pages/*.ts                   home, Management, workshop methods, More projects, About, Contact, 404
  images.ts                    image registry used by <Picture> (generated by scripts/images/fetch-and-build.mjs)
scripts/images/                manifest.mjs (photos, alt, credits, crops), fetch-and-build.mjs, check.mjs
src/design/
  palette.ts                   colour identities (ink, ember, tide, grove, saffron, glacier)
  layout.ts                    typed mirror of src/styles/layout.css
  type.ts                      typed mirror of the scale in src/styles/type.css
src/styles/
  tokens.css                   surfaces, legacy sizes, radii, hand geometry, layers
  layout.css                   Spread grid, spacing, header height, hand reserve, grid utilities
  type.css                     type scale tokens and .t-* classes, base type
  reveal.css, hand.css, view-transitions.css, field.css, eggs.css      (Motion)
  pages/detail.css, pages/pages.css                                     (Layout)
src/motion/
  tokens.ts                    motion tokens (Foundation; every motion value lives here, I3)
  scenes/deal-scene.ts         useDealScene (Motion); scenes/timeline-scene.ts, scenes/pin.ts
  table-store.ts               the table store (Foundation)
  reveal.ts                    the reveal engine; kinds.ts (the eight kinds), jobs.ts (scheduler),
                               first-load.ts, split.ts (Motion+ splitText), deal.ts, choreography.ts
                               (tier helpers only)
  play.ts, transitions.ts, preferences.ts, use-tier.ts, view-transition.ts (Motion)
src/components/
  hand/                        hand.tsx, hand-counter.tsx, card-face.tsx (Foundation)
  layout/                      SectionIndex, NumeralBreaker, Spread, MetaPairs, Scoreboard,
                               DealRow, WorkshopRow, MarginNote, Minimap (+ MinimapObserver),
                               Section, use-deal-position.ts, layout.css, index.ts (Layout)
  illustrations/               15 drawings, frame.tsx (kit), geometry.ts, badges.tsx, types.ts,
                               illustration.tsx, index.ts, illustrations.css, README.md (Illustrations)
  reveals.tsx                  <Reveals/>, <Reveal>, <FirstLoadSequence> (Motion)
  reading-hairline.tsx         <ReadingHairline/> (Motion), mounted in header.tsx
  picture.tsx                  <Picture> (Content & Images)
  header.tsx                   header (structure: Foundation)
  detail-page.tsx, case-hero.tsx, next-project.tsx, closing-contact.tsx, about-topo.tsx (Layout)
src/lib/
  content.ts                   server: all typed content, count checks, getCaseStudy (+ format helpers)
  hand-data.ts                 client-safe: handCards (exactly 4), cardById, cardForPath, nextCard,
                               handLabels, coffeeEgg, site (D7)
  format.ts                    pad2, cardNumber, fill (no imports)
  cards.ts                     re-export of hand-data.ts (compatibility)
  site.ts                      basePath, withBase(); siteOrigin / absoluteUrl() (server, from SITE_URL)
  cx.ts                        class-name join
```

---

## Layout tokens

Source: `src/styles/layout.css`. Typed mirror: `src/design/layout.ts` (`breakpoints`, `media`,
`grid`, `baseline`, `sectionSpace`, `headerHeight`, `handReserve`, `gridClasses`).

**Breakpoints** (min-width): `sm` 640, `md` 1024, `lg` 1440, `marginNotes` 1680 (CSS
`--breakpoint-sm`, `--breakpoint-md`, `--breakpoint-lg`, `--breakpoint-margin-notes`; media
queries cannot read custom properties, so the `@media` rules repeat the values). Mobile first.
The hand switches from rail/sheet to the desktop fan at `md` (1024).

| Range | Columns | Margin | Gutter | Notes |
| --- | --- | --- | --- | --- |
| < 640 | 4 | `clamp(20px, 5.3vw, 28px)` | 12 px | everything stacks |
| 640–1023 | 8 | 32 px | 16 px | everything stacks |
| 1024–1439 | 12 | 48 px | 24 px | index in columns 1–3, content in 4–11 |
| ≥ 1440 | 12 × max 96 px | ≥ 48 px | 24 px | `[full-start] minmax(48px,1fr) [content-start] repeat(12, minmax(0,96px)) [content-end] minmax(48px,1fr) [full-end]` |
| ≥ 1680 | as ≥ 1440 | | | margin notes in column 12 + the right outer track (D2) |

"Margin" is the distance from the viewport edge to the first column. CSS `column-gap` also sits
between the outer track and column 1, so the outer tracks are `--grid-edge` = margin − gutter
(at ≥ 1440: `minmax(var(--grid-edge), 1fr)`); the visible margin is exactly the token.

**Custom properties**

| Property | Value |
| --- | --- |
| `--grid-columns` | 4 / 8 / 12 |
| `--grid-margin` | `clamp(20px, 5.3vw, 28px)` / 32px / 48px |
| `--grid-gutter` | 12px / 16px / 24px |
| `--grid-column-max` | 96px (≥ 1440) |
| `--grid-edge` | `calc(var(--grid-margin) - var(--grid-gutter))` (outer track) |
| `--baseline` | 4px (vertical rhythm unit) |
| `--space-s` / `--space-m` / `--space-l` | 64 / 96 / 144 px below 1024; 96 / 160 / 240 px from 1024 |
| `--header-h` | 64px |
| `--hand-reserve` | from 1024: `var(--hand-reserve-desktop)` = 176px on home, `var(--hand-reserve-collapsed)` = 120px under `:root[data-hand="collapsed"]` (every other route, D1); below 1024: `calc(48px rail + env(safe-area-inset-bottom) + 16px)` |
| `--breakpoint-sm` / `-md` / `-lg` / `-margin-notes` | 640px / 1024px / 1440px / 1680px |
| `--gutter` | legacy alias of `--grid-margin` (older components pad with it) |

The last block on every page (the site footer) pads `var(--hand-reserve)` at the bottom so
nothing hides under the hand. `data-hand="collapsed"` is set on every route except home (D1).

**Grid utilities** (use these; do not re-declare the grid in pages):

| Class | Placement |
| --- | --- |
| `.spread-grid` | the grid itself: `display: grid` with named lines `full-start`, `content-start`, `content-end`, `full-end` and the column gap |
| `.col-full` | `full-start / full-end` (edge to edge) |
| `.col-wide` | `content-start / content-end` (all columns) |
| `.col-index` | all columns below 1024; columns 1–3 (`2 / 5`) from 1024 |
| `.col-content` | all columns below 1024; columns 4–11 (`5 / 13`) from 1024 |
| `.col-margin` | like `.col-content` below 1680 (inline, below the text); from 1680 column 12 + the right outer track (`13 / full-end`) (D2) |

Each section is its own `.spread-grid` (full width), so nested blocks line up without subgrid.
Below 1024 every `.col-*` stacks in source order.

---

## Type tokens

Source: `src/styles/type.css`. Typed mirror: `src/design/type.ts` (`type`, `fluid()`,
`typeClasses`). Sizes are fluid between a 390 px and a 1440 px viewport (`clamp()` in rem, so
they follow the browser's font size). Fonts: `--font-display` (Bricolage Grotesque, opsz 12–96,
wght 200–800), `--font-text` (Hanken Grotesk), `--font-mono` (Martian Mono).

| Style | Class | Family / weight | opsz | Size 390 → 1440 | Line height | Tracking |
| --- | --- | --- | --- | --- | --- | --- |
| label | `.t-label` | Martian Mono 500, uppercase, tabular | – | 11 → 12 px | 16 px | +0.08em |
| body | `.t-body` | Hanken Grotesk 400, max 62ch | – | 17 → 19 px | 28 px | – |
| lead | `.t-lead` | Hanken Grotesk 400 | – | 21 → 28 px | 32 px | – |
| h3 | `.t-h3` | Bricolage 600 | 24 | 22 → 32 px | 1.15 | −0.01em |
| h2 | `.t-h2` | Bricolage 600 | 72 | 36 → 72 px | 1.04 | −0.02em |
| display | `.t-display` | Bricolage 700 | 96 | 56 → 168 px | 0.92 | −0.03em |
| numeral | `.t-numeral` | Bricolage 300, lining tabular | 96 | 88 → 240 px | 0.8 | −0.04em |
| numeral outline | `.t-numeral-outline` (with `.t-numeral`) | transparent fill, 1 px text stroke in `currentColor` | | | | |

Custom properties, for each style `S` in `label, body, lead, h3, h2, display, numeral`:
`--type-S-size`, `--type-S-leading`, `--type-S-weight`, plus `--type-label-tracking`,
`--type-body-measure`, `--type-{h3,h2,display,numeral}-opsz`,
`--type-{h3,h2,display,numeral}-tracking`, `--type-numeral-stroke` (1px).

The display classes set `--wght` and `--opsz`, which weight-animated text (`WeightText`, the
headline and h2 reveals) interpolates; the motion tokens `weight.h1`, `weight.h2`, `weight.h3`,
`opsz.end`, `opsz.h2`, `opsz.h3` read from `src/design/type.ts`, so animated headlines settle on
the scale. `body` uses the body size; legacy size tokens (`--text-sm`, `--text-lg`, `--text-xl`,
`--text-2xl`, `--text-display`, `--text-hero`, `--text-page`) remain in `tokens.css` for existing
components and may be retired by Layout as pages move to the scale.

---

## Motion tokens

Source: `src/motion/tokens.ts` (TypeScript constants, seconds), emitted as CSS custom properties
by `motionCss()` into `<head>` (per tier under `:root[data-motion="calm|reduced"]` and
`@media (prefers-reduced-motion: reduce)`). Springs are converted to CSS `linear()` by
`springCss()`. No bounce, elastic or overshoot anywhere: the béziers stay in [0, 1] and every
spring is critically damped.

**The scale (use for all new work)**

| Token (TS) | CSS | Value |
| --- | --- | --- |
| `dur.xs` / `s` / `m` / `l` / `xl` | `--dur-xs` … `--dur-xl` | 160 / 240 / 420 / 640 / 900 ms (full) |
| `ease.outExpo` | `--ease-out-expo` | `cubic-bezier(0.16,1,0.3,1)` |
| `ease.outQuint` | `--ease-out-quint` | `cubic-bezier(0.22,1,0.36,1)` |
| `ease.inOut` | `--ease-in-out` | `cubic-bezier(0.65,0,0.35,1)` |
| `stagger.words` | `--stagger-words` | 70 ms |
| `stagger.lines` | `--stagger-lines` | 60 ms |
| `stagger.items` | `--stagger-items` | 50 ms |
| `stagger.cards` | `--stagger-cards` | 80 ms |
| `stagger.svgGroups` | `--stagger-svg-groups` | 120 ms |
| `motionScale` | `--motion-scale` | full 1, calm 0.6, reduced 0 |
| `reducedCrossfade` | `--dur-reduced` | 160 ms |
| `durFor(tier, step)` | – | full: as is; calm: × 0.6; reduced: always 160 ms |

Tier behaviour of the scale: **full** as listed; **calm** (site toggle) every `--dur-*` × 0.6
(96 / 144 / 252 / 384 / 540 ms); **reduced** (`prefers-reduced-motion`, always wins over calm)
every `--dur-*` = 160 ms and the only allowed change is an opacity crossfade (travel distances
are 0). Read the tier with `useMotionTier()` / `readTier()` / `onTierChange()` from
`src/motion/use-tier.ts`; the root carries `data-motion="full|calm|reduced"`.

**Table vocabulary**: `ease.outSoft` (= outQuint), `draw` (= outExpo), `bloom` (= inOut),
`zoom`, `return`, `in` → `--ease-out-soft`, `--ease-draw`, `--ease-bloom`, `--ease-zoom`,
`--ease-return`, `--ease-in`; springs `play`, `hover`, `land` → `--spring-play`,
`--spring-hover`, `--spring-land` and `--spring-*-dur`; `duration.*` → `--dur-<kebab>` (e.g.
`--dur-zoom`, `--dur-sheet`, `--dur-fast`), tier-scaled by `tiers.{vt,ui}`; `distance.*` →
`--travel-<kebab>` (0 in calm and reduced); `stagger.digits` (40 ms between a Scoreboard value's
strips); `at.firstLoad` (home sequence: title 520, role 900, intro 1000, rest 1300 ms),
`at.navigate`, `at.switchNavigate`; `angle.*` (`--angle-discard`, `--angle-tap`), `weight.*`
(`--wght-<kebab>`), `opsz`, `field.*` (incl. `pinnedDetail`), `hand.*` (geometry mirrored in
`tokens.css`).

**Reveal choreography** (I3): `duration.digits` 700 ms, `duration.svgDraw` 1200 ms /
`svgDrawCalm` 500 ms, `distance.block` 12 px; `reveal` = trigger (`amount` 0.25, `margin`), `mask`
1.1 (lines rise from 110%), `image` (`inset` 0.1, `scale` 1.12), `digitRoll` 5, `zoomLanded` 0.6
(after a play or switch the page reveals once 60% of the zoom has run), `mobileJobs` 8,
`heroDrift` 0.06 (`--hero-drift`); `deal` = `stage` 250 svh, `phases`, `landTilt`,
`flipPerspective`, `toss`, `below`; `timeline` = `start` / `end` range, `groupSpan`; `discard` =
`drop`, `fade`. `src/motion/choreography.ts` only applies the tiers (`msFor`, `spanFor`, `gapFor`,
`drawFor`).

---

## Colour

`src/design/palette.ts`: identities `ink` (home, #0E0F11 field, text #ECEAE4), `ember` (case 1),
`tide` (case 2), `grove` (case 3), `saffron` (Management), `glacier` (About). Each has `field`,
`mid`, `glow`, `accent`, `ink`, as `--<identity>-<key>`. Inside `[data-identity="<identity>"]`
the current identity is `--id-field`, `--id-mid`, `--id-glow`, `--id-accent`, `--id-ink`, and
`--accent` follows `--id-accent` (each scope re-declares it, I1). Body text is always `--text`; accents only for links, focus,
metrics, dividers, illustration strokes; text on a glow surface uses the identity's `ink`.
Other: `--text`, `--muted`, `--line`, `--glacier-lines`, `--glacier-text`.

---

## Hand

`src/components/hand/**` (Foundation; styles in `src/styles/hand.css`, Motion).

- Exactly **four cards**: the three case studies and Management, in `content/hand.ts` order
  (`handCards` in `src/lib/hand-data.ts` throws otherwise). No face-down deck. "New hand"
  re-deals these four.
- **Data (D7)**: the hand, the header, the eggs, the table store, play, the case hero and DealRow
  import content only from `src/lib/hand-data.ts` (`handCards`, `cardById`, `cardForPath`,
  `nextCard`, `handLabels`, `coffeeEgg`, `site`, `type HandCard`) and helpers from
  `src/lib/format.ts`; never `src/lib/content.ts`. `src/lib/cards.ts` re-exports `hand-data.ts`.
- **Reserve (D1)**: the hand sets `data-hand="collapsed"` on `<html>` on every route except home
  (and the pre-paint script does the same for the first paint).
- `<nav class="hand" aria-label="Work">`, one tab stop (roving `tabindex`, arrows, Home/End).
  Card links: `a.hand-card[data-play="<id>"][data-roving="<id>"]` in `li.hand-slot[data-slot="<id>"]`.
  The open card shows `.hand-ghost` ("Viewing").
- Desktop (≥ 1024): fan at the bottom centre. Mobile: fan on home; elsewhere a 48 px peek rail
  (`button.hand-rail`) that opens the list as a bottom sheet (`#hand-sheet`, native popover).
  The sheet also has plain links: **More projects, About, Contact** (`ul.hand-sheet-links`,
  shown only in the sheet). "More projects" also stays in the header.
- **Card counter** (home only): `p.hand-counter[aria-live="polite"][aria-atomic="true"][data-chrome]`
  with `[data-counter-index]` ("01"), "/ 04", `[data-counter-title]` (card title), both in
  `.t-label`, and `[data-counter-text]` (sr-only, `hand.labels.counter`: "Card 2 of 4: Shared
  Foundations"). It follows the table store's `hoverCard` (pointer hover after the 80 ms intent,
  keyboard focus), shows the first card when nothing is hovered or focused, and keeps the played
  card while it lifts. `data-card="<id>"` on the counter names the card shown. Position: bottom
  left beside the fan on desktop, above the fan on mobile. A long press (800 ms) deals a new hand.
- **Table store** (`src/motion/table-store.ts`, Foundation): `table.get()` →
  `{ activeCard, hoverCard, lastPlayed, tier, sheetOpen, breaker, field }`;
  `table.subscribe((state, prev) => …)`; `hover(id)`, `play(id, rect, href)`, `returnHome(href)`,
  `route(path, initial)`, `setTier`, `setSheet`, `setBreaker`, `registerSlots`, `slotOf`,
  `takeIntent()` (`'play' | 'switch' | 'return' | null`). Subscribers write DOM / uniforms
  directly; hovering or playing never re-renders React.
- View-transition names: `card-<id>`, `card-title-<id>` (hand card ↔ detail hero), `hand`,
  `hand-rail`, `site-header`, `site-footer`. Transition types: `play`, `return`, `switch`, `nav`
  (`src/motion/transitions.ts`).
- Stage 1 of play lifts the card toward the hero; `heroTarget()` in `src/motion/play.ts`
  measures `main [data-hero-target]` at play time when it is on screen (D3) and falls back to the
  computed geometry otherwise (playing from home, where no hero is mounted yet).

---

## Layout components

`src/components/layout/**` (Layout & Pages), exported from `src/components/layout/index.ts`,
styled in `src/components/layout/layout.css`. All are server components except DealRow (client,
for the scene hook). All accept `className`. All render their final, static state.

### SectionIndex

`<SectionIndex number={1} label="Context" className? />` → `p.section-index.t-label[data-section-index="1"]`
with `.section-index-number` ("01") and `.section-index-label`. Sticky in `.col-index` from 1024
(`top: header + 24px`), static above the body below.

### NumeralBreaker

`<NumeralBreaker value={5} className? />` → `div.numeral-breaker[aria-hidden][data-numeral]` with
`span.t-numeral.t-numeral-outline` ("05"; numbers padded to two digits, strings as given). Its
bottom margin is −1/3 of the numeral's line box, so it overlaps the next block by a third; the
next siblings sit above it (`z-index: 1`). Use with `.col-full`.

### Spread

`<Spread image="<ImageId>" caption? sizes="100vw" priority? className? />` →
`figure.spread.spread-grid.col-full[data-spread][data-breaker]` holding `<Picture class="spread-media col-full">`
and, only when `caption` is set (I16), `figcaption.spread-caption.col-margin.t-label`. Full bleed,
image capped at 84svh with `object-fit: cover`; caption in the margin track from 1680 (D2), below
the image otherwise. `data-breaker` lifts the background field while it is in view (I5).

### MetaPairs

`<MetaPairs items={[{ label, value }]} label? className? />` (`type MetaPair = { label: string; value: ReactNode }`)
→ `dl.meta-pairs[data-count]` of `div.meta-pair` > `dt.meta-pair-label.t-label` + `dd.meta-pair-value`.
Ruled (1 px top rule), five across from 1024, two columns below. Case studies pass the five
`meta` fields in the order client, timeframe, role, team, type with `site.labels.meta`.

### Scoreboard

`<Scoreboard metrics={Metric[]} label? className? />` → `<Reveal as="dl" kind="digits">` with class
`scoreboard`, `div.scoreboard-item` > `dt.scoreboard-label.t-label` + `dd.scoreboard-value`.
The value holds an sr-only copy and an `aria-hidden` `span.scoreboard-digits[data-digits]` with
one `span.scoreboard-word` per word holding one `span[data-digit]` per character, and
`.scoreboard-unit`; values wrap between words, never inside one (I20). Martian Mono, tabular.
Five across from 1024, two below. Renders nothing for an empty list.

### DealRow

`<DealRow decisions={Decisions} labels? className? />` (client). `decisions` is exactly four
`{ decision, chose, tradeOff, why }`; `labels` defaults to `site.labels.decision`. Calls
`useDealScene(ref, { cards: 4 })` on its root:
`div.deal-row[data-scene="deal"][data-scene-active?]` > `ol.deal-row-list` >
`li.deal-card[data-deal-card="1..4"]` (`.deal-card-index.t-label`, `h3.deal-card-title.t-h3`,
`dl.deal-card-fields`) and `p.deal-row-position.t-label[data-deal-position]` ("1 / 4",
`aria-hidden`). Desktop: a row of four that the deal scene pins and deals in the full tier
(static in calm and reduced). Mobile: horizontal scroll-snap row; `useDealPosition` updates the
"1 / 4" label from the snapped card with an IntersectionObserver (D5).

### WorkshopRow

`<WorkshopRow formats={WorkshopFormat[]} glyphs?={ReactNode[]} className? />` (client): Management's
workshop formats with DealRow's markup (`div.deal-row.deal-row-workshops` > `ol.deal-row-list` >
`li.deal-card[data-deal-card]`, `p[data-deal-position]`) but no `data-scene` and no scene hook (I9):
a static row on desktop, a scroll-snap row with its "n / N" label on mobile. Each card: number and
glyph (`glyphs[i]`, rendered by the server page: `<Reveal kind="draw"><WorkshopGlyph method={glyph}>`),
name, then `dl` fields labelled by `site.labels.workshop` (I17).

### MarginNote

`<MarginNote label? className?>text</MarginNote>` → `aside.margin-note.col-margin[data-margin-note]`.
Column 12 + outer track from 1680 px (`--breakpoint-margin-notes`); below that an inline aside in
the content column with a 1 px left rule (D2).

### Minimap

`<Minimap sections={[{ id, label }]} label? className? />` (`type MinimapSection`) →
`nav.minimap[aria-label=site.labels.sections][data-minimap]` > `ol` > `a.minimap-tick[href="#<id>"][data-minimap-tick="<id>"]`
(label shown as a pill on hover / focus). Fixed at the right edge from 1024, hidden below. Each
`id` is the id of a `[data-section]` element. The current section gets `aria-current="location"`
from Layout's `MinimapObserver`, its only writer (I8).

### Section (helper)

`<Section id number label title titleHidden? breaker? lift? space? pin? className?>children</Section>`
composes the above: `section#<id>.page-section.spread-grid.space-<s|m|l>[data-section="<id>"][aria-labelledby]`
(`[data-breaker]` with `lift`), optional NumeralBreaker, SectionIndex in `.col-index` (sticky over
`pin` grid rows), the `h2#<id>-title.section-title.t-h2` (a `lines` reveal; plain and sr-only with
`titleHidden`) and the children as direct grid items. Not a contract of its own: Layout may change
or drop it.

### ClosingContact

`<ClosingContact />` (server), rendered by `DetailPage` after the sections: the quiet end point of
the case studies and Management (I25): `aside.closing-contact.page-section.spread-grid` with the
`site.labels.contactTitle` label in `.col-index` and one `block` reveal line in `.col-content`:
`contactText` and a `contactLink` mail link to `contact.email`.

---

## Reveal

`src/components/reveals.tsx` (Motion). Styles: `src/styles/reveal.css`. Logic: `src/motion/reveal.ts`.
After Wave 1 the kinds below are the only reveal system (D4).

```tsx
<Reveal as="p" kind="lines" order={0} delay={120} className="t-body">…</Reveal>
<FirstLoadSequence>{home hero}</FirstLoadSequence>
```

- `type RevealKind = 'lines' | 'block' | 'list' | 'image' | 'digits' | 'rule' | 'draw' | 'note'`
  (`revealKinds`). `as?: RevealTag` (div, section, article, aside, header, footer, figure, p,
  span, h1, h2, h3, ul, ol, dl, li, blockquote, hr; default div). Other HTML attributes pass
  through. These eight kinds are the only reveal system (D4, I3).
- Renders `data-reveal="<kind>"`, `data-reveal-order="<order>"` (position in the first-viewport
  sequence; equal orders start together; omitted = reveal on scroll) and `data-reveal-delay="<ms>"`.
- **How it runs** (`src/motion/reveal.ts`, `kinds.ts`, `jobs.ts`): while the pre-paint script has
  armed the page (`:root[data-reveal]`), CSS hides unrevealed blocks with `opacity: 0` only
  (never the eager hero image, never digits in reduced). Every movement is a WAAPI animation
  started by JS that holds its start pose with a backwards fill, so reduced motion never sees a
  transform and without JavaScript the arming is dropped after 4 s. A job marks the block
  `data-revealed`, runs its kind, and at the end cancels its animations and removes `will-change`
  (nothing animated at rest). Below 1024 px at most `reveal.mobileJobs` jobs run at once.
- Triggers: `data-reveal-order` blocks in the first viewport play in sequence (base + 80 ms ×
  (order + 1) + delay; base = 0, or `reveal.zoomLanded` of the morph as the tier runs it after a
  play (`duration.zoom`) or switch (`switchDelay + switchIn`), × `tiers[tier].vt`, 0 in reduced);
  everything else reveals once 25% is in view (a block taller than the viewport: once it covers
  25% of the viewport's height; Motion `inView`, once), blocks entering in the same
  frame 50 ms apart in document order, and a block revealing with the same kind as the block
  before it at least 80 ms after it. A `note` waits for its related paragraph: the last `block` /
  `lines` reveal before it in its section.
- Page titles (I2): `PageTitle` is `<Reveal as="h1" kind="lines" order={0}>`; after a play or
  switch the engine marks it revealed at once (the morph delivers it).
- Kinds: `lines` paragraph lines rise from a mask (Motion+ `splitText` after the fonts are ready;
  WeightText titles per word; stagger lines); `block` rises `distance.block` with opacity; `list`
  items in turn (stagger items); `image` clip inset + inner scale settle; `digits` Scoreboard
  digit strips roll in (`[data-digit]`, stagger digits); `rule` a hairline draws (scaleX); `draw`
  SVG strokes draw by group (`[data-draw]`, `[data-draw-group]`, stagger svgGroups), labels
  (`[data-draw-label]`) fade in as their group starts and tints (`[data-draw-fill]`) once it is
  drawn (I4); `note` fades in after its paragraph. Reduced: one 160 ms opacity crossfade, digits
  static, drawings shown. Calm: durations × 0.6, `lines` split only on h1 / h2, strokes 500 ms.
- `<FirstLoadSequence className?>`: wraps the home hero; renders `div[data-first-load]` with
  `display: contents`. First visit in the session: the hand is dealt (0 ms), the title's words
  turn up with the opsz / wght settle (520), the role line (900), the intro (1000), the rule and
  the rest (1300 + 50 each), then `[data-chrome]` (header, card counter). Revisits and client
  navigations to home: one 300 ms crossfade. Any key, click, wheel or scroll completes it.
- `<Reveals />` (mounted once in `layout.tsx`) runs the engine for each route
  (`revealRoute(kind: NavigationKind)`, `NavigationKind = 'first' | 'repeat' | 'load' | 'nav' |
  'play' | 'switch' | 'return'`).

---

## Scenes

`src/motion/scenes/deal-scene.ts` (Motion).

```ts
type DealSceneOptions = { cards: number }
type DealSceneState = { active: boolean }
function useDealScene(ref: RefObject<HTMLElement | null>, options: DealSceneOptions): DealSceneState
```

Full tier, from 1024 px, used only by the case-study `DealRow` (I9): the root becomes a
`deal.stage` (250 svh) sticky stage, the card row pins under the header and Motion's `scroll()`
deals the four cards from a deck in five phases (`deal.phases`), each landing with a quarter of
its hand-fan tilt, then the row squares up; the background field renders at
`field.pinnedDetail` of its resolution while pinned. Calm, reduced, narrow screens or a row
taller than the space under the header: nothing is touched and the static row stays. Returns
`{ active }` (`data-scene-active` on the root while it runs). The mobile "1 / 4" position is not
scene state; DealRow (Layout) tracks it (D5). The About timeline is linked to its view progress
(`scenes/timeline-scene.ts`, full tier, native `ViewTimeline`; otherwise the normal draw reveal).
New scenes live in `src/motion/scenes/<name>-scene.ts` and target `[data-scene="<name>"]`.

---

## Reading hairline

`<ReadingHairline />` (`src/components/reading-hairline.tsx`, Motion), mounted inside
`header.tsx` (last child of the fixed header). Renders
`div[data-reading-hairline][aria-hidden]` (1 px, along the header's bottom edge) with a bar
scaled by `transform: scaleX(var(--reading-progress, 0))` (origin left, colour `--id-accent`).
Motion sets `--reading-progress` (0–1) on `[data-reading-hairline]` (CSS `animation-timeline:
scroll(root)` where supported, Motion `scroll()` otherwise); in every tier it stays a progress
indicator (reduced: drawn with a clip, no transform). It is the one allowed exception to "at most
one scroll-linked effect per viewport" and may run next to one other (I10).

---

## Illustrations

`src/components/illustrations/**` (Illustrations), exported from `index.ts`.

```ts
type IllustrationVariant = 'auto' | 'horizontal' | 'vertical'
type IllustrationProps = { className?: string; titleId?: string; title?: string; description?: string; variant?: IllustrationVariant }
type WorkshopMethod = 'crazy-eights' | 'one-two-four-all' | 'dot-voting' | 'fishbowl'
type ProjectType = 'form' | 'map' | 'dashboard' | 'portal' | 'calendar' | 'checklist'
type ProjectTypeGlyphProps = IllustrationProps & { type: ProjectType }
type IllustrationName = (typeof illustrationNames)[number]           // all 15
type ContentIllustration = Exclude<IllustrationName, 'ProjectTypeGlyph'>
const illustrations: Record<ContentIllustration, ComponentType<IllustrationProps>>
function Illustration(props: IllustrationProps & { name: ContentIllustration })
function WorkshopGlyph(props: IllustrationProps & { method: WorkshopMethod })
```

Each drawing also takes optional data props (defaults: the brief's values; README in the folder).
"Where" follows the content (`SectionCopy.illustration` may name a drawing in any case-study
section, I15) and the pages.

| Component | Layout(s) (h / v) | Where |
| --- | --- | --- |
| `IntakeBeforeAfter` | 960×480 / 360×760 | Building the team (case 01), 04 Approach (`vertical`, sticky) |
| `TeamGrowthTimeline` | 960×360 / 360×480 | Building the team, 06 Artefacts |
| `DesignSystemLayers` | 640×560 / 360×540 | Allmend design system (case 02), 04 Approach (`vertical`, sticky) |
| `ContributionLoop` | 560×560 | Allmend design system, 06 Artefacts |
| `AdoptionBars` | 960×400 / 360×380 | Allmend design system, 07 Outcomes |
| `JourneyEmotionCurve` | 960×360 / 360×640 | Moving house, once (case 03), 02 Problem |
| `ServiceBlueprint` | 1200×560 / 360×780 | Moving house, once, 04 Approach (`vertical`, sticky) |
| `TeamConstellation` | 640×640 | Management, hero frame |
| `WeekRing` | 560×560 | Management, 03 Rituals (the content's weekly rituals) |
| `CareerMatrix` | 960×600 / 360×540 | Management, 05 Growth (`axes={false}`, HTML axis labels) |
| `WorkshopGlyph` (`method`) | 64×64 | Management, 06 Workshops: one per format card (I14) |
| `WorkshopGlyphs` | 960×160 / 360×320 | not placed (the per-card glyphs replace the strip) |
| `ContourPortrait` | 480×600 | About, hero |
| `AboutTimeline` | 960×240 / 360×560; 960×120 with `labels={false}` | About, 02 Timeline (`labels={false}`, seven HTML stops, I13) |
| `ProjectTypeGlyph` (`type`) | 48×48 | More projects, one per row |
| `DiscardedCard` | 132×184 | 404, `.lost-card` on the discard pile (drawn upright, I13) |

Markup contract (every illustration; conventions in `src/components/illustrations/README.md`):

- Root `<svg role="img" aria-labelledby="<title-id> <desc-id>" class="illustration …"
  data-illustration="<kebab-name>" fill="none" stroke="currentColor">` with `<title>` and `<desc>`
  first. Ids are unique per instance (`useId`); `titleId` sets the title id (the desc id is
  `<titleId>-desc`). Where a visible label already names it, the caller wraps it in
  `aria-hidden="true"`.
- **Plain drawings** (ContourPortrait, DiscardedCard, ProjectTypeGlyph, WorkshopGlyph) keep a root
  `viewBox`. **Labelled drawings** have no root `viewBox` (I11): the root keeps its proportions
  with CSS `aspect-ratio` (`--il-ratio-h` / `--il-ratio-v`), geometry sits in nested
  `<svg class="il-plate" viewBox>` plates and labels in CSS px, so 11 px labels stay 11 px. The
  root is a size container (`container-type: inline-size`, stroke width corrected per size):
  give it a definite width and size it by width only.
- **Layouts**: drawings with a vertical variant render `<g data-layout="h|v">` inside each group
  and `data-layouts` on the root; `variant="auto"` (default) shows the vertical layout below
  640 px viewport width, `horizontal` / `vertical` render only one (use them where the column
  width is known, I12).
- Colour: `currentColor` only (= `--accent`, which follows the identity, I1); strokes at 80%,
  guides at 34%; tints are 8% fills marked `data-draw-fill`; no raster images, gradients or
  filters. Labels are SVG `<text>` in `--font-mono` marked `data-draw-label` (no embedded font).
- **Every stroke element that draws on uses `pathLength="1"` and `data-draw`**, and strokes are
  grouped in drawing order in `<g data-draw-group="1">` … `<g data-draw-group="n">`. Motion
  draws `[data-draw]` with `stroke-dasharray: 1; stroke-dashoffset: 1 → 0`, group by group
  (`--stagger-svg-groups`), fading a group's labels and tints with it (I4); in reduced motion the
  drawing simply appears (160 ms fade). No `vector-effect: non-scaling-stroke` (it breaks
  `pathLength` dashes in Chromium).
- Static: illustrations never animate themselves (no SMIL, no CSS animation inside).

---

## Picture

`src/components/picture.tsx` (Content & Images), registry `content/images.ts`.

```tsx
<Picture id="team-of-teams-hero" sizes="100vw" priority? className? alt? />
```

- `id: ImageId` (`keyof typeof images`). Entry (`ImageEntry` in the schema): `{ kind, alt, width,
  height, local?: { widths, formats: ('avif'|'webp'|'jpeg')[] }, remote?: { src (with {w}), widths },
  placeholder?, photographer, photographerUrl, pageUrl }`. `kind: 'photo'` requires the three
  credit fields (the About colophon credits and links each photo); `kind: 'generated'` (the
  placeholders) makes them optional.
- Local: `<picture data-image="<id>">` with `<source type="image/avif">` and/or
  `<source type="image/webp">` when listed, and an `<img>` with the JPEG `srcset`. Files:
  `public/images/<id>-<width>.<avif|webp|jpg>`, URLs through `withBase()`.
- Remote (hotlinked): `<picture>` with one `<img srcset>` built by replacing `{w}`.
- `<img>` always has `width`/`height` (no layout shift), `alt` (empty = decorative),
  `sizes`, `decoding="async"`, the placeholder colour as background, and
  `loading="lazy"` — or with `priority`: `loading="eager"` + `fetchpriority="high"` (one per page:
  the case hero, I23, never inside an image reveal).
- Photos: 14 self-hosted Unsplash photos (`kind: 'photo'`, credited in the About colophon), AVIF,
  WebP and JPEG at 640 / 1280 / 2048 px in `public/images/`. `content/images.ts` is generated by
  `node scripts/images/fetch-and-build.mjs` from `scripts/images/manifest.mjs` (alt text, credits,
  an optional `crop: [w, h]` for portrait sources, I21; `--only a,b` rebuilds single ids); width,
  height and the placeholder are measured, the placeholder clamped dark (I22).
  `node scripts/images/check.mjs` checks the registry and the files.

---

## Content schema

`content/schema.ts` (Foundation). Server components read content through `src/lib/content.ts`,
which re-exports `content/index.ts` (`export const content = {…} satisfies Content`); client
components read only `src/lib/hand-data.ts` (D7). Values live in typed modules:
`content/site.ts`, `content/hand.ts` (slim), `content/cases/*.ts` and `content/pages/*.ts`
(server only), `content/images.ts` (generated). The exports keep their names and types and the
slim modules stay slim (type-only imports).

```ts
type Content = {
  site: Site; hand: HandContent; home: Home; caseStudies: CaseStudy[]; management: Management;
  moreProjects: MoreProjects; about: About; contact: Contact; notFound: NotFound;
  coffeeEgg: CoffeeEgg; workshopMethods: WorkshopMethods
}
```

Shared: `Template` (string with `{placeholders}`, filled by `fill()` from `src/lib/format.ts`),
`Paragraph` (plain text), `Fact { label, value }`, `Metric { value, unit?, label }`, `CardId`,
`ImageId`, `ContentIllustration`, `ProjectType`, `WorkshopMethod`, `Identity`, and
`SectionHead { label; title?; image?; caption? }`: every Management and About section carries a
short `label` (SectionIndex, Minimap), an optional h2 `title` (defaults to the label) and an
optional image with an optional `caption` (I16).

| Type | Fields |
| --- | --- |
| `Site` (`content/site.ts`) | `name, description, wordmark, skipLink, introSkip, header { homeLabel, back, about, moreProjects, contact }, footer { note }, settings { heading, calm, calmHint, calmOn, calmOff }, shortcuts { title, close, items[{ keys, label }] }, eggs { dealt, turned, rare, coffeeDealt, tableFlipped }` (templates) `, labels { facts, next, viewing, sections, contactTitle, contactText, contactLink, meta: Record<keyof CaseStudyMeta,string>, decision: Record<keyof Decision,string>, owned, notOwned, workshop { duration, who, outcome } }` |
| `HandContent` (`content/hand.ts`) | `order: [CardId ×4], identity: Record<CardId,Identity>, railLabel: Record<CardId,string>, cards: Record<CardId,HandCardCopy>, labels { nav, viewing, moreProjects, counter: Template }` |
| `HandCardCopy` | `title` (equals the page title; "Management" for the fourth card)`, type, year, inspect, tapLine, facts: Fact[]` (the card's own facts, each with its label; two in the final content) |
| `CoffeeEgg` (`content/hand.ts`) | `title, body, cta` |
| `Home` | `label` (e.g. "Bern, Switzerland — UX Team Lead")`, title, role, intro, hint, onTheTableNow { label, items: string[] }` (3 items) |
| `CaseStudy` | `slug, number` ("01"–"03")`, identity, label, title, summary, statement?, heroImage: ImageId, meta: CaseStudyMeta, metrics: Metric[]` (exactly 5)`, sections: CaseStudySections` |
| `CaseStudyMeta` | `client, timeframe, role, team, type` |
| `SectionCopy` | `label, title, body: Paragraph[], list?, note?, illustration?: ContentIllustration` (any section, I15)`, image?: ImageId, caption?` (shown under the image only when set, I16) |
| `CaseStudySections` | `context, problem: SectionCopy; role: SectionCopy & { owned: string[]; notOwned: string[] }; approach: SectionCopy & { steps: { title, body }[] }` (4 steps)`; decisions: SectionCopy & { items: Decisions }; artefacts: SectionCopy & { items: Artefact[] }; outcomes, differently: SectionCopy & { items?: string[] }; next: { label, title, card?: CardId }` — order `caseStudySectionKeys` = 01 context, 02 problem, 03 role, 04 approach, 05 decisions, 06 artefacts, 07 outcomes, 08 differently, 09 next |
| `Decision` / `Decisions` | `{ decision, chose, tradeOff, why }`, exactly four |
| `Artefact` | `title, caption?, image?, illustration?` |
| `Management` | `slug: 'management', identity, title` (hero, "How I lead")`, lead, heroImage?, principles: SectionHead & { items: { title, evidence }[] }` (5)`, team: SectionHead & { members: { initials, role, fte, focus }[]; note }, rituals: SectionHead & { items: { name, cadence, purpose }[] }, hiring: SectionHead & { steps: { title, duration, purpose }[]; note }, growth: SectionHead & { body, levels: string[], dimensions: string[] }, workshops: SectionHead & { formats: { name, duration, who, outcome, glyph: WorkshopMethod }[]; drawButton }, metrics: SectionHead & { items: Metric[] }` (5) — order `managementSectionKeys`. Team members appear as initials only. The card's title, type and facts live in `hand.cards.management`. |
| `MoreProjects` | `title, intro` (the count line, e.g. "13 projects · 2014–2025")`, columns { number, title, year, projectType, clientType }, projectTypeLabels: Record<ProjectType,string>, items: MoreProjectItem[], end` (the closing line) |
| `MoreProjectItem` | `number (1-based), title, year, clientType, projectType: ProjectType` (selects the glyph) |
| `About` | `title, lead, story: SectionHead & { body: Paragraph[] }, timeline: SectionHead & { items: { years, title }[] }` (7)`, howIWork: SectionHead & { items: { title, body }[] }` (4)`, tcg: SectionHead & { title, body, lessons: { title, body }[], stats }, roots: SectionHead & { title, body }, onTheTable: SectionHead & { title, items: { label, value }[] }` (5 face-down mini cards; they replace the three game cards)`, creditsTitle, topo { label, attribution, placeholderNote }` — order `aboutSectionKeys` |
| `Contact` | `label, title, body, email, links: { label, value, href? }[]` (e.g. LinkedIn, location)`, note` |
| `NotFound` | `title, body, back` |
| `WorkshopMethods` | `again, drawn: Template, methods[{ title, howTo }]` (the button label is `management.workshops.drawButton`) |
| `ImageEntry` | see [Picture](#picture) |

Build-time checks (`src/lib/content.ts`; the build fails with a pointer to this section): exactly
three case studies with unique slugs and `number` "01"–"03" in order; per case study five
metrics, four decisions, four approach steps, a hand card with the same title and identity;
Management five principles and five metrics; About seven timeline stops, four how-I-work items,
five "on the table" items; home three "on the table now" items; the hand exactly four cards.

Helpers: `src/lib/content.ts` (server) exports every value above, `caseStudies`,
`getCaseStudy(slug)`, `caseStudySectionKeys`, `managementSectionKeys`, `aboutSectionKeys`,
`images`, every type (`export type * from '@content/schema'`) and re-exports `pad2`,
`cardNumber`, `fill`. `src/lib/hand-data.ts` (client-safe) is listed under [Hand](#hand).

---

## Routes

All static, all under `BASE_PATH` (`/random/` on Pages), trailing slash. Every page is on the
Spread grid (D9).

| Route | File | Identity | Skeleton |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | ink | `FirstLoadSequence` around label, title, role, intro, "On the table now"; counter in the hand; clears the fan (I24) |
| `/work/[slug]` (`team-of-teams`, `shared-foundations`, `front-door`) | `src/app/work/[slug]/page.tsx`, `case-sections.tsx` | ember / tide / grove | `DetailPage`: hero (`[data-hero-target]` frame with the priority hero picture + `.hero-drift`, display h1, summary) + MetaPairs + Scoreboard; sections 01–09 via `Section` (01 context + Spread with caption; 02 problem opens with the statement (`data-breaker`); 03 owned / not owned; 04 four steps + sticky vertical drawing; NumeralBreaker + 05 DealRow (deal scene); 06 artefact gallery; 07 outcomes; 08 differently; 09 NextProject); ClosingContact; Minimap |
| `/management` | `src/app/management/page.tsx` | saffron | `DetailPage`: hero (TeamConstellation) + "How I lead" + lead + card facts; 01 principles (+ Spread), 02 team (structure pinned), 03 rituals (WeekRing), 04 hiring (drawn connector), 05 growth (CareerMatrix + HTML axes), 06 workshops (WorkshopRow with a WorkshopGlyph per format, workshop draw, + Spread), 07 metrics (Scoreboard); NextProject; ClosingContact; Minimap |
| `/more-projects` | `src/app/more-projects/page.tsx` | ink | count line, table: number, title, year, glyph + type, client type; closing line |
| `/about` | `src/app/about/page.tsx` | glacier | hero (title, lead, ContourPortrait); story (+ Spread), timeline (AboutTimeline + seven HTML stops), how I work, tcg (+ Spread), roots (+ Spread), "What's on the table" (five cards); colophon (photo credits, topography attribution) |
| `/contact` | `src/app/contact/page.tsx` | last played card | label, title, body, email, links, note |
| 404 | `src/app/not-found.tsx` | ink | discard zone, pile and `.lost-card` (DiscardedCard, falls in, I7), title, back link |

`/projects` moved to `/more-projects`. Header links: About, More projects, Contact (+ Back on card
pages). Every page has one `h1` (`PageTitle`, `id="page-heading"`, focus target after navigation).

---

## Data attributes

| Attribute | On | Meaning / set by |
| --- | --- | --- |
| `data-reveal="<kind>"` | any block | one of the eight reveal kinds, via `<Reveal>` (see [Reveal](#reveal)) |
| `data-revealed` | revealed blocks | set by the engine: `""` (animated) or `instant` (final at once) |
| `data-reveal-order`, `data-reveal-delay` | `<Reveal>` | sequence position; extra delay (ms) |
| `data-breaker` | full-bleed breakers (Spread, the problem statement section) | the field lifts 10% while in view (I5) |
| `data-first-load` | `<FirstLoadSequence>` | home hero wrapper |
| `data-chrome` | header, card counter | revealed last in the first-visit intro |
| `data-draw` | SVG stroke elements (with `pathLength="1"`) | drawn on by the `draw` reveal |
| `data-draw-group="1..n"` | `<g>` in illustrations | drawing order |
| `data-draw-fill`, `data-draw-label` | tint fills, `<text>` labels in illustrations | fade with their group (I4) |
| `data-layout="h\|v"`, `data-layouts` | illustration groups / root | horizontal and vertical layouts |
| `data-illustration="<name>"` | illustration `<svg>` | registry name |
| `data-scene="<name>"`, `data-scene-active` | scene roots (`deal`: the case-study DealRow only) | scroll / interaction scenes |
| `data-deal-card="1..n"`, `data-deal-position` | DealRow, WorkshopRow | cards; "1 / 4" label (mobile) |
| `data-section="<id>"` | page sections | Minimap targets, section anchors |
| `data-section-index`, `data-numeral`, `data-spread`, `data-margin-note`, `data-minimap`, `data-minimap-tick="<id>"` | layout components | hooks for styling and motion |
| `data-digits`, `data-digit` | Scoreboard | digit spans for the `digits` reveal |
| `data-image="<id>"` | `<picture>` | image id |
| `data-reading-hairline` (+ `--reading-progress`) | hairline | reading progress 0–1 |
| `data-identity="<identity>"` | page roots, cards | colour scope (`--id-*`) |
| `data-detail="<id>"`, `data-home`, `data-contact` | page roots / hand nav | page hooks |
| `data-play="<id>"`, `data-roving`, `data-slot`, `data-slot-anchor`, `data-play-link` | hand, Next project | play / roving / slot geometry |
| `data-tapped`, `data-inspect`, `data-rare`, `data-drawn`, `data-lifting`, `data-closing` | hand cards / slots / row | egg and play states |
| `data-rail="hidden"`, `data-sheet-moving` | `nav.hand` | mobile rail and sheet states |
| `data-card="<id>"`, `data-counter-index`, `data-counter-title`, `data-counter-text` | card counter | counter state and parts |
| `data-motion="full|calm|reduced"` | `<html>` | motion tier (pre-paint script) |
| `data-intro="first|repeat"`, `data-reveal="armed|live"`, `data-reveal-skip` | `<html>` | intro and reveal arming |
| `data-field="<identity>"`, `data-renderer="gl|css"` | `<html>` | background field |
| `data-hand="collapsed"` | `<html>` | every route except home (hand component + pre-paint script); switches `--hand-reserve` to 120 px from 1024 (D1) |
| `data-hero-target` | the detail hero's media frame (`.case-hero-frame`) | measured by `heroTarget()` at play time (D3); clips the `.hero-drift` picture (I6) |

---

## Eggs

`src/eggs/registry.ts` lists each egg's trigger and full / calm / reduced behaviour; all work
with the four-card hand:

| Egg | Trigger |
| --- | --- |
| New hand (Mulligan) | M on home, or a long press (800 ms) on the card counter; the four cards fly off to the dealer (bottom right, off screen) and are dealt again |
| Workshop draw | "Draw a workshop method" (`management.workshops.drawButton`) on /management; `<WorkshopDraw button again drawn methods>` gets its copy as props (D7) |
| Rare pull | 1 in 40 loads, or `?rare` |
| Tap 90° | T on a focused card, or a double tap while a card lifts (mobile) |
| Inspect | hold Space on a focused card, or a long press (mobile) |
| Shortcut sheet | `?` |
| Coffee | type "draw" on home: a fifth card (`coffeeEgg`: title, body, cta) dealt from off screen, opens /contact; announced with `site.eggs.coffeeDealt` |
| 404 discard | any unknown address: `.lost-card` falls onto the pile (I7) |
| What's on the table | About: five face-down mini cards (`about.onTheTable.items`), each flipping to its value; `<OnTheTable title items flipped>` gets its copy as props (D7) |

---

## Checks

- `npm run build` (static export to `dist/`, type check included). Must pass before every push.
- `npm run preview` then `node scripts/smoke.mjs http://localhost:4100/random/ [--motion=full|calm|reduced]`
  (behaviour at 1440×900 and 390×844; card and page titles read from the content modules, I27)
  and `node scripts/budget.mjs http://localhost:4100/random/` (initial JS, 170 KB gzip target).
  The budget is advisory for this playground (D7): report the number in your handoff; going over
  does not block a push.
- `node scripts/images/check.mjs` (image registry, renditions, content counts, slim modules).
