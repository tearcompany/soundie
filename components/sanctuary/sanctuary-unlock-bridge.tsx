'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useLocale } from 'next-intl'
import { localCalendarStringFromDate } from '@/lib/calendar-day'
import { useSoundieStore } from '@/lib/soundie-store'
import { trpc } from '@/lib/trpc/react'

type Reveal = {
  isNew: boolean
  claimDate: string
  noteId: string
  glowKey: 'dawn' | 'dusk' | 'nocturne'
  rareCaption: string
  teardrop: {
    id: string
    slug: string
    name: string
    emotionId?: string | null
    affirmation?: string
    tagline?: string
  } | null
}

export function SanctuaryUnlockBridge() {
  const locale = useLocale() as 'en' | 'pl'
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const playerId = useSoundieStore((s) => s.playerId)
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const applyDailyClaim = useSoundieStore((s) => s.applyDailyClaim)

  const day = useMemo(() => localCalendarStringFromDate(new Date()), [])

  const progressQuery = trpc.soundie.getProgress.useQuery(
    { playerId: playerId!, noteId: activeNoteId },
    { enabled: hasHydrated && Boolean(playerId), retry: false, staleTime: 30_000 },
  )

  const revealClaim = trpc.returnEngine.revealDailyClaim.useMutation()
  const trackEvent = trpc.analytics.record.useMutation()
  const firedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!hasHydrated || !playerId) return
    if (progressQuery.isLoading) return
    const key = `${playerId}:${day}:${activeNoteId}`
    if (firedRef.current === key) return
    firedRef.current = key

    const loreUnlocked = progressQuery.data?.loreUnlocked ?? 0
    trackEvent.mutate({
      name: 'sanctuary_enter',
      playerId,
      meta: { noteId: activeNoteId, claimDate: day, loreUnlocked, locale },
    })

    revealClaim.mutate(
      { playerId, claimDate: day, noteId: activeNoteId, locale },
      {
        onSuccess: (d) => {
          const data = d as Reveal
          const current = useSoundieStore.getState().activeNoteId
          if (data.noteId === current) {
            applyDailyClaim(
              {
                noteId: data.noteId,
                glowKey: data.glowKey,
                rareCaption: data.rareCaption,
              },
              current,
            )
          }
          trackEvent.mutate({
            name: 'teardrop_open',
            playerId,
            meta: {
              surface: 'daily_gift_dialog',
              source: 'sanctuary_enter',
              noteId: data.noteId,
              claimDate: data.claimDate,
              isNew: data.isNew,
              teardropId: data.teardrop?.id ?? null,
              teardropSlug: data.teardrop?.slug ?? null,
              teardropEmotionId: data.teardrop?.emotionId ?? null,
            },
          })
        },
        onError: () => {
          if (firedRef.current === key) firedRef.current = null
        },
      },
    )
  }, [
    activeNoteId,
    applyDailyClaim,
    day,
    hasHydrated,
    locale,
    playerId,
    progressQuery.data?.loreUnlocked,
    progressQuery.isLoading,
    revealClaim,
    trackEvent,
  ])

  return null
}
