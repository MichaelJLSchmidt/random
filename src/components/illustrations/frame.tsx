import type { ReactNode } from 'react'

type FrameProps = {
  /** kebab-case name, written to data-illustration. */
  slug: string
  viewBox: string
  title: string
  className?: string
  titleId?: string
  /** Marks a placeholder (data-stub): drawn as a faint dashed frame until the real drawing lands. */
  stub?: boolean
  children?: ReactNode
}

/** Shared <svg> wrapper: viewBox, role="img" + <title>, currentColor strokes, no fill. */
export function IllustrationFrame({ slug, viewBox, title, className, titleId, stub, children }: FrameProps) {
  const id = titleId ?? `illustration-${slug}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      className={className ? `illustration ${className}` : 'illustration'}
      role="img"
      aria-labelledby={id}
      data-illustration={slug}
      data-stub={stub ? '' : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title id={id}>{title}</title>
      {children}
    </svg>
  )
}
