import type { Metadata } from 'next'
import { PageTitle } from '@/components/page-title'
import { PageTransition } from '@/components/page-transition'
import { site } from '@/lib/content'

export const metadata: Metadata = { title: site.contact.title }

/** One sentence and an email link. The background keeps the last played colour. */
export default function ContactPage() {
  return (
    <PageTransition>
      <div className="page" data-contact="">
        <PageTitle>{site.contact.title}</PageTitle>
        <p className="lede" data-reveal="paragraph" data-order="summary">
          {site.contact.sentence}
        </p>
        <p data-reveal="email" data-order="chrome">
          <a className="contact-email link" href={`mailto:${site.contact.email}`}>
            {site.contact.email}
          </a>
        </p>
      </div>
    </PageTransition>
  )
}
