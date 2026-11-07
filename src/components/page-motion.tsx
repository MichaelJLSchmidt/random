'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { consumeDrawn } from '@/motion/draw-state'
import { glint } from '@/motion/glint'
import { INTRO_KEY } from '@/motion/preferences'
import { duration, ease, stagger, tiers } from '@/motion/tokens'
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
    const drawnHere = consumeDrawn(pathname)

    // Project rows are dealt in after a client navigation (40 ms apart).
    if (!isInitial && tier === 'full') {
      document.querySelectorAll<HTMLElement>('main [data-deal-row]').forEach((row, i) => {
        row.animate(
          [
            { transform: 'translate(-28px, 12px) rotate(-2deg)', opacity: 0.2 },
            { transform: 'none', opacity: 1 },
          ],
          {
            duration: duration.deal * 1000,
            delay: (duration.fast + i * stagger.rows) * 1000,
            easing: `cubic-bezier(${ease.out.join(',')})`,
            fill: 'backwards',
          },
        )
      })
    }

    let heroTimer = 0
    const settle = (seconds: number, wordStagger: number) => {
      if (!title) return
      // A transition needs a rendered before-change style: resolve the words at
      // weight 200 and let a frame paint before settling them.
      title.querySelectorAll('.wt-word').forEach((word) => getComputedStyle(word).getPropertyValue('--wght'))
      title.style.setProperty('--wt-dur', `${seconds}s`)
      title.style.setProperty('--wt-stagger', `${wordStagger}s`)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled) title.dataset.settled = ''
        }),
      )
      // Case studies: one tinted Glint across the hero card once the title has
      // settled, unless the card was just drawn (it already glinted on the way).
      const hero = document.querySelector<HTMLElement>('[data-hero] [data-foil-surface]')
      if (hero && tier === 'full' && !drawnHere) heroTimer = window.setTimeout(() => glint(hero), seconds * 1000)
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
      clearTimeout(heroTimer)
    }
  }, [pathname])

  return null
}
