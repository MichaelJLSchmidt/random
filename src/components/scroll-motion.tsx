'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { readTier } from '@/motion/use-tier'

/** Loads the scroll behaviour for each page in the full tier (see src/motion/scroll.ts). */
export function ScrollMotion() {
  const pathname = usePathname()
  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main')
    if (!main || readTier() !== 'full') return
    let stop: (() => void) | undefined
    let cancelled = false
    import('@/motion/scroll').then(({ setupScroll }) => {
      if (!cancelled) stop = setupScroll(main)
    })
    return () => {
      cancelled = true
      stop?.()
    }
  }, [pathname])
  return null
}
