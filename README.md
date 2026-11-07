# Portfolio

Portfolio prototype in the playground repository: a table seen from the player's seat. A calm dark
field breathes behind everything; a hand of four cards (three case studies and Management) is the
navigation. Playing a card lifts it onto the table, the background blooms from it into the card's
colour, and the card zooms into its page. Next.js 16 (App Router, TypeScript, React 19.3), Motion +
Motion+, WebGL2, plain CSS. Built as a static export and deployed to GitHub Pages under
`BASE_PATH`. Never indexed (robots meta and a disallow-all robots.txt).

All visible text lives in `/content`. Names, links, email and case studies there are placeholders.

## Structure

```
content/                    All editable text (JSON / MDX / one TS map). No components.
  cards.ts                  Hand order, case study -> colour identity, rail labels, Management card
  site.json                 Site name, navigation, home, case study, About, 404, settings, egg copy
  case-studies.json         Exactly three case studies (checked at build)
  work/<slug>.mdx           Case-study bodies; management.mdx, about.mdx
  projects.json             Older projects (no detail pages); workshops.json (workshop draw)
public/topo/                About contours: elevation.png, contours.svg, meta.json (placeholder for now)
scripts/
  topo/                     GDAL + Node pipeline for the About topography (README inside)
  smoke.mjs                 Behaviour check, 1440x900 and 390x844, per motion tier
  budget.mjs, audit.mjs, vitals.mjs, lighthouse.mjs, serve-static.mjs
src/
  app/                      Routes: / , /work/[slug], /management, /projects, /about, /contact, 404
  design/palette.ts         Colour identities (ink, ember, tide, grove, saffron, glacier)
  motion/
    tokens.ts               The only source of easings, springs, durations, staggers, distances
    table-store.ts          The table: active / hover / last played card, tier, field target
    play.ts                 Play / return / switch, stage 1 (lift); view-transition.ts watches stage 2
    reveal.ts               Reveal system, page orders, first-visit intro
    transitions.ts          Transition types and view-transition class maps
    preferences.ts          Pre-paint script: tier, intro flag, reveal arming, initial field colour
  components/
    background/             The field: engine, WebGL2 shader, OKLab, CSS fallback
    hand/                   The hand (fan, rail, sheet) and card faces
    case-hero.tsx           Full-bleed hero + mini card; reveals.tsx, route-focus.tsx, ...
  eggs/                     registry.ts (flags + tier behaviour) and one module per egg
  styles/                   tokens, type, field, hand, reveal, view-transitions, eggs
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
- **Hand**: `<nav aria-label="Work">`, four real links plus "More projects". Desktop: a fan at the
  bottom centre (72% visible on home, 45% elsewhere). Mobile: the fan on home, elsewhere a 48px
  peek rail that opens a bottom sheet (a native popover). One tab stop (arrows, Home/End).
- **Play / return / switch**: stage 1 lifts the card (WAAPI, play spring) while the field blooms;
  stage 2 is React's view transition (`card-<slug>` and `card-title-<slug>` shared between the hand
  card and the hero / H1). Return: Back, Escape, the wordmark, or leaving a card page.

| Effect                 | Full                                                           | Calm                          | Reduced             |
| ---------------------- | -------------------------------------------------------------- | ----------------------------- | ------------------- |
| Field breath and drift | 9 s breath, drift 0.012/s                                      | still                         | still, 200 ms swaps |
| Hover a card           | lift 28px on the hover spring; field blends (80 ms)            | no lift, field blends         | instant             |
| Play                   | press, lift, bloom 800 ms, zoom 580 ms                         | navigate at once, 500 ms fade | near-instant        |
| Return / switch        | 520 ms back to the slot / 560 ms in, OKLab crossfade           | same morph, 500 ms fade       | near-instant        |
| Home first visit       | field from black, hand drawn and flipped, title, lines, chrome | fades, same order             | fades, same order   |
| Headline               | deal and settle (wght 280 -> 680, opsz 24 -> 96)               | opacity + 4px, weight at once | opacity, 200 ms     |
| Sections               | per preset (lines, lists, metrics, callouts ...)               | opacity + 4px, 300 ms         | opacity, 200 ms     |

Browser back / forward swaps the page without a view transition (React does not animate popstate
navigations); the field still follows the route.

## About topography

`scripts/topo/README.md` has the exact steps for the real assets (swissALTI3D 2 m, LV95 box
E 2624000-2646000, N 1152000-1174000). Until then a noise-generated placeholder is committed,
labelled in `public/topo/meta.json`, in the SVG and on the page.

## Easter eggs

Registered in `src/eggs/registry.ts` (an `on` flag and the full / calm / reduced behaviour of
each). Press `?` on the site for the shortcut sheet.

| Egg                 | Trigger                                                              |
| ------------------- | -------------------------------------------------------------------- |
| New hand            | M on the start page, or a long press on the deck                     |
| Workshop draw       | "Draw a workshop method" on /management                              |
| Rare pull           | 1 in 40 loads (or `?rare`): one card gets a single holographic glint |
| Turn sideways       | T on a focused card, or a double tap while a card lifts (mobile)     |
| Look closer         | Hold Space on a focused card, or a long press (mobile)               |
| Coffee?             | Type "draw" on the start page                                        |
| Shortcut sheet      | `?`                                                                  |
| What's on the table | About: three face-down cards                                         |
| 404                 | Any unknown address: a card falls into the discard zone              |

## Accessibility

Skip link, landmarks, one `h1` per page, card links named by their visible text, decorative layers
`aria-hidden`. After every navigation focus moves to the page heading (or back to the card that
was open), and the title is announced in a polite live region; eggs announce themselves there too.
Weight-animated text keeps one plain copy for screen readers and reserves every word box at its
final weight. Without JavaScript every page is complete and shows its final state.
