'use client'

import Link from 'next/link'
import { usePathname, useSelectedLayoutSegment } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { useChrome } from '@/lib/chrome'
import { cardIdForPath } from '@/lib/hand-data'
import { localeHref, localeNames, locales, pagePath } from '@/lib/i18n'
import { withBase } from '@/lib/site'
import { showHeader, watchHeader } from '@/motion/header-scroll'
import { beginLocaleSwitch, rememberLocale } from '@/motion/locale-switch'
import { table } from '@/motion/table-store'
import { LOCALE, NAV, RETURN } from '@/motion/transitions'
import { AmbientToggle } from './ambient-toggle'
import { ReadingHairline } from './reading-hairline'
import styles from './header.module.css'

/*
 * Persistent header: the home slot at the top left; About, the language
 * switcher ("DE · EN") and the pause / play button for the background's
 * ambient motion at the right; the reading hairline on its bottom edge. 64 px
 * high (--header-h).
 *
 * The home slot is one link to the table. On detail pages (the three case
 * studies and Management) it shows a back arrow and "Back" (the card returns
 * to the hand); everywhere else the wordmark. Between the two it morphs
 * (header.module.css): the mark compresses and fades toward the left edge
 * while the arrow's shaft draws out of it and the label rises from a mask.
 * The mark is treated as one box (scaleX + opacity), never by its letters, so
 * the final SVG logo can replace the text in .mark without touching the morph.
 *
 * The language switcher links each language to the same page in it; the
 * active one carries aria-current. Choosing the other stores the choice and
 * switches in place (src/motion/locale-switch.ts: a short cross-fade, the
 * scroll position kept). On the 404 page there is no such page, so the link
 * reloads the address and the 404 page picks the stored language.
 *
 * On pages that scroll, the header leaves after a deliberate scroll down and
 * returns on a scroll up (src/motion/header-scroll.ts); every route change
 * shows it again and starts the watch afresh.
 */
export function Header() {
  const { locale, site, href } = useChrome()
  const pathname = usePathname()
  const path = pagePath(pathname)
  const lost = useSelectedLayoutSegment() === '404'
  const back = Boolean(cardIdForPath(path))
  const current = (page: string) => (path === page ? 'page' : undefined)
  const home = href('/')
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    showHeader()
    return watchHeader(ref.current!)
  }, [pathname])
  return (
    <header ref={ref} className={styles.header} style={{ viewTransitionName: 'site-header' }} data-chrome="">
      <Link
        href={home}
        className={styles.slot}
        data-slot-mode={back ? 'back' : 'mark'}
        aria-label={back ? undefined : site.header.homeLabel}
        transitionTypes={[back ? RETURN : NAV]}
        onNavigate={() => back && table.returnHome(home)}
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
        <nav aria-label={site.header.nav} className={styles.nav}>
          <ul>
            <li>
              <Link href={href('/about')} transitionTypes={[NAV]} aria-current={current('/about')}>
                <span className="link">{site.header.about}</span>
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={site.header.language} className={styles.language} data-locale-switcher="">
          <ul>
            {locales.map((l, i) => (
              <li key={l}>
                {i > 0 && (
                  <span className={styles.dot} aria-hidden="true">
                    ·
                  </span>
                )}
                <Link
                  // On 404 the server knows only the 404 route, not the address: link the other
                  // language's 404 page; a click reloads this address in that language instead.
                  href={localeHref(l, lost ? '/404' : path)}
                  hrefLang={l}
                  lang={l}
                  className={styles.locale}
                  aria-current={l === locale ? 'page' : undefined}
                  scroll={false}
                  prefetch={lost ? false : undefined}
                  transitionTypes={[LOCALE]}
                  data-locale={l}
                  onNavigate={(e) => {
                    if (l === locale) return e.preventDefault()
                    if (lost) {
                      e.preventDefault()
                      rememberLocale(l)
                      location.assign(withBase(localeHref(l, path)))
                      return
                    }
                    beginLocaleSwitch(l)
                  }}
                >
                  <span className="link">{l.toUpperCase()}</span>
                  <span className="sr-only"> {localeNames[l]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <AmbientToggle labels={site.settings} />
      </div>
      <ReadingHairline />
    </header>
  )
}
