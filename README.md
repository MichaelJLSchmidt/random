# INKWAKE

A working showcase of the **INKWAKE** art direction: a calm, editorial portfolio for a UX designer and team lead. Every section is drawn into being by one confident brush stroke, which leaves a quiet wake of ink behind it. The metaphor is sketch → structure → system.

All personal content is placeholder text in [`src/config/site.ts`](src/config/site.ts) and [`src/content/work/`](src/content/work/).

- **Live:** the repository's GitHub Pages URL, `https://<owner>.github.io/<repo>/` (`site` and `base` are derived from the repository in [`scripts/repo.mjs`](scripts/repo.mjs)).
- **Spec page:** `/system/` shows the palette with measured contrast, type and axis specimens, motion tokens and side-by-side technique specimens.

```bash
npm install
npm run dev       # generates brush art + textures, then astro dev
npm run build     # same generation, then a static build in dist/
npm run verify    # Playwright checks on dist/ (screens + report in verify-output/)
```

Stack: Astro (static, TypeScript, ClientRouter) · GSAP 3 (ScrollTrigger, DrawSVG, SplitText, MorphSVG, CustomEase) · perfect-freehand (build time) · SVGO · OGL (lazy shader island) · Lenis (optional) · Fontsource (Fraunces, Instrument Sans, JetBrains Mono). Deployed to GitHub Pages with GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

---

## The brush pipeline

No scanned art exists yet, so every brush stroke is generated in code. The pipeline keeps the *drawing* (data) apart from the *ink* (outlines). Real scans can then replace the generated ink without code changes.

```
brush/illustrations/*.mjs     centrelines: ordered points in drawing direction, per stroke
brush/presets.mjs             three brushes: primary · dry · detail
brush/scans/<id>.svg          optional: scanned outlines + hand-drawn centrelines
        │
        ▼  scripts/brush/build.mjs   (runs on every `npm run dev` / `npm run build`)
        │   1. spline the centreline, give it one breath of pressure
        │      (blunt, slightly pooled entry → thinning → dry exit)
        │   2. perfect-freehand → filled, variable-width outline (the visual layer)
        │   3. the generated paper grain modulates the edge and breaks the tail
        │      into dry-brush bristles
        │   4. per-stroke mask = the centreline, stroke width ≈ 1.15 × the widest
        │      point of the outline, pathLength="1"
        │   5. timeline: order, duration (stroke-s/m/l by length), delay (≤ 15 %
        │      overlap), ease
        │   6. SVGO (stable ids, viewBox kept, 2–3 decimals)
        │   7. rule checks: strokes per illustration, ≤ 3 brushes, ≤ 1 accent,
        │      stroke widths at a 1440 px viewport, ≥ 60 % negative space
        ▼
src/generated/brush/<Name>.astro        one component per illustration
src/generated/brush/<id>.timeline.json  { id, order, duration, delay, ease, layer }
src/generated/brush/manifest.json       stats for /system and the rule report
src/generated/brush/masks/*.svg         CSS mask images (link underline, brush wipe)
src/generated/textures/grain-*.png      paper grain, light (multiply) and dark (screen)
```

Each stroke renders as:

```svg
<mask id="hero-s3-m">
  <path class="bm" d="…centreline…" pathLength="1" stroke="#fff" stroke-width="13.9" …/>
</mask>
<g class="bs" data-o="2" data-tone="ink" mask="url(#hero-s3-m)">   <!-- stroke -->
  <g class="bv"><path d="…brush outline…"/></g>                     <!-- visual layer -->
</g>
```

At runtime ([`src/scripts/motion/brush.ts`](src/scripts/motion/brush.ts)) GSAP DrawSVG animates each mask from 0 to 100 % in drawing order with the `brush` ease. Every stroke has its own mask, so crossing strokes never reveal each other early, and stroke width is never animated. Small elements (the seal, totems, specimens) get a one-shot `feTurbulence` + `feDisplacementMap` settle (scale 3 → 0 in 400 ms), and the filter is then removed.

### Authoring a generated illustration

