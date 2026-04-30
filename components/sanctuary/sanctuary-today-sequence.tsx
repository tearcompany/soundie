'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { localCalendarStringFromDate } from '@/lib/calendar-day'
import { useRouter } from '@/i18n/navigation'
import { DailyMissionPanel } from '@/components/daily-mission-panel'
import type { DailyMission, DailyMissionItem } from '@/lib/validators/daily-mission'

export function SanctuaryTodaySequence() {
  const t = useTranslations('dailyMission')
  const router = useRouter()
  const locale = (useLocale() === 'en' ? 'en' : 'pl') as 'pl' | 'en'
  const playerId = useSoundieStore((s) => s.playerId)
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const progressByNoteId = useSoundieStore((s) => s.progressByNoteId)
  const focusNoteFragment = useSoundieStore((s) => s.focusNoteFragment)

  const day = useMemo(() => localCalendarStringFromDate(new Date()), [])

  const [mission, setMission] = useState<DailyMission | null>(null)
  const initFiredRef = useRef(false)
  const prevLoreRef = useRef<Record<string, number>>({})

  const { mutate: fireGetOrCreate, isError: getOrCreateError } =
    trpc.dailyMission.getOrCreate.useMutation({
      onSuccess: (data) => setMission(data),
      onError: () => {
        initFiredRef.current = false
      },
    })

  const { mutate: fireSyncProgress } = trpc.dailyMission.syncProgress.useMutation({
    onSuccess: (data) => {
      if (data) setMission(data)
    },
  })

  const trackFocus = trpc.analytics.record.useMutation()

  const handleItemFocus = useCallback(
    (item: DailyMissionItem) => {
      focusNoteFragment(item.noteId, item.targetLoreIndex - 1, true)
      if (playerId) {
        trackFocus.mutate({
          name: 'daily_mission_focus',
          playerId,
          meta: {
            surface: 'sanctuary',
            noteId: item.noteId,
            targetLoreIndex: item.targetLoreIndex,
            missionDate: day,
          },
        })
      }
      router.push('/teraz')
    },
    [day, focusNoteFragment, playerId, router, trackFocus],
  )

  useEffect(() => {
    if (!hasHydrated || !playerId || initFiredRef.current) return
    initFiredRef.current = true
    fireGetOrCreate({ playerId, missionDate: day, locale })
  }, [hasHydrated, playerId, day, locale, fireGetOrCreate])

  useEffect(() => {
    if (!playerId || !mission) return

    const currentLore: Record<string, number> = {}
    for (const [noteId, prog] of Object.entries(progressByNoteId)) {
      currentLore[noteId] = prog.loreUnlocked
    }

    const changed = Object.entries(currentLore).some(
      ([noteId, lore]) => prevLoreRef.current[noteId] !== lore,
    )

    prevLoreRef.current = currentLore

    if (!changed) return

    fireSyncProgress({ playerId, missionDate: day, locale })
  }, [progressByNoteId, playerId, mission, day, locale, fireSyncProgress])

  if (!playerId || !hasHydrated) return null

  return (
    <div className="lore-card border-0">
      {getOrCreateError ? (
        <p className="font-mono text-xs leading-relaxed text-ink-muted">{t('loadErrorEcho')}</p>
      ) : mission ? (
        <>
          <DailyMissionPanel mission={mission} onItemFocus={handleItemFocus} />
          {mission.items.length > 0 && (
            <p className="font-body-serif mt-4 text-[0.7rem] leading-relaxed text-ink-muted/90">
              {t('sanctuaryHint')}
            </p>
          )}
        </>
      ) : (
        <p className="font-mono text-xs text-ink-muted">{t('loadingSequence')}</p>
      )}
    </div>
  )
}
