# Motion session

Branch: `claude/motion-choreography-reveals-och1mz` (pushed only there; never `main`).

## Plan

Written before editing. Everything attaches through the documented hooks (`<Reveal>`,
`<FirstLoadSequence>`, `<ReadingHairline/>`, `useDealScene`, `data-draw` / `data-draw-group`,
`data-hero-target`, `data-illustration`); no page file is edited.

1. **Engine** (`src/motion/reveal.ts` + small modules beside it). One reveal system for the eight
   kinds. CSS (`src/styles/reveal.css`) only hides armed, unrevealed blocks with `opacity: 0`;
   every movement is a WAAPI animation started by JS (backwards fill holds the start pose), so
   reduced motion never sees a transform and no-JS visitors get the final page after the 4 s
   arming timeout. Triggers: `data-reveal-order` blocks in the first viewport play in sequence
   after the route's base offset; every other block reveals with Motion `inView` (amount 0.25,
   margin from `reveal` tokens, once), batched per frame and staggered in document order so two
   adjacent blocks never start together with the same reveal. A job scheduler caps concurrent
   reveal jobs at 8 below 1024 px (the rest queue), sets `will-change` only while a job runs and
   cancels finished animations so everything is still at rest. Legacy `data-reveal` presets and
   `data-order` groups still in the current pages map onto the new kinds (aliases) until Layout's
   pages land; their CSS presets and the `--reveal-calm` / `--reveal-reduced` timings go (D4).
2. **First load** (`<FirstLoadSequence>` on home): the timeline below, plus `[data-chrome]` last;
   same-session revisits and client navigations to home crossfade everything within 300 ms.
   Any key, click, wheel or scroll completes the sequence (as before).
3. **Kinds**: lines (Motion+ `splitText` after `document.fonts.ready`, lines in clip masks,
   reverted afterwards), block, list, image, digits (digit strips), rule, draw (SVG strokes by
   group, tint fills after their group), note (after its related paragraph).
4. **Scroll-linked** (full tier only, at most one per viewport): reading hairline (CSS
   `animation-timeline: scroll(root)` behind `@supports`, Motion `scroll()` fallback; it stays as
   a progress indicator in calm and reduced, drawn with clip-path in reduced), `.hero-drift`
   (CSS `view()` behind `@supports`), the pinned deal (`useDealScene`, desktop ≥ 1024, Motion
   `scroll` on the stage, five phases, field at half resolution while pinned), About timeline
   strokes linked to view progress (native `ViewTimeline`; normal draw reveal otherwise).
5. **Tiers**: full / calm (× 0.6, no pinning or parallax, split only h1/h2, SVG draws 500 ms) /
   reduced (160 ms opacity only, SVGs drawn, digits static, field static, view transitions
   crossfade).
6. **D3**: `heroTarget()` measures `[data-hero-target]` at play time, falls back to the computed
   geometry.
7. **Eggs and smoke**: eggs keep working on the new timings; `scripts/smoke.mjs` gains per-tier
   checks (reduced: no transforms; calm: the deal stacks). A temporary lab route exercises every
   kind, the deal scene and the hairline; it is deleted before the final commit.
8. Review the diff against the spec with a subagent; verify with the production build and
   Playwright at 1440×900 and 390×844.

### Frame timeline (full tier; calm × 0.6; reduced: every offset 0, 160 ms opacity)

Token names in brackets. Values the tokens do not have yet are named constants in
`src/motion/choreography.ts` (see contract change requests).

**First load (home, first visit in the session)**

