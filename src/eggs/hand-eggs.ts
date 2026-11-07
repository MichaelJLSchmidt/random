import { announce } from '@/components/live-region'
import { cardById } from '@/lib/cards'
import { site } from '@/lib/content'
import { deckOffset, drawCards, fanCards } from '@/motion/reveal'
import { table } from '@/motion/table-store'
import { duration as D, ease } from '@/motion/tokens'
import { buzz } from './haptics'
import { eggOn } from './registry'

/*
 * Eggs that live on the hand: Mulligan (deal a new hand), Tap (turn a card
 * sideways to read the line on its long edge), Inspect (2x with a one-line
 * summary). See registry.ts for triggers and tier behaviour.
 */
const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`
let dealing = false

/** Mulligan: the cards go back to the deck and a new hand is dealt (start page only). */
export async function mulligan() {
  if (!eggOn('mulligan') || dealing || table.get().activeCard) return
  const cards = fanCards()
  if (!cards.length) return
  dealing = true
  const tier = table.get().tier
  untapAll()
  if (tier === 'full') {
    await Promise.all(
      cards.map((card, i) => {
        const [dx, dy] = deckOffset(card)
        return card
          .animate(
            [{}, { translate: `${dx}px ${dy}px`, rotate: '28deg', transform: 'perspective(800px) rotateY(180deg)' }],
            { duration: D.exitPlay * 2000, delay: i * 60, easing: bezier(ease.in), fill: 'forwards' },
          )
          .finished.catch(() => {})
      }),
    )
    for (const card of cards) for (const a of card.getAnimations()) a.cancel()
    drawCards(cards, 0)
  } else if (tier === 'calm') {
    await Promise.all(
      cards.map(
        (c) =>
          c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: D.calmReveal * 1000, fill: 'forwards' }).finished,
      ),
    )
    for (const card of cards) {
      for (const a of card.getAnimations()) a.cancel()
      card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: D.calmReveal * 1000 })
    }
  }
  announce(site.eggs.dealt)
  dealing = false
}

/** Tap: turn a card 90 degrees; its long edge carries a line. Untapped on the next navigation. */
export function tap(card: HTMLElement) {
  if (!eggOn('tap') || card.hasAttribute('aria-current')) return
  const id = card.dataset.play
  const tapped = card.hasAttribute('data-tapped')
  untapAll()
  if (tapped) return
  card.dataset.tapped = ''
  const line = card.querySelector('.card-tapline')?.textContent
  if (line) announce(site.eggs.turned.replace('{line}', line))
  if (id) table.hover(null)
}

export function untapAll() {
  for (const el of document.querySelectorAll<HTMLElement>('.hand-card[data-tapped]')) delete el.dataset.tapped
}

/** Inspect: 2x in place with the one-line summary while held. */
export function inspect(card: HTMLElement, on: boolean) {
  if (!eggOn('inspect')) return
  if (!on) {
    delete card.dataset.inspect
    return
  }
  if (card.hasAttribute('aria-current')) return
  card.dataset.inspect = ''
  const id = card.dataset.play
  const line = cardById(id)?.inspect
  if (line) announce(line)
}

/** Rare pull: one hand card gets a single holographic glint (full tier). */
export function rarePull(delay: number) {
  if (!eggOn('rarePull') || table.get().tier !== 'full') return
  window.setTimeout(() => {
    const cards = fanCards()
    const card = cards[Math.floor(Math.random() * cards.length)]
    if (!card) return
    card.dataset.rare = ''
    announce(site.eggs.rare)
    window.setTimeout(() => delete card.dataset.rare, D.glint * 1000 + 100)
  }, delay * 1000)
}

/**
 * Wires hold-Space and long-press (Inspect), T and double tap (Tap) and the
 * deck's long press (Mulligan) on the hand. Returns a cleanup.
 */
export function attachHandEggs(nav: HTMLElement) {
  let spaceTimer = 0
  let spaceCard: HTMLElement | null = null
  let spaceInspecting = false

  const onKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const card = el.closest<HTMLElement>('.hand-card')
    if (e.key === ' ' && el.dataset.roving) {
      e.preventDefault()
      if (e.repeat || spaceCard) return
      spaceCard = el
      spaceInspecting = false
      if (card) {
        spaceTimer = window.setTimeout(() => {
          spaceInspecting = true
          inspect(card, true)
        }, D.inspectHold * 1000)
      }
      return
    }
    if ((e.key === 't' || e.key === 'T') && card) {
      e.preventDefault()
      tap(card)
    }
  }
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key !== ' ' || !spaceCard) return
    e.preventDefault()
    clearTimeout(spaceTimer)
    const el = spaceCard
    spaceCard = null
    if (spaceInspecting) inspect(el, false)
    else el.click()
  }

  // Long press: Inspect on a card (400 ms), Mulligan on the deck (800 ms). Double tap: Tap.
  let pressTimer = 0
  let pressed: HTMLElement | null = null
  let held = false
  let start: [number, number] = [0, 0]
  let lastTap = { card: null as HTMLElement | null, at: 0 }
  const onPointerDown = (e: PointerEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('.hand-card, .hand-deck')
    if (!el || e.button !== 0) return
    held = false
    pressed = el
    start = [e.clientX, e.clientY]
    const deck = el.classList.contains('hand-deck')
    if (deck && !nav.hasAttribute('data-home')) return
    if (!deck && e.pointerType === 'mouse') return
    pressTimer = window.setTimeout(
      () => {
        held = true
        buzz(10)
        if (deck) mulligan()
        else inspect(el, true)
      },
      (deck ? D.longPress : D.inspectHold) * 1000,
    )
  }
  const onPointerMove = (e: PointerEvent) => {
    if (pressed && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 10) clearTimeout(pressTimer)
  }
  const onPointerUp = (e: PointerEvent) => {
    clearTimeout(pressTimer)
    if (pressed && held && pressed.classList.contains('hand-card')) inspect(pressed, false)
    if (pressed && !held && e.pointerType === 'touch' && pressed.classList.contains('hand-card')) {
      const now = performance.now()
      if (lastTap.card === pressed && now - lastTap.at < 350) {
        nav.dispatchEvent(new CustomEvent('egg:double-tap', { detail: pressed }))
        lastTap = { card: null, at: 0 }
      } else lastTap = { card: pressed, at: now }
    }
    pressed = null
  }
  // A long press must not also play the card (or open the deck).
  const onClick = (e: MouseEvent) => {
    if (!held) return
    held = false
    e.preventDefault()
    e.stopPropagation()
  }
  const onContextMenu = (e: Event) => {
    if ((e.target as Element).closest('.hand-card, .hand-deck')) e.preventDefault()
  }

  nav.addEventListener('keydown', onKeyDown)
  nav.addEventListener('keyup', onKeyUp)
  nav.addEventListener('pointerdown', onPointerDown)
  nav.addEventListener('pointermove', onPointerMove)
  nav.addEventListener('pointerup', onPointerUp)
  nav.addEventListener('pointercancel', onPointerUp)
  nav.addEventListener('click', onClick, true)
  nav.addEventListener('contextmenu', onContextMenu)
  return () => {
    clearTimeout(spaceTimer)
    clearTimeout(pressTimer)
    nav.removeEventListener('keydown', onKeyDown)
    nav.removeEventListener('keyup', onKeyUp)
    nav.removeEventListener('pointerdown', onPointerDown)
    nav.removeEventListener('pointermove', onPointerMove)
    nav.removeEventListener('pointerup', onPointerUp)
    nav.removeEventListener('pointercancel', onPointerUp)
    nav.removeEventListener('click', onClick, true)
    nav.removeEventListener('contextmenu', onContextMenu)
  }
}
