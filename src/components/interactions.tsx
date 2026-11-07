'use client'

import { useEffect } from 'react'

/** Loads the pointer interaction (hover, touch-hold, title Glint) when the browser is idle. */
export function Interactions() {
  useEffect(() => {
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
