import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { site } from '@/lib/content'

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
        <p className="home-hint" data-reveal="tags" data-order="chrome">
          {site.home.hint}
        </p>
      </div>
    </PageTransition>
  )
}
