import { bezier, spanFor } from '@/motion/choreography'
import type { JobContext } from '@/motion/jobs'
import { fade } from '@/motion/kinds'
import { duration as D, angle, distance, ease } from '@/motion/tokens'

/*
 * 404 discard (egg, see registry.ts): a card falls face down into the discard
 * zone and comes to rest at its angle. Full: from above, rotation 0 → rest,
 * 700 ms; calm: a short rise and fade (× 0.6); reduced: a fade.
 */
export function discard(ctx: JobContext, el: HTMLElement) {
  const card =
    el.querySelector<HTMLElement>('.discard-card, [data-discard]') ??
    el.querySelector<SVGElement>('[data-illustration="discarded-card"]') ??
    el
  if (ctx.tier === 'reduced') return fade(ctx, card)
  const duration = spanFor(ctx.tier, D.discard)
  if (ctx.tier === 'calm') {
    ctx.animate(
      card,
      [
        { opacity: 0, translate: `0 ${distance.reveal}px` },
        { opacity: 1, translate: '0 0' },
      ],
      { duration, easing: bezier(ease.outQuint), fill: 'backwards' },
      'transform, opacity',
    )
    return
  }
  const cs = getComputedStyle(card)
  const rest = cs.rotate === 'none' ? '0deg' : cs.rotate
  // A drawing with no resting angle of its own turns in from the discard angle.
  const from = cs.rotate === 'none' ? `${-angle.discard}deg` : '0deg'
  ctx.animate(
    card,
    [
      { opacity: 0, translate: `0 ${-distance.exitPlay * 5}px`, rotate: from },
      { opacity: 1, offset: 0.4 },
      { opacity: 1, translate: '0 0', rotate: rest },
    ],
    { duration, easing: bezier(ease.draw), fill: 'backwards' },
    'transform, opacity',
  )
}
