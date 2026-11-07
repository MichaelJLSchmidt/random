'use client'

import * as m from 'motion/react-m'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { readTier } from '@/motion/use-tier'
import { spring, stagger } from '@/motion/tokens'
import styles from './layouts.module.css'

type Phase = 'rest' | 'deck' | 'gathered'
type Custom = { i: number; offset: number; spread: number; angle: number; step: number }

/*
 * Hand (fan) on wide screens, stack on narrow ones. Both layouts are pure CSS,
 * so first paint, no-JS and the reduced tier show the final arrangement.
 * Entrance (full tier only): if the list is still below the fold after
 * hydration, the cards are gathered into a deck off screen and dealt into
 * place when the list scrolls into view.
 */
const variants = {
  rest: ({ i }: Custom) => ({
    x: '0%',
    y: '0%',
    rotate: 0,
    transition: { ...spring.gentle, delay: i * stagger.cards },
  }),
  deck: ({ offset, spread, angle }: Custom) => ({
    x: `${-offset * spread}%`,
    y: '0%',
    rotate: -offset * angle,
    transition: { duration: 0 },
  }),
  gathered: ({ i, step }: Custom) => ({ x: '0%', y: `${-i * step}%`, rotate: 0, transition: { duration: 0 } }),
}

export function CardHand({ items, labelledBy }: { items: ReactNode[]; labelledBy?: string }) {
  const list = useRef<HTMLOListElement>(null)
  const [phase, setPhase] = useState<Phase>('rest')
  const [layout, setLayout] = useState({ spread: 0, angle: 0, step: 0 })
  const count = items.length

  useEffect(() => {
    const el = list.current
    if (!el || readTier() !== 'full' || el.getBoundingClientRect().top < innerHeight) return
    const css = getComputedStyle(el)
    const spread = parseFloat(css.getPropertyValue('--hand-spread'))
    const angle = parseFloat(css.getPropertyValue('--hand-angle'))
    const overlap = parseFloat(css.getPropertyValue('--stack-overlap'))
    setLayout({ spread, angle, step: (1 - overlap) * 100 })
    setPhase(matchMedia('(min-width: 56rem)').matches ? 'deck' : 'gathered')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        setPhase('rest')
      },
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <ol ref={list} className={styles.hand} aria-labelledby={labelledBy}>
      {items.map((item, i) => {
        const offset = i - (count - 1) / 2
        return (
          <li key={i} style={{ '--offset': offset, '--lift': Math.abs(offset) } as CSSProperties}>
            <m.div
              className={styles.slot}
              custom={{ i, offset, ...layout }}
              variants={variants}
              initial={false}
              animate={phase}
            >
              <div className={styles.lift}>{item}</div>
            </m.div>
          </li>
        )
      })}
    </ol>
  )
}
