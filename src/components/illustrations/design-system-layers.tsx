import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Shared Foundations: tokens, components and patterns stacked as layers. Stub: frame, title and an empty first drawing group. */
export function DesignSystemLayers({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="design-system-layers"
      viewBox="0 0 640 560"
      title="Design system layers"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
