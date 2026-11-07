import { ViewTransition } from 'react'
import { pageClasses } from '@/motion/transitions'

/** Directional enter/exit for a page's content. Put it in each page, not a layout. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={pageClasses} exit={pageClasses} default="none">
      {children}
    </ViewTransition>
  )
}
