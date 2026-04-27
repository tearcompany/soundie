'use client'

import { useTranslations } from 'next-intl'
import { hexToRgba } from '@/lib/hex-rgba'
import { MAX_LORE_FRAGMENTS } from '@/lib/progress'

export type NoteProgressRow = {
  noteId: string
  noteName: string
  chromaHex: string
  level: number
  totalListenTime: number
  loreUnlocked: number
}

export function NoteProgressCard({ note }: { note: NoteProgressRow }) {
  const t = useTranslations('sanctuary')
  const c = note.chromaHex
  const minutes = Math.floor(note.totalListenTime / 60)

  return (
    <div
      className="lore-card flex flex-col gap-3 p-4"
      style={{ borderColor: hexToRgba(c, 0.25) }}
    >
      <div className="flex items-center gap-3">
        <span
          className="h-8 w-8 shrink-0 rounded-full"
          style={{
            backgroundColor: c,
            boxShadow: `0 0 0 3px ${hexToRgba(c, 0.18)}`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lora text-sm font-medium text-ink">{note.noteName}</p>
          <p className="font-mono text-[0.6rem] text-ink-muted">
            {t('noteLevel', { lv: note.level })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5" aria-label={t('noteFragmentsAria', { n: note.loreUnlocked, max: MAX_LORE_FRAGMENTS })}>
        {Array.from({ length: MAX_LORE_FRAGMENTS }, (_, i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full transition-colors duration-300"
            style={
              i < note.loreUnlocked
                ? { backgroundColor: c }
                : {
                    backgroundColor: 'transparent',
                    border: `1.5px solid ${hexToRgba(c, 0.4)}`,
                  }
            }
          />
        ))}
        <span className="ml-1 font-mono text-[0.58rem] text-ink-muted">
          {note.loreUnlocked}/{MAX_LORE_FRAGMENTS}
        </span>
      </div>

      <p className="font-mono text-[0.62rem] text-ink-muted" style={{ color: hexToRgba(c, 0.75) }}>
        {t('noteMinutes', { m: minutes })}
      </p>
    </div>
  )
}
