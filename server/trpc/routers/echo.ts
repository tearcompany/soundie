import { publicProcedure, router, TRPCError } from '../init'
import { randomUUID } from 'crypto'
import { z } from 'zod'

const playerIdSchema = z.string().min(1).max(64)

const ritualMetaEchoSchema = z
  .object({
    ritualKey: z.string(),
    ritualId: z.string(),
    entryNote: z.string(),
    dominantNote: z.string(),
    notes: z.array(z.string()),
    elapsedSeconds: z.number().int().positive(),
    phraseSource: z.string().optional(),
  })
  .strict()

const echoRowSchema = z.object({
  id: z.string(),
  noteId: z.string(),
  phrase: z.string(),
  mood: z.string().nullable(),
  timeOfDay: z.string(),
  streak: z.number(),
  savedAt: z.coerce.date(),
  ritualMeta: z.unknown().nullable().optional(),
})

export const echoRouter = router({
  save: publicProcedure
    .input(
      z.object({
        playerId: playerIdSchema,
        noteId: z.string(),
        phrase: z.string().min(1).max(520),
        mood: z.string().nullable().optional(),
        timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
        streak: z.number().int().min(0).default(0),
        ritualMeta: ritualMetaEchoSchema.nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({
        where: { id: input.playerId },
        select: { id: true },
      })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }
      const id = randomUUID()
      const savedAt = new Date()
      await ctx.db.echoEntry.create({
        data: {
          id,
          playerId: input.playerId,
          noteId: input.noteId,
          phrase: input.phrase,
          mood: input.mood ?? null,
          timeOfDay: input.timeOfDay,
          streak: input.streak,
          savedAt,
          ritualMeta:
            input.ritualMeta === undefined || input.ritualMeta === null
              ? undefined
              : JSON.parse(JSON.stringify(input.ritualMeta)),
        },
      })
      return { id, savedAt }
    }),

  list: publicProcedure
    .input(
      z.object({
        playerId: playerIdSchema,
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.echoEntry.findMany({
        where: { playerId: input.playerId },
        orderBy: { savedAt: 'desc' },
        take: input.limit,
      })
      const entries = rows.map((r) => echoRowSchema.parse(r))
      return { entries }
    }),
})
