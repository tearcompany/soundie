import { TRPCError, publicProcedure, router } from '../init'
import {
  ritualGetByIdInput,
  ritualGetByIdOutput,
  ritualListOutput,
} from '@/lib/validators/ritual'

function byUntilSecAsc<T extends { untilSec: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.untilSec - b.untilSec)
}

export const ritualRouter = router({
  getById: publicProcedure
    .input(ritualGetByIdInput)
    .output(ritualGetByIdOutput)
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.ritual.findUnique({
        where: { id: input.ritualId },
        include: { phases: true },
      })
      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ritual not found' })
      }
      return {
        ...row,
        phases: byUntilSecAsc(row.phases),
      }
    }),

  list: publicProcedure
    .output(ritualListOutput)
    .query(async ({ ctx }) => {
      const rows = await ctx.db.ritual.findMany({
        include: { phases: true },
        orderBy: { createdAt: 'asc' },
      })
      return rows.map((row) => ({
        ...row,
        phases: byUntilSecAsc(row.phases),
      }))
    }),
})
