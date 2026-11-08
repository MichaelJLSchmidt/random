import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Front Door: three separate intake paths before, one shared journey after. Stub: frame, title and an empty first drawing group. */
export function IntakeBeforeAfter({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="intake-before-after"
      viewBox="0 0 960 480"
      title="Intake before and after"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
