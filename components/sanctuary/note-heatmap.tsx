'use client'

import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import { hexToRgba } from '@/lib/hex-rgba'

interface HeatmapCell {
  noteId: string
  dateStr: string
  minutes: number
}

interface HeatmapNote {
  noteId: string
  shortName: string
  chromaHex: string
}

interface Props {
  cells: HeatmapCell[]
  notes: HeatmapNote[]
  days?: number
  locale?: 'en' | 'pl'
}

const CELL = 13
const GAP = 2
const STEP = CELL + GAP
const LABEL_W = 26
const WEEK_LABEL_H = 18

function buildDays(n: number): string[] {
  const out: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function isoWeekLabel(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function NoteHeatmap({ cells, notes, days = 84, locale = 'en' }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const allDays = useMemo(() => buildDays(days), [days])
  const weeks = Math.ceil(allDays.length / 7)

  const minutesByKey = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of cells) m.set(`${c.noteId}::${c.dateStr}`, c.minutes)
    return m
  }, [cells])

  const maxMinutes = useMemo(
    () => Math.max(1, ...cells.map((c) => c.minutes)),
    [cells]
  )

  const svgW = LABEL_W + weeks * STEP
  const svgH = WEEK_LABEL_H + notes.length * STEP

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const firstDayOfEachWeek = allDays.filter((_, i) => i % 7 === 0)

    svg
      .selectAll<SVGTextElement, string>('text.week-label')
      .data(firstDayOfEachWeek)
      .join('text')
      .attr('class', 'week-label')
      .attr('x', (_, i) => LABEL_W + i * 7 * STEP + CELL / 2)
      .attr('y', WEEK_LABEL_H - 4)
      .attr('text-anchor', 'start')
      .attr('font-family', 'monospace')
      .attr('font-size', 8)
      .attr('fill', '#9c8e82')
      .text((d) => isoWeekLabel(d, locale))

    notes.forEach((note, rowIdx) => {
      const y = WEEK_LABEL_H + rowIdx * STEP

      svg
        .append('text')
        .attr('x', LABEL_W - 4)
        .attr('y', y + CELL / 2 + 3)
        .attr('text-anchor', 'end')
        .attr('font-family', 'monospace')
        .attr('font-size', 9)
        .attr('font-weight', '600')
        .attr('fill', note.chromaHex)
        .text(note.shortName)

      allDays.forEach((dateStr, colIdx) => {
        const minutes = minutesByKey.get(`${note.noteId}::${dateStr}`) ?? 0
        const intensity = minutes === 0 ? 0 : Math.pow(minutes / maxMinutes, 0.5)
        const fill =
          minutes === 0
            ? hexToRgba('#a89b8e', 0.12)
            : hexToRgba(note.chromaHex, 0.15 + intensity * 0.85)

        const x = LABEL_W + colIdx * STEP
        const isToday = dateStr === allDays[allDays.length - 1]

        const cell = svg
          .append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', CELL)
          .attr('height', CELL)
          .attr('rx', 2)
          .attr('fill', fill)

        if (isToday) {
          cell.attr('stroke', hexToRgba(note.chromaHex, 0.6)).attr('stroke-width', 1)
        }

        if (minutes > 0) {
          svg
            .append('title')
            .text(`${note.shortName} · ${dateStr} · ${minutes} min`)
          cell.append('title').text(`${note.shortName} · ${dateStr} · ${minutes} min`)
        }
      })
    })
  }, [allDays, notes, minutesByKey, maxMinutes, locale])

  if (notes.length === 0) return null

  return (
    <div className="w-full overflow-x-auto">
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        style={{ minWidth: svgW, display: 'block' }}
      />
    </div>
  )
}
