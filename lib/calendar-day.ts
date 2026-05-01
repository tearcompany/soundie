import { differenceInCalendarDays, format, parse, subDays } from 'date-fns'

const ANCHOR = new Date(2000, 0, 1)

/** Dzień według UTC (fallback serwera, gdy klient nie poda swojego `YYYY-MM-DD`). */
export function utcCalendarDayString(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** Liczba pełnych dni kalendarzowych `[earlier]` → `[later]` (`later >= earlier`). */
export function differenceCalendarDaysYyyyMmDd(laterYyyyMmDd: string, earlierYyyyMmDd: string): number {
  const later = parse(laterYyyyMmDd, 'yyyy-MM-dd', ANCHOR)
  const earlier = parse(earlierYyyyMmDd, 'yyyy-MM-dd', ANCHOR)
  return Math.max(0, differenceInCalendarDays(later, earlier))
}

export function localCalendarStringFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function previousCalendarDay(yyyyMmDd: string): string {
  const d = parse(yyyyMmDd, 'yyyy-MM-dd', ANCHOR)
  return format(subDays(d, 1), 'yyyy-MM-dd')
}

export function isValidYyyyMmDd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = parse(s, 'yyyy-MM-dd', ANCHOR)
  return format(d, 'yyyy-MM-dd') === s
}
