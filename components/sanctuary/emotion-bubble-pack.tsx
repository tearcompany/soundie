'use client'

import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

export type EmotionReleaseRow = {
  emotionId: string
  namePl: string
  nameEn: string | null
  seconds: number
}

type PackChild = EmotionReleaseRow & { name: string; v: number }
type PackNode = { name: 'root'; v: 0; children: PackChild[] } | PackChild

function hueFor(id: string, i: number) {
  return (i * 27 + (id.codePointAt(0) ?? 0) * 5) % 360
}

function labelText(d: EmotionReleaseRow, locale: 'en' | 'pl') {
  if (locale === 'pl') return d.namePl
  return d.nameEn || d.namePl
}

export function EmotionBubblePack({
  data,
  locale,
}: {
  data: EmotionReleaseRow[]
  locale: 'en' | 'pl'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const t = useTranslations('sanctuary')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const w = el.clientWidth
    if (w < 8) return
    const h = Math.max(300, Math.min(420, w * 0.72))
    const pad = 2
    const withValue: PackChild[] = data.map((d) => ({
      ...d,
      name: labelText(d, locale),
      v: Math.max(1, d.seconds),
    }))
    const dataRoot: { name: 'root'; v: 0; children: PackChild[] } = { name: 'root', v: 0, children: withValue }
    const hRoot = d3.hierarchy<PackNode>(dataRoot, (d) => ('children' in d && d.children ? d.children : null))
    hRoot.sum((d) => {
      const a = d as { data?: PackNode; v?: number; children?: { length: number } | null }
      if (a.children && a.children.length > 0) {
        return 0
      }
      if (a.data && typeof a.data.v === 'number') {
        return a.data.v
      }
      if (typeof a.v === 'number') {
        return a.v
      }
      return 0
    })
    const p = d3.pack<PackNode>().size([w - pad * 2, h - pad * 2]).padding(2.5)
    const root = hRoot
    const tree = p(root)
    const nodes = tree
      .descendants()
      .filter((d) => d.depth > 0) as d3.HierarchyCircularNode<PackChild>[]
    d3.select(el).html('')
    const svg = d3
      .select(el)
      .append('svg')
      .attr('width', w)
      .attr('height', h)
    const g0 = svg.append('g').attr('transform', `translate(${pad},${pad})`)
    const cell = g0
      .selectAll('g.cell')
      .data(nodes)
      .join('g')
      .attr('class', 'cell')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
    cell
      .append('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d, i) => `hsl(${hueFor(d.data.emotionId, i)} 34% 90%)`)
      .attr('stroke', 'rgba(26,20,16,0.11)')
    cell
      .append('title')
      .text((d) => {
        const m = Math.floor((d.data.seconds || 0) / 60)
        const sec = (d.data.seconds || 0) % 60
        return t('tooltipEmotion', {
          name: labelText(d.data, locale),
          minutes: m,
          seconds: sec,
        })
      })
    cell
      .filter((d) => d.r > 14)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'pointer-events-none')
      .attr('fill', 'var(--ink, #1a1410)')
      .attr('font-size', (d) => Math.max(7, Math.min(11, d.r / 3.2)))
      .text((d) => {
        const s = labelText(d.data, locale)
        return s.length > 11 ? `${s.slice(0, 9)}…` : s
      })
  }, [data, locale, t])

  if (data.length === 0) {
    return null
  }

  return <div ref={ref} className="w-full min-h-[300px] select-none" role="img" aria-label={t('bubbleAria')} />
}
