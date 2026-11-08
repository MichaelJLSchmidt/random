import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Front Door: how an applicant feels at each step of the journey. Stub: frame, title and an empty first drawing group. */
export function JourneyEmotionCurve({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="journey-emotion-curve"
      viewBox="0 0 960 360"
      title="Journey emotion curve"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
