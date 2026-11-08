import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { ProjectTypeGlyph } from '@/components/illustrations'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { TitleFill } from '@/components/title-fill'
import { moreProjects, pad2 } from '@/lib/content'

export const metadata: Metadata = { title: moreProjects.title }

/** Older projects (skeleton): a plain list, no detail pages, one glyph per project type. */
export default function MoreProjectsPage() {
  const { columns, items, projectTypeLabels } = moreProjects
  return (
    <PageTransition>
      <div className="page more-projects" data-identity="ink">
        <PageTitle>{moreProjects.title}</PageTitle>
        <p className="lede muted" data-reveal="paragraph" data-order="summary">
          {moreProjects.intro}
        </p>
        <table className="projects-table">
          <thead>
            <tr>
              <th scope="col">{columns.number}</th>
              <th scope="col">{columns.title}</th>
              <th scope="col">{columns.year}</th>
              <th scope="col">{columns.projectType}</th>
              <th scope="col">{columns.clientType}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((project, i) => (
              <tr key={project.number} data-reveal="row" data-fill-host="" style={{ '--row': i } as CSSProperties}>
                <td className="project-number">{pad2(project.number)}</td>
                <td className="project-title">
                  <TitleFill>{project.title}</TitleFill>
                </td>
                <td>
                  <time>{project.year}</time>
                </td>
                <td>
                  <span className="project-type">
                    {/* The visible label names the type; the glyph is decoration here. */}
                    <span aria-hidden="true">
                      <ProjectTypeGlyph
                        type={project.projectType}
                        className="project-type-glyph"
                        titleId={`project-${project.number}-type`}
                      />
                    </span>
                    {projectTypeLabels[project.projectType]}
                  </span>
                </td>
                <td>{project.clientType}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="projects-end" data-reveal="tags">
          {moreProjects.end}
        </p>
      </div>
    </PageTransition>
  )
}
