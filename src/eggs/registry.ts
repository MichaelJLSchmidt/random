import type { MotionTier } from '@/motion/tokens'

/*
 * Easter eggs: one registry, an on/off flag each, and what each does per
 * motion tier. Everything an egg needs is loaded on demand (`load`), except
 * the small trigger code in the deck, the hand and the 404 card.
 */
type Egg = {
  on: boolean
  trigger: string
  behaviour: Record<MotionTier, string>
}

export const eggs = {
  mulligan: {
    on: true,
    trigger: 'Long-press the deck (800 ms) or press M (home)',
    behaviour: {
      full: 'The hand returns to the deck, riffles twice and is dealt in a new order.',
      calm: 'The hand dims briefly and comes back in a new order; no travel.',
      reduced: 'The new order appears at once.',
    },
  },
  workshop: {
    on: true,
    trigger: 'Swipe up on the deck, tap it, or press D (home)',
    behaviour: {
      full: 'A card rises from the deck, its title typed out (Typewriter), then a Glint; dismissed, it flies back into the deck.',
      calm: 'The card fades in with its title already written; no Glint; fades out on dismiss.',
      reduced: 'The card appears and disappears at once.',
    },
  },
  rarePull: {
    on: true,
    trigger: 'Any deal (first-visit intro, Mulligan): 1 in 16 per card',
    behaviour: {
      full: 'The card is dealt showing a full-art foil back with a "rare 1/16" tag; the tag stays on its face.',
      calm: 'No deal is shown; a rolled card carries the tag on its face.',
      reduced: 'As calm.',
    },
  },
  tap: {
    on: true,
    trigger: 'Double-tap a card (during the draw lift) or press T',
    behaviour: {
      full: 'The card turns 90° with a spring, revealing a line printed along its long edge; repeat to untap.',
      calm: 'A short turn without overshoot.',
      reduced: 'The card turns at once.',
    },
  },
  table: {
    on: true,
    trigger: "About: hover or tap the card edge behind the portrait (What's on the table)",
    behaviour: {
      full: 'Five face-down cards fan out from behind the portrait and flip to short personal items.',
      calm: 'The items appear face up in a row with a short fade; no fan, no flip.',
      reduced: 'The items appear at once.',
    },
  },
  shortcuts: {
    on: true,
    trigger: 'Press ?',
    behaviour: {
      full: 'A dialog lists every shortcut (fade).',
      calm: 'Same, shorter fade.',
      reduced: 'Same, no fade.',
    },
  },
  shuffle: {
    on: true,
    trigger: 'Type "shuffle" outside a field',
    behaviour: {
      full: 'Every card on the page riffles once.',
      calm: 'Nothing moves; the shuffle is announced.',
      reduced: 'As calm.',
    },
  },
  notFound: {
    on: true,
    trigger: 'Any unknown address',
    behaviour: {
      full: 'A face-down card wobbles once and flips to a blank face.',
      calm: 'The card cross-fades to its blank face; no wobble.',
      reduced: 'The blank face is shown at once.',
    },
  },
  haptics: {
    on: true,
    trigger: 'Gestures: hold, swipe snap, deck long-press and swipe, draw, tap, flip, copy',
    behaviour: {
      full: 'navigator.vibrate pulses of 20 ms or less inside gesture handlers, where supported.',
      calm: 'Same (haptics are not motion).',
      reduced: 'Same. Toggles use native switch inputs instead.',
    },
  },
} satisfies Record<string, Egg>

export const RARE_CHANCE = 1 / 16
export type EggName = keyof typeof eggs

/** Fire an egg (the hand, the deck and the keyboard all go through here). */
export function trigger(name: EggName, detail?: unknown) {
  if (!eggs[name].on) return
  window.dispatchEvent(new CustomEvent(`egg:${name}`, { detail }))
}
