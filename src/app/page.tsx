import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { FirstLoadSequence } from '@/components/reveals'
import { home } from '@/lib/content'

/** Home: the hero above the hand. The card counter lives in the hand (src/components/hand). */
export default function HomePage() {
  return (
    <PageTransition>
      <div className="page home" data-identity="ink" data-home="">
        <FirstLoadSequence>
          <p className="home-label t-label">{home.label}</p>
          <PageTitle className="home-title">{home.title}</PageTitle>
          <p className="home-role" data-reveal="line" data-order="lines">
            {home.role}
          </p>
          <p className="lede" data-reveal="paragraph" data-order="lines">
            {home.intro}
          </p>
          <p className="home-hint" data-reveal="tags" data-order="chrome">
            {home.hint}
          </p>
          <div className="home-now">
            <p className="t-label">{home.onTheTableNow.label}</p>
            <ul className="item-list">
              {home.onTheTableNow.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </FirstLoadSequence>
      </div>
    </PageTransition>
  )
}
