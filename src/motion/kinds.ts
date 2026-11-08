import { bezier, drawFor, gapFor, msFor, spanFor } from './choreography'
import type { JobContext } from './jobs'
import { lineIndexes, loadSplit, splitLines, splitLoaded } from './split'
import { type DurationStep, angle, distance, duration, ease, hand, opsz, reveal, stagger, weight } from './tokens'

/*
 * The reveal kinds (docs/contracts.md#reveal). Each one runs inside a job
 * (jobs.ts): the element is already [data-revealed] (its CSS start state, a
 * plain opacity 0, is gone), so every animation fills backwards to hold its
 * start pose through any per-child delay. End states are the elements' own
 * styles; the job cancels the animations when they finish.
 *
 * Reduced motion: every kind is one opacity crossfade (160 ms), no transform.
 * Calm: durations and staggers × 0.6 (choreography.ts); `lines` splits only
 * h1 / h2, the rest of `lines` reveals as `block`; SVG strokes take 500 ms.
 */
export type Kind = 'lines' | 'block' | 'list' | 'image' | 'digits' | 'rule' | 'draw' | 'note'

const E = { outExpo: bezier(ease.outExpo), outQuint: bezier(ease.outQuint), inOut: bezier(ease.inOut) }
const travel = `${reveal.mask * 100}%`

/**
 * Waits for the real fonts (line breaks are measured with them) and for the
 * splitText chunk, keeping `el` hidden meanwhile: it is already [data-revealed],
 * so without this its final text would paint once and then rise again.
 */
async function splitReady(el: HTMLElement) {
  const fonts = document.fonts
  const ready = splitLoaded()
  if (ready && (!fonts || fonts.status === 'loaded')) return ready
  const previous = el.style.opacity
  el.style.opacity = '0'
  const [plus] = await Promise.all([loadSplit(), fonts?.ready])
  el.style.opacity = previous
  return plus
}

/** Opacity only: the reduced tier's crossfade, the note, the chrome and the short (revisit) reveals. */
export function fade(ctx: JobContext, el: Element, step: DurationStep = 's', delay = 0) {
  ctx.animate(
    el,
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: msFor(ctx.tier, step), delay, easing: E.outQuint, fill: 'backwards' },
    'opacity',
  )
}

/** block: rises 12 px with opacity, 420 ms outQuint. */
export function block(ctx: JobContext, el: Element, delay = 0) {
  if (ctx.tier === 'reduced') return fade(ctx, el)
  ctx.animate(
    el,
    [
      { opacity: 0, translate: `0 ${distance.block}px` },
      { opacity: 1, translate: '0 0' },
    ],
    { duration: msFor(ctx.tier, 'm'), delay, easing: E.outQuint, fill: 'backwards' },
    'transform, opacity',
  )
}

/** lines: split into lines inside clip masks, each rising from 110%, 640 ms outExpo, 60 ms apart. */
export async function lines(ctx: JobContext, el: HTMLElement) {
  if (ctx.tier === 'reduced') return fade(ctx, el)
  const duration = msFor(ctx.tier, 'l')
  const gap = gapFor(ctx.tier, stagger.lines)
  // Build-time split words (WeightText, e.g. section titles): each word has its own mask.
  const words = [...el.querySelectorAll<HTMLElement>('.wt-word > span')]
  if (words.length) {
    const line = lineIndexes(words.map((w) => w.parentElement!))
    words.forEach((w, i) =>
      ctx.animate(
        w,
        [{ translate: `0 ${travel}` }, { translate: '0 0' }],
        { duration, delay: line[i] * gap, easing: E.outExpo, fill: 'backwards' },
        'transform',
      ),
    )
    return
  }
  if (ctx.tier === 'calm' && !/^H[12]$/.test(el.tagName)) return block(ctx, el)
  const plus = await splitReady(el)
  if (ctx.done) return
  const split = splitLines(el, plus)
  if (!split) return block(ctx, el)
  ctx.undo(split.revert)
  split.lines.forEach((line, i) =>
    ctx.animate(
      line,
      [{ translate: `0 ${travel}` }, { translate: '0 0' }],
      { duration, delay: i * gap, easing: E.outExpo, fill: 'backwards' },
      'transform',
    ),
  )
}

