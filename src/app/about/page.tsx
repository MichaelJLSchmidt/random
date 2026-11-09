import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { AboutTimeline, ContourPortrait } from '@/components/illustrations'
import { OffsetImage, Section, SectionIndex, imageSides } from '@/components/layout'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { Reveal } from '@/components/reveals'
import { OnTheTable } from '@/eggs/on-the-table'
import { type AboutSectionKey, about, aboutSectionKeys, pad2, site } from '@/lib/content'

export const metadata: Metadata = { title: about.title }

const space: Record<AboutSectionKey, 's' | 'm' | 'l'> = {
  story: 'm',
  timeline: 'l',
  howIWork: 'm',
  tcg: 'l',
  roots: 's',
  onTheTable: 'm',
  projects: 'l',
  contact: 'l',
}

/**
 * About (glacier, over the old portfolio's contour field of Interlaken, drawn
 * by the background field): hero (title, lead, ContourPortrait), 01 story,
 * 02 timeline (AboutTimeline, line and dots, with seven HTML stops:
 * horizontal from 1024, turned 90° below), 03 how I work (2×2), 04 "At the
 * table", 05 roots, 06 "What's on the table" (five mini cards), 07 projects
 * (a plain list: title, year, client, what I did; not interactive), 08 contact
 * ("Let's talk."). Images are offset on alternating sides. The photo credits
 * and the terrain attribution are small print in the footer
 * (AboutSmallPrint); the attribution also runs along the left edge from 1024.
 */
