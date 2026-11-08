import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** Shared Foundations: use, propose, review, release, back to use. Stub: frame, title and an empty first drawing group. */
export function ContributionLoop({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="contribution-loop"
      viewBox="0 0 560 560"
      title="Contribution loop"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
