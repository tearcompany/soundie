'use client'

import { useMemo } from 'react'
import { useMessages, useTranslations } from 'next-intl'
import { hexToRgba } from '@/lib/hex-rgba'
import { urlKeyForNoteId } from '@/lib/notes'
import { Link } from '@/i18n/navigation'
import { MAX_LORE_FRAGMENTS } from '@/lib/progress'
import { trpc } from '@/lib/trpc/react'

export type NoteProgressRow = {
  noteId: string
  noteName: string
  chromaHex: string
  level: number
  totalListenTime: number
  loreUnlocked: number
}

type Props = {
  note: NoteProgressRow
  playerId?: string
  locale?: 'en' | 'pl'
}

export function NoteProgressCard({ note, playerId, locale = 'en' }: Props) {
  const t = useTranslations('sanctuary')
  const messages = useMessages() as {
    noteCreature?: { lore?: Record<string, string[]> }
  }
  const c = note.chromaHex
  const minutes = Math.floor(note.totalListenTime / 60)

  const teardropQuery = trpc.teardrop.getMappedForNote.useQuery(
    { noteId: note.noteId, locale, playerId },
    { enabled: Boolean(playerId), staleTime: 30_000, retry: false },
  )

  const loreQuote = useMemo(() => {
    const noteLore = messages.noteCreature?.lore?.[note.noteId] ?? []
    if (noteLore.length === 0) return null
    const dayKey = new Date().toISOString().slice(0, 10)
    let seed = 0
    const source = `${note.noteId}:${dayKey}`
    for (let i = 0; i < source.length; i += 1) {
      seed = (seed * 31 + source.charCodeAt(i)) >>> 0
    }
    return noteLore[seed % noteLore.length] ?? null
  }, [messages, note.noteId])

  const phaseGroups = useMemo(() => {
    const cards = teardropQuery.data?.cards ?? []
    const phases = teardropQuery.data?.phases ?? []
    if (cards.length === 0) return []
    const phaseTitleBySlug = Object.fromEntries(
      phases.map((p) => [p.slug, locale === 'pl' ? p.titlePl : p.titleEn])
    )
    const groups = new Map<string, { title: string; cards: typeof cards }>()
    for (const card of cards) {
      const slug = card.phase ?? 'archetypes'
      if (!groups.has(slug)) {
        groups.set(slug, { title: phaseTitleBySlug[slug] ?? slug, cards: [] })
      }
      groups.get(slug)!.cards.push(card)
    }
    const phaseOrder = phases.map((p) => p.slug)
    return [...groups.entries()]
      .sort(([a], [b]) => {
        const ai = phaseOrder.indexOf(a)
        const bi = phaseOrder.indexOf(b)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
      .map(([slug, g]) => ({ slug, ...g }))
  }, [teardropQuery.data, locale])

  const totalCards = teardropQuery.data?.totalCards ?? 0
  const unlockedCards = teardropQuery.data?.cards.length ?? 0

  return (
    <div
      className="lore-card flex flex-col gap-3 p-4"
      style={{ borderColor: hexToRgba(c, 0.25) }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[0.62rem] font-bold uppercase tracking-wide text-white"
          style={{
            backgroundColor: c,
            boxShadow: `0 0 0 3px ${hexToRgba(c, 0.18)}`,
          }}
          aria-label={note.noteId}
        >
          {note.noteId}
        </span>
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

      {playerId && phaseGroups.length > 0 && (
        <div className="space-y-3 border-t pt-3" style={{ borderColor: hexToRgba(c, 0.2) }}>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-muted">
              {t('teardropLabel')}
            </p>
            <p className="font-mono text-[0.6rem] text-ink-muted">
              {unlockedCards}/{totalCards}
            </p>
          </div>
          {phaseGroups.map((group) => (
            <div key={group.slug} className="space-y-1.5">
              <p
                className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                style={{ color: c }}
              >
                {group.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.cards.map((card) => (
                  <span
                    key={card.id}
                    className="rounded-md px-2 py-1 font-mono text-[0.6rem] lowercase"
                    style={{
                      color: c,
                      backgroundColor: hexToRgba(c, 0.08),
                      border: `1px solid ${hexToRgba(c, 0.3)}`,
                    }}
                  >
                    {card.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {loreQuote && (
        <p className="text-lora text-sm italic leading-relaxed text-ink/80 line-clamp-3">{loreQuote}</p>
      )}
      <div>
        <Link
          href={`/play?note=${encodeURIComponent(urlKeyForNoteId(note.noteId))}`}
          className="font-mono text-[0.62rem] uppercase tracking-widest text-ink-muted underline decoration-ink/30 underline-offset-4 hover:text-ink"
        >
          {t('listenNote')}
        </Link>
      </div>
    </div>
  )
}
