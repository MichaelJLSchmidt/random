import { IllustrationFrame } from './frame'
import type { ProjectType, ProjectTypeGlyphProps } from './types'

const titles: Record<ProjectType, string> = {
  form: 'Form',
  map: 'Map',
  dashboard: 'Dashboard',
  portal: 'Portal',
  calendar: 'Calendar',
  checklist: 'Checklist',
}

/** More projects: one small glyph per project type (48 x 48). Stub: frame, title, empty group. */
export function ProjectTypeGlyph({ type, className, titleId }: ProjectTypeGlyphProps) {
  return (
    <IllustrationFrame
      stub
      slug="project-type-glyph"
      viewBox="0 0 48 48"
      title={titles[type]}
      className={className}
      titleId={titleId ?? `illustration-project-type-${type}`}
    >
      <g data-draw-group="1" data-type={type} />
    </IllustrationFrame>
  )
}
