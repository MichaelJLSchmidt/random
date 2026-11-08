import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Front Door: channels, front stage, back stage and support processes in lanes. Stub: frame, title and an empty first drawing group. */
export function ServiceBlueprint({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="service-blueprint"
      viewBox="0 0 1200 560"
      title="Service blueprint"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
