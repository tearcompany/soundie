'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSoundieStore } from '@/lib/soundie-store'
import { cn } from '@/lib/utils'

export function BackgroundPresenceIndicator() {
  const t = useTranslations('backgroundPresence')
  const presenceEnabled = useSoundieStore((s) => s.presenceEnabled)
  const setPresenceEnabled = useSoundieStore((s) => s.setPresenceEnabled)
  const [open, setOpen] = useState(false)

  if (!presenceEnabled) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-2 sm:justify-end sm:pr-4"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex items-center gap-2 rounded-full border border-pearl-border/55 bg-white/85 px-3.5 py-2 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.18)] backdrop-blur-md transition-transform hover:scale-[1.02]',
            open && 'ring-1 ring-ink/10',
          )}
        >
          <span
            className="relative flex h-2 w-2 shrink-0"
            aria-hidden
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/40" />
            <span className="relative block h-2 w-2 rounded-full bg-emerald-600/90" />
          </span>
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-ink/75">
            {t('indicatorActive')}
          </span>
        </button>

        {open && (
          <div className="absolute bottom-full right-0 mb-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-pearl-border/50 bg-white/95 p-3 shadow-lg backdrop-blur-md">
            <p className="font-body-serif text-[0.8rem] leading-snug text-ink/70">
              {t('indicatorHint')}
            </p>
            <button
              type="button"
              onClick={() => {
                setPresenceEnabled(false)
                setOpen(false)
              }}
              className="mt-3 w-full rounded-full border border-pearl-border/60 py-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink/70 transition-colors hover:border-ink/20 hover:text-ink"
            >
              {t('disable')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
