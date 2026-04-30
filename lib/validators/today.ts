import { z } from 'zod'

export const todayGetInput = z.object({
  playerId: z.string().cuid(),
  locale: z.enum(['en', 'pl']),
  weekday: z.number().int().min(0).max(6),
})

export const todaySlotOut = z.object({
  slotId: z.enum(['morning', 'relationships', 'stress', 'soul']),
  noteId: z.string(),
  noteShort: z.string(),
  noteName: z.string(),
  chromaHex: z.string(),
  urlKey: z.string(),
  frequency: z.number(),
  poeticLine: z.string(),
})

export const todayGetOutput = z.object({
  calendarHint: z.string(),
  streakNights: z.number().int().min(0),
  heroOrbHex: z.string(),
  slots: z.array(todaySlotOut),
})

export const todayWeekGetInput = z.object({
  playerId: z.string().cuid(),
  locale: z.enum(['en', 'pl']),
})

export const todayWeekDayOut = z.object({
  dateKey: z.string(),
  weekdayLabel: z.string(),
  isToday: z.boolean(),
  heroOrbHex: z.string(),
  slots: z.array(todaySlotOut),
})

export const todayWeekGetOutput = z.object({
  days: z.array(todayWeekDayOut),
})

export type TodayGetInput = z.infer<typeof todayGetInput>
export type TodayGetOutput = z.infer<typeof todayGetOutput>
export type TodayWeekGetInput = z.infer<typeof todayWeekGetInput>
export type TodayWeekGetOutput = z.infer<typeof todayWeekGetOutput>
