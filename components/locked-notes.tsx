'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { useNoteSelection } from '@/hooks/use-soundie-query'
import { NOTE_LIST } from '@/lib/notes'
import { useSoundieStore } from '@/lib/soundie-store'
import { trpc } from '@/lib/trpc/react'
import { cn } from '@/lib/utils'

export function LockedNotes() {
  const t = useTranslations('lockedNotes')
  const { activeNoteId, setNote } = useNoteSelection()
  const playerId = useSoundieStore((s) => s.playerId)
  const ritualLock = useSoundieStore((s) => !!s.activeRitualId)
  const listQ = trpc.note.list.useQuery(
    { playerId: playerId ?? undefined },
    { retry: false },
  )
  const notes = listQ.data && listQ.data.length > 0 ? listQ.data : NOTE_LIST
  const [api, setApi] = useState<CarouselApi | null>(null)
  const ignoreSelectRef = useRef(false)
  const activeIndex = useMemo(
    () => Math.max(0, notes.findIndex((n) => n.id === activeNoteId)),
    [notes, activeNoteId],
  )
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  useEffect(() => {
    if (!api) return
    ignoreSelectRef.current = true
    api.scrollTo(activeIndex, true)
    requestAnimationFrame(() => {
      ignoreSelectRef.current = false
    })
  }, [api, activeIndex])

  useEffect(() => {
    if (!api || !listQ.isFetched) return
    api.reInit()
    ignoreSelectRef.current = true
    queueMicrotask(() => {
      api.scrollTo(activeIndexRef.current, true)
      requestAnimationFrame(() => {
        ignoreSelectRef.current = false
      })
    })
  }, [api, listQ.isFetched, listQ.dataUpdatedAt])

  useEffect(() => {
    if (!api) return
    const onSelect = () => {
      if (ignoreSelectRef.current) return
      const idx = api.selectedScrollSnap()
      const entry = notes[idx]
      if (!entry) return
      if (ritualLock || entry.locked) {
        if (idx !== activeIndexRef.current) {
          ignoreSelectRef.current = true
          api.scrollTo(activeIndexRef.current, true)
          requestAnimationFrame(() => {
            ignoreSelectRef.current = false
          })
        }
        return
      }
      if (entry.id !== activeNoteId) {
        setNote(entry.id)
      }
    }
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api, notes, activeNoteId, setNote, ritualLock])

  return (
    <div className="w-full shrink-0 bg-gradient-to-t from-pearl via-pearl to-transparent px-6 py-8 pb-12">
      <div className="mx-auto max-w-7xl">
        <p className="pointer-events-auto mb-4 text-center font-mono text-xs text-ink-muted">
          {ritualLock ? t('captionRitual') : t('caption')}
        </p>

        <Carousel
          className="pointer-events-auto w-full"
          opts={{ align: 'start', loop: false, containScroll: 'trimSnaps' }}
          setApi={setApi}
        >
          <div className="mx-auto flex w-full max-w-2xl items-center gap-1 sm:gap-2">
            <CarouselPrevious
              type="button"
              variant="ghost"
              className="!static !h-9 !w-9 shrink-0 !-translate-y-0 border-0 text-ink shadow-none focus-visible:ring-0"
            />
            <div className="min-w-0 flex-1 outline-none [box-shadow:none]">
              <CarouselContent className="-ml-1 min-w-0 outline-none sm:-ml-2">
                {notes.map((entry) => {
                  const selected = activeNoteId === entry.id
                  const locked = entry.locked
                  const blocked = locked || ritualLock
                  return (
                    <CarouselItem
                      key={entry.id}
                      className="!basis-1/3 pl-1 sm:pl-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (blocked) return
                          setNote(entry.id)
                        }}
                        disabled={blocked}
                        className={cn(
                          'group flex w-full flex-col items-center gap-1.5 rounded-lg py-1 text-center transition-colors duration-200 ease-out',
                          !blocked && 'hover:bg-pearl-dark/35',
                          selected && 'bg-pearl-dark/50',
                          blocked && 'cursor-not-allowed',
                        )}
                      >
                        <div
                          className={cn(
                            blocked && 'opacity-45 saturate-50 contrast-95',
                          )}
                        >
                          <p
                            className={cn(
                              'font-mono text-sm font-bold transition-all duration-200',
                              !selected && !blocked && 'opacity-50 group-hover:opacity-100',
                              blocked && 'opacity-55',
                            )}
                            style={{
                              color: entry.chromaHex,
                              textShadow: selected
                                ? `0 0 14px ${entry.chromaHex}55`
                                : undefined,
                            }}
                          >
                            {entry.short}
                          </p>
                          <p
                            className={cn(
                              'mt-0.5 font-body-serif text-[0.7rem] leading-tight transition-all duration-200',
                              !selected && !blocked && 'opacity-60 group-hover:opacity-100',
                              blocked && 'opacity-55',
                            )}
                            style={{ color: entry.chromaHex }}
                          >
                            {entry.name}
                          </p>
                          <p
                            className={cn(
                              'mt-0.5 font-mono text-[0.62rem] leading-tight transition-all duration-200',
                              !selected && !blocked && 'opacity-50 group-hover:opacity-100',
                              blocked && 'opacity-50',
                            )}
                            style={{ color: entry.chromaHex }}
                          >
                            {entry.frequency} Hz
                          </p>
                        </div>
                        <svg
                          width={48}
                          height={48}
                          viewBox="0 0 200 200"
                          className={cn(
                            'h-12 w-12 transition-opacity duration-200',
                            selected && 'soundie-note-pulse drop-shadow-[0_0_10px_rgba(0,0,0,0.08)]',
                            !selected &&
                              !blocked &&
                              'opacity-40 group-hover:opacity-95',
                            blocked && 'opacity-35',
                          )}
                          style={{
                            color: entry.chromaHex,
                            filter: selected ? `drop-shadow(0 0 8px ${entry.chromaHex}66)` : undefined,
                          }}
                          aria-hidden
                        >
                          <path
                            d="M 100 8 L 178 80 L 142 120 L 100 192 L 58 120 L 22 80 Z"
                            className="fill-current"
                          />
                        </svg>
                      </button>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
            </div>
            <CarouselNext
              type="button"
              variant="ghost"
              className="!static !h-9 !w-9 shrink-0 !-translate-y-0 border-0 text-ink shadow-none focus-visible:ring-0"
            />
          </div>
        </Carousel>
      </div>
    </div>
  )
}
