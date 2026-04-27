'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { Link } from '@/i18n/navigation'
import { EmotionBubblePack } from '@/components/sanctuary/emotion-bubble-pack'
import { NoteProgressCard } from '@/components/sanctuary/note-progress-card'

export function SanctuaryDashboard() {
  const t = useTranslations('sanctuary')
  const locale = useLocale() as 'en' | 'pl'
  const playerId = useSoundieStore((s) => s.playerId)
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const [bounds, setBounds] = useState<{ dayStartIso: string; dayEndIso: string } | null>(null)

  useEffect(() => {
    const a = new Date()
    a.setHours(0, 0, 0, 0)
    const b = new Date()
    b.setHours(24, 0, 0, 0)
    setBounds({ dayStartIso: a.toISOString(), dayEndIso: b.toISOString() })
  }, [])

  const q = trpc.sanctuary.getDiagramData.useQuery(
    {
      playerId: playerId!,
      rangeDays: 14,
      dayStartIso: bounds?.dayStartIso,
      dayEndIso: bounds?.dayEndIso,
    },
    {
      enabled: hasHydrated && Boolean(playerId) && Boolean(bounds),
    },
  )

  const hasAnyTime = (q.data?.totalSecondsInRange ?? 0) > 0
  const hasNotes = (q.data?.soundieProgress.length ?? 0) > 0

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-16 text-ink">
      <p className="text-lora text-2xl font-light leading-tight text-ink">{t('greeting')}</p>
      <p className="text-lora mt-2 text-sm text-ink/80">{t('sub')}</p>

      {!playerId && hasHydrated && (
        <p className="text-lora mt-8 text-sm text-ink/80">
          {t('noPlayer')}{' '}
          <Link className="underline decoration-ink/25 underline-offset-2" href="/play">
            {t('goPlay')}
          </Link>
        </p>
      )}

      {playerId && (q.isLoading || !q.data) && (
        <p className="font-mono text-xs text-ink-muted mt-8">{t('loading')}</p>
      )}

      {q.data && (
        <div className="mt-10 space-y-10">

          {hasNotes && (
            <div>
              <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
                {t('notesTitle')}
              </h2>
              <p className="text-lora mt-1 text-sm text-ink/85">{t('notesHint')}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {q.data.soundieProgress.map((note) => (
                  <NoteProgressCard key={note.noteId} note={note} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
              {t('releaseTitle')}
            </h2>
            <p className="text-lora mt-1 text-sm text-ink/85">{t('releaseHint')}</p>
            {hasAnyTime ? (
              <div className="mt-4">
                <EmotionBubblePack
                  data={q.data.releaseByEmotion}
                  locale={locale}
                />
              </div>
            ) : (
              <p className="text-lora mt-4 text-sm text-ink/80">{t('emptyRelease')}</p>
            )}
          </div>

          {bounds && (
            <div className="lore-card border-0">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">{t('todayCard')}</p>
              <p className="text-lora mt-2 text-lg text-ink">
                {q.data.minutesToday != null
                  ? t('todayMinutes', { m: q.data.minutesToday })
                  : t('todayMinutesUnknown')}
              </p>
            </div>
          )}

        </div>
      )}

      <p className="text-lora mt-12 text-center text-xs text-ink/50">{t('law')}</p>
    </div>
  )
}
