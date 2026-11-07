'use client'

import { useLayoutEffect, useRef } from 'react'
import { isClientNavigation } from '@/motion/navigation-state'
import { readTier } from '@/motion/use-tier'

type Props = { children: string; id?: string; className?: string }

/**
 * Page <h1>. Screen readers get the plain text; the visual copy is aria-hidden
 * so splitText can wrap its words without changing what is announced.
 */
export function RevealHeading({ children, id = 'page-heading', className }: Props) {
  const visual = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = visual.current
    const tier = readTier()
    if (!el || !isClientNavigation() || tier === 'reduced') return
    el.style.opacity = '0' // hidden before paint; revealed by the lazy chunk
    let cancelled = false
    let stop: (() => void) | undefined
    import('@/motion/text-reveal')
      .then(({ revealText }) => {
        if (cancelled) return
        const controls = revealText(el, tier)
        stop = () => controls.stop()
      })
      .catch(() => {
        el.style.opacity = '1'
      })
    return () => {
      cancelled = true
      stop?.()
    }
  }, [])

  return (
    <h1 id={id} className={className} tabIndex={-1}>
      <span className="sr-only">{children}</span>
      <span ref={visual} className="reveal" aria-hidden="true">
        {children}
      </span>
    </h1>
  )
}
