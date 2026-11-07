'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { cardForPath } from '@/lib/cards'
import { land } from '@/motion/play'
import { afterTransition } from '@/motion/view-transition'
import { announce } from './live-region'

const normalise = (path: string) => path.replace(/\/$/, '') || '/'

/*
 * After every client navigation, once the view transition has finished:
 *   back on the table from a card page: the card lands in its slot and takes focus
 *   anywhere else: focus the page's <h1> (tabIndex -1)
 * and announce the page title in the polite live region.
 */
export function RouteFocus() {
  const path = normalise(usePathname())
  const previous = useRef<string | null>(null)

  useEffect(() => {
    const from = previous.current
    previous.current = path
    if (from === null || from === path) return
    const left = cardForPath(from)

    afterTransition(() => {
      const h1 = document.querySelector<HTMLElement>('main h1')
      const title = h1?.querySelector('.sr-only')?.textContent ?? h1?.textContent ?? document.title
      if (left && path === '/') {
        const card = document.querySelector<HTMLElement>(`.hand-card[data-play="${CSS.escape(left.id)}"]`)
        if (card && card.getClientRects().length) {
          land(card)
          card.focus({ preventScroll: true })
          announce(title)
          return
        }
      }
      h1?.focus({ preventScroll: true })
      announce(title)
    })
  }, [path])

  return null
}
