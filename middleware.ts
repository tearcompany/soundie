import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import {
  defaultAuthedPathForLocale,
  isAuthProtectedPath,
  isLoginPath,
  loginPathForLocale,
  safePathRedirect,
} from './lib/auth-routes'

const intl = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    if (isAuthProtectedPath(pathname) && process.env.NODE_ENV === 'production') {
      return new NextResponse('Configuration error: AUTH_SECRET', { status: 500 })
    }
    return intl(request)
  }
  const token = await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === 'production',
  })

  if (isAuthProtectedPath(pathname) && !token) {
    const login = new URL(loginPathForLocale(pathname), request.url)
    login.searchParams.set('callbackUrl', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(login)
  }

  if (isLoginPath(pathname) && token) {
    const cb = searchParams.get('callbackUrl')
    const fallback = defaultAuthedPathForLocale(pathname)
    const target = safePathRedirect(cb, fallback)
    return NextResponse.redirect(new URL(target, request.url))
  }

  return intl(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
