import { NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from './lib/session'

// Guards the admin area. Route handlers re-check the session as well.
export async function proxy(req) {
  const { pathname } = req.nextUrl
  const isLogin = pathname === '/admin/login' || pathname === '/api/admin/login'
  if (isLogin) return NextResponse.next()

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (session) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }
  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(url)
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] }
