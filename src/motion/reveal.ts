import { inView } from 'motion'
import { discard } from '@/eggs/discard'
import { gapFor } from './choreography'
import { type FirstLoadBlock, firstVisit, revisit } from './first-load'
import { completeAll, revealNow, revealed, schedule } from './jobs'
import { type Kind, isHeroImage, runKind } from './kinds'
import { linkTimeline, isLinkedTimeline } from './scenes/timeline-scene'
import { loadSplit } from './split'
import { table } from './table-store'
import { reveal as R, duration as D, stagger } from './tokens'
import { readTier } from './use-tier'

export { dealOffset, drawCards, fanCards } from './deal'

/*
 * The reveal system (docs/contracts.md#reveal). Every <Reveal> renders
 * data-reveal="<kind>" (+ data-reveal-order / data-reveal-delay); CSS
 * (src/styles/reveal.css) only hides armed, unrevealed blocks with opacity 0.
 * This module decides when each block reveals and starts its kind
 * (kinds.ts) as a job (jobs.ts).
 *
 *   home       <FirstLoadSequence>: the first-visit sequence, or a 300 ms
 *              crossfade on revisits and client navigations (first-load.ts)
 *   order      blocks with data-reveal-order in the first viewport play in
 *              sequence: base + 80 ms × (order + 1) + delay, where base is 0,
 *              or the moment the card zoom has mostly landed after a play
 *   on scroll  everything else reveals once 25% is in view (Motion inView,
 *              once); blocks entering in the same frame start 50 ms apart in
 *              document order
 *   neighbours a block revealing with the same kind as the block before it
 *              starts at least 80 ms after it (spaced()), so no two
 *              neighbours share a timing
 *   notes      a margin note waits until its related paragraph has finished
 *   titles     the page h1 (PageTitle: kind "lines", order 0) reveals on direct
 *              loads and client navigations; after a play or switch it is
 *              final at once, because the card → hero morph delivers it
 *   breakers   full-bleed blocks with data-breaker lift the field while in view
 *   discard    on 404 the .lost-card (a draw reveal) falls into the zone
 *
 * The Minimap's aria-current belongs to Layout (MinimapObserver), not here.
 */
/** How the route was reached (decides the page order). Element kinds are RevealKind in reveals.tsx. */
export type NavigationKind = 'first' | 'repeat' | 'load' | 'nav' | 'play' | 'switch' | 'return'

const kinds = new Set<string>(['lines', 'block', 'list', 'image', 'digits', 'rule', 'draw', 'note'])

/** The kind a block reveals with (data-reveal), or null when it is not one of the eight. */
export function kindOf(el: HTMLElement): Kind | null {
  const k = el.dataset.reveal
  return k && kinds.has(k) ? (k as Kind) : null
}

function orderOf(el: HTMLElement): number | null {
  const own = el.dataset.revealOrder
  return own !== undefined && own !== '' ? Number(own) || 0 : null
}

/** data-reveal-delay (ms), scaled like every other offset. */
const delayOf = (el: HTMLElement) => gapFor(readTier(), (Number(el.dataset.revealDelay) || 0) / 1000)

const inFirstViewport = (el: Element) => {
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < innerHeight && (r.width > 0 || r.height > 0)
}

/** b follows a in the document (Node is read at call time: this module is also evaluated on the server). */
const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
const byDocument = (a: Element, b: Element) => (follows(a, b) ? -1 : 1)

/** The paragraph a margin note belongs to: the last block or lines reveal before it in its section. */
function relatedOf(note: HTMLElement): HTMLElement | null {
  const scope = note.closest('[data-section], section, article') ?? note.parentElement
  if (!scope) return null
  const before = [...scope.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
    (el) => el !== note && !el.contains(note) && follows(el, note) && kindOf(el) !== 'note',
  )
  const text = before.filter((el) => ['block', 'lines'].includes(kindOf(el) ?? ''))
  return text.at(-1) ?? before.at(-1) ?? null
}

type Route = {
  stops: (() => void)[]
  held: Set<HTMLElement>
  batch: HTMLElement[]
  frame: number
  live: boolean
  /** The route's reveal blocks in document order (for the adjacency rule). */
  all: HTMLElement[]
  index: Map<HTMLElement, number>
  /** Planned start (performance.now(), ms) of each block's reveal. */
  planned: Map<HTMLElement, number>
}

/**
 * Neighbours never share a timing: a block whose previous block (document
 * order) reveals with the same kind starts at least one deal step (80 ms)
 * after it, whenever both were triggered close together (same frame, the next
 * frame, or the same order). Notes keep their own rule (after their paragraph).
 */
function spaced(el: HTMLElement, kind: string, delay: number, r: Route) {
  const i = r.index.get(el)
  const prev = i ? r.all[i - 1] : undefined
  if (kind === 'note' || !prev || kindOf(prev) !== kind) return delay
  const prevAt = r.planned.get(prev)
  if (prevAt === undefined) return delay
  const now = performance.now()
  const earliest = prevAt + gapFor(readTier(), stagger.cards)
  return now + delay < earliest ? earliest - now : delay
}

let introSkip: (() => void) | null = null

