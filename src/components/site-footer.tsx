import { site } from '@/lib/content'
import styles from './site-footer.module.css'

export function SiteFooter({ children }: { children?: React.ReactNode }) {
  return (
    <footer className={styles.footer} style={{ viewTransitionName: 'site-footer' }}>
      <div className={styles.inner}>
        {children}
        <p className={styles.note}>{site.footer.note}</p>
      </div>
    </footer>
  )
}
