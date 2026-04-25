'use client'

import { useEffect, useRef } from 'react'
import { useSoundieStore } from '@/lib/soundie-store'
import { trpc } from '@/lib/trpc/react'

export function SoundiePlayerBridge() {
  const playerId = useSoundieStore((s) => s.playerId)
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const setPlayerId = useSoundieStore((s) => s.setPlayerId)
  const syncFromRemote = useSoundieStore((s) => s.syncFromRemote)
  const ensure = trpc.player.ensure.useMutation()
  const ensureRan = useRef(false)

  const progressQuery = trpc.soundie.getProgress.useQuery(
    { playerId: playerId!, noteId: activeNoteId },
    { enabled: !!playerId, staleTime: 30_000, retry: false },
  )

  useEffect(() => {
    if (playerId) return
    if (ensureRan.current) return
    ensureRan.current = true
    ensure.mutate(undefined, {
      onSuccess: (data) => setPlayerId(data.id),
    })
  }, [playerId, ensure, setPlayerId])

  useEffect(() => {
    if (!progressQuery.isSuccess) return
    if (!progressQuery.data) {
      syncFromRemote(null)
      return
    }
    syncFromRemote({
      totalListenTime: progressQuery.data.totalListenTime,
      level: progressQuery.data.level,
      loreUnlocked: progressQuery.data.loreUnlocked,
    })
  }, [progressQuery.isSuccess, progressQuery.data, syncFromRemote])

  return null
}
