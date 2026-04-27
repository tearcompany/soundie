'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { localCalendarStringFromDate } from '@/lib/calendar-day'
import { DEFAULT_NOTE_ID, getNoteById } from '@/lib/notes'
import type { ReturnStory } from '@/lib/validators/returnEngine'
import { DailyGiftDialog } from '@/components/daily-gift-dialog'

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
    affirmation?: string
    tagline?: string
  } | null
}

function visitStorageKey(playerId: string, day: string) {
  return `reLog:${playerId}:${day}`
}

function visitContextKey(playerId: string, day: string) {
  return `reCtx:${playerId}:${day}`
}

type VisitCtx = { streakNights: number; returnStory: ReturnStory; whisper: string | null }

function readVisitCtx(playerId: string, day: string): VisitCtx | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(visitContextKey(playerId, day))
    if (!raw) return null
    const p = JSON.parse(raw) as VisitCtx
    if (typeof p.streakNights !== 'number' || typeof p.returnStory !== 'string') return null
    return p
  } catch {
    return null
  }
}

function writeVisitCtx(playerId: string, day: string, ctx: VisitCtx) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(visitContextKey(playerId, day), JSON.stringify(ctx))
  } catch {
    return
  }
}

export function ReturnEngineBridge() {
  const locale = useLocale() as 'en' | 'pl'
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const playerId = useSoundieStore((s) => s.playerId)
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const applyDailyClaim = useSoundieStore((s) => s.applyDailyClaim)
  const setPendingListenFromDailyGift = useSoundieStore((s) => s.setPendingListenFromDailyGift)
  const moodEntranceCleared = useSoundieStore((s) => s.moodEntranceCleared)
  const logVisit = trpc.returnEngine.logVisit.useMutation()
  const revealClaim = trpc.returnEngine.revealDailyClaim.useMutation()
  const trackListenIntent = trpc.analytics.record.useMutation()

  const day = useMemo(() => localCalendarStringFromDate(new Date()), [])
  const [visitReady, setVisitReady] = useState(false)
  const visitLogInitKey = useRef<string | null>(null)

  const [giftOpen, setGiftOpen] = useState(false)
  const [giftPayload, setGiftPayload] = useState<Reveal | null>(null)
  const [whisperNote, setWhisperNote] = useState<string | null>(null)
  const [streakNights, setStreakNights] = useState(0)
  const [returnStory, setReturnStory] = useState<ReturnStory>('none')

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !playerId) return
    if (window.sessionStorage.getItem(visitStorageKey(playerId, day)) === '1') {
      const prev = readVisitCtx(playerId, day)
      if (prev) {
        setStreakNights(prev.streakNights)
        setReturnStory(prev.returnStory)
        setWhisperNote(prev.whisper)
      }
      setVisitReady(true)
    }
  }, [playerId, day])

  const onRevealSuccess = useCallback(
    (d: Reveal) => {
      const currentActive = useSoundieStore.getState().activeNoteId
      if (d.noteId === currentActive) {
        applyDailyClaim(
          {
            noteId: d.noteId,
            glowKey: d.glowKey,
            rareCaption: d.rareCaption,
          },
          currentActive
        )
      } else {
        applyDailyClaim(null, currentActive)
      }
      if (!d.isNew) {
        return
      }
      setGiftPayload(d)
      setGiftOpen(true)
    },
    [applyDailyClaim]
  )

  const autoRevealFiredKeyRef = useRef<string | null>(null)

  const runReveal = useCallback(() => {
    if (!playerId) return
    const k = `${playerId}:${day}`
    if (autoRevealFiredKeyRef.current === k) {
      return
    }
    const noteId = useSoundieStore.getState().activeNoteId
    autoRevealFiredKeyRef.current = k
    revealClaim.mutate(
      { playerId, claimDate: day, noteId, locale },
      {
        onError: () => {
          if (autoRevealFiredKeyRef.current === k) {
            autoRevealFiredKeyRef.current = null
          }
        },
        onSuccess: (d) => onRevealSuccess(d as Reveal),
      }
    )
  }, [day, locale, onRevealSuccess, playerId, revealClaim])

  useEffect(() => {
    if (!hasHydrated || !playerId) return
    if (!moodEntranceCleared) return
    if (typeof window === 'undefined') return
    const k = visitStorageKey(playerId, day)
    if (window.sessionStorage.getItem(k) === '1' || visitLogInitKey.current === k) {
      return
    }
    visitLogInitKey.current = k
    const aid = useSoundieStore.getState().activeNoteId
    logVisit.mutate(
      { playerId, calendarDate: day, activeNoteId: aid },
      {
        onError: () => {
          visitLogInitKey.current = null
        },
        onSuccess: (v) => {
          try {
            window.sessionStorage.setItem(k, '1')
          } catch {
            return
          }
          const whisper = v.noteShort ? v.noteShort : null
          setStreakNights(v.streakNights)
          setReturnStory(v.returnStory)
          setWhisperNote(whisper)
          writeVisitCtx(playerId, day, {
            streakNights: v.streakNights,
            returnStory: v.returnStory,
            whisper,
          })
          setVisitReady(true)
        },
      }
    )
  }, [day, hasHydrated, logVisit, playerId, moodEntranceCleared])

  useEffect(() => {
    if (!hasHydrated || !playerId || !visitReady) return
    if (!moodEntranceCleared) return
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(visitStorageKey(playerId, day)) !== '1') {
      return
    }
    runReveal()
  }, [day, hasHydrated, playerId, runReveal, visitReady, moodEntranceCleared])

  const def = getNoteById(activeNoteId) ?? getNoteById(DEFAULT_NOTE_ID)
  const chromaForGift = def?.chromaHex ?? '#8b7b6a'

  const onGiftListen = () => {
    if (playerId) {
      trackListenIntent.mutate({
        name: 'daily_gift_listen_click',
        playerId,
        meta: { noteId: activeNoteId, claimDate: day },
      })
    }
    setPendingListenFromDailyGift(true)
    setGiftOpen(false)
  }

  return (
    <>
      {giftPayload && (
        <DailyGiftDialog
          open={giftOpen}
          onOpenChange={setGiftOpen}
          onListen={onGiftListen}
          returnStory={giftPayload.isNew ? returnStory : 'none'}
          whisperNoteShort={whisperNote}
          streakNights={streakNights}
          gift={{
            rareCaption: giftPayload.rareCaption,
            glowKey: giftPayload.glowKey,
            teardrop: giftPayload.teardrop
              ? {
                  name: giftPayload.teardrop.name,
                  affirmation: giftPayload.teardrop.affirmation,
                  tagline: giftPayload.teardrop.tagline,
                }
              : null,
            chromaHex: chromaForGift,
          }}
        />
      )}
    </>
  )
}
