/** Prefix for raw URLs (plain <a>, fetch). next/link adds the base path itself. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
export const withBase = (path: string) => `${basePath}${path}`
