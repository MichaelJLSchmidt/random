import { animate } from 'motion'
import { announce } from '@/components/live-region'
import { duration, ease, spring, tiers } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'
import site from '@content/site.json'
import { buzz } from './haptics'

/** Tap: turn a card 90° to read the line printed along its long edge; again to untap. */
export function tap(target: Element | null) {
  const wrapper =
    target?.closest<HTMLElement>('[data-draw-lift]') ??
    document.querySelector<HTMLElement>('[data-hand] > li[data-active] [data-draw-lift]') ??
    document.querySelector<HTMLElement>('[data-hand] [data-draw-lift]')
  if (!wrapper) return
  const tapped = !wrapper.hasAttribute('data-tapped')
  wrapper.toggleAttribute('data-tapped', tapped)
  buzz(12)
  const tier = readTier()
  const rotate = tapped ? 90 : 0
  if (tier === 'full') animate(wrapper, { rotate }, spring.flip)
  else if (tier === 'calm')
    animate(wrapper, { rotate }, { duration: duration.base * tiers.calm.time, ease: ease.standard })
  else animate(wrapper, { rotate }, { duration: 0 })
  const line = wrapper.querySelector('[data-tap-line]')?.textContent ?? ''
  announce(tapped ? `${site.eggs.tapped} ${line}` : site.eggs.untapped)
}
