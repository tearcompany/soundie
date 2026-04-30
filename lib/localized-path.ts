import { routing } from '@/i18n/routing'

export type PublicSeoPage = 'home' | 'teraz' | 'echo' | 'sanctuary' | 'play'

function isRouteLocale(
  s: string,
): s is (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(s)
}

export function localizedPath(locale: string, page: PublicSeoPage): string {
  const p =
    page === 'sanctuary' ? 'echo' : page === 'play' ? 'teraz' : page
  if (!isRouteLocale(locale)) {
    if (p === 'home') return '/'
    return `/${p}`
  }
  if (locale === 'en') {
    if (p === 'home') return '/'
    return `/${p}`
  }
  if (p === 'home') return `/${locale}`
  return `/${locale}/${p}`
}

export const HREFLANG_HOME = {
  'x-default': '/',
  en: '/',
  pl: '/pl',
} as const

export const HREFLANG_TERAZ = {
  'x-default': '/teraz',
  en: '/teraz',
  pl: '/pl/teraz',
} as const

export const HREFLANG_PLAY = HREFLANG_TERAZ

export const HREFLANG_ECHO = {
  'x-default': '/echo',
  en: '/echo',
  pl: '/pl/echo',
} as const

export const HREFLANG_SANCTUARY = HREFLANG_ECHO
