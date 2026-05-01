'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { trpc } from '@/lib/trpc/react'
import { useSoundieStore } from '@/lib/soundie-store'
import { cn } from '@/lib/utils'
import type { EmotionBalanceRow, EmotionBalanceOutput } from '@/lib/validators/resonance'

// ─── palette ─────────────────────────────────────────────────────────────────
const SHADOW_RGBA = 'rgba(45,27,66,'   // dark plum
const LIGHT_RGBA  = 'rgba(201,164,83,' // warm amber

// ─── single emotion glow field ───────────────────────────────────────────────
function GlowField({ row }: { row: EmotionBalanceRow }) {
  const logLight  = Math.log1p(row.inLightSeconds)
  const logShadow = Math.log1p(row.inShadowSeconds)
  const logMax    = Math.max(logLight, logShadow, 0.1)

  // 0..1 — how "present" each side is relative to the stronger one
  const lRatio = logLight  / logMax
  const sRatio = logShadow / logMax

  // Cloud widths: never fully absent (minimum 28%), max 82%
  const shadowW = 28 + sRatio * 54
  const lightW  = 28 + lRatio * 54

  // Opacity scales with presence
  const shadowOp = 0.18 + sRatio * 0.50
  const lightOp  = 0.15 + lRatio * 0.44

  return (
    <div
      className="relative h-[2.6rem] w-full overflow-hidden rounded-2xl"
      style={{ backgroundColor: 'rgba(230,225,218,0.28)' }}
      role="img"
      aria-label={`${row.namePl}`}
    >
      {/* shadow fog — left anchor */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{
          width: `${shadowW}%`,
          background: `radial-gradient(ellipse at 4% 50%, ${SHADOW_RGBA}${shadowOp.toFixed(2)}) 0%, transparent 78%)`,
        }}
      />
      {/* light fog — right anchor */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0"
        style={{
          width: `${lightW}%`,
          background: `radial-gradient(ellipse at 96% 50%, ${LIGHT_RGBA}${lightOp.toFixed(2)}) 0%, transparent 78%)`,
        }}
      />
      {/* hairline separator hint */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background: `linear-gradient(90deg, ${SHADOW_RGBA}0.08) 0%, transparent 40%, ${LIGHT_RGBA}0.06) 100%)`,
        }}
      />
      {/* note accent dot */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: row.noteHex, opacity: 0.45 }}
      />
    </div>
  )
}

// ─── emotion row (glow + label) ──────────────────────────────────────────────
function EmotionRow({ row, locale }: { row: EmotionBalanceRow; locale: 'en' | 'pl' }) {
  const name = locale === 'pl' || !row.nameEn ? row.namePl : row.nameEn
  return (
    <div className="space-y-1">
      <GlowField row={row} />
      <p className="font-mono text-[0.52rem] uppercase tracking-[0.16em] text-ink-muted/80">
        {name}
      </p>
    </div>
  )
}

// ─── weekly shift narrative ───────────────────────────────────────────────────
function WeeklyShiftBlock({
  data,
  locale,
}: {
  data: EmotionBalanceOutput
  locale: 'en' | 'pl'
}) {
  const t = useTranslations('emotionBalance')
  const emotionName =
    data.shiftEmotionId
      ? (locale === 'pl' || !data.shiftEmotionNameEn
          ? data.shiftEmotionNamePl
          : data.shiftEmotionNameEn)
      : null

  const narrative = emotionName
    ? t(`weeklyShiftWithEmotion.${data.weeklyShift}`, { emotion: emotionName.toLowerCase() })
    : t(`weeklyShift.${data.weeklyShift}`)

  return (
    <div className="mt-4 rounded-2xl border border-pearl-border/35 bg-pearl-dark/15 px-4 py-3.5">
      <p className="font-mono text-[0.5rem] uppercase tracking-[0.22em] text-ink-muted/70">
        {t('weeklyShiftKicker')}
      </p>
      <p className="mt-2 font-body-serif text-[0.84rem] leading-relaxed text-ink/85">
        {narrative}
      </p>
    </div>
  )
}

// ─── legend ──────────────────────────────────────────────────────────────────
function Legend() {
  const t = useTranslations('emotionBalance')
  return (
    <div className="flex items-center gap-4 font-mono text-[0.52rem] uppercase tracking-[0.14em] text-ink-muted/80">
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-5 rounded-sm"
          style={{ background: `radial-gradient(ellipse at 5% 50%, rgba(45,27,66,0.68) 0%, transparent 85%)` }}
        />
        {t('legendShadow')}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-5 rounded-sm"
          style={{ background: `radial-gradient(ellipse at 95% 50%, rgba(201,164,83,0.55) 0%, transparent 85%)` }}
        />
        {t('legendLight')}
      </span>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
interface EmotionBalanceProps {
  playerId: string
  locale: 'en' | 'pl'
  dayStartIso?: string
  className?: string
}

export function EmotionBalance({ playerId, locale, dayStartIso, className }: EmotionBalanceProps) {
  const t = useTranslations('emotionBalance')

  const query = trpc.resonance.getEmotionBalance.useQuery(
    { playerId, locale, dayStartIso },
    { enabled: Boolean(playerId), staleTime: 90_000, retry: false },
  )

  const data = query.data
  const todayRows = data?.today ?? []
  const weekRows  = data?.week  ?? []
  const showToday = todayRows.length > 0
  const showWeek  = weekRows.length > 0

  if (query.isLoading) return (
    <p className="font-mono text-[0.65rem] text-ink-muted">{t('loading')}</p>
  )

  if (!data || (!showToday && !showWeek)) return null

  return (
    <div className={cn('w-full', className)}>
      {/* section header */}
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
        {t('title')}
      </p>
      <p className="mt-1 font-body-serif text-sm leading-relaxed text-ink/80">
        {t('subtitle')}
      </p>

      {/* today */}
      {showToday && (
        <div className="mt-4">
          <p className="mb-2.5 font-mono text-[0.52rem] uppercase tracking-[0.18em] text-ink-muted/70">
            {t('todayLabel')}
          </p>
          <div className="space-y-3">
            {todayRows.map((row) => (
              <EmotionRow key={row.emotionId} row={row} locale={locale} />
            ))}
          </div>
        </div>
      )}

      {/* week */}
      {showWeek && (
        <div className="mt-5">
          <p className="mb-2.5 font-mono text-[0.52rem] uppercase tracking-[0.18em] text-ink-muted/70">
            {t('weekLabel')}
          </p>
          <div className="space-y-3">
            {weekRows.map((row) => (
              <EmotionRow key={row.emotionId} row={row} locale={locale} />
            ))}
          </div>
        </div>
      )}

      {/* weekly narrative */}
      {data && <WeeklyShiftBlock data={data} locale={locale} />}

      {/* legend */}
      <div className="mt-3">
        <Legend />
      </div>
    </div>
  )
}

// ─── connected wrapper (reads playerId from store) ────────────────────────────
export function EmotionBalanceConnected({
  dayStartIso,
  className,
}: {
  dayStartIso?: string
  className?: string
}) {
  const locale     = useLocale() as 'en' | 'pl'
  const playerId   = useSoundieStore((s) => s.playerId)
  const hasHydrated = useSoundieStore((s) => s.hasHydrated)
  const t = useTranslations('emotionBalance')

  if (!hasHydrated) return null
  if (!playerId) return (
    <p className="font-body-serif text-sm italic text-ink/60">{t('needPlayer')}</p>
  )

  return (
    <EmotionBalance
      playerId={playerId}
      locale={locale}
      dayStartIso={dayStartIso}
      className={className}
    />
  )
}
