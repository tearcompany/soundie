'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSoundieStore } from '@/lib/soundie-store'
import { trpc } from '@/lib/trpc/react'
import { TeardropCollectionGallery } from '@/components/teardrop/teardrop-collection-gallery'

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

  return (
    <main className="relative min-h-0 flex-1 overflow-x-hidden bg-pearl">
      <section className="mx-auto w-full max-w-4xl px-4 py-8 pb-14 text-ink">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">{t('kicker')}</p>
        <h1 className="mt-2 text-lora text-3xl font-light leading-tight">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-lora text-sm text-ink/80">{t('sub')}</p>

        {!playerId && hasHydrated && (
          <p className="mt-6 text-lora text-sm text-ink/80">
            {t('noPlayer')}{' '}
            <Link className="underline decoration-ink/30 underline-offset-4" href="/teraz">
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

            {q.data.cards.length === 0 ? (
              <p className="text-lora text-sm text-ink/80">{t('empty')}</p>
            ) : (
              <TeardropCollectionGallery
                cards={q.data.cards}
                phases={q.data.phases}
                locale={locale}
                focusSlug={focusSlug}
              />
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
