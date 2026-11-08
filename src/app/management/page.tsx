import type { Metadata } from 'next'
import { DetailPage } from '@/components/detail-page'
import { Illustration } from '@/components/illustrations'
import { Scoreboard, Section } from '@/components/layout'
import { NextProject } from '@/components/next-project'
import { Reveal } from '@/components/reveals'
import { WorkshopDraw } from '@/eggs/workshop-draw'
import { cardById } from '@/lib/cards'
import { management, managementSectionKeys, site, workshopMethods } from '@/lib/content'

export const metadata: Metadata = { title: management.title, description: management.lead }

/**
 * Management (skeleton): hero ("How I lead" + lead, the card's facts), then
 * 01 principles, 02 team, 03 rituals, 04 hiring, 05 growth, 06 workshops (with
 * the workshop draw), 07 metrics, Next project. Layout & Pages owns the design.
 */
export default function ManagementPage() {
  const card = cardById('management')!
  const m = management
  const head = (key: (typeof managementSectionKeys)[number]) => ({
    id: key,
    number: managementSectionKeys.indexOf(key) + 1,
    label: m[key].label,
    title: m[key].title ?? m[key].label,
  })
  const sections = managementSectionKeys.map((key) => ({ id: key, label: m[key].label }))
  return (
    <DetailPage card={card} heading={m.title} summary={m.lead} meta={card.facts} sections={sections}>
      <Section {...head('principles')}>
        <Reveal as="ol" kind="list" className="item-list t-body">
          {m.principles.items.map((p, i) => (
            <li key={i}>
              <strong>{p.title}</strong> {p.evidence}
            </li>
          ))}
        </Reveal>
      </Section>
      <Section {...head('team')}>
        <Reveal as="ul" kind="list" className="item-list t-body">
          {m.team.members.map((p, i) => (
            <li key={i}>
              <span className="t-label">{p.initials}</span> {p.role} · {p.fte} · {p.focus}
            </li>
          ))}
        </Reveal>
        <p className="t-body">{m.team.note}</p>
      </Section>
      <Section {...head('rituals')} breaker>
        <Reveal as="ul" kind="list" className="item-list t-body">
          {m.rituals.items.map((r, i) => (
            <li key={i}>
              <strong>{r.name}</strong> <span className="t-label">{r.cadence}</span> {r.purpose}
            </li>
          ))}
        </Reveal>
        <Reveal kind="draw" className="section-illustration">
          <Illustration name="WeekRing" />
        </Reveal>
      </Section>
      <Section {...head('hiring')}>
        <Reveal as="ol" kind="list" className="item-list t-body">
          {m.hiring.steps.map((s, i) => (
            <li key={i}>
              <strong>{s.title}</strong> <span className="t-label">{s.duration}</span> {s.purpose}
            </li>
          ))}
        </Reveal>
        <p className="t-body">{m.hiring.note}</p>
      </Section>
      <Section {...head('growth')}>
        <Reveal as="p" kind="lines" className="t-body">
          {m.growth.body}
        </Reveal>
        <ul className="item-list t-body">
          {m.growth.levels.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <ul className="item-list t-body">
          {m.growth.dimensions.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </Section>
      <Section {...head('workshops')}>
        <Reveal as="ul" kind="list" className="item-list t-body">
          {m.workshops.formats.map((f, i) => (
            <li key={i}>
              <strong>{f.name}</strong> <span className="t-label">{f.duration}</span> {f.who} · {f.outcome}
            </li>
          ))}
        </Reveal>
        <Reveal kind="draw" className="section-illustration">
          <Illustration name="WorkshopGlyphs" />
        </Reveal>
        <WorkshopDraw
          button={m.workshops.drawButton}
          again={workshopMethods.again}
          drawn={workshopMethods.drawn}
          methods={workshopMethods.methods}
        />
      </Section>
      <Section {...head('metrics')}>
        <Scoreboard metrics={m.metrics.items} />
      </Section>
      <section className="page-section spread-grid" aria-label={site.labels.next}>
        <div className="col-content">
          <NextProject current={card.id} />
        </div>
      </section>
    </DetailPage>
  )
}
