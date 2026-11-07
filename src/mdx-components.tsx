import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { SectionTitle } from '@/components/section-title'

const components: MDXComponents = {
  a: ({ href = '', ...props }) =>
    href.startsWith('/') ? <Link href={href} {...props} /> : <a href={href} {...props} />,
  h2: ({ children, id }) =>
    typeof children === 'string' ? <SectionTitle id={id}>{children}</SectionTitle> : <h2 id={id}>{children}</h2>,
}

export function useMDXComponents(): MDXComponents {
  return components
}
