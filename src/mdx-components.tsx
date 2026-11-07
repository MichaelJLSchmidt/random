import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { Callout, Metric, Metrics } from '@/components/blocks'
import { SectionTitle } from '@/components/section-title'

/* MDX bodies get the reveal presets: h2 (line rise + weight), paragraph, list. */
const components: MDXComponents = {
  a: ({ href = '', ...props }) =>
    href.startsWith('/') ? (
      <Link href={href} className="link" {...props} />
    ) : (
      <a href={href} className="link" {...props} />
    ),
  h2: ({ children, id }) =>
    typeof children === 'string' ? <SectionTitle id={id}>{children}</SectionTitle> : <h2 id={id}>{children}</h2>,
  p: (props) => <p data-reveal="paragraph" {...props} />,
  ul: (props) => <ul data-reveal="list" {...props} />,
  Callout,
  Metrics,
  Metric,
}

export function useMDXComponents(): MDXComponents {
  return components
}
