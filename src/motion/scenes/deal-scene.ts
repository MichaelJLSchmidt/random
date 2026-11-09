'use client'

import { cubicBezier, scroll } from 'motion'
import { type RefObject, useLayoutEffect, useState } from 'react'
import { breakpoints, headerHeight } from '@/design/layout'
import { angle, deal as DEAL, distance, ease } from '../tokens'
import { onTierChange, readTier } from '../use-tier'

/*
 * The deal scene: DealRow's four decision cards dealt onto the table as the
 * visitor scrolls (Motion session). Contract: docs/contracts.md#scenes.
 *
 *   const { active } = useDealScene(ref, { cards: 4 })
 *
 * Full tier, from 1024 px, only. The root ([data-scene="deal"]) becomes a
 * sticky stage 180svh tall (deal.stage); the card row pins below the header
 * while Motion's scroll() follows the stage (offset ["start start", "end end"]):
 *
 *   0.0–0.2  card 1 is dealt     cards wait face up as a deck in the last
 *   0.2–0.4  card 2              slot; each one travels to its slot on a
 *   0.4–0.6  card 3              shallow arc, readable all the way, and
 *   0.6–0.8  card 4              lands with a slight tilt
 *   0.8–1.0  settle              the row squares up
 *
 * The cards carry will-change: transform for as long as the scene is mounted
 * (set once, never toggled at the pin boundaries: that re-rasterised them
 * mid-scroll); the background field is never resized by the scene. Reduced, narrow screens, a row taller than the viewport or no
 * JavaScript: nothing is touched and Layout's static row stays (no CSS ever
 * hides the cards). Everything the scene writes is inline and removed again.
 */
export type DealSceneOptions = {
  /** Number of cards in the row (always 4 for decisions). */
  cards: number
}

export type DealSceneState = {
  /** True while the scene runs (the stage is pinned and the cards follow the scroll). */
  active: boolean
}

const idle: DealSceneState = { active: false }
const running: DealSceneState = { active: true }

// The scroll is the clock: each phase eases in and out, so mid-phase is mid-flight.
const easePhase = cubicBezier(...(ease.inOut as unknown as [number, number, number, number]))
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function useDealScene(ref: RefObject<HTMLElement | null>, options: DealSceneOptions): DealSceneState {
  const [active, setActive] = useState(false)
  const count = options.cards

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const wide = matchMedia(`(min-width: ${breakpoints.md}px)`)
    let scene: (() => void) | null = null
    const update = () => {
      const want = wide.matches && readTier() === 'full'
      if (want && !scene) scene = mount(root, count, setActive)
      else if (!want && scene) {
        scene()
        scene = null
      }
    }
    update()
    wide.addEventListener('change', update)
    const offTier = onTierChange(update)
    return () => {
      wide.removeEventListener('change', update)
      offTier()
      scene?.()
    }
  }, [ref, count])

  return active ? running : idle
}

type Slot = { x: number; y: number }

/** Sets the scene up on `root`. Returns its teardown. */
function mount(root: HTMLElement, count: number, setActive: (on: boolean) => void) {
  const cards = [...root.querySelectorAll<HTMLElement>('[data-deal-card]')]
    .sort((a, b) => Number(a.dataset.dealCard) - Number(b.dataset.dealCard))
    .slice(0, count)
  const list = cards[0]?.parentElement
  if (cards.length < 2 || !list || cards.some((c) => c.parentElement !== list)) return () => {}

  const n = cards.length
  const phases = DEAL.phases
  const deal = phases.slice(0, n)
  const settleFrom = phases[n - 1]
  const settleTo = phases[n] ?? 1
  const tilt = cards.map((_, i) => angle.hand[i % angle.hand.length] * DEAL.landTilt)
  const deckTilt = cards.map((_, i) => angle.hand[(n - 1 - i) % angle.hand.length] * DEAL.landTilt)

  let on = false
  let slots: Slot[] = []
  let progress = 0
  let stopScroll: (() => void) | null = null
  let ro: ResizeObserver | null = null

  const render = (p: number) => {
    progress = p
    const last = slots[n - 1]
    const settle = easePhase(clamp01((p - settleFrom) / (settleTo - settleFrom)))
    cards.forEach((card, i) => {
      const from = i === 0 ? 0 : deal[i - 1]
      const t = clamp01((p - from) / (deal[i] - from))
      const e = easePhase(t)
      // The deck: the last slot, each lower card peeking out a little.
      const deckX = last.x - slots[i].x + i * distance.reveal
      const deckY = last.y - slots[i].y + i * distance.reveal
      const arc = Math.sin(Math.PI * e) * distance.hoverLift
      const x = deckX * (1 - e)
      const y = deckY * (1 - e) - arc
      const r = t < 1 ? deckTilt[i] + (tilt[i] - deckTilt[i]) * e : tilt[i] * (1 - settle)
      card.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`
      card.style.rotate = `${r.toFixed(3)}deg`
      // Undealt cards lie face up on the deck, the next card on top: its text is readable from the
      // moment it starts moving.
      card.style.zIndex = String(t < 1 ? n * 2 - i : n - i)
    })
  }

  const clear = () => {
    for (const card of cards) {
      card.style.translate = ''
      card.style.rotate = ''
      card.style.zIndex = ''
    }
  }

  const start = () => {
    on = true
    root.dataset.sceneActive = ''
    root.style.height = `${DEAL.stage}svh`
    root.style.alignContent = 'start'
    list.style.position = 'sticky'
    list.style.alignSelf = 'start'
    stopScroll = scroll((p: number) => render(p), { target: root, offset: ['start start', 'end end'] })
    setActive(true)
  }

  const stop = () => {
    on = false
    stopScroll?.()
    stopScroll = null
    clear()
    delete root.dataset.sceneActive
    root.style.height = ''
    root.style.alignContent = ''
    list.style.position = ''
    list.style.alignSelf = ''
    list.style.top = ''
    setActive(false)
  }

  // Measure the row (natural slots; transforms do not move offsets). A row
  // taller than the space under the header cannot pin: keep the static row.
  const measure = () => {
    const h = list.offsetHeight
    const room = innerHeight - headerHeight
    if (h > room) {
      if (on) stop()
      return
    }
    slots = cards.map((c) => ({ x: c.offsetLeft, y: c.offsetTop }))
    if (!on) start()
    // offsetLeft is relative to the sticky row once it is positioned: measure again after start.
    slots = cards.map((c) => ({ x: c.offsetLeft, y: c.offsetTop }))
    list.style.top = `${headerHeight + (room - h) / 2}px`
    render(progress)
  }

  // One compositor layer per card for the scene's lifetime: promoted once here, released on unmount.
  for (const card of cards) card.style.willChange = 'transform'
  measure()
  ro = new ResizeObserver(() => measure())
  ro.observe(list)
  addEventListener('resize', measure)

  return () => {
    ro?.disconnect()
    removeEventListener('resize', measure)
    if (on) stop()
    for (const card of cards) card.style.willChange = ''
  }
}
