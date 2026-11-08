import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { FirstLoadSequence, Reveal } from '@/components/reveals'
import { home, pad2 } from '@/lib/content'

/**
 * Home: the label, the name in display type on two lines (columns 1–9, its
 * top at about 22vh), role and intro in columns 4–10, and an "On the table
 * now" row under a drawn rule. Nothing else: the hand and its card counter
 * (src/components/hand) sit below.
 */
export default function HomePage() {
  return (
    <PageTransition>
      <div className="home spread-grid" data-identity="ink" data-home="">
        <FirstLoadSequence>
          <Reveal as="p" kind="block" order={0} className="home-label t-label">
            {home.label}
          </Reveal>
          <PageTitle className="home-title t-display">{home.title}</PageTitle>
          <div className="home-intro">
            <Reveal as="p" kind="lines" order={1} className="home-role t-label">
              {home.role}
            </Reveal>
            <Reveal as="p" kind="lines" order={1} delay={120} className="home-lede t-lead">
              {home.intro}
            </Reveal>
          </div>
          <section className="home-now" aria-labelledby="home-now-title">
            <Reveal as="hr" kind="rule" order={2} className="home-now-rule" />
            <h2 id="home-now-title" className="home-now-label t-label">
              {home.onTheTableNow.label}
            </h2>
            <Reveal as="ul" kind="list" order={2} className="home-now-list">
              {home.onTheTableNow.items.map((item, i) => (
                <li key={i}>
                  <span className="home-now-number t-label">{pad2(i + 1)}</span>
                  <span className="home-now-item">{item}</span>
                </li>
              ))}
            </Reveal>
          </section>
        </FirstLoadSequence>
      </div>
    </PageTransition>
  )
}
