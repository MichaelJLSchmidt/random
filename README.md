# Portfolio

Portfolio prototype in the playground repository. Next.js 16 (App Router, TypeScript, React 19.3),
Motion + Motion+, plain CSS (custom properties and CSS Modules). Built as a static export and
deployed to GitHub Pages under `BASE_PATH`. Never indexed (robots meta and a disallow-all
robots.txt).

All visible text lives in `/content`. Names, links, email and case studies there are placeholders.

## Structure

```
content/                    All editable text (JSON / MDX). No components.
  site.json                 Site name, navigation, home, case-study, about, 404, settings and egg copy
  case-studies.json         Exactly three case studies (theme/tint, statement, tap line; checked at build)
  work/<slug>.mdx           Case-study bodies
  projects.json             Plain project list
  workshops.json            Facilitation methods for the workshop-card easter egg
  about.mdx, contact.json
src/
  app/                      Routes: / , /work/[slug], /projects, /about, /contact, 404, robots.txt
  components/               Header, footer, settings, page/scroll motion, draw handler, eggs wiring
    card/                   Card faces, hand (fan, stack, touch fan), draw pile, flip, morph boundary
  eggs/                     Easter eggs: registry.ts (flags + tier behaviour), keys, one module each
  interactions/             Lazy-loaded pointer (hover, touch-hold, title Glint) and device orientation
  lib/                      Content loading, base path
  motion/
    tokens.ts               The only source of durations, easings, springs, staggers, distances, weights
    glint.ts                The shared Glint (one band, one sweep, at most one on screen)
    deal.ts                 Dealing from the deck (intro, Mulligan), rare pull
    scroll.ts               Section reveals, rising section titles, scroll-linked statement
    transitions.ts          View-transition type and class names
    preferences.ts          Pre-paint script: motion tier, foil preference, first-visit intro flag
    plus-fallback.ts        Motion+ stand-in for installs without MOTION_TOKEN
  styles/                   tokens, type, view-transitions, foil, tints, title-fill, glint, scroll, eggs
  fonts/                    Mona Sans (wght axis only) and Geist Mono, Latin subsets, OFL
scripts/                    audit, smoke, budget, vitals, lighthouse, serve-static
```

## Commands

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `npm run dev`       | Development server                                                |
| `npm run build`     | Static export to `dist/` under `BASE_PATH` (type check included)  |
| `npm run preview`   | Serve `dist/` like GitHub Pages (`BASE_PATH=/random/`, port 4100) |
| `npm run typecheck` | TypeScript                                                        |
| `npm run format`    | Prettier                                                          |

Checks (need `npm run preview` running and the Playwright/Chromium this environment provides):

```
node scripts/smoke.mjs      <url> [--motion=full|calm|reduced]   # behaviour per tier
node scripts/audit.mjs      <url> [--motion=full|calm|reduced]   # axe, WCAG 2.2 AA
node scripts/budget.mjs     <url> [--list]                       # initial JS ≤ 170 KB gzip
node scripts/vitals.mjs     <url>                                # LCP element, interaction latency
node scripts/lighthouse.mjs <url> [paths…]                       # Lighthouse mobile
```

## Environment

| Variable       | Where                      | Purpose                                                   |
| -------------- | -------------------------- | --------------------------------------------------------- |
| `MOTION_TOKEN` | Shell, repository secret   | Motion+ registry token read by `.npmrc`. Never commit it. |
| `BASE_PATH`    | GitHub Actions (automatic) | Sub-path of the export, e.g. `/random/`.                  |

Motion+ is installed from its registry with the `MOTION_TOKEN` repository secret. Installs without
a token skip it (it is an optional dependency): `motion-plus` then resolves to
`src/motion/plus-fallback.ts`, and the build type-checks against `tsconfig.fallback.json`, which
maps the module to the same file. The type check runs in every build.

## Motion