/** list: direct children dealt from x −12 px with opacity, 50 ms apart. */
export function list(ctx: JobContext, el: Element) {
  if (ctx.tier === 'reduced') return fade(ctx, el)
  const items = [...el.children].filter((c) => c.getClientRects().length > 0)
  const gap = gapFor(ctx.tier, stagger.items)
  items.forEach((item, i) =>
    ctx.animate(
      item,
      [
        { opacity: 0, translate: `${-distance.list}px 0` },
        { opacity: 1, translate: '0 0' },
      ],
      { duration: msFor(ctx.tier, 'm'), delay: i * gap, easing: E.outQuint, fill: 'backwards' },
      'transform, opacity',
    ),
  )
}

const rootVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** The eager, high-priority image (the view-transition hero): never revealed by motion. */
export const isHeroImage = (img: HTMLImageElement | null) =>
  Boolean(img && (img.getAttribute('fetchpriority') === 'high' || img.getAttribute('loading') === 'eager'))

/** image: the media box opens from inset(10% round 12px) to inset(0 round 4px) while the image settles 1.12 → 1. */
export function image(ctx: JobContext, el: HTMLElement) {
  const img = el.querySelector('img')
  if (!img) return block(ctx, el)
  // The box: the Reveal itself when it holds only the picture, else the picture (or the img).
  let box: HTMLElement = img
  const only = el.childElementCount === 1 && el.firstElementChild!.contains(img)
  if (only || el === img.parentElement) box = el
  else {
    const picture = img.closest('picture')
    if (picture && el.contains(picture) && getComputedStyle(picture).display !== 'inline') box = picture
  }
  const rest = `inset(0% 0% 0% 0% round ${rootVar('--radius-sm') || '0px'})`
  ctx.undo(() => (box.style.clipPath = rest))
  if (ctx.tier === 'reduced') return fade(ctx, el)
  const inset = `${reveal.image.inset * 100}%`
  const options = { duration: msFor(ctx.tier, 'xl'), easing: E.outExpo, fill: 'backwards' as const }
  ctx.animate(
    box,
    [
      { clipPath: `inset(${inset} ${inset} ${inset} ${inset} round ${rootVar('--radius-lg') || '0px'})` },
      { clipPath: rest },
    ],
    options,
    'clip-path',
  )
  ctx.animate(img, [{ scale: String(reveal.image.scale) }, { scale: '1' }], options, 'transform')
}

/**
 * digits: each [data-digit] rolls up a short strip (blank, then the digits
 * before it) into place. One value takes 700 ms from its first strip's start
 * to its last strip's end, strips 40 ms apart; values 50 ms apart. The value
 * for screen readers stays in the DOM (the Scoreboard's sr-only copy); the
 * strips live inside the aria-hidden digits.
 */
export function digits(ctx: JobContext, el: HTMLElement) {
  if (ctx.tier === 'reduced') return
  const values = [...el.querySelectorAll<HTMLElement>('[data-digits]')]
  const groups = values.length ? values : [el]
  const offset = gapFor(ctx.tier, stagger.digits)
  const between = gapFor(ctx.tier, stagger.items)
  groups.forEach((value, j) => {
    const cells = [...value.querySelectorAll<HTMLElement>('[data-digit]')]
    const total = spanFor(ctx.tier, duration.digits)
    const per = Math.max(total - (cells.length - 1) * offset, msFor(ctx.tier, 'm'))
    cells.forEach((cell, k) => {
      const ch = cell.textContent ?? ''
      const h = cell.getBoundingClientRect().height
      if (!ch.trim() || !h) return
      const n = Number(ch)
      const seq =
        Number.isInteger(n) && ch.length === 1
          ? Array.from({ length: reveal.digitRoll - 1 }, (_, i) => String((n - (reveal.digitRoll - 2) + i + 10) % 10))
          : [ch]
      const saved = [...cell.childNodes]
      const style = { position: cell.style.position, overflow: cell.style.overflow, display: cell.style.display }
      const ghost = document.createElement('span')
      ghost.textContent = ch
      ghost.style.visibility = 'hidden'
      const strip = document.createElement('span')
      strip.setAttribute('aria-hidden', 'true')
      strip.style.cssText = 'position:absolute;inset:0 0 auto 0;display:flex;flex-direction:column'
      for (const c of [' ', ...seq]) {
        const s = document.createElement('span')
        s.textContent = c
        s.style.cssText = `display:block;height:${h}px;text-align:center`
        strip.append(s)
      }
      cell.style.position = 'relative'
      cell.style.overflow = 'clip'
      if (getComputedStyle(cell).display === 'inline') cell.style.display = 'inline-block'
      cell.replaceChildren(ghost, strip)
      ctx.undo(() => {
        cell.replaceChildren(...saved)
        Object.assign(cell.style, style)
      })
      ctx.animate(
        strip,
        [{ translate: '0 0' }, { translate: `0 ${-seq.length * h}px` }],
        { duration: per, delay: j * between + k * offset, easing: E.outExpo, fill: 'backwards' },
        'transform',
      )
    })
  })
}

