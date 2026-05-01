'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { trpc } from '@/lib/trpc/react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

type DayBucket = {
  date: string
  shadow: number
  light: number
  shadowSessions?: number
  lightSessions?: number
  shadowMins?: number
  lightMins?: number
}
type Mode = 'stacked' | 'stream'

const SHADOW_COLOR = '#2d1b42'
const LIGHT_COLOR = '#c9a453'
const HEIGHT = 180

interface TooltipState {
  visible: boolean
  x: number
  y: number
  bucket: DayBucket | null
}

interface Props {
  playerId: string
  locale?: 'en' | 'pl'
  lookbackDays?: number
  className?: string
}

// Ghost data to show chart shape when no real data exists yet
function makeGhostData(n: number): DayBucket[] {
  const out: DayBucket[] = []
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(n - 1, 1)
    const shadow = Math.max(0,
      7 * Math.sin(t * Math.PI * 2.4 + 0.6) +
      2.5 * Math.sin(t * Math.PI * 7.2)
    )
    const light = Math.max(0,
      11 * Math.sin(t * Math.PI * 1.7 + 0.3) +
      4 * Math.cos(t * Math.PI * 4.1) + 9
    )
    const date = new Date(Date.now() - (n - 1 - i) * 86_400_000)
      .toISOString()
      .slice(0, 10)
    out.push({ date, shadow: +shadow.toFixed(1), light: +light.toFixed(1) })
  }
  return out
}

function renderChart(
  svg: SVGSVGElement,
  data: DayBucket[],
  mode: Mode,
  width: number,
  onHover: (b: DayBucket | null, x: number, y: number) => void,
  ghost = false,
) {
  const margin = { top: 10, right: 0, bottom: 26, left: 0 }
  const innerW = width - margin.left - margin.right
  const innerH = HEIGHT - margin.top - margin.bottom

  const el = d3.select(svg)
  el.attr('viewBox', `0 0 ${width} ${HEIGHT}`)

  let g = el.select<SVGGElement>('g.inner')
  if (g.empty()) {
    g = el.append('g').attr('class', 'inner')
  }
  g.attr('transform', `translate(${margin.left},${margin.top})`)

  const dates = data.map((d) => new Date(d.date + 'T12:00:00'))
  const x = d3
    .scaleTime()
    .domain(d3.extent(dates) as [Date, Date])
    .range([0, innerW])

  const stack = d3
    .stack<DayBucket>()
    .keys(['shadow', 'light'])
    .order(d3.stackOrderNone)
    .offset(mode === 'stream' ? d3.stackOffsetWiggle : d3.stackOffsetNone)

  const layers = stack(data)

  let yMin = Infinity
  let yMax = -Infinity
  for (const layer of layers) {
    for (const pt of layer) {
      if (pt[0] < yMin) yMin = pt[0]
      if (pt[1] > yMax) yMax = pt[1]
    }
  }
  if (yMax - yMin < 1) { yMin -= 1; yMax += 1 }

  const y = d3.scaleLinear().domain([yMin, yMax]).range([innerH, 0])

  const area = d3
    .area<d3.SeriesPoint<DayBucket>>()
    .x((_, i) => x(dates[i]))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(d3.curveMonotoneX)

  const colors: Record<string, string> = {
    shadow: SHADOW_COLOR,
    light: LIGHT_COLOR,
  }

  const targetOpacity = ghost
    ? (_key: string) => 0.11
    : (key: string) => (key === 'shadow' ? 0.68 : 0.60)

  const existing = g
    .selectAll<SVGPathElement, d3.Series<DayBucket, string>>('path.layer')
    .data(layers, (d) => d.key)

  existing
    .enter()
    .append('path')
    .attr('class', (d) => `layer layer-${d.key}`)
    .attr('fill', (d) => colors[d.key] ?? LIGHT_COLOR)
    .attr('fill-opacity', 0)
    .attr('d', area)
    .merge(existing as d3.Selection<SVGPathElement, d3.Series<DayBucket, string>, SVGGElement, unknown>)
    .transition()
    .duration(900)
    .ease(d3.easeCubicInOut)
    .attr('fill-opacity', (d) => targetOpacity(d.key))
    .attr('d', area)

  existing.exit().transition().duration(400).attr('fill-opacity', 0).remove()

  // X axis — show dates only for real data
  const tickCount = ghost ? 0 : Math.min(data.length, width < 360 ? 4 : 6)
  const xAxis = d3
    .axisBottom(x)
    .ticks(tickCount)
    .tickSize(0)
    .tickFormat((d) => d3.timeFormat('%d.%m')(d as Date))

  let axisG = g.select<SVGGElement>('g.x-axis')
  if (axisG.empty()) {
    axisG = g.append('g').attr('class', 'x-axis')
  }
  axisG.attr('transform', `translate(0,${innerH + 5})`).call(xAxis)
  axisG.select('.domain').remove()
  axisG.selectAll('line').remove()
  axisG
    .selectAll<SVGTextElement, unknown>('text')
    .attr('fill', '#9a9080')
    .attr('font-size', '8.5px')
    .attr('font-family', 'var(--font-dm-mono, monospace)')
    .attr('letter-spacing', '0.07em')
    .attr('text-anchor', 'middle')

  // Hover rects — only when real data
  let hoverG = g.select<SVGGElement>('g.hover')
  if (hoverG.empty()) {
    hoverG = g.append('g').attr('class', 'hover')
  }
  hoverG.selectAll('rect').remove()

  if (!ghost) {
    const step = innerW / Math.max(data.length - 1, 1)
    hoverG
      .selectAll<SVGRectElement, DayBucket>('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (_, i) => x(dates[i]) - step / 2)
      .attr('y', 0)
      .attr('width', step)
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mouseenter touchstart', function (event: MouseEvent | TouchEvent, d: DayBucket) {
        const rect = svg.getBoundingClientRect()
        const cx = 'touches' in event
          ? (event as TouchEvent).touches[0]?.clientX ?? 0
          : (event as MouseEvent).clientX
        const cy = 'touches' in event
          ? (event as TouchEvent).touches[0]?.clientY ?? 0
          : (event as MouseEvent).clientY
        onHover(d, cx - rect.left, cy - rect.top)
      })
      .on('mouseleave touchend', () => onHover(null, 0, 0))
  }
}

