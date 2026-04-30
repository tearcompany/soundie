'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

type PhaseInfo = { slug: string; titlePl: string; titleEn: string; unlockOrder: number }

type CardText = { locale: string; field: string; content: string }

export type TeardropCollectionCard = {
  id: string
  slug: string
  name: string
  phase: string | null
  phaseOrder: number | null
  texts: CardText[]
}

type SortMode = 'phaseOrder' | 'nameAsc' | 'nameDesc'

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

function compareByPhaseOrder(
  a: TeardropCollectionCard,
  b: TeardropCollectionCard,
  phaseRank: Map<string, number>,
) {
  const pa = a.phase ?? 'archetypes'
  const pb = b.phase ?? 'archetypes'
  const ra = phaseRank.get(pa) ?? 999
  const rb = phaseRank.get(pb) ?? 999
  if (ra !== rb) return ra - rb
  return (a.phaseOrder ?? 0) - (b.phaseOrder ?? 0)
}

type Props = {
  cards: TeardropCollectionCard[]
  phases: PhaseInfo[]
  locale: 'en' | 'pl'
  focusSlug: string | null
}

export function TeardropCollectionGallery({ cards, phases, locale, focusSlug }: Props) {
  const t = useTranslations('teardropPage')
  const [phaseFilter, setPhaseFilter] = useState<string | 'all'>('all')
  const [sortMode, setSortMode] = useState<SortMode>('phaseOrder')
  const perSlide = 2

  const phaseRank = useMemo(
    () => new Map(phases.map((p) => [p.slug, p.unlockOrder])),
    [phases],
  )

  const phaseTitle = useMemo(
    () => Object.fromEntries(phases.map((p) => [p.slug, locale === 'pl' ? p.titlePl : p.titleEn])),
    [phases, locale],
  )

  const filteredSorted = useMemo(() => {
    let list =
      phaseFilter === 'all'
        ? [...cards]
        : cards.filter((c) => (c.phase ?? 'archetypes') === phaseFilter)
    if (sortMode === 'phaseOrder') {
      list.sort((a, b) => compareByPhaseOrder(a, b, phaseRank))
    } else if (sortMode === 'nameAsc') {
      list.sort((a, b) => a.name.localeCompare(b.name, locale === 'pl' ? 'pl' : 'en'))
    } else {
      list.sort((a, b) => b.name.localeCompare(a.name, locale === 'pl' ? 'pl' : 'en'))
    }
    return list
  }, [cards, phaseFilter, sortMode, phaseRank, locale])

  const slides = useMemo(() => chunk(filteredSorted, perSlide), [filteredSorted, perSlide])

  const carouselKey = `${phaseFilter}-${sortMode}-${perSlide}-${filteredSorted.length}`

  useEffect(() => {
    if (!focusSlug || typeof window === 'undefined') return
    const run = () => {
      document.getElementById(`teardrop-gallery-card-${focusSlug}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
    const id = window.setTimeout(run, 320)
    return () => window.clearTimeout(id)
  }, [focusSlug, carouselKey])

  const renderCard = (card: TeardropCollectionCard) => {
    const tf = (field: string) => card.texts.find((x) => x.field === field)?.content?.trim() ?? ''
    const tagline = tf('tagline')
    const description = tf('description')
    const affirmation = tf('affirmation')
    const meaningUpright = tf('meaning_upright')
    const meaningShadow = tf('meaning_shadow')
    const isFocused = Boolean(focusSlug && focusSlug === card.slug)
    return (
      <article
        id={`teardrop-gallery-card-${card.slug}`}
        className={cn(
          'lore-card border-0 bg-white/70 space-y-3 h-full min-h-[12rem]',
          isFocused && 'ring-2 ring-coral/50 ring-offset-2 ring-offset-pearl',
        )}
      >
        <div>
          <p className="text-lora text-xl text-ink">{card.name}</p>
          {tagline && (
            <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-muted">
              {tagline}
            </p>
          )}
        </div>

        {description && (
          <p className="text-lora text-sm leading-relaxed text-ink/80 line-clamp-6">{description}</p>
        )}

        {affirmation && (
          <p className="text-lora text-sm italic leading-relaxed text-ink/70 border-l-2 border-ink/15 pl-3 line-clamp-4">
            {affirmation}
          </p>
        )}

        {(meaningUpright || meaningShadow) && (
          <div className="pt-1 space-y-2">
            {meaningUpright && (
              <div>
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-ink-muted">
                  {t('lightLabel')}
                </p>
                <p className="mt-0.5 font-mono text-[0.62rem] leading-relaxed text-ink/75 whitespace-pre-line line-clamp-4">
                  {meaningUpright}
                </p>
              </div>
            )}
            {meaningShadow && (
              <div>
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-ink-muted">
                  {t('shadowLabel')}
                </p>
                <p className="mt-0.5 font-mono text-[0.62rem] leading-relaxed text-ink/55 whitespace-pre-line line-clamp-4">
                  {meaningShadow}
                </p>
              </div>
            )}
          </div>
        )}
      </article>
    )
  }

  if (filteredSorted.length === 0) {
    return <p className="text-lora text-sm text-ink/80">{t('emptyFiltered')}</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="teardrop-phase-filter" className="font-mono text-[0.55rem] uppercase tracking-widest text-ink-muted">
            {t('filterPhase')}
          </label>
          <select
            id="teardrop-phase-filter"
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value as typeof phaseFilter)}
            className="w-full rounded-lg border border-pearl-border bg-white/90 px-3 py-2 font-mono text-[0.70rem] text-ink shadow-sm"
          >
            <option value="all">{t('filterAllPhases')}</option>
            {phases.map((p) => (
              <option key={p.slug} value={p.slug}>
                {phaseTitle[p.slug] ?? p.slug}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="teardrop-sort" className="font-mono text-[0.55rem] uppercase tracking-widest text-ink-muted">
            {t('sortLabel')}
          </label>
          <select
            id="teardrop-sort"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="w-full rounded-lg border border-pearl-border bg-white/90 px-3 py-2 font-mono text-[0.70rem] text-ink shadow-sm"
          >
            <option value="phaseOrder">{t('sortPhaseOrder')}</option>
            <option value="nameAsc">{t('sortNameAsc')}</option>
            <option value="nameDesc">{t('sortNameDesc')}</option>
          </select>
        </div>
      </div>

      <p className="font-mono text-[0.58rem] text-ink-muted">
        {t('carouselHint', { n: filteredSorted.length })}
      </p>

      <Carousel key={carouselKey} opts={{ align: 'start', containScroll: 'trimSnaps' }} className="w-full px-2 sm:px-10">
        <CarouselContent className="-ml-3 md:-ml-4">
          {slides.map((group, slideIdx) => (
            <CarouselItem key={`slide-${slideIdx}`} className="basis-full pl-3 md:pl-4">
              <div
                className={cn(
                  'grid gap-4 min-h-[10rem]',
                  perSlide === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                )}
              >
                {group.map((card) => (
                  <div key={card.id} className="min-w-0">
                    {renderCard(card)}
                  </div>
                ))}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="left-0 top-[45%] size-9 border-pearl-border bg-white/90 text-ink shadow-md" />
            <CarouselNext className="right-0 top-[45%] size-9 border-pearl-border bg-white/90 text-ink shadow-md" />
          </>
        )}
      </Carousel>
    </div>
  )
}
