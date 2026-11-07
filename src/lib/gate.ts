/*
 * Pre-launch password gate. Web Crypto only, so it runs in the Next.js proxy on
 * any runtime (Node.js locally, Netlify's edge handler in production).
 *
 * Cookie value: "v1.<expiry>.<HMAC-SHA256(key, 'v1.<expiry>')>", where the key is
 * derived from SITE_PASSWORD, so changing the password signs everyone out.
 */
export const GATE_COOKIE = 'site_access'
export const GATE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days, in seconds

const encoder = new TextEncoder()

export const gateEnabled = () => process.env.SITE_GATE !== 'off'
const password = () => process.env.SITE_PASSWORD ?? ''

async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey('raw', await sha256(`site-gate:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
    return Uint8Array.from(binary, (c) => c.charCodeAt(0))
  } catch {
    return null
  }
}

export async function createAccessToken(now = Date.now()) {
  const payload = `v1.${Math.floor(now / 1000) + GATE_MAX_AGE}`
  const signature = await crypto.subtle.sign('HMAC', await signingKey(password()), encoder.encode(payload))
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifyAccessToken(token: string | undefined, now = Date.now()) {
  const secret = password()
  if (!secret || !token) return false
  const [version, expiry, signature] = token.split('.')
  if (version !== 'v1' || !expiry || !signature || !/^\d+$/.test(expiry)) return false
  if (Number(expiry) * 1000 <= now) return false
  const bytes = fromBase64Url(signature)
  if (!bytes) return false
  return crypto.subtle.verify('HMAC', await signingKey(secret), bytes, encoder.encode(`v1.${expiry}`))
}

/** Compares SHA-256 digests in constant time. False when no password is configured. */
export async function passwordMatches(input: string) {
  const secret = password()
  if (!secret || !input) return false
  const [a, b] = await Promise.all([sha256(input), sha256(secret)])
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/** Only same-site paths; anything else goes home. */
export function safeNextPath(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/'
  if (value === '/gate' || value.startsWith('/gate/') || value.startsWith('/gate?')) return '/'
  return value
}
