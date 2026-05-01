'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { trpc } from '@/lib/trpc/react'
import { cn } from '@/lib/utils'
import { hexToRgba } from '@/lib/hex-rgba'

const SHADOW_MOODS = new Set(['anxious', 'numb', 'heavy', 'scattered'])

const ENERGY_TONE_PL: Record<string, string> = {
  grounding: 'zakorzenienie',
  clarifying: 'klarowność',
  warming: 'ciepło',
  opening: 'otwieranie',
  cooling: 'kojenie',
  uplifting: 'wzniesienie',
}

interface Props {
  playerId: string
  locale?: 'en' | 'pl'
  lookbackDays?: number
  className?: string
}

type NoteJourney = {
  noteId: string
  noteShort: string
  noteName: string
  noteHex: string
  synestheticLine: string
  totalMinutes: number
  totalSessions: number
  treats: string[]
  heals: string[]
  transforms: string[]
  energyTone: string
  shortMeaning: string
  archetype: string
  moodBeforeCounts: Record<string, number>
  moodAfterCounts: Record<string, number>
  healingMoments: number
  shadowSessions: number
  lightSessions: number
}

function NoteJourneyCard({
  journey,
  locale,
  expanded,
  onToggle,
}: {
  journey: NoteJourney
  locale: 'en' | 'pl'
  expanded: boolean
  onToggle: () => void
}) {
  const t = useTranslations('healingJourney')
  const c = journey.noteHex

  // Which shadow moods appear in this note's sessions
  const shadowsBrought = Object.entries(journey.moodBeforeCounts)
    .filter(([mood]) => SHADOW_MOODS.has(mood))
    .sort((a, b) => b[1] - a[1])

  const lightReceived = Object.entries(journey.moodAfterCounts)
    .filter(([mood]) => !SHADOW_MOODS.has(mood))
    .sort((a, b) => b[1] - a[1])

  const tonePl = locale === 'pl' ? (ENERGY_TONE_PL[journey.energyTone] ?? journey.energyTone) : journey.energyTone

  const totalMins = Math.round(journey.totalMinutes)

  return (
    <article
      className="overflow-hidden rounded-2xl border border-pearl-border/45 bg-white/70 shadow-[0_4px_20px_-10px_rgba(15,23,42,0.1)] backdrop-blur-sm"
      style={{ borderLeftColor: hexToRgba(c, 0.6), borderLeftWidth: 3 }}
    >
      {/* Header — always visible */}
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-fraunces,serif)] text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: c }}
          >
            {journey.noteShort}
          </span>
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-fraunces,serif)] text-base font-semibold leading-tight text-ink">
              {journey.noteName}
            </p>
            <p className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-ink-muted">
              {tonePl}
              {journey.healingMoments > 0 && (
                <span className="ml-2" style={{ color: hexToRgba(c, 0.85) }}>
                  · {t('healedMoments', { n: journey.healingMoments })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-lg font-semibold tabular-nums text-ink/80">
            {totalMins}
            <span className="ml-0.5 text-xs font-normal text-ink-muted">min</span>
          </p>
          <p className="font-mono text-[0.55rem] uppercase tracking-widest text-ink-muted/60">
            {journey.totalSessions}× {t('sessions')}
          </p>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-pearl-border/40 px-4 pb-5 pt-4 space-y-5">

          {/* Short meaning */}
          {journey.shortMeaning && (
            <p className="font-body-serif text-sm italic leading-relaxed text-ink/75">
              „{journey.shortMeaning}"
            </p>
          )}

          {/* Shadows brought */}
          {shadowsBrought.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[0.5rem] uppercase tracking-[0.2em] text-ink-muted/70">
                {t('shadowBrought')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {shadowsBrought.map(([mood, count]) => (
                  <span
                    key={mood}
                    className="inline-flex items-center gap-1 rounded-full bg-ink/8 px-2.5 py-1 font-mono text-[0.6rem] text-ink/70"
                  >
                    {t(`mood.${mood}` as 'mood.anxious')}
                    <span className="text-ink/40">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note treats (what it addresses) */}
          {journey.treats.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[0.5rem] uppercase tracking-[0.2em] text-ink-muted/70">
                {t('shadowsTreated')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {journey.treats.slice(0, 5).map((treat) => (
                  <span
                    key={treat}
                    className="rounded-full border px-2.5 py-1 font-mono text-[0.6rem] text-ink/65"
                    style={{ borderColor: hexToRgba(c, 0.3), backgroundColor: hexToRgba(c, 0.07) }}
                  >
                    {treat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Light received (mood after) */}
          {lightReceived.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[0.5rem] uppercase tracking-[0.2em] text-ink-muted/70">
                {t('lightReceived')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lightReceived.map(([mood, count]) => (
                  <span
                    key={mood}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[0.6rem] text-white/90"
                    style={{ backgroundColor: hexToRgba(c, 0.72) }}
                  >
                    {t(`mood.${mood}` as 'mood.hopeful')}
                    <span className="opacity-70">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What this note heals (profile) */}
          {journey.heals.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[0.5rem] uppercase tracking-[0.2em] text-ink-muted/70">
                {t('lightAura')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {journey.heals.slice(0, 5).map((heal) => (
                  <span
                    key={heal}
                    className="rounded-full px-2.5 py-1 font-mono text-[0.6rem]"
                    style={{
                      backgroundColor: hexToRgba(c, 0.12),
                      color: hexToRgba(c, 0.88),
                    }}
                  >
                    {heal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Transformation */}
          {journey.transforms.length > 0 && (
            <div className="rounded-xl border border-pearl-border/30 bg-pearl-dark/15 px-3 py-3">
              <p className="mb-1.5 font-mono text-[0.48rem] uppercase tracking-[0.2em] text-ink-muted/60">
                {t('transforms')}
              </p>
              <ul className="space-y-1">
                {journey.transforms.slice(0, 3).map((tr) => (
                  <li key={tr} className="font-body-serif text-[0.78rem] italic text-ink/68">
                    {tr}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Synesthetic line */}
          {journey.synestheticLine && (
            <p
              className="font-mono text-[0.55rem] uppercase tracking-[0.16em]"
              style={{ color: hexToRgba(c, 0.65) }}
            >
              {journey.synestheticLine}
            </p>
          )}
        </div>
      )}
    </article>
  )
}

export function HealingJourney({ playerId, locale = 'pl', lookbackDays = 60, className }: Props) {
  const t = useTranslations('healingJourney')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const query = trpc.resonance.getHealingJourney.useQuery(
    { playerId, locale, lookbackDays },
    { enabled: Boolean(playerId), staleTime: 120_000, retry: false },
  )

  const journeys = query.data?.noteJourneys ?? []
  const totalHealingMoments = journeys.reduce((s, j) => s + j.healingMoments, 0)
  const totalMins = Math.round(journeys.reduce((s, j) => s + j.totalMinutes, 0))

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="mb-4">
        <p className="font-mono text-[0.5rem] uppercase tracking-[0.24em] text-ink-muted">
          {t('kicker')}
        </p>
        <h3 className="mt-0.5 font-[family-name:var(--font-fraunces,serif)] text-xl font-semibold tracking-tight text-ink">
          {t('title')}
        </h3>
        {totalMins > 0 && (
          <p className="mt-1.5 font-body-serif text-sm text-ink/60">
            {t('summary', { minutes: totalMins, healed: totalHealingMoments })}
          </p>
        )}
      </div>

      {query.isLoading && (
        <p className="py-6 text-center font-mono text-[0.6rem] uppercase tracking-widest text-ink-muted/55">
          {t('loading')}
        </p>
      )}

      {!query.isLoading && journeys.length === 0 && (
        <p className="py-6 text-center font-body-serif text-sm italic text-ink/45">
          {t('noData')}
        </p>
      )}

      {journeys.length > 0 && (
        <div className="flex flex-col gap-3">
          {journeys.map((j) => (
            <NoteJourneyCard
              key={j.noteId}
              journey={j}
              locale={locale}
              expanded={expandedId === j.noteId}
              onToggle={() => setExpandedId((prev) => (prev === j.noteId ? null : j.noteId))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
