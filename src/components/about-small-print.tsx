import { type ImageEntry, about, images } from '@/lib/content'
import styles from './site-footer.module.css'

/** Photos to credit (ImageEntry kind "photo"), straight from the image registry. */
const photos = Object.entries(images as Record<string, ImageEntry>).filter(
  (e): e is [string, Extract<ImageEntry, { kind: 'photo' }>] => e[1].kind === 'photo',
)

/**
 * About's small print, in the footer: every photo credited and linked, and
 * the terrain's attribution (swisstopo). Rendered by the root layout and shown
 * by the footer on About only (FooterShell).
 */
export function AboutSmallPrint() {
  return (
    <section className={styles.smallPrint} aria-labelledby="credits-title">
      <h2 id="credits-title" className={styles.smallTitle}>
        {about.creditsTitle}
      </h2>
      <ul className={styles.credits}>
        {photos.map(([id, p]) => (
          <li key={id}>
            <a className="link" href={p.pageUrl}>
              {p.alt || id}
            </a>{' '}
            ·{' '}
            <a className="link" href={p.photographerUrl}>
              {p.photographer}
            </a>
          </li>
        ))}
      </ul>
      <p className={styles.attribution}>
        {about.topo.label}. {about.topo.attribution}.
      </p>
    </section>
  )
}
