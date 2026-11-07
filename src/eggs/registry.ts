/*
 * Easter eggs: optional, never blocking, each with an on flag and its
 * behaviour per motion tier. Code for an egg runs only when it fires.
 */
export const eggs = {
  mulligan: {
    on: true,
    trigger: 'M on the start page, or a long press on the deck (800 ms, 10 ms haptic)',
    full: 'cards fly back to the deck and are dealt again, face down then face up',
    calm: 'cards fade out and back in',
    reduced: 'nothing moves; announced',
  },
  workshop: {
    on: true,
    trigger: '"Draw a workshop method" on /management',
    full: 'a card turns over (3D flip) to a random method',
    calm: 'cross-fade',
    reduced: 'instant swap',
  },
  rarePull: {
    on: true,
    trigger: '1 in 40 page loads (or ?rare in the address)',
    full: 'one hand card gets a single 1200 ms holographic glint',
    calm: 'none',
    reduced: 'none',
  },
  tap: {
    on: true,
    trigger: 'T on a focused card, or a double tap on a card while it lifts (mobile)',
    full: 'the card turns 90 degrees on the hover spring and shows the line on its long edge; untaps on the next navigation',
    calm: 'shorter turn',
    reduced: 'turns at once',
  },
  shortcuts: {
    on: true,
    trigger: '?',
    full: 'a dialog; its title types itself (Motion+ typewriter, loaded on first open)',
    calm: 'title shown at once',
    reduced: 'title shown at once',
  },
  discard: {
    on: true,
    trigger: 'any unknown address (404)',
    full: 'a card falls face down into the discard zone (rotate to -12 degrees, 700 ms)',
    calm: 'fades in, 4px',
    reduced: 'fades in',
  },
  onTheTable: {
    on: true,
    trigger: 'About: three face-down cards with the names of three games',
    full: 'a tap flips a card to one line',
    calm: 'cross-fade',
    reduced: 'instant swap',
  },
  inspect: {
    on: true,
    trigger: 'hold Space on a focused card (400 ms), or long press (400 ms, 10 ms haptic) on mobile',
    full: 'the card grows to 2x in place with its one-line summary',
    calm: 'shorter',
    reduced: 'at once',
  },
  coffee: {
    on: true,
    trigger: 'typing "draw" on the start page',
    full: 'a fifth card, "Coffee?", is dealt from the deck and opens /contact',
    calm: 'fades in',
    reduced: 'appears',
  },
} as const

export type EggName = keyof typeof eggs
export const eggOn = (name: EggName) => eggs[name].on
