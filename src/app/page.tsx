import Link from 'next/link'
import { cardNumber, caseStudies, site } from '@/lib/content'

export default function HomePage() {
  return (
    <div className="page">
      <section className="hero" aria-labelledby="page-heading">
        <h1 id="page-heading" className="display" tabIndex={-1}>
          {site.home.headline}
        </h1>
        <p className="lede">{site.home.intro}</p>
      </section>

      <section className="section" aria-labelledby="work-heading">
        <h2 id="work-heading" className="section-heading">
          {site.home.workHeading}
        </h2>
        <ol className="work-list">
          {caseStudies.map((study, index) => (
            <li key={study.slug}>
              <p className="meta" aria-hidden="true">
                {cardNumber(index)}
              </p>
              <h3>
                <Link href={`/work/${study.slug}`} data-return-focus={`/work/${study.slug}`}>
                  {study.title}
                </Link>
              </h3>
              <p>{study.summary}</p>
              <p className="meta">
                {study.discipline}, {study.year}
              </p>
            </li>
          ))}
        </ol>
        <p>
          <Link href="/projects">{site.home.projectsLink}</Link>
        </p>
      </section>
    </div>
  )
}
