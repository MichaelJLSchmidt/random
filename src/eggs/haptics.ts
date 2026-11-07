import { eggs } from './registry'

/** A short vibration inside a gesture handler, where supported (capped at 20 ms). */
export function buzz(ms: number) {
  if (eggs.haptics.on) navigator.vibrate?.(Math.min(ms, 20))
}
