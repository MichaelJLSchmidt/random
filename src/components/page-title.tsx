import { WeightText } from './weight-text'

type Props = { children: string; id?: string; className?: string }

/** The page <h1>: focus target after navigation, weight-animated, reserved at 760. */
export function PageTitle({ children, id = 'page-heading', className }: Props) {
  return (
    <h1 id={id} className={className} tabIndex={-1} data-page-title="">
      <WeightText text={children} final="h1" />
    </h1>
  )
}
