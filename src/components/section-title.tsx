import { opsz } from '@/motion/tokens'
import { WeightText } from './weight-text'

type Props = { children: string; id?: string; className?: string }

/** A section <h2> (h2 token: 600, opsz 72): line mask rise while weight goes 360 → 600. */
export function SectionTitle({ children, id, className = '' }: Props) {
  return (
    <h2 id={id} className={className} data-reveal="h2">
      <WeightText text={children} final="h2" opsz={opsz.h2} />
    </h2>
  )
}
