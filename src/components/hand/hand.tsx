'use client'

import Link from 'next/link'
import { handCards, handLabels } from '@/lib/cards'

/** The hand: four cards as the primary navigation (basic version). */
export function Hand() {
  return (
    <nav aria-label={handLabels.nav} className="hand-basic">
      <ul>
        {handCards.map((card) => (
          <li key={card.id}>
            <Link href={card.href}>{card.title}</Link>
          </li>
        ))}
      </ul>
      <Link href="/projects">{handLabels.moreProjects}</Link>
    </nav>
  )
}