| Element | Start (ms) | Duration (ms) | Easing | Stagger (ms) | Ends (ms) |
| --- | --- | --- | --- | --- | --- |
| Hand cards (4), dealt from off screen, flip face up | 0 | 420 [`dur.m`] | outExpo [`ease.draw`] | 80 [`stagger.cards`] | 660 |
| Title words turn up (rise from the word mask + rotateX [`angle.word`]) | 520 | 640 [`dur.l`] | outExpo | 70 [`stagger.words`] | 520 + 70·(n−1) + 640 |
| Title opsz 24 → 96 / wght 280 → 700 settle [`opsz`, `weight`] | 520 | 900 [`dur.xl`] | outQuint | 70 [`stagger.words`] | – |
| Role line (`lines`) | 900 | 640 [`dur.l`] | outExpo | – | 1540 |
| Intro lines (`lines`) | 1000 | 640 [`dur.l`] | outExpo | 60 [`stagger.lines`] | 1640 + 60·(n−1) |
| Divider (`rule`, scaleX from the left) | 1300 | 640 [`dur.l`] | inOut | – | 1940 |
| The rest (hint, "On the table now", label), each by its kind | 1300 + 50·(i+1) | by kind | by kind | 50 [`stagger.items`] | – |
| Chrome (`[data-chrome]`: header, card counter), opacity | after the rest | 240 [`dur.s`] | outQuint | 50 [`stagger.items`] | – |
| Revisit (same session) / client navigation to home: every part, opacity | 0 (title), 60 (rest) [`stagger.lines`] | 240 [`dur.s`] | outQuint | – | ≤ 300 |

**Other first viewports** (`data-reveal-order`): start = base + 80 [`stagger.cards`] × (order + 1)
+ `delay`; base = 0 on load / nav, 348 ms (`duration.zoom` × 0.6) after a play or switch. The h1
reveals at the base (play / switch: final at once, its title morphs in the view transition).

**Reveal kinds (below the fold: Motion `inView`, amount 0.25, once)**

| Kind | Target | From → to | Duration (ms) | Easing | Stagger (ms) | Calm | Reduced |
| --- | --- | --- | --- | --- | --- | --- | --- |
| lines | each split line in an `overflow: clip` mask | translateY 110% → 0 | 640 [`dur.l`] | outExpo | 60 [`stagger.lines`] | split only h1/h2; other elements as `block` | opacity 160 |
| block | the element | translateY 12 px → 0, opacity 0 → 1 | 420 [`dur.m`] | outQuint | – | 252 | opacity 160 |
| list | each direct child | translateX −12 px → 0, opacity 0 → 1 | 420 [`dur.m`] | outQuint | 50 [`stagger.items`] | 252 / 30 | opacity 160 (whole list) |
| image | media box / inner img | clip inset(10% round 12px) → inset(0 round 4px); img scale 1.12 → 1 | 900 [`dur.xl`] | outExpo | – | 540 | opacity 160 |
| digits | each `[data-digit]` strip | rolls up from blank to the digit | 700 total per value | outExpo | 40 per digit [`stagger.metric`], 50 per item | × 0.6 | static |
| rule | the element | scaleX 0 → 1, origin left | 640 [`dur.l`] | inOut | – | 384 | opacity 160 |
| draw | `[data-draw]` (pathLength 1) | stroke-dashoffset 1 → 0; 8% tints opacity after their group | 1200 | inOut | 120 per group [`stagger.svgGroups`] | 500 / 72 | drawn, opacity 160 |
| note | the element | opacity 0 → 1, after its related paragraph ends | 240 [`dur.s`] | outQuint | – | 144 | 160 |

Blocks that enter view in the same frame start 50 ms apart in document order; adjacent blocks of
the same kind with the same order are nudged by 50 ms, so no two neighbours share a timing.

**Scroll-linked (full tier)**

| Effect | Driver | Range | Values |
| --- | --- | --- | --- |
| Reading hairline | CSS `scroll(root)` / Motion `scroll()` | whole document | `--reading-progress` 0 → 1 |
| `.hero-drift` | CSS `view()` | `exit` | translateY 0 → 6% |
| Pinned deal (≥ 1024) | Motion `scroll`, target = stage, offset `start start` / `end end` | stage ≤ 250svh | 0–0.2 card 1, 0.2–0.4 card 2, 0.4–0.6 card 3, 0.6–0.8 card 4, 0.8–1 settle |
| About timeline | `ViewTimeline` | entry 100% → cover 60% | groups drawn in order across the range |
