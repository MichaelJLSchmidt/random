# Portfolio

Portfolio prototype in the playground repository. Next.js 16 (App Router, TypeScript, React 19.3),
Motion + Motion+, plain CSS (custom properties and CSS Modules). Built as a static export and
deployed to GitHub Pages under `BASE_PATH`. Never indexed (robots meta and a disallow-all
robots.txt).

All visible text lives in `/content`. Names, links, email and case studies there are placeholders.

## Structure

```
content/                    All editable text (JSON / MDX). No components.
  site.json                 Site name, navigation, home, case-study, 404 and settings copy
  case-studies.json         Exactly three case studies (array order = deck order; checked at build)
  work/<slug>.mdx           Case-study bodies
  projects.json             Plain project list
  about.mdx, contact.json
src/
  app/                      Routes: / , /work/[slug], /projects, /about, /contact, 404, robots.txt
  components/               Header, footer, settings, live region, focus, page transition
    card/                   Card faces, hand/stack, deck, flip, morph boundary
  interactions/             Lazy-loaded pointer and device-orientation input
  lib/                      Content loading, base path
  motion/
    tokens.ts               The only source of durations, easings, springs, staggers, distances
    transitions.ts          View-transition type and class names
    preferences.ts          Pre-paint script: motion tier and foil preference
  styles/                   tokens.css, type.css, view-transitions.css, foil.css
  fonts/                    Geist / Geist Mono variable (wght axis), Latin subset, OFL
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
and CSS variables are animated. Pointer and sensor input write CSS variables only.

| Animation                               | Full                                         | Calm                         | Reduced         |
| --------------------------------------- | -------------------------------------------- | ---------------------------- | --------------- |
| Card morph between routes               | 420 ms shared-element morph                  | 294 ms morph                 | instant         |
| Page content on forward/back links      | 32 px slide + fade                           | fade only, shorter           | instant         |
| Header links                            | cross-fade                                   | shorter cross-fade           | instant         |
| Page heading after client navigation    | words rise and fade, staggered (splitText)   | single fade                  | none            |
| Home cards entering (if below the fold) | dealt from a deck into hand / stack (spring) | none (final layout)          | none            |
| Card hover / focus                      | 14–22 px lift, title weight                  | title weight only            | weight, instant |
| Nav hover / focus                       | weight 400 → 680 (width reserved)            | shorter                      | instant         |
| Case-study card flip                    | 3D turn (spring)                             | cross-fade                   | instant swap    |
| Foil                                    | follows pointer, 16 s ambient drift          | static                       | static          |
| Card tilt (pointer / opt-in device)     | up to 7°                                     | flat, device switch disabled | flat, disabled  |

Browser back/forward carries no transition type, so it swaps without animation. Without
JavaScript every page is complete; the flip's facts are rendered in `<noscript>`.

## Accessibility

Skip link, landmarks, one `h1` per page, `aria-current` navigation, card links named by their
visible text, decorative layers `aria-hidden`, focus moves to the page heading after navigation
and back to the originating card on return, polite live region for settings and flips. No text
sits on foil. Settings use native switch inputs (`<input type="checkbox" switch>`).