/** rule: a hairline draws from the left, scaleX 0 → 1, 640 ms. */
export function rule(ctx: JobContext, el: HTMLElement) {
  if (ctx.tier === 'reduced') return fade(ctx, el)
  const origin = el.style.transformOrigin
  el.style.transformOrigin = '0 50%'
  ctx.undo(() => (el.style.transformOrigin = origin))
  ctx.animate(
    el,
    [{ scale: '0 1' }, { scale: '1 1' }],
    { duration: msFor(ctx.tier, 'l'), easing: E.inOut, fill: 'backwards' },
    'transform',
  )
}

/** Tint fills (8% of the accent) and labels: they fade with their group instead of drawing. */
const TINTS = '[data-draw-fill]'
const LABELS = '[data-draw-label]'

/** The draw groups of an SVG (data-draw-group, ascending), with their strokes, tint fills and labels. */
export function drawGroups(root: Element) {
  const groupOf = (n: Element) => n.closest('[data-draw-group]')
  const keyOf = (n: Element) => Number(groupOf(n)?.getAttribute('data-draw-group')) || 0
  const strokes = [...root.querySelectorAll<SVGElement>('[data-draw]')]
  const tints = [...root.querySelectorAll<SVGElement>(TINTS)]
  const labels = [...root.querySelectorAll<SVGElement>(LABELS)]
  const keys = [...new Set([...strokes, ...tints, ...labels].map(keyOf))].sort((a, b) => a - b)
  return keys.map((key) => ({
    key,
    strokes: strokes.filter((s) => keyOf(s) === key),
    tints: tints.filter((s) => keyOf(s) === key),
    labels: labels.filter((s) => keyOf(s) === key),
  }))
}

/**
 * draw: every [data-draw] stroke (pathLength="1") draws from dashoffset 1 to
 * 0 over 1200 ms, group by group 120 ms apart. A group's labels
 * ([data-draw-label]) fade in as the group starts, its tint fills
 * ([data-draw-fill]) once its strokes are drawn. Strokes without pathLength
 * fade instead.
 */
export function draw(ctx: JobContext, el: HTMLElement) {
  const groups = drawGroups(el)
  if (!groups.length) return block(ctx, el)
  if (ctx.tier === 'reduced') return fade(ctx, el)
  fade(ctx, el)
  const d = drawFor(ctx.tier)
  const gap = gapFor(ctx.tier, stagger.svgGroups)
  groups.forEach(({ strokes, tints, labels }, gi) => {
    for (const l of labels)
      ctx.animate(
        l,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: msFor(ctx.tier, 'm'), delay: gi * gap, easing: E.outQuint, fill: 'backwards' },
        'opacity',
      )
    for (const s of strokes) {
      if (!s.hasAttribute('pathLength')) {
        ctx.animate(s, [{ opacity: 0 }, { opacity: 1 }], { duration: d, delay: gi * gap, fill: 'backwards' }, 'opacity')
        continue
      }
      const dash = s.style.strokeDasharray
      s.style.strokeDasharray = '1'
      ctx.undo(() => (s.style.strokeDasharray = dash))
      ctx.animate(
        s,
        [{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }],
        { duration: d, delay: gi * gap, easing: E.inOut, fill: 'backwards' },
        'stroke-dashoffset',
      )
    }
    for (const t of tints)
      ctx.animate(
        t,
        // Up to the tint's own opacity (an 8% tint may be set with opacity rather than fill-opacity).
        [{ opacity: 0 }, { opacity: getComputedStyle(t).opacity }],
        { duration: msFor(ctx.tier, 'm'), delay: gi * gap + d, easing: E.outQuint, fill: 'backwards' },
        'opacity',
      )
  })
}

