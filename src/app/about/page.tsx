import type { Metadata } from 'next'
import About from '@content/about.mdx'
import { site } from '@/lib/content'

export const metadata: Metadata = { title: site.about.title }

export default function AboutPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1 id="page-heading" tabIndex={-1}>
          {site.about.title}
        </h1>
        <p className="lede">{site.about.intro}</p>
      </header>
      <div className="prose">
        <About />
      </div>
    </div>
  )
}
