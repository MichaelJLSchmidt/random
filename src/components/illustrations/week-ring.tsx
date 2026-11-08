import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Management: the weekly rituals on a ring, Monday to Friday. Stub: frame, title and an empty first drawing group. */
export function WeekRing({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="week-ring"
      viewBox="0 0 560 560"
      title="A week of rituals"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
