'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { CardBack, CardFrame } from '@/components/card/card'
import { eggs } from '@/eggs/registry'
import { readTier } from '@/motion/use-tier'

/*
 * 404: a face-down card wobbles once and flips to a blank face.
 *   full: wobble + flip   calm: cross-fade to the blank face   reduced: blank at once
 */
export function NotFoundCard() {
  const flip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = flip.current
    if (!el) return
    const tier = eggs.notFound.on ? readTier() : 'reduced'
    el.dataset.state = tier === 'reduced' ? 'blank' : tier === 'calm' ? 'fade' : 'play'
  }, [])
  return (
    <div className="nf-card" aria-hidden="true">
      <CardFrame>
        <div className="nf-flip" ref={flip}>
          <div className="nf-face nf-blank" />
          <CardBack />
        </div>
      </CardFrame>
    </div>
  )
}

/** "Draw a random page": any page but this one. */
export function RandomPage({ label, routes }: { label: string; routes: string[] }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className="pill"
      onClick={() => router.push(routes[Math.floor(Math.random() * routes.length)], { transitionTypes: ['nav-fade'] })}
    >
      {label}
    </button>
  )
}
