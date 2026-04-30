'use client'

import { Suspense, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { SoundieRitualPanel } from '@/components/soundie-ritual-panel'
import { RitualTeardropCard } from '@/components/ritual-teardrop-card'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { hexToRgba } from '@/lib/hex-rgba'
import { cn } from '@/lib/utils'
import { getNoteById } from '@/lib/notes'
import { ALL_DUAL_RITUAL_IDS, DUAL_RITUAL_ENGINES, getDualRitualEngine, type RitualArchetypeKey } from '@/lib/soundie-rituals'

export function MinePage() {
  const router = useRouter()
  const t = useTranslations('minePage')
  const tToday = useTranslations('today')
  const locale = useLocale() as 'en' | 'pl'
  const playerId = useSoundieStore((s) => s.playerId)
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const activeRitualId = useSoundieStore((s) => s.activeRitualId)

  const onArmGoTeraz = useCallback(() => {
    router.push('/teraz')
  }, [router])

  const weekQuery = trpc.today.getWeek.useQuery(
    { playerId: playerId!, locale },
    { enabled: hasHydrated && Boolean(playerId), staleTime: 60_000 },
  )

  const sectionLabel = (slotId: string) => {
    switch (slotId) {
      case 'morning':
        return tToday('sections.morning')
      case 'relationships':
        return tToday('sections.relationships')
      case 'stress':
        return tToday('sections.stress')
      case 'soul':
        return tToday('sections.soul')
      default:
        return slotId
    }
  }

  const ritualTitle = (key: RitualArchetypeKey) =>
    t(`rituals.${key}.title` as 'rituals.warmth.title')

  if (!hasHydrated) return null

  if (!playerId) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-10 pb-16">
        <p className="text-lora text-center text-sm text-ink/75">{t('needPlayer')}</p>
        <Link
          href="/teraz"
          className="mx-auto mt-6 inline-block font-mono text-xs uppercase tracking-widest text-coral underline underline-offset-4"
        >
          {t('goPlay')}
        </Link>
      </main>
    )
  }

  const days = weekQuery.data?.days
  const ritualCfg = activeRitualId ? getDualRitualEngine(activeRitualId) : null
  const ritualEntryNote = ritualCfg ? getNoteById(ritualCfg.entryNoteId) : null
  const ritualDomNote = ritualCfg ? getNoteById(ritualCfg.dominantNoteId) : null

  return (
    <main className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 pb-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-pearl-dark/35 to-transparent"
        aria-hidden
      />

      <header className="relative">
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.26em] text-ink-muted">{t('kicker')}</p>
        <h1 className="mt-2 font-[family-name:var(--font-fraunces,serif)] text-2xl font-semibold tracking-tight text-ink">
          {t('ritualsTitle')}
        </h1>
        <p className="mt-2 text-lora text-sm text-ink/72">{t('ritualsHint')}</p>
      </header>

      <div className="relative mt-8 w-full">
        <Suspense fallback={null}>
          <SoundieRitualPanel
            openingNoteShort={getNoteById(activeNoteId)?.short ?? activeNoteId}
            noteUrlSync={false}
            onArmWarmth={onArmGoTeraz}
          />
        </Suspense>
      </div>

      <RitualTeardropCard className="relative mt-2" />

      <nav
        className="relative mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-pearl-border/45 pt-6"
        aria-label={t('ritualShortcutsAria')}
      >
        {ALL_DUAL_RITUAL_IDS.map((rid) => {
          const cfg = DUAL_RITUAL_ENGINES[rid]
          if (!cfg) return null
          return (
            <Link
              key={rid}
              href={`/teraz?ritual=${encodeURIComponent(rid)}`}
              className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink/60 underline-offset-4 transition-colors hover:text-ink"
            >
              {ritualTitle(cfg.ritualKey)}
            </Link>
          )
        })}
      </nav>

      {ritualCfg && ritualEntryNote && ritualDomNote && (
        <section className="relative mt-12" aria-labelledby="mine-week-listen-heading">
          <h2
            id="mine-week-listen-heading"
            className="font-[family-name:var(--font-fraunces,serif)] text-lg font-semibold tracking-tight text-ink"
          >
            {t('weekListenTitle')}
          </h2>
          <p className="mt-1.5 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-ink-muted">
            {t('weekListenRitualLine', { name: ritualTitle(ritualCfg.ritualKey) })}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/teraz?note=${encodeURIComponent(ritualEntryNote.urlKey)}`}
              className="inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-92 sm:min-w-[9.5rem]"
              style={{ backgroundColor: ritualEntryNote.chromaHex }}
            >
              {t('listen')} · {ritualEntryNote.short}
            </Link>
            <Link
              href={`/teraz?note=${encodeURIComponent(ritualDomNote.urlKey)}`}
              className="inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-92 sm:min-w-[9.5rem]"
              style={{ backgroundColor: ritualDomNote.chromaHex }}
            >
              {t('listen')} · {ritualDomNote.short}
            </Link>
          </div>
        </section>
      )}

      <header className="relative mt-14">
        <h2 className="font-[family-name:var(--font-fraunces,serif)] text-xl font-semibold tracking-tight text-ink">
          {t('weekTitle')}
        </h2>
      </header>

      {weekQuery.isLoading || !days ? (
        <p className="relative mt-8 text-center font-mono text-xs text-ink-muted">{t('loading')}</p>
      ) : (
        <section className="relative mt-8 flex flex-col gap-4">
          {days.map((day) => (
            <article
              key={day.dateKey}
              className={cn(
                'overflow-hidden rounded-2xl border bg-white/80 shadow-[0_8px_28px_-18px_rgba(15,23,42,0.1)] backdrop-blur-sm',
                day.isToday ? 'border-coral/45 ring-1 ring-coral/25' : 'border-pearl-border/70',
              )}
            >
              <div
                className="flex items-center justify-between gap-2 border-b border-pearl-border/45 px-4 py-2.5"
                style={{ backgroundColor: hexToRgba(day.heroOrbHex, 0.08) }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-semibold uppercase tracking-wide text-ink">
                    {day.weekdayLabel}
                  </span>
                  <span className="font-mono text-[0.58rem] tabular-nums text-ink-muted">{day.dateKey}</span>
                </div>
                {day.isToday && (
                  <span className="rounded-full bg-coral/15 px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-coral">
                    {t('todayMark')}
                  </span>
                )}
              </div>
              <div className="flex flex-col divide-y divide-pearl-border/50">
                {day.slots.map((slot) => (
                  <div key={`${day.dateKey}-${slot.slotId}`} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className="h-9 w-9 shrink-0 rounded-full border border-white/30 shadow-sm"
                      style={{ backgroundColor: slot.chromaHex }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-ink-muted">
                        {sectionLabel(slot.slotId)}
                      </p>
                      <p className="truncate font-mono text-sm font-semibold text-ink">
                        {slot.noteShort}{' '}
                        <span className="font-normal text-ink/75">· {slot.noteName}</span>
                      </p>
                    </div>
                    <Link
                      href={`/teraz?note=${encodeURIComponent(slot.urlKey)}`}
                      className="shrink-0 rounded-full px-3 py-1.5 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: slot.chromaHex }}
                    >
                      {t('listen')}
                    </Link>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
