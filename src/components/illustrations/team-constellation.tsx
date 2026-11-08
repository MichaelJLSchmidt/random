import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Team of Teams: people and product areas as connected points. Stub: frame, title and an empty first drawing group. */
export function TeamConstellation({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="team-constellation"
      viewBox="0 0 640 640"
      title="Team constellation"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
