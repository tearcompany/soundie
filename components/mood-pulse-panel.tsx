'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useTranslations } from 'next-intl'
import { trpc } from '@/lib/trpc/react'
import { cn } from '@/lib/utils'
import type { MoodPulseOutput } from '@/lib/validators/resonance'

const LIGHT = '#c9a453'
const SHADOW = '#2d1b42'
const CHART_H = 118
const MARGIN = { top: 10, right: 6, bottom: 8, left: 6 }

function renderDualLines(svg: SVGSVGElement, data: MoodPulseOutput, width: number, ghost: boolean) {
  const innerW = width - MARGIN.left - MARGIN.right
  const innerH = CHART_H - MARGIN.top - MARGIN.bottom
  const el = d3.select(svg)
  el.attr('viewBox', `0 0 ${width} ${CHART_H}`).selectAll('*').remove()

  const g = el.append('g').attr('class', 'inner').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  const n = Math.max(data.buckets.length, 1)
  const x = d3.scaleLinear().domain([0, Math.max(n - 1, 1)]).range([0, innerW])

  const maxY = Math.max(
    0.08,
    d3.max(data.buckets, (d) => Math.max(d.light, d.shadow)) ?? 0.08,
  )
  const y = d3.scaleLinear().domain([0, maxY]).range([innerH, 0])

  const pts = data.buckets.map((b, i) => ({ i, light: b.light, shadow: b.shadow }))
  const areaLight = d3
    .area<(typeof pts)[number]>()
    .x((d) => x(d.i))
    .y0(() => y(0))
    .y1((d) => y(d.light))
    .curve(d3.curveMonotoneX)
  const areaShadow = d3
    .area<(typeof pts)[number]>()
    .x((d) => x(d.i))
    .y0(() => y(0))
    .y1((d) => y(d.shadow))
    .curve(d3.curveMonotoneX)
  const lineLight = d3
    .line<(typeof pts)[number]>()
    .x((d) => x(d.i))
    .y((d) => y(d.light))
    .curve(d3.curveMonotoneX)
  const lineShadow = d3
    .line<(typeof pts)[number]>()
    .x((d) => x(d.i))
    .y((d) => y(d.shadow))
    .curve(d3.curveMonotoneX)

  const opLight = ghost ? 0.11 : 0.2
  const opShadow = ghost ? 0.09 : 0.18
  const strokeW = ghost ? 1 : 1.65
  const strokeLo = ghost ? 'rgba(201,164,83,0.35)' : LIGHT
  const strokeSh = ghost ? 'rgba(45,27,66,0.38)' : SHADOW

  g.append('path').datum(pts).attr('d', areaShadow).attr('fill', SHADOW).attr('fill-opacity', opShadow)
  g.append('path').datum(pts).attr('d', areaLight).attr('fill', LIGHT).attr('fill-opacity', opLight)
  g.append('path')
    .datum(pts)
    .attr('d', lineShadow)
    .attr('fill', 'none')
    .attr('stroke', strokeSh)
    .attr('stroke-width', strokeW)
  g.append('path')
    .datum(pts)
    .attr('d', lineLight)
    .attr('fill', 'none')
    .attr('stroke', strokeLo)
    .attr('stroke-width', strokeW)
}

interface MoodPulsePanelProps {
  playerId: string
  noteId: string
  locale: 'en' | 'pl'
  windowMinutes?: number
  className?: string
}

export function MoodPulsePanel({
  playerId,
  noteId,
  locale,
  windowMinutes = 20,
  className,
}: MoodPulsePanelProps) {
  const t = useTranslations('noteCreature.pulse')
  const tMood = useTranslations('moodIntelligence.moods')
  const svgRef = useRef<SVGSVGElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  const query = trpc.resonance.getMoodPulse.useQuery(
    { playerId, noteId, locale, windowMinutes },
    {
      enabled: Boolean(playerId && noteId),
      staleTime: 45_000,
      refetchInterval: 60_000,
      retry: false,
    },
  )

  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w > 0) setWidth(Math.floor(w))
    })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  const paint = useCallback(() => {
    const svg = svgRef.current
    const d = query.data
    if (!svg || !d || width < 40) return
    renderDualLines(svg, d, width, !d.hasSignal)
  }, [query.data, width])

  useEffect(() => {
    paint()
  }, [paint])

  const data = query.data

  return (
    <div className={cn('w-full select-none', className)}>
      <p className="font-mono text-[0.52rem] uppercase tracking-[0.22em] text-ink-muted/75">
        {t('kicker', { minutes: windowMinutes })}
      </p>
      <p className="mt-1 font-body-serif text-[0.8rem] leading-snug text-ink/80">{t('intro')}</p>

      <div ref={wrapRef} className="mt-4 w-full">
        <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[0.48rem] uppercase tracking-[0.16em]" style={{ color: LIGHT }}>
              {t('seriesLight')}
            </p>
            {data?.teardropLightLine ? (
              <p className="mt-0.5 font-body-serif text-[0.68rem] italic leading-snug text-ink/55 line-clamp-2">
                {data.teardropLightLine}
              </p>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="font-mono text-[0.48rem] uppercase tracking-[0.16em]" style={{ color: SHADOW }}>
              {t('seriesShadow')}
            </p>
            {data?.teardropShadowLine ? (
              <p className="mt-0.5 font-body-serif text-[0.68rem] italic leading-snug text-ink/55 line-clamp-2">
                {data.teardropShadowLine}
              </p>
            ) : null}
          </div>
        </div>

        <svg ref={svgRef} className="w-full text-ink" role="img" aria-label={t('chartAria')} />

        {width > 0 && data && (
          <div className="mt-1 flex justify-between px-1 font-mono text-[8.5px] tracking-wide text-ink-muted/80">
            <span>{t('axisStart', { n: windowMinutes })}</span>
            <span>{t('axisNow')}</span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-3 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-muted/70">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm" style={{ backgroundColor: LIGHT }} />
            {t('legendLight')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm" style={{ backgroundColor: SHADOW }} />
            {t('legendShadow')}
          </span>
        </div>
      </div>

      {query.isLoading && (
        <p className="mt-4 font-mono text-[0.65rem] text-ink-muted">{t('loading')}</p>
      )}

      {query.isError && (
        <p className="mt-4 font-body-serif text-sm text-ink/70">{t('error')}</p>
      )}

      {data && !data.hasSignal && !query.isLoading && (
        <p className="mt-4 font-body-serif text-[0.78rem] italic leading-relaxed text-ink/60">{t('empty')}</p>
      )}

      {data && (
        <div className="mt-5 rounded-2xl border border-pearl-border/45 bg-pearl-dark/18 px-4 py-3.5">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.2em] text-ink-muted/75">
            {t('forecastTitle')}
          </p>
          <p className="mt-2 font-body-serif text-[0.82rem] leading-relaxed text-ink/88">
            {t(`forecast.${data.forecastKind}`)}
          </p>
          <p className="mt-3 font-mono text-[0.48rem] uppercase tracking-[0.16em] text-ink-muted/65">
            {t('likelyMood')}
          </p>
          <p className="mt-1 font-body-serif text-sm font-medium text-ink/90">
            {tMood(data.forecastMoodId)}
          </p>
        </div>
      )}
    </div>
  )
}
