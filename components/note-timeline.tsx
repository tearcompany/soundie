'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  area as d3Area,
  curveBasis,
  scaleLinear,
  select,
  stack,
  stackOffsetWiggle,
  stackOrderNone,
} from 'd3'
import { cn } from '@/lib/utils'
import { hexToRgba } from '@/lib/hex-rgba'
import { computePulseDistribution, getEmotionById } from '@/lib/notes'

const HEIGHT = 228
const BUCKETS = 46
const RECOMPUTE_MS = 12_000

type StreamSession = {
  id: string
  durationSeconds: number
  completedAt: Date | string
  noteId: string
  noteShort: string
  noteName: string
  noteHex: string
}

type Props = {
  sessions: StreamSession[]
  totalSeconds: number
  locale: 'en' | 'pl'
  windowHours?: number
  sessionElapsedSeconds?: number
  sessionActive?: boolean
  isPlaying?: boolean
  frequencyHz?: number
  pulseDepth?: number
  sacredClimax?: boolean
  activeNoteHex?: string
  activeNoteShort?: string
  inTheLightLine?: string
  className?: string
}

type BucketRow = { idx: number } & Record<string, number>
type PathModel = {
  noteId: string
  noteShort: string
  noteName: string
  color: string
  d: string
  opacity: number
}

