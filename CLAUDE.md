# Project notes

- Commands: `npm run dev` · `npm run build` (runs `npm run gen` first: brush pipeline, grain textures, font fallbacks) · `npm run verify` (Playwright checks on `dist/`, writes `verify-output/`) · `npm run check`.
- Structure: `brush/` stroke data (centrelines, presets, optional scans) → `scripts/brush/` pipeline → `src/generated/` (git-ignored, never edit). `src/design/tokens.ts` is the single token source. `src/config/site.ts` holds all placeholder content. `src/content/work/` holds case studies (MDX). `src/scripts/` holds the motion runtime (`motion/`, `features/`, `islands/`).
- Base path: the site is served under `/<repo>/`. Every internal link, asset, font and texture URL goes through `url()` in `src/lib/url.ts` (or a Vite import). Never hard-code a leading `/`.
- Motion tiers: `data-motion="full|calm|still"` on `<html>`, set before paint by the inline head script and persisted in localStorage. Every animated feature must handle all three tiers (Still = final state, no animation; Calm = 200 ms fades, no scrub/WebGL/Lenis/filters). Initialise on `astro:page-load`; everything is reverted via `gsap.matchMedia()` before each swap.
- Brush rules are enforced at build time (stroke counts, widths, negative space). If `npm run gen` fails, fix the data, not the rule.
- Keep one scrubbed animation per page, at most one active SVG filter, and no rAF loops while idle.
