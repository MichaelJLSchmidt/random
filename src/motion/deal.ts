import { bezier } from './choreography'
import { dur, ease, stagger } from './tokens'

/*
 * Dealing hand cards from the dealer (off screen, bottom right): the
 * first-visit intro, New hand (Mulligan) and the Coffee card. Each card flies
 * face down and turns face up on the way, 420 ms outExpo, 80 ms apart, so four
 * cards are in the hand by 660 ms.
 */

/** Hand cards currently laid out in the fan (not the ghost of an open card). */
export const fanCards = () =>
  [...document.querySelectorAll<HTMLElement>('.hand-fan .hand-card')].filter(
    (c) => c.getClientRects().length > 0 && !c.hasAttribute('aria-current'),
  )

/** Where cards are dealt from: off screen, bottom right (the dealer's side), relative to a card's slot. */
export function dealOffset(card: HTMLElement) {
  const slot = card.parentElement!.getBoundingClientRect()
  return [
    innerWidth + slot.width - (slot.left + slot.width / 2),
    innerHeight + slot.height * 0.6 - (slot.top + slot.height / 2),
  ]
}

/** Deals `cards` from off screen, starting `start` seconds from now (full tier; callers check). */
export function drawCards(cards: HTMLElement[], start: number) {
  return cards.map((card, i) => {
    const cs = getComputedStyle(card)
    const rest = {
      translate: cs.translate === 'none' ? '0px 0px' : cs.translate,
      rotate: cs.rotate === 'none' ? '0deg' : cs.rotate,
    }
    const [dx, dy] = dealOffset(card)
    card.dataset.drawn = ''
    return card.animate(
      [
        { translate: `${dx}px ${dy}px`, rotate: '28deg', transform: 'perspective(800px) rotateY(180deg)', opacity: 1 },
        { ...rest, transform: 'perspective(800px) rotateY(0deg)', opacity: 1 },
      ],
      {
        duration: dur.m * 1000,
        delay: (start + i * stagger.cards) * 1000,
        easing: bezier(ease.draw),
        fill: 'backwards',
      },
    )
  })
}

/** Calm and reduced: the hand fades in instead of flying (same start, same order). */
export function fadeCards(cards: HTMLElement[], duration: number, gap: number) {
  return cards.map((card, i) => {
    card.dataset.drawn = ''
    return card.animate([{ opacity: 0 }, { opacity: 1 }], { duration, delay: i * gap, fill: 'backwards' })
  })
}
