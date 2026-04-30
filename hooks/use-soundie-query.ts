'use client'

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useSoundieStore } from '@/lib/soundie-store'
import { isValidNoteId, noteIdFromUrlKey, urlKeyForNoteId } from '@/lib/notes'
import { getDualRitualEngine, registerDualRitualFromDb } from '@/lib/soundie-rituals'
import { trpc } from '@/lib/trpc/react'
import { shouldPlayBellOnTouchDevice } from '@/lib/bell-feedback'

export function useSoundieUrlToStore() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const setActiveNote = useSoundieStore((s) => s.setActiveNote)
  const setActiveRitualId = useSoundieStore((s) => s.setActiveRitualId)
  const key = searchParams.get('note')
  const ritualParam = searchParams.get('ritual')
  const ritualQ = trpc.ritual.getById.useQuery(
    { ritualId: ritualParam ?? '' },
    { enabled: Boolean(ritualParam), retry: false, staleTime: 60_000 },
  )

  useLayoutEffect(() => {
    if (!ritualParam) return
    if (ritualQ.isPending) return
    if (ritualQ.data) {
      registerDualRitualFromDb(ritualQ.data)
    }
    const cfg = ritualQ.data
      ? getDualRitualEngine(ritualQ.data.id)
      : getDualRitualEngine(ritualParam)
    if (!cfg) {
      if (ritualQ.isError) {
        const next = new URLSearchParams(searchParams.toString())
        next.delete('ritual')
        router.replace(`${pathname}?${next.toString()}`, { scroll: false })
      }
      return
    }
    setActiveRitualId(cfg.id)
    setActiveNote(cfg.entryNoteId)
    const next = new URLSearchParams(searchParams.toString())
    next.delete('ritual')
    next.set('note', urlKeyForNoteId(cfg.entryNoteId))
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }, [
    ritualParam,
    ritualQ.data,
    ritualQ.isError,
    ritualQ.isPending,
    pathname,
    router,
    searchParams,
    setActiveNote,
    setActiveRitualId,
  ])

  useEffect(() => {
    if (ritualParam) return
    if (!key) return
    const id = noteIdFromUrlKey(key)
    if (id && isValidNoteId(id)) {
      setActiveNote(id)
    }
  }, [key, ritualParam, setActiveNote])
}

export function useNoteSelection() {
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const setActiveNote = useSoundieStore((s) => s.setActiveNote)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const bellsRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio('/bells.wav')
    audio.preload = 'auto'
    audio.volume = 0.35
    bellsRef.current = audio
    return () => {
      bellsRef.current = null
    }
  }, [])

  const setNote = useCallback(
    (id: string) => {
      if (!isValidNoteId(id)) return
      const bells = bellsRef.current
      if (bells && shouldPlayBellOnTouchDevice()) {
        bells.pause()
        bells.currentTime = 0
        bells.play().catch(() => undefined)
      }
      setActiveNote(id)
      const key = urlKeyForNoteId(id)
      const next = new URLSearchParams(searchParams.toString())
      next.set('note', key)
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams, setActiveNote]
  )

  return { activeNoteId, setNote }
}
