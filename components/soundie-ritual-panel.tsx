'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNoteSelection } from '@/hooks/use-soundie-query'
import { getNoteById } from '@/lib/notes'
import { useSoundieStore } from '@/lib/soundie-store'
import {
  dualRitualFeaturedForBrowse,
  ritualDurationSeconds,
  type RitualArchetypeKey,
} from '@/lib/soundie-rituals'

export function SoundieRitualPanel({
  openingNoteShort,
  onArmWarmth,
  noteUrlSync = true,
}: {
  openingNoteShort: string
  onArmWarmth?: () => void
  noteUrlSync?: boolean
}) {
  const t = useTranslations('soundieRituals')
  const { setNote } = useNoteSelection()
  const activeRitualId = useSoundieStore((s) => s.activeRitualId)
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const setActiveNote = useSoundieStore((s) => s.setActiveNote)
  const setActiveRitualId = useSoundieStore((s) => s.setActiveRitualId)
  const sessionActive = useSoundieStore((s) => s.currentSession.active)

  const featured = useMemo(
    () => dualRitualFeaturedForBrowse(activeNoteId, activeRitualId),
    [activeNoteId, activeRitualId],
  )

  const armed = Boolean(activeRitualId && activeRitualId === featured.id)
  const rk = featured.ritualKey as RitualArchetypeKey

  const copy = (
    suffix:
      | 'title'
      | 'subtitle'
      | 'description'
      | 'phaseLine'
      | 'durationLine'
      | 'ctaArm'
      | 'awaitingPlay',
  ) => t(`${rk}.${suffix}` as 'warmth.title')

  const entry = getNoteById(featured.entryNoteId)
  const dominant = getNoteById(featured.dominantNoteId)
  const mins = Math.floor(ritualDurationSeconds(featured.id) / 60)

  return (
    <div className="mx-auto mb-10 w-full max-w-lg rounded-2xl border border-pearl-border/70 bg-pearl-dark/25 px-4 py-5">
      <div className="grid grid-cols-2 grid-rows-1 gap-x-4 items-start">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-ink-muted/70 text-left">
          {t('microKickerLabel', { name: copy('title') })}
        </p>
        <div className="text-right">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-ink-muted/70">
            {t('openingNoteColumn')}
          </p>
          <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-ink tabular-nums">
            {openingNoteShort}
          </p>
        </div>
      </div>
      <div className="mt-6 text-center">
        <h3 className="font-[family-name:var(--font-fraunces,serif)] text-lg font-semibold tracking-tight text-ink mt-2">
          {copy('title')}
        </h3>
        <p className="mt-1.5 font-mono text-xs text-ink-muted/85">{copy('subtitle')}</p>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/88">{copy('description')}</p>
        <p className="mt-4 font-mono text-[0.62rem] text-ink-muted/70">{copy('phaseLine')}</p>
        <p className="mt-1.5 font-mono text-[0.62rem] text-ink-muted/80">{copy('durationLine')}</p>
        {!armed ? (
          <Button
            type="button"
            variant="outline"
            className={cn(
              'mt-5 w-full max-w-xs border-dashed py-6 font-mono text-xs uppercase tracking-[0.2em]',
            )}
            onClick={() => {
              if (noteUrlSync) {
                setNote(featured.entryNoteId)
              } else {
                setActiveNote(featured.entryNoteId)
              }
              setActiveRitualId(featured.id)
              onArmWarmth?.()
            }}
            disabled={sessionActive}
          >
            {copy('ctaArm')}
          </Button>
        ) : (
          <div className="mt-5 space-y-2">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-coral/90">
              {copy('awaitingPlay')} · {mins} {t('minutesShort')}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-muted"
              onClick={() => setActiveRitualId(null)}
            >
              {t('cancelArm')}
            </Button>
          </div>
        )}
        {entry && dominant && (
          <p className="mt-4 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-muted/55">
            {t('pairLine', { f: entry.short, a: dominant.short })}
          </p>
        )}
        <p className="mt-6 font-mono text-[0.55rem] leading-relaxed text-ink-muted/60">{t('roadmapLine')}</p>
        <p className="mt-4 whitespace-pre-line font-body-serif text-xs italic leading-relaxed text-ink-muted/75">
          {t('miriamQuote')}
        </p>
      </div>
    </div>
  )
}
