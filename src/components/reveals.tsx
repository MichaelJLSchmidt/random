'use client'

import { usePathname } from 'next/navigation'
import { type CSSProperties, type HTMLAttributes, type ReactNode, createElement, useLayoutEffect, useRef } from 'react'
import { type NavigationKind, revealRoute } from '@/motion/reveal'
import { table } from '@/motion/table-store'

/*
 * Reveals. Owned by the Motion session; contract: docs/contracts.md#reveal.
 *
 *   <Reveals />            mounted once in the root layout: runs the reveal
 *                          system for each route (src/motion/reveal.ts)
 *   <Reveal kind ...>      marks one block for a reveal of `kind`
 *   <FirstLoadSequence>    wraps the home hero for the first-load sequence
 *
 * Both render plain markup: data-reveal / data-reveal-order /
 * data-reveal-delay on the block, data-first-load on the wrapper. The reveal
 * system finds them after each route change. Before it takes over, blocks are
 * hidden only while the pre-paint script has armed the page (reveal.css); the
 * arming is dropped after 4 s, so without JavaScript every page is final.
 */

const normalise = (path: string) => path.replace(/\/$/, '') || '/'

/** Runs the reveal system for each route (in a layout effect: before a view transition captures it). */
export function Reveals() {
  const path = normalise(usePathname())
  const first = useRef(true)

  useLayoutEffect(() => {
    let kind: NavigationKind
    if (first.current) {
      first.current = false
      const intro = document.documentElement.dataset.intro
      kind = path === '/' ? (intro === 'first' ? 'first' : 'repeat') : 'load'
    } else {
      const intent = table.takeIntent()
      kind = intent === 'return' && path !== '/' ? 'nav' : (intent ?? 'nav')
    }
    return revealRoute(kind)
  }, [path])

  return null
}

/** What a block does when it reveals (data-reveal). */
export const revealKinds = ['lines', 'block', 'list', 'image', 'digits', 'rule', 'draw', 'note'] as const
export type RevealKind = (typeof revealKinds)[number]

/** Elements <Reveal> may render as. */
export type RevealTag =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'figure'
  | 'p'
  | 'span'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'dl'
  | 'li'
  | 'blockquote'
  | 'hr'

export type RevealProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** Element to render (default "div"). */
  as?: RevealTag
  kind: RevealKind
  /**
   * Position in the page's first-viewport sequence (0 first; equal orders start
   * together). Omit to reveal on scroll. Written to data-reveal-order.
   */
  order?: number
  /** Extra delay in ms after the block's turn comes. Written to data-reveal-delay. */
  delay?: number
  children?: ReactNode
}

/** Marks a block for a reveal of `kind` (see the file comment). */
export function Reveal({ as = 'div', kind, order, delay, children, ...rest }: RevealProps) {
  return createElement(
    as,
    {
      ...rest,
      'data-reveal': kind,
      'data-reveal-order': order,
      'data-reveal-delay': delay,
    },
    as === 'hr' ? undefined : children,
  )
}

/**
 * Wraps the home hero for the first-load sequence (hand, title, role, intro,
 * divider, the rest, chrome; src/motion/first-load.ts). No layout of its own.
 */
export function FirstLoadSequence({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className} data-first-load="" style={contents}>
      {children}
    </div>
  )
}

const contents: CSSProperties = { display: 'contents' }
