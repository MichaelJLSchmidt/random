/*
 * Device orientation → all cards (opt-in). Writes --foil-x / --foil-y on <html>,
 * which every card inherits unless the pointer is over it. Full tier only.
 */
type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

/** Must be called from a user tap (iOS asks for permission here and nowhere else). */
export async function requestOrientation(): Promise<boolean> {
  const Event = window.DeviceOrientationEvent as OrientationEventWithPermission | undefined
  if (!Event) return false
  if (typeof Event.requestPermission !== 'function') return true
  try {
    return (await Event.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

const clamp = (v: number) => Math.min(1, Math.max(0, v))

export function startOrientation() {
  const root = document.documentElement
  let frame = 0
  let x = 0.5
  let y = 0.5
  const clear = () => {
    root.style.removeProperty('--foil-x')
    root.style.removeProperty('--foil-y')
  }
  const write = () => {
    frame = 0
    if (root.dataset.motion !== 'full') return clear()
    root.style.setProperty('--foil-x', x.toFixed(3))
    root.style.setProperty('--foil-y', y.toFixed(3))
  }
  const onOrientation = (event: DeviceOrientationEvent) => {
    if (event.gamma == null || event.beta == null) return
    // gamma: left/right (-90..90); beta: front/back, about 45° when holding a phone.
    x = clamp(0.5 + event.gamma / 90)
    y = clamp(0.5 + (event.beta - 45) / 90)
    if (!frame) frame = requestAnimationFrame(write)
  }
  addEventListener('deviceorientation', onOrientation)
  return () => {
    removeEventListener('deviceorientation', onOrientation)
    cancelAnimationFrame(frame)
    clear()
  }
}
