'use client'

import { type CSSProperties, useRef } from 'react'
import { buzz } from '@/eggs/haptics'
import { eggs, trigger } from '@/eggs/registry'
import { CardBack, CardFrame } from './card'
import styles from './layouts.module.css'

const LONG_PRESS = 800
const SWIPE_UP = 40

/*
 * The draw pile beside the hand; the intro and the Mulligan deal from here.
 * It is also a button: tap, swipe up or Enter draws a workshop card; a long
 * press (800 ms) is a Mulligan. Gesture state lives in refs, not React state.
 */
export function DeckPile({ label, hint, count = 4 }: { label: string; hint: string; count?: number }) {
  const press = useRef<{ x: number; y: number; timer: number } | null>(null)
  const handled = useRef(false)
  const interactive = eggs.workshop.on || eggs.mulligan.on

  const cards = Array.from({ length: count }, (_, i) => (
    <div key={i} className={styles.pileCard} data-deck-card="" style={{ '--i': i } as CSSProperties} aria-hidden="true">
      <CardFrame>
        <CardBack />
      </CardFrame>
    </div>
  ))
  if (!interactive)
    return (
      <div className={styles.pile} data-deck="" aria-hidden="true">
        {cards}
      </div>
    )

  const end = () => {
    if (press.current) clearTimeout(press.current.timer)
    press.current = null
  }
  return (
    <>
      <div
        className={`${styles.pile} ${styles.pileButton}`}
        data-deck=""
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-describedby="deck-hint"
        onPointerDown={(event) => {
          handled.current = false
          const timer = window.setTimeout(() => {
            handled.current = true
            buzz(15)
            trigger('mulligan')
          }, LONG_PRESS)
          press.current = { x: event.clientX, y: event.clientY, timer }
        }}
        onPointerMove={(event) => {
          if (!press.current || handled.current) return
          if (press.current.y - event.clientY > SWIPE_UP) {
            handled.current = true
            end()
            trigger('workshop')
          } else if (Math.abs(event.clientX - press.current.x) > SWIPE_UP) end()
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onContextMenu={(event) => event.preventDefault()}
        onClick={() => {
          if (handled.current) return
          trigger('workshop')
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            trigger('workshop')
          }
        }}
      >
        {cards}
      </div>
      <p id="deck-hint" className="sr-only">
        {hint}
      </p>
    </>
  )
}
