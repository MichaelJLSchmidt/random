import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Shared Foundations: twelve teams moving onto the platform over a year. Stub: frame, title and an empty first drawing group. */
export function AdoptionBars({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="adoption-bars"
      viewBox="0 0 960 400"
      title="Platform adoption by team"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
