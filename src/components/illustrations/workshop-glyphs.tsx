import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Management: one glyph per workshop method, in a row. Stub: frame, title and an empty first drawing group. */
export function WorkshopGlyphs({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="workshop-glyphs"
      viewBox="0 0 960 120"
      title="Workshop methods"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