export default function AboutPage() {
  const a = about
  const head = (key: AboutSectionKey) => ({
    id: key,
    number: aboutSectionKeys.indexOf(key) + 1,
    label: a[key].label,
    title: a[key].title ?? a[key].label,
    space: space[key],
  })
  const side = imageSides()
  const p = a.projects
  const c = a.contact
  return (
    <PageTransition>
      <div className="about-page" data-identity="glacier">
        <header className="about-hero spread-grid">
          <PageTitle className="about-title t-display">{a.title}</PageTitle>
          <Reveal as="p" kind="lines" order={1} className="about-lead t-lead">
            {a.lead}
          </Reveal>
          <Reveal kind="draw" order={1} className="about-portrait">
            <ContourPortrait titleId="about-portrait-title" />
          </Reveal>
        </header>

        {/* 01 Story */}
        <Section {...head('story')} pin={2}>
          <div className="section-body col-content">
            {a.story.body.map((p, i) => (
              <Reveal key={i} as="p" kind="lines" className="t-body">
                {p}
              </Reveal>
            ))}
          </div>
          {a.story.image && (
            <OffsetImage image={a.story.image} side={side()} caption={a.story.caption} className="section-image" />
          )}
        </Section>

        {/* 02 Timeline: seven stops; the drawing runs along them. */}
        <Section {...head('timeline')} pin={1}>
          <div className="timeline col-wide" style={{ '--stops': a.timeline.items.length } as CSSProperties}>
            {/* Line and dots only: the years and titles are the HTML stops, in seven equal cells that line up with the dots. */}
            <Reveal kind="draw" className="timeline-track">
              <AboutTimeline titleId="timeline-illustration-title" items={a.timeline.items} labels={false} />
            </Reveal>
            <Reveal as="ol" kind="list" className="timeline-stops">
              {a.timeline.items.map((t, i) => (
                <li key={i} className="timeline-stop">
                  <span className="timeline-years t-label">{t.years}</span>
                  <span className="timeline-stop-title">{t.title}</span>
                </li>
              ))}
            </Reveal>
          </div>
        </Section>

        {/* 03 How I work: a staggered 2×2. */}
        <Section {...head('howIWork')} pin={2}>
          <Reveal as="ul" kind="list" className="how-grid cols-4-12">
            {a.howIWork.items.map((h, i) => (
              <li key={i} className="how-item">
                <span className="how-number t-label">{pad2(i + 1)}</span>
                <h3 className="t-h3">{h.title}</h3>
                <p className="t-body">{h.body}</p>
              </li>
            ))}
          </Reveal>
        </Section>

        {/* 04 At the table */}
        <Section {...head('tcg')} pin={3}>
          <Reveal as="p" kind="lines" className="tcg-body t-lead cols-4-10">
            {a.tcg.body}
          </Reveal>
          <Reveal as="ul" kind="list" className="tcg-lessons col-content">
            {a.tcg.lessons.map((l, i) => (
              <li key={i} className="tcg-lesson">
                <h3 className="t-h3">{l.title}</h3>
                <p className="t-body">{l.body}</p>
              </li>
            ))}
          </Reveal>
          <p className="tcg-stats t-label col-content">{a.tcg.stats}</p>
          {a.tcg.image && (
            <OffsetImage image={a.tcg.image} side={side()} caption={a.tcg.caption} className="section-image" />
          )}
        </Section>

        {/* 05 Roots: set to the right, lead size. */}
        <Section {...head('roots')} pin={2}>
          <Reveal as="p" kind="lines" className="roots-body t-lead cols-6-11">
            {a.roots.body}
          </Reveal>
          {a.roots.image && (
            <OffsetImage image={a.roots.image} side={side()} caption={a.roots.caption} className="section-image" />
          )}
        </Section>

        {/* 06 What's on the table: the egg brings its own h2. */}
        <div id="onTheTable" className="page-section spread-grid space-m about-table" data-section="onTheTable">
          <SectionIndex
            number={aboutSectionKeys.indexOf('onTheTable') + 1}
            label={a.onTheTable.label}
            className="col-index"
          />
          <div className="col-content">
            <OnTheTable
              title={a.onTheTable.title}
              items={a.onTheTable.items}
              flipped={site.eggs.tableFlipped}
              titleId="onTheTable-title"
            />
          </div>
        </div>

        {/* 07 Projects: a plain list, not interactive (no hover or focus states); rows reveal with their rules. */}
        <Section {...head('projects')} pin={2}>
          <Reveal as="p" kind="block" className="projects-count t-label col-content">
            {p.intro}
          </Reveal>
          <div className="projects col-wide">
            <p className="projects-head t-label" aria-hidden="true">
              <span>{p.columns.title}</span>
              <span>{p.columns.year}</span>
              <span>{p.columns.client}</span>
              <span>{p.columns.role}</span>
            </p>
            <ul className="projects-list">
              {p.items.map((item) => (
                <Reveal key={item.title} as="li" kind="pair" className="project">
                  <span className="project-rule" aria-hidden="true" data-pair-rule="" />
                  <span className="project-title" data-pair-part="">
                    {item.title}
                  </span>
                  <span className="project-year t-label" data-pair-part="">
                    <span className="sr-only">{p.columns.year}: </span>
                    {item.year}
                  </span>
                  <span className="project-client" data-pair-part="">
                    <span className="sr-only">{p.columns.client}: </span>
                    {item.client}
                  </span>
                  <span className="project-role" data-pair-part="">
                    <span className="sr-only">{p.columns.role}: </span>
                    {item.role}
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal as="p" kind="lines" className="projects-end t-lead col-content">
            {p.end}
          </Reveal>
        </Section>

        {/* 08 Contact: the end point (Coffee, the egg, leads here: /about#contact). */}
        <Section {...head('contact')} pin={2} className="about-contact">
          <Reveal as="p" kind="lines" className="contact-body t-lead col-content">
            {c.body}
          </Reveal>
          <div className="contact-email-line col-content">
            <a className="contact-email t-h2" href={`mailto:${c.email}`}>
              {c.email}
            </a>
            <Reveal as="hr" kind="rule" className="contact-underline" />
          </div>
          <dl className="contact-pairs col-content">
            {c.links.map((l) => (
              <div key={l.label} className="contact-pair">
                <dt className="t-label">{l.label}</dt>
                <dd className="t-label">
                  {l.href ? (
                    <a className="link" href={l.href}>
                      {l.value}
                    </a>
                  ) : (
                    l.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <Reveal as="p" kind="block" className="contact-note t-body col-content">
            {c.note}
          </Reveal>
        </Section>

        {/* The contour map's source, visible along the left edge while the map is behind the page. */}
        <p className="topo-attribution t-label" aria-hidden="true">
          {a.topo.attribution}
        </p>
      </div>
    </PageTransition>
  )
}
