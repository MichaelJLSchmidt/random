import type { Metadata } from 'next'
import { projects, site } from '@/lib/content'

export const metadata: Metadata = { title: site.projects.title }

export default function ProjectsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 id="page-heading" tabIndex={-1}>
          {site.projects.title}
        </h1>
        <p className="lede">{site.projects.intro}</p>
      </header>
      <ul className="project-list">
        {projects.map((project) => (
          <li key={project.title}>
            <h2>{project.href ? <a href={project.href}>{project.title}</a> : project.title}</h2>
            <p className="meta">
              {project.kind}, {project.year}
            </p>
            <p>{project.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
