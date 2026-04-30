'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { hexToRgba } from '@/lib/hex-rgba'
import { trpc } from '@/lib/trpc/react'
import { type TimeOfDay } from '@/lib/affirmation-engine'
import { toast } from 'sonner'

interface PostSessionModalProps {
  open: boolean
  phrase: string
  noteId: string
  noteShort: string
  noteHex: string
  playerId: string | null
  mood: string | null
  timeOfDay: TimeOfDay
  streak: number
  sessionLengthSeconds: number
  onClose: () => void
  onListenAgain: () => void
}

const STAR_COUNT = 24

function StarField({ hex }: { hex: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: STAR_COUNT }, (_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: i % 4 === 0 ? 3 : 2,
            height: i % 4 === 0 ? 3 : 2,
            backgroundColor: hexToRgba(hex, 0.25 + (i % 5) * 0.08),
            top: `${5 + (i * 17 + 3) % 90}%`,
            left: `${3 + (i * 13 + 7) % 94}%`,
            animation: `echoStarPulse ${2.2 + (i % 6) * 0.5}s ease-in-out ${(i * 0.18) % 2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

export function PostSessionModal({
  open,
  phrase,
  noteId,
  noteShort,
  noteHex,
  playerId,
  mood,
  timeOfDay,
  streak,
  sessionLengthSeconds,
  onClose,
  onListenAgain,
}: PostSessionModalProps) {
  const t = useTranslations('postSession')
  const [saved, setSaved] = useState(false)

  const trpcUtils = trpc.useUtils()
  const { mutate: saveEcho, isPending: savePending } = trpc.echo.save.useMutation({
    onSuccess: () => {
      setSaved(true)
      toast.success(t('saved'))
      void trpcUtils.resonance.getTrace.invalidate()
    },
    onError: () => {
      toast.error(t('saveError'))
    },
  })

  useEffect(() => {
    if (!open) setSaved(false)
  }, [open])

  const handleSave = () => {
    if (!playerId || saved || savePending) return
    if (!phrase.trim()) {
      toast.error(t('saveError'))
      return
    }
    saveEcho({
      playerId,
      noteId,
      phrase: phrase.trim(),
      mood: mood ?? undefined,
      timeOfDay,
      streak,
    })
  }

  return (
    <>
      <style>{`
        @keyframes echoStarPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes echoOrbFade {
          0% { opacity: 1; transform: scale(1.12); }
          100% { opacity: 0.55; transform: scale(0.88); }
        }
        @keyframes echoLineReveal {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <AnimatePresence>
        {open && (
          <motion.div
            key="post-session-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
            style={{ backgroundColor: `color-mix(in srgb, ${noteHex} 10%, #f5f2ee)` }}
          >
            <StarField hex={noteHex} />

            <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 text-center pointer-events-auto">
              <motion.div
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  backgroundColor: noteHex,
                  boxShadow: `0 0 48px 12px ${hexToRgba(noteHex, 0.3)}, 0 0 0 1px ${hexToRgba(noteHex, 0.2)}`,
                  animation: 'echoOrbFade 4s ease-in-out 0.8s forwards',
                } as CSSProperties}
              >
                <span className="font-mono text-xl font-bold text-white/90">
                  {noteShort}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
                className="space-y-4"
              >
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-ink-muted/70">
                  {t('kicker')}
                </p>
                <p
                  className="font-[family-name:var(--font-lora,serif)] text-xl font-normal italic leading-relaxed text-ink"
                  style={{ animation: 'echoLineReveal 0.9s ease-out 1.1s both' }}
                >
                  {phrase}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.6 }}
                className="flex w-full flex-col gap-2.5"
              >
                {playerId && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saved || savePending}
                    className="w-full rounded-full border py-2.5 font-mono text-[0.68rem] uppercase tracking-wide transition-all duration-300 disabled:opacity-60 aria-busy:cursor-wait"
                    aria-busy={savePending}
                    style={{
                      borderColor: noteHex,
                      color: saved ? noteHex : 'var(--pearl)',
                      backgroundColor: saved ? 'transparent' : noteHex,
                    }}
                  >
                    {saved ? t('saved') : t('saveToEchoes')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onListenAgain}
                  className="w-full rounded-full border border-pearl-border/80 py-2.5 font-mono text-[0.68rem] uppercase tracking-wide text-ink-muted transition-colors hover:bg-pearl/70"
                >
                  {t('listenAgain')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted/60 transition-colors hover:text-ink-muted"
                >
                  {t('close')}
                </button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.4, duration: 0.5 }}
                className="font-mono text-[0.58rem] tracking-[0.16em] text-ink-muted/50"
              >
                {t('sessionNote', {
                  note: noteShort,
                  mins: Math.round(sessionLengthSeconds / 60),
                })}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
