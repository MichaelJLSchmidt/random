import { glintText } from '@/motion/glint'
import { duration } from '@/motion/tokens'
import { buzz } from '@/eggs/haptics'

/*
 * Pointer → cards and titles (loaded when the browser is idle). No React state:
 * everything is written to CSS variables or data attributes.
 *   Fine pointers: the foil fades in on hover (CSS) and tracks the pointer
 *   inside the card via --foil-x / --foil-y (full tier only). Entering a bold
 *   title's host starts the Glint 80 ms behind the fill sweep.
 *   Touch: holding a card for 350 ms wakes its foil and tracks the finger; the
 *   click that would follow the hold is swallowed so the card does not open.
 */
const HOLD_SLOP = 10

const full = () => document.documentElement.dataset.motion === 'full'

function track(surface: HTMLElement, event: PointerEvent) {
  const rect = surface.getBoundingClientRect()
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
  surface.style.setProperty('--foil-x', x.toFixed(3))
  surface.style.setProperty('--foil-y', y.toFixed(3))
}

function reset(surface: HTMLElement) {
  surface.style.removeProperty('--foil-x')
  surface.style.removeProperty('--foil-y')
  delete surface.dataset.foilActive
}

export function startPointer() {
  let frame = 0
  let hovered: HTMLElement | null = null
  let pending: PointerEvent | null = null
  let hold: { surface: HTMLElement; timer: number; x: number; y: number; active: boolean } | null = null
  let swallowClick = false

  const flush = () => {
    frame = 0
    const surface = hold?.active ? hold.surface : hovered
    if (surface && pending) track(surface, pending)
  }
  const schedule = (event: PointerEvent) => {
    pending = event
    if (!frame) frame = requestAnimationFrame(flush)
  }

  const onMove = (event: PointerEvent) => {
    if (hold) {
      if (!hold.active && Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > HOLD_SLOP) cancelHold()
      else if (hold.active && full()) schedule(event)
      return
    }
    if (event.pointerType !== 'mouse') return
    const next = (event.target as Element | null)?.closest?.<HTMLElement>('[data-foil-surface]') ?? null
    if (hovered && hovered !== next) reset(hovered)
    hovered = next
    if (hovered && full()) schedule(event)
  }

  const onDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') return
    const surface = (event.target as Element | null)?.closest?.<HTMLElement>('[data-foil-surface]')
    if (!surface) return
    const timer = window.setTimeout(() => {
      if (!hold) return
      hold.active = true
      swallowClick = true
      surface.dataset.foilActive = ''
      buzz(10)
      if (full()) track(surface, event)
    }, duration.hold * 1000)
    hold = { surface, timer, x: event.clientX, y: event.clientY, active: false }
  }

  const cancelHold = () => {
    if (!hold) return
    clearTimeout(hold.timer)
    if (hold.active) reset(hold.surface)
    hold = null
  }

  const onClick = (event: MouseEvent) => {
    if (!swallowClick) return
    swallowClick = false
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  // Title fill hosts: the Glint trails the fill sweep (fine pointers only).
  const onOver = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return
    const host = (event.target as Element | null)?.closest?.('a, [data-fill-host]')
    if (!host || host.contains(event.relatedTarget as Node | null)) return
    const copy = host.querySelector<HTMLElement>('.tf [data-glint-text]')
    if (copy) glintText(copy, { delay: duration.glintTrail })
  }

  const onContextMenu = (event: Event) => {
    if (hold?.active) event.preventDefault()
  }

  document.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerdown', onDown, { passive: true })
  document.addEventListener('pointerup', cancelHold, { passive: true })
  document.addEventListener('pointercancel', cancelHold, { passive: true })
  document.addEventListener('pointerover', onOver, { passive: true })
  // On window (capture) so it runs before the draw handler on document.
  window.addEventListener('click', onClick, true)
  document.addEventListener('contextmenu', onContextMenu)
  return () => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerdown', onDown)
    document.removeEventListener('pointerup', cancelHold)
    document.removeEventListener('pointercancel', cancelHold)
    document.removeEventListener('pointerover', onOver)
    window.removeEventListener('click', onClick, true)
    document.removeEventListener('contextmenu', onContextMenu)
    cancelAnimationFrame(frame)
    if (hovered) reset(hovered)
    cancelHold()
  }
}
