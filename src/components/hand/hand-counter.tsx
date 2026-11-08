'use client'

import { useEffect, useRef } from 'react'
import { fill, pad2 } from '@/lib/format'
import { cardById, handCards, handLabels } from '@/lib/hand-data'
import { table } from '@/motion/table-store'

const total = handCards.length
const srText = (card: (typeof handCards)[number]) =>
  fill(handLabels.counter, { n: card.index + 1, total, title: card.title })

/*
 * The card counter (home only): "01 / 04" and the title of the hovered or
 * focused card, in the label token. It follows the table store's hoverCard
 * (pointer hover after the 80 ms intent, keyboard focus), shows the first card
 * when nothing is hovered or focused, and keeps the played card while it lifts.
 * Updates write the DOM directly (no React render). Screen readers hear
 * "Card 2 of 4: Shared Foundations" through aria-live="polite".
 * A long press on it deals a new hand (src/eggs/hand-eggs.ts).
 */
export function HandCounter() {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current!
    const index = el.querySelector<HTMLElement>('[data-counter-index]')!
    const title = el.querySelector<HTMLElement>('[data-counter-title]')!
    const text = el.querySelector<HTMLElement>('[data-counter-text]')!
    const show = (id: string | null) => {
      const card = cardById(id) ?? handCards[0]
      if (el.dataset.card === card.id) return
      el.dataset.card = card.id
      index.textContent = pad2(card.index + 1)
      title.textContent = card.title
      text.textContent = srText(card)
    }
    show(table.get().hoverCard)
    return table.subscribe((s, p) => {
      if (s.hoverCard === p.hoverCard) return
      // Playing clears the hover: keep the played card on the counter while it lifts.
      if (s.hoverCard === null && s.lastPlayed !== p.lastPlayed) show(s.lastPlayed)
      else show(s.hoverCard)
    })
  }, [])

  const first = handCards[0]
  return (
    <p ref={ref} className="hand-counter" aria-live="polite" aria-atomic="true" data-chrome="" data-card={first.id}>
      <span className="hand-counter-index t-label" aria-hidden="true">
        <span data-counter-index="">{pad2(first.index + 1)}</span> / {pad2(total)}
      </span>
      <span className="hand-counter-title t-label" aria-hidden="true" data-counter-title="">
        {first.title}
      </span>
      <span className="sr-only" data-counter-text="">
        {srText(first)}
      </span>
    </p>
  )
}
