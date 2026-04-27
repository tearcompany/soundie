'use client'

import { useTranslations } from 'next-intl'
import type { ReturnStory } from '@/lib/validators/returnEngine'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { hexToRgba } from '@/lib/hex-rgba'
import { cn } from '@/lib/utils'

type Gift = {
  rareCaption: string
  glowKey: 'dawn' | 'dusk' | 'nocturne'
  teardrop: {
    name: string
    affirmation?: string
    tagline?: string
  } | null
  chromaHex: string
}

const DUST = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

const PANEL: React.CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(165deg, color-mix(in srgb, var(--pearl) 75%, #fff) 0%, var(--pearl) 38%, var(--pearl-dark) 100%)',
  color: 'var(--ink)',
  border: '1px solid var(--pearl-border)',
  boxShadow:
    '0 0 0 1px color-mix(in srgb, #fff 45%, transparent) inset, 0 20px 50px -12px rgba(26, 20, 16, 0.35), 0 6px 16px -4px rgba(26, 20, 16, 0.12)',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  gift: Gift
  onListen: () => void
  returnStory?: ReturnStory
  whisperNoteShort?: string | null
  streakNights?: number
}

export function DailyGiftDialog({
  open,
  onOpenChange,
  gift,
  onListen,
  returnStory = 'none',
  whisperNoteShort,
  streakNights = 0,
}: Props) {
  const t = useTranslations('returnEngine.dailyGift')
  const tRe = useTranslations('returnEngine')
  const c = gift.chromaHex
  const teardropQuote = gift.teardrop?.affirmation || gift.teardrop?.tagline || null
  const title =
    returnStory === 'second_day'
      ? t('titleSecondDay')
      : returnStory === 'returning'
        ? t('titleReturning', { n: streakNights })
        : returnStory === 'first_day'
          ? t('titleFirstDay')
          : t('title')
  const sub =
    returnStory === 'second_day'
      ? t('subSecondDay')
      : returnStory === 'returning'
        ? t('subReturning', { n: streakNights })
        : returnStory === 'first_day'
          ? t('subFirstDay')
          : t('sub')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!border-0 text-ink gap-0 p-0 !shadow-none sm:max-w-md"
        style={{ backgroundColor: '#ffffff' }}
        showCloseButton
        aria-describedby="daily-gift-body"
      >
        <div
          className="relative isolate w-full min-w-0 overflow-hidden rounded-lg bg-white p-6"
          style={PANEL}
        >
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-lg"
            aria-hidden
          >
            {DUST.map((i) => (
              <span
                key={i}
                className="daily-gift-dust absolute h-1 w-1 rounded-full opacity-60"
                style={{
                  left: `${6 + (i * 7) % 88}%`,
                  top: `${(i * 9) % 100}%`,
                  backgroundColor: hexToRgba(c, 0.55 + (i % 4) * 0.1),
                  animation: `lore-dust-drift ${6 + (i % 3)}s ease-in-out ${
                    i * 0.2
                  }s infinite`,
                }}
              />
            ))}
          </div>
          <DialogHeader className="relative z-10 space-y-4">
            {returnStory === 'second_day' && (
              <div className="space-y-2 border-b border-pearl-border/60 pb-4 text-center">
                <p className="text-lora text-lg font-normal leading-snug text-ink">{tRe('welcomeBack')}</p>
                {whisperNoteShort && (
                  <p className="text-lora text-base leading-relaxed text-ink/90">
                    {tRe('dailyWhisper', { note: whisperNoteShort })}
                  </p>
                )}
                {streakNights > 0 && (
                  <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                    {tRe('streakLabel', { n: streakNights })}
                  </p>
                )}
              </div>
            )}
            {returnStory === 'returning' && streakNights > 0 && (
              <p className="border-b border-pearl-border/60 pb-4 text-center font-mono text-xs uppercase tracking-widest text-ink-muted">
                {t('rhythmLead', { n: streakNights })}
              </p>
            )}
            {returnStory === 'first_day' && (
              <p className="border-b border-pearl-border/60 pb-4 text-center text-lora text-sm italic text-ink/85">
                {t('firstEvening')}
              </p>
            )}
            <DialogTitle className="text-lora text-center text-base font-normal leading-snug text-ink">
              {title}
            </DialogTitle>
            <DialogDescription
              className="text-lora text-center text-sm leading-relaxed text-ink/80"
              id="daily-gift-body"
              asChild
            >
              <p>{sub}</p>
            </DialogDescription>
          </DialogHeader>
          <div className="relative z-10 flex flex-col items-center gap-5">
            <div
              className={cn('daily-gift-orb relative h-20 w-20', `daily-glow--${gift.glowKey}`)}
              style={{ ['--glow' as string]: c }}
              aria-hidden
            >
              <div
                className="h-full w-full rounded-full"
                style={{
                  backgroundColor: c,
                  boxShadow: `0 0 0 1px ${hexToRgba(c, 0.2)}`,
                }}
              />
            </div>
            {gift.teardrop && (
              <div
                className="w-full rounded-2xl border px-4 py-3 text-center"
                style={{
                  borderColor: hexToRgba(c, 0.28),
                  backgroundColor: hexToRgba(c, 0.04),
                }}
              >
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-muted">
                  {t('teardrop')}: {gift.teardrop.name}
                </p>
                {teardropQuote && (
                  <p className="text-lora mt-2 text-sm italic leading-relaxed text-ink">
                    &ldquo;{teardropQuote}&rdquo;
                  </p>
                )}
              </div>
            )}
            <blockquote className="w-full text-center text-lora text-sm italic leading-relaxed text-ink/95">
              &ldquo;{gift.rareCaption}&rdquo;
            </blockquote>
          </div>
          <DialogFooter className="relative z-10 sm:justify-center">
            <Button
              type="button"
              className="w-full bg-coral text-pearl hover:bg-coral-light sm:w-auto"
              onClick={onListen}
            >
              {t('listen')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
