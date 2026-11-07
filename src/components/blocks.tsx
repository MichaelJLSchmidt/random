/* Content blocks used in MDX (Management) with their reveal presets. */

/** Callout: a 2px accent rule draws down (scaleY), then the text. */
export function Callout({ children }: { children: React.ReactNode }) {
  return (
    <aside className="callout" data-reveal="callout">
      <span className="callout-rule" aria-hidden="true" />
      <p>{children}</p>
    </aside>
  )
}

export function Metrics({ children }: { children: React.ReactNode }) {
  return <dl className="metrics">{children}</dl>
}

/** Metric: digits split at build time so each can flip in (tabular mono). */
export function Metric({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="metric-block" data-reveal="metric">
      <dt className="metric-label">{label}</dt>
      <dd className="metric">
        <span className="sr-only">
          {value} {unit}
        </span>
        <span className="metric-digits" aria-hidden="true">
          {[...value].map((ch, i) => (
            <span key={i} className="metric-digit">
              {ch}
            </span>
          ))}
          {unit && <span className="metric-unit">{unit}</span>}
        </span>
      </dd>
    </div>
  )
}

/** Divider: draws from the left. */
export function Divider() {
  return <hr className="divider" data-reveal="divider" />
}
