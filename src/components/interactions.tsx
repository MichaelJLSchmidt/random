'use client'

import { useEffect } from 'react'

/** Loads the pointer interaction when the browser is idle, on fine hovering pointers only. */
export function Interactions() {
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let cancelled = false
    let stop: (() => void) | undefined
    const start = () =>
      import('@/interactions/pointer').then(({ startPointer }) => {
        if (!cancelled) stop = startPointer()
      })
    const hasIdle = 'requestIdleCallback' in window
    const idle = hasIdle ? requestIdleCallback(start) : window.setTimeout(start, 300)
    return () => {
      cancelled = true
      if (hasIdle) cancelIdleCallback(idle)
      else clearTimeout(idle)
      stop?.()
    }
  }, [])
  return null
}
