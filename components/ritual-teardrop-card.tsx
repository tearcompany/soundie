'use client'

import { useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { getNoteById } from '@/lib/notes'
import { hexToRgba } from '@/lib/hex-rgba'
import { cn } from '@/lib/utils'
import type { RitualArchetypeKey } from '@/lib/soundie-rituals'
import type { Ritual } from '@/lib/validators/ritual'

const MAX_TEARDROP_CARDS = 6

function formatSessionDate(date: Date | string, locale: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

function ritualKeyFromTone(id: string, tone: string): RitualArchetypeKey {
  const candidate = tone.trim().toLowerCase() || id.split('_')[0] || ''
  if (candidate === 'warmth') return 'warmth'
  if (candidate === 'clarity' || candidate === 'clarifying') return 'clarity'
  if (candidate === 'grounding') return 'grounding'
  if (candidate === 'energy' || candidate === 'uplifting') return 'energy'
  if (candidate === 'release' || candidate === 'cooling') return 'release'
  return 'warmth'
}

type TeardropCardSlim = {
  id: string
  name: string
  slug: string
  phase: string | null
}

function RitualCard({
  ritual,
  playerId,
  locale,
}: {
  ritual: Ritual
  playerId: string
  locale: 'en' | 'pl'
}) {
  const t = useTranslations('ritualCard')
  const tToday = useTranslations('today')
  const tMine = useTranslations('minePage')
  const router = useRouter()
  const setActiveRitualId = useSoundieStore((s) => s.setActiveRitualId)
  const setActiveNote = useSoundieStore((s) => s.setActiveNote)
  const sessionActive = useSoundieStore((s) => s.currentSession.active)
  const key = ritualKeyFromTone(ritual.id, ritual.energyTone)

  const armAndPlay = useCallback(() => {
    if (!ritual.phases.length) return
    const sorted = [...ritual.phases].sort((a, b) => a.untilSec - b.untilSec)
    const entryNoteId = sorted[0]?.noteIds[0] ?? ritual.notes[0]
    if (!entryNoteId) return
    setActiveNote(entryNoteId)
    setActiveRitualId(ritual.id)
    router.push('/teraz')
  }, [ritual, setActiveNote, setActiveRitualId, router])
  const sortedPhases = useMemo(
    () => [...ritual.phases].sort((a, b) => a.untilSec - b.untilSec),
    [ritual.phases],
  )
  const entryId = sortedPhases[0]?.noteIds[0] ?? ritual.notes[0]
  const dominantId = ritual.dominantNote
  const entry = entryId ? getNoteById(entryId) : null
  const dominant = dominantId ? getNoteById(dominantId) : null

  const teardropQuery = trpc.teardrop.getMappedForNote.useQuery(
    { noteId: dominantId, locale, playerId },
    { enabled: Boolean(playerId) && Boolean(dominantId), staleTime: 60_000, retry: false },
  )

  const sessionsQuery = trpc.soundie.getSessions.useQuery(
    { playerId, noteId: dominantId },
    { enabled: Boolean(playerId) && Boolean(dominantId), staleTime: 30_000, retry: false },
  )

  const teardropCards: TeardropCardSlim[] = useMemo(() => {
    const cards = teardropQuery.data?.cards ?? []
    return cards.slice(0, MAX_TEARDROP_CARDS)
  }, [teardropQuery.data?.cards])

  const recentSessions = useMemo(() => {
    return (sessionsQuery.data?.sessions ?? []).slice(0, 4)
  }, [sessionsQuery.data?.sessions])

  const totalMinutes = useMemo(() => {
    const secs = sessionsQuery.data?.totalSeconds ?? 0
    return Math.floor(secs / 60)
  }, [sessionsQuery.data?.totalSeconds])

  if (!entry || !dominant) return null

  return (
    <article
      className="overflow-hidden rounded-2xl border border-pearl-border/60 bg-white/75 shadow-[0_4px_24px_-12px_rgba(15,23,42,0.09)] backdrop-blur-sm"
    >
      <div className="flex h-1 w-full">
        <div className="flex-1" style={{ backgroundColor: hexToRgba(entry.chromaHex, 0.75) }} aria-hidden />
        <div className="flex-1" style={{ backgroundColor: hexToRgba(dominant.chromaHex, 0.75) }} aria-hidden />
      </div>

      <div className="px-4 pt-4 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[0.6rem] font-bold text-white shadow-sm"
            style={{ backgroundColor: entry.chromaHex }}
          >
            {entry.short}
          </span>
          <span className="font-mono text-[0.52rem] text-ink-muted/65">+</span>
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[0.6rem] font-bold text-white shadow-sm"
            style={{ backgroundColor: dominant.chromaHex }}
          >
            {dominant.short}
          </span>
          <p className="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-ink">
            {tToday(`rituals.${key}.title` as 'rituals.warmth.title')}
          </p>
        </div>

        <p className="mt-2 font-body-serif text-[0.82rem] leading-relaxed text-ink/68">
          {tToday(`rituals.${key}.line` as 'rituals.warmth.line')}
        </p>

        {sortedPhases.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-1.5 gap-y-1 items-center">
            <span className="font-mono text-[0.52rem] uppercase tracking-[0.16em] text-ink-muted/70">
              {t('phases')}
            </span>
            {sortedPhases.map((phase, i) => (
              <span key={phase.id} className="flex items-center gap-x-1.5">
                {i > 0 && <span className="text-ink-muted/40 font-mono text-[0.5rem]">·</span>}
                <span className="font-mono text-[0.58rem] text-ink/65 lowercase">
                  {phase.name}
                </span>
              </span>
            ))}
          </div>
        )}

        {teardropCards.length > 0 && (
          <div className="mt-3 border-t border-pearl-border/40 pt-3">
            <p className="mb-1.5 font-mono text-[0.52rem] uppercase tracking-[0.16em] text-ink-muted/70">
              {t('teardropLinked')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {teardropCards.map((card) => (
                <span
                  key={card.id}
                  className="rounded-md border border-pearl-border/55 px-2 py-0.5 font-mono text-[0.58rem] lowercase tracking-wide text-ink/62"
                  style={{ borderColor: hexToRgba(dominant.chromaHex, 0.28) }}
                >
                  {card.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {teardropQuery.isSuccess && teardropCards.length === 0 && (
          <p className="mt-3 font-mono text-[0.58rem] text-ink-muted/55 italic">
            {t('noCards')}
          </p>
        )}

        <div className="mt-4 border-t border-pearl-border/40 pt-3.5">
          <p className="mb-2.5 font-mono text-[0.56rem] uppercase tracking-[0.2em] text-ink-muted/75">
            {tMine('weekListenRitualLine', {
              name: tToday(`rituals.${key}.title` as 'rituals.warmth.title'),
            })}
          </p>
          <div className="flex gap-2.5">
            <Link
              href={`/teraz?note=${encodeURIComponent(entry.urlKey)}`}
              onClick={() => {
                setActiveNote(entry.id)
                setActiveRitualId(ritual.id)
              }}
              className="inline-flex flex-1 items-center justify-center rounded-full px-4 py-2.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: entry.chromaHex }}
            >
              {tMine('listen')} · {entry.short}
            </Link>
            <Link
              href={`/teraz?note=${encodeURIComponent(dominant.urlKey)}`}
              onClick={() => {
                setActiveNote(dominant.id)
                setActiveRitualId(ritual.id)
              }}
              className="inline-flex flex-1 items-center justify-center rounded-full px-4 py-2.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: dominant.chromaHex }}
            >
              {tMine('listen')} · {dominant.short}
            </Link>
          </div>
          <div className="mt-2.5 text-center">
            <button
              type="button"
              disabled={sessionActive}
              onClick={armAndPlay}
              className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink-muted/70 transition-colors hover:text-ink disabled:opacity-40"
            >
              {t('enter')}
            </button>
          </div>
        </div>

        {sessionsQuery.isSuccess && (totalMinutes > 0 || recentSessions.length > 0) && (
          <div className="mt-3 border-t border-pearl-border/30 pt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            {totalMinutes > 0 && (
              <span className="font-mono text-[0.55rem] tabular-nums text-ink-muted/60">
                {totalMinutes} {t('minutesShort')}
              </span>
            )}
            {recentSessions.map((s) => (
              <span
                key={s.id}
                className="font-mono text-[0.55rem] tabular-nums text-ink-muted/45"
              >
                {formatSessionDate(s.completedAt, locale)}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

type RitualTeardropCardProps = {
  className?: string
}

export function RitualTeardropCard({ className }: RitualTeardropCardProps) {
  const t = useTranslations('ritualCard')
  const locale = useLocale() as 'en' | 'pl'
  const playerId = useSoundieStore((s) => s.playerId)
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)

  const ritualQuery = trpc.ritual.list.useQuery(undefined, {
    enabled: hasHydrated,
    staleTime: 60_000,
    retry: false,
  })

  const rituals = ritualQuery.data ?? []

  if (!hasHydrated || !playerId) return null

  if (ritualQuery.isPending) {
    return (
      <div className={cn('mx-auto w-full max-w-lg animate-pulse', className)}>
        <div className="h-32 rounded-2xl bg-pearl-dark/25" />
      </div>
    )
  }

  if (rituals.length === 0) return null

  return (
    <section className={cn('mx-auto w-full max-w-lg', className)} aria-label={t('sectionLabel')}>
      <header className="mb-4">
        <p className="font-mono text-[0.56rem] uppercase tracking-[0.26em] text-ink-muted/80">
          {t('subtitle')}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-fraunces,serif)] text-xl font-semibold tracking-tight text-ink">
          {t('title')}
        </h2>
      </header>
      <div className="flex flex-col gap-3">
        {rituals.map((ritual) => (
          <RitualCard
            key={ritual.id}
            ritual={ritual}
            playerId={playerId}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
}
