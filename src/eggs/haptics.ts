/** A short vibration inside a gesture handler, where supported (8–10 ms). */
export function buzz(ms: 8 | 9 | 10 = 8) {
  navigator.vibrate?.(ms)
}
