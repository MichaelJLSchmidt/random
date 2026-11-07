# Portfolio

Personal portfolio site. Next.js 16 (App Router, TypeScript, React 19.3), Motion + Motion+,
plain CSS (custom properties and CSS Modules). Production target: Netlify (server build with a
pre-launch password gate). This playground repository also publishes a static preview to GitHub
Pages (no gate, never indexed).

All visible text lives in `/content`. Names, links, email and case studies there are placeholders.

## Structure

```
content/                    All editable text (JSON / MDX). No components.
  site.json                 Site name, navigation, home, case-study, 404, gate and settings copy
  case-studies.json         Exactly three case studies (array order = deck order; checked at build)
  work/<slug>.mdx           Case-study bodies
  projects.json             Plain project list
  about.mdx, contact.json
src/
  app/                      Routes: / , /work/[slug], /projects, /about, /contact, 404, robots.txt
    gate/page.server.tsx    Password form                       (server build only)
    gate/unlock/route.server.ts  POST: check, set httpOnly cookie (server build only)
  proxy.server.ts           Gate check on every request          (server build only)
  components/               Header, footer, settings, live region, focus, page transition
    card/                   Card faces, hand/stack, deck, flip, morph boundary
  interactions/             Lazy-loaded pointer and device-orientation input
  lib/                      Content loading, gate crypto, build flags
  motion/
    tokens.ts               The only source of durations, easings, springs, staggers, distances
    transitions.ts          View-transition type and class names
    preferences.ts          Pre-paint script: motion tier and foil preference
  styles/                   tokens.css, type.css, view-transitions.css, foil.css
  fonts/                    Geist / Geist Mono variable (wght axis), Latin subset, OFL
scripts/                    audit, smoke, budget, vitals, lighthouse, serve-static
```

Files ending in `.server.ts(x)` are routes only in the server build (`pageExtensions` in
`next.config.ts`), so the static export never contains the gate.

## Commands

| Command                | What it does                                                               |
| ---------------------- | -------------------------------------------------------------------------- |
| `npm run dev`          | Development server                                                         |
| `npm run build:server` | Production server build (Netlify; `netlify.toml` runs this)                |
| `npm start`            | Serve the server build locally                                             |
| `npm run build`        | Static preview export to `dist/` under `BASE_PATH` (GitHub Pages, no gate) |
| `npm run typecheck`    | TypeScript                                                                 |
| `npm run format`       | Prettier                                                                   |

Checks (need a running server and the Playwright/Chromium that this environment provides):

```
node scripts/audit.mjs    <url> [--password=…] [--motion=full|calm|reduced]   # axe, WCAG 2.2 AA
node scripts/smoke.mjs    <url> [--password=…] [--motion=full|calm|reduced]   # behaviour per tier
node scripts/budget.mjs   <url> [--password=…] [--list]                       # initial JS ≤ 170 KB gzip
node scripts/vitals.mjs   <url> [--password=…]                                # LCP element, interaction latency
node scripts/lighthouse.mjs <url> [--password=…] [paths…]                      # Lighthouse mobile
BASE_PATH=/random/ node scripts/serve-static.mjs 4100                         # serve dist/ like Pages
```

## Environment

| Variable        | Where                | Purpose                                                           |
| --------------- | -------------------- | ----------------------------------------------------------------- |
| `MOTION_TOKEN`  | Shell, CI, Netlify   | Motion+ registry token read by `.npmrc`. Never commit it.         |
| `SITE_PASSWORD` | Netlify (all scopes) | Gate password. While empty the gate fails closed.                 |
| `SITE_GATE`     | Netlify              | Set to `off` at launch (removes gate, allows indexing). Redeploy. |
| `BASE_PATH`     | GitHub Actions       | Sub-path of the static preview, e.g. `/random/`.                  |

Motion+ is an optional dependency. Without a token, `npm ci` skips it and `splitText` resolves to
`src/motion/split-text-fallback.ts` (word splitting); that build also skips type checking because
the Motion+ types are missing. Production builds must have the token.

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

## Gate

`proxy.server.ts` redirects every page request without a valid cookie to `/gate`. The cookie is
`v1.<expiry>.<HMAC-SHA256>` (key derived from `SITE_PASSWORD`, Web Crypto only), httpOnly,
SameSite=Lax, Secure off localhost, 30 days. The unlock route checks Origin, only redirects to
same-site paths and delays failed attempts. While gated: `X-Robots-Tag: noindex, nofollow`,
robots meta and a disallow-all robots.txt. Changing the password signs everyone out.
