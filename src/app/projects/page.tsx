import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { TitleFill } from '@/components/title-fill'
import { projects, site } from '@/lib/content'

export const metadata: Metadata = { title: site.projects.title }

/** Older projects: a plain list, no detail pages. Rows are dealt top to bottom. */
export default function ProjectsPage() {
  const { columns } = site.projects
  return (
    <PageTransition>
      <div className="page" data-identity="ink">
        <PageTitle>{site.projects.title}</PageTitle>
        <p className="lede muted" data-reveal="paragraph" data-order="summary">
          {site.projects.intro}
        </p>
        <table className="projects-table">
          <thead>
            <tr>
              <th scope="col">{columns.title}</th>
              <th scope="col">{columns.year}</th>
              <th scope="col">{columns.projectType}</th>
              <th scope="col">{columns.clientType}</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, i) => (
              <tr key={project.title} data-reveal="row" data-fill-host="" style={{ '--row': i } as CSSProperties}>
                <td>
                  <TitleFill>{project.title}</TitleFill>
                </td>
                <td>
                  <time>{project.year}</time>
                </td>
                <td>{project.projectType}</td>
                <td>{project.clientType}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="projects-end" data-reveal="tags">
          {site.projects.end}
        </p>
      </div>
    </PageTransition>
  )
}
