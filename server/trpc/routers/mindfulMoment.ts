import { z } from 'zod'
import { publicProcedure, router } from '../init'

const completeInput = z.object({
  playerId: z.string().cuid(),
  noteId: z.string().optional(),
  type: z.enum(['fly']).default('fly'),
})

const statsInput = z.object({
  playerId: z.string().cuid(),
})

const statsOutput = z.object({
  count: z.number().int().nonnegative(),
  lastType: z.string().nullable(),
  totalMinutes: z.number().int().nonnegative(),
})

export const mindfulMomentRouter = router({
  complete: publicProcedure
    .input(completeInput)
    .output(z.object({ ok: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mindfulMomentLog.create({
        data: {
          playerId: input.playerId,
          type: input.type,
          noteId: input.noteId ?? null,
        },
      })
      return { ok: true }
    }),

  getStats: publicProcedure
    .input(statsInput)
    .output(statsOutput)
    .query(async ({ ctx, input }) => {
      const [count, last] = await Promise.all([
        ctx.db.mindfulMomentLog.count({ where: { playerId: input.playerId } }),
        ctx.db.mindfulMomentLog.findFirst({
          where: { playerId: input.playerId },
          orderBy: { completedAt: 'desc' },
          select: { type: true },
        }),
      ])
      return {
        count,
        lastType: last?.type ?? null,
        totalMinutes: count,
      }
    }),
})
