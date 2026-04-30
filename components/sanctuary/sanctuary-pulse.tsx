'use client'

import { useMemo, useId } from 'react'
import { useTranslations } from 'next-intl'
import {
  NOTE_LIST,
  EMOTIONS,
  HEALING_STYLE_LABEL,
  computePulseDistribution,
} from '@/lib/notes'
import { hexToRgba } from '@/lib/hex-rgba'
import { cn } from '@/lib/utils'

type EmotionRow = {
  emotionId: string
  namePl: string
  nameEn: string | null
  listenSeconds: number
  teardropFocusSeconds: number
  teardropClaims: number
}

type SoundieRow = {
  noteId: string
  totalListenTime: number
}

interface Props {
  emotions: EmotionRow[]
  soundieProgress?: SoundieRow[]
  locale: 'en' | 'pl'
  todayTeardropName?: string | null
  todayNoteId?: string | null
  className?: string
}

const EMOTION_HEX = new Map<string, string>(
  NOTE_LIST.map((n) => [n.emotionId, n.chromaHex]),
)

const EMOTION_NAME = new Map<string, { pl: string; en: string }>(
  EMOTIONS.map((e) => [e.id, { pl: e.namePl, en: e.nameEn ?? e.namePl }]),
)

function rangeScore(e: EmotionRow): number {
  return e.listenSeconds * 0.5 + e.teardropFocusSeconds * 0.8 + e.teardropClaims * 2
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutArcPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const os = polarToXY(cx, cy, outerR, startDeg)
  const oe = polarToXY(cx, cy, outerR, endDeg)
  const ie = polarToXY(cx, cy, innerR, endDeg)
  const is_ = polarToXY(cx, cy, innerR, startDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${os.x.toFixed(3)} ${os.y.toFixed(3)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x.toFixed(3)} ${oe.y.toFixed(3)}`,
    `L ${ie.x.toFixed(3)} ${ie.y.toFixed(3)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${is_.x.toFixed(3)} ${is_.y.toFixed(3)}`,
    'Z',
  ].join(' ')
}

const GAP_DEG = 3.5
const CX = 50
const CY = 50
const OUTER_R = 44
const INNER_R = 28
const DOMINANT_OUTER_R = 47

export function SanctuaryPulse({
  emotions,
  soundieProgress,
  locale,
  todayTeardropName,
  todayNoteId,
  className,
}: Props) {
  const t = useTranslations('sanctuary')
  const gradId = useId()

  const rangeScored = useMemo(
    () =>
      emotions
        .map((e) => ({ ...e, score: rangeScore(e) }))
        .filter((e) => e.score > 0)
        .sort((a, b) => b.score - a.score),
    [emotions],
  )

  const spreadScores = useMemo(
    () => (soundieProgress ? computePulseDistribution(soundieProgress) : new Map<string, number>()),
    [soundieProgress],
  )

  const mergedScored = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of rangeScored) map.set(e.emotionId, e.score)
    const rangeTotal = Array.from(map.values()).reduce((s, v) => s + v, 0)
    const spreadTotal = Array.from(spreadScores.values()).reduce((s, v) => s + v, 0)
    const spreadWeight = spreadTotal > 0 ? Math.min(rangeTotal / spreadTotal, 1) * 0.35 : 0
    for (const [eid, spreadScore] of spreadScores) {
      map.set(eid, (map.get(eid) ?? 0) + spreadScore * spreadWeight)
    }
    return Array.from(map.entries())
      .map(([emotionId, score]) => {
        const row = emotions.find((e) => e.emotionId === emotionId)
        return {
          emotionId,
          namePl: row?.namePl ?? (EMOTION_NAME.get(emotionId)?.pl ?? emotionId),
          nameEn: row?.nameEn ?? (EMOTION_NAME.get(emotionId)?.en ?? null),
          score,
        }
      })
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
  }, [rangeScored, spreadScores, emotions])

  const total = useMemo(() => mergedScored.reduce((s, e) => s + e.score, 0), [mergedScored])

  const segments = useMemo(() => {
    if (total === 0 || mergedScored.length === 0) return []
    const effectiveGap = mergedScored.length === 1 ? 0 : GAP_DEG
    let cursor = 0
    return mergedScored.map((e, i) => {
      const fraction = e.score / total
      const span = fraction * (360 - effectiveGap * mergedScored.length)
      const startDeg = cursor + (i === 0 ? 0 : effectiveGap / 2)
      const endDeg = startDeg + span - (i === mergedScored.length - 1 ? effectiveGap / 2 : 0)
      cursor = startDeg + span + effectiveGap / 2
      const hex = EMOTION_HEX.get(e.emotionId) ?? '#8b7b6a'
      const isDominant = i === 0
      return { e, startDeg, endDeg, hex, isDominant }
    })
  }, [mergedScored, total])

  const dominant = mergedScored[0] ?? null
  const second = mergedScored[1] ?? null
  const dominantName = dominant
    ? locale === 'pl' ? dominant.namePl : (dominant.nameEn ?? dominant.namePl)
    : null
  const secondName = second
    ? locale === 'pl' ? second.namePl : (second.nameEn ?? second.namePl)
    : null
  const dominantHex = dominant ? (EMOTION_HEX.get(dominant.emotionId) ?? '#8b7b6a') : '#8b7b6a'

  const dominantNote = useMemo(
    () => dominant ? NOTE_LIST.find((n) => n.emotionId === dominant.emotionId) ?? null : null,
    [dominant],
  )
  const healingLabel = dominantNote
    ? HEALING_STYLE_LABEL[dominantNote.healingStyle]?.[locale] ?? dominantNote.healingStyle
    : null

  const secondaryResonance = useMemo(() => {
    if (!dominant || !soundieProgress?.length) return []
    const spread = computePulseDistribution(soundieProgress)
    return Array.from(spread.entries())
      .filter(([eid]) => eid !== dominant.emotionId)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([eid]) => ({
        emotionId: eid,
        name: locale === 'pl'
          ? (EMOTION_NAME.get(eid)?.pl ?? eid)
          : (EMOTION_NAME.get(eid)?.en ?? eid),
        hex: EMOTION_HEX.get(eid) ?? '#8b7b6a',
      }))
  }, [dominant, soundieProgress, locale])

  const todayNoteHex = useMemo(
    () => todayNoteId ? NOTE_LIST.find((n) => n.id === todayNoteId)?.chromaHex ?? null : null,
    [todayNoteId],
  )

  const narrativeKey = !dominant
    ? 'pulseEmpty'
    : secondName && second && second.score > dominant.score * 0.38
    ? 'pulseNarrative2'
    : 'pulseNarrative1'

  const narrative =
    narrativeKey === 'pulseEmpty'
      ? t('pulseEmpty')
      : narrativeKey === 'pulseNarrative2'
      ? t('pulseNarrative2', { name1: dominantName!, name2: secondName! })
      : t('pulseNarrative1', { name: dominantName! })

  const isEmpty = segments.length === 0

  return (
    <div className={cn('lore-card border-0', className)}>
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-ink-muted">
        {t('pulseTitle')}
      </p>

      <div className="mt-4 flex items-start gap-5">
        <div className="relative shrink-0">
          <svg
            viewBox="0 0 100 100"
            className="h-[92px] w-[92px] sanctuary-pulse-orb"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`${gradId}-bg`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={hexToRgba(dominantHex, 0.14)} />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            <circle cx={CX} cy={CY} r={OUTER_R + 5} fill={`url(#${gradId}-bg)`} />

            {isEmpty ? (
              <>
                <circle
                  cx={CX} cy={CY} r={OUTER_R}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  className="text-pearl-border/55"
                  strokeDasharray="4 3"
                />
                <circle
                  cx={CX} cy={CY} r={INNER_R - 2}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-pearl-border/35"
                />
              </>
            ) : (
              <>
                {segments.map(({ e, startDeg, endDeg, hex, isDominant }, i) => {
                  const outerR = isDominant ? DOMINANT_OUTER_R : OUTER_R
                  return (
                    <path
                      key={`${e.emotionId}-${i}`}
                      d={donutArcPath(CX, CY, outerR, INNER_R, startDeg, endDeg)}
                      fill={hex}
                      opacity={isDominant ? 0.9 : 0.38 + (1 - i / mergedScored.length) * 0.34}
                      className="transition-all duration-700"
                    />
                  )
                })}
                <circle cx={CX} cy={CY} r={INNER_R - 1} fill="white" opacity="0.05" />
                <circle
                  cx={CX} cy={CY} r={INNER_R - 0.5}
                  fill="none"
                  stroke={dominantHex}
                  strokeWidth="0.6"
                  opacity="0.3"
                />
              </>
            )}
          </svg>

          {dominant && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <span
                className="font-mono text-[0.55rem] font-bold uppercase tracking-wide leading-tight text-center px-1"
                style={{ color: dominantHex, maxWidth: '38px', wordBreak: 'break-word' }}
              >
                {locale === 'pl'
                  ? dominant.namePl.split(' ')[0]
                  : (dominant.nameEn ?? dominant.namePl).split(' ')[0]}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          {dominant ? (
            <>
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                {t('pulseDominantLabel')}
              </p>
              <p
                className="mt-0.5 text-lora text-[1.08rem] font-semibold leading-snug"
                style={{ color: dominantHex }}
              >
                {dominantName}
              </p>
              {healingLabel && (
                <p
                  className="mt-0.5 font-mono text-[0.56rem] uppercase tracking-[0.18em]"
                  style={{ color: hexToRgba(dominantHex, 0.65) }}
                >
                  {t('pulseHealingMode', { style: healingLabel })}
                </p>
              )}
              <p className="mt-2 text-lora text-[0.78rem] leading-relaxed text-ink/72">
                {narrative}
              </p>
            </>
          ) : (
            <p className="text-lora text-[0.8rem] leading-relaxed text-ink/60">
              {t('pulseEmpty')}
            </p>
          )}

          {todayTeardropName && (
            <p
              className="mt-2.5 font-mono text-[0.58rem] uppercase tracking-[0.12em]"
              style={{ color: todayNoteHex ? hexToRgba(todayNoteHex, 0.7) : undefined }}
            >
              {t('pulseTodayCard', { name: todayTeardropName })}
            </p>
          )}
        </div>
      </div>

      {(segments.length > 1 || secondaryResonance.length > 0) && (
        <div className="mt-4 space-y-2">
          {segments.length > 1 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {segments.slice(0, 5).map(({ e, hex }) => (
                <div key={e.emotionId} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: hex }} />
                  <span className="font-mono text-[0.54rem] uppercase tracking-[0.12em] text-ink-muted">
                    {locale === 'pl' ? e.namePl : (e.nameEn ?? e.namePl)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {secondaryResonance.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[0.52rem] uppercase tracking-[0.14em] text-ink-muted/60">
                {t('pulseSecondaryLabel')}
              </span>
              {secondaryResonance.map(({ emotionId, name, hex }) => (
                <div key={emotionId} className="flex items-center gap-1">
                  <span className="h-1 w-1 shrink-0 rounded-full opacity-60" style={{ backgroundColor: hex }} />
                  <span className="font-mono text-[0.52rem] uppercase tracking-[0.1em] text-ink-muted/75">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
