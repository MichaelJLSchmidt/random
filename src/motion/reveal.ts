import { inView } from 'motion'
import { INTRO_DONE, INTRO_KEY } from './preferences'
import { table } from './table-store'
import { at, duration as D, ease, reveal as R, stagger as S } from './tokens'
import { readTier } from './use-tier'

/*
 * The reveal system. CSS (src/styles/reveal.css) holds every preset's start
 * state and transition; this module only decides when: it marks elements
 * [data-revealed] with a delay (--rd) and per-child indexes.
 *
 *   page order   the first viewport follows a sequence per navigation kind
 *                (title, then facts / summary / lines, then chrome)
 *   on scroll    everything else reveals once 25% is in view (margin -10%),
 *                batched so only one sequence runs at a time
 *   intro        home, first visit: background from black, the hand drawn
 *                from the deck, title, lines, chrome; any key, click or
 *                scroll completes it
 */
export type RevealKind = 'first' | 'repeat' | 'load' | 'nav' | 'play' | 'switch' | 'return'

const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`
const now = () => performance.now() / 1000

let sequenceEnd = 0
let batch: HTMLElement[] = []
let batchFrame = 0
let introCleanup: (() => void) | null = null

/** Offsets (s) per [data-order] group and navigation kind. */
function orders(kind: RevealKind): Record<string, number> {
  switch (kind) {
    case 'first':
      return { title: at.title, lines: at.lines, chrome: at.chrome }
    case 'repeat':
      return { title: 0, lines: 0.25, chrome: 0.45 }
    case 'return':
      return { title: 0, lines: 0.2, chrome: 0.35 }
    case 'play':
    case 'switch': {
      // After the zoom has mostly landed.
      const base = D.zoom * 0.6
      return {
        title: base,
        facts: base + at.facts,
        summary: base + at.summary,
        lines: base + at.summary,
        chrome: base + at.buttons,
      }
    }
    default:
      return { title: 0, facts: at.facts, summary: at.summary, lines: at.summary, chrome: at.buttons }
  }
}

/** Splits a plain-text paragraph into masked lines (full tier); restored once revealed. */
function splitLines(el: HTMLElement) {
  if (el.dataset.split !== undefined || el.children.length > 0) return 0
  const text = el.textContent ?? ''
  const words = text.split(/(\s+)/)
  el.textContent = ''
  const spans: HTMLSpanElement[] = []
  for (const w of words) {
    if (/^\s+$/.test(w) || !w) {
      el.append(w)
      continue
    }
    const s = document.createElement('span')
    s.textContent = w
    el.append(s)
    spans.push(s)
  }
  const lines: string[][] = []
  let top = Number.NaN
  for (const s of spans) {
    if (s.offsetTop !== top) {
      lines.push([])
      top = s.offsetTop
    }
    lines[lines.length - 1].push(s.textContent!)
  }
  el.textContent = ''
  lines.forEach((words, i) => {
    const line = document.createElement('span')
    line.className = 'rl'
    const inner = document.createElement('span')
    inner.className = 'rl-in'
    inner.style.setProperty('--li', String(Math.min(i, 5)))
    inner.textContent = words.join(' ')
    line.append(inner)
    el.append(line)
  })
  el.dataset.split = ''
  void el.offsetWidth
  // Back to plain text once the last line is in, so it reflows on resize.
  const done =
    (Number.parseFloat(el.style.getPropertyValue('--rd')) || 0) + D.line + Math.min(lines.length, 6) * 0.08 + 0.2
  window.setTimeout(() => {
    if (!el.isConnected) return
    el.textContent = text
    delete el.dataset.split
  }, done * 1000)
  return lines.length
}

/** Marks one element revealed after `delay` seconds (variant: '', 'instant', 'short', 'repeat'). */
function mark(el: HTMLElement, delay: number, variant = '') {
  if (el.hasAttribute('data-revealed')) return
  const preset = el.dataset.reveal
  el.style.setProperty('--rd', `${Math.max(0, delay).toFixed(3)}s`)
  if (preset === 'list' || (preset === 'tags' && /^(UL|OL|DL)$/.test(el.tagName))) {
    ;[...el.children].forEach((c, i) => (c as HTMLElement).style.setProperty('--i', String(i)))
  }
  if (preset === 'metric') {
    const digits = el.querySelectorAll<HTMLElement>('.metric-digit')
    digits.forEach((d, i) => d.style.setProperty('--i', String(i)))
    el.style.setProperty('--label-d', `${delay + digits.length * S.metric + at.label}s`)
  }
  if ((preset === 'paragraph' || preset === 'line') && readTier() === 'full' && variant !== 'instant') splitLines(el)
  el.setAttribute('data-revealed', variant)
}

function flush() {
  batchFrame = 0
  const items = batch.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
  batch = []
  const t = now()
  const base = Math.max(0, sequenceEnd - t)
  let j = 0
  for (const el of items) {
    mark(el, base + j * S.introLines)
    if (el.dataset.reveal !== 'row') j++
  }
  sequenceEnd = t + base + j * S.introLines
}

function queue(el: HTMLElement) {
  batch.push(el)
  if (!batchFrame) batchFrame = requestAnimationFrame(flush)
}

/** Ends running reveal transitions at once (CSS drops them for a frame). */
export function completeReveals() {
  const root = document.documentElement
  root.dataset.revealSkip = ''
  for (const card of document.querySelectorAll<HTMLElement>('.hand-card')) {
    for (const a of card.getAnimations()) a.finish()
  }
  void root.offsetWidth
  requestAnimationFrame(() => requestAnimationFrame(() => delete root.dataset.revealSkip))
  sequenceEnd = now()
}

/** Hand cards currently laid out in the fan (not the ghost of an open card). */
export const fanCards = () =>
  [...document.querySelectorAll<HTMLElement>('.hand-fan .hand-card')].filter(
    (c) => c.getClientRects().length > 0 && !c.hasAttribute('aria-current'),
  )

/** Where the deck sits: off screen, bottom right, relative to a card's slot. */
export function deckOffset(card: HTMLElement) {
  const slot = card.parentElement!.getBoundingClientRect()
  return [
    innerWidth + slot.width - (slot.left + slot.width / 2),
    innerHeight + slot.height * 0.6 - (slot.top + slot.height / 2),
  ]
}

/** Cards are drawn face down from the deck and flip face up mid-flight (620 ms, 110 ms apart). */
export function drawCards(cards: HTMLElement[], start: number) {
  return cards.map((card, i) => {
    const cs = getComputedStyle(card)
    const rest = {
      translate: cs.translate === 'none' ? '0px 0px' : cs.translate,
      rotate: cs.rotate === 'none' ? '0deg' : cs.rotate,
    }
    const [dx, dy] = deckOffset(card)
    card.dataset.drawn = ''
    return card.animate(
      [
        { translate: `${dx}px ${dy}px`, rotate: '28deg', transform: 'perspective(800px) rotateY(180deg)', opacity: 1 },
        { ...rest, transform: 'perspective(800px) rotateY(0deg)', opacity: 1 },
      ],
      { duration: D.draw * 1000, delay: (start + i * S.draw) * 1000, easing: bezier(ease.draw), fill: 'backwards' },
    )
  })
}

/** The first-visit sequence on home. Returns a cleanup that completes it. */
function intro(main: HTMLElement) {
  const root = document.documentElement
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    // Storage blocked: the intro may play again on the next home visit.
  }
  const full = readTier() === 'full'
  const o = orders('first')
  if (full) drawCards(fanCards(), at.draw)
  const chrome = [...document.querySelectorAll<HTMLElement>('[data-chrome], .hand-deck')]
  const links = [...main.querySelectorAll<HTMLElement>('[data-order="chrome"]')]
  ;[...links, ...chrome].forEach((el, i) => mark(el, o.chrome + i * S.tags))
  const total = o.chrome + (links.length + chrome.length) * S.tags + D.tags

  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    window.clearTimeout(timer)
    for (const type of ['keydown', 'pointerdown', 'wheel', 'touchmove'] as const) removeEventListener(type, skip, true)
    removeEventListener('scroll', skip, true)
    delete root.dataset.intro
    dispatchEvent(new Event(INTRO_DONE))
  }
  const skip = () => {
    completeReveals()
    finish()
  }
  const timer = window.setTimeout(finish, (total + 0.2) * 1000)
  for (const type of ['keydown', 'pointerdown', 'wheel', 'touchmove'] as const)
    addEventListener(type, skip, { capture: true, passive: true })
  addEventListener('scroll', skip, { capture: true, passive: true })
  document.querySelector<HTMLButtonElement>('[data-intro-skip]')?.addEventListener('click', skip, { once: true })
  return skip
}

/**
 * Reveals the page in <main> for a navigation of `kind`. Runs in a layout
 * effect, so on play / switch the H1 is final before the view transition
 * captures the new page. Returns the cleanup for the next route.
 */
export function revealRoute(kind: RevealKind) {
  const root = document.documentElement
  const main = document.getElementById('main')
  if (!main) return () => {}
  introCleanup?.()
  introCleanup = null
  root.dataset.reveal = 'live'
  sequenceEnd = now()

  const o = orders(kind)
  const stops: (() => void)[] = []
  const h1 = main.querySelector<HTMLElement>('[data-reveal="headline"]')
  if (h1) {
    const variant =
      kind === 'play' || kind === 'switch' ? 'instant' : kind === 'return' ? 'short' : kind === 'repeat' ? 'repeat' : ''
    mark(h1, variant === 'instant' ? 0 : o.title, variant)
  }

  // Page order: grouped elements in the first viewport follow the sequence.
  const groups = new Map<string, HTMLElement[]>()
  for (const el of main.querySelectorAll<HTMLElement>('[data-reveal][data-order]')) {
    const g = el.dataset.order!
    if (kind === 'first' && g === 'chrome') continue
    groups.set(g, [...(groups.get(g) ?? []), el])
  }
  let last = 0
  for (const [g, els] of groups) {
    const start = o[g] ?? o.chrome ?? 0
    els.forEach((el, i) => {
      if (g === 'lines' && kind === 'first') el.style.setProperty('--stagger-lines', `${S.introLines}s`)
      const step = g === 'lines' ? S.introLines : S.tags
      mark(el, start + i * step)
      last = Math.max(last, start + i * step)
    })
  }
  sequenceEnd = now() + last + 0.1

  if (kind === 'first') introCleanup = intro(main)

  // Everything else: once 25% is in view.
  for (const el of main.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])')) {
    if (el.dataset.reveal === 'breaker') continue
    const stop = inView(
      el,
      () => {
        queue(el)
        stop()
      },
      { amount: R.amount, margin: R.margin as `${number}px ${number}px ${number}% ${number}px` },
    )
    stops.push(stop)
  }

  // Full-bleed breakers lift the field's intensity while in view.
  for (const el of main.querySelectorAll<HTMLElement>('[data-reveal="breaker"]')) {
    stops.push(
      inView(
        el,
        () => {
          table.setBreaker(true)
          return () => table.setBreaker(false)
        },
        { amount: R.amount },
      ),
    )
  }

  return () => {
    for (const stop of stops) stop()
    table.setBreaker(false)
    cancelAnimationFrame(batchFrame)
    batchFrame = 0
    batch = []
  }
}
