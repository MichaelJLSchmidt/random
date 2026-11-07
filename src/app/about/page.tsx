import type { Metadata } from 'next'
import About from '@content/about.mdx'
import { site } from '@/lib/content'
import { OnTheTable } from '@/components/on-the-table'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'

export const metadata: Metadata = { title: site.about.title }

export default function AboutPage() {
  return (
    <PageTransition>
      <div className="page about">
        <header className="page-header">
          <PageTitle morph="about">{site.about.title}</PageTitle>
          <p className="lede">{site.about.intro}</p>
        </header>
        <OnTheTable
          portraitAlt={site.about.portraitAlt}
          label={site.about.table.label}
          items={site.about.table.items}
        />
        <div className="prose">
          <About />
        </div>
      </div>
    </PageTransition>
  )
}