export function ShadowLightField({ playerId, locale, lookbackDays = 30, className }: Props) {
  const t = useTranslations('shadowLightField')
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('stacked')
  const [width, setWidth] = useState(0)
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, bucket: null })

  const query = trpc.resonance.getShadowLight.useQuery(
    { playerId, lookbackDays },
    { enabled: Boolean(playerId), staleTime: 120_000, retry: false },
  )

  const onHover = useCallback((b: DayBucket | null, x: number, y: number) => {
    setTooltip(b ? { visible: true, x, y, bucket: b } : { visible: false, x: 0, y: 0, bucket: null })
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w > 0) setWidth(w)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const days = query.data?.days ?? []
  const hasData = days.some((d) => d.shadow > 0 || d.light > 0)

  useEffect(() => {
    if (!svgRef.current || query.isLoading || width === 0) return
    const chartData = hasData ? days : makeGhostData(lookbackDays)
    renderChart(svgRef.current, chartData, mode, width, onHover, !hasData)
  }, [days, hasData, mode, width, onHover, query.isLoading, lookbackDays])

  return (
    <div className={cn('w-full select-none', className)}>
      {/* Header */}
      <div className="mb-1.5 flex items-start justify-between gap-3 px-0.5">
        <div>
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.22em] text-ink-muted">
            {t('kicker')}
          </p>
          <h3 className="mt-0.5 font-[family-name:var(--font-fraunces,serif)] text-lg font-semibold tracking-tight text-ink">
            {t('title')}
          </h3>
        </div>
        {/* Mode toggle */}
        <div className="mt-1 flex shrink-0 items-center gap-0 overflow-hidden rounded-full border border-pearl-border/70 bg-pearl-dark/30 text-[0.6rem]">
          {(['stacked', 'stream'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1.5 font-mono tracking-wide transition-colors',
                mode === m ? 'bg-ink/10 text-ink' : 'text-ink/45 hover:text-ink/75',
              )}
            >
              {t(`mode${m.charAt(0).toUpperCase() + m.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="mb-3 px-0.5 font-body-serif text-[0.72rem] italic leading-relaxed text-ink/55">
        {t('subtitle')}
      </p>

      {/* Legend */}
      <div className="mb-2 flex items-center gap-5 px-0.5">
        <span className="flex items-center gap-1.5 font-mono text-[0.58rem] tracking-wide text-ink/55">
          <span className="inline-block h-2 w-5 rounded-full" style={{ backgroundColor: SHADOW_COLOR, opacity: 0.72 }} />
          <span>{t('legendShadow')} <span className="text-ink/35">— {t('legendShadowDesc')}</span></span>
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[0.58rem] tracking-wide text-ink/55">
          <span className="inline-block h-2 w-5 rounded-full" style={{ backgroundColor: LIGHT_COLOR, opacity: 0.72 }} />
          <span>{t('legendLight')} <span className="text-ink/35">— {t('legendLightDesc')}</span></span>
        </span>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="relative w-full">
        {query.isLoading ? (
          <div
            className="flex items-center justify-center rounded-xl border border-pearl-border/35 bg-pearl-dark/18"
            style={{ height: HEIGHT }}
          >
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-muted/60">
              {t('loading')}
            </span>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-pearl-border/35">
            <svg
              ref={svgRef}
              className="w-full overflow-visible"
              style={{ height: HEIGHT }}
              aria-hidden
            />

            {/* Ghost overlay when no real data */}
            {!hasData && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-pearl/55 backdrop-blur-[1px]">
                <p className="font-body-serif text-sm italic text-ink/50">
                  {t('noData')}
                </p>
                <p className="mt-1 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-ink-muted/45">
                  {t('noDataSub')}
                </p>
              </div>
            )}

            {/* Tooltip */}
            {hasData && tooltip.visible && tooltip.bucket && (
              <div
                className="pointer-events-none absolute z-10 rounded-lg border border-pearl-border/50 bg-pearl/92 px-3 py-2 shadow-md backdrop-blur-sm"
                style={{
                  left: Math.min(tooltip.x + 10, width - 140),
                  top: Math.max(tooltip.y - 64, 4),
                  minWidth: 128,
                }}
              >
                <p className="mb-1.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-ink-muted">
                  {new Date(tooltip.bucket.date + 'T12:00:00').toLocaleDateString(
                    locale === 'pl' ? 'pl-PL' : 'en-US',
                    { day: 'numeric', month: 'short' },
                  )}
                </p>
                <div className="space-y-1">
                  {/* Shadow row */}
                  <div>
                    <p className="font-mono text-[0.6rem] font-medium" style={{ color: SHADOW_COLOR }}>
                      {t('legendShadow')}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.62rem] tabular-nums text-ink/60">
                      {tooltip.bucket.shadowSessions ?? 0}&nbsp;{t('unitSessions')}
                      &nbsp;·&nbsp;
                      {(tooltip.bucket.shadowMins ?? 0).toFixed(0)}&nbsp;{t('unitMin')}
                    </p>
                  </div>
                  {/* Light row */}
                  <div>
                    <p className="font-mono text-[0.6rem] font-medium" style={{ color: LIGHT_COLOR }}>
                      {t('legendLight')}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.62rem] tabular-nums text-ink/60">
                      {tooltip.bucket.lightSessions ?? 0}&nbsp;{t('unitSessions')}
                      &nbsp;·&nbsp;
                      {(tooltip.bucket.lightMins ?? 0).toFixed(0)}&nbsp;{t('unitMin')}
                    </p>
                  </div>
                  {/* Total */}
                  <div className="border-t border-pearl-border/40 pt-1">
                    <p className="font-mono text-[0.6rem] text-ink/50">
                      {t('tooltipTotal')}&nbsp;
                      <span className="font-medium text-ink/80 tabular-nums">
                        {((tooltip.bucket.shadowSessions ?? 0) + (tooltip.bucket.lightSessions ?? 0))}&nbsp;{t('unitSessions')}
                        &nbsp;·&nbsp;
                        {((tooltip.bucket.shadowMins ?? 0) + (tooltip.bucket.lightMins ?? 0)).toFixed(0)}&nbsp;{t('unitMin')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 px-0.5 font-body-serif text-[0.7rem] italic text-ink/35">
        {t('footnote', { days: lookbackDays })}
      </p>
    </div>
  )
}
