import Link from 'next/link'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { site } from '@/lib/content'
import { NAV } from '@/motion/transitions'

export default function HomePage() {
  return (
    <PageTransition>
      <div className="page home" data-identity="ink" data-home="">
        <PageTitle className="home-title">{site.home.title}</PageTitle>
        <p className="home-role" data-reveal="line" data-order="lines">
          {site.home.role}
        </p>
        <p className="lede" data-reveal="paragraph" data-order="lines">
          {site.home.intro}
        </p>
        <ul className="home-links" data-reveal="tags" data-order="chrome">
          {site.home.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} transitionTypes={[NAV]}>
                <span className="link">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageTransition>
  )
}
