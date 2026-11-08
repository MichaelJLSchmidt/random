import { IllustrationFrame } from './frame'
import type { IllustrationProps } from './types'

/** 404: a face-down card lying in the discard zone. Stub: frame, title and an empty first drawing group. */
export function DiscardedCard({ className, titleId }: IllustrationProps) {
  return (
    <IllustrationFrame
      stub
      slug="discarded-card"
      viewBox="0 0 132 184"
      title="A discarded card"
      className={className}
      titleId={titleId}
    >
      <g data-draw-group="1" />
    </IllustrationFrame>
  )
}
