import type { Metadata } from 'next'
import About from '@content/about.mdx'
import { PageTitle } from '@/components/page-title'
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
      </div>
    </PageTransition>
  )
}
