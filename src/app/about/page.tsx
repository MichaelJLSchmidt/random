import type { Metadata } from 'next'
import About from '@content/about.mdx'
import topo from '../../../public/topo/meta.json'
import { AboutTopo } from '@/components/about-topo'
import { PageTitle } from '@/components/page-title'
import { OnTheTable } from '@/eggs/on-the-table'
import { PageTransition } from '@/components/page-transition'
import { site } from '@/lib/content'

export const metadata: Metadata = { title: site.about.title }

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="page about" data-identity="glacier">
        <PageTitle>{site.about.title}</PageTitle>
        <p className="lede" data-reveal="paragraph" data-order="summary">
          {site.about.intro}
        </p>
        <div className="prose">
          <About />
        </div>
        <OnTheTable />
        <p className="topo-credit meta" data-reveal="tags">
          {site.about.topoLabel}. {site.about.attribution}.
          {topo.placeholder && <span className="topo-placeholder"> {site.about.placeholderNote}</span>}
        </p>
        <AboutTopo meta={topo} />
      </div>
    </PageTransition>
  )
}
