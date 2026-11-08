# Portfolio

Portfolio prototype in the playground repository: a table seen from the player's seat. A calm dark
field breathes behind everything; a hand of four cards (three case studies and Management) is the
navigation. Playing a card lifts it onto the table, the background blooms from it into the card's
colour, and the card zooms into its page. Next.js 16 (App Router, TypeScript, React 19.3), Motion +
Motion+, WebGL2, plain CSS. Built as a static export and deployed to GitHub Pages under
`BASE_PATH`. Never indexed (robots meta and a disallow-all robots.txt).

All visible text lives in `/content`. Names, links, email and case studies there are placeholders.

The site is being redesigned by several sessions in parallel. The shared contracts (tokens,
components, props, data attributes, content schema, ownership) are in `docs/contracts.md`; the
brief is `docs/art-direction.md`; each session reports in `docs/handoff/`.

## Structure

```
content/                    All editable text. No components.
  schema.ts                 Types for every page and egg (the content contract)
  index.ts                  The typed entry point for pages (read through src/lib/content.ts)
  hand.ts, site.ts          Slim modules the client loads (cards, Coffee card, chrome labels)
  adapters.ts               The files below shaped into the schema until the content pass
  images.ts                 Image registry for <Picture> (files in public/images)
  cards.ts                  Hand order (exactly four), colour identities, rail labels, Management card
  site.json, case-studies.json, projects.json, workshops.json, *.mdx   Existing copy
public/topo/                About contours from swissALTI3D: elevation.png, contours.svg, meta.json
scripts/
  topo/                     swissALTI3D fetch + build for the About topography (README inside)
  smoke.mjs                 Behaviour check, 1440x900 and 390x844, per motion tier
  budget.mjs, audit.mjs, vitals.mjs, lighthouse.mjs, serve-static.mjs
src/
  app/                      Routes: / , /work/[slug], /management, /more-projects, /about, /contact, 404
  design/                   palette.ts (colour identities), layout.ts and type.ts (typed token mirrors)
  motion/
    tokens.ts               The only source of easings, springs, durations, staggers, distances
    scenes/                 Scroll scenes (deal-scene.ts: DealRow)
    table-store.ts          The table: active / hover / last played card, tier, field target
    play.ts                 Play / return / switch, stage 1 (lift); view-transition.ts watches stage 2
    reveal.ts               Reveal system, page orders, first-visit intro
    transitions.ts          Transition types and view-transition class maps
    preferences.ts          Pre-paint script: tier, intro flag, reveal arming, initial field colour
  components/
    background/             The field: engine, WebGL2 shader, OKLab, CSS fallback
    hand/                   The hand (fan, rail, sheet), the card counter and card faces
    layout/                 SectionIndex, NumeralBreaker, Spread, MetaPairs, Scoreboard, DealRow, ...
    illustrations/          15 SVG illustrations behind one registry
    picture.tsx             <Picture id sizes priority> from content/images.ts
    case-hero.tsx           Played card as hero + mini card; reveals.tsx, reading-hairline.tsx, ...
  eggs/                     registry.ts (flags + tier behaviour) and one module per egg
  styles/                   tokens, layout (Spread grid), type (scale), field, hand, reveal,
                            view-transitions, eggs, pages/
  fonts/                    Bricolage Grotesque (opsz + wght), Hanken Grotesk, Martian Mono; OFL
```

## Commands

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `npm run dev`       | Development server                                                |
| `npm run build`     | Static export to `dist/` under `BASE_PATH` (type check included)  |
| `npm run preview`   | Serve `dist/` like GitHub Pages (`BASE_PATH=/random/`, port 4100) |
| `npm run typecheck` | TypeScript                                                        |
| `npm run format`    | Prettier                                                          |

With `npm run preview` running: `node scripts/smoke.mjs <url> [--motion=full|calm|reduced]`
(behaviour) and `node scripts/budget.mjs <url>` (initial JS at most 170 KB gzip).

## Environment

| Variable       | Where                      | Purpose                                                   |
| -------------- | -------------------------- | --------------------------------------------------------- |
| `MOTION_TOKEN` | Shell, repository secret   | Motion+ registry token read by `.npmrc`. Never commit it. |
| `BASE_PATH`    | GitHub Actions (automatic) | Sub-path of the export, e.g. `/random/`.                  |

