import { type NextRequest, NextResponse } from 'next/server'
import { createAccessToken, GATE_COOKIE, GATE_MAX_AGE, passwordMatches, safeNextPath } from '@/lib/gate'

const FAILED_ATTEMPT_DELAY_MS = 600

/** Form POST from /gate. Sets the signed, httpOnly access cookie on success. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const form = await request.formData()
  const next = safeNextPath(form.get('next'))

  if (!(await passwordMatches(String(form.get('password') ?? '')))) {
    // Slows down guessing; Netlify rate limiting is the stronger control.
    await new Promise((resolve) => setTimeout(resolve, FAILED_ATTEMPT_DELAY_MS))
    const back = request.nextUrl.clone()
    back.pathname = '/gate'
    back.search = ''
    back.searchParams.set('error', '1')
    if (next !== '/') back.searchParams.set('next', next)
    return NextResponse.redirect(back, 303)
  }

  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin), 303)
  response.cookies.set(GATE_COOKIE, await createAccessToken(), {
    httpOnly: true,
    secure: request.nextUrl.hostname !== 'localhost',
    sameSite: 'lax',
    path: '/',
    maxAge: GATE_MAX_AGE,
  })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
