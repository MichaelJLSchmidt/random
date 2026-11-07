import type { Metadata } from 'next'
import { contact } from '@/lib/content'
import { CopyEmail } from '@/components/copy-email'
import { PageTitle } from '@/components/page-title'
import { SectionTitle } from '@/components/section-title'
import { PageTransition } from '@/components/page-transition'

export const metadata: Metadata = { title: contact.title }

export default function ContactPage() {
  return (
    <PageTransition>
      <div className="page">
        <header className="page-header">
          <PageTitle>{contact.title}</PageTitle>
          <p className="lede">{contact.intro}</p>
        </header>
        <dl className="contact-list">
          <div>
            <dt className="meta">{contact.emailLabel}</dt>
            <dd>
              <CopyEmail email={contact.email} labels={contact.copy} />
            </dd>
          </div>
        </dl>
        <section className="section" aria-labelledby="links-heading" data-reveal="">
          <SectionTitle id="links-heading">{contact.linksHeading}</SectionTitle>
          <ul className="link-list">
            {contact.links.map((link) => (
              <li key={link.href}>
                <a className="link" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageTransition>
  )
}
