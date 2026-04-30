'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { scaleTime, line as d3Line, curveMonotoneX } from 'd3'
import { cn } from '@/lib/utils'
import { getNoteHealingProfile } from '@/lib/note-healing-profiles'

const TIMELINE_HEIGHT = 88
const INSET_X = 18
const CENTER_Y = 50

type Intensity = 'low' | 'medium' | 'deep'

const INTENSITY_RADIUS: Record<Intensity, number> = {
  low: 3.5,
  medium: 6,
  deep: 9.5,
}

const CLUSTER_WINDOW_MS = 10 * 60 * 1000

type SessionInput = {
  id: string
  duration: number
  completedAt: Date | string
}

type ClusteredPoint = {
  id: string
  duration: number
  completedAt: Date
  count: number
  intensity: Intensity
}

type TooltipState = {
  x: number
  y: number
  archetype: string
  action: string
  affirmation: string
  count: number
}

type Props = {
  sessions: SessionInput[]
  totalSeconds: number
  noteId: string
  noteShort: string
  noteHex: string
  locale: 'en' | 'pl'
  className?: string
}

// `locale` is consumed by useTranslations indirectly via next-intl context,
// but we keep it in props to read the right healing profile.

function intensityFromDuration(seconds: number): Intensity {
  if (seconds < 120) return 'low'
  if (seconds < 300) return 'medium'
  return 'deep'
}

function clusterSessions(sortedAsc: { id: string; duration: number; completedAt: Date }[]): ClusteredPoint[] {
  const out: ClusteredPoint[] = []
  for (const s of sortedAsc) {
    const last = out[out.length - 1]
    if (last && s.completedAt.getTime() - last.completedAt.getTime() <= CLUSTER_WINDOW_MS) {
      last.duration += s.duration
      last.count += 1
      last.completedAt = s.completedAt
      last.intensity = intensityFromDuration(last.duration)
    } else {
      out.push({
        id: s.id,
        duration: s.duration,
        completedAt: s.completedAt,
        count: 1,
        intensity: intensityFromDuration(s.duration),
      })
    }
  }
  return out
}

