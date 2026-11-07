'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef } from 'react'
import { type RevealKind, revealRoute } from '@/motion/reveal'
import { table } from '@/motion/table-store'

const normalise = (path: string) => path.replace(/\/$/, '') || '/'

/** Runs the reveal system for each route (in a layout effect: before a view transition captures it). */
export function Reveals() {
  const path = normalise(usePathname())
  const first = useRef(true)

  useLayoutEffect(() => {
    let kind: RevealKind
    if (first.current) {
      first.current = false
      const intro = document.documentElement.dataset.intro
      kind = path === '/' ? (intro === 'first' ? 'first' : 'repeat') : 'load'
    } else {
      const intent = table.takeIntent()
      kind = intent === 'return' && path !== '/' ? 'nav' : (intent ?? 'nav')
    }
    return revealRoute(kind)
  }, [path])

  return null
}