Motion+ is an optional dependency: without a token `motion-plus` resolves to
`src/motion/plus-fallback.ts` and the type check uses `tsconfig.fallback.json`.

## The table

- **Background field**: one WebGL2 canvas (hand-written shader, half resolution, DPR capped at 1,
  30 fps, idle when nothing moves). Three soft colour pools in low-frequency noise, 2% static grain,
  a 9 s breath. It never reads the pointer. Colours are mixed in OKLab. Without WebGL2, or after
  slow frames (average over 24 ms in two 60-frame windows), registered `@property` colours on
  stacked gradients take over with the same transitions. It pauses when the tab is hidden, while
  the mobile sheet is open, and on Save-Data (no breathing).
- **Hand**: `<nav aria-label="Work">`, exactly four card links. Cards show index, years, title
  band, a one-line summary and the facts. Desktop: a fan at the bottom centre (176x246 cards, 72%
  visible on home, 45% elsewhere); hover or focus lifts a card until 90% shows. On home a card
  counter ("01 / 04" and the hovered or focused card's title, announced politely) sits beside the
  fan. Mobile: the fan on home, elsewhere a 48px peek rail that opens a bottom sheet (a native
  popover) with the cards and plain links to More projects, About and Contact. One tab stop
  (arrows, Home/End).
- **Detail pages**: the played card lies on the table at the left (sticky, a large copy of the same
  face with the H1 in its band and the facts), the page reads on its right.
- **Play / return / switch**: stage 1 lifts the card to where it will lie while the field blooms;
  stage 2 is React's view transition (`card-<slug>` and `card-title-<slug>` shared between the hand
  card and the hero / H1), a same-shape zoom. Return: Back, Escape, the wordmark, browser back, or
  leaving a card page. Browser back / forward are replayed as typed navigations, so they morph
  too.

| Effect                 | Full                                                           | Calm                          | Reduced             |
| ---------------------- | -------------------------------------------------------------- | ----------------------------- | ------------------- |
| Field breath and drift | 9 s breath, drift 0.012/s                                      | still                         | still, 200 ms swaps |
| Hover a card           | lift to 90% shown on the hover spring; field blends (80 ms)    | shorter lift, field blends    | instant             |
| Play                   | press, lift, bloom 800 ms, zoom 580 ms                         | navigate at once, 500 ms fade | near-instant        |
| Return / switch        | 520 ms back to the slot / 560 ms in, OKLab crossfade           | same morph, 500 ms fade       | near-instant        |
| Home first visit       | field from black, hand drawn and flipped, title, lines, chrome | fades, same order             | fades, same order   |
| Headline               | deal and settle (wght 280 -> 680, opsz 24 -> 96)               | opacity + 4px, weight at once | opacity, 200 ms     |
| Sections               | per preset (lines, lists, metrics, callouts ...)               | opacity + 4px, 300 ms         | opacity, 200 ms     |

## About topography

Real contours of Interlaken between Lake Thun and Lake Brienz, with the Jungfrau region, built
from swisstopo's swissALTI3D open data: `npm run topo` reads each 2 m tile's overview from the
STAC API and writes `public/topo/` (details in `scripts/topo/README.md`).

## Easter eggs

Registered in `src/eggs/registry.ts` (an `on` flag and the full / calm / reduced behaviour of
each). Press `?` on the site for the shortcut sheet.

| Egg                 | Trigger                                                              |
| ------------------- | -------------------------------------------------------------------- |
| New hand            | M on the start page, or a long press on the card counter             |
| Workshop draw       | "Draw a workshop method" on /management                              |
| Rare pull           | 1 in 40 loads (or `?rare`): one card gets a single holographic glint |
| Turn sideways       | T on a focused card, or a double tap while a card lifts (mobile)     |
| Look closer         | Hold Space on a focused card, or a long press (mobile)               |
| Coffee?             | Type "draw" on the start page: a fifth card is dealt                 |
| Shortcut sheet      | `?`                                                                  |
| What's on the table | About: five face-down mini cards                                     |
| 404                 | Any unknown address: a card falls into the discard zone              |

## Accessibility

Skip link, landmarks, one `h1` per page, card links named by their visible text, decorative layers
`aria-hidden`. After every navigation focus moves to the page heading (or back to the card that
was open), and the title is announced in a polite live region; eggs announce themselves there too.
Weight-animated text keeps one plain copy for screen readers and reserves every word box at its
final weight. Without JavaScript every page is complete and shows its final state.
