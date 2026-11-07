/** Build-time flags. Server-only (no NEXT_PUBLIC_ prefix). */
export const isStaticPreview = process.env.STATIC_EXPORT === '1'

/** The gate is on until launch (SITE_GATE=off). The static preview cannot run it. */
export const gateOn = !isStaticPreview && process.env.SITE_GATE !== 'off'

/** Nothing is indexed until launch; the static preview is never indexed. */
export const noIndex = isStaticPreview || gateOn

/** Prefix for raw URLs (forms, plain <a>). next/link adds the base path itself. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
export const withBase = (path: string) => `${basePath}${path}`
