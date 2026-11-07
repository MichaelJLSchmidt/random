'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/*
 * After a client navigation, move focus to the new page's <h1>. When the new
 * page has an element marked data-return-focus="<previous path>" (the card that
 * led to the page we came from), focus that instead.
 */
export function RouteFocus() {
  // Static preview uses trailing slashes; compare without them.
  const pathname = usePathname().replace(/(.)\/$/, '$1')
  const previous = useRef<string | null>(null)

  useEffect(() => {
    const from = previous.current
    previous.current = pathname
    if (from === null || from === pathname) return

    const target =
      document.querySelector<HTMLElement>(`[data-return-focus="${CSS.escape(from)}"]`) ??
      document.querySelector<HTMLElement>('main h1')
    target?.focus({ preventScroll: target.tagName === 'H1' })
  }, [pathname])

  return null
}
