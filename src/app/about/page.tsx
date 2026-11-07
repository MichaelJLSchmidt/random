import type { Metadata } from 'next'
import About from '@content/about.mdx'
import { site } from '@/lib/content'
import { RevealHeading } from '@/components/reveal-heading'

export const metadata: Metadata = { title: site.about.title }

export default function AboutPage() {
  return (
    <div className="page">
      <header className="page-header">
        <RevealHeading>{site.about.title}</RevealHeading>
        <p className="lede">{site.about.intro}</p>
      </header>
      <div className="prose">
        <About />
      </div>
    </div>
  )
}
