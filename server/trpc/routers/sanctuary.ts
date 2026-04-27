import { TRPCError, publicProcedure, router } from '../init'
import {
  sanctuaryDiagramInput,
  sanctuaryDiagramOutput,
} from '@/lib/validators/sanctuary'
import { getNoteById } from '@/lib/notes'

function pickLocaleForTexts(
  texts: Array<{ locale: string; field: string; content: string }>,
  locale: string,
) {
  const exact = texts.filter((t) => t.locale === locale)
  if (exact.length > 0) return exact
  const en = texts.filter((t) => t.locale === 'en')
  if (en.length > 0) return en
  return texts
}

export const sanctuaryRouter = router({
  getDiagramData: publicProcedure
    .input(sanctuaryDiagramInput)
    .output(sanctuaryDiagramOutput)
    .query(async ({ ctx, input }) => {
      const locale = input.locale ?? 'en'
      const player = await ctx.db.player.findUnique({ where: { id: input.playerId } })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }
      const since = new Date()
      since.setDate(since.getDate() - input.rangeDays)
      since.setHours(0, 0, 0, 0)

      const dbWithOptionalTeardropFocus = ctx.db as unknown as {
        teardropFocusSession?: {
          findMany: (args: {
            where: { playerId: string; createdAt: { gte: Date } }
            select: { durationMs: true; card: { select: { emotionId: true } } }
          }) => Promise<Array<{ durationMs: number; card: { emotionId: string | null } }>>
        }
      }
      const teardropFocusDelegate = dbWithOptionalTeardropFocus.teardropFocusSession
      const [sessions, moodRows, soundies, latestClaim, teardropFocusRows, teardropClaimRows] = await Promise.all([
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
        ctx.db.dailyClaim.findFirst({
          where: { playerId: input.playerId },
          orderBy: { createdAt: 'desc' },
          include: { teardropCard: { include: { texts: true } } },
        }),
        teardropFocusDelegate
          ? teardropFocusDelegate.findMany({
              where: { playerId: input.playerId, createdAt: { gte: since } },
              select: { durationMs: true, card: { select: { emotionId: true } } },
            })
          : Promise.resolve([]),
        ctx.db.dailyClaim.findMany({
          where: { playerId: input.playerId, createdAt: { gte: since } },
          select: { teardropCard: { select: { emotionId: true } } },
        }),
      ])

      const listenByEmotion = new Map<string, number>()
      const teardropFocusByEmotion = new Map<string, number>()
      const teardropClaimsByEmotion = new Map<string, number>()
      let totalSecondsInRange = 0
      for (const s of sessions) {
        const eid = s.soundie.note.emotionId
        totalSecondsInRange += s.duration
        if (!eid) continue
        listenByEmotion.set(eid, (listenByEmotion.get(eid) ?? 0) + s.duration)
      }
      for (const row of teardropFocusRows) {
        const eid = row.card.emotionId
        if (!eid) continue
        const durationSec = Math.max(0, Math.floor(row.durationMs / 1000))
        teardropFocusByEmotion.set(eid, (teardropFocusByEmotion.get(eid) ?? 0) + durationSec)
      }
      for (const row of teardropClaimRows) {
        const eid = row.teardropCard.emotionId
        if (!eid) continue
        teardropClaimsByEmotion.set(eid, (teardropClaimsByEmotion.get(eid) ?? 0) + 1)
      }

      const emotions = await ctx.db.emotion.findMany()
      const releaseByEmotion = emotions
        .map((e) => ({
          emotionId: e.id,
          namePl: e.namePl,
          nameEn: e.nameEn,
          listenSeconds: listenByEmotion.get(e.id) ?? 0,
          teardropFocusSeconds: teardropFocusByEmotion.get(e.id) ?? 0,
          teardropClaims: teardropClaimsByEmotion.get(e.id) ?? 0,
          seconds: (listenByEmotion.get(e.id) ?? 0) + (teardropFocusByEmotion.get(e.id) ?? 0),
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

      const todayClaim = latestClaim
        ? (() => {
            const texts = pickLocaleForTexts(latestClaim.teardropCard.texts, locale)
            const tagline = texts.find((t) => t.field === 'tagline')?.content?.trim() ?? ''
            const affirmation = texts.find((t) => t.field === 'affirmation')?.content?.trim() ?? ''
            const meaningUpright =
              texts.find((t) => t.field === 'meaning_upright')?.content?.trim() ?? ''
            const meaningShadow =
              texts.find((t) => t.field === 'meaning_shadow')?.content?.trim() ?? ''
            return {
              claimDate: latestClaim.claimDate,
              noteId: latestClaim.noteId,
              rareCaption: latestClaim.rareCaption,
              teardrop: {
                id: latestClaim.teardropCard.id,
                slug: latestClaim.teardropCard.slug,
                name: latestClaim.teardropCard.name,
                emotionId: latestClaim.teardropCard.emotionId,
                ...(tagline ? { tagline } : {}),
                ...(affirmation ? { affirmation } : {}),
                ...(meaningUpright ? { meaningUpright } : {}),
                ...(meaningShadow ? { meaningShadow } : {}),
              },
            }
          })()
        : null

      return {
        releaseByEmotion,
        moodInRange,
        minutesToday,
        totalSecondsInRange,
        soundieProgress,
        todayClaim,
      }
    }),
})
