'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { Link, usePathname } from '@/i18n/navigation'
import { EmotionBubblePack } from '@/components/sanctuary/emotion-bubble-pack'
import { NoteProgressCard } from '@/components/sanctuary/note-progress-card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

export function SanctuaryDashboard() {
  const t = useTranslations('sanctuary')
  const locale = useLocale() as 'en' | 'pl'
  const playerId = useSoundieStore((s) => s.playerId)
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const pathname = usePathname()
  const searchParams = useSearchParams()
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
      dayStartIso: bounds?.dayStartIso,
      dayEndIso: bounds?.dayEndIso,
      locale,
    },
    {
      enabled: hasHydrated && Boolean(playerId) && Boolean(bounds),
    },
  )
  const teardropMappedForNoteQuery = trpc.teardrop.getMappedForNote.useQuery(
    {
      playerId: playerId!,
      noteId: q.data?.todayClaim?.noteId ?? 'C',
      locale,
    },
    {
      enabled: hasHydrated && Boolean(playerId) && Boolean(q.data?.todayClaim?.noteId),
      staleTime: 15_000,
    },
  )
  const teardropProgressQuery = trpc.teardrop.getProgress.useQuery(
    {
      playerId: playerId!,
      noteId: q.data?.todayClaim?.noteId ?? 'C',
    },
    {
      enabled: hasHydrated && Boolean(playerId) && Boolean(q.data?.todayClaim?.noteId),
      staleTime: 15_000,
    },
  )

  const hasAnyTime = (q.data?.totalSecondsInRange ?? 0) > 0
  const hasNotes = (q.data?.soundieProgress.length ?? 0) > 0
  const todayClaimTrackRef = useRef<string | null>(null)
  const todayTeardropHref =
    q.data?.todayClaim?.teardrop?.slug
      ? (() => {
          const next = new URLSearchParams(searchParams.toString())
          next.set('teardrop', q.data.todayClaim.teardrop.slug)
          const qs = next.toString()
          return qs ? `${pathname}?${qs}` : pathname
        })()
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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 pb-16 text-ink">
      <p className="text-lora text-2xl font-light leading-tight text-ink">{t('greeting')}</p>
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
              <div className="mt-3 flex items-center gap-3">
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
            </div>
          )}

          {q.data.todayClaim?.teardrop && teardropProgressQuery.data && teardropMappedForNoteQuery.data && (() => {
            const mappedData = teardropMappedForNoteQuery.data
            const phaseTitleBySlug = Object.fromEntries(
              mappedData.phases.map((p) => [p.slug, locale === 'pl' ? p.titlePl : p.titleEn])
            )
            const phaseOrder = mappedData.phases.map((p) => p.slug)
            const groupsMap = new Map<string, typeof mappedData.cards>()
            for (const card of mappedData.cards) {
              const slug = card.phase ?? 'archetypes'
              if (!groupsMap.has(slug)) groupsMap.set(slug, [])
              groupsMap.get(slug)!.push(card)
            }
            const groups = [...groupsMap.entries()]
              .sort(([a], [b]) => {
                const ai = phaseOrder.indexOf(a)
                const bi = phaseOrder.indexOf(b)
                return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
              })
              .map(([slug, cards]) => ({
                slug,
                title: phaseTitleBySlug[slug] ?? slug,
                cards,
              }))
            return (
              <div className="lore-card border-0">
                <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
                  {t('teardropProgressTitle')}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="font-mono text-[0.68rem] uppercase tracking-wide text-ink-muted">
                    {t('teardropProgressUnlocked', {
                      n: mappedData.cards.length,
                      total: mappedData.totalCards,
                    })}
                  </p>
                  <p className="font-mono text-[0.68rem] text-ink-muted">
                    {t('teardropProgressXp', { xp: teardropProgressQuery.data.xp })}
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-pearl-border/70">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, mappedData.totalCards > 0 ? (mappedData.cards.length / mappedData.totalCards) * 100 : 0))}%`,
                      backgroundColor: '#FF6B4A',
                    }}
                  />
                </div>
                {groups.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {groups.map((group) => (
                      <div key={group.slug}>
                        <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ink">
                          {group.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {group.cards.map((card) => (
                            <span
                              key={card.id}
                              className="rounded-md border border-pearl-border bg-white/60 px-2 py-1 font-mono text-[0.6rem] lowercase text-ink/80"
                            >
                              {card.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {hasNotes && (
            <div>
              <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
                {t('notesTitle')}
              </h2>
              <p className="text-lora mt-1 text-sm text-ink/85">{t('notesHint')}</p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {q.data.soundieProgress.map((note) => (
                  <NoteProgressCard key={note.noteId} note={note} playerId={playerId ?? undefined} locale={locale} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
