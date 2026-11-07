import type { Metadata } from 'next'
import { site } from '@/lib/content'
import { safeNextPath } from '@/lib/gate'
import { withBase } from '@/lib/site'

export const metadata: Metadata = {
  title: site.gate.title,
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ next?: string; error?: string }> }

export default async function GatePage({ searchParams }: Props) {
  const { next, error } = await searchParams
  const configured = Boolean(process.env.SITE_PASSWORD)
  const hasError = error === '1'

  return (
    <div className="page gate" data-gate>
      <header className="page-header">
        <h1 id="page-heading" tabIndex={-1}>
          {site.gate.title}
        </h1>
        <p className="lede">{configured ? site.gate.body : site.gate.notConfigured}</p>
      </header>
      {configured && (
        <form className="gate-form" method="post" action={withBase('/gate/unlock')}>
          <input type="hidden" name="next" value={safeNextPath(next)} />
          <label htmlFor="gate-password">{site.gate.label}</label>
          <input
            id="gate-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? 'gate-error' : undefined}
          />
          {hasError && (
            <p id="gate-error" className="form-error" role="alert">
              {site.gate.error}
            </p>
          )}
          <button type="submit">{site.gate.submit}</button>
        </form>
      )}
    </div>
  )
}
