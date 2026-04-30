'use client'

import { type CSSProperties, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { hexToRgba } from '@/lib/hex-rgba'
import { cn } from '@/lib/utils'
import { RitualTeardropCard } from '@/components/ritual-teardrop-card'

export function TodayPage() {
  const t = useTranslations('today')
  const locale = useLocale() as 'en' | 'pl'
  const playerId = useSoundieStore((s) => s.playerId)
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)

  const weekday = useMemo(() => new Date().getDay(), [])

  const query = trpc.today.get.useQuery(
    {
      playerId: playerId!,
      locale,
      weekday,
    },
    {
      enabled: hasHydrated && Boolean(playerId),
      staleTime: 60_000,
    },
  )

  const sectionLabel = (slotId: string) => {
    switch (slotId) {
      case 'morning':
        return t('sections.morning')
      case 'relationships':
        return t('sections.relationships')
      case 'stress':
        return t('sections.stress')
      case 'soul':
        return t('sections.soul')
      default:
        return slotId
    }
  }

  if (!hasHydrated) return null

  if (!playerId) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-10 pb-16">
        <p className="font-body-serif text-center text-sm text-ink/75">{t('needPlayer')}</p>
        <Link
          href="/teraz"
          className="mx-auto mt-6 inline-block font-mono text-xs uppercase tracking-widest text-coral underline underline-offset-4"
        >
          {t('goPlay')}
        </Link>
      </main>
    )
  }

  if (query.isLoading || !query.data) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-10 pb-16">
        <p className="font-mono text-center text-xs text-ink-muted">{t('loading')}</p>
      </main>
    )
  }

  const { heroOrbHex, slots, streakNights } = query.data

  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 pb-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-pearl-dark/40 to-transparent"
        aria-hidden
      />

      <header className="relative text-center">
        <div
          className="soundie-hero-orb relative mx-auto mb-1 flex h-[6.75rem] w-[6.75rem] shrink-0 items-center justify-center rounded-full"
          style={
            {
              ['--orb-breath' as string]: '4.2s',
              ['--orb-color' as string]: heroOrbHex,
            } as CSSProperties
          }
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full soundie-orb-resonance-ring opacity-[0.68]"
            style={{ boxShadow: `0 0 0 1px ${hexToRgba(heroOrbHex, 0.35)}, 0 0 28px ${hexToRgba(heroOrbHex, 0.22)}` }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-[-10px] rounded-full border soundie-orb-glow-ring"
            style={{ borderColor: hexToRgba(heroOrbHex, 0.22) }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-[-4px] rounded-full border soundie-orb-glow-ring-inner"
            style={{ borderColor: hexToRgba(heroOrbHex, 0.14) }}
            aria-hidden
          />
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={`d-${i}`}
              className="pointer-events-none absolute h-0.5 w-0.5 rounded-full soundie-orb-dust"
              style={{
                backgroundColor: hexToRgba(heroOrbHex, 0.55),
                left: `${18 + (i * 13) % 64}%`,
                top: `${12 + (i * 19) % 70}%`,
                animationDelay: `${i * 0.4}s`,
              }}
              aria-hidden
            />
          ))}
          <span
            className="relative z-10 inline-flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-2 border-white/25 font-mono text-sm font-bold uppercase tracking-wide text-white shadow-[0_8px_28px_-8px_rgba(0,0,0,0.35)]"
            style={{
              backgroundColor: heroOrbHex,
              boxShadow: `0 0 0 5px ${hexToRgba(heroOrbHex, 0.14)}, 0 10px 28px -12px ${hexToRgba(heroOrbHex, 0.35)}`,
            }}
          >
            ···
          </span>
        </div>
        <h1 className="font-body-serif mt-4 text-2xl font-light tracking-tight text-ink">{t('heroTitle')}</h1>
        <p className="mt-2 font-body-serif text-sm italic text-ink/60">{t('heroSubtitle')}</p>
        {streakNights > 0 && (
          <p className="mt-3 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-ink-muted">
            {t('streak', { n: streakNights })}
          </p>
        )}
      </header>

      <div className="relative mt-10 flex flex-col gap-4">
        {slots.map((slot) => (
          <article
            key={slot.slotId}
            className="relative overflow-hidden rounded-2xl border border-pearl-border/70 bg-white/80 shadow-[0_8px_32px_-20px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-shadow hover:shadow-[0_10px_36px_-18px_rgba(15,23,42,0.16)]"
          >
            <Link
              href={`/teraz?note=${encodeURIComponent(slot.urlKey)}`}
              className="absolute inset-0 z-0"
              aria-label={`${slot.noteName} — ${t('listen')}`}
            />
            <div
              className="relative z-[1] border-b border-pearl-border/50 px-4 py-2.5 pointer-events-none"
              style={{ backgroundColor: hexToRgba(slot.chromaHex, 0.06) }}
            >
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-ink-muted">
                {sectionLabel(slot.slotId)}
              </p>
            </div>
            <div className="relative z-[1] px-4 py-4">
              <div className="flex flex-wrap items-baseline gap-2 pointer-events-none">
                <span
                  className="font-mono text-lg font-bold tabular-nums"
                  style={{ color: slot.chromaHex }}
                >
                  {slot.noteShort}
                </span>
                <h2 className="font-body-serif text-lg font-normal leading-snug text-ink">{slot.noteName}</h2>
              </div>
              <p className="mt-3 font-body-serif text-[0.85rem] leading-relaxed text-ink/78 pointer-events-none">{slot.poeticLine}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="font-mono text-[0.58rem] tabular-nums text-ink-muted pointer-events-none">
                  {slot.frequency.toFixed(2)} Hz
                </span>
                <Link
                  href={`/teraz?note=${encodeURIComponent(slot.urlKey)}`}
                  className={cn(
                    'relative z-[2] inline-flex shrink-0 rounded-full px-5 py-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-92',
                  )}
                  style={{ backgroundColor: slot.chromaHex }}
                >
                  {t('listen')}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <RitualTeardropCard className="relative mt-14" />
    </main>
  )
}
