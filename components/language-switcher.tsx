'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  variant?: 'default' | 'onDark'
}

export function LanguageSwitcher({ className, variant = 'default' }: Props) {
  const t = useTranslations('common')
  const locale = useLocale()
  const pathname = usePathname()
  const muted =
    variant === 'onDark'
      ? 'text-pearl/60 hover:text-pearl'
      : 'text-ink-muted hover:text-ink'
  const active = variant === 'onDark' ? 'text-pearl font-semibold' : 'text-ink font-semibold'
  const sep = variant === 'onDark' ? 'text-pearl/40' : 'text-ink-muted/50'

  return (
    <nav
      className={cn('flex items-center gap-0.5 font-mono text-[0.65rem] tracking-wide', className)}
      aria-label={t('languageNav')}
    >
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center">
          {i > 0 && (
            <span className={cn('mx-0.5', sep)} aria-hidden>
              /
            </span>
          )}
          <Link
            href={pathname}
            locale={loc}
            scroll={false}
            className={cn('rounded px-1 py-0.5 transition-colors', loc === locale ? active : muted)}
            hrefLang={loc}
          >
            {loc.toUpperCase()}
          </Link>
        </span>
      ))}
    </nav>
  )
}
