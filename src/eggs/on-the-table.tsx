'use client'

import { useState } from 'react'
import { announce } from '@/components/live-region'
import { about, fill } from '@/lib/content'

/** About, "What's on the table": three face-down cards named after games; a tap turns one to a line. */
export function OnTheTable() {
  const { label, cards, flipped } = about.table
  const [open, setOpen] = useState<boolean[]>(() => cards.map(() => false))
  return (
    <section className="on-table" aria-labelledby="on-table-title">
      <h2 id="on-table-title" className="meta">
        {label}
      </h2>
      <ul className="on-table-list">
        {cards.map((card, i) => (
          <li key={card.name}>
            <button
              type="button"
              className="on-table-card"
              aria-pressed={open[i]}
              data-open={open[i] ? '' : undefined}
              onClick={() => {
                setOpen((o) => o.map((v, k) => (k === i ? !v : v)))
                if (!open[i]) announce(fill(flipped, { name: card.name, line: card.line }))
              }}
            >
              <span className="on-table-back">{card.name}</span>
              <span className="on-table-front">
                <span className="on-table-name">{card.name}</span>
                <span className="on-table-line">{card.line}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
