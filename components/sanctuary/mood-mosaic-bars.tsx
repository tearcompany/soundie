'use client'

import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { MOOD_ID_LIST } from '@/lib/mood-reaction-texts'

type Point = { entryDate: string; mood: string }

const MOOD_HUE: Record<string, number> = {
  anxious: 12,
  numb: 220,
  heavy: 28,
  scattered: 160,
  hopeful: 45,
}

export function MoodMosaicBars({ data }: { data: Point[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const t = useTranslations('sanctuary')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const w = el.clientWidth
    if (w < 8) return
    const counts = new Map<string, number>()
    for (const m of MOOD_ID_LIST) counts.set(m, 0)
    for (const row of data) {
      if (counts.has(row.mood)) {
        counts.set(row.mood, (counts.get(row.mood) ?? 0) + 1)
      }
    }
    const rows = MOOD_ID_LIST.map((m) => ({ id: m, c: counts.get(m) ?? 0 }))
    const maxC = d3.max(rows, (d) => d.c) ?? 1
    const h = 140
    const margin = { top: 6, right: 8, bottom: 8, left: 0 }
    const labelCol = 108
    const innerW = w - margin.left - margin.right - labelCol
    const y = d3
      .scaleBand()
      .domain(MOOD_ID_LIST)
      .range([0, h - margin.top - margin.bottom])
      .padding(0.32)
    const x = d3.scaleLinear().domain([0, maxC]).range([0, Math.max(16, innerW)])
    d3.select(el).html('')
    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', w)
      .attr('height', h)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    g.selectAll('text.label')
      .data(rows)
      .join('text')
      .attr('x', 0)
      .attr('y', (d) => (y(d.id) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('class', 'font-mono text-[0.62rem] text-ink/80')
      .text((d) => t(`moodLabels.${d.id}` as 'moodLabels.anxious'))
    g.selectAll('rect')
      .data(rows)
      .join('rect')
      .attr('x', labelCol)
      .attr('y', (d) => y(d.id) ?? 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.c))
      .attr('fill', (d) => `hsl(${MOOD_HUE[d.id] ?? 200} 32% 88%)`)
      .attr('rx', 4)
      .attr('stroke', 'rgba(26,20,16,0.1)')
  }, [data, t])

  if (data.length === 0) {
    return null
  }

  return <div ref={ref} className="w-full min-h-[140px] select-none" role="img" aria-label={t('moodAria')} />
}
