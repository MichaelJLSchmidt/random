# Backlog

Follow-ups that are known and deliberately not done yet. Take one at a time.

- **Card → detail transition.** Fine-tune the play morph (lift, zoom and the page's first
  reveals after it): timing, the crossfade window and how the hero lands.
- **Final logo.** Replace the placeholder wordmark (`site.wordmark`, the `.slot-mark` box in
  `src/components/header.tsx`) with the final SVG logo, designed separately, and re-check the
  wordmark ↔ Back morph with it. The morph treats the mark as one box (scaleX + fade toward the
  left edge), so the logo drops in without changing the morph.
- **Home intro timings.** Fine-tune the first-visit sequence (`at.firstLoad` in
  `src/motion/tokens.ts`): offsets, durations and the hand's deal.
