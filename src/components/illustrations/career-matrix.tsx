import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Team of Teams: levels against skills, built with the team. Stub: frame, title and an empty first drawing group. */
export function CareerMatrix({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="career-matrix"
      viewBox="0 0 960 600"
      title="Career framework"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
