import { describe, expect, it } from 'vitest'
import { maxTeardropPhaseUnlockOrderForCalendar } from '@/lib/teardrop-phase-calendar'

describe('maxTeardropPhaseUnlockOrderForCalendar', () => {
  it('allows only phase deck order 1 on anchor day', () => {
    expect(maxTeardropPhaseUnlockOrderForCalendar('2026-05-01', '2026-05-01')).toBe(1)
  })

  it('adds one phase per calendar day, capped at 5', () => {
    expect(maxTeardropPhaseUnlockOrderForCalendar('2026-05-01', '2026-05-02')).toBe(2)
    expect(maxTeardropPhaseUnlockOrderForCalendar('2026-05-01', '2026-05-05')).toBe(5)
    expect(maxTeardropPhaseUnlockOrderForCalendar('2026-05-01', '2027-01-01')).toBe(5)
  })

  it('handles same-day anchor strings after many days gracefully', () => {
    expect(maxTeardropPhaseUnlockOrderForCalendar('2020-01-01', '2020-03-01')).toBe(5)
  })
})