export function NoteTimeline({
  sessions,
  totalSeconds,
  noteId,
  noteShort,
  noteHex,
  locale,
  className,
}: Props) {
  const t = useTranslations('noteTimeline')
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(300)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  const profile = useMemo(() => getNoteHealingProfile(noteId, locale), [noteId, locale])
  const archetype = profile?.archetype ?? profile?.noteName ?? ''
  const affirmationLine = profile?.shortMeaning ?? ''

  const clusters = useMemo(() => {
    const normalized = sessions
      .map((s) => ({
        id: s.id,
        duration: s.duration,
        completedAt: new Date(s.completedAt),
      }))
      .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
    return clusterSessions(normalized)
  }, [sessions])

  const { xScale, pathD, points } = useMemo(() => {
    if (clusters.length === 0) return { xScale: null, pathD: null, points: [] as (ClusteredPoint & { x: number })[] }

    const now = Date.now()
    const first = clusters[0]!.completedAt.getTime()
    const span = Math.max(now - first, 1)
    const padLeft = Math.max(span * 0.06, 3_600_000)
    const padRight = Math.max(span * 0.03, 900_000)

    const x = scaleTime()
      .domain([new Date(first - padLeft), new Date(now + padRight)])
      .range([
        INSET_X + INTENSITY_RADIUS.deep,
        Math.max(INSET_X + INTENSITY_RADIUS.deep + 1, width - INSET_X - INTENSITY_RADIUS.deep),
      ])

    const positioned = clusters.map((c) => ({ ...c, x: x(c.completedAt) }))

    const lineGen = d3Line<(typeof positioned)[number]>()
      .x((d) => d.x)
      .y(() => CENTER_Y)
      .curve(curveMonotoneX)

    return { xScale: x, pathD: lineGen(positioned), points: positioned }
  }, [clusters, width])

  const totalMinutes = Math.floor(totalSeconds / 60)

  if (sessions.length === 0) return null

  return (
    <div ref={containerRef} className={cn('w-full select-none', className)}>
      <div className="mb-2.5 flex items-baseline gap-2 px-1">
        <h3 className="font-[family-name:var(--font-fraunces,serif)] text-[1.05rem] font-medium tracking-tight text-ink/90">
          {t('title')}
        </h3>
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-ink-muted/55">
          {t('summary', { minutes: totalMinutes, n: sessions.length })}
        </span>
      </div>

      <div className="relative overflow-visible rounded-xl border border-pearl-border/35 bg-pearl-dark/22">
        <svg width={width} height={TIMELINE_HEIGHT} className="block" aria-hidden>
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={noteHex}
              strokeWidth={1.5}
              strokeOpacity={0.14}
              strokeDasharray="4 4"
            />
          )}

          {points.map((pt, i) => {
            const isNewest = i === points.length - 1
            const fade = 0.42 + (i / Math.max(points.length - 1, 1)) * 0.5
            const r = INTENSITY_RADIUS[pt.intensity]
            const showGlow = pt.intensity === 'deep' || isNewest
            return (
              <g key={pt.id}>
                {showGlow && (
                  <circle
                    cx={pt.x}
                    cy={CENTER_Y}
                    r={r + (pt.intensity === 'deep' ? 8 : 5)}
                    fill={noteHex}
                    fillOpacity={pt.intensity === 'deep' ? 0.16 : 0.1}
                    className={isNewest ? 'note-timeline-pulse' : undefined}
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={CENTER_Y}
                  r={r}
                  fill={noteHex}
                  fillOpacity={isNewest ? 0.92 : fade}
                  stroke={noteHex}
                  strokeWidth={1}
                  strokeOpacity={0.32}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() =>
                    setTooltip({
                      x: pt.x,
                      y: CENTER_Y - r - 8,
                      archetype: archetype
                        ? `${noteShort} — ${archetype}`
                        : noteShort,
                      action: t(`action.${pt.intensity}` as 'action.low'),
                      affirmation: affirmationLine,
                      count: pt.count,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  onTouchStart={() =>
                    setTooltip({
                      x: pt.x,
                      y: CENTER_Y - r - 8,
                      archetype: archetype
                        ? `${noteShort} — ${archetype}`
                        : noteShort,
                      action: t(`action.${pt.intensity}` as 'action.low'),
                      affirmation: affirmationLine,
                      count: pt.count,
                    })
                  }
                  onTouchEnd={() => {
                    setTimeout(() => setTooltip(null), 2400)
                  }}
                />
              </g>
            )
          })}

          {xScale && (() => {
            const nowX = xScale(new Date())
            return (
              <line
                x1={nowX}
                y1={CENTER_Y - 10}
                x2={nowX}
                y2={CENTER_Y + 10}
                stroke={noteHex}
                strokeWidth={1.5}
                strokeOpacity={0.18}
                strokeLinecap="round"
              />
            )
          })()}
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 max-w-[14rem] -translate-x-1/2 -translate-y-full rounded-lg border border-pearl-border/55 bg-white/97 px-3 py-2 shadow-md backdrop-blur-sm"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p
              className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.12em]"
              style={{ color: noteHex }}
            >
              {tooltip.archetype}
            </p>
            <p className="mt-1 text-lora text-[0.78rem] leading-snug text-ink/85">
              {tooltip.action}
            </p>
            {tooltip.affirmation && (
              <p className="mt-1 text-lora text-[0.74rem] italic leading-snug text-ink/65 border-l-2 border-ink/15 pl-2">
                “{tooltip.affirmation}”
              </p>
            )}
            {tooltip.count > 1 && (
              <p className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-ink-muted/60">
                {t('clustered', { n: tooltip.count })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
