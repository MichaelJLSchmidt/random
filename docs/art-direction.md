# Art direction: "The Table"

The brief every session designs to. Tokens and components that implement it are listed in
`docs/contracts.md`.

## The idea

A card table seen from the player's seat. A dark neutral field (ink `#0E0F11`, text `#ECEAE4`)
with a slowly breathing WebGL gradient behind everything; its colour pools drift on slow loops
(90 s and longer, 2–3% of the viewport), noticeable only when you look closely. A persistent
**hand of four cards** is the main navigation: three case studies (`/work/[slug]`) and Management
(`/management`). About is the one plain link; it holds the project list and the contact chapter.

On About the gradient's colour pools contract and fade into a dark ground (`#1B1C18`) while
contour lines rise out of a soft noise relief and settle onto the real swisstopo terrain of
Interlaken (1.6 s): the lakes fill in at 8%, stone-grey lines (`#8A8C80`, 1 px and 1.5 px index
lines) under the old password page's vignette. The last moment hands over, unseen, to the old
page's contour drawing itself. At rest only its lines move, a very slow drift of a few pixels;
nothing reacts to the pointer. Leaving About runs the morph back.

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
  the logo compresses into a back arrow) returns the card to the hand: it morphs back from
  the hero, or, when the hero has scrolled away, is dealt into its slot.
- **Desktop**: the hand is always visible at the bottom in a perspective fan.
- **Mobile**: the fan on home; elsewhere a 48 px peek rail that opens a bottom sheet with the four
  cards.
- **Header**: the logo (two fanned cards with an M and an F cut out) or Back at the top left,
  About and "DE · EN" at the right. On pages that scroll it leaves on a deliberate scroll down and
  returns on any scroll up (the mobile rail with it); the reading hairline stays at the top edge.
- **Logo**: on the first home visit its two cards are dealt in with the rest of the table. Hover
  or focus widens the fan a little. A click on the logo on home (or a long press by touch) turns
  the cards to show their letters, and back. Entering a detail page the cards close up and leave
  before "← Back" appears; coming back they are dealt again.
- **Home** is one screen: the name, the intro, what I bring to the table and the hand. On a first
  visit it builds up in reading order in about two seconds, the hand last.
- **Detail pages**: chapters open with big outlined numerals that draw themselves, contour by
  contour, as the chapter comes into view; images are offset editorial frames
  that echo the hero's offset (anchored to the reading column, reaching toward one edge, sides
  alternating), never full bleed on desktop.
- **About** keeps to the table: its timeline and "How I work" are face-up cards in the same family
  as "What's on the table" (edges, mono labels). The timeline is two lanes, work and education,
  on one year axis (horizontal on desktop, vertical on phones): each card as long as its years,
  overlaps marked by a faint shared band, the apprenticeship one card across both lanes. Its cards
  are dealt in order from a deck at the start of the axis; the Master's card opens the thesis
  overview with the card-to-hero morph. "How I work" is dealt with a slight fan that settles
  straight.

## Tone

- Calm, subtle, smooth, professional, with playful moments (the easter eggs).
- Only the background moves at rest; everything else is still until the visitor scrolls or
  interacts. No bounce, no overshoot.
- Two motion tiers: full, and reduced (`prefers-reduced-motion`: 160 ms crossfades only, and the
  background's ambient motion is still). There is no motion setting on the site.
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
