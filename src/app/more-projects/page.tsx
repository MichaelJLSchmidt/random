import type { Metadata } from 'next'
import { ProjectTypeGlyph } from '@/components/illustrations'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { Reveal } from '@/components/reveals'
import { moreProjects, pad2 } from '@/lib/content'

export const metadata: Metadata = { title: moreProjects.title }

/**
 * More projects (header only): a numbered typographic index. Each row is
 * [01] in mono, the title as an h3, year, client type and a drawn divider;
 * hovering or focusing a row shifts its text 8 px right and draws its
 * ProjectTypeGlyph. Rows are focusable for that state but are not links.
 * Two lines per row on phones.
 */
export default function MoreProjectsPage() {
  const { columns, items, projectTypeLabels } = moreProjects
  return (
    <PageTransition>
      <div className="index-page" data-identity="ink">
        <header className="index-hero spread-grid">
          <PageTitle className="index-title t-display">{moreProjects.title}</PageTitle>
          <Reveal as="p" kind="lines" order={1} className="index-count t-label">
            {moreProjects.intro}
          </Reveal>
        </header>
        <section className="index-list-section spread-grid" aria-labelledby="page-heading">
          <div className="index-head col-wide t-label" aria-hidden="true">
            <span className="index-col-number">{columns.number}</span>
            <span className="index-col-title">{columns.title}</span>
            <span className="index-col-year">{columns.year}</span>
            <span className="index-col-client">{columns.clientType}</span>
            <span className="index-col-type">{columns.projectType}</span>
          </div>
          <ol className="index-list col-wide">
            {items.map((project) => (
              <li key={project.number} className="index-row" tabIndex={0}>
                <Reveal as="hr" kind="rule" className="index-rule" />
                <span className="index-shift">
                  <span className="index-number t-label">[{pad2(project.number)}]</span>
                  <h3 className="index-name t-h3">{project.title}</h3>
                  <span className="index-year t-label">{project.year}</span>
                  <span className="index-client">{project.clientType}</span>
                </span>
                <span className="index-type">
                  {/* The visible label names the type; the glyph is decoration here. */}
                  <span className="index-glyph" aria-hidden="true">
                    <ProjectTypeGlyph type={project.projectType} titleId={`project-${project.number}-type`} />
                  </span>
                  <span className="index-type-label t-label">{projectTypeLabels[project.projectType]}</span>
                </span>
              </li>
            ))}
          </ol>
          <Reveal as="hr" kind="rule" className="index-rule index-rule-end col-wide" />
          <Reveal as="p" kind="lines" className="index-end t-lead col-content">
            {moreProjects.end}
          </Reveal>
        </section>
      </div>
    </PageTransition>
  )
}
