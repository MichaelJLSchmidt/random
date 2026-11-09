# Logo lab (temporary)

A hidden page for comparing seven monogram concepts (M and F fused into one glyph):
`/logo-lab/` under the base path, e.g. `/random/logo-lab/`, and `?c=3` for a concept's detail
view. It is not linked from the header, the hand, the footer or any page, and none of the marks
is used anywhere else on the site.

**Delete the lab in one step:** remove `src/app/logo-lab/` and `src/lab/logo/`. Nothing else
references them. No shared file was changed for the lab.

## How it is built

- `concepts/*.ts`: one file per concept, the single source of truth: geometry (an SVG node tree
  per variant: `master`, `favicon`, extras) and motion (tracks per moment). `concepts/index.ts`
  lists them.
- `model.ts` (types), `geometry.ts` (grid constants, stroke outlines, valley solver),
  `motion-kit.ts` (track builders), `path-morph.ts` (path interpolation).
- `tree.ts` wraps a variant in its root `<svg>` (container, optical nudge); `ui/mark.tsx` renders
  it inline (currentColor, `var(--accent, currentColor)`), `svg-string.ts` writes it as a file
  with colours baked in. Same tree, so inline marks and downloads cannot drift apart.
- `engine.ts` plays the motion: Web Animations for CSS tracks, Motion for path morphs; every run
  cancels itself at the end and restores what it touched, so the mark ends on its static state.
  Tiers: full as designed, calm = the moment's own calm sequence × 0.6, reduced = static (colour
  changes only).
- `colours.ts`: identity, ground, colour mode and container → stage CSS and file colours.
- `glyphs.ts` is generated: the M and F of Bricolage Grotesque at wght 800 and 200 (opsz 96) and
  the H stem at the axis corners (for the lockup's weight match).
- `ui/`: the page (overview, line-up, tiles, detail views, scorecard, downloads) and `lab.css`.
  Scores, notes and the lockup wordmark live in `localStorage` (`logo-lab:*`) only.

## Grid and conventions

viewBox `0 0 48 48`; the cap line is the top edge (y 9), the baseline y 39 (cap height 30);
stroke 6 (2 px at 16 px); butt caps and miter joins; acute miters trimmed by a cap-line band.
Favicon variants use stroke 9 on the 3-unit grid (whole pixels at 16 px) and no accent.
Every independently animated element carries `data-part`; drawn strokes have `pathLength="1"`.

## Dev tools (not part of the build)

```bash
# Re-extract the font outlines (Python 3.10+, fontTools + brotli in a venv)
.venv/bin/python -I src/lab/logo/tools/extract_glyphs.py

# PNG contact sheets of every concept and variant at 16–256 px, dark and light
node --import ./src/lab/logo/tools/ts-register.mjs src/lab/logo/tools/render-check.mjs <out-dir>

# Every moment ends on the static mark, in every tier (needs the built site served)
node src/lab/logo/tools/motion-check.mjs http://localhost:4100/random/logo-lab/
```

The Node tools load the Playwright that ships with the machine's Chromium
(`PLAYWRIGHT_MODULE` overrides its path); the lab adds no dependency to `package.json`.
