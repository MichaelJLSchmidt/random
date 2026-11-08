import { gapFor, msFor, pending } from './choreography'
import { drawCards, fadeCards, fanCards } from './deal'
import { type JobContext, completeAll, schedule } from './jobs'
import { type Kind, fade, runKind, title } from './kinds'
import { INTRO_DONE, INTRO_KEY } from './preferences'
import { dur, stagger } from './tokens'
import { readTier } from './use-tier'

/*
 * Home, first visit in the session (<FirstLoadSequence>; times in ms, full tier):
 *     0   the four hand cards are dealt (80 apart, 420 each: in the hand by 660)
 *   520   the title's words turn up (70 apart) with the opsz / wght settle
 *   900   the role line (first block after the title)
 *  1000   the intro lines (second block after the title)
 *  1300   the divider (rule) and the rest in document order (50 apart),
 *         then the chrome ([data-chrome]: header, card counter)
 * Calm: every time × 0.6 and the hand fades in. Reduced: everything at once,
 * 160 ms opacity. Any key, click, wheel or scroll completes it.
 *
 * Revisit (same session) or a client navigation back to home: every part
 * crossfades, the title at 0 and the rest 60 ms later, 240 ms each (all
 * visible by 300 ms).
 */
/** b follows a in the document (Node is read at call time: this module is also evaluated on the server). */
const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

export type FirstLoadBlock = { el: HTMLElement; kind: Kind; order: number | null; delay: number }

/** The short crossfade for revisits and client navigations to home. */
export function revisit(h1: HTMLElement | null, blocks: FirstLoadBlock[]) {
  // All parts start in this frame (the rest held by an animation delay), so the 300 ms is exact.
  const later = gapFor(readTier(), stagger.lines)
  if (h1) schedule(h1, 0, (ctx) => fade(ctx, h1, 's'))
  for (const { el } of blocks) schedule(el, 0, (ctx) => fade(ctx, el, 's', later))
}

/** The first-visit sequence (with no [data-first-load] on the page: the hand and the chrome only). Returns the skip. */
export function firstVisit(h1: HTMLElement | null, blocks: FirstLoadBlock[]) {
  const root = document.documentElement
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    // Storage blocked: the intro may play again on the next home visit.
  }
  const tier = readTier()
  const at = (s: number) => gapFor(tier, s)
  const F = pending.firstLoad

  const cards = fanCards()
  if (tier === 'full') drawCards(cards, 0)
  else fadeCards(cards, msFor(tier, 'm'), at(stagger.cards))

  if (h1) schedule(h1, at(F.title), (ctx) => title(ctx, h1))

  // After the title: the first block is the role line, the second the intro; rules are the divider.
  const after = blocks.filter((b) => !h1 || follows(h1, b.el))
  const sorted = [...after].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
  const rest: FirstLoadBlock[] = blocks.filter((b) => !after.includes(b))
  let slot = 0
  for (const b of sorted) {
    const run = (ctx: JobContext) => runKind(b.kind, ctx, b.el)
    if (b.kind === 'rule') schedule(b.el, at(F.rest) + b.delay, run)
    else if (slot === 0 && b.kind !== 'note') {
      schedule(b.el, at(F.role) + b.delay, run)
      slot++
    } else if (slot === 1 && b.kind !== 'note') {
      schedule(b.el, at(F.intro) + b.delay, run)
      slot++
    } else rest.push(b)
  }
  rest.sort((a, b) => (follows(a.el, b.el) ? -1 : 1))
  rest.forEach((b, i) =>
    schedule(b.el, at(F.rest + (i + 1) * stagger.items) + b.delay, (ctx) => runKind(b.kind, ctx, b.el)),
  )
  const chrome = [...document.querySelectorAll<HTMLElement>('[data-chrome]')]
  const chromeAt = F.rest + (rest.length + 1) * stagger.items
  chrome.forEach((el, i) => schedule(el, at(chromeAt + i * stagger.items), (ctx) => fade(ctx, el, 's')))
  const total = at(chromeAt + chrome.length * stagger.items + dur.s)

  let finished = false
  const events = ['keydown', 'pointerdown', 'wheel', 'touchmove', 'scroll'] as const
  const finish = () => {
    if (finished) return
    finished = true
    window.clearTimeout(timer)
    for (const type of events) removeEventListener(type, skip, true)
    delete root.dataset.intro
    dispatchEvent(new Event(INTRO_DONE))
  }
  const skip = () => {
    completeAll()
    for (const card of document.querySelectorAll<HTMLElement>('.hand-card')) {
      for (const a of card.getAnimations()) a.finish()
    }
    finish()
  }
  const timer = window.setTimeout(finish, total + msFor(tier, 'm'))
  for (const type of events) addEventListener(type, skip, { capture: true, passive: true })
  document.querySelector<HTMLButtonElement>('[data-intro-skip]')?.addEventListener('click', skip, { once: true })
  return skip
}
