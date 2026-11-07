'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navFade } from '@/motion/transitions'

type Item = { href: string; label: string }

export function NavLinks({ items, className }: { items: Item[]; className?: string }) {
  const pathname = usePathname()
  return (
    <ul className={className}>
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <li key={item.href}>
            <Link href={item.href} transitionTypes={[navFade]} aria-current={current ? 'page' : undefined}>
              <span className="link">{item.label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
