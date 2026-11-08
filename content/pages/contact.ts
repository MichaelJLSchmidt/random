/* Contact (/contact). Server-only page text. */
import type { Contact } from '../schema'

export const contact: Contact = {
  label: 'Contact',
  title: "Let's talk.",
  body: "If you're working on public services, design systems or design leadership and want to compare notes, I'd like to hear from you. I usually reply within a few days. If you're in Bern, coffee works too.",
  email: 'moritz@mjls.example',
  links: [
    // Placeholder profile: shown as text, deliberately without a link.
    { label: 'LinkedIn', value: 'linkedin.com/in/example' },
    { label: 'Location', value: 'Bern, Switzerland' },
  ],
  note: 'No newsletter, no tracking. Just email.',
}