/** Starts the reveal of one block in `delay` ms (resolving its special cases). */
function start(el: HTMLElement, wanted: number, r: Route) {
  const kind = kindOf(el)
  if (!kind || el.hasAttribute('data-revealed')) return
  const tier = readTier()
  const delay = spaced(el, kind, wanted, r)
  r.planned.set(el, performance.now() + delay)
  if (kind === 'image' && isHeroImage(el.querySelector('img'))) return revealNow(el)
  if (kind === 'digits' && tier === 'reduced') return revealNow(el, '')
  if (kind === 'draw' && tier === 'full') {
    const svg = el.querySelector('svg')
    if (isLinkedTimeline(svg)) {
      const unlink = linkTimeline(svg)
      if (unlink) {
        r.stops.push(unlink)
        return revealNow(el, '')
      }
    }
  }
  if (kind === 'note') {
    const related = relatedOf(el)
    // A related paragraph that is not rendered (hidden at this width) never reveals: do not wait for it.
    if (related && related.getClientRects().length > 0) {
      r.held.add(el)
      revealed(related).then(() => {
        if (!r.live || !r.held.delete(el)) return
        r.planned.set(el, performance.now() + delay)
        schedule(el, delay, (ctx) => runKind('note', ctx, el))
      })
      return
    }
  }
  // The 404 egg: the .lost-card (a draw reveal around DiscardedCard) falls into the zone while its strokes draw.
  const falls = kind === 'draw' && el.classList.contains('lost-card')
  schedule(el, delay, (ctx) => {
    if (falls) discard(ctx, el)
    return runKind(kind, ctx, el)
  })
}

function flush(r: Route) {
  r.frame = 0
  const items = r.batch.sort(byDocument)
  r.batch = []
  const gap = gapFor(readTier(), stagger.items)
  items.forEach((el, i) => start(el, i * gap + delayOf(el), r))
}

/** Ends running reveal animations at once (the intro skip). */
export function completeReveals() {
  completeAll()
  for (const card of document.querySelectorAll<HTMLElement>('.hand-card')) {
    for (const a of card.getAnimations()) a.finish()
  }
}

/**
 * Reveals the page in <main> for a navigation of `kind`. Runs in a layout
 * effect, so on play / switch the H1 is final before the view transition
 * captures the new page. Returns the cleanup for the next route.
 */
export function revealRoute(kind: NavigationKind) {
  const root = document.documentElement
  const main = document.getElementById('main')
  if (!main) return () => {}
  introSkip?.()
  introSkip = null
  root.dataset.reveal = 'live'
  const tier = readTier()
  const handled = new Set<HTMLElement>()
  const all = [...main.querySelectorAll<HTMLElement>('[data-reveal]')]
  const r: Route = {
    stops: [],
    held: new Set(),
    batch: [],
    frame: 0,
    live: true,
    all,
    index: new Map(all.map((el, i) => [el, i])),
    planned: new Map(),
  }
  // Fetch splitText now, so the first split (the role line at 900 ms) never waits for the network.
  if (tier !== 'reduced' && all.some((el) => kindOf(el) === 'lines')) void loadSplit()

  // Home: the first-load sequence (the first visit also deals the hand and reveals the chrome).
  const seq = main.querySelector<HTMLElement>('[data-first-load]')
  if (seq || kind === 'first') {
    const h1 = seq?.querySelector<HTMLElement>('h1') ?? null
    const blocks: FirstLoadBlock[] = []
    for (const el of all) {
      if (!seq?.contains(el) || el === h1 || h1?.contains(el)) continue
      const k = kindOf(el)
      handled.add(el)
      if (!k) continue
      blocks.push({ el, kind: k, order: orderOf(el), delay: delayOf(el) })
    }
    if (h1) handled.add(h1)
    if (kind === 'first') introSkip = firstVisit(h1, blocks, (el, delay) => start(el, delay, r))
    else if (seq) revisit(seq, h1, blocks)
  }

  // The page title outside the home sequence: after a play or switch the card → hero morph
  // delivers it, so it is final at once; otherwise it reveals as "lines" in the ordered sequence.
  const morphed = kind === 'play' || kind === 'switch'
  const base = morphed ? D.zoom * R.zoomLanded : 0
  if (morphed)
    for (const el of all) {
      if (handled.has(el) || el.tagName !== 'H1') continue
      handled.add(el)
      revealNow(el)
    }

  // Ordered blocks in the first viewport: in sequence (neighbours of the same kind are spaced by start()).
  const ordered = all
    .filter((el) => !handled.has(el) && kindOf(el) && orderOf(el) !== null && inFirstViewport(el))
    .sort((a, b) => orderOf(a)! - orderOf(b)! || byDocument(a, b))
  for (const el of ordered) {
    handled.add(el)
    start(el, gapFor(tier, base + (orderOf(el)! + 1) * stagger.cards) + delayOf(el), r)
  }

  // Everything else: once 25% is in view.
  for (const el of all) {
    if (handled.has(el) || !kindOf(el)) continue
    const stop = inView(
      el,
      () => {
        stop()
        r.batch.push(el)
        if (!r.frame) r.frame = requestAnimationFrame(() => flush(r))
      },
      { amount: R.amount, margin: R.margin as `${number}px ${number}px ${number}% ${number}px` },
    )
    r.stops.push(stop)
  }

  // Full-bleed breakers (Spread, the problem statement) lift the field's intensity while in view.
  for (const el of main.querySelectorAll<HTMLElement>('[data-breaker]')) {
    r.stops.push(
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
    r.live = false
    for (const stop of r.stops) stop()
    table.setBreaker(false)
    cancelAnimationFrame(r.frame)
    for (const el of r.batch) revealNow(el)
    for (const el of r.held) revealNow(el)
    completeAll()
  }
}
