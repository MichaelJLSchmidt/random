'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cardForPath } from '@/lib/cards'
import { site } from '@/lib/content'
import { table } from '@/motion/table-store'
import { NAV, RETURN } from '@/motion/transitions'
import styles from './header.module.css'

/** Persistent header: wordmark (back to the table), Back on detail pages, About, Contact. */
export function Header() {
  const pathname = usePathname()
  const onCard = Boolean(cardForPath(pathname))
  const current = (href: string) => (pathname.replace(/\/$/, '') === href ? 'page' : undefined)
  return (
    <header className={styles.header} style={{ viewTransitionName: 'site-header' }} data-chrome="">
      <Link
        href="/"
        className={styles.wordmark}
        aria-label={site.header.homeLabel}
        transitionTypes={[onCard ? RETURN : NAV]}
        onNavigate={() => onCard && table.returnHome('/')}
      >
        {site.name}
      </Link>
      <nav aria-label="Site" className={styles.nav}>
        <ul>
          {onCard && (
            <li>
              <Link href="/" transitionTypes={[RETURN]} onNavigate={() => table.returnHome('/')}>
                <span className="link">{site.header.back}</span>
              </Link>
            </li>
          )}
          <li>
            <Link href="/about" transitionTypes={[NAV]} aria-current={current('/about')}>
              <span className="link">{site.header.about}</span>
            </Link>
          </li>
          <li>
            <Link href="/contact" transitionTypes={[NAV]} aria-current={current('/contact')}>
              <span className="link">{site.header.contact}</span>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
