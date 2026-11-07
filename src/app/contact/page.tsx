import type { Metadata } from 'next'
import { contact } from '@/lib/content'
import { RevealHeading } from '@/components/reveal-heading'
import { PageTransition } from '@/components/page-transition'

export const metadata: Metadata = { title: contact.title }

export default function ContactPage() {
  return (
    <PageTransition>
      <div className="page">
        <header className="page-header">
          <RevealHeading>{contact.title}</RevealHeading>
          <p className="lede">{contact.intro}</p>
        </header>
        <dl className="contact-list">
          <div>
            <dt className="meta">{contact.emailLabel}</dt>
            <dd>
              <a className="contact-email" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </dd>
          </div>
        </dl>
        <section className="section" aria-labelledby="links-heading">
          <h2 id="links-heading" className="section-heading">
            {contact.linksHeading}
          </h2>
          <ul className="link-list">
            {contact.links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageTransition>
  )
}
