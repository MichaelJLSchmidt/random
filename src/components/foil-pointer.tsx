'use client'

import { useEffect } from 'react'

/*
 * Writes the pointer position over a [data-foil-surface] element to its
 * --foil-x / --foil-y custom properties (0..1), once per frame. No React state.
 * Full tier and fine, hovering pointers only; leaving the card recentres it.
 */
export function FoilPointer() {
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let frame = 0
    let surface: HTMLElement | null = null
    let x = 0.5
    let y = 0.5

    const reset = (el: HTMLElement) => {
      el.style.removeProperty('--foil-x')
      el.style.removeProperty('--foil-y')
    }
    const write = () => {
      frame = 0
      surface?.style.setProperty('--foil-x', x.toFixed(3))
      surface?.style.setProperty('--foil-y', y.toFixed(3))
    }
    const onMove = (event: PointerEvent) => {
      const next =
        document.documentElement.dataset.motion === 'full'
          ? ((event.target as Element | null)?.closest?.<HTMLElement>('[data-foil-surface]') ?? null)
          : null
      if (surface && surface !== next) reset(surface)
      surface = next
      if (!surface) return
      const rect = surface.getBoundingClientRect()
      x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
      y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
      if (!frame) frame = requestAnimationFrame(write)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
