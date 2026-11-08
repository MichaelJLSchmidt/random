# Layout & Pages session

## Branch

`claude/layout-pages-composition-f58ey0` (pushed only to this branch; never `main`).

## Plan

Written before editing, after reading `docs/contracts.md`, `docs/art-direction.md`, the
foundation handoff and every stub.

**Ground rules I hold myself to.** Only the paths Layout owns. Every page on `.spread-grid`
sections with `.col-*` placement (D9); no legacy `.page`. Page markup uses `<Reveal kind>` only
(D4). Type only through the `.t-*` classes / `--type-*` tokens; vertical rhythm on the 4 px
baseline; section spacing chosen per section from `--space-s/m/l`. Copy only from `content/`
through `src/lib/content.ts` (server) or `src/lib/hand-data.ts` (client). Client components never
import `src/lib/content.ts` (D7): server pages pass `<Picture>` / illustrations / copy down as
props.

**Components (`src/components/layout/`)**

1. `SectionIndex`: mono label; sticky in columns 1–3 from 1024 (spanning the section's head and
   body rows so it stays pinned while the section reads), inline above the h2 below.
2. `NumeralBreaker`: outlined numeral starting at the content column, bottom margin −⅓ of its
   line box so the h2 overlaps it.
3. `Spread`: full bleed, caption below the image; in column 12 + outer track from 1680 (D2).
4. `MetaPairs`: 5-up ruled row from 1024, 2 columns below.
5. `Scoreboard`: 5-up / 2-up, Martian Mono tabular digits, label under the value, already
   wrapped in `<Reveal kind="digits">`.
6. `DealRow`: static row of four from 1024 (stage spans all twelve columns, `useDealScene`
   still called); below 1024 a full-bleed scroll-snap row with the "1 / 4" counter driven by an
   IntersectionObserver on `[data-deal-card]` (D5). A generic sibling (`DealStage`) renders
   other four-card rows (Management workshops) through the same scene hook.
7. `MarginNote`: inline aside with a left rule; column 12 + outer track from 1680 (D2), wrapped
   in `<Reveal kind="note">`.
8. `Minimap`: fixed at the right edge from 1024, hidden below; one focusable tick per
   `[data-section]`, label shown on hover / focus; a small client observer sets
   `aria-current="location"` on the tick of the section in view.
9. `Section`: rebuilt so the h2 and the body are separate grid items (the index spans both
   rows; a margin note can sit on the body row from 1680).

**Pages**

- Home: label, two-line display name in columns 1–9 at ~22vh, role + intro in columns 4–10,
  "On the table now" row with a drawn rule, all inside `<FirstLoadSequence>`; hand and counter
  untouched.
- Case study (`/work/[slug]`): new hero (72vh / 64vh: label, counter, h1, summary, hero
  `<Picture priority>` in the `[data-hero-target]` frame that carries the card's
  view-transition name); MetaPairs → Scoreboard; 01 Context (+ MarginNote + Spread); 02 Problem
  (statement at h2 size); 03 Role (owned / not owned); 04 Approach (steps left, sticky
  illustration right); NumeralBreaker + 05 Decisions (DealRow); 06 Artefacts (7+5 / 4+8
  gallery); 07 Outcomes; 08 Differently (lead size, accent rule); 09 Next (card play link);
  Minimap. Per-case illustrations as the brief lists them, each in `<Reveal kind="draw">`
  (content's `section.illustration` wins when set).
- Management: hero "How I lead" + TeamConstellation; principles as numeral | h3 | evidence rows;
  team structure pinned (CSS sticky) beside the member rows; rituals with WeekRing; hiring path
  with a drawn connector; growth with CareerMatrix; workshops as a deal row with WorkshopGlyphs
  and the workshop-draw egg; metrics Scoreboard; next card; Minimap.
- More projects: typographic index (mono number, h3, year, client type, drawn divider), rows
  focusable, hover / focus shifts 8 px and draws the ProjectTypeGlyph; two lines on mobile.
- About: hero + ContourPortrait; story (+ Spread when content has an image); AboutTimeline
  horizontal ≥ 1024 / vertical below with seven HTML stops; how I work 2×2; "At the table";
  roots; "What's on the table" egg; colophon from the image manifest; swisstopo attribution
  visible.
- Contact: full-viewport end point, large email with a drawn underline, mono pairs, no form.
- 404: DiscardedCard tilted in the discard zone, title, back link.
- Footer moved onto the grid.

**Verify**: `npm run build`; Playwright (Chromium) at 390×844 and 1440×900 (+1680 for margin
notes, +1024 for the index column) on every page; check margins, spans, sticky index, margin
notes, no horizontal scroll, content clear of the hand reserve. Then a subagent review of the
diff against the brief; fix; update this file.
