import { announce } from '@/components/live-region'
import { distance, duration, ease } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'
import site from '@content/site.json'

/** Typing "shuffle": every card on the page riffles once (full tier); always announced. */
export function shuffleAll() {
  if (readTier() === 'full') {
    document.querySelectorAll<HTMLElement>('[data-foil-surface]').forEach((card, i) => {
      const side = i % 2 ? 1 : -1
      card.animate(
        [
          { translate: '0 0', rotate: '0deg' },
          { translate: `${side * distance.nudge * 3}px ${-distance.nudge}px`, rotate: `${side * 5}deg` },
          { translate: `${-side * distance.nudge * 2}px 0`, rotate: `${-side * 3}deg` },
          { translate: '0 0', rotate: '0deg' },
        ],
        { duration: duration.riffle * 2 * 1000, delay: i * 30, easing: `cubic-bezier(${ease.inOut.join(',')})` },
      )
    })
  }
  announce(site.eggs.shuffled)
}
