import { z } from 'zod'
import { router, publicProcedure } from '../init'
import {
  playerEnsureInput,
  playerEnsureOutput,
} from '@/lib/validators/soundie'
import { calcProgressToNextFragment, loreUnlockStatusFromTotalListenSeconds, MAX_LORE_FRAGMENTS } from '@/lib/progress'

export const playerRouter = router({
  ensure: publicProcedure
    .input(playerEnsureInput)
    .output(playerEnsureOutput)
    .mutation(async ({ ctx, input }) => {
      const requested = input?.playerId
      if (requested) {
        const existing = await ctx.db.player.findUnique({
          where: { id: requested },
        })
        if (existing) return { id: existing.id }
      }
      const created = await ctx.db.player.create({ data: {} })
      return { id: created.id }
    }),

  getStats: publicProcedure
    .input(z.object({ playerId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const [player, soundies] = await Promise.all([
        ctx.db.player.findUnique({
          where: { id: input.playerId },
          select: { streakNights: true },
        }),
        ctx.db.soundie.findMany({
          where: { playerId: input.playerId },
          orderBy: { totalListenTime: 'desc' },
          select: {
            noteId: true,
            level: true,
            totalListenTime: true,
            loreUnlocked: true,
            discoveredAt: true,
            note: { select: { short: true, name: true, chromaHex: true, sortOrder: true } },
          },
        }),
      ])

      const totalSeconds = soundies.reduce((s, r) => s + r.totalListenTime, 0)

      const notes = soundies.map((r) => {
        const totalMins = Math.floor(r.totalListenTime / 60)
        const prog = calcProgressToNextFragment(totalMins)
        const lore = loreUnlockStatusFromTotalListenSeconds(r.totalListenTime)
        return {
          noteId: r.noteId,
          noteShort: r.note.short,
          noteName: r.note.name,
          noteHex: r.note.chromaHex,
          sortOrder: r.note.sortOrder,
          level: r.level,
          totalListenTime: r.totalListenTime,
          totalMinutes: totalMins,
          loreUnlocked: r.loreUnlocked,
          loreMax: MAX_LORE_FRAGMENTS,
          progressPercent: prog.percent,
          nextLoreMinutes: prog.next,
          fullyUnlocked: lore.unlockedFragments >= MAX_LORE_FRAGMENTS,
          discoveredAt: r.discoveredAt,
        }
      })

      return {
        streakNights: player?.streakNights ?? 0,
        totalSeconds,
        totalMinutes: Math.floor(totalSeconds / 60),
        noteCount: notes.length,
        notes,
      }
    }),

  getForSession: publicProcedure
    .output(z.object({ id: z.string() }).nullable())
    .query(async ({ ctx }) => {
      const userId = ctx.session?.user?.id
      if (!userId) return null
      const player = await ctx.db.player.findUnique({ where: { userId } })
      return player ? { id: player.id } : null
    }),
})