/** note: opacity only, 240 ms (the caller starts it after its related paragraph has finished). */
export function note(ctx: JobContext, el: Element) {
  fade(ctx, el, 's')
}

/**
 * The home title (h1 in <FirstLoadSequence>, first visit): words turn up out
 * of their masks (rise from 110% and rotateX from the word angle, 640 ms
 * outExpo, 70 ms apart) while opsz and wght settle from a lighter, smaller
 * optical size to the final values (900 ms outQuint). Only opsz and wght
 * move, never width; word boxes keep their final size throughout, so
 * nothing reflows. Other page titles reveal as "lines".
 */
export async function title(ctx: JobContext, el: HTMLElement) {
  if (ctx.tier === 'reduced') return fade(ctx, el, 's')
  let words = [...el.querySelectorAll<HTMLElement>('.wt-word > span')]
  if (words.length) {
    // The live word must not widen its reserved cell while its axes move.
    for (const w of words) {
      const contain = w.style.contain
      w.style.contain = 'inline-size'
      ctx.undo(() => (w.style.contain = contain))
    }
  } else {
    const plus = await splitReady(el)
    if (ctx.done) return
    const split = el.childElementCount === 0 ? splitLines(el, plus) : null
    if (!split) return block(ctx, el)
    ctx.undo(split.revert)
    words = [...el.querySelectorAll<HTMLElement>('.rv-word')]
    for (const w of words) {
      w.style.width = `${w.getBoundingClientRect().width}px`
      w.style.transformOrigin = '50% 100%'
    }
  }
  const gap = gapFor(ctx.tier, stagger.words)
  const turn = msFor(ctx.tier, 'l')
  const settle = msFor(ctx.tier, 'xl')
  const p = `perspective(${hand.perspective}px)`
  words.forEach((w, i) => {
    const cs = getComputedStyle(w)
    const finalOpsz = Number(/"opsz"\s+([\d.]+)/.exec(cs.fontVariationSettings)?.[1]) || opsz.end
    const finalWght = Number(cs.fontWeight) || weight.h1
    const delay = i * gap
    ctx.animate(
      w,
      [
        { opacity: 0, transform: `${p} translateY(${travel}) rotateX(${angle.word}deg)` },
        { opacity: 1, transform: `${p} translateY(0) rotateX(0deg)` },
      ],
      { duration: turn, delay, easing: E.outExpo, fill: 'backwards' },
      'transform, opacity',
    )
    ctx.animate(
      w,
      [
        { fontVariationSettings: `"opsz" ${opsz.start}, "wght" ${weight.h1Start}` },
        { fontVariationSettings: `"opsz" ${finalOpsz}, "wght" ${finalWght}` },
      ],
      { duration: settle, delay, easing: E.outQuint, fill: 'backwards' },
    )
  })
}

/** Runs a kind (the dispatcher the engine and the first-load sequence share). */
export function runKind(kind: Kind, ctx: JobContext, el: HTMLElement) {
  switch (kind) {
    case 'lines':
      return lines(ctx, el)
    case 'block':
      return block(ctx, el)
    case 'list':
      return list(ctx, el)
    case 'image':
      return image(ctx, el)
    case 'digits':
      return digits(ctx, el)
    case 'rule':
      return rule(ctx, el)
    case 'draw':
      return draw(ctx, el)
    case 'note':
      return note(ctx, el)
  }
}
