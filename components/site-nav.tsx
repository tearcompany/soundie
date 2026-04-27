'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { LanguageSwitcher } from '@/components/language-switcher'
import { cn } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'

const HREFS = ['/', '/play', '/teardrop', '/sanctuary'] as const

type Href = (typeof HREFS)[number]

const KEYS: Record<Href, 'home' | 'play' | 'teardrop' | 'sanctuary'> = {
  '/': 'home',
  '/play': 'play',
  '/teardrop': 'teardrop',
  '/sanctuary': 'sanctuary',
}

function pathMatches(pathname: string, href: Href) {
  if (href === '/') {
    return pathname === '/' || pathname === ''
  }
  return pathname === href
}

export function SiteNav() {
  const t = useTranslations('siteNav')
  const pathname = usePathname() || '/'
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated' && !!session?.user

  return (
    <header
      className="sticky top-0 z-50 flex shrink-0 items-center justify-between gap-3 border-b border-pearl-border/50 bg-pearl/90 px-4 py-3.5 backdrop-blur-md sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-[family-name:var(--font-fraunces,serif)] text-lg font-semibold tracking-tight text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-coral sm:text-xl"
        >
          <img src="/icon.svg" alt="Soundie" width={24} height={24} aria-hidden className="h-12 w-12 shrink-0" />
          {t('brand')}
        </Link>
        <nav className="flex min-w-0 items-center gap-1.5 sm:gap-3" aria-label={t('mainNav')}>
          {HREFS.map((href) => {
            const on = pathMatches(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap font-mono text-[0.65rem] tracking-wide transition-colors sm:text-xs',
                  on
                    ? 'text-ink font-semibold'
                    : 'text-ink/55 hover:text-ink/90',
                )}
              >
                {t(KEYS[href])}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-4">

        {status !== 'loading' && (
          isLoggedIn ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="shrink-0 font-mono text-[0.65rem] tracking-wide text-ink/45 transition-colors hover:text-ink/80 sm:text-xs"
            >
              {t('signOut')}
            </button>
          ) : (
            <Link
              href="/login"
              className={cn(
                'shrink-0 font-mono text-[0.65rem] tracking-wide transition-colors sm:text-xs',
                pathMatches(pathname, '/' as Href)
                  ? 'text-ink/55 hover:text-ink/90'
                  : 'text-ink/55 hover:text-ink/90',
              )}
            >
              {t('signIn')}
            </Link>
          )
        )}

        <LanguageSwitcher className="shrink-0" />
      </div>
    </header>
  )
}