```js
// brush/illustrations/example.mjs
import { curve, arc, line, join, hand } from '../lib/shapes.mjs';
export default {
  id: 'example',              // → src/generated/brush/Example.astro
  kind: 'spot',               // hero (≤ 30 strokes) · portrait (≤ 20) · spot (≤ 7) · icon · ui
  label: 'What it depicts',   // role="img" label; or `decorative: true`
  viewBox: [0, 0, 240, 240],
  display1440: [240, 420],    // rendered widths at a 1440 px viewport (for width rules)
  budget: 1800,               // fit the whole drawing into this many ms
  strokes: [
    { brush: 'primary', size: 6, points: arc(120, 120, 70, 70, -50, 255) },
    { brush: 'dry', size: 15, tone: 'wash', layer: 'paint', points: curve([60, 200], [110, 210], [170, 200], [214, 176]) },
  ],
};
```

Rules worth knowing: wash shadows fall below-right (light comes from the top left); keep shapes open rather than outlined; use one accent (indigo or moss) per illustration at most.

## Replacing generated strokes with scanned art

When real brushwork exists, scan it and drop one SVG per illustration into `brush/scans/`, named after the illustration id (for example `brush/scans/hero.svg`). On the next build that file replaces the generated strokes. Components, timelines and animation code stay the same. [`brush/scans/_template.svg`](brush/scans/_template.svg) is a working example.

1. **Scan** each stroke at 600 dpi or more, on its own if possible, and keep the composition's viewBox (for example `0 0 720 640` for the hero).
2. **Outline from the scan.** Vectorise the ink (Illustrator Image Trace, Inkscape Trace Bitmap or potrace) into a *filled* shape per stroke. Keep the dry-brush breakup; that is the point. Convert arcs to curves and flatten transforms.
3. **Hand-draw the centreline.** On a layer above, draw one open path through the middle of each stroke, **in the direction the brush moved**, from the first touch to the lift. This path becomes the mask, so it has to cover the stroke: the pipeline sets its width to 1.15 × the widest point it measures on your outline.
4. **Number the pairs in stroke order** (that is the drawing order):

   ```svg
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 640">
     <path id="01-outline"    d="…traced ink…" data-tone="ink"/>
     <path id="01-centreline" d="…hand-drawn line…"/>
     <path id="02-outline"    d="…" data-tone="wash" data-layer="paint"/>
     <path id="02-centreline" d="…"/>
   </svg>
   ```

   `data-tone` is `ink`, `wash`, `graphite`, `indigo` or `moss`. `data-layer="paint"` marks strokes revealed on hover in the work list.
5. **Build.** `npm run build` prints the source (`scan` or `generated`) in the manifest, and `/system` lists it per illustration. Delete the scan file to go back to the generated strokes.

Timing still comes from the illustration's data file (`budget`, `kind`, label), so a scan only replaces geometry.

## Motion tiers

`<html data-motion="full|calm|still">` is set by an inline script before first paint and persisted in `localStorage`. `prefers-reduced-motion` defaults to Calm. The toggle is the three brush dots in the navigation.

| Tier  | Behaviour |
| ----- | --------- |
| Full  | Stroke-by-stroke drawing, split headlines, settle filter, scrubbed process spine, ink-sweep page transitions, ink-bloom shader (desktop gate), Lenis (desktop + fine pointer). |
| Calm  | Illustrations fade in whole (200 ms); 200 ms page fades; no scrub, WebGL, Lenis or filters. |
| Still | Final state, zero animation. |

Animations start on `astro:page-load` inside one `gsap.matchMedia()` context. Every timeline, SplitText and ScrollTrigger is reverted before each ClientRouter swap (`npm run verify` navigates 10 times and compares ScrollTrigger counts with fresh loads).

## Project layout

```
brush/                  stroke data, presets, scans
scripts/brush/          pipeline (noise, geometry, PNG encoder, build)
scripts/fonts/          metric-matched fallback faces (capsize)
scripts/verify/         Playwright verification
src/design/tokens.ts    colour, type, layout and motion tokens (CSS vars are emitted from here)
src/config/site.ts      all placeholder content
src/content/work/       case studies (MDX collection)
src/components/         layout pieces (header, seal, spine, work list, …)
src/pages/              home, work, case studies, about, contact, system, 404
src/scripts/            motion runtime: motion/ (core, tiers, brush, text, transitions, intro),
                        features/ (per-page choreography), islands/bloom.ts (OGL)
```

Everything under `src/generated/` is rebuilt by `npm run gen` and is git-ignored.
