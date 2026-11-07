import type { Metadata } from 'next'
import Link from 'next/link'
import { site } from '@/lib/content'
import { RevealHeading } from '@/components/reveal-heading'

export const metadata: Metadata = { title: site.notFound.title }

export default function NotFound() {
  return (
    <div className="page not-found">
      <header className="page-header">
        <p className="meta">404</p>
        <RevealHeading>{site.notFound.title}</RevealHeading>
        <p className="lede">{site.notFound.body}</p>
        <p>
          <Link href="/">{site.notFound.homeLink}</Link>
        </p>
      </header>
    </div>
  )
}
