'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { localCalendarStringFromDate } from '@/lib/calendar-day'
import { getNoteById } from '@/lib/notes'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

export function ReturnEngineBridge() {
  const t = useTranslations('returnEngine')
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
  const welcomeForGiftRef = useRef(false)
  const firstRevealAfterLogRef = useRef(false)
  const visitLogInitKey = useRef<string | null>(null)

  const [open, setOpen] = useState(false)
  const [giftOpen, setGiftOpen] = useState(false)
  const [giftPayload, setGiftPayload] = useState<Reveal | null>(null)
  const [pendingAfterWelcome, setPendingAfterWelcome] = useState(false)
  const [whisperNote, setWhisperNote] = useState<string | null>(null)
  const [streakNights, setStreakNights] = useState(0)

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || !playerId) return
    if (window.sessionStorage.getItem(visitStorageKey(playerId, day)) === '1') {
      setVisitReady(true)
    }
  }, [playerId, day])

  const onRevealSuccess = useCallback(
    (d: Reveal, fromWelcome: boolean) => {
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
      if (fromWelcome) {
        setPendingAfterWelcome(true)
        return
      }
      setGiftOpen(true)
    },
    [applyDailyClaim]
  )

  const autoRevealFiredKeyRef = useRef<string | null>(null)

  const runReveal = useCallback(
    (useWelcomeInReveal: boolean) => {
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
          onSuccess: (d) => onRevealSuccess(d as Reveal, useWelcomeInReveal),
        }
      )
    },
    [day, locale, onRevealSuccess, playerId, revealClaim]
  )

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
          setStreakNights(v.streakNights)
          setWhisperNote(v.noteShort ? v.noteShort : null)
          welcomeForGiftRef.current = v.shouldShowWelcomeBack
          if (v.shouldShowWelcomeBack) {
            setOpen(true)
          }
          firstRevealAfterLogRef.current = true
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
    const isFirst = firstRevealAfterLogRef.current
    if (isFirst) {
      firstRevealAfterLogRef.current = false
    }
    const w = isFirst && welcomeForGiftRef.current
    runReveal(!!w)
  }, [day, hasHydrated, playerId, runReveal, visitReady, moodEntranceCleared])

  const handleWelcomeOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v && pendingAfterWelcome && giftPayload) {
      setPendingAfterWelcome(false)
      requestAnimationFrame(() => {
        setGiftOpen(true)
      })
    }
  }

  const def = getNoteById(activeNoteId) ?? getNoteById('C')
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
      <Dialog open={open} onOpenChange={handleWelcomeOpenChange}>
        <DialogContent className="border-ink/10 bg-pearl sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lora text-center text-lg font-normal text-ink">
              {t('welcomeBack')}
            </DialogTitle>
            {whisperNote && (
              <DialogDescription asChild>
                <p className="text-lora text-center text-base leading-relaxed text-ink/90">
                  {t('dailyWhisper', { note: whisperNote })}
                </p>
              </DialogDescription>
            )}
          </DialogHeader>
          {streakNights > 0 && (
            <p className="text-center font-mono text-xs uppercase tracking-widest text-ink-muted">
              {t('streakLabel', { n: streakNights })}
            </p>
          )}
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setOpen(false)}
            >
              {t('continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {giftPayload && (
        <DailyGiftDialog
          open={giftOpen}
          onOpenChange={setGiftOpen}
          onListen={onGiftListen}
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
