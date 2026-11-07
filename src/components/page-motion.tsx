'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { INTRO_KEY } from '@/motion/preferences'
import { duration, stagger, tiers } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'

const SKIP_EVENTS = ['pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'] as const

function remember() {
  try {
    localStorage.setItem(INTRO_KEY, '1')
  } catch {}
}

/*
 * Settles the page <h1> from weight 200 to 760 on every page load and client
 * navigation, and runs the first-visit intro on the home page.
 *   first visit (full): 700 ms weight-in, 45 ms word stagger, plus the deal
 *   return visit / navigation: 500 ms weight-in
 *   calm: weight-in only (shorter)   reduced: 760 from first paint (CSS)
 * During the intro any tap, scroll or key (or "Skip intro") jumps to the end.
 */
export function PageMotion() {
  const pathname = usePathname()
  const initial = useRef(true)

  useEffect(() => {
    const isInitial = initial.current
    initial.current = false
    const root = document.documentElement
    const title = document.querySelector<HTMLElement>('main [data-page-title]')
    const tier = readTier()
    const time = tiers[tier].time
    let cancelled = false
    let skip: (() => void) | null = null

    const settle = (seconds: number, wordStagger: number) => {
      if (!title) return
      title.style.setProperty('--wt-dur', `${seconds}s`)
      title.style.setProperty('--wt-stagger', `${wordStagger}s`)
      title.dataset.settled = ''
    }
    const endIntro = () => {
      root.removeAttribute('data-intro')
      remember()
      for (const type of SKIP_EVENTS) removeEventListener(type, onSkip, true)
      document.removeEventListener('click', onSkipButton)
    }
    const onSkip = () => {
      title?.classList.add('wt-instant')
      if (skip) skip()
      else endIntro()
    }
    const onSkipButton = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest('[data-intro-skip]')) onSkip()
    }

    const introPending = isInitial && root.dataset.intro === 'pending'
    if (introPending) {
      for (const type of SKIP_EVENTS) addEventListener(type, onSkip, { capture: true, passive: true })
      document.addEventListener('click', onSkipButton)
    }

    if (tier === 'reduced') {
      if (title) title.dataset.settled = ''
      if (introPending) endIntro()
      return
    }

    const run = async () => {
      if (isInitial) await document.fonts.ready
      if (cancelled) return
      if (!introPending || root.dataset.intro !== 'pending') {
        settle(duration.weightIn * time, 0)
        return
      }
      const hand = document.querySelector<HTMLElement>('[data-hand]')
      const deck = document.querySelector<HTMLElement>('[data-deck]')
      if (!hand || !deck) {
        settle(duration.weightIn * time, 0)
        endIntro()
        return
      }
      root.dataset.intro = 'playing'
      settle(duration.introTitle * time, stagger.words * time)
      const { playIntro } = await import('@/motion/intro')
      if (cancelled || root.dataset.intro !== 'playing') return
      skip = playIntro({ hand, deck, onDone: endIntro }).skip
    }
    run()

    return () => {
      cancelled = true
    }
  }, [pathname])

  return null
}
