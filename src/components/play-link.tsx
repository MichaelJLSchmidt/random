'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { play } from '@/motion/play'

/** A link that plays a hand card (lift, bloom, morph) instead of a plain navigation. */
export function PlayLink({ id, href, ...props }: ComponentProps<typeof Link> & { id: string; href: string }) {
  return (
    <Link
      href={href}
      data-play-link={id}
      {...props}
      onNavigate={(e) => {
        if (play(id, href)) e.preventDefault()
      }}
    />
  )
}
