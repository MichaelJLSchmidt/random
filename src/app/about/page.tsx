import type { Metadata } from 'next'
import About from '@content/about.mdx'
import { site } from '@/lib/content'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'

export const metadata: Metadata = { title: site.about.title }

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="page">
        <header className="page-header">
          <PageTitle>{site.about.title}</PageTitle>
          <p className="lede">{site.about.intro}</p>
        </header>
        <div className="prose">
          <About />
        </div>
      </div>
    </PageTransition>
  )
}
