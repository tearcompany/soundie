'use client'

import { useLayoutEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { localCalendarStringFromDate } from '@/lib/calendar-day'
import { MOOD_ID_LIST, reactionLine, type MoodId } from '@/lib/mood-reaction-texts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { hexToRgba } from '@/lib/hex-rgba'
import { getNoteById } from '@/lib/notes'

function gateKey(playerId: string, day: string) {
  return `moodGate:${playerId}:${day}`
}

export function MoodCheckInBridge() {
  const t = useTranslations('moodIntelligence')
  const locale = useLocale() as 'en' | 'pl'
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const playerId = useSoundieStore((s) => s.playerId)
  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const moodEntranceCleared = useSoundieStore((s) => s.moodEntranceCleared)
  const setMoodEntranceCleared = useSoundieStore((s) => s.setMoodEntranceCleared)
  const setSessionMoodReaction = useSoundieStore((s) => s.setSessionMoodReaction)
  const setSessionMoodBefore = useSoundieStore((s) => s.setSessionMoodBefore)
  const saveEntry = trpc.mood.saveEntry.useMutation()
  const day = useMemo(() => localCalendarStringFromDate(new Date()), [])
  const [sessionRead, setSessionRead] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [picked, setPicked] = useState<MoodId | null>(null)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (!playerId) {
      setMoodEntranceCleared(true)
      setSessionRead(true)
      return
    }
    try {
      if (window.sessionStorage.getItem(gateKey(playerId, day)) === '1') {
        setMoodEntranceCleared(true)
      }
    } catch {
      setMoodEntranceCleared(true)
    }
    setSessionRead(true)
  }, [day, playerId, setMoodEntranceCleared])

  const def = getNoteById(activeNoteId) ?? getNoteById('A')!
  const c = def.chromaHex
  const showDialog = sessionRead && hasHydrated && !moodEntranceCleared && Boolean(playerId)

  const closeGate = (withStorage: boolean) => {
    if (playerId && withStorage) {
      try {
        window.sessionStorage.setItem(gateKey(playerId, day), '1')
      } catch {
        return
      }
    }
    setMoodEntranceCleared(true)
  }

  const onPick = (m: MoodId) => {
    setPicked(m)
    setStep(2)
  }

  const onBack = () => {
    setStep(1)
    setPicked(null)
  }

  const onComplete = () => {
    if (!playerId || !picked) {
      return
    }
    const text = reactionLine(activeNoteId, picked, locale)
    setSessionMoodBefore(picked)
    setSessionMoodReaction(text)
    saveEntry.mutate(
      {
        playerId,
        noteId: activeNoteId,
        mood: picked,
        entryDate: day,
      },
      {
        onSettled: () => {
          closeGate(true)
        },
      }
    )
  }

  const onNotNow = () => {
    setSessionMoodBefore(null)
    closeGate(true)
  }

  return (
    <Dialog open={showDialog} onOpenChange={() => {}} modal>
      <DialogContent
        overlayClassName="z-[200] bg-black/50"
        className="z-[201] max-h-[min(90dvh,720px)] overflow-y-auto border border-ink/15 bg-white text-ink shadow-2xl sm:max-w-md"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lora text-center text-lg font-normal text-ink">
                {t('ask')}
              </DialogTitle>
              <DialogDescription className="sr-only">{t('ask')}</DialogDescription>
            </DialogHeader>
            <div className="mt-1 flex flex-col gap-2 sm:grid sm:grid-cols-1">
              {MOOD_ID_LIST.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onPick(m)}
                  className="rounded-2xl border border-pearl-border px-4 py-3 text-left font-mono text-sm text-ink transition-all hover:border-ink/15"
                >
                  {t(`moods.${m}` as 'moods.anxious')}
                </button>
              ))}
            </div>
            <DialogFooter className="mt-2 sm:justify-center">
              <Button type="button" variant="ghost" onClick={onNotNow} className="w-full sm:w-auto">
                {t('notNow')}
              </Button>
            </DialogFooter>
          </>
        )}
        {step === 2 && picked && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lora text-center text-base font-normal text-ink">
                {t('reactionLabel')}
              </DialogTitle>
            </DialogHeader>
            <p className="text-lora text-center text-sm italic leading-relaxed text-ink/90">
              {reactionLine(activeNoteId, picked, locale)}
            </p>
            <div
              className="mx-auto mt-2 h-2 w-2 rounded-full"
              style={{ backgroundColor: c, boxShadow: `0 0 0 3px ${hexToRgba(c, 0.2)}` }}
              aria-hidden
            />
            <div className="mt-1 text-center">
              <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-muted">
                {def.name}
              </p>
            </div>
            <DialogFooter className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={onBack}
              >
                {t('back')}
              </Button>
              <Button
                type="button"
                className={cn('w-full bg-coral text-pearl hover:bg-coral-light sm:w-auto')}
                onClick={onComplete}
                disabled={saveEntry.isPending}
              >
                {t('enter')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
