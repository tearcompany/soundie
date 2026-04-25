'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { trpc } from '@/lib/trpc/react'
import { cn } from '@/lib/utils'

export function LockedNotes() {
  const { activeNoteId, setNote } = useNoteSelection()
  const listQ = trpc.note.list.useQuery(undefined, { retry: false })
  const notes = listQ.data && listQ.data.length > 0 ? listQ.data : NOTE_LIST
  const [api, setApi] = useState<CarouselApi | null>(null)
  const activeIndex = useMemo(
    () => Math.max(0, notes.findIndex((n) => n.id === activeNoteId)),
    [notes, activeNoteId]
  )

  useEffect(() => {
    if (!api) return
    api.scrollTo(activeIndex)
  }, [api, activeIndex])

  return (
    <div className="w-full shrink-0 bg-gradient-to-t from-pearl via-pearl to-transparent px-6 py-8 pb-12">
      <div className="mx-auto max-w-7xl">
        <p className="pointer-events-auto mb-4 text-center font-mono text-xs text-ink-muted">
        The next note appears only to the still.
        </p>

        <Carousel
          className="pointer-events-auto w-full"
          opts={{ align: 'start', loop: false, dragFree: true }}
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
                  return (
                    <CarouselItem
                      key={entry.id}
                      className="!basis-1/3 pl-1 sm:pl-2"
                    >
                      <button
                        type="button"
                        onClick={() => setNote(entry.id)}
                        className={cn(
                          'group flex w-full flex-col items-center gap-1.5 rounded-lg py-1 text-center',
                          selected && 'bg-pearl-dark/50',
                        )}
                      >
                        <div>
                          <p
                            className={cn(
                              'font-mono text-sm font-bold transition-all duration-200',
                              !selected && 'opacity-50 group-hover:opacity-100',
                            )}
                            style={{ color: entry.chromaHex }}
                          >
                            {entry.short}
                          </p>
                          <p
                            className={cn(
                              'mt-0.5 font-mono text-[0.65rem] leading-tight transition-all duration-200',
                              !selected && 'opacity-50 group-hover:opacity-100',
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
                            'h-12 w-12 scale-100 transition-all duration-200',
                            selected && 'soundie-note-pulse',
                            !selected && 'opacity-40 group-hover:scale-110 group-hover:opacity-100',
                          )}
                          style={{ color: entry.chromaHex }}
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
