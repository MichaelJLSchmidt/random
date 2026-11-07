'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Item = { href: string; label: string }

export function NavLinks({ items, className }: { items: Item[]; className?: string }) {
  const pathname = usePathname()
  return (
    <ul className={className}>
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <li key={item.href}>
            <Link href={item.href} aria-current={current ? 'page' : undefined} className="weight-link" data-text={item.label}>
              <span>{item.label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
