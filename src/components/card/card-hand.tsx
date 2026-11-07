'use client'

import { type MotionValue, useMotionValue, useTransform } from 'motion/react'
import * as m from 'motion/react-m'
import { type CSSProperties, type KeyboardEvent, type ReactNode, useEffect, useRef } from 'react'
import { angle, fan, spring } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'
import styles from './layouts.module.css'

/*
 * The hand. Wide screens: a fan; narrow screens: an overlapping stack (both
 * pure CSS, so first paint and no-JS show the final layout). Touch screens: a
 * swipeable fan. Panning writes a Motion value (`pos`, in cards); each card
 * derives its offset, ±6° peek, scale and stacking from it as CSS variables
 * (no React state). On release it snaps to the nearest card using the
 * release velocity; "1/3" shows the position. Arrow keys move within the hand.
 *   full: spring snap   calm: short tween   reduced: jump
 */
const COARSE = '(hover: none) and (pointer: coarse)'

function FanCard({
  pos,
  index,
  count,
  children,
}: {
  pos: MotionValue<number>
  index: number
  count: number
  children: ReactNode
}) {
  const offset = useTransform(pos, (p) => index - p)
  const x = useTransform(offset, (o) => o * fan.spread)
  const r = useTransform(offset, (o) => Math.max(-1, Math.min(1, o)) * angle.fanPeek)
  const s = useTransform(offset, (o) => 1 - fan.scaleStep * Math.min(Math.abs(o), 1))
  const z = useTransform(offset, (o) => count - Math.round(Math.abs(o) * 2))
  const stat = index - (count - 1) / 2
  return (
    <m.li
      style={
        { '--offset': stat, '--lift': Math.abs(stat), '--fan-x': x, '--fan-r': r, '--fan-s': s, '--fan-z': z } as never
      }
      data-index={index}
    >
      <div className={styles.slot} data-card-slot="">
        <div className={styles.fan}>
          <div className={styles.lift}>{children}</div>
        </div>
      </div>
    </m.li>
  )
}

export function CardHand({
  items,
  labelledBy,
  positionLabel,
}: {
  items: ReactNode[]
  labelledBy?: string
  positionLabel?: string
}) {
  const list = useRef<HTMLOListElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const pos = useMotionValue(0)
  const pan = useRef<{ start: number } | null>(null)
  const settling = useRef<{ stop: () => void } | null>(null)
  const total = items.length

  const isFan = () => matchMedia(COARSE).matches
  const step = () => (list.current?.querySelector<HTMLElement>('[data-foil-surface]')?.offsetWidth ?? 300) * fan.spread

  const snap = async (target: number) => {
    const to = Math.max(0, Math.min(total - 1, target))
    if (to !== Math.round(pos.get())) navigator.vibrate?.(8)
    settling.current?.stop()
    const tier = readTier()
    if (tier === 'reduced') return pos.set(to)
    const { animate } = await import('motion')
    settling.current = animate(pos, to, tier === 'full' ? spring.snappy : { duration: 0.2, ease: 'easeOut' })
  }

  useEffect(() => {
    const el = list.current
    if (!el) return
    const media = matchMedia(COARSE)
    const sync = () => (media.matches ? el.setAttribute('data-fan', '') : el.removeAttribute('data-fan'))
    sync()
    media.addEventListener('change', sync)
    const mark = (value: number) => {
      const active = Math.round(value)
      if (count.current) count.current.textContent = String(active + 1)
      el.querySelectorAll<HTMLElement>(':scope > li').forEach((li, i) =>
        li.toggleAttribute('data-active', i === active),
      )
    }
    mark(pos.get())
    const off = pos.on('change', mark)
    return () => {
      media.removeEventListener('change', sync)
      off()
    }
  }, [pos])

  const links = () => [...(list.current?.querySelectorAll<HTMLAnchorElement>(':scope > li a') ?? [])]

  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    const all = links()
    const current = all.findIndex((a) => a === document.activeElement)
    if (current === -1) return
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? current + 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? current - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? total - 1
              : null
    if (next === null) return
    event.preventDefault()
    const target = Math.max(0, Math.min(total - 1, next))
    all[target]?.focus()
  }

  return (
    <div className={styles.handWrap}>
      <m.ol
        ref={list}
        className={styles.hand}
        aria-labelledby={labelledBy}
        data-hand=""
        onKeyDown={onKeyDown}
        onFocusCapture={(event) => {
          // Keyboard focus brings the card to the centre; a tap's focus must not
          // (the tap itself decides between centring and drawing).
          const target = event.target as Element
          const li = target.closest<HTMLElement>('[data-hand] > li')
          if (li && isFan() && target.matches(':focus-visible')) snap(Number(li.dataset.index))
        }}
        onClickCapture={(event) => {
          if (list.current?.hasAttribute('data-panning')) {
            // The click that ends a swipe is not a tap.
            event.preventDefault()
            event.stopPropagation()
            return
          }
          if (!isFan()) return
          const li = (event.target as Element).closest<HTMLElement>('[data-hand] > li')
          if (!li || li.hasAttribute('data-active')) return
          // A peeking neighbour comes to the centre instead of opening.
          event.preventDefault()
          event.stopPropagation()
          snap(Number(li.dataset.index))
        }}
        onPanStart={() => {
          if (!isFan()) return
          settling.current?.stop()
          pan.current = { start: pos.get() }
          list.current?.setAttribute('data-panning', '')
        }}
        onPan={(_, info) => {
          if (!pan.current) return
          pos.set(Math.max(-0.35, Math.min(total - 0.65, pan.current.start - info.offset.x / step())))
        }}
        onPanEnd={(_, info) => {
          if (!pan.current) return
          pan.current = null
          snap(Math.round(pos.get() - (info.velocity.x / step()) * fan.projection))
          // Let the click that may follow the release pass through as "not a tap".
          setTimeout(() => list.current?.removeAttribute('data-panning'), 0)
        }}
      >
        {items.map((item, i) => (
          <FanCard key={i} pos={pos} index={i} count={total}>
            {item}
          </FanCard>
        ))}
      </m.ol>
      <p className={styles.fanCount} aria-hidden="true" title={positionLabel}>
        <span ref={count}>1</span>/{total}
      </p>
    </div>
  )
}
