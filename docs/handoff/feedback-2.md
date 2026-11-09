# Feedback round 2

One session (the only one running) applies the second round of design feedback: M1–M3 (motion
settings), N1 (navigation), H1–H2 (home), A1–A3 (About), B1 (background) and F1–F3 (fixes).
Everything not named there stays as it is. Every new or changed visible string exists in German
and English.

## Branch

`claude/brave-einstein-jt7iyv`, merged into `main` once verification passes; `main` is pushed and
deployed once.

## Plan

Small commits in this order: motion settings, navigation, home, background, About, fixes, smoke,
docs.

**Motion settings**

- M1: two tiers only, `full` and `reduced` (`prefers-reduced-motion`). Out: `CalmSwitch` and its
  CSS, `MotionTier`'s `calm`, `motionScale.calm`, `tiers.calm`, `duration.svgDrawCalm`,
  `duration.calmBloom`, the stored `motion` preference and its pre-paint branch, every
  `tier === 'calm'` branch (kinds, first load, eggs, play, deal scene, field), `site.settings.calm*`
  copy and schema, the calm smoke and audit options, and the docs.
- M2: `AmbientToggle` in the header (where the calm switch was): an icon-only button (pause / play
  glyph, 16 px icon in a 44 px target), `aria-pressed`, accessible name "Pause background motion" /
  "Play background motion" (German "Hintergrundbewegung anhalten" / "… abspielen"). The choice is
  stored in localStorage (`ambient`) and applied before first paint as `html[data-ambient="paused"]`
  by the pre-paint script, which stays the single writer. Paused stops only ambient background
  motion: the field's breath and pool drift (its clock stops; hover, bloom and morphs still run) and
  the About contour drift. Hidden under reduced motion (the background is still then).
- M3: `idle.after` 10 s (`?idle` stays 1 s).

**Navigation**

- N1: `src/motion/header-scroll.ts`, started by the header: one passive scroll listener,
  rAF-throttled, writes `html[data-header="hidden"]`. Hides after more than 8 px of downward scroll
  in one direction past the header height; shows after 8 px upward. Always shown near the top, on
  pages that do not scroll, on focus inside the header, while the mobile sheet is open and after
  every route change; scroll changes during a view transition and overscroll bounce are ignored.
  CSS: `translate` only, 200 ms ease-in to hide, 240 ms outQuint to show (tokens); reduced: a
  160 ms crossfade, no slide. The mobile rail follows the same attribute (its own scroll logic and
  `data-rail` go). The reading hairline stays on screen at the top edge while the header is away.
  `scroll-padding-top` keeps anchors clear.

**Home**

- H1: the "What I bring" label and the three items align on one baseline from 1024; below, the
  label stays above the stacked items.
- H2: "Pick a card" centred at every width.

**Background**

- B1: `public/contour-bg/*.svg` (present, used unchanged) drawn by a `.contour-bg` layer inside the
  background field (above the canvas, below the content) with the old password page's CSS; every
  `url()` passes through `withBase()` (inline custom properties). Ground `#1B1C18`. No headlamp, no
  pointer. The poster drifts (transform only, ±8 / ±5 px, 120 s alternate, scale 1.03; tokens in
  `field.contourDrift`); stopped when paused, under reduced motion and while the tab is hidden. The
  morph: the shader's `uTopo` now contracts the pools and fades them into the ground, while the
  contour layer reveals through a radial mask growing from the centre (1.6 s inOut); at rest the
  WebGL field draws no frames; leaving reverses it; reduced: a 160 ms crossfade. The SVG is fetched
  when an About link is hovered, focused or touched (and on About). Removed: the heightmap shader
  code, `terrain.ts`, `public/terrain/`, `field.contours`, the posters and `data-poster`. The credit
  "Terrain data © swisstopo" / "Geländedaten © swisstopo" links to swisstopo's terms of use (footer
  small print, and the left edge from 1024).

**About**

- A1: `ContourPortrait` and its copy go; `about-portrait` (Nik Bagherzadegan, Unsplash License,
  `crop: [4, 5]`) through `fetch-and-build.mjs`, alt text in both languages, in the hero where the
  drawing was.
- A2: "Timeline" / "Werdegang" as seven face-up cards (the "What's on the table" card family):
  years (mono), title, place (`about.timeline.items[].place`, new in both languages). From 1280 a
  line across the content width, the cards dealt from a small face-down stack at its left end
  (120 ms apart, 420 ms each, outExpo, as the section enters); 1024–1279 a scroll-snap strip with
  the line through it; below 1024 a vertical line on the left, cards at reading width, each dealt
  in from the left as it enters. Reduced: static. A new reveal kind `deal` runs both rows.
  `AboutTimeline`, its copy and `timeline-scene.ts` go.
- A3: "How I work" as four face-up cards (number, title, body at the body size): from 1024 a row
  dealt in with a slight fan that settles straight, 640–1023 2×2, below 640 one column. No flip,
  no hover lift.

**Fixes**

- F1: `dist/404.html` takes the locale from the address when it has one; stored and browser
  language decide only for addresses without one.
- F2: German "Design-System".
- F3: the home intro smoke check compares each part's start (the reveal job marks the block
  `data-revealed` when its animation starts) instead of when it crosses an opacity threshold.

**Smoke** (`scripts/smoke.mjs`): calm option and switch checks out; new checks for the ambient
toggle (state, storage, pre-paint, hidden in reduced), the header hiding and returning on a case
study, the rail in step, the About contour layer (no frames at rest, drift, paused, no pointer
reaction), the 404 locale rule, the timeline and how-I-work cards.

**Docs**: contracts (a "Feedback round 2" section, reference sections updated), art direction,
backlog, README where it names the calm switch.
