import Link from 'next/link'
import { site } from '@/lib/content'
import { NavLinks } from './nav-links'
import styles from './site-header.module.css'

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={site.homeLink}>
          <span className={styles.mark} aria-hidden="true" />
          {site.name}
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          <NavLinks items={site.nav} className={styles.list} />
        </nav>
      </div>
    </header>
  )
}
