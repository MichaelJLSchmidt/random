'use client'

import { useRef } from 'react'
import { announce } from '@/components/live-region'
import { glintText } from '@/motion/glint'
import { GlintText } from './title-fill'

type Props = { email: string; labels: { copy: string; copied: string; failed: string } }

/** Email link plus a copy button; a successful copy is marked by the Glint and announced. */
export function CopyEmail({ email, labels }: Props) {
  const link = useRef<HTMLAnchorElement>(null)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      const glintCopy = link.current?.querySelector<HTMLElement>('[data-glint-text]')
      if (glintCopy) glintText(glintCopy)
      navigator.vibrate?.(12)
      announce(labels.copied)
    } catch {
      announce(labels.failed)
    }
  }
  return (
    <span className="copy-email">
      <a ref={link} className="contact-email link" href={`mailto:${email}`}>
        <GlintText>{email}</GlintText>
      </a>
      <button type="button" className="pill" onClick={copy}>
        {labels.copy}
      </button>
    </span>
  )
}
