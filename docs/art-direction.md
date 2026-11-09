# Art direction: "The Table"

The brief every session designs to. Tokens and components that implement it are listed in
`docs/contracts.md`.

## The idea

A card table seen from the player's seat. A dark neutral field (ink `#0E0F11`, text `#ECEAE4`)
with a slowly breathing WebGL gradient behind everything; its colour pools drift on slow loops
(90 s and longer, 2–3% of the viewport), noticeable only when you look closely. A persistent
**hand of four cards** is the main navigation: three case studies (`/work/[slug]`) and Management
(`/management`). About is the one plain link; it holds the project list and the contact chapter.

On About the gradient's colour bands narrow into contour lines (1.6 s): the old portfolio's
survey field of Interlaken, real swisstopo contours, 1 px stone-grey lines (`#8A8C80`, every fifth
an index line) on its own ground (`#1B1C18`). Once drawn it is a still image: no drift, no
breath, no pointer. Leaving About widens the lines back into the gradient.

## Colour identities

| Card / page | Identity |
| --- | --- |
| Case 1, Team of Teams | ember red |
| Case 2, Shared Foundations | tide blue |
| Case 3, Front Door | grove green |
| Management | saffron gold |
| About | glacier teal (accents), over the contour field's ground |
| Home, 404 | ink |

Values: `src/design/palette.ts`. Body text stays `--text`; accents are for links, focus, metrics,
dividers and illustration strokes.

## Behaviour

- **Hover** a card: the background blends toward the card's colour.
- **Play** a card: it lifts, then a shared-element view transition zooms it into the detail hero
  while its colour blooms fullscreen. **Back** (the header's top-left slot on detail pages, where
  the wordmark compresses into a back arrow) returns the card to the hand: it morphs back from
  the hero, or, when the hero has scrolled away, is dealt into its slot.
- **Desktop**: the hand is always visible at the bottom in a perspective fan.
- **Mobile**: the fan on home; elsewhere a 48 px peek rail that opens a bottom sheet with the four
  cards.
- **Home** is one screen: the name, the intro, what I bring to the table and the hand. On a first
  visit it builds up in reading order in about two seconds, the hand last.
- **Detail pages**: chapters open with big outlined numerals; images are offset editorial frames
  that echo the hero's offset (anchored to the reading column, reaching toward one edge, sides
  alternating), never full bleed on desktop.

## Tone

- Calm, subtle, smooth, professional, with playful moments (the easter eggs).
- Only the background moves at rest; everything else is still until the visitor scrolls or
  interacts. No bounce, no overshoot.
- Three motion tiers: full; calm (the header's switch, durations × 0.6); reduced
  (`prefers-reduced-motion`: 160 ms crossfades only; the switch shows it on and disabled).
- Dark mode first. Mobile first, with full creativity on desktop.
- Type: Bricolage Grotesque (display, opsz + wght), Hanken Grotesk (text), Martian Mono (labels,
  numbers); Caveat (handwriting) only for the idle hint's note on home.
- Plain labels. No job-seeking language, CV download or testimonials. No personal names in code,
  comments, docs or commits.
- Two languages, German (Swiss Standard German, informal "du", no em-dashes or semicolons) and
  English, the same design in both. The header's "DE · EN" switches in place with one short
  cross-fade; the table, the field and the reading position stay.

## Constraints

- Static export under the GitHub Pages base path (`/random/`): never a hard-coded leading `/`
  for assets or links (`next/link`, or `withBase()` for raw URLs).
- No new animation or smooth-scroll libraries (no GSAP, no Lenis): Motion, Motion+ and CSS cover
  everything; every extra runtime costs mobile performance. Initial JS budget 170 KB gzip.
