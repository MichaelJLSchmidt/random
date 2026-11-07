import Link from 'next/link'
import { CardHand } from '@/components/card/card-hand'
import { CaseStudyCard } from '@/components/card/case-study-card'
import { caseStudies, site } from '@/lib/content'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'

export default function HomePage() {
  return (
    <PageTransition>
      <div className="page">
        <section className="hero" aria-labelledby="page-heading">
          <PageTitle className="display">{site.home.headline}</PageTitle>
          <p className="lede">{site.home.intro}</p>
        </section>

        <section className="section" aria-labelledby="work-heading">
          <h2 id="work-heading" className="section-heading">
            {site.home.workHeading}
          </h2>
          <CardHand
            labelledBy="work-heading"
            items={caseStudies.map((study, index) => (
              <CaseStudyCard key={study.slug} study={study} index={index} headingLevel="h3" />
            ))}
          />
          <p className="after-hand">
            <Link href="/projects">{site.home.projectsLink}</Link>
          </p>
        </section>
      </div>
    </PageTransition>
  )
}
