'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { markDrawn } from '@/motion/draw-state'
import { glint, stopGlint } from '@/motion/glint'
import { draw, duration, ease } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'

/*
 * Drawing a card (any link marked data-draw): the card lifts (y -24 px,
 * scale 1.04) and the Glint crosses it; only when the lift has finished does
 * the route morph start (router.push with the card's transition types). A
 * second click during the lift cancels it and nothing navigates.
 *   full: lift + Glint, then navigate   calm and reduced: navigate at once
 * Modified clicks (new tab, etc.) are left to the browser.
 */
export function DrawHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let active: { link: HTMLAnchorElement; cancel: () => void } | null = null

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-draw]')
      if (!link) return
      // Swipes, and peeking cards in the touch fan, are handled by the hand.
      if (link.closest('[data-panning]')) return
      const li = link.closest('[data-hand] > li')
      if (li && li.parentElement?.hasAttribute('data-fan') && !li.hasAttribute('data-active')) return

      event.preventDefault()
      event.stopPropagation()
      if (active) {
        active.cancel()
        active = null
        return
      }
      const route = link.dataset.draw!
      const transitionTypes = link.dataset.transitionTypes?.split(' ') ?? []
      const go = () => router.push(route, { transitionTypes })
      if (readTier() !== 'full') return go()

      const wrapper = link.closest<HTMLElement>('[data-draw-lift]') ?? link
      const surface = link.querySelector<HTMLElement>('[data-foil-surface]')
      let cancelled = false
      const entry = {
        link,
        cancel: () => {
          cancelled = true
          stopGlint()
          wrapper.getAnimations().forEach((a) => a.cancel())
          wrapper.style.transform = ''
        },
      }
      active = entry
      navigator.vibrate?.(10)
      if (surface) glint(surface)
      import('motion').then(({ animate }) => {
        if (cancelled) return
        const lift = animate(wrapper, { y: -draw.lift, scale: draw.scale }, { duration: duration.draw, ease: ease.out })
        lift.finished.then(() => {
          if (cancelled || active !== entry) return
          active = null
          markDrawn(route)
          go()
        })
      })
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      active?.cancel()
    }
  }, [router])

  // A lifted card on a page we come back to settles again.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-draw-lift]').forEach((el) => {
      el.getAnimations().forEach((a) => a.cancel())
      el.style.transform = ''
    })
  }, [pathname])

  return null
}
