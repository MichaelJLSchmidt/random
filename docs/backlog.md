# Backlog

Follow-ups that are known and deliberately not done yet. Take one at a time.

- **Card → detail transition.** Fine-tune the play morph (lift, zoom and the page's first
  reveals after it): timing, the crossfade window and how the hero lands.
- **Final logo.** Replace the placeholder wordmark (`site.wordmark`, the `.slot-mark` box in
  `src/components/header.tsx`) with the final SVG logo, designed separately, and re-check the
  wordmark ↔ Back morph with it. The morph treats the mark as one box (scaleX + fade toward the
  left edge), so the logo drops in without changing the morph.
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
