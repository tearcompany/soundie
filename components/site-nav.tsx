'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { LanguageSwitcher } from '@/components/language-switcher'
import { cn } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'

import { UserRound } from 'lucide-react'

const HREFS = ['/', '/today', '/teraz', '/teardrop'] as const

type Href = (typeof HREFS)[number]
type NavKey =
  | 'brand'
  | 'home'
  | 'today'
  | 'teraz'
  | 'teardrop'
  | 'mine'
  | 'echo'
  | 'mainNav'
  | 'signIn'
  | 'signOut'

const KEYS: Record<Href, 'home' | 'today' | 'teraz' | 'teardrop'> = {
  '/': 'home',
  '/today': 'today',
  '/teraz': 'teraz',
  '/teardrop': 'teardrop',
}
const NAV_FALLBACKS: Record<NavKey, string> = {
  brand: 'Soundie',
  home: 'Home',
  today: 'Today',
  teraz: 'Now',
  teardrop: 'Teardrop',
  mine: 'My',
  echo: 'Echo',
  mainNav: 'Main navigation',
  signIn: 'Sign in',
  signOut: 'Sign out',
}

function pathMatches(pathname: string, href: Href) {
  if (href === '/') {
    return pathname === '/' || pathname === ''
  }
  return pathname === href
}

function pathMatchesEcho(pathname: string) {
  return pathname === '/echo'
}

function pathMatchesMine(pathname: string) {
  return pathname === '/moje'
}

export function SiteNav() {
  const t = useTranslations('siteNav')
  const pathname = usePathname() || '/'
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated' && !!session?.user
  const navText = (key: NavKey) => (t.has(key) ? t(key) : NAV_FALLBACKS[key])

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
          {navText('brand')}
        </Link>
        <nav
          className="flex min-w-0 items-center gap-1.5 overflow-x-auto sm:gap-3"
          aria-label={navText('mainNav')}
        >
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
                {navText(KEYS[href])}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-4">
        <Link
          href="/moje"
          aria-current={pathMatchesMine(pathname) ? 'page' : undefined}
          className={cn(
            'hidden shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[0.65rem] tracking-wide transition-colors sm:inline-flex sm:text-xs',
            pathMatchesMine(pathname)
              ? 'text-ink font-semibold'
              : 'text-ink/55 hover:text-ink/90',
          )}
        >
          <UserRound className="h-3.5 w-3.5 shrink-0 opacity-[0.82]" aria-hidden />
          <span>{navText('mine')}</span>
        </Link>
        <Link
          href="/echo"
          aria-current={pathMatchesEcho(pathname) ? 'page' : undefined}
          className={cn(
            'hidden shrink-0 whitespace-nowrap font-mono text-[0.65rem] tracking-wide transition-colors sm:inline sm:text-xs',
            pathMatchesEcho(pathname)
              ? 'text-ink font-semibold'
              : 'text-ink/55 hover:text-ink/90',
          )}
        >
          {navText('echo')}
        </Link>

        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="shrink-0 font-mono text-[0.65rem] tracking-wide text-ink/45 transition-colors hover:text-ink/80 sm:text-xs"
          >
            {navText('signOut')}
          </button>
        ) : (
          <Link
            href="/login"
            className="mr-1 shrink-0 font-mono text-[0.65rem] tracking-wide text-ink/55 transition-colors hover:text-ink/90 sm:text-xs"
          >
            {navText('signIn')}
          </Link>
        )}

        <LanguageSwitcher className="shrink-0" />
      </div>
    </header>
  )
}
