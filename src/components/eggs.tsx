'use client'

import { useEffect } from 'react'

/*
 * Wires the easter eggs (src/eggs/registry.ts): keyboard shortcuts load when
 * the browser is idle; each egg's code loads the first time it fires. The
 * Mulligan is handled by the hand itself.
 */
export function Eggs() {
  useEffect(() => {
    let stopKeys: (() => void) | undefined
    let cancelled = false
    const start = () =>
      import('@/eggs/keys').then(({ startKeys }) => {
        if (!cancelled) stopKeys = startKeys()
      })
    const hasIdle = 'requestIdleCallback' in window
    const idle = hasIdle ? requestIdleCallback(start) : window.setTimeout(start, 400)

    const handlers: [string, (event: Event) => void][] = [
      ['egg:workshop', () => import('@/eggs/workshop').then((m) => m.drawWorkshop())],
      ['egg:tap', (event) => import('@/eggs/tap').then((m) => m.tap((event as CustomEvent<Element | null>).detail))],
      ['egg:shortcuts', () => import('@/eggs/shortcuts').then((m) => m.showShortcuts())],
      ['egg:shuffle', () => import('@/eggs/shuffle').then((m) => m.shuffleAll())],
    ]
    for (const [type, handler] of handlers) addEventListener(type, handler)
    return () => {
      cancelled = true
      if (hasIdle) cancelIdleCallback(idle)
      else clearTimeout(idle)
      stopKeys?.()
      for (const [type, handler] of handlers) removeEventListener(type, handler)
    }
  }, [])
  return null
}
