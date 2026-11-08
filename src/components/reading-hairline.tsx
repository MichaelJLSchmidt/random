import styles from './reading-hairline.module.css'

/*
 * A 1 px reading-progress hairline along the bottom edge of the header.
 * Mounted in header.tsx. Owned by the Motion session; contract:
 * docs/contracts.md#reading-hairline.
 *
 * The bar's length is scaleX(var(--reading-progress, 0)) on the element
 * [data-reading-hairline]; Motion sets --reading-progress (0 to 1) from the
 * scroll position. Stub: static at progress 0, so nothing shows yet.
 */
export function ReadingHairline() {
  return (
    <div className={styles.hairline} aria-hidden="true" data-reading-hairline="">
      <span className={styles.bar} />
    </div>
  )
}
