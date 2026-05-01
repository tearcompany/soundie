'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { trpc } from '@/lib/trpc/react'
import { cn } from '@/lib/utils'
import { hexToRgba } from '@/lib/hex-rgba'

interface Props {
  playerId: string
  locale?: 'en' | 'pl'
  className?: string
}

export function PlayerStats({ playerId, className }: Props) {
  const t = useTranslations('playerStats')

  const query = trpc.player.getStats.useQuery(
    { playerId },
    { enabled: Boolean(playerId), staleTime: 60_000, retry: false },
  )

  if (query.isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <p className="py-4 text-center font-mono text-[0.6rem] uppercase tracking-widest text-ink-muted/50">
          {t('loading')}
        </p>
      </div>
    )
  }

  const data = query.data
  if (!data || data.noteCount === 0) {
    return (
      <div className={cn('w-full', className)}>
        <p className="py-4 text-center font-body-serif text-sm italic text-ink/40">
          {t('noData')}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Top metrics row */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <MetricTile
          value={String(data.streakNights)}
          label={t('streak')}
          sub={data.streakNights === 1 ? t('streakNight') : t('streakNights')}
        />
        <MetricTile
          value={String(data.totalMinutes)}
          label={t('totalMins')}
          sub={t('minLabel')}
        />
        <MetricTile
          value={String(data.noteCount)}
          label={t('notesLabel')}
          sub={t('notesDiscovered')}
        />
      </div>

      {/* Per-note progress */}
      <div className="space-y-2.5">
        {data.notes.map((note) => (
          <NoteProgressRow key={note.noteId} note={note} t={t} />
        ))}
      </div>
    </div>
  )
}

function MetricTile({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-pearl-border/45 bg-white/60 px-3 py-4 text-center shadow-[0_2px_12px_-6px_rgba(15,23,42,0.08)]">
      <p className="font-mono text-[0.46rem] uppercase tracking-[0.2em] text-ink-muted/70">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-fraunces,serif)] text-2xl font-semibold tabular-nums text-ink leading-none">
        {value}
      </p>
      <p className="mt-1 font-mono text-[0.5rem] uppercase tracking-widest text-ink-muted/55">
        {sub}
      </p>
    </div>
  )
}

type NoteRow = {
  noteId: string
  noteShort: string
  noteName: string
  noteHex: string
  level: number
  totalMinutes: number
  loreUnlocked: number
  loreMax: number
  progressPercent: number
  nextLoreMinutes: number | null
  fullyUnlocked: boolean
}

function NoteProgressRow({ note, t }: { note: NoteRow; t: ReturnType<typeof useTranslations<'playerStats'>> }) {
  const c = note.noteHex

  return (
    <Link
      href={`/teraz?note=${encodeURIComponent(note.noteId)}`}
      className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-pearl-border/45 bg-white/65 px-4 py-3.5 shadow-[0_2px_12px_-8px_rgba(15,23,42,0.07)] transition-shadow hover:shadow-[0_4px_20px_-8px_rgba(15,23,42,0.12)]"
      style={{ borderLeftColor: hexToRgba(c, 0.55), borderLeftWidth: 3 }}
    >
      {/* Orb */}
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-fraunces,serif)] text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: c }}
      >
        {note.noteShort}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-[family-name:var(--font-fraunces,serif)] text-sm font-semibold text-ink group-hover:text-ink/90">
            {note.noteName}
          </p>
          <p className="font-mono text-[0.55rem] uppercase tracking-wide text-ink-muted/60">
            {t('levelLabel', { n: note.level })}
          </p>
        </div>

        {/* Lore progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-pearl-border/60">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
              style={{
                width: `${note.fullyUnlocked ? 100 : note.progressPercent}%`,
                backgroundColor: note.fullyUnlocked ? c : hexToRgba(c, 0.7),
              }}
            />
          </div>
          {/* Lore dot row */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: note.loreMax }).map((_, i) => (
              <span
                key={i}
                className="inline-block h-1.5 w-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    i < note.loreUnlocked
                      ? hexToRgba(c, 0.85)
                      : hexToRgba(c, 0.18),
                }}
              />
            ))}
          </div>
        </div>

        {/* Time + next unlock */}
        <p className="mt-1 font-mono text-[0.52rem] tabular-nums text-ink-muted/55">
          {note.totalMinutes}&nbsp;{t('minLabel')}
          {!note.fullyUnlocked && note.nextLoreMinutes != null && (
            <span className="ml-1.5 opacity-70">
              · {t('nextUnlock', { min: note.nextLoreMinutes })}
            </span>
          )}
          {note.fullyUnlocked && (
            <span className="ml-1.5" style={{ color: hexToRgba(c, 0.75) }}>
              · {t('fullyUnlocked')}
            </span>
          )}
        </p>
      </div>

      {/* Total mins bubble */}
      <div className="shrink-0 text-right">
        <p
          className="font-mono text-xs font-semibold tabular-nums"
          style={{ color: hexToRgba(c, 0.85) }}
        >
          ×{note.loreUnlocked}/{note.loreMax}
        </p>
        <p className="mt-0.5 font-mono text-[0.5rem] uppercase tracking-wide text-ink-muted/45">
          {t('loreLabel')}
        </p>
      </div>
    </Link>
  )
}
