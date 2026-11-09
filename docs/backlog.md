# Backlog

Follow-ups that are known and deliberately not done yet. Take one at a time.

## Feedback round 3: plan

One session, in this order (the background first: every other check depends on it). Report:
`docs/handoff/feedback-3.md`.

1. **Item 4, chapter 05 flicker.** Drop `field.pinnedDetail` and `scenes/pin.ts`; the canvas
   resizes only from its ResizeObserver (device-pixel-content-box) and draws in the same callback;
   the deal cards get `will-change` once per mount; the header keeps one stable layer.
2. **Item 1, About morph.** A 768×528 region heightmap (lossless WebP, R/G heights, B lake mask
   rasterised from the SVG's lake path) built by `scripts/terrain/build-field.py` from the
   portfolio's 1536 master; the shader morphs noise into the terrain with fwidth lines that match
   the SVG (cover crop, 100 / 200 m by the shared media query, colours and alphas, lakes);
   full device resolution only while the morph runs, with a 0.75× guard; the SVG is an `<img>`
   that takes over with opacity only; the vignette is a static overlay; the drift animates
   `translate` from the handoff on. The mask-image reveal and `--contour-reveal` go.
3. **Item 2**, the pause button and everything only it used.
4. **Item 5**, reveal trigger 0.35 / −18%, tall blocks, the end of the page.
5. **Item 3**, the header logo's motion (deal-in, hover fan, the letters egg, logo ↔ Back).
6. **Item 6**, chapter numerals drawn from Bricolage's outlines (`scripts/build-numerals.mjs`).
7. **Item 7**, the two-lane career timeline.
8. **Item 8**, the master's thesis page (first draft).
9. **Item 9**, the idle note only where it fits; verification; push `main`; deploy check.

- **Card → detail transition.** Fine-tune the play morph (lift, zoom and the page's first
  reveals after it): timing, the crossfade window and how the hero lands.
- **Home intro timings.** Fine-tune the first-visit sequence (`at.firstLoad` in
  `src/motion/tokens.ts`): offsets, durations and the hand's deal. (The smoke check now reads each
  part's start from its animations' own timing, so tuning no longer upsets it; feedback round 2.)
- **Language detail.** German alternatives for the few kept English terms (Critique,
  Research-Share) if the persona prefers German; a per-locale Open Graph image. ("Design-System"
  is written with a hyphen since feedback round 2.)
- **Portrait.** About's hero shows an example photo (`about-portrait`, Unsplash); replace it with
  the real portrait (a 4:5 crop through `scripts/images`, alt text in both languages).
- **Timeline copy.** The timeline cards split each stop into title and place; the long Hyper
  Island description ("facilitation, team dynamics, digital experience design") was dropped for
  the card and belongs in the rewrite.
- **Idle note on short phones.** At 390 × 800 and 360 × 740 the idle note (fixed above the fan)
  overlaps the last "What I bring" item; at 390 × 844 and taller it clears. Its phone placement
  predates round 2; give it a spot that follows the home layout.
