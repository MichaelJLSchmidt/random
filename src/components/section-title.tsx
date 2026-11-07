import { WeightText } from './weight-text'

type Props = { children: string; id?: string; className?: string }

/** A section <h2> (700): line mask rise while weight goes 360 → 700. */
export function SectionTitle({ children, id, className = '' }: Props) {
  return (
    <h2 id={id} className={className} data-reveal="h2">
      <WeightText text={children} final="h2" opsz={48} />
    </h2>
  )
}
