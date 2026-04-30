'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { arc as d3Arc, hierarchy, partition } from 'd3'
import { cn } from '@/lib/utils'
import { hexToRgba } from '@/lib/hex-rgba'

const HEIGHT = 228
const BASE_RADIUS = 18
const RITUAL_GAP_MS = 40 * 60 * 1000

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
  // neurofeedback
  isPlaying?: boolean
  frequencyHz?: number
  pulseDepth?: number
  sacredClimax?: boolean
  activeNoteHex?: string
  activeNoteShort?: string
  /** Human-readable emotion: check-in mood at the door, or the note’s emotional tone */
  emotionLabel?: string
  /** Synesthetic / “in the light” line for this note (PL in DB; shown with translated kicker) */
  inTheLightLine?: string
  /** When true, emotionLabel came from mood check-in */
  moodFromCheckIn?: boolean
  className?: string
}

type NoteMeta = {
  noteShort: string
  noteHex: string
}

type TreeNode = {
  name: string
  children?: TreeNode[]
  value?: number
}

type TooltipState = {
  x: number
  y: number
  path: string
  color: string
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function collectRitualSequences(
  sessions: StreamSession[],
  domainStart: number,
): Map<string, number> {
  const filtered = sessions
    .filter((s) => new Date(s.completedAt).getTime() >= domainStart)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())

  const journeys: string[][] = []
  let currentJourney: string[] = []
  let prevTs = 0

  for (const s of filtered) {
    const ts = new Date(s.completedAt).getTime()
    const shouldSplit = currentJourney.length > 0 && ts - prevTs > RITUAL_GAP_MS
    if (shouldSplit) {
      journeys.push(currentJourney)
      currentJourney = []
    }
    const last = currentJourney[currentJourney.length - 1]
    if (last !== s.noteShort) currentJourney.push(s.noteShort)
    prevTs = ts
  }
  if (currentJourney.length > 0) journeys.push(currentJourney)

  const counts = new Map<string, number>()
  for (const seq of journeys) {
    if (seq.length === 0) continue
    const key = seq.join('>')
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function buildTree(counts: Map<string, number>): TreeNode {
  const root: TreeNode = { name: 'root', children: [] }
  for (const [sequence, count] of counts) {
    const parts = sequence.split('>').filter(Boolean)
    let node = root
    for (const part of parts) {
      node.children ??= []
      let child = node.children.find((c) => c.name === part)
      if (!child) {
        child = { name: part, children: [] }
        node.children.push(child)
      }
      node = child
    }
    node.value = (node.value ?? 0) + count
  }
  return root
}

export function NoteTimeline({
  sessions,
  totalSeconds,
  locale: _locale,
  windowHours = 24,
  sessionElapsedSeconds = 0,
  sessionActive = false,
  isPlaying = false,
  frequencyHz = 432,
  pulseDepth = 0,
  sacredClimax = false,
  activeNoteHex,
  activeNoteShort,
  emotionLabel = '',
  inTheLightLine = '',
  moodFromCheckIn = false,
  className,
}: Props) {
  const t = useTranslations('noteTimeline')
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(320)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Direct DOM refs for 60fps animation (no setState in RAF)
  const ring1Ref = useRef<SVGCircleElement>(null)
  const ring2Ref = useRef<SVGCircleElement>(null)
  const centerNumRef = useRef<SVGTextElement>(null)
  const centerLblRef = useRef<SVGTextElement>(null)

  // Mutable box to avoid stale closures in the animation loop
  const liveRef = useRef({
    isPlaying: false,
    frequencyHz: 432,
    pulseDepth: 0,
    sacredClimax: false,
    activeNoteHex: activeNoteHex ?? '#888',
    radius: 64,
    totalMinutes: 0,
    activeNoteShort: '',
    centerLabelStr: '',
  })

  useEffect(() => {
    liveRef.current.isPlaying = isPlaying
    liveRef.current.frequencyHz = frequencyHz
    liveRef.current.pulseDepth = pulseDepth
    liveRef.current.sacredClimax = sacredClimax
    liveRef.current.activeNoteHex = activeNoteHex ?? '#888'
    liveRef.current.activeNoteShort = activeNoteShort ?? ''
  }, [isPlaying, frequencyHz, pulseDepth, sacredClimax, activeNoteHex, activeNoteShort])

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

  // Single RAF: data tick (1s) + 60fps visual animation
  useEffect(() => {
    let raf = 0
    let lastDataTick = 0

    const loop = (ts: number) => {
      // 1 s data tick — update nowMs to recompute D3 tree
      if (ts - lastDataTick >= 1000) {
        setNowMs(Date.now())
        lastDataTick = ts
      }

      const s = liveRef.current
      const r = s.radius
      const hzNorm = clamp((s.frequencyHz - 100) / 500, 0, 1)

      // Two independent sine phases for a less mechanical feel
      const breathSpeed = 0.00045 + hzNorm * 0.0008
      const breathe = Math.sin(ts * breathSpeed * Math.PI * 2)
      const breathe2 = Math.sin(ts * breathSpeed * Math.PI * 2 + Math.PI * 0.6)

      const intensity = s.isPlaying
        ? 1 + clamp(s.pulseDepth * 0.18, 0, 0.9) + (s.sacredClimax ? 0.45 : 0)
        : 0.22

      const baseAlpha1 = s.isPlaying ? 0.24 : 0.07
      const baseAlpha2 = s.isPlaying ? 0.11 : 0.03

      const r1 = r + 5 + breathe * 5 * intensity
      const r2 = r + 15 + breathe2 * 10 * intensity

      const ring1 = ring1Ref.current
      if (ring1) {
        ring1.setAttribute('r', String(r1))
        ring1.setAttribute('opacity', String(baseAlpha1 + breathe * 0.07))
      }

      const ring2 = ring2Ref.current
      if (ring2) {
        ring2.setAttribute('r', String(r2))
        ring2.setAttribute('opacity', String(baseAlpha2 + breathe2 * 0.04))
      }

      // Center text: show Hz + note short when playing, total minutes when at rest
      const centerNum = centerNumRef.current
      const centerLbl = centerLblRef.current
      if (centerNum && centerLbl) {
        if (s.isPlaying && s.activeNoteShort) {
          const pulseAlpha = 0.72 + breathe * 0.28
          centerNum.textContent = String(Math.round(s.frequencyHz))
          centerNum.setAttribute('opacity', String(pulseAlpha))
          centerLbl.textContent = `Hz · ${s.activeNoteShort}`
          centerLbl.setAttribute('opacity', String(0.45 + breathe * 0.15))
        } else {
          centerNum.textContent = String(s.totalMinutes)
          centerNum.setAttribute('opacity', '0.65')
          centerLbl.textContent = s.centerLabelStr
          centerLbl.setAttribute('opacity', '0.38')
        }
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, []) // intentionally empty — reads live state via liveRef

  const totalMinutes = Math.floor(totalSeconds / 60)

  // Keep liveRef in sync with derived values that change slowly
  const centerLabelStr = t('centerLabel')
  useEffect(() => {
    liveRef.current.totalMinutes = totalMinutes
    liveRef.current.centerLabelStr = centerLabelStr
  }, [totalMinutes, centerLabelStr])

  const { arcs, radius } = useMemo(() => {
    const baseWindowMs = windowHours * 60 * 60 * 1000
    const elapsedMs = Math.max(0, sessionElapsedSeconds) * 1000
    const zoomProgress = sessionActive ? clamp(elapsedMs / (45 * 60 * 1000), 0, 1) : 0
    const minWindowMs = 3 * 60 * 60 * 1000
    const dynamicWindowMs = baseWindowMs - (baseWindowMs - minWindowMs) * zoomProgress
    const windowMs = Math.max(minWindowMs, dynamicWindowMs)
    const domainStart = nowMs - windowMs

    const counts = collectRitualSequences(sessions, domainStart)

    const noteByShort = new Map<string, NoteMeta>()
    for (const s of sessions) {
      if (!noteByShort.has(s.noteShort)) {
        noteByShort.set(s.noteShort, { noteShort: s.noteShort, noteHex: s.noteHex })
      }
    }

    const tree = buildTree(counts)
    const root = hierarchy<TreeNode>(tree)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    const r = Math.max(64, Math.min(width, HEIGHT) / 2 - 10)
    const partitionRoot = partition<TreeNode>().size([2 * Math.PI, r])(root)

    const arcGen = d3Arc<typeof partitionRoot>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0 + BASE_RADIUS)
      .outerRadius((d) => Math.max(d.y0 + BASE_RADIUS + 1, d.y1 + BASE_RADIUS - 1))

    const arcs = partitionRoot
      .descendants()
      .filter((d) => d.depth > 0 && d.x1 > d.x0)
      .map((d) => {
        const path = arcGen(d) ?? ''
        const name = d.data.name
        const color = noteByShort.get(name)?.noteHex ?? 'rgba(148,163,184,0.62)'
        const isActive = name === activeNoteShort
        return { node: d, path, color, isActive }
      })

    return { arcs, radius: r + BASE_RADIUS }
  }, [sessions, width, windowHours, sessionElapsedSeconds, sessionActive, nowMs, activeNoteShort])

  // Keep radius in liveRef in sync
  useEffect(() => {
    liveRef.current.radius = radius
  }, [radius])

  if (sessions.length === 0) return null

  const ringColor = activeNoteHex ?? '#94a3b8'

  return (
    <div ref={containerRef} className={cn('w-full select-none', className)}>
      <div className="mb-2.5 flex items-baseline gap-2 px-1">
        <h3 className="font-[family-name:var(--font-fraunces,serif)] text-[1.05rem] font-medium tracking-tight text-ink/90">
          {t('title')}
        </h3>
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-ink-muted/55">
          {t('summary', { minutes: totalMinutes })}
        </span>
      </div>
      <div className="relative overflow-visible rounded-xl border border-pearl-border/35 bg-pearl-dark/22 backdrop-blur-[2px]">
        <div className="border-b border-pearl-border/25 px-4 pb-3 pt-3">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <div className="min-w-0 flex-1">
              {moodFromCheckIn && (
                <p className="mb-0.5 font-mono text-[0.48rem] uppercase tracking-[0.16em] text-ink-muted/45">
                  {t('moodAtDoor')}
                </p>
              )}
              <p
                className={cn(
                  'font-[family-name:var(--font-fraunces,serif)] text-[0.92rem] font-medium leading-snug',
                  emotionLabel ? 'text-ink/88' : 'text-ink-muted/45 italic',
                )}
              >
                {emotionLabel || t('emotionOpen')}
              </p>
            </div>
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
          <g transform={`translate(${width / 2}, ${HEIGHT / 2})`}>

            {/* neurofeedback rings — animated directly via refs, no React re-render */}
            <circle
              ref={ring1Ref}
              r={radius + 5}
              fill="none"
              stroke={ringColor}
              strokeWidth={isPlaying ? 1.5 : 0.8}
              opacity={0.07}
              style={{ transition: 'stroke 600ms ease, stroke-width 600ms ease' }}
            />
            <circle
              ref={ring2Ref}
              r={radius + 15}
              fill="none"
              stroke={ringColor}
              strokeWidth={0.6}
              opacity={0.03}
              style={{ transition: 'stroke 600ms ease' }}
            />

            {arcs.map((a, i) => {
              const pathTokens = a.node
                .ancestors()
                .reverse()
                .map((n) => n.data.name)
                .filter((name) => name !== 'root')
              const ritualPath = pathTokens.join(' → ')
              return (
                <path
                  key={`${a.node.data.name}-${i}`}
                  d={a.path}
                  fill={hexToRgba(a.color, a.isActive ? 0.92 : 0.72)}
                  stroke={hexToRgba(a.color, a.isActive ? 0.5 : 0.3)}
                  strokeWidth={a.isActive ? 1.2 : 0.8}
                  style={{
                    transition: 'fill 500ms ease, opacity 500ms ease',
                    cursor: 'pointer',
                    filter: a.isActive
                      ? `drop-shadow(0 0 6px ${hexToRgba(a.color, 0.55)})`
                      : 'drop-shadow(0 2px 8px rgba(15,23,42,0.08))',
                  }}
                  onMouseMove={(e) => {
                    const host = containerRef.current
                    if (!host) return
                    const rect = host.getBoundingClientRect()
                    setTooltip({
                      x: e.clientX - rect.left + 10,
                      y: e.clientY - rect.top + 10,
                      path: ritualPath,
                      color: a.color,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}

            {/* center — content managed via RAF refs for smooth breathing */}
            <circle r={BASE_RADIUS - 1} fill="rgba(255,255,255,0.72)" />
            <text
              ref={centerNumRef}
              textAnchor="middle"
              y={-4}
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-fraunces, serif)',
                fontWeight: 500,
                fill: activeNoteHex ?? 'rgba(15,23,42,0.65)',
                letterSpacing: '0.01em',
                transition: 'fill 600ms ease',
              }}
            >
              {isPlaying ? String(Math.round(frequencyHz)) : String(totalMinutes)}
            </text>
            <text
              ref={centerLblRef}
              textAnchor="middle"
              y={6}
              style={{
                fontSize: '5px',
                fontFamily: 'monospace',
                fontWeight: 400,
                fill: 'rgba(15,23,42,0.38)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {isPlaying && activeNoteShort ? `Hz · ${activeNoteShort}` : centerLabelStr}
            </text>
          </g>
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 max-w-[15rem] rounded-xl border border-pearl-border/45 bg-white/96 px-3.5 py-2.5 shadow-lg backdrop-blur-md"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p
              className="font-[family-name:var(--font-fraunces,serif)] text-[0.72rem] font-medium italic leading-snug"
              style={{ color: hexToRgba(tooltip.color, 0.92) }}
            >
              {tooltip.path}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
