import { type NextRequest, NextResponse } from 'next/server'
import { GATE_COOKIE, gateEnabled, verifyAccessToken } from '@/lib/gate'

/*
 * Server-side gate (server build only). Every page request needs a valid signed,
 * httpOnly cookie; otherwise it is redirected to /gate. Static assets, the gate
 * itself and robots.txt are excluded by the matcher.
 */
export async function proxy(request: NextRequest) {
  if (!gateEnabled()) return NextResponse.next()
  if (await verifyAccessToken(request.cookies.get(GATE_COOKIE)?.value)) return NextResponse.next()

  const target = request.nextUrl.clone()
  const from = request.nextUrl.pathname + request.nextUrl.search
  target.pathname = '/gate'
  target.search = from === '/' ? '' : `?next=${encodeURIComponent(from)}`
  const response = NextResponse.redirect(target)
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export const config = {
  matcher: ['/((?!gate|_next/static|_next/image|favicon.ico|robots.txt).*)'],
}
