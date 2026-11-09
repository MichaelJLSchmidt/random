# Backlog

Follow-ups that are known and deliberately not done yet. Take one at a time.

- **Card → detail transition.** Fine-tune the play morph (lift, zoom and the page's first
  reveals after it): timing, the crossfade window and how the hero lands.
- **Home intro timings.** Fine-tune the first-visit sequence (`at.firstLoad` in
  `src/motion/tokens.ts`): offsets, durations and the hand's deal. The smoke check "home first
  visit: … items, hand …" is marginal by design: the last "What I bring" item and the first card
  start about 10 ms apart, and the check compares when each crosses a visibility threshold, so it
  fails in most runs on desktop (2 of 10 runs passed on the untouched build in this environment).
  Either separate the two in the tokens or let the check compare start times.
- **Language detail.** German alternatives for the few kept English terms (Design System,
  Critique, Research-Share) if the persona prefers German; a per-locale Open Graph image.
