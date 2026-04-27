'use client'

import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { NOTE_LIST } from '@/lib/notes'

export type EmotionReleaseRow = {
  emotionId: string
  namePl: string
  nameEn: string | null
  listenSeconds: number
  teardropFocusSeconds: number
  teardropClaims: number
  seconds: number
}

type PackChild = EmotionReleaseRow & { name: string; v: number }
type PackNode = { name: 'root'; v: 0; children: PackChild[] } | PackChild

function labelText(d: EmotionReleaseRow, locale: 'en' | 'pl') {
  if (locale === 'pl') return d.namePl
  return d.nameEn || d.namePl
}

function colorForEmotion(emotionId: string) {
  const note = NOTE_LIST.find((n) => n.emotionId === emotionId)
  return note?.chromaHex ?? '#8b7b6a'
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
      .attr('fill', (d) => `${colorForEmotion(d.data.emotionId)}33`)
      .attr('stroke', (d) => `${colorForEmotion(d.data.emotionId)}88`)
    cell
      .append('title')
      .text((d) => {
        const total = d.data.seconds || 0
        const m = Math.floor(total / 60)
        const sec = total % 60
        return t('tooltipEmotionWithTeardrop', {
          name: labelText(d.data, locale),
          minutes: m,
          seconds: sec,
          listenMinutes: Math.floor((d.data.listenSeconds || 0) / 60),
          teardropMinutes: Math.floor((d.data.teardropFocusSeconds || 0) / 60),
          teardropClaims: d.data.teardropClaims || 0,
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
