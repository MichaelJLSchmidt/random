'use client'

import * as m from 'motion/react-m'
import { type ReactNode, useId, useState } from 'react'
import { announce } from '@/components/live-region'
import { spring, tween } from '@/motion/tokens'
import { useMotionTier } from '@/motion/use-tier'
import type { Theme } from '@/lib/content'
import { CardFrame } from './card'
import { CardMorph } from './card-morph'
import styles from './layouts.module.css'

type Props = {
  slug: string
  tint?: Theme
  front: ReactNode
  back: ReactNode
  /** Shown instead of the flip when JavaScript is off. */
  noScript: ReactNode
  labels: { toBack: string; toFront: string; showingBack: string; showingFront: string }
}

/*
 * Flip between two faces with a button.
 *   full:    3D turn on the Y axis (spring)
 *   calm:    cross-fade, no rotation
 *   reduced: instant swap
 * The hidden face is inert and aria-hidden. Without JavaScript the back face's
 * content is rendered in <noscript> below the card instead.
 */
export function FlipCard({ slug, tint, front, back, noScript, labels }: Props) {
  const [flipped, setFlipped] = useState(false)
  const tier = useMotionTier()
  const id = useId()

  const turn = tier === 'full'
  const fade = tier === 'calm' ? tween('calm', 'base') : { duration: 0 }

  const toggle = () => {
    const next = !flipped
    setFlipped(next)
    navigator.vibrate?.(8)
    announce(next ? labels.showingBack : labels.showingFront)
  }

  return (
    <div className={styles.flip}>
      <CardMorph slug={slug}>
        <CardFrame tint={tint}>
          <m.div
            id={id}
            className={styles.flipInner}
            initial={false}
            animate={{ rotateY: turn && flipped ? 180 : 0 }}
            transition={turn ? spring.flip : { duration: 0 }}
          >
            <m.div
              initial={false}
              animate={{ opacity: turn || !flipped ? 1 : 0 }}
              transition={fade}
              className={styles.side}
              inert={flipped}
              aria-hidden={flipped || undefined}
            >
              {front}
            </m.div>
            <m.div
              className={`${styles.side} ${styles.backSide}`}
              initial={false}
              animate={{ opacity: turn || flipped ? 1 : 0 }}
              transition={fade}
              inert={!flipped}
              aria-hidden={!flipped || undefined}
            >
              {back}
            </m.div>
          </m.div>
        </CardFrame>
      </CardMorph>
      <button type="button" className={styles.flipButton} aria-controls={id} onClick={toggle}>
        {flipped ? labels.toFront : labels.toBack}
      </button>
      <noscript>{noScript}</noscript>
    </div>
  )
}
