import { animate, type AnimationPlaybackControls } from 'motion'
import { glint, stopGlint } from './glint'
import { distance, duration, ease, stagger } from './tokens'

/*
 * First-visit intro (full tier, home only; loaded on demand). The three hand
 * cards start face down on top of the deck. The deck does one riffle cut, then
 * deals the cards into the hand 80 ms apart; each flips face up as it lands,
 * and one Glint crosses the top card. Total: 1.54 s (see introBudget).
 * `finish()` jumps everything to the end state.
 */
export function playIntro({ hand, deck, onDone }: { hand: HTMLElement; deck: HTMLElement; onDone: () => void }) {
  const slots = [...hand.querySelectorAll<HTMLElement>('[data-card-slot]')]
  const pile = [...deck.querySelectorAll<HTMLElement>('[data-deck-card]')]
  const top = pile.at(-1) ?? deck
  const deckBox = top.getBoundingClientRect()
  const deckX = deckBox.left + deckBox.width / 2
  const deckY = deckBox.top + deckBox.height / 2
  const controls: AnimationPlaybackControls[] = []
  let finished = false

  const r = duration.riffle
  slots.forEach((slot, i) => {
    // Delta from the slot to the deck, expressed in the slot's own (rotated) frame.
    const box = (slot.querySelector('[data-foil-surface]') ?? slot).getBoundingClientRect()
    const dx = deckX - (box.left + box.width / 2)
    const dy = deckY - (box.top + box.height / 2)
    const m = new DOMMatrix(getComputedStyle(slot.parentElement!).transform)
    const angle = Math.atan2(m.b, m.a)
    const lx = dx * Math.cos(-angle) - dy * Math.sin(-angle)
    const ly = dx * Math.sin(-angle) + dy * Math.cos(-angle)
    const turn = (-angle * 180) / Math.PI
    // Cards leave the (smaller) deck at its size and grow into the hand.
    const card = slot.querySelector<HTMLElement>('[data-foil-surface]')
    const s0 = card ? top.offsetWidth / card.offsetWidth : 1
    const start = r + i * stagger.deal
    const total = start + duration.deal
    const at = (t: number) => t / total
    const cut = distance.slide * 0.9

    controls.push(
      animate(
        slot,
        {
          x: [lx, lx + cut, lx, lx, 0],
          y: [ly, ly - cut / 4, ly, ly, 0],
          rotate: [turn, turn + 4, turn, turn, 0],
          scale: [s0, s0, s0, s0, 1],
        },
        { duration: total, times: [0, at(r / 2), at(r), at(start), 1], ease: ease.out },
      ),
    )
    const flipper = slot.querySelector<HTMLElement>('[data-flipper]')
    if (flipper) {
      controls.push(
        animate(flipper, { rotateY: [180, 180, 0] }, { duration: total, times: [0, at(start), 1], ease: ease.inOut }),
      )
    }
  })

  // The bottom half of the deck moves the other way during the cut.
  pile.forEach((card) => {
    controls.push(animate(card, { x: [0, -distance.slide * 0.6, 0] }, { duration: r, ease: ease.inOut }))
  })

  const landed = r + (slots.length - 1) * stagger.deal + duration.deal
  const topCard = slots.at(-1)?.querySelector<HTMLElement>('[data-foil-surface]')
  const glintTimer = window.setTimeout(() => topCard && glint(topCard), landed * 1000)
  const doneTimer = window.setTimeout(() => finish(), (landed + duration.glint) * 1000)

  function finish() {
    if (finished) return
    finished = true
    clearTimeout(glintTimer)
    clearTimeout(doneTimer)
    for (const c of controls) c.complete()
    onDone()
  }

  return {
    /** Jump to the end state (tap, scroll, key or "Skip intro"). */
    skip() {
      if (finished) return
      stopGlint()
      finish()
    },
  }
}
