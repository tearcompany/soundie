'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useSoundieStore } from '@/lib/soundie-store'
import { isValidNoteId, noteIdFromUrlKey, urlKeyForNoteId } from '@/lib/notes'
import { trpc } from '@/lib/trpc/react'

export function useSoundieUrlToStore() {
  const searchParams = useSearchParams()
  const setActiveNote = useSoundieStore((s) => s.setActiveNote)
  const key = searchParams.get('note')
  const q = trpc.note.getByUrlKey.useQuery(
    { urlKey: key ?? 'x' },
    { enabled: Boolean(key), retry: false }
  )

  useEffect(() => {
    if (!key) return
    if (q.data?.id) {
      setActiveNote(q.data.id)
      return
    }
    if (q.isError) {
      const id = noteIdFromUrlKey(key)
      if (id && isValidNoteId(id)) {
        setActiveNote(id)
      }
    }
  }, [key, q.data?.id, q.isError, setActiveNote])
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
      if (bells) {
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
