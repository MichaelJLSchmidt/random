import { inView } from 'motion'
import { discard } from '@/eggs/discard'
import { gapFor, pending } from './choreography'
import { type FirstLoadBlock, firstVisit, revisit } from './first-load'
import { completeAll, revealNow, revealed, schedule } from './jobs'
import { type Kind, isHeroImage, runKind, title } from './kinds'
import { linkTimeline, isLinkedTimeline } from './scenes/timeline-scene'
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
 *              document order, so neighbours never share a timing
 *   notes      a margin note waits until its related paragraph has finished
 *
 * Legacy data-reveal presets and data-order groups in the current pages map
 * onto the kinds until the Layout pages replace them (D4).
 */
/** How the route was reached (decides the page order). Element kinds are RevealKind in reveals.tsx. */
export type NavigationKind = 'first' | 'repeat' | 'load' | 'nav' | 'play' | 'switch' | 'return'

type Engine = Kind | 'discard'

/** The kind a block reveals with (legacy presets mapped), or null (not a reveal: breaker, unknown). */
export function kindOf(el: HTMLElement): Engine | null {
  const k = el.dataset.reveal
  switch (k) {
    case 'lines':
    case 'block':
    case 'list':
    case 'image':
    case 'digits':
    case 'rule':
    case 'draw':
    case 'note':
      return k
    // Legacy presets (removed once no page uses them, D4).
    case 'headline':
      return 'title'
    case 'h2':
    case 'paragraph':
    case 'line':
      return 'lines'
    case 'tags':
      return /^(UL|OL|DL)$/.test(el.tagName) ? 'list' : 'block'
    case 'email':
    case 'callout':
    case 'metric':
    case 'row':
      return 'block'
    case 'divider':
      return 'rule'
    case 'discard':
      return 'discard'
    default:
      return null
  }
}

const legacyOrder: Record<string, number> = { title: 0, facts: 0, summary: 0, lines: 1, chrome: 2 }

function orderOf(el: HTMLElement): number | null {
  const own = el.dataset.revealOrder
  if (own !== undefined && own !== '') return Number(own) || 0
  const legacy = el.dataset.order
  return legacy ? (legacyOrder[legacy] ?? 2) : null
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
}

let introSkip: (() => void) | null = null

/** Starts the reveal of one block in `delay` ms (resolving its special cases). */
function start(el: HTMLElement, delay: number, r: Route) {
  const kind = kindOf(el)
  if (!kind || el.hasAttribute('data-revealed')) return
  const tier = readTier()
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
        schedule(el, delay, (ctx) => runKind('note', ctx, el))
      })
      return
    }
  }
  schedule(el, delay, (ctx) => (kind === 'discard' ? discard(ctx, el) : runKind(kind, ctx, el)))
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
  const r: Route = { stops: [], held: new Set(), batch: [], frame: 0, live: true }
  const tier = readTier()
  const handled = new Set<HTMLElement>()
  const all = [...main.querySelectorAll<HTMLElement>('[data-reveal]')]

  // Home: the first-load sequence (the first visit also deals the hand and reveals the chrome).
  const seq = main.querySelector<HTMLElement>('[data-first-load]')
  if (seq || kind === 'first') {
    const h1 = seq?.querySelector<HTMLElement>('h1') ?? null
    const blocks: FirstLoadBlock[] = []
    for (const el of all) {
      if (!seq?.contains(el) || el === h1 || h1?.contains(el)) continue
      const k = kindOf(el)
      handled.add(el)
      if (!k || k === 'title' || k === 'discard') continue
      blocks.push({ el, kind: k, order: orderOf(el), delay: delayOf(el) })
    }
    if (h1) handled.add(h1)
    if (kind === 'first') introSkip = firstVisit(h1, blocks)
    else revisit(h1, blocks)
  }

  // The page title (legacy PageTitle: data-reveal="headline") outside the home sequence.
  const base = kind === 'play' || kind === 'switch' ? D.zoom * pending.zoomLanded : 0
  for (const el of all) {
    if (handled.has(el) || kindOf(el) !== 'title') continue
    handled.add(el)
    if (kind === 'play' || kind === 'switch') revealNow(el)
    else {
      const mode = kind === 'return' || kind === 'repeat' ? 'short' : 'full'
      schedule(el, gapFor(tier, base), (ctx) => title(ctx, el, mode))
    }
  }

  // Ordered blocks in the first viewport: in sequence. Adjacent ones of the same kind and order are nudged apart.
  const ordered = all
    .filter((el) => !handled.has(el) && kindOf(el) && orderOf(el) !== null && inFirstViewport(el))
    .sort((a, b) => orderOf(a)! - orderOf(b)! || byDocument(a, b))
  let prev: HTMLElement | null = null
  let nudge = 0
  for (const el of ordered) {
    handled.add(el)
    const order = orderOf(el)!
    nudge = prev && orderOf(prev) === order && kindOf(prev) === kindOf(el) ? nudge + 1 : 0
    prev = el
    const at = base + (order + 1) * stagger.cards + nudge * stagger.items
    start(el, gapFor(tier, at) + delayOf(el), r)
  }

  // Everything else: once 25% is in view.
  for (const el of all) {
    if (handled.has(el)) continue
    if (el.dataset.reveal === 'breaker') continue
    if (!kindOf(el)) continue
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

  // Full-bleed breakers (legacy statement) lift the field's intensity while in view.
  for (const el of main.querySelectorAll<HTMLElement>('[data-reveal="breaker"]')) {
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

  r.stops.push(minimap(main))

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

/** Minimap (docs/contracts.md#minimap): the tick of the section under the middle of the viewport gets aria-current. */
function minimap(main: HTMLElement) {
  const ticks = [...document.querySelectorAll<HTMLAnchorElement>('[data-minimap-tick]')]
  if (!ticks.length) return () => {}
  const sections = ticks
    .map((t) => main.querySelector<HTMLElement>(`[data-section="${CSS.escape(t.dataset.minimapTick!)}"]`))
    .filter((s): s is HTMLElement => Boolean(s))
  const visible = new Set<Element>()
  const mark = () => {
    const current = sections.filter((s) => visible.has(s)).at(-1)?.dataset.section
    for (const t of ticks) {
      if (t.dataset.minimapTick === current) t.setAttribute('aria-current', 'location')
      else t.removeAttribute('aria-current')
    }
  }
  // A line across the middle of the viewport.
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)
      mark()
    },
    { rootMargin: '-50% 0px -50% 0px' },
  )
  for (const s of sections) io.observe(s)
  return () => io.disconnect()
}
