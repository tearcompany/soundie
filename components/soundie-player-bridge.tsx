'use client'

import { useEffect, useRef } from 'react'
import { useSoundieStore } from '@/lib/soundie-store'
import { trpc } from '@/lib/trpc/react'

export function SoundiePlayerBridge() {
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const playerId = useSoundieStore((s) => s.playerId)
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const setPlayerId = useSoundieStore((s) => s.setPlayerId)
  const syncFromRemote = useSoundieStore((s) => s.syncFromRemote)

  const sessionPlayerQuery = trpc.player.getForSession.useQuery(undefined, {
    enabled: hasHydrated,
    staleTime: 60_000,
    retry: false,
  })

  const ensure = trpc.player.ensure.useMutation()
  const ensureRan = useRef(false)

  const progressQuery = trpc.soundie.getProgress.useQuery(
    { playerId: playerId!, noteId: activeNoteId },
    { enabled: !!playerId, staleTime: 30_000, retry: false },
  )

  useEffect(() => {
    if (!hasHydrated) return
    if (sessionPlayerQuery.isLoading) return

    if (sessionPlayerQuery.data?.id) {
      setPlayerId(sessionPlayerQuery.data.id)
      return
    }

    if (playerId) return
    if (ensureRan.current) return
    ensureRan.current = true
    ensure.mutate(undefined, {
      onSuccess: (data) => setPlayerId(data.id),
    })
  }, [hasHydrated, sessionPlayerQuery.isLoading, sessionPlayerQuery.data, playerId, ensure, setPlayerId])

  useEffect(() => {
    if (!hasHydrated) return
    if (!progressQuery.isSuccess) return
    if (!progressQuery.data) {
      syncFromRemote(null, activeNoteId)
      return
    }
    syncFromRemote(
      {
        totalListenTime: progressQuery.data.totalListenTime,
        level: progressQuery.data.level,
        loreUnlocked: progressQuery.data.loreUnlocked,
      },
      activeNoteId
    )
  }, [hasHydrated, progressQuery.isSuccess, progressQuery.data, syncFromRemote, activeNoteId])

  return null
}
