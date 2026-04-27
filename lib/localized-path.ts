import { routing } from '@/i18n/routing'

export type PublicSeoPage = 'home' | 'play' | 'sanctuary'

function isRouteLocale(
  s: string,
): s is (typeof routing.locales)[number] {
  return (routing.locales as readonly string[]).includes(s)
}

export function localizedPath(locale: string, page: PublicSeoPage): string {
  if (!isRouteLocale(locale)) {
    if (page === 'home') return '/'
    return `/${page}`
  }
  if (locale === 'en') {
    if (page === 'home') return '/'
    return `/${page}`
  }
  if (page === 'home') return `/${locale}`
  return `/${locale}/${page}`
}

export const HREFLANG_HOME = {
  'x-default': '/',
  en: '/',
  pl: '/pl',
} as const

export const HREFLANG_PLAY = {
  'x-default': '/play',
  en: '/play',
  pl: '/pl/play',
} as const

export const HREFLANG_SANCTUARY = {
  'x-default': '/sanctuary',
  en: '/sanctuary',
  pl: '/pl/sanctuary',
} as const
