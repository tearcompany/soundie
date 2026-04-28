'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useSoundieStore } from '@/lib/soundie-store'
import { getNoteById } from '@/lib/notes'
import { trpc } from '@/lib/trpc/react'

const DURATION_SECONDS = 60
const TEXT_INTERVAL = 15

const FLY_X = [0, 55, -35, 70, -15, 40, -55, 20, 0]
const FLY_Y = [0, -40, 50, -65, 30, -20, 60, -45, 0]
const FLY_DURATION = 22

type Phase = 'prompt' | 'active' | 'done'

interface Props {
  onDismiss: () => void
}

export function EchoMomentFly({ onDismiss }: Props) {
  const t = useTranslations('echoMoment')
  const [phase, setPhase] = useState<Phase>('prompt')
  const [elapsed, setElapsed] = useState(0)
  const [textIndex, setTextIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeNoteId = useSoundieStore((s) => s.activeNoteId)
  const playerId = useSoundieStore((s) => s.playerId)
  const noteDef = getNoteById(activeNoteId)
  const chromaHex = noteDef?.chromaHex ?? '#8b7b6a'

  const completeMutation = trpc.mindfulMoment.complete.useMutation()

  const startSession = useCallback(() => {
    setPhase('active')
    setElapsed(0)
    setTextIndex(0)
  }, [])

  useEffect(() => {
    if (phase !== 'active') return
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1
        if (next >= DURATION_SECONDS) {
          clearInterval(intervalRef.current!)
          setPhase('done')
          if (playerId) {
            completeMutation.mutate({ playerId, noteId: activeNoteId, type: 'fly' })
          }
          return DURATION_SECONDS
        }
        if (next % TEXT_INTERVAL === 0) {
          setTextIndex((i) => (i + 1) % 4)
        }
        return next
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [phase, playerId, activeNoteId, completeMutation])

  const progress = Math.min(elapsed / DURATION_SECONDS, 1)
  const texts = [t('text0'), t('text1'), t('text2'), t('text3')]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-pearl/75 backdrop-blur-sm"
        onClick={phase === 'prompt' ? onDismiss : undefined}
      />
      <AnimatePresence mode="wait">
        {phase === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative mx-4 mb-8 w-full max-w-sm rounded-2xl bg-white/95 p-8 shadow-sm sm:mb-0"
          >
            <p className="font-mono text-[0.58rem] uppercase tracking-widest text-ink-muted">
              {t('kicker')}
            </p>
            <p className="mt-3 text-lora text-xl leading-snug text-ink">
              {t('invite')}
            </p>
            <p className="mt-2 text-lora text-sm leading-relaxed text-ink/65">
              {t('inviteSub')}
            </p>
            <div className="mt-7 flex flex-col gap-2">
              <button
                onClick={startSession}
                className="w-full rounded-lg bg-ink px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-wide text-pearl transition-colors hover:bg-ink/85"
              >
                {t('begin')}
              </button>
              <button
                onClick={onDismiss}
                className="w-full rounded-lg px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-wide text-ink/40 transition-colors hover:text-ink/60"
              >
                {t('later')}
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-4 mb-8 flex w-full max-w-sm flex-col items-center rounded-2xl bg-white/95 px-6 py-10 sm:mb-0"
          >
            <div className="relative flex h-52 w-52 items-center justify-center">
              <motion.div
                className="absolute rounded-full"
                style={{ width: 140, height: 140, backgroundColor: chromaHex + '18' }}
                animate={{ scale: [1, 1.14, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute rounded-full"
                style={{ width: 80, height: 80, backgroundColor: chromaHex + '28' }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.85, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />
              <motion.div
                className="absolute"
                style={{ left: '50%', top: '50%' }}
                animate={{ x: FLY_X, y: FLY_Y }}
                transition={{ duration: FLY_DURATION, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: chromaHex, marginLeft: -3, marginTop: -3, opacity: 0.85 }}
                />
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={textIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.6 }}
                className="mt-2 text-center text-lora text-sm italic leading-relaxed text-ink/70"
              >
                {texts[textIndex]}
              </motion.p>
            </AnimatePresence>

            <div className="mt-8 w-full">
              <div className="h-px w-full overflow-hidden rounded-full bg-pearl-border/60">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: chromaHex }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                />
              </div>
              <p className="mt-2 text-center font-mono text-[0.58rem] tabular-nums text-ink-muted">
                {DURATION_SECONDS - elapsed}s
              </p>
            </div>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative mx-4 mb-8 w-full max-w-sm overflow-hidden rounded-2xl bg-white/95 px-8 py-10 text-center sm:mb-0"
          >
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2.5, times: [0, 0.3, 1] }}
            >
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 w-1 rounded-full"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                    backgroundColor: chromaHex,
                    opacity: 0.6,
                  }}
                  animate={{
                    y: [0, -20 - Math.random() * 30],
                    opacity: [0.6, 0],
                  }}
                  transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.8 }}
                />
              ))}
            </motion.div>

            <p className="text-lora text-lg leading-snug text-ink">
              {t('doneTitle')}
            </p>
            <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
              {t('doneReward')}
            </p>
            <button
              onClick={onDismiss}
              className="mt-8 font-mono text-[0.65rem] uppercase tracking-wide text-ink/40 transition-colors hover:text-ink/70"
            >
              {t('close')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
