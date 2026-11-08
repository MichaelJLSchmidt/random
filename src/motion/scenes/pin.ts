/*
 * Pinned scenes tell the background field when they hold the viewport, so it
 * can render at half resolution meanwhile (src/components/background). A
 * count, so overlapping scenes cannot switch it back early.
 */
const listeners = new Set<(pinned: boolean) => void>()
let count = 0

export function setPinned(on: boolean) {
  const before = count > 0
  count = Math.max(0, count + (on ? 1 : -1))
  const after = count > 0
  if (before !== after) for (const fn of listeners) fn(after)
}

export function onPinned(fn: (pinned: boolean) => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const isPinned = () => count > 0
