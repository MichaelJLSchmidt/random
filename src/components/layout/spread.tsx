import type { ReactNode } from 'react'
import type { ImageId } from '@/lib/content'
import { Picture } from '../picture'
import { cx } from '@/lib/cx'

type Props = {
  image: ImageId
  /** Caption in the margin (column 12 + outer track from 1680 px, below the image otherwise). */
  caption?: ReactNode
  /** sizes for <Picture> (default "100vw": the image is full bleed). */
  sizes?: string
  /** The one above-the-fold image of the page. */
  priority?: boolean
  className?: string
}

/*
 * A full-bleed image with a margin caption. The figure is its own
 * .spread-grid spanning full-start / full-end, so it works inside a page grid
 * or on its own. The caption sits under the image in the reading column, and
 * from 1680 px (D2) in column 12 + the outer track, under the image's right
 * edge. Contract: docs/contracts.md#spread.
 */
export function Spread({ image, caption, sizes = '100vw', priority, className }: Props) {
  return (
    <figure className={cx('spread spread-grid col-full', className)} data-spread="">
      <Picture id={image} sizes={sizes} priority={priority} className="spread-media col-full" />
      {caption && <figcaption className="spread-caption col-margin t-label">{caption}</figcaption>}
    </figure>
  )
}
