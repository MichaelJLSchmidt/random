import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { DetailPage } from '@/components/detail-page'
import { CareerMatrix, TeamConstellation, WeekRing, WorkshopGlyphs } from '@/components/illustrations'
import { Scoreboard, Section, SectionIndex, WorkshopRow } from '@/components/layout'
import { NextProject } from '@/components/next-project'
import { Picture } from '@/components/picture'
import { Reveal } from '@/components/reveals'
import { WorkshopDraw } from '@/eggs/workshop-draw'
import { cardById } from '@/lib/cards'
import { type ManagementSectionKey, management, managementSectionKeys, pad2, site, workshopMethods } from '@/lib/content'

export const metadata: Metadata = { title: management.title, description: management.lead }

/** Space above each section, varied on purpose. */
const space: Record<ManagementSectionKey, 's' | 'm' | 'l'> = {
  principles: 'm',
  team: 'l',
  rituals: 'm',
  hiring: 'l',
  growth: 'm',
  workshops: 'l',
  metrics: 'm',
}

/**
 * Management (saffron): the hero continues the card ("How I lead" + the team
 * constellation), then 01 principles (numeral | h3 | evidence), 02 team (the
 * structure pinned while the member rows scroll), 03 rituals (WeekRing),
 * 04 hiring (a path with a drawn connector), 05 growth (CareerMatrix),
 * 06 workshops (a deal row + the workshop draw), 07 metrics (Scoreboard), and
 * the next card. Minimap at the right edge.
 */
