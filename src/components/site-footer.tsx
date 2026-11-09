import type { ReactNode } from 'react'
import { site } from '@/lib/content'
import { FooterShell } from './footer-shell'
import styles from './site-footer.module.css'

/** The site footer: the note; About adds its small print (credits, attribution). None on home. */
export function SiteFooter({ about }: { about?: ReactNode }) {
  return (
    <FooterShell about={about}>
      <p className={styles.note}>{site.footer.note}</p>
    </FooterShell>
  )
}
