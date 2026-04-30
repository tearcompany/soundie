import { TRPCError, publicProcedure, router } from '../init'
import {
  sanctuaryDiagramInput,
  sanctuaryDiagramOutput,
  sanctuarySetFavoriteInput,
} from '@/lib/validators/sanctuary'
import { getNoteById, isValidNoteId, NOTE_LIST } from '@/lib/notes'
import { gardenPhaseForSoundie } from '@/lib/soundie-garden-phase'
import { z } from 'zod'

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
      const player = await ctx.db.player.findUnique({
        where: { id: input.playerId },
        select: { id: true, favoriteNoteId: true },
      })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }
      const since = new Date()
      since.setDate(since.getDate() - input.rangeDays)
      since.setHours(0, 0, 0, 0)
      const heatmapDays = input.heatmapDays ?? 84
      const sinceHeatmap = new Date()
      sinceHeatmap.setDate(sinceHeatmap.getDate() - heatmapDays)
      sinceHeatmap.setHours(0, 0, 0, 0)

      const dbWithOptionalTeardropFocus = ctx.db as unknown as {
        teardropFocusSession?: {
          findMany: (args: {
            where: { playerId: string; createdAt: { gte: Date } }
            select: { durationMs: true; card: { select: { emotionId: true } } }
          }) => Promise<Array<{ durationMs: number; card: { emotionId: string | null } }>>
        }
      }
      const teardropFocusDelegate = dbWithOptionalTeardropFocus.teardropFocusSession
      const [
        sessions,
        heatmapSessions,
        moodRows,
        soundies,
        latestClaim,
        teardropFocusRows,
        teardropClaimRows,
        recentListenSessions,
        favoriteNoteRow,
      ] = await Promise.all([
        ctx.db.listenSession.findMany({
          where: { playerId: input.playerId, completedAt: { gte: since } },
          select: {
            duration: true,
            completedAt: true,
            soundie: { select: { note: { select: { emotionId: true } } } },
          },
        }),
        ctx.db.listenSession.findMany({
          where: { playerId: input.playerId, completedAt: { gte: sinceHeatmap } },
          select: {
            duration: true,
            completedAt: true,
            soundie: { select: { noteId: true } },
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
        ctx.db.listenSession.findMany({
          where: { playerId: input.playerId },
          orderBy: { completedAt: 'desc' },
          take: 24,
          select: {
            completedAt: true,
            duration: true,
            soundie: { select: { note: { select: { id: true, name: true } } } },
          },
        }),
        player.favoriteNoteId
          ? ctx.db.note.findUnique({
              where: { id: player.favoriteNoteId },
              select: { id: true, name: true },
            })
          : Promise.resolve(null),
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
          gardenPhase: gardenPhaseForSoundie({
            totalListenTime: s.totalListenTime,
            loreUnlocked: s.loreUnlocked,
          }),
        }
      })

      const topEmotion = releaseByEmotion.find((e) => e.seconds > 0)
      const dominantNoteEntry = topEmotion
        ? NOTE_LIST.find((n) => n.emotionId === topEmotion.emotionId)
        : undefined
      const dominantNoteId = dominantNoteEntry?.id ?? null
      const dominantNoteName = dominantNoteEntry?.name ?? null

      const recentSessions = recentListenSessions.map((row) => ({
        completedAtIso: row.completedAt.toISOString(),
        minutes: Math.max(0, Math.floor(row.duration / 60)),
        noteId: row.soundie.note.id,
        noteName: row.soundie.note.name,
      }))

      const heatmapBuckets = new Map<string, number>()
      for (const s of heatmapSessions) {
        const dateStr = s.completedAt.toISOString().slice(0, 10)
        const key = `${s.soundie.noteId}::${dateStr}`
        heatmapBuckets.set(key, (heatmapBuckets.get(key) ?? 0) + s.duration)
      }
      const activeNoteIds = new Set(heatmapSessions.map((s) => s.soundie.noteId))
      const heatmapNotes = NOTE_LIST
        .filter((n) => activeNoteIds.has(n.id))
        .map((n) => ({ noteId: n.id, shortName: n.short, chromaHex: n.chromaHex }))
      const heatmapCells = Array.from(heatmapBuckets.entries()).map(([key, seconds]) => {
        const [noteId, dateStr] = key.split('::')
        return {
          noteId: noteId ?? '',
          dateStr: dateStr ?? '',
          minutes: Math.floor(seconds / 60),
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
        noteHeatmap: { cells: heatmapCells, notes: heatmapNotes },
        todayClaim,
        favoriteNoteId: player.favoriteNoteId,
        favoriteNoteName: favoriteNoteRow?.name ?? null,
        dominantNoteId,
        dominantNoteName,
        recentSessions,
      }
    }),

  setFavoriteNote: publicProcedure
    .input(sanctuarySetFavoriteInput)
    .output(z.object({ ok: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({ where: { id: input.playerId } })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }
      if (input.noteId !== null && !isValidNoteId(input.noteId)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid note id' })
      }
      await ctx.db.player.update({
        where: { id: input.playerId },
        data: { favoriteNoteId: input.noteId },
      })
      return { ok: true as const }
    }),
})