export default function ManagementPage() {
  const card = cardById('management')!
  const m = management
  const head = (key: ManagementSectionKey) => ({
    id: key,
    number: managementSectionKeys.indexOf(key) + 1,
    label: m[key].label,
    title: m[key].title ?? m[key].label,
    space: space[key],
  })
  const sections = managementSectionKeys.map((key) => ({ id: key, label: m[key].label }))
  return (
    <DetailPage
      card={card}
      title={m.title}
      label={`${card.title} · ${card.year}`}
      summary={m.lead}
      mediaKind={m.heroImage ? 'image' : 'illustration'}
      media={
        m.heroImage ? (
          <Picture id={m.heroImage} priority sizes="(min-width: 1024px) 62vw, 92vw" className="case-hero-picture" />
        ) : (
          <Reveal kind="draw" order={1} className="case-hero-art">
            <TeamConstellation titleId="hero-constellation-title" />
          </Reveal>
        )
      }
      meta={card.facts}
      sections={sections}
    >
      {/* 01 Principles: numeral in the index columns, h3, evidence. */}
      <Section {...head('principles')} pin={1}>
        <Reveal as="ol" kind="list" className="principles col-wide">
          {m.principles.items.map((p, i) => (
            <li key={i} className="principle">
              <span className="principle-numeral t-numeral t-numeral-outline" aria-hidden="true">
                {pad2(i + 1)}
              </span>
              <h3 className="principle-title t-h3">{p.title}</h3>
              <p className="principle-evidence t-body">{p.evidence}</p>
            </li>
          ))}
        </Reveal>
      </Section>

      {/* 02 Team: the team's structure pinned on the left while the member rows scroll. */}
      <Section {...head('team')} pin={2}>
        <figure className="team-figure cols-4-7" aria-hidden="true">
          <ul className="team-cards">
            {m.team.members.map((p, i) => (
              <li key={i} className="team-card">
                <span className="team-card-initials t-h3">{p.initials}</span>
                <span className="team-card-fte t-label">{p.fte}</span>
              </li>
            ))}
          </ul>
        </figure>
        <Reveal as="ul" kind="list" className="team-rows row-mate cols-8-12">
          {m.team.members.map((p, i) => (
            <li key={i} className="team-row">
              <span className="team-row-initials t-label">{p.initials}</span>
              <span className="team-row-role t-h3">{p.role}</span>
              <span className="team-row-meta t-label">
                {p.fte} · {p.focus}
              </span>
            </li>
          ))}
        </Reveal>
        <Reveal as="p" kind="lines" className="team-note t-body cols-8-12">
          {m.team.note}
        </Reveal>
      </Section>

      {/* 03 Rituals: the list on the left, the week as a ring on the right. */}
      <Section {...head('rituals')} pin={2}>
        <Reveal kind="draw" className="rituals-ring">
          <WeekRing titleId="rituals-week-ring-title" />
        </Reveal>
        <Reveal as="ul" kind="list" className="rituals-list row-mate">
          {m.rituals.items.map((r, i) => (
            <li key={i} className="ritual">
              <span className="ritual-cadence t-label">{r.cadence}</span>
              <h3 className="ritual-name t-h3">{r.name}</h3>
              <p className="ritual-purpose t-body">{r.purpose}</p>
            </li>
          ))}
        </Reveal>
      </Section>

      {/* 04 Hiring: a path of steps joined by a drawn connector. */}
      <Section {...head('hiring')} pin={1}>
        <div className="hiring col-wide" style={{ '--steps': m.hiring.steps.length } as CSSProperties}>
          <Reveal kind="draw" className="hiring-connector" aria-hidden="true">
            <svg className="hiring-connector-x" viewBox="0 0 100 2" preserveAspectRatio="none" fill="none" stroke="currentColor">
              <g data-draw-group="1">
                <line x1="0" y1="1" x2="100" y2="1" pathLength={1} data-draw="" vectorEffect="non-scaling-stroke" />
              </g>
            </svg>
            <svg className="hiring-connector-y" viewBox="0 0 2 100" preserveAspectRatio="none" fill="none" stroke="currentColor">
              <g data-draw-group="1">
                <line x1="1" y1="0" x2="1" y2="100" pathLength={1} data-draw="" vectorEffect="non-scaling-stroke" />
              </g>
            </svg>
          </Reveal>
          <Reveal as="ol" kind="list" className="hiring-steps">
            {m.hiring.steps.map((s, i) => (
              <li key={i} className="hiring-step">
                <span className="hiring-node" aria-hidden="true" />
                <p className="hiring-step-meta t-label">
                  <span className="hiring-step-number">{pad2(i + 1)}</span> {s.duration}
                </p>
                <h3 className="t-h3">{s.title}</h3>
                <p className="t-body">{s.purpose}</p>
              </li>
            ))}
          </Reveal>
        </div>
        <Reveal as="p" kind="lines" className="hiring-note t-body col-content">
          {m.hiring.note}
        </Reveal>
      </Section>

      {/* 05 Growth: the career matrix framed by its HTML axis labels. */}
      <Section {...head('growth')} pin={2}>
        <Reveal as="p" kind="lines" className="t-body col-content">
          {m.growth.body}
        </Reveal>
        <figure className="growth-matrix col-wide">
          <ul className="growth-dimensions t-label">
            {m.growth.dimensions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
          <Reveal kind="draw" className="growth-art">
            <CareerMatrix titleId="growth-career-matrix-title" />
          </Reveal>
          <ul className="growth-levels t-label" style={{ '--levels': m.growth.levels.length } as CSSProperties}>
            {m.growth.levels.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </figure>
      </Section>

      {/* 06 Workshops: the formats dealt as cards, then the workshop draw. */}
      <Section {...head('workshops')} pin={1}>
        <Reveal kind="draw" className="workshop-glyphs col-wide">
          <WorkshopGlyphs titleId="workshops-glyphs-title" />
        </Reveal>
        <WorkshopRow formats={m.workshops.formats} className="col-wide" />
        <div className="workshop-draw col-content">
          <WorkshopDraw
            button={m.workshops.drawButton}
            again={workshopMethods.again}
            drawn={workshopMethods.drawn}
            methods={workshopMethods.methods}
          />
        </div>
      </Section>

      {/* 07 Metrics */}
      <Section {...head('metrics')} pin={2}>
        <Scoreboard metrics={m.metrics.items} label={m.metrics.title ?? m.metrics.label} className="cols-4-12" />
      </Section>

      {/* Next: the first case, played from here. */}
      <section className="page-section spread-grid space-l title-hidden index-top" aria-labelledby="management-next-title">
        <SectionIndex number={managementSectionKeys.length + 1} label={site.labels.next} className="col-index" />
        <h2 id="management-next-title" className="section-title sr-only">
          {site.labels.next}
        </h2>
        <NextProject current={card.id} className="col-content" />
      </section>
    </DetailPage>
  )
}
