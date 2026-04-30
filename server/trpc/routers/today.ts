import { TRPCError, publicProcedure, router } from '../init'
import { getNoteById } from '@/lib/notes'
import { computeTodaySlots, heroOrbHexFromSlots, type TodayEngineInput } from '@/lib/today-engine'
import {
  todayGetInput,
  todayGetOutput,
  todayWeekGetInput,
  todayWeekGetOutput,
} from '@/lib/validators/today'
import type { PrismaClient } from '@prisma/client'

function poeticLineForNote(
  noteId: string,
  locale: 'en' | 'pl',
): string {
  const n = getNoteById(noteId)
  if (!n) return ''
  if (locale === 'pl') {
    const line = n.synestheticLinePl.trim()
    return line.length > 200 ? `${line.slice(0, 197)}…` : line
  }
  const h = n.healing.trim()
  return h.length > 220 ? `${h.slice(0, 217)}…` : h
}

type TodayPlayerBase = {
  streakNights: number
  lastNoteId: string | null
  recentMoodKeys: string[]
}

async function loadTodayPlayerBase(db: PrismaClient, playerId: string): Promise<TodayPlayerBase> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { streakNights: true },
  })
  if (!player) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
  }

  const lastSession = await db.listenSession.findFirst({
    where: { playerId },
    orderBy: { completedAt: 'desc' },
    select: { soundie: { select: { noteId: true } } },
  })

  const moodRows = await db.moodEntry.findMany({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { mood: true },
  })

  return {
    streakNights: player.streakNights,
    lastNoteId: lastSession?.soundie.noteId ?? null,
    recentMoodKeys: moodRows.map((r) => r.mood),
  }
}

function buildSlotsPayload(engineIn: TodayEngineInput, locale: 'en' | 'pl') {
  const slotPlan = computeTodaySlots(engineIn)
  const heroOrbHex = heroOrbHexFromSlots(slotPlan)
  const slots = slotPlan.map((s) => {
    const n = getNoteById(s.noteId)
    if (!n) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Invalid note in today engine' })
    }
    return {
      slotId: s.slotId as 'morning' | 'relationships' | 'stress' | 'soul',
      noteId: n.id,
      noteShort: n.short,
      noteName: n.name,
      chromaHex: n.chromaHex,
      urlKey: n.urlKey,
      frequency: n.frequency,
      poeticLine: poeticLineForNote(n.id, locale),
    }
  })
  return { heroOrbHex, slots }
}

function startOfWeekMondayLocal(ref: Date): Date {
  const x = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12, 0, 0, 0)
  const day = x.getDay()
  const off = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + off)
  return x
}

function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export const todayRouter = router({
  get: publicProcedure
    .input(todayGetInput)
    .output(todayGetOutput)
    .query(async ({ ctx, input }) => {
      const base = await loadTodayPlayerBase(ctx.db, input.playerId)
      const engineIn: TodayEngineInput = {
        weekday: input.weekday,
        streakNights: base.streakNights,
        lastNoteId: base.lastNoteId,
        recentMoodKeys: base.recentMoodKeys,
      }
      const { heroOrbHex, slots } = buildSlotsPayload(engineIn, input.locale)

      const now = new Date()
      const calendarHint = localDateKey(now)

      return {
        calendarHint,
        streakNights: base.streakNights,
        heroOrbHex,
        slots,
      }
    }),

  getWeek: publicProcedure
    .input(todayWeekGetInput)
    .output(todayWeekGetOutput)
    .query(async ({ ctx, input }) => {
      const base = await loadTodayPlayerBase(ctx.db, input.playerId)
      const now = new Date()
      const start = startOfWeekMondayLocal(now)
      const loc = input.locale === 'pl' ? 'pl-PL' : 'en-US'
      const fmt = new Intl.DateTimeFormat(loc, { weekday: 'short' })

      const days = []
      for (let i = 0; i < 7; i++) {
        const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12, 0, 0, 0)
        const weekday = dt.getDay()
        const engineIn: TodayEngineInput = {
          weekday,
          streakNights: base.streakNights,
          lastNoteId: base.lastNoteId,
          recentMoodKeys: base.recentMoodKeys,
        }
        const { heroOrbHex, slots } = buildSlotsPayload(engineIn, input.locale)
        days.push({
          dateKey: localDateKey(dt),
          weekdayLabel: fmt.format(dt),
          isToday: isSameLocalDay(dt, now),
          heroOrbHex,
          slots,
        })
      }

      return { days }
    }),
})
