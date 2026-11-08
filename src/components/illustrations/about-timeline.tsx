import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** About: a horizontal timeline of roles and years. Stub: frame, title and an empty first drawing group. */
export function AboutTimeline({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="about-timeline"
      viewBox="0 0 960 240"
      title="Timeline"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
