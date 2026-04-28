import { publicProcedure, router } from '../init'
import { z } from 'zod'

const metricsOutput = z.object({
  totalPlayers: z.number().int(),
  newPlayersLast24h: z.number().int(),
  d1RetentionPercent: z.number(),
  avgSessionSeconds: z.number(),
  totalShareClicks: z.number().int(),
  totalShareCompletes: z.number().int(),
})

export const adminRouter = router({
  getMetrics: publicProcedure
    .output(metricsOutput)
    .query(async ({ ctx }) => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

      const [
        totalPlayers,
        newPlayersLast24h,
        newPlayersPrev24h,
        sessionAgg,
        shareClicks,
        shareCompletes,
      ] = await Promise.all([
        ctx.db.player.count(),
        ctx.db.player.count({ where: { createdAt: { gte: yesterday } } }),
        ctx.db.player.count({ where: { createdAt: { gte: twoDaysAgo, lt: yesterday } } }),
        ctx.db.listenSession.aggregate({ _avg: { duration: true } }),
        ctx.db.analyticsEvent.count({ where: { name: 'share_click' } }),
        ctx.db.analyticsEvent.count({ where: { name: 'share_complete' } }),
      ])

      const d1Retention =
        newPlayersPrev24h > 0
          ? Math.round((newPlayersLast24h / newPlayersPrev24h) * 100 * 10) / 10
          : 0

      return {
        totalPlayers,
        newPlayersLast24h,
        d1RetentionPercent: d1Retention,
        avgSessionSeconds: Math.round(sessionAgg._avg.duration ?? 0),
        totalShareClicks: shareClicks,
        totalShareCompletes: shareCompletes,
      }
    }),
})
