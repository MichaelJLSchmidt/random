import { WeightText } from './weight-text'

type Props = { children: string; id?: string; className?: string }

/**
 * Section <h2> (680). Below the fold it rises line by line from a clipping
 * mask while its weight goes from 400 to 680 (src/motion/scroll.ts).
 */
export function SectionTitle({ children, id, className = '' }: Props) {
  return (
    <h2 id={id} className={`section-title ${className}`} data-section-title="">
      <WeightText text={children} final="h2" />
    </h2>
  )
}
