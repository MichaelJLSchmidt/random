import type { Metadata } from 'next'
import topo from '../../../public/topo/meta.json'
import { AboutTopo } from '@/components/about-topo'
import { AboutTimeline, ContourPortrait } from '@/components/illustrations'
import { SectionIndex } from '@/components/layout'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { Reveal } from '@/components/reveals'
import { OnTheTable } from '@/eggs/on-the-table'
import { about } from '@/lib/content'

export const metadata: Metadata = { title: about.title }

/** About (skeleton): intro, portrait and timeline illustrations, sections, the table egg, the topography. */
export default function AboutPage() {
  return (
    <PageTransition>
      <div className="page about" data-identity="glacier">
        <PageTitle>{about.title}</PageTitle>
        <p className="lede" data-reveal="paragraph" data-order="summary">
          {about.intro}
        </p>
        <Reveal kind="draw" className="about-portrait">
          <ContourPortrait />
        </Reveal>
        <div className="about-sections">
          {about.sections.map((section, i) => (
            <section
              key={section.key}
              id={section.key}
              data-section={section.key}
              aria-labelledby={`${section.key}-title`}
            >
              <SectionIndex number={i + 1} label={section.label} />
              <h2 id={`${section.key}-title`} className="t-h3">
                {section.title}
              </h2>
              {section.body.map((p, k) => (
                <Reveal key={k} as="p" kind="lines" className="t-body">
                  {p}
                </Reveal>
              ))}
              {section.list && (
                <Reveal as="ul" kind="list" className="section-list t-body">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </Reveal>
              )}
            </section>
          ))}
        </div>
        <Reveal kind="draw" className="about-timeline">
          <AboutTimeline />
        </Reveal>
        <OnTheTable />
        <p className="topo-credit meta" data-reveal="tags">
          {about.topo.label}. {about.topo.attribution}.
          {topo.placeholder && <span className="topo-placeholder"> {about.topo.placeholderNote}</span>}
        </p>
        <AboutTopo meta={topo} />
      </div>
    </PageTransition>
  )
}
