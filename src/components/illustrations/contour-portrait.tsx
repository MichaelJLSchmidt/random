import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** About: a portrait drawn as contour lines. Stub: frame, title and an empty first drawing group. */
export function ContourPortrait({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="contour-portrait"
      viewBox="0 0 480 600"
      title="Contour portrait"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
