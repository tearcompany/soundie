import { router, publicProcedure } from '../init'
import {
  playerEnsureInput,
  playerEnsureOutput,
} from '@/lib/validators/soundie'

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
})
