'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { scaleTime, scaleSqrt, line as d3Line, curveMonotoneX } from 'd3'
import { cn } from '@/lib/utils'

const TIMELINE_HEIGHT = 80
const INSET_X = 18
const CENTER_Y = 44
const MIN_R = 3.5
const MAX_R = 13

type Session = {
  id: string
  duration: number
  completedAt: Date | string
}

type TooltipState = {
  x: number
  y: number
  minutes: number
  date: string
}

type Props = {
  sessions: Session[]
  totalSeconds: number
  noteHex: string
  locale: string
  className?: string
}

export function NoteTimeline({ sessions, totalSeconds, noteHex, locale, className }: Props) {
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

  const sorted = useMemo(
    () =>
      [...sessions]
        .map((s) => ({ ...s, completedAt: new Date(s.completedAt) }))
        .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime()),
    [sessions],
  )

  const { xScale, pathD, points } = useMemo(() => {
    if (sorted.length === 0) return { xScale: null, pathD: null, points: [] }

    const now = Date.now()
    const first = sorted[0]!.completedAt.getTime()
    const span = Math.max(now - first, 1)

    const domainStart = new Date(first - Math.max(span * 0.06, 3_600_000))
    const domainEnd = new Date(now + Math.max(span * 0.03, 900_000))

    const xScaleLocal = scaleTime()
      .domain([domainStart, domainEnd])
      .range([INSET_X + MAX_R, Math.max(INSET_X + MAX_R + 1, width - INSET_X - MAX_R)])

    const maxDur = Math.max(...sorted.map((s) => s.duration), 1)
    const rScale = scaleSqrt().domain([0, maxDur]).range([MIN_R, MAX_R])

    const pts = sorted.map((s) => ({
      ...s,
      x: xScaleLocal(s.completedAt),
      r: rScale(s.duration),
    }))

    const lineGen = d3Line<(typeof pts)[number]>()
      .x((d) => d.x)
      .y(() => CENTER_Y)
      .curve(curveMonotoneX)

    return { xScale: xScaleLocal, pathD: lineGen(pts), points: pts }
  }, [sorted, width])

  const totalMinutes = Math.floor(totalSeconds / 60)

  const formatDate = (d: Date) =>
    d.toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (sessions.length === 0) return null

  return (
    <div ref={containerRef} className={cn('w-full select-none', className)}>
      <div className="mb-2 flex items-baseline gap-2 px-1">
        <span
          className="font-[family-name:var(--font-fraunces,serif)] text-3xl font-semibold tabular-nums leading-none"
          style={{ color: noteHex }}
        >
          {totalMinutes}
        </span>
        <span className="font-mono text-[0.54rem] uppercase tracking-[0.2em] text-ink-muted/70">
          {t('minutesLabel')}
        </span>
        <span className="ml-auto font-mono text-[0.5rem] tabular-nums text-ink-muted/40">
          {t('sessionsCount', { n: sessions.length })}
        </span>
      </div>

      <div className="relative overflow-visible rounded-xl border border-pearl-border/35 bg-pearl-dark/22">
        <svg
          width={width}
          height={TIMELINE_HEIGHT}
          className="block"
          aria-hidden
        >
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={noteHex}
              strokeWidth={1.5}
              strokeOpacity={0.15}
              strokeDasharray="4 4"
            />
          )}

          {points.map((pt, i) => {
            const isNewest = i === points.length - 1
            const opacity = 0.38 + (i / Math.max(points.length - 1, 1)) * 0.52
            return (
              <g key={pt.id}>
                {isNewest && (
                  <circle
                    cx={pt.x}
                    cy={CENTER_Y}
                    r={pt.r + 6}
                    fill={noteHex}
                    fillOpacity={0.1}
                    className="note-timeline-pulse"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={CENTER_Y}
                  r={pt.r}
                  fill={noteHex}
                  fillOpacity={isNewest ? 0.9 : opacity}
                  stroke={noteHex}
                  strokeWidth={1}
                  strokeOpacity={0.3}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() =>
                    setTooltip({
                      x: pt.x,
                      y: CENTER_Y - pt.r - 8,
                      minutes: Math.round(pt.duration / 60),
                      date: formatDate(pt.completedAt),
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  onTouchStart={() =>
                    setTooltip({
                      x: pt.x,
                      y: CENTER_Y - pt.r - 8,
                      minutes: Math.round(pt.duration / 60),
                      date: formatDate(pt.completedAt),
                    })
                  }
                  onTouchEnd={() => {
                    setTimeout(() => setTooltip(null), 1800)
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
                y1={CENTER_Y - 8}
                x2={nowX}
                y2={CENTER_Y + 8}
                stroke={noteHex}
                strokeWidth={1.5}
                strokeOpacity={0.2}
                strokeLinecap="round"
              />
            )
          })()}
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-pearl-border/55 bg-white/96 px-2.5 py-1.5 shadow-md backdrop-blur-sm"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p
              className="font-mono text-[0.66rem] font-semibold tabular-nums"
              style={{ color: noteHex }}
            >
              {tooltip.minutes} {t('minutesShort')}
            </p>
            <p className="mt-0.5 font-mono text-[0.54rem] text-ink-muted/70">{tooltip.date}</p>
          </div>
        )}
      </div>
    </div>
  )
}
