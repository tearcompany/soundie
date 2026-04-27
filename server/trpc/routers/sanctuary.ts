import { TRPCError, publicProcedure, router } from '../init'
import {
  sanctuaryDiagramInput,
  sanctuaryDiagramOutput,
} from '@/lib/validators/sanctuary'
import { getNoteById } from '@/lib/notes'

export const sanctuaryRouter = router({
  getDiagramData: publicProcedure
    .input(sanctuaryDiagramInput)
    .output(sanctuaryDiagramOutput)
    .query(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({ where: { id: input.playerId } })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }
      const since = new Date()
      since.setDate(since.getDate() - input.rangeDays)
      since.setHours(0, 0, 0, 0)

      const [sessions, moodRows, soundies] = await Promise.all([
        ctx.db.listenSession.findMany({
          where: { playerId: input.playerId, completedAt: { gte: since } },
          select: {
            duration: true,
            completedAt: true,
            soundie: { select: { note: { select: { emotionId: true } } } },
          },
        }),
        ctx.db.moodEntry.findMany({
          where: { playerId: input.playerId, createdAt: { gte: since } },
          orderBy: { createdAt: 'asc' },
          select: { entryDate: true, mood: true },
        }),
        ctx.db.soundie.findMany({
          where: { playerId: input.playerId },
          orderBy: { note: { sortOrder: 'asc' } },
          include: { note: { select: { id: true, name: true } } },
        }),
      ])

      const byEmotion = new Map<string, number>()
      let totalSecondsInRange = 0
      for (const s of sessions) {
        const eid = s.soundie.note.emotionId
        totalSecondsInRange += s.duration
        if (!eid) continue
        byEmotion.set(eid, (byEmotion.get(eid) ?? 0) + s.duration)
      }

      const emotions = await ctx.db.emotion.findMany()
      const releaseByEmotion = emotions
        .map((e) => ({
          emotionId: e.id,
          namePl: e.namePl,
          nameEn: e.nameEn,
          seconds: byEmotion.get(e.id) ?? 0,
        }))
        .sort((a, b) => b.seconds - a.seconds)

      const moodInRange = moodRows.map((m) => ({ entryDate: m.entryDate, mood: m.mood }))

      const soundieProgress = soundies.map((s) => {
        const def = getNoteById(s.noteId)
        return {
          noteId: s.noteId,
          noteName: s.note.name,
          chromaHex: def?.chromaHex ?? '#8b7b6a',
          level: s.level,
          totalListenTime: s.totalListenTime,
          loreUnlocked: s.loreUnlocked,
        }
      })

      let minutesToday: number | null = null
      if (input.dayStartIso && input.dayEndIso) {
        const a = new Date(input.dayStartIso)
        const b = new Date(input.dayEndIso)
        if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && b > a) {
          const todays = await ctx.db.listenSession.aggregate({
            where: { playerId: input.playerId, completedAt: { gte: a, lt: b } },
            _sum: { duration: true },
          })
          const sec = todays._sum.duration ?? 0
          minutesToday = Math.floor(sec / 60)
        }
      }

      return {
        releaseByEmotion,
        moodInRange,
        minutesToday,
        totalSecondsInRange,
        soundieProgress,
      }
    }),
})
