import { headerHeight } from '@/design/layout'
import { buzz } from '@/eggs/haptics'
import { table } from './table-store'
import { at, duration as D, distance, ease, hand as H, spring, springCss } from './tokens'
import { cardForPath } from '@/lib/hand-data'
import { NAV, PLAY, RETURN, SWITCH } from './transitions'

/*
 * Play, return and switch: stage 1 runs here (WAAPI on the hand card), stage 2
 * is the view transition React runs for the navigation.
 *
 *   play     0 ms press (scale 0.97, 90 ms, 8 ms haptic)
 *            90 ms the card lifts to where it will lie on the page, on the play spring
 *            (rotation 0, tilt 0, scale 1.5), siblings close the gap (280 ms)
 *            and the field starts to bloom
 *            430 ms navigate with type "play" (switch: 400 ms, type "switch")
 *   return   the field contracts into the slot; navigate with type "return"
 *
 * Calm and reduced skip the lift and navigate at once; so does a card that is
 * not on screen (the mobile rail) or one tapped in the mobile sheet.
 */
type Navigate = (href: string, types: string[], replace?: boolean) => void

let navigate: Navigate | null = null
let lift: { card: HTMLElement; anims: Animation[]; timers: number[] } | null = null

const playSpring = springCss(spring.play)
const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`

export function registerNavigate(fn: Navigate | null) {
  navigate = fn
}

/**
 * Where the played card will lie on the detail page (centre and size, px):
 * the frame marked [data-hero-target] (D3), measured at play time when it is
 * on screen (a switch from a detail page; the next page shares its layout).
 * Otherwise (playing from home, no hero mounted) the computed fallback, which
 * mirrors --hero-w and the .detail layout in the stylesheets.
 */
export function heroTarget() {
  const frame = document.querySelector('main [data-hero-target]')
  const r = frame?.getBoundingClientRect()
  if (r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight)
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height }
  return fallbackTarget()
}

function fallbackTarget() {
  const vw = innerWidth
  const vh = innerHeight
  const header = headerHeight
  const ratio = 184 / 132
  if (vw >= H.breakpoint) {
    const w = Math.min(Math.max(H.hero.min, vw * H.hero.vw), H.hero.max, (vh - header - 220) / ratio)
    const gutter = Math.min(Math.max(20, vw * 0.05), 48)
    const left = Math.max(0, (vw - 78 * 16) / 2) + gutter
    return { cx: left + w / 2, cy: header + 24 + (w * ratio) / 2, w, h: w * ratio }
  }
  const w = Math.min(vw * H.hero.phoneVw, H.hero.phoneMax)
  return { cx: vw / 2, cy: header + 12 + (w * ratio) / 2, w, h: w * ratio }
}

const onScreen = (el: Element | null) => {
  const r = el?.getBoundingClientRect()
  return r && r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? r : null
}

/** Plays card `id` (from the hand or a "Next project" link). False when it could not take over. */
export function play(id: string, href: string): boolean {
  if (!navigate) return false
  if (lift) return true
  const state = table.get()
  if (state.activeCard === id) return true
  const type = state.activeCard ? SWITCH : PLAY
  const card = document.querySelector<HTMLElement>(`.hand-card[data-play="${CSS.escape(id)}"]`)
  const rect = onScreen(card)

  if (!card || !rect || state.tier !== 'full' || state.sheetOpen) {
    if (rect && state.tier !== 'reduced') buzz(8)
    table.play(id, rect ?? new DOMRect(innerWidth / 2, innerHeight, 0, 0), href)
    navigate(href, [type])
    return true
  }

  buzz(8)
  const cs = getComputedStyle(card)
  const from = {
    translate: cs.translate === 'none' ? '0px 0px' : cs.translate,
    rotate: cs.rotate === 'none' ? '0deg' : cs.rotate,
    scale: cs.scale === 'none' ? '1' : cs.scale.split(' ')[0],
    transform: 'rotateX(0deg)',
  }
  const pressed = { ...from, scale: String(Number(from.scale) * H.pressScale) }
  const slot = card.parentElement!
  const row = slot.closest<HTMLElement>('.hand-row')!
  slot.dataset.lifting = ''
  const anims = [
    card.animate([from, pressed], { duration: D.press * 1000, easing: bezier(ease.outSoft), fill: 'forwards' }),
  ]
  const timers: number[] = []
  lift = { card, anims, timers }

  timers.push(
    window.setTimeout(() => {
      // Lift onto the table where the card will lie (it then zooms to full size
      // in place). The card scales about its bottom centre; keep it on screen.
      const s = slot.getBoundingClientRect()
      const target = heroTarget()
      const tx = target.cx
      const ty = Math.min(target.cy, innerHeight - (card.offsetHeight * H.liftScale) / 2 - 16)
      const dx = tx - (s.left + s.width / 2)
      const dy = ty - (s.top + s.height / 2) + ((H.liftScale - 1) * card.offsetHeight) / 2
      anims.push(
        card.animate(
          [
            pressed,
            { translate: `${dx}px ${dy}px`, rotate: '0deg', scale: String(H.liftScale), transform: 'rotateX(-8deg)' },
          ],
          { duration: playSpring.duration * 1000, easing: playSpring.easing, fill: 'forwards' },
        ),
      )
      // Siblings close the gap.
      const half = (slot.offsetWidth - parseFloat(getComputedStyle(row).getPropertyValue('--overlap'))) / 2
      row.dataset.closing = ''
      let before = true
      for (const other of row.querySelectorAll<HTMLElement>('.hand-slot')) {
        if (other === slot) {
          before = false
          continue
        }
        other.style.setProperty('--gap', `${before ? half : -half}px`)
      }
      // The field blooms from where the card lands.
      const w = card.offsetWidth * H.liftScale
      const h = card.offsetHeight * H.liftScale
      table.play(id, new DOMRect(tx - w / 2, ty - h / 2, w, h), href)
    }, D.press * 1000),
    window.setTimeout(() => navigate?.(href, [type]), (type === SWITCH ? at.switchNavigate : at.navigate) * 1000),
    // The route never changed (offline, error): put the card back.
    window.setTimeout(settleLift, 4000),
  )
  return true
}

/**
 * The route changed (called in a layout effect, inside the view transition's
 * update): drop the lift so the new state shows the ghost in its slot, and let
 * the siblings reopen around it.
 */
export function settleLift() {
  if (!lift) return
  const { card, anims, timers } = lift
  lift = null
  for (const t of timers) clearTimeout(t)
  for (const a of anims) a.cancel()
  const slot = card.parentElement
  if (slot) delete slot.dataset.lifting
  const row = slot?.closest<HTMLElement>('.hand-row')
  if (!row) return
  delete row.dataset.closing
  for (const other of row.querySelectorAll<HTMLElement>('.hand-slot')) other.style.removeProperty('--gap')
}

/** Calls a play off while the card is still lifting (the double-tap egg). False when nothing was lifting. */
export function cancelPlay() {
  if (!lift) return false
  settleLift()
  table.takeIntent()
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  table.route(location.pathname.slice(base.length) || '/', false)
  return true
}

/** Back to the table: the field contracts into the open card's slot, then navigate. */
export function returnHome(href = '/') {
  if (!navigate) return false
  table.returnHome(href)
  navigate(href, [RETURN])
  return true
}

const landSpring = springCss(spring.land)

/** The card lands in its slot after a return (full tier). */
export function land(card: HTMLElement) {
  if (table.get().tier !== 'full') return
  card.animate([{ transform: `translateY(${-distance.landY}px)` }, { transform: 'none' }], {
    duration: landSpring.duration * 1000,
    easing: landSpring.easing,
  })
}

const normalise = (path: string) => path.replace(/\/$/, '') || '/'

/**
 * Browser back / forward: React does not run view transitions for popstate
 * updates, so the history step is taken over (before the router sees it) and
 * replayed as a typed navigation to the same URL: the hero flies back into its
 * slot, a card page zooms in from its slot, a switch cross-fades. Other
 * history entries are left to the router.
 */
export function interceptHistory(current: () => string) {
  const onPop = (e: PopStateEvent) => {
    if (!navigate || !(e.state as { __NA?: boolean } | null)?.__NA) return
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    const to = normalise(location.pathname.slice(base.length))
    const from = current()
    if (to === from) return
    e.stopImmediatePropagation()
    settleLift()
    const fromCard = cardForPath(from)
    const toCard = cardForPath(to)
    let type = NAV
    if (toCard) {
      const [x, y] = table.slotOf(toCard.id) ?? [0.5, 1]
      table.play(toCard.id, new DOMRect(x * innerWidth - 1, y * innerHeight - 1, 2, 2), to)
      type = fromCard ? SWITCH : PLAY
    } else if (fromCard) {
      if (to === '/') table.returnHome(to)
      type = RETURN
    }
    const href = to + location.search + location.hash
    // Outside the popstate event, so React treats it as an ordinary transition.
    window.setTimeout(() => navigate?.(href, [type], true))
  }
  addEventListener('popstate', onPop, true)
  return () => removeEventListener('popstate', onPop, true)
}
