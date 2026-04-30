'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { hierarchy, partition, arc as d3Arc, type HierarchyRectangularNode } from 'd3'
import { cn } from '@/lib/utils'
import { hexToRgba } from '@/lib/hex-rgba'

const SIZE = 320
const RADIUS = SIZE / 2
const SEQUENCE_GAP_MS = 30 * 60 * 1000 // ≤30 min between sessions = same ritual

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
  className?: string
}

type TreeNode = {
  name: string
  noteId?: string
  noteShort?: string
  noteName?: string
  noteHex?: string
  count: number
  children: TreeNode[]
}

type ArcDatum = HierarchyRectangularNode<TreeNode>

function buildSequences(sessions: StreamSession[]): StreamSession[][] {
  const sorted = [...sessions]
    .map((s) => ({ ...s, completedAt: new Date(s.completedAt) }))
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())
  const seqs: StreamSession[][] = []
  let cur: StreamSession[] = []
  let lastT = -Infinity
  for (const s of sorted) {
    const t = s.completedAt.getTime()
    if (t - lastT > SEQUENCE_GAP_MS) {
      if (cur.length) seqs.push(cur)
      cur = []
    }
    cur.push(s)
    lastT = t
  }
  if (cur.length) seqs.push(cur)
  return seqs
}

function buildTree(seqs: StreamSession[][]): TreeNode {
  const root: TreeNode = { name: 'root', count: 0, children: [] }
  for (const seq of seqs) {
    let cur = root
    for (const sess of seq) {
      let child = cur.children.find((c) => c.noteId === sess.noteId)
      if (!child) {
        child = {
          name: sess.noteShort,
          noteId: sess.noteId,
          noteShort: sess.noteShort,
          noteName: sess.noteName,
          noteHex: sess.noteHex,
          count: 0,
          children: [],
        }
        cur.children.push(child)
      }
      cur = child
    }
    cur.count++
  }
  return root
}

function pathOf(d: ArcDatum): string[] {
  const ancestors = d.ancestors().reverse()
  const ids: string[] = []
  for (const a of ancestors) {
    if (a.depth === 0) continue
    if (a.data.noteId) ids.push(a.data.noteId)
  }
  return ids
}

