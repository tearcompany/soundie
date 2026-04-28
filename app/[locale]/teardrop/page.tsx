'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSoundieStore } from '@/lib/soundie-store'
import { trpc } from '@/lib/trpc/react'

function TeardropPageInner() {
  const t = useTranslations('teardropPage')
  const locale = useLocale() as 'en' | 'pl'
  const playerId = useSoundieStore((s) => s.playerId)
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const searchParams = useSearchParams()
  const focusSlug = searchParams.get('teardrop')

  const q = trpc.teardrop.getUnlockedCollection.useQuery(
    { playerId: playerId!, locale },
    { enabled: hasHydrated && Boolean(playerId), staleTime: 20_000 },
  )

  const galleryByPhase = useMemo(() => {
    const data = q.data
    if (!data) return []
    const cards = data.cards ?? []
    const phases = data.phases ?? []
    if (cards.length === 0) return []
    const titleBySlug = Object.fromEntries(
      phases.map((p) => [p.slug, locale === 'pl' ? p.titlePl : p.titleEn]),
    )
    const order = phases.map((p) => p.slug)
    const map = new Map<string, typeof cards>()
    for (const card of cards) {
      const slug = card.phase ?? 'archetypes'
      if (!map.has(slug)) map.set(slug, [])
      map.get(slug)!.push(card)
    }
    return [...map.entries()]
      .sort(([a], [b]) => {
        const ai = order.indexOf(a)
        const bi = order.indexOf(b)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
      .map(([slug, phaseCards]) => ({
        slug,
        title: titleBySlug[slug] ?? slug,
        cards: phaseCards,
      }))
  }, [q.data, locale])

  useEffect(() => {
    if (!focusSlug || typeof window === 'undefined') return
    const run = () => {
      document.getElementById(`teardrop-gallery-card-${focusSlug}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
    const id = window.setTimeout(run, 200)
    return () => window.clearTimeout(id)
  }, [focusSlug, q.isSuccess, galleryByPhase])

  return (
    <main className="relative min-h-0 flex-1 overflow-x-hidden bg-pearl">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 pb-14 text-ink">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">{t('kicker')}</p>
        <h1 className="mt-2 text-lora text-3xl font-light leading-tight">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-lora text-sm text-ink/80">{t('sub')}</p>

        {!playerId && hasHydrated && (
          <p className="mt-6 text-lora text-sm text-ink/80">
            {t('noPlayer')}{' '}
            <Link className="underline decoration-ink/30 underline-offset-4" href="/play">
              {t('goPlay')}
            </Link>
          </p>
        )}

        {playerId && q.isLoading && (
          <p className="mt-6 font-mono text-xs text-ink-muted">{t('loading')}</p>
        )}

        {playerId && q.isError && (
          <p className="mt-6 font-mono text-xs text-coral">
            {t('loadError')}
          </p>
        )}

        {playerId && q.data && (
          <div className="mt-6 space-y-6">
            <div className="lore-card border-0">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
                {t('victoryTitle')}
              </p>
              <p className="mt-2 text-lora text-lg text-ink">
                {t('progress', { unlocked: q.data.unlockedCards, total: q.data.totalDeckCards })}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-pearl-border/70">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        q.data.totalDeckCards > 0 ? (q.data.unlockedCards / q.data.totalDeckCards) * 100 : 0,
                      ),
                    )}%`,
                    backgroundColor: '#FF6B4A',
                  }}
                />
              </div>
            </div>

            {galleryByPhase.length === 0 ? (
              <p className="text-lora text-sm text-ink/80">{t('empty')}</p>
            ) : (
              <div className="space-y-10">
                {galleryByPhase.map((group) => (
                  <section key={group.slug} className="space-y-4">
                    <div className="border-b border-pearl-border pb-2">
                      <h2 className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink">
                        {group.title}
                      </h2>
                      <p className="mt-1 font-mono text-[0.58rem] text-ink-muted">
                        {t('phaseCardCount', { n: group.cards.length })}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {group.cards.map((card) => {
                        const tf = (field: string) =>
                          card.texts.find((x) => x.field === field)?.content?.trim() ?? ''
                        const tagline = tf('tagline')
                        const description = tf('description')
                        const affirmation = tf('affirmation')
                        const meaningUpright = tf('meaningUpright')
                        const meaningShadow = tf('meaningShadow')
                        const isFocused = Boolean(focusSlug && focusSlug === card.slug)
                        return (
                          <article
                            key={card.id}
                            id={`teardrop-gallery-card-${card.slug}`}
                            className={`lore-card border-0 bg-white/70 space-y-3 ${
                              isFocused ? 'ring-2 ring-coral/50 ring-offset-2 ring-offset-pearl' : ''
                            }`}
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
                              <p className="text-lora text-sm leading-relaxed text-ink/80">
                                {description}
                              </p>
                            )}

                            {affirmation && (
                              <p className="text-lora text-sm italic leading-relaxed text-ink/70 border-l-2 border-ink/15 pl-3">
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
                                    <p className="mt-0.5 font-mono text-[0.62rem] leading-relaxed text-ink/75 whitespace-pre-line">
                                      {meaningUpright}
                                    </p>
                                  </div>
                                )}
                                {meaningShadow && (
                                  <div>
                                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-ink-muted">
                                      {t('shadowLabel')}
                                    </p>
                                    <p className="mt-0.5 font-mono text-[0.62rem] leading-relaxed text-ink/55 whitespace-pre-line">
                                      {meaningShadow}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default function TeardropPage() {
  const t = useTranslations('teardropPage')
  return (
    <Suspense
      fallback={
        <main className="relative min-h-0 flex-1 overflow-x-hidden bg-pearl">
          <section className="mx-auto w-full max-w-4xl px-4 py-8 pb-14 text-ink">
            <p className="font-mono text-xs text-ink-muted">{t('loading')}</p>
          </section>
        </main>
      }
    >
      <TeardropPageInner />
    </Suspense>
  )
}
