import { contact, site } from '@/lib/content'
import { Reveal } from './reveals'

/**
 * The quiet end point of a case study and of Management, after 09 Next: the
 * contact label in the index column and one line of text with the email link
 * (site.labels.contactTitle, contactText, contactLink). No card, no form.
 */
export function ClosingContact() {
  return (
    <aside className="closing-contact page-section spread-grid space-m" aria-labelledby="closing-contact-title">
      <h2 id="closing-contact-title" className="closing-contact-label t-label col-index">
        {site.labels.contactTitle}
      </h2>
      <Reveal as="p" kind="block" className="closing-contact-line t-body col-content">
        {site.labels.contactText}{' '}
        <a className="link" href={`mailto:${contact.email}`}>
          {site.labels.contactLink}
        </a>
      </Reveal>
    </aside>
  )
}
