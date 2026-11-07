import { animate, type AnimationPlaybackControls } from 'motion'
import { glint, stopGlint } from './glint'
import { distance, duration, ease, stagger } from './tokens'

/*
 * Dealing the hand from the deck (loaded on demand). Used by the first-visit
 * intro (one riffle cut, then a Glint on the top card) and by the Mulligan
 * (two riffles). Cards travel face down from the deck to their slots 80 ms
 * apart and flip face up as they land. A dealt card may be a rare pull.
 * `finish()` jumps everything to its end state.
 */

type Options = {
  hand: HTMLElement
  deck: HTMLElement
  riffles?: number
  glintTop?: boolean
  onDone?: () => void
}

const slotsOf = (hand: HTMLElement) => [...hand.querySelectorAll<HTMLElement>('[data-card-slot]')]

/** Where the deck is, expressed in each slot's own (possibly rotated) frame. */
function deckDeltas(hand: HTMLElement, deck: HTMLElement) {
  const pile = [...deck.querySelectorAll<HTMLElement>('[data-deck-card]')]
  const top = pile.at(-1) ?? deck
  const deckBox = top.getBoundingClientRect()
  const deckX = deckBox.left + deckBox.width / 2
  const deckY = deckBox.top + deckBox.height / 2
  return slotsOf(hand).map((slot) => {
    slot.style.transform = ''
    const card = slot.querySelector<HTMLElement>('[data-foil-surface]')
    const box = (card ?? slot).getBoundingClientRect()
    const dx = deckX - (box.left + box.width / 2)
    const dy = deckY - (box.top + box.height / 2)
    const m = new DOMMatrix(getComputedStyle(slot.parentElement!).transform)
    const angle = Math.atan2(m.b, m.a)
    return {
      slot,
      flipper: slot.querySelector<HTMLElement>('[data-flipper]'),
      x: dx * Math.cos(-angle) - dy * Math.sin(-angle),
      y: dx * Math.sin(-angle) + dy * Math.cos(-angle),
      rotate: (-angle * 180) / Math.PI,
      // Cards leave the (smaller) deck at its size and grow into the hand.
      scale: card ? top.offsetWidth / card.offsetWidth : 1,
    }
  })
}

/** Rare pull: each dealt card has a 1 in 16 chance of a full-art foil back. */
export function rollRare(hand: HTMLElement, chance: number) {
  hand.querySelectorAll<HTMLElement>('[data-foil-surface]').forEach((card) => {
    card.toggleAttribute('data-rare', Math.random() < chance)
  })
}

export function deal({ hand, deck, riffles = 1, glintTop = false, onDone }: Options) {
  const pile = [...deck.querySelectorAll<HTMLElement>('[data-deck-card]')]
  const deltas = deckDeltas(hand, deck)
  // Park every card on the deck, face down, before the first frame renders.
  for (const { slot, flipper, x, y, rotate, scale } of deltas) {
    slot.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`
    if (flipper) flipper.style.transform = 'rotateY(180deg)'
  }
  const controls: AnimationPlaybackControls[] = []
  let finished = false

  const r = duration.riffle * riffles
  const cut = distance.slide * 0.9
  deltas.forEach(({ slot, flipper, x, y, rotate, scale }, i) => {
    const start = r + i * stagger.deal
    const total = start + duration.deal
    const at = (t: number) => t / total
    // Riffle keyframes: the top half (these cards) swings out and back once per riffle.
    const xs = [x]
    const ys = [y]
    const rs = [rotate]
    const times = [0]
    for (let k = 0; k < riffles; k++) {
      xs.push(x + cut, x)
      ys.push(y - cut / 4, y)
      rs.push(rotate + 4, rotate)
      times.push(at(duration.riffle * (k + 0.5)), at(duration.riffle * (k + 1)))
    }
    xs.push(x, 0)
    ys.push(y, 0)
    rs.push(rotate, 0)
    times.push(at(start), 1)
    controls.push(
      animate(
        slot,
        { x: xs, y: ys, rotate: rs, scale: [...Array(xs.length - 1).fill(scale), 1] },
        { duration: total, times, ease: ease.out },
      ),
    )
    if (flipper) {
      controls.push(
        animate(flipper, { rotateY: [180, 180, 0] }, { duration: total, times: [0, at(start), 1], ease: ease.inOut }),
      )
    }
  })

  // The bottom half of the deck moves the other way during each cut.
  const pileX = [0, ...Array.from({ length: riffles }, () => [-distance.slide * 0.6, 0]).flat()]
  pile.forEach((card) => controls.push(animate(card, { x: pileX }, { duration: r, ease: ease.inOut })))

  const landed = r + (deltas.length - 1) * stagger.deal + duration.deal
  const topCard = deltas.at(-1)?.slot.querySelector<HTMLElement>('[data-foil-surface]')
  const glintTimer = glintTop ? window.setTimeout(() => topCard && glint(topCard), landed * 1000) : 0
  const doneTimer = window.setTimeout(() => finish(), (landed + (glintTop ? duration.glint : 0)) * 1000)

  function finish() {
    if (finished) return
    finished = true
    clearTimeout(glintTimer)
    clearTimeout(doneTimer)
    for (const c of controls) c.complete()
    onDone?.()
  }

  return {
    /** Jump to the end state. */
    skip() {
      if (finished) return
      stopGlint()
      finish()
    },
  }
}

/** The hand goes back into the deck, face down (Mulligan). */
export async function gather(hand: HTMLElement, deck: HTMLElement) {
  const deltas = deckDeltas(hand, deck)
  await Promise.all(
    deltas.map(({ slot, flipper, x, y, rotate, scale }, i) => {
      const delay = (deltas.length - 1 - i) * stagger.deal
      const moves = [animate(slot, { x, y, rotate, scale }, { duration: duration.deal, delay, ease: ease.in })]
      if (flipper) moves.push(animate(flipper, { rotateY: 180 }, { duration: duration.deal, delay, ease: ease.inOut }))
      return Promise.all(moves.map((m) => m.finished))
    }),
  )
}

/** First-visit intro: one riffle cut, the deal, then one Glint on the top card (1.54 s). */
export const playIntro = ({ hand, deck, onDone }: { hand: HTMLElement; deck: HTMLElement; onDone: () => void }) =>
  deal({ hand, deck, riffles: 1, glintTop: true, onDone })
