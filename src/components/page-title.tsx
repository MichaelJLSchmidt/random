import { WeightText } from './weight-text'

type Props = {
  children: string
  id?: string
  className?: string
  /** Page whose nav label morphs into this title (about, projects, contact). */
  morph?: string
}

/** The page <h1>: focus target after navigation, weight-animated, reserved at 760. */
export function PageTitle({ children, id = 'page-heading', className, morph }: Props) {
  return (
    <h1 id={id} className={className} tabIndex={-1} data-page-title="" data-title-to={morph}>
      <WeightText text={children} final="h1" />
    </h1>
  )
}