export function NoteTimeline({ sessions, totalSeconds, locale, windowHours = 72, className }: Props) {
  void locale
  const t = useTranslations('noteTimeline')
  const [hovered, setHovered] = useState<string[] | null>(null)

  const inWindow = useMemo(() => {
    const since = Date.now() - windowHours * 60 * 60 * 1000
    return sessions.filter((s) => new Date(s.completedAt).getTime() >= since)
  }, [sessions, windowHours])

  const sequences = useMemo(() => buildSequences(inWindow), [inWindow])
  const totalSequences = sequences.length

  const layout = useMemo(() => {
    if (sequences.length === 0) return null
    const tree = buildTree(sequences)
    if (tree.children.length === 0) return null
    const root = hierarchy<TreeNode>(tree, (d) => d.children)
      .sum((d) => d.count)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    const part = partition<TreeNode>().size([2 * Math.PI, RADIUS])
    return part(root)
  }, [sequences])

  const arcGen = useMemo(
    () =>
      d3Arc<ArcDatum>()
        .startAngle((d) => d.x0)
        .endAngle((d) => d.x1)
        .padAngle(0.005)
        .padRadius(RADIUS / 2)
        .innerRadius((d) => d.y0)
        .outerRadius((d) => Math.max(d.y0, d.y1 - 1)),
    [],
  )

  const totalMinutes = Math.floor(totalSeconds / 60)

  if (sessions.length === 0) return null

  if (!layout || totalSequences === 0) {
    return (
      <div className={cn('w-full select-none', className)}>
        <div className="mb-2.5 flex items-baseline gap-2 px-1">
          <h3 className="font-[family-name:var(--font-fraunces,serif)] text-[1.05rem] font-medium tracking-tight text-ink/90">
            {t('title')}
          </h3>
        </div>
        <div className="rounded-xl border border-pearl-border/35 bg-pearl-dark/22 p-4 text-center">
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-ink-muted/55">
            {t('empty')}
          </p>
        </div>
      </div>
    )
  }

  // Resolve hovered path → node + breadcrumb
  let hoveredCount = 0
  let hoveredPath: { noteShort: string; noteName: string; noteHex: string }[] = []
  if (hovered && hovered.length > 0) {
    let cur: ArcDatum | undefined = layout
    for (const id of hovered) {
      const next = cur?.children?.find((c) => c.data.noteId === id)
      if (!next) {
        cur = undefined
        break
      }
      cur = next
    }
    if (cur) {
      hoveredCount = cur.value ?? 0
      const ancestors = cur.ancestors().reverse()
      hoveredPath = ancestors
        .filter((a) => a.depth > 0)
        .map((a) => ({
          noteShort: a.data.noteShort ?? '',
          noteName: a.data.noteName ?? '',
          noteHex: a.data.noteHex ?? '#888',
        }))
    }
  }

  const percent =
    hovered && hoveredCount > 0 && totalSequences > 0
      ? ((hoveredCount / totalSequences) * 100).toFixed(1)
      : null

  const hoveredKey = hovered ? hovered.join('|') : null

  return (
    <div className={cn('w-full select-none', className)}>
      <div className="mb-2.5 flex items-baseline gap-2 px-1">
        <h3 className="font-[family-name:var(--font-fraunces,serif)] text-[1.05rem] font-medium tracking-tight text-ink/90">
          {t('title')}
        </h3>
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-ink-muted/55">
          {t('summary', { minutes: totalMinutes, n: sessions.length })}
        </span>
      </div>

      {/* Breadcrumb */}
      <div className="mb-2 flex min-h-[1.5rem] flex-wrap items-center justify-center gap-1 px-1">
        {hoveredPath.length > 0 ? (
          hoveredPath.map((c, i) => (
            <span key={`${c.noteShort}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <span className="font-mono text-[0.55rem] text-ink-muted/45">→</span>
              )}
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.1em]"
                style={{
                  backgroundColor: hexToRgba(c.noteHex, 0.12),
                  color: c.noteHex,
                  border: `1px solid ${hexToRgba(c.noteHex, 0.32)}`,
                }}
              >
                {c.noteShort}
              </span>
            </span>
          ))
        ) : (
          <span className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-ink-muted/45">
            {t('hoverPath')}
          </span>
        )}
      </div>

      {/* Sunburst */}
      <div
        className="relative mx-auto rounded-xl border border-pearl-border/35 bg-pearl-dark/22 p-3"
        style={{ width: 'fit-content' }}
        onMouseLeave={() => setHovered(null)}
      >
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <g transform={`translate(${SIZE / 2}, ${SIZE / 2})`}>
            {layout
              .descendants()
              .filter((d) => d.depth > 0)
              .map((d) => {
                const path = pathOf(d)
                const pathKey = path.join('|')
                const isHighlighted =
                  !hoveredKey ||
                  pathKey === hoveredKey ||
                  hoveredKey.startsWith(`${pathKey}|`)
                return (
                  <path
                    key={pathKey}
                    d={arcGen(d) ?? ''}
                    fill={d.data.noteHex ?? '#888'}
                    fillOpacity={isHighlighted ? 0.88 : 0.18}
                    stroke="white"
                    strokeOpacity={0.55}
                    strokeWidth={0.5}
                    style={{
                      cursor: 'pointer',
                      transition: 'fill-opacity 200ms ease',
                    }}
                    onMouseEnter={() => setHovered(path)}
                  >
                    <title>
                      {`${d.data.noteShort} — ${d.data.noteName} · ${d.value ?? 0}/${totalSequences}`}
                    </title>
                  </path>
                )
              })}
          </g>

          {/* Center text */}
          <text
            x={SIZE / 2}
            y={SIZE / 2 - 2}
            textAnchor="middle"
            fontFamily="var(--font-fraunces, serif)"
            fontSize={percent ? 30 : 22}
            fontWeight={500}
            fill="rgb(15, 23, 42)"
          >
            {percent ? `${percent}%` : `${totalSequences}`}
          </text>
          <text
            x={SIZE / 2}
            y={SIZE / 2 + 16}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize={9}
            letterSpacing="0.16em"
            fill="rgba(15, 23, 42, 0.5)"
          >
            {percent ? t('ofRituals', { n: totalSequences }) : t('rituals')}
          </text>
        </svg>
      </div>
    </div>
  )
}