Tiers: **full** (default), **calm** (footer switch, saved in localStorage, applied before first
paint), **reduced** (`prefers-reduced-motion`, overrides calm). Only transform, opacity, clip-path
and CSS variables are animated (weight through the registered `--wght`). Pointer and sensor input
write CSS variables or motion values, never React state. Every timing comes from
`src/motion/tokens.ts`.

| Animation                                       | Full                                                                 | Calm                         | Reduced              |
| ----------------------------------------------- | -------------------------------------------------------------------- | ---------------------------- | -------------------- |
| Page h1 on load / navigation                    | 200 → 760: first visit 700 ms + 45 ms word stagger, otherwise 500 ms | 350 ms weight-in             | 760 from first paint |
| First-visit intro (home)                        | riffle cut, deal 80 ms apart with flips, Glint on top card (1.54 s)  | none (weight-in only)        | none                 |
| Sections below the fold                         | rise 24 / 40 px + fade, 420 ms ease-out, once at 35% in view         | final state                  | final state          |
| Section titles                                  | lines rise from a mask while weight goes 400 → 680                   | final state                  | final state          |
| Case-study statement                            | words fill 200 → 760 in reading order, scroll-linked                 | filled                       | filled               |
| Glint (intro, draw, hero, email, titles)        | one 18° foil band, 700 ms, never loops, one on screen                | none                         | none                 |
| Bold title hover (fine pointers)                | primary fill sweeps in 420 ms, Glint 80 ms behind, reverses at 0.7x  | 294 ms fill, no Glint        | instant fill         |
| Link hover / focus                              | underline draws in from the left (160 ms), leaves to the right       | 112 ms                       | instant              |
| Card foil                                       | hidden at rest; 240 ms fade on hover / touch-hold; tracks pointer    | fades, does not track        | appears, static      |
| Touch fan (coarse pointers)                     | swipe, spring snap with velocity, ±6° peeks, "1/3"                   | short tween snap             | jumps                |
| Drawing a card                                  | lift -24 px, scale 1.04 + Glint, then the route morph                | navigates at once            | navigates at once    |
| Card morph between routes                       | 420 ms shared-element morph (card-<slug> types)                      | 294 ms                       | instant              |
| Nav label → page title (About/Projects/Contact) | label morphs into the h1 (title-<page> types), content fades         | shorter                      | instant              |
| Page content on forward / back links            | 32 px slide + fade                                                   | fade only                    | instant              |
| Project rows after navigation                   | dealt in, 40 ms stagger                                              | none                         | none                 |
| Case-study card flip                            | 3D turn (spring)                                                     | cross-fade                   | instant swap         |
| Card tilt (pointer / opt-in device)             | up to 7°                                                             | flat, device switch disabled | flat, disabled       |

Browser back/forward carries no transition type, so it swaps without animation. Without
JavaScript every page is complete and every text is at its final weight.

## Easter eggs

Registered in `src/eggs/registry.ts` (an `on` flag and the full / calm / reduced behaviour of
each); code loads the first time an egg fires. Press `?` on the site for the shortcut sheet.

| Egg                 | Trigger                                               |
| ------------------- | ----------------------------------------------------- |
| Mulligan            | Long-press the deck (800 ms) or press M (home)        |
| Workshop card       | Swipe up on / tap the deck, or press D (home)         |
| Rare pull           | 1 in 16 per dealt card (intro, Mulligan)              |
| Tap                 | Double-tap a card (during the draw lift) or press T   |
| What's on the table | About: hover or tap the card edge behind the portrait |
| Shortcut sheet      | `?`; typing "shuffle" riffles every card              |
| 404                 | Any unknown address                                   |
| Haptics             | ≤ 20 ms vibrations in gesture handlers                |

## Accessibility

Skip link, landmarks, one `h1` per page, `aria-current` navigation, card links named by their
visible text, decorative layers `aria-hidden`, focus moves to the page heading after navigation
and back to the originating card on return, polite live region for settings, flips, copies and
eggs. Weight-animated text keeps one plain copy for screen readers and reserves every word box at
its final weight. No text sits on animated foil. Settings use native switch inputs
(`<input type="checkbox" switch>`).
