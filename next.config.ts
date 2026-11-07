import { existsSync } from 'node:fs'
import { join } from 'node:path'
import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

/*
 * Two build targets share this config:
 *
 * - `npm run build:server` (Netlify, production): a regular Next.js server build.
 *   The password gate (proxy + unlock route) lives in files ending in `.server.ts(x)`,
 *   which are only picked up as routes by this build.
 * - `npm run build` (STATIC_EXPORT=1, playground preview on GitHub Pages): a static
 *   export to dist/ under BASE_PATH. A static host cannot run the gate, so the
 *   `.server.ts(x)` files are not routes there and every page is served noindex.
 */
const staticExport = process.env.STATIC_EXPORT === '1'
const basePath = staticExport ? (process.env.BASE_PATH ?? '').replace(/\/+$/, '') : ''
const gateOn = !staticExport && process.env.SITE_GATE !== 'off'

// Motion+ is an optional dependency (private registry). Without it, splitText
// resolves to a small local fallback so installs without MOTION_TOKEN still build.
const hasMotionPlus = existsSync(join(process.cwd(), 'node_modules/motion-plus/package.json'))

const nextConfig: NextConfig = {
  pageExtensions: staticExport ? ['tsx', 'ts'] : ['tsx', 'ts', 'server.tsx', 'server.ts'],
  poweredByHeader: false,
  // Without motion-plus its types are missing too; production builds keep full type checks.
  typescript: { ignoreBuildErrors: !hasMotionPlus && staticExport },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(hasMotionPlus
    ? {}
    : { turbopack: { resolveAlias: { 'motion-plus': './src/motion/split-text-fallback.ts' } } }),
  ...(staticExport
    ? {
        output: 'export',
        distDir: 'dist',
        trailingSlash: true,
        basePath,
        images: { unoptimized: true },
      }
    : {
        async headers() {
          return gateOn
            ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
            : []
        },
      }),
}

export default createMDX({})(nextConfig)
