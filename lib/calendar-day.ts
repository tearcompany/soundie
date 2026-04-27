import { format, parse, subDays } from 'date-fns'

const ANCHOR = new Date(2000, 0, 1)

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
