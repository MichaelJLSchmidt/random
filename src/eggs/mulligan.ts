import { announce } from '@/components/live-region'
import { deal, gather, rollRare } from '@/motion/deal'
import { duration, tiers } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'
import site from '@content/site.json'
import { eggs, RARE_CHANCE } from './registry'

let busy = false

function shuffled(order: number[]) {
  let next = order
  while (next.join() === order.join()) {
    next = [...order]
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[next[i], next[j]] = [next[j], next[i]]
    }
  }
  return next
}

type Options = {
  hand: HTMLElement
  deck: HTMLElement
  order: number[]
  reorder: (next: number[]) => Promise<void>
}

/** Mulligan: the hand goes back into the deck, riffles twice and is dealt in a new order. */
export async function mulligan({ hand, deck, order, reorder }: Options) {
  if (busy) return
  busy = true
  const tier = readTier()
  const next = shuffled(order)
  const chance = eggs.rarePull.on ? RARE_CHANCE : 0
  try {
    if (tier === 'full') {
      await gather(hand, deck)
      await reorder(next)
      rollRare(hand, chance)
      await new Promise<void>((done) => deal({ hand, deck, riffles: 2, onDone: done }))
    } else if (tier === 'calm') {
      const ms = duration.base * tiers.calm.time * 1000
      await hand.animate([{ opacity: 1 }, { opacity: 0.35 }], { duration: ms, fill: 'forwards' }).finished
      await reorder(next)
      rollRare(hand, chance)
      await hand.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: ms }).finished
      hand.getAnimations().forEach((a) => a.cancel())
    } else {
      await reorder(next)
      rollRare(hand, chance)
    }
    announce(site.eggs.mulliganDone)
  } finally {
    busy = false
  }
}
