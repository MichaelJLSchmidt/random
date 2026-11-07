import { animate, stagger as staggerFn } from 'motion'
import { splitText } from 'motion-plus'
import { duration, ease, stagger, tiers, travel, type MotionTier } from './tokens'

/*
 * Heading reveal after a client navigation (loaded on demand).
 *   full:    words rise and fade in, staggered (motion-plus splitText)
 *   calm:    the whole heading fades in, no movement
 *   reduced: nothing (never called)
 */
export function revealText(element: HTMLElement, tier: MotionTier) {
  const { time } = tiers[tier]
  const delay = duration.fast * time
  if (tiers[tier].textReveal === 'fade') {
    return animate(element, { opacity: [0, 1] }, { duration: duration.base * time, ease: ease.out, delay })
  }
  const { words } = splitText(element, { wordClass: 'split-word' })
  element.style.opacity = '1'
  return animate(
    words,
    { opacity: [0, 1], y: [travel(tier, 'rise'), 0] },
    { duration: duration.slow * time, ease: ease.out, delay: staggerFn(stagger.text * time, { startDelay: delay }) },
  )
}
