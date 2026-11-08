import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Team of Teams: headcount from four to eighteen along a timeline. Stub: frame, title and an empty first drawing group. */
export function TeamGrowthTimeline({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="team-growth-timeline"
      viewBox="0 0 960 360"
      title="Team growth over two years"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
