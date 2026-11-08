# Art direction: "The Table"

The brief every session designs to. Tokens and components that implement it are listed in
`docs/contracts.md`.

## The idea

A card table seen from the player's seat. A dark neutral field (ink `#0E0F11`, text `#ECEAE4`)
with a slowly breathing WebGL gradient behind everything. A persistent **hand of four cards** is
the main navigation: three case studies (`/work/[slug]`) and Management (`/management`). More
projects, About and Contact are plain links.

## Colour identities

| Card / page | Identity |
| --- | --- |
| Case 1, Team of Teams | ember red |
| Case 2, Shared Foundations | tide blue |
| Case 3, Front Door | grove green |
| Management | saffron gold |
| About | glacier teal |
| Home, More projects, 404 | ink |

Values: `src/design/palette.ts`. Body text stays `--text`; accents are for links, focus, metrics,
dividers and illustration strokes.

## Behaviour

- **Hover** a card: the background blends toward the card's colour.
- **Play** a card: it lifts, then a shared-element view transition zooms it into the detail hero
  while its colour blooms fullscreen. **Back** returns the card to the hand.
- **Desktop**: the hand is always visible at the bottom in a perspective fan. On home a card
  counter ("01 / 04" and the hovered or focused card's title) sits beside it.
- **Mobile**: the fan on home; elsewhere a 48 px peek rail that opens a bottom sheet with the four
  cards and the plain links.

## Tone

- Calm, subtle, smooth, professional, with playful moments (the easter eggs).
- Only the background moves at rest; everything else is still until the visitor scrolls or
  interacts. No bounce, no overshoot.
- Three motion tiers: full; calm (site toggle, durations × 0.6); reduced
  (`prefers-reduced-motion`: 160 ms crossfades only).
- Dark mode first. Mobile first, with full creativity on desktop.
- Type: Bricolage Grotesque (display, opsz + wght), Hanken Grotesk (text), Martian Mono (labels,
  numbers).
- Plain labels. No job-seeking language, CV download or testimonials. No personal names in code,
  comments, docs or commits.

## Constraints

- Static export under the GitHub Pages base path (`/random/`): never a hard-coded leading `/`
  for assets or links (`next/link`, or `withBase()` for raw URLs).
- No new animation or smooth-scroll libraries (no GSAP, no Lenis): Motion, Motion+ and CSS cover
  everything; every extra runtime costs mobile performance. Initial JS budget 170 KB gzip.
