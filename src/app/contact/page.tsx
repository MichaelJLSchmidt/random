import type { Metadata } from 'next'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { Reveal } from '@/components/reveals'
import { contact } from '@/lib/content'

export const metadata: Metadata = { title: contact.title }

/**
 * Contact: the end point. One full viewport: label, "Let's talk." in display
 * type, a line of text, the email set large with a drawn underline, and mono
 * key / value pairs. No form. The background keeps the last played colour.
 */
export default function ContactPage() {
  return (
    <PageTransition>
      <div className="contact spread-grid" data-contact="">
        <p className="contact-label t-label">{contact.label}</p>
        <PageTitle className="contact-title t-display">{contact.title}</PageTitle>
        <Reveal as="p" kind="lines" order={1} className="contact-body t-lead">
          {contact.body}
        </Reveal>
        <div className="contact-email-line">
          <a className="contact-email t-h2" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          <Reveal as="hr" kind="rule" order={2} className="contact-underline" />
        </div>
        <dl className="contact-pairs">
          {contact.links.map((l) => (
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
        <Reveal as="p" kind="lines" order={3} className="contact-note t-body">
          {contact.note}
        </Reveal>
      </div>
    </PageTransition>
  )
}
