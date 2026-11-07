'use client'

import { type CSSProperties, useRef } from 'react'
import { buzz } from '@/eggs/haptics'
import { eggs } from '@/eggs/registry'

type Props = { portraitAlt: string; label: string; items: string[] }

/*
 * About: a card edge peeks out behind the portrait. Hovering (fine pointers) or
 * tapping it fans out five face-down cards that flip to short personal items.
 * State is a data attribute on the scene, written directly (no React state).
 *   full: fan + flip, staggered   calm: items fade in face up, in a row
 *   reduced: items shown at once
 */
export function OnTheTable({ portraitAlt, label, items }: Props) {
  const scene = useRef<HTMLDivElement>(null)
  const set = (open: boolean) => {
    const el = scene.current
    if (!el || el.hasAttribute('data-open') === open) return
    el.toggleAttribute('data-open', open)
    el.querySelector('button')?.setAttribute('aria-expanded', String(open))
    const list = el.querySelector('ul')
    list?.toggleAttribute('inert', !open)
    list?.setAttribute('aria-hidden', String(!open))
  }
  const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches

  return (
    <div
      ref={scene}
      className="table-scene"
      onPointerEnter={() => fine() && set(true)}
      onPointerLeave={() => fine() && set(false)}
    >
      {eggs.table.on && (
        <button
          type="button"
          className="table-edge"
          aria-expanded="false"
          aria-controls="table-items"
          onClick={() => {
            buzz(8)
            set(!scene.current?.hasAttribute('data-open'))
          }}
        >
          <span className="sr-only">{label}</span>
        </button>
      )}
      <figure className="portrait">
        <svg viewBox="0 0 240 300" role="img" aria-label={portraitAlt}>
          <rect width="240" height="300" rx="14" fill="var(--grey-100)" />
          <circle cx="120" cy="118" r="54" fill="var(--grey-300)" />
          <path d="M28 300c6-70 46-104 92-104s86 34 92 104z" fill="var(--grey-200)" />
          <path d="M0 230h240" stroke="var(--grey-150)" />
        </svg>
      </figure>
      {eggs.table.on && (
        <ul id="table-items" className="table-cards" aria-label={label} aria-hidden="true" inert>
          {items.map((item, i) => (
            <li key={item} style={{ '--i': i } as CSSProperties}>
              <span className="table-card">
                <span className="table-card-back" aria-hidden="true" />
                <span className="table-card-front">{item}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
