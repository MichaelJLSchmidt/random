'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cardForPath, site } from '@/lib/hand-data'
import { table } from '@/motion/table-store'
import { NAV, RETURN } from '@/motion/transitions'
import { CalmSwitch } from './calm-switch'
import { ReadingHairline } from './reading-hairline'
import styles from './header.module.css'

/*
 * Persistent header: the home slot at the top left, About and the calm-motion
 * switch at the right, the reading hairline on its bottom edge. 64 px high
 * (--header-h).
 *
 * The home slot is one link to the table. On detail pages (the three case
 * studies and Management) it shows a back arrow and "Back" (the card returns
 * to the hand); everywhere else the wordmark. Between the two it morphs
 * (header.module.css): the mark compresses and fades toward the left edge
 * while the arrow's shaft draws out of it and the label rises from a mask.
 * The mark is treated as one box (scaleX + opacity), never by its letters, so
 * the final SVG logo can replace the text in .mark without touching the morph.
 */
export function Header() {
  const pathname = usePathname()
  const back = Boolean(cardForPath(pathname))
  const current = (href: string) => (pathname.replace(/\/$/, '') === href ? 'page' : undefined)
  return (
    <header className={styles.header} style={{ viewTransitionName: 'site-header' }} data-chrome="">
      <Link
        href="/"
        className={styles.slot}
        data-slot-mode={back ? 'back' : 'mark'}
        aria-label={back ? undefined : site.header.homeLabel}
        transitionTypes={[back ? RETURN : NAV]}
        onNavigate={() => back && table.returnHome('/')}
      >
        <span className={styles.mark} aria-hidden={back || undefined}>
          {site.wordmark}
        </span>
        <span className={styles.back} aria-hidden={!back || undefined}>
          <svg className={styles.arrow} viewBox="0 0 20 12" fill="none" stroke="currentColor" aria-hidden="true">
            <path className={styles.head} d="M6.5 1.5 2 6l4.5 4.5" />
            <path className={styles.shaft} d="M2 6h16.5" />
          </svg>
          <span className={styles.mask}>
            <span className={styles.label}>{site.header.back}</span>
          </span>
        </span>
      </Link>
      <div className={styles.end}>
        <nav aria-label="Site" className={styles.nav}>
          <ul>
            <li>
              <Link href="/about" transitionTypes={[NAV]} aria-current={current('/about')}>
                <span className="link">{site.header.about}</span>
              </Link>
            </li>
          </ul>
        </nav>
        <CalmSwitch labels={site.settings} />
      </div>
      <ReadingHairline />
    </header>
  )
}
