import { buzz } from '@/eggs/haptics'
import { table } from './table-store'
import { at, duration as D, distance, ease, hand as H, spring, springCss } from './tokens'
import { PLAY, RETURN, SWITCH } from './transitions'

/*
 * Play, return and switch: stage 1 runs here (WAAPI on the hand card), stage 2
 * is the view transition React runs for the navigation.
 *
 *   play     0 ms press (scale 0.97, 90 ms, 8 ms haptic)
 *            90 ms the card lifts to the field's centre left on the play spring
 *            (rotation 0, tilt 0, scale 1.5), siblings close the gap (280 ms)
 *            and the field starts to bloom
 *            430 ms navigate with type "play" (switch: 400 ms, type "switch")
 *   return   the field contracts into the slot; navigate with type "return"
 *
 * Calm and reduced skip the lift and navigate at once; so does a card that is
 * not on screen (the mobile rail) or one tapped in the mobile sheet.
 */
type Navigate = (href: string, types: string[]) => void

let navigate: Navigate | null = null
let lift: { card: HTMLElement; anims: Animation[]; timers: number[] } | null = null

const playSpring = springCss(spring.play)
const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`

export function registerNavigate(fn: Navigate | null) {
  navigate = fn
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
      // Lift to the field's centre left. The card scales about its bottom centre.
      const s = slot.getBoundingClientRect()
      const tx = innerWidth * 0.3
      const ty = innerHeight * 0.46
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
