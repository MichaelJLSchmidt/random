import { WeightText } from './weight-text'

type Props = { children: string; id?: string; className?: string }

/** A page <h1>: focus target after navigation; deal-and-settle headline (reserved at 680 / opsz 96). */
export function PageTitle({ children, id = 'page-heading', className }: Props) {
  return (
    <h1 id={id} className={className} tabIndex={-1} data-reveal="headline">
      <WeightText text={children} final="h1" />
    </h1>
  )
}
