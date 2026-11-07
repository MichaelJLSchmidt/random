# Portfolio

Personal portfolio site. Next.js 16 (App Router, TypeScript, React 19.3), Motion + Motion+,
plain CSS with custom properties and CSS Modules. Production runs on Netlify; this playground
repository also publishes a static preview to GitHub Pages.

## Structure

```
content/                    All editable text (JSON / MDX). No components.
  site.json                 Site name, navigation labels, home, footer, 404 and gate copy
  case-studies.json         Exactly three case studies (array order = deck order)
  work/<slug>.mdx           Case-study bodies
  projects.json             Plain project list
  about.mdx
  contact.json
src/
  app/                      Routes
    layout.tsx              HTML shell, fonts, pre-paint preference script, motion CSS variables
    page.tsx                /
    work/[slug]/page.tsx    /work/[slug] (static params from content)
    projects/page.tsx       /projects
    about/page.tsx          /about
    contact/page.tsx        /contact
    not-found.tsx           Custom 404
    gate/page.server.tsx    Password form          (server build only)
    gate/unlock/route.server.ts  POST: check, set httpOnly cookie (server build only)
    robots.ts
  proxy.server.ts           Gate check on every request (server build only)
  components/               UI components
  lib/                      Content loading, gate crypto, small helpers
  motion/
    tokens.ts               The only source of durations, easings, springs, staggers, distances
    preferences.ts          Pre-paint script for motion tier and foil preference
    use-tier.ts             Tier hooks for client components
  styles/tokens.css         Colour, type, space, layout and card tokens
  fonts/                    Self-hosted Geist / Geist Mono variable fonts (OFL, Latin subset)
scripts/                    Audits (axe, budgets, Lighthouse)
```

Files ending in `.server.ts(x)` are only treated as routes by the server build (see `next.config.ts`).

## Scripts

| Command                | What it does                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`          | Development server (gate active if `SITE_PASSWORD` is set in `.env.local`)   |
| `npm run build:server` | Production server build (Netlify)                                            |
| `npm start`            | Serve the server build locally                                               |
| `npm run build`        | Static preview export to `dist/` under `BASE_PATH` (GitHub Pages, no gate)   |

## Environment

| Variable        | Where                     | Purpose                                                        |
| --------------- | ------------------------- | -------------------------------------------------------------- |
| `MOTION_TOKEN`  | Shell / CI / Netlify      | Motion+ registry token, read by `.npmrc`. Never commit it.     |
| `SITE_PASSWORD` | Netlify (Functions scope) | Gate password. Gate fails closed while it is empty.            |
| `SITE_GATE`     | Netlify                   | `off` at launch: removes the gate and allows indexing.         |
| `BASE_PATH`     | GitHub Actions            | Sub-path for the static preview, e.g. `/random/`.              |

Motion+ is an optional dependency. Without a token `npm ci` skips it and `splitText` falls back
to `src/motion/split-text-fallback.ts` (word splitting only).
