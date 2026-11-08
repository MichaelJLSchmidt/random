import type { Metadata } from 'next'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { contact } from '@/lib/content'

export const metadata: Metadata = { title: contact.title }

/** Contact (skeleton): label, title, body, email, links, note. The background keeps the last played colour. */
export default function ContactPage() {
  return (
    <PageTransition>
      <div className="page" data-contact="">
        <p className="t-label contact-label">{contact.label}</p>
        <PageTitle>{contact.title}</PageTitle>
        <p className="lede" data-reveal="paragraph" data-order="summary">
          {contact.body}
        </p>
        <p data-reveal="email" data-order="chrome">
          <a className="contact-email link" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        </p>
        <dl className="contact-links">
          {contact.links.map((l) => (
            <div key={l.label}>
              <dt className="t-label">{l.label}</dt>
              <dd>
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
        <p className="contact-note muted">{contact.note}</p>
      </div>
    </PageTransition>
  )
}
