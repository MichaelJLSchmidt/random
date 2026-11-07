import type { MetadataRoute } from 'next'
import { noIndex } from '@/lib/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return { rules: noIndex ? { userAgent: '*', disallow: '/' } : { userAgent: '*', allow: '/' } }
}
