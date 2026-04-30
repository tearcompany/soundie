'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { Link, useRouter } from '@/i18n/navigation'
import { EmotionBubblePack } from '@/components/sanctuary/emotion-bubble-pack'
import { NoteProgressCard } from '@/components/sanctuary/note-progress-card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { EchoMomentFly } from '@/components/echo-moment-fly'
import { useEchoMomentTrigger } from '@/hooks/use-echo-moment-trigger'
import { NoteHeatmap } from '@/components/sanctuary/note-heatmap'
import { SanctuaryTodaySequence } from '@/components/sanctuary/sanctuary-today-sequence'
import { SanctuaryPulse } from '@/components/sanctuary/sanctuary-pulse'

export function SanctuaryDashboard() {
  const t = useTranslations('sanctuary')
  const te = useTranslations('echoMoment')
  const locale = useLocale() as 'en' | 'pl'
  const playerId = useSoundieStore((s) => s.playerId)
  const { shouldShow: showEchoMoment, acknowledge: dismissEchoMoment } = useEchoMomentTrigger()
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const searchParams = useSearchParams()
  const highlightTeardropSlug = searchParams.get('teardrop')
  const router = useRouter()
  const [bounds, setBounds] = useState<{ dayStartIso: string; dayEndIso: string } | null>(null)
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'done' | 'copied' | 'failed'>('idle')
  const trackEvent = trpc.analytics.record.useMutation()

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
      heatmapDays: 84,
      dayStartIso: bounds?.dayStartIso,
      dayEndIso: bounds?.dayEndIso,
      locale,
    },
    {
      enabled: hasHydrated && Boolean(playerId) && Boolean(bounds),
    },
  )
  const mindfulStatsQuery = trpc.mindfulMoment.getStats.useQuery(
    { playerId: playerId! },
    { enabled: hasHydrated && Boolean(playerId), staleTime: 60_000 },
  )

  const hasAnyTime = (q.data?.totalSecondsInRange ?? 0) > 0
  const hasNotes = (q.data?.soundieProgress.length ?? 0) > 0
  const todayClaimTrackRef = useRef<string | null>(null)
  const todayTeardropHref = q.data?.todayClaim?.teardrop?.slug
    ? `/teardrop?teardrop=${encodeURIComponent(q.data.todayClaim.teardrop.slug)}`
    : null

  const onShareToday = async () => {
    if (!playerId || !q.data) return
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = t('shareTitle')
    const text = t('shareText', { m: q.data.minutesToday ?? 0 })
    const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    trackEvent.mutate({
      name: 'share_click',
      playerId,
      meta: { surface: 'sanctuary_today_card', hasNativeShare },
    })

    if (hasNativeShare) {
      try {
        await navigator.share({ title, text, url })
        trackEvent.mutate({
          name: 'share_complete',
          playerId,
          meta: { surface: 'sanctuary_today_card', method: 'web_share' },
        })
        setShareFeedback('done')
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
      }
    }

    try {
      if (!url) throw new Error('missing_url')
      await navigator.clipboard.writeText(url)
      trackEvent.mutate({
        name: 'share_copy_fallback',
        playerId,
        meta: { surface: 'sanctuary_today_card' },
      })
      trackEvent.mutate({
        name: 'share_complete',
        playerId,
        meta: { surface: 'sanctuary_today_card', method: 'clipboard_copy' },
      })
      setShareFeedback('copied')
    } catch {
      setShareFeedback('failed')
    }
  }

  useEffect(() => {
    if (!playerId || !q.data?.todayClaim?.teardrop) return
    const key = `${playerId}:${q.data.todayClaim.claimDate}:${q.data.todayClaim.teardrop.id}`
    if (todayClaimTrackRef.current === key) return
    todayClaimTrackRef.current = key
    trackEvent.mutate({
      name: 'teardrop_open',
      playerId,
      meta: {
        surface: 'sanctuary_card',
        noteId: q.data.todayClaim.noteId,
        claimDate: q.data.todayClaim.claimDate,
        teardropId: q.data.todayClaim.teardrop.id,
        teardropSlug: q.data.todayClaim.teardrop.slug,
        teardropEmotionId: q.data.todayClaim.teardrop.emotionId ?? null,
      },
    })
  }, [playerId, q.data?.todayClaim, trackEvent])

  useEffect(() => {
    if (!highlightTeardropSlug) return
    router.replace(
      `/teardrop?teardrop=${encodeURIComponent(highlightTeardropSlug)}`
    )
  }, [highlightTeardropSlug, router])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-16 text-ink">
      <p className="text-lora text-2xl font-light leading-tight text-ink">{t('greeting')}</p>
      {playerId && q.data && (
        <SanctuaryPulse
          className="mt-4"
          emotions={q.data.releaseByEmotion}
          soundieProgress={q.data.soundieProgress}
          locale={locale}
          todayTeardropName={q.data.todayClaim?.teardrop?.name ?? null}
          todayNoteId={q.data.todayClaim?.noteId ?? null}
        />
      )}
      {playerId && q.data && (
        <div className="lore-card mt-4 border-0 space-y-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
            {t('todayStateTitle')}
          </p>
          <p className="text-lora text-sm leading-relaxed text-ink/85">{t('todayStateHint')}</p>
          {q.data.minutesToday != null && (
            <p className="text-lora text-sm text-ink/90">
              {t('todayStateMinutes', { m: q.data.minutesToday })}
            </p>
          )}
          {q.data.dominantNoteName && (
            <p className="text-lora text-sm text-ink/90">
              {t('todayStateDominant', { note: q.data.dominantNoteName })}
            </p>
          )}
          {q.data.favoriteNoteName && (
            <p className="text-lora text-sm text-ink/90">
              {t('todayStateFavorite', { note: q.data.favoriteNoteName })}
            </p>
          )}
          <Link
            href="/today"
            className="inline-block font-mono text-[0.62rem] uppercase tracking-widest text-coral underline decoration-coral/35 underline-offset-4 hover:opacity-90"
          >
            {t('todayStateCta')}
          </Link>
        </div>
      )}
      {q.data?.todayClaim?.teardrop ? (
        <div className="lore-card mt-3 border-0">
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
            {t('todayTeardropTitle')}
          </p>
          <HoverCard openDelay={120} closeDelay={90}>
            <HoverCardTrigger asChild>
              {todayTeardropHref ? (
                <Link
                  href={todayTeardropHref}
                  className="mt-2 inline-block text-lora text-lg text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink/55"
                >
                  {q.data.todayClaim.teardrop.name}
                </Link>
              ) : (
                <p className="mt-2 text-lora text-lg text-ink underline decoration-ink/20 underline-offset-4">
                  {q.data.todayClaim.teardrop.name}
                </p>
              )}
            </HoverCardTrigger>
            <HoverCardContent
              align="start"
              className="w-80 border-pearl-border/70 bg-pearl/70 p-3 backdrop-blur-md"
            >
              {q.data.todayClaim.teardrop.tagline && (
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink-muted">
                  {q.data.todayClaim.teardrop.tagline}
                </p>
              )}
              {q.data.todayClaim.teardrop.affirmation && (
                <p className="mt-2 text-lora text-sm italic leading-relaxed text-ink/90">
                  {q.data.todayClaim.teardrop.affirmation}
                </p>
              )}
              {q.data.todayClaim.teardrop.meaningUpright && (
                <div className="mt-3">
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                    {t('todayTeardropLight')}
                  </p>
                  <p className="mt-1 font-mono line-clamp-3 whitespace-pre-line text-[0.68rem] leading-relaxed text-ink/85">
                    {q.data.todayClaim.teardrop.meaningUpright}
                  </p>
                </div>
              )}
              {q.data.todayClaim.teardrop.meaningShadow && (
                <div className="mt-3">
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                    {t('todayTeardropShadow')}
                  </p>
                  <p className="mt-1 font-mono line-clamp-3 whitespace-pre-line text-[0.68rem] leading-relaxed text-ink/75">
                    {q.data.todayClaim.teardrop.meaningShadow}
                  </p>
                </div>
              )}
            </HoverCardContent>
          </HoverCard>
          {q.data.todayClaim.teardrop.tagline && (
            <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-wide text-ink-muted">
              {q.data.todayClaim.teardrop.tagline}
            </p>
          )}
          {q.data.todayClaim.teardrop.affirmation && (
            <p className="mt-2 text-lora text-sm italic leading-relaxed text-ink/85">
              {q.data.todayClaim.teardrop.affirmation}
            </p>
          )}
        </div>
      ) : (
        <p className="text-lora mt-2 text-sm text-ink/80">{t('sub')}</p>
      )}

      {!playerId && hasHydrated && (
        <p className="text-lora mt-8 text-sm text-ink/80">
          {t('noPlayer')}{' '}
          <Link className="underline decoration-ink/25 underline-offset-2" href="/teraz">
            {t('goPlay')}
          </Link>
        </p>
      )}

      {playerId && (q.isLoading || !q.data) && (
        <p className="font-mono text-xs text-ink-muted mt-8">{t('loading')}</p>
      )}

      {playerId && hasHydrated && (
        <div className="mt-10">
          <SanctuaryTodaySequence />
        </div>
      )}

      {q.data && (
        <div className="mt-10 space-y-10">

          <div>
            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={onShareToday}
                className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted underline decoration-ink/30 underline-offset-4 hover:text-ink"
              >
                {t('shareCta')}
              </button>
              {shareFeedback !== 'idle' && (
                <p className="text-lora text-xs text-ink/70">
                  {shareFeedback === 'done'
                    ? t('shareDone')
                    : shareFeedback === 'copied'
                      ? t('shareCopied')
                      : t('shareFailed')}
                </p>
              )}
            </div>
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

          {q.data.recentSessions.length > 0 && (
            <div className="lore-card border-0">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
                {t('sacredArchiveTitle')}
              </p>
              <p className="text-lora mt-1 text-sm text-ink/80">{t('sacredArchiveHint')}</p>
              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-lora text-sm text-ink/90">
                {q.data.recentSessions.map((row) => (
                  <li key={`${row.completedAtIso}-${row.noteId}`} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-pearl-border/50 pb-2 last:border-0">
                    <span>
                      {new Date(row.completedAtIso).toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {row.noteName}
                    </span>
                    <span className="font-mono text-[0.65rem] text-ink-muted">
                      {t('archiveMinutes', { m: row.minutes })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {q.data.noteHeatmap.notes.length > 0 && (
            <div>
              <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
                {locale === 'pl' ? 'Aktywność nut · 12 tygodni' : 'Note activity · 12 weeks'}
              </h2>
              <div className="mt-3 rounded-xl border border-pearl-border bg-pearl-dark px-4 py-4">
                <NoteHeatmap
                  cells={q.data.noteHeatmap.cells}
                  notes={q.data.noteHeatmap.notes}
                  days={84}
                  locale={locale}
                />
              </div>
            </div>
          )}

          {hasNotes && (
            <div>
              <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
                {t('notesTitle')}
              </h2>
              <p className="text-lora mt-1 text-sm text-ink/85">{t('notesHint')}</p>
              <p className="text-lora mt-1 text-xs text-ink/65">{t('notesHintGarden')}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {q.data.soundieProgress.map((note) => (
                  <NoteProgressCard
                    key={note.noteId}
                    note={note}
                    playerId={playerId ?? undefined}
                    locale={locale}
                    isFavorite={q.data.favoriteNoteId === note.noteId}
                  />
                ))}
              </div>
            </div>
          )}

          {playerId && mindfulStatsQuery.data && (
            <div>
              <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
                {te('momentsTitle')}
              </h2>
              {mindfulStatsQuery.data.count === 0 ? (
                <p className="text-lora mt-2 text-sm text-ink/60">{te('momentsNone')}</p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-muted">
                      {te('momentsWitnessed')}
                    </p>
                    <p className="mt-0.5 text-lora text-2xl text-ink">{mindfulStatsQuery.data.count}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-muted">
                      {te('momentsLastVisitor')}
                    </p>
                    <p className="mt-0.5 text-lora text-sm text-ink/80">
                      {mindfulStatsQuery.data.lastType === 'fly' ? te('momentsFly') : (mindfulStatsQuery.data.lastType ?? '—')}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-ink-muted">
                      {te('momentsStillness')}
                    </p>
                    <p className="mt-0.5 text-lora text-sm text-ink/80">
                      {te('momentsStillnessValue', { n: mindfulStatsQuery.data.totalMinutes })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {showEchoMoment && <EchoMomentFly onDismiss={dismissEchoMoment} />}
    </div>
  )
}