type TooltipState = {
  x: number
  y: number
  noteShort: string
  noteName: string
  minutes: number
  color: string
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function NoteTimeline({
  sessions,
  totalSeconds,
  locale,
  windowHours = 24,
  sessionElapsedSeconds = 0,
  sessionActive = false,
  frequencyHz = 432,
  activeNoteHex,
  activeNoteShort,
  inTheLightLine = '',
  className,
}: Props) {
  const t = useTranslations('noteTimeline')
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({})
  const [width, setWidth] = useState(320)
  const [nowMs, setNowMs] = useState(() => Date.now())
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

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), RECOMPUTE_MS)
    return () => clearInterval(id)
  }, [])

  const totalMinutes = Math.floor(totalSeconds / 60)

  const { paths, bucketDominants, dominantEmotion } = useMemo(() => {
    const baseWindowMs = windowHours * 60 * 60 * 1000
    const elapsedMs = Math.max(0, sessionElapsedSeconds) * 1000
    const zoomProgress = sessionActive ? clamp(elapsedMs / (45 * 60 * 1000), 0, 1) : 0
    const minWindowMs = 3 * 60 * 60 * 1000
    const windowMs = Math.max(minWindowMs, baseWindowMs - (baseWindowMs - minWindowMs) * zoomProgress)
    const domainStart = nowMs - windowMs
    const domainEnd = nowMs

    const filtered = sessions
      .filter((s) => {
        const ts = new Date(s.completedAt).getTime()
        return ts >= domainStart && ts <= domainEnd
      })
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())

    const noteMap = new Map<string, { noteShort: string; noteName: string; color: string }>()
    for (const s of filtered) {
      if (!noteMap.has(s.noteId)) {
        noteMap.set(s.noteId, { noteShort: s.noteShort, noteName: s.noteName, color: s.noteHex })
      }
    }
    const noteIds = Array.from(noteMap.keys())

    if (noteIds.length === 0) {
      return {
        paths: [] as PathModel[],
        bucketDominants: [] as TooltipState[],
        dominantEmotion: '',
      }
    }

    const bucketMs = windowMs / BUCKETS
    const rows: BucketRow[] = Array.from({ length: BUCKETS }, (_, i) => {
      const row: BucketRow = { idx: i }
      for (const noteId of noteIds) row[noteId] = 0
      return row
    })

    for (const s of filtered) {
      const ts = new Date(s.completedAt).getTime()
      const idx = clamp(Math.floor((ts - domainStart) / bucketMs), 0, BUCKETS - 1)
      const row = rows[idx]
      if (!row) continue
      row[s.noteId] = (row[s.noteId] ?? 0) + s.durationSeconds / 60
    }

    const x = scaleLinear().domain([0, BUCKETS - 1]).range([0, width])
    const y = scaleLinear().range([HEIGHT - 8, 8])

    const stackGen = stack<BucketRow, string>()
      .keys(noteIds)
      .value((d, key) => d[key] ?? 0)
      .offset(stackOffsetWiggle)
      .order(stackOrderNone)

    const layers = stackGen(rows)

    let minY = Number.POSITIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    for (const layer of layers) {
      for (const p of layer) {
        if (p[0] < minY) minY = p[0]
        if (p[1] > maxY) maxY = p[1]
      }
    }
    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || minY === maxY) {
      minY = -1
      maxY = 1
    }
    y.domain([minY, maxY])

    const area = d3Area<(typeof layers)[number][number]>()
      .x((d) => x((d.data as BucketRow).idx))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(curveBasis)

    const pathModels = layers.map((layer, i) => {
      const noteId = noteIds[i]!
      const meta = noteMap.get(noteId)!
      const d = area(layer) ?? ''
      return {
        noteId,
        noteShort: meta.noteShort,
        noteName: meta.noteName,
        color: meta.color,
        d,
        opacity: meta.noteShort === activeNoteShort ? 0.9 : 0.72,
      }
    })

    const bucketDominants: TooltipState[] = rows.map((row) => {
      let bestId = noteIds[0]!
      let best = row[bestId] ?? 0
      for (const noteId of noteIds) {
        const v = row[noteId] ?? 0
        if (v > best) {
          best = v
          bestId = noteId
        }
      }
      const meta = noteMap.get(bestId)!
      return {
        x: x(row.idx),
        y: 8,
        noteShort: meta.noteShort,
        noteName: meta.noteName,
        minutes: Math.max(1, Math.round(best)),
        color: meta.color,
      }
    })

    const listenByNote = new Map<string, number>()
    for (const s of filtered) {
      listenByNote.set(s.noteId, (listenByNote.get(s.noteId) ?? 0) + s.durationSeconds)
    }
    const progressForPulse = Array.from(listenByNote.entries()).map(([noteId, totalListenTime]) => ({
      noteId,
      totalListenTime,
    }))
    const scores = computePulseDistribution(progressForPulse)
    let bestEmotionId = ''
    let bestScore = 0
    for (const [eid, score] of scores) {
      if (score > bestScore) {
        bestScore = score
        bestEmotionId = eid
      }
    }
    const emo = bestEmotionId ? getEmotionById(bestEmotionId) : undefined
    const dominantEmotion = emo ? (locale === 'en' ? (emo.nameEn ?? emo.namePl) : emo.namePl) : ''

    return { paths: pathModels, bucketDominants, dominantEmotion }
  }, [sessions, width, windowHours, sessionElapsedSeconds, sessionActive, nowMs, activeNoteShort, locale])

  useEffect(() => {
    for (const model of paths) {
      const el = pathRefs.current[model.noteId]
      if (!el) continue
      select(el)
        .interrupt()
        .transition()
        .duration(1000)
        .attr('d', model.d)
        .attr('fill', hexToRgba(model.color, model.opacity))
    }
  }, [paths])

  if (sessions.length === 0) return null

  return (
    <div ref={containerRef} className={cn('w-full select-none', className)}>
      <div className="mb-2.5 flex items-baseline gap-2 px-1">
        <h3 className="font-[family-name:var(--font-fraunces,serif)] text-[1.05rem] font-medium tracking-tight text-ink/90">
          {t('title')}
        </h3>
        {dominantEmotion ? (
          <span className="font-body-serif text-[0.82rem] italic lowercase text-ink/55">
            · {dominantEmotion.toLowerCase()}
          </span>
        ) : null}
      </div>
      <div className="relative overflow-visible rounded-xl border border-pearl-border/35 bg-pearl-dark/22 backdrop-blur-[2px]">
        <div className="border-b border-pearl-border/25 px-4 pb-3 pt-3">
          <div className="flex justify-end">
            <p
              className="shrink-0 font-mono text-[0.62rem] tabular-nums tracking-[0.12em] text-ink-muted/75"
              style={activeNoteHex ? { color: hexToRgba(activeNoteHex, 0.88) } : undefined}
            >
              {Math.round(frequencyHz)} Hz
            </p>
          </div>
          {inTheLightLine ? (
            <div className="mt-2.5 space-y-1">
              <p className="font-mono text-[0.48rem] uppercase tracking-[0.18em] text-ink-muted/45">
                {t('inTheLight')}
              </p>
              <p className="font-body-serif text-[0.76rem] leading-relaxed text-ink/68">{inTheLightLine}</p>
            </div>
          ) : null}
        </div>
        <svg width={width} height={HEIGHT} className="block">
          {paths.map((p) => (
            <path
              key={p.noteId}
              ref={(el) => {
                pathRefs.current[p.noteId] = el
              }}
              d={p.d}
              fill={hexToRgba(p.color, p.opacity)}
              stroke={hexToRgba(p.color, 0.34)}
              strokeWidth={0.65}
              style={{ filter: 'drop-shadow(0 1px 2px rgba(15,23,42,0.08))' }}
            />
          ))}
          {bucketDominants.map((b, i) => (
            <rect
              key={i}
              x={b.x - width / BUCKETS / 2}
              y={0}
              width={Math.max(8, width / BUCKETS)}
              height={HEIGHT}
              fill="transparent"
              onMouseMove={(e) => {
                const host = containerRef.current
                if (!host) return
                const rect = host.getBoundingClientRect()
                setTooltip({
                  ...b,
                  x: e.clientX - rect.left + 10,
                  y: e.clientY - rect.top + 10,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'crosshair' }}
            />
          ))}
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 max-w-[12.5rem] rounded-xl border border-pearl-border/45 bg-white/96 px-3 py-2 shadow-lg backdrop-blur-md"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p
              className="font-[family-name:var(--font-fraunces,serif)] text-[0.78rem] font-medium leading-snug"
              style={{ color: hexToRgba(tooltip.color, 0.92) }}
            >
              {tooltip.noteShort} · {tooltip.noteName}
            </p>
            <p className="mt-0.5 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-ink/60">
              {t('beadMinutes', { n: tooltip.minutes })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
