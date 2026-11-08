import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import topo from '../../../public/topo/meta.json'
import { AboutTopo } from '@/components/about-topo'
import { AboutTimeline, ContourPortrait } from '@/components/illustrations'
import { SectionIndex } from '@/components/layout'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { Reveal } from '@/components/reveals'
import { OnTheTable } from '@/eggs/on-the-table'
import { type AboutSectionKey, type ImageEntry, about, aboutSectionKeys, images, site } from '@/lib/content'

export const metadata: Metadata = { title: about.title }

/** One About section: index label, h2 (title or label), body. */
function Block({ id, children, heading = true }: { id: AboutSectionKey; children: ReactNode; heading?: boolean }) {
  const s = about[id]
  return (
    <section id={id} data-section={id} aria-labelledby={heading ? `${id}-title` : undefined}>
      <SectionIndex number={aboutSectionKeys.indexOf(id) + 1} label={s.label} />
      {heading && (
        <h2 id={`${id}-title`} className="t-h3">
          {s.title ?? s.label}
        </h2>
      )}
      {children}
    </section>
  )
}

/** Photos to credit in the colophon (ImageEntry kind "photo"). */
const photos = Object.entries(images as Record<string, ImageEntry>).filter(
  (e): e is [string, Extract<ImageEntry, { kind: 'photo' }>] => e[1].kind === 'photo',
)

/**
 * About (skeleton): lead, story, timeline, how I work, cards (tcg), roots,
 * "What's on the table" (egg), colophon with photo credits and the topography.
 * Still on the legacy .page layout; Layout & Pages moves it to the Spread grid.
 */
export default function AboutPage() {
  const a = about
  return (
    <PageTransition>
      <div className="page about" data-identity="glacier">
        <PageTitle>{a.title}</PageTitle>
        <p className="lede" data-reveal="paragraph" data-order="summary">
          {a.lead}
        </p>
        <div className="about-sections">
          <Block id="story">
            <Reveal kind="draw" className="about-portrait">
              <ContourPortrait />
            </Reveal>
            {a.story.body.map((p, i) => (
              <Reveal key={i} as="p" kind="lines" className="t-body">
                {p}
              </Reveal>
            ))}
          </Block>
          <Block id="timeline">
            <Reveal as="ol" kind="list" className="item-list t-body">
              {a.timeline.items.map((t, i) => (
                <li key={i}>
                  <span className="t-label">{t.years}</span> {t.title}
                </li>
              ))}
            </Reveal>
            <Reveal kind="draw" className="about-timeline">
              <AboutTimeline />
            </Reveal>
          </Block>
          <Block id="howIWork">
            <Reveal as="ul" kind="list" className="item-list t-body">
              {a.howIWork.items.map((h, i) => (
                <li key={i}>
                  <strong>{h.title}</strong> {h.body}
                </li>
              ))}
            </Reveal>
          </Block>
          <Block id="tcg">
            <Reveal as="p" kind="lines" className="t-body">
              {a.tcg.body}
            </Reveal>
            <ul className="item-list t-body">
              {a.tcg.lessons.map((l, i) => (
                <li key={i}>
                  <strong>{l.title}</strong> {l.body}
                </li>
              ))}
            </ul>
            <p className="t-label">{a.tcg.stats}</p>
          </Block>
          <Block id="roots">
            <Reveal as="p" kind="lines" className="t-body">
              {a.roots.body}
            </Reveal>
          </Block>
          <Block id="onTheTable" heading={false}>
            <OnTheTable
              title={a.onTheTable.title}
              items={a.onTheTable.items}
              flipped={site.eggs.tableFlipped}
              titleId="onTheTable-title"
            />
          </Block>
        </div>
        <section className="about-credits" aria-labelledby="credits-title">
          <h2 id="credits-title" className="t-label">
            {a.creditsTitle}
          </h2>
          {photos.length > 0 && (
            <ul className="item-list">
              {photos.map(([id, p]) => (
                <li key={id}>
                  <a className="link" href={p.pageUrl}>
                    {p.alt || id}
                  </a>{' '}
                  ·{' '}
                  <a className="link" href={p.photographerUrl}>
                    {p.photographer}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="topo-credit meta">
            {a.topo.label}. {a.topo.attribution}.
            {topo.placeholder && <span className="topo-placeholder"> {a.topo.placeholderNote}</span>}
          </p>
        </section>
        <AboutTopo meta={topo} />
      </div>
    </PageTransition>
  )
}
