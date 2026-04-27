const PROTECTED = [
  /^\/play($|\/)/,
  /^\/sanctuary($|\/)/,
  /^\/pl\/play($|\/)/,
  /^\/pl\/sanctuary($|\/)/,
]

const LOGIN = [/^\/login$/, /^\/pl\/login$/]

export function isAuthProtectedPath(pathname: string): boolean {
  const p = pathname || '/'
  return PROTECTED.some((r) => r.test(p))
}

export function isLoginPath(pathname: string): boolean {
  return LOGIN.some((r) => r.test(pathname))
}

function localePrefixFromPathname(pathname: string): '' | '/pl' {
  if (pathname.startsWith('/pl/') || pathname === '/pl') return '/pl'
  return ''
}

export function loginPathForLocale(pathname: string): string {
  const prefix = localePrefixFromPathname(pathname)
  return prefix ? `${prefix}/login` : '/login'
}

export function defaultAuthedPathForLocale(pathname: string): string {
  const prefix = localePrefixFromPathname(pathname)
  return prefix ? `${prefix}/play` : '/play'
}

export function safePathRedirect(raw: string | null, fallback: string): string {
  if (!raw) return fallback
  const noHash = raw.split('#')[0]!
  const pathAndQuery = noHash.split('?')
  const path = pathAndQuery[0]!
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  return noHash
}
