import { NextProject } from '@/components/next-project'
import { Reveal } from '@/components/reveals'
import { DealRow, Section } from '@/components/layout'
import { Illustration } from '@/components/illustrations'
import { type CaseStudy, type SectionCopy, caseStudySectionKeys, site } from '@/lib/content'

/** Which sections open with a NumeralBreaker (skeleton choice; Layout decides). */
const breakers = new Set(['decisions', 'outcomes'])

function Body({ section }: { section: Pick<SectionCopy, 'body' | 'list'> }) {
  return (
    <>
      {section.body.map((p, i) => (
        <Reveal key={i} as="p" kind="lines" className="t-body">
          {p}
        </Reveal>
      ))}
      {section.list && (
        <Reveal as="ul" kind="list" className="section-list t-body">
          {section.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Reveal>
      )}
    </>
  )
}

/** Sections 01 Context … 09 Next of one case study, on the Spread grid. */
export function CaseSections({ study }: { study: CaseStudy }) {
  const s = study.sections
  return caseStudySectionKeys.map((key, i) => {
    const number = i + 1
    const common = { id: key, number, breaker: breakers.has(key) }
    switch (key) {
      case 'role':
        return (
          <Section key={key} {...common} label={s.role.label} title={s.role.title} note={s.role.note}>
            <Body section={s.role} />
            <div className="role-columns">
              <div>
                <h3 className="t-label">{site.labels.owned}</h3>
                <Reveal as="ul" kind="list" className="item-list t-body">
                  {s.role.owned.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </Reveal>
              </div>
              <div>
                <h3 className="t-label">{site.labels.notOwned}</h3>
                <Reveal as="ul" kind="list" className="item-list t-body">
                  {s.role.notOwned.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </Reveal>
              </div>
            </div>
          </Section>
        )
      case 'approach':
        return (
          <Section key={key} {...common} label={s.approach.label} title={s.approach.title} note={s.approach.note}>
            <Body section={s.approach} />
            <Reveal as="ol" kind="list" className="approach-steps">
              {s.approach.steps.map((step, k) => (
                <li key={k}>
                  <h3 className="t-h3">{step.title}</h3>
                  <p className="t-body">{step.body}</p>
                </li>
              ))}
            </Reveal>
          </Section>
        )
      case 'decisions':
        return (
          <Section key={key} {...common} label={s.decisions.label} title={s.decisions.title} note={s.decisions.note}>
            <Body section={s.decisions} />
            <DealRow decisions={s.decisions.items} />
          </Section>
        )
      case 'artefacts':
        return (
          <Section key={key} {...common} label={s.artefacts.label} title={s.artefacts.title} note={s.artefacts.note}>
            <Body section={s.artefacts} />
            <ul className="artefacts">
              {s.artefacts.items.map((a, k) => (
                <li key={a.title}>
                  <Reveal as="figure" kind="draw" className="artefact">
                    {a.illustration && <Illustration name={a.illustration} titleId={`artefact-${k + 1}-title`} />}
                    <figcaption className="t-label">{a.title}</figcaption>
                  </Reveal>
                </li>
              ))}
            </ul>
          </Section>
        )
      case 'outcomes':
      case 'differently':
        return (
          <Section key={key} {...common} label={s[key].label} title={s[key].title} note={s[key].note}>
            <Body section={s[key]} />
            {s[key].items && (
              <Reveal as="ul" kind="list" className="section-list t-body">
                {s[key].items!.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </Reveal>
            )}
          </Section>
        )
      case 'next':
        return (
          <Section key={key} {...common} label={s.next.label} title={s.next.title}>
            <NextProject current={study.slug} next={s.next.card} />
          </Section>
        )
      default:
        return (
          <Section key={key} {...common} label={s[key].label} title={s[key].title} note={s[key].note}>
            <Body section={s[key]} />
          </Section>
        )
    }
  })
}
