'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navFade, titleType } from '@/motion/transitions'

type Item = { href: string; label: string }

export function NavLinks({ items, className }: { items: Item[]; className?: string }) {
  const pathname = usePathname()
  return (
    <ul className={className}>
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const page = item.href.replace(/^\/|\/$/g, '')
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              transitionTypes={[navFade, titleType(page)]}
              aria-current={current ? 'page' : undefined}
            >
              {/* Morph source while this is not the current page (see view-transitions.css). */}
              <span className="link" data-title-from={current ? undefined : page}>
                {item.label}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
