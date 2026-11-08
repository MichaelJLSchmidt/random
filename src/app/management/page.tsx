import type { Metadata } from 'next'
import { Callout } from '@/components/blocks'
import { DetailPage } from '@/components/detail-page'
import { Illustration } from '@/components/illustrations'
import { Scoreboard, Section } from '@/components/layout'
import { NextProject } from '@/components/next-project'
import { Reveal } from '@/components/reveals'
import { WorkshopDraw } from '@/eggs/workshop-draw'
import { cardById } from '@/lib/cards'
import { management, managementSectionKeys } from '@/lib/content'

export const metadata: Metadata = { title: management.title, description: management.summary }

/** Management (skeleton): hero zone with the facts, then the week, the numbers and the workshop draw. */
export default function ManagementPage() {
  const card = cardById('management')!
  const { week, numbers, stuck } = management.sections
  const sections = managementSectionKeys.map((key) => ({ id: key, label: management.sections[key].label }))
  return (
    <DetailPage card={card} summary={management.summary} meta={management.facts} sections={sections}>
      <Section id="week" number={1} label={week.label} title={week.title} note={week.note}>
        {week.body.map((p, i) => (
          <Reveal key={i} as="p" kind="lines" className="t-body">
            {p}
          </Reveal>
        ))}
        <Reveal as="ul" kind="list" className="section-list t-body">
          {week.rituals.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </Reveal>
        {week.callout && <Callout>{week.callout}</Callout>}
        {week.illustration && (
          <Reveal kind="draw" className="section-illustration">
            <Illustration name={week.illustration} />
          </Reveal>
        )}
      </Section>
      <Section id="numbers" number={2} label={numbers.label} title={numbers.title} note={numbers.note} breaker>
        {numbers.body.map((p, i) => (
          <Reveal key={i} as="p" kind="lines" className="t-body">
            {p}
          </Reveal>
        ))}
        <Scoreboard metrics={numbers.metrics} />
      </Section>
      <Section id="stuck" number={3} label={stuck.label} title={stuck.title} note={stuck.note}>
        {stuck.body.map((p, i) => (
          <Reveal key={i} as="p" kind="lines" className="t-body">
            {p}
          </Reveal>
        ))}
        {stuck.illustration && (
          <Reveal kind="draw" className="section-illustration">
            <Illustration name={stuck.illustration} />
          </Reveal>
        )}
        <WorkshopDraw />
      </Section>
      <section className="page-section spread-grid" aria-label={card.title}>
        <div className="col-content">
          <NextProject current={card.id} />
        </div>
      </section>
    </DetailPage>
  )
}
