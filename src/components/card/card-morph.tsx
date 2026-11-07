import { ViewTransition } from 'react'
import { cardName, morphClasses } from '@/motion/transitions'

/** Shared-element boundary for a case-study card (same name on every route). */
export function CardMorph({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <ViewTransition name={cardName(slug)} share={morphClasses(slug)} default="none">
      {children}
    </ViewTransition>
  )
}
