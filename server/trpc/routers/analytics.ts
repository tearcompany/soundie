import { publicProcedure, router } from '../init'
import { recordEventInput, recordEventOutput } from '@/lib/validators/analytics'

export const analyticsRouter = router({
  record: publicProcedure
    .input(recordEventInput)
    .output(recordEventOutput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.analyticsEvent.create({
        data: {
          name: input.name,
          playerId: input.playerId === undefined || input.playerId === null ? null : input.playerId,
          ...(input.meta !== undefined ? { meta: input.meta as object } : {}),
        },
      })
      return { ok: true }
    }),
})
