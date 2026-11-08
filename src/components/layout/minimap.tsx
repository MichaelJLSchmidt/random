import { site } from '@/lib/content'
import { cx } from '@/lib/cx'

export type MinimapSection = { id: string; label: string }

type Props = {
  /** Sections in page order; each id is the id of a [data-section] element. */
  sections: MinimapSection[]
  /** Accessible name (default: site.labels.sections). */
  label?: string
  className?: string
}

/*
 * Section ticks fixed at the right edge from 1024 px (hidden below). Each tick
 * links to its section. Motion marks the current one with
 * aria-current="location". Contract: docs/contracts.md#minimap.
 */
export function Minimap({ sections, label = site.labels.sections, className }: Props) {
  return (
    <nav className={cx('minimap', className)} aria-label={label} data-minimap="">
      <ol>
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="minimap-tick" data-minimap-tick={s.id}>
              <span className="sr-only">{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
