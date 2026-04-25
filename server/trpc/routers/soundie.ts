import { z } from 'zod'
import { router, publicProcedure, TRPCError } from '../init'
import {
  completeSessionInput,
  soundieRowSchema,
} from '@/lib/validators/soundie'
import {
  levelFromTotalListenSeconds,
  loreUnlockedFromTotalListenSeconds,
} from '@/lib/progress'
import { noteIdInput } from '@/lib/validators/note'

const playerNoteInput = z.object({
  playerId: z.string().cuid(),
  noteId: noteIdInput,
})

const sessionItemSchema = z.object({
  id: z.string(),
  duration: z.number().int(),
  completedAt: z.coerce.date(),
})

const sessionsOutputSchema = z.object({
  sessions: z.array(sessionItemSchema),
  totalCount: z.number().int(),
  totalSeconds: z.number().int(),
})

export const soundieRouter = router({
  getProgress: publicProcedure
    .input(playerNoteInput)
    .output(soundieRowSchema.nullable())
    .query(async ({ ctx, input }) => {
      return ctx.db.soundie.findUnique({
        where: {
          playerId_noteId: {
            playerId: input.playerId,
            noteId: input.noteId,
          },
        },
      })
    }),

  getSessions: publicProcedure
    .input(playerNoteInput)
    .output(sessionsOutputSchema)
    .query(async ({ ctx, input }) => {
      const soundie = await ctx.db.soundie.findUnique({
        where: {
          playerId_noteId: {
            playerId: input.playerId,
            noteId: input.noteId,
          },
        },
        include: {
          sessions: {
            orderBy: { completedAt: 'desc' },
            take: 50,
            select: { id: true, duration: true, completedAt: true },
          },
        },
      })
      if (!soundie) return { sessions: [], totalCount: 0, totalSeconds: 0 }
      const total = soundie.sessions.reduce((acc, s) => acc + s.duration, 0)
      return {
        sessions: soundie.sessions,
        totalCount: soundie.sessions.length,
        totalSeconds: total,
      }
    }),

  completeSession: publicProcedure
    .input(completeSessionInput)
    .output(soundieRowSchema)
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({
        where: { id: input.playerId },
      })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }

      const note = await ctx.db.note.findUnique({ where: { id: input.noteId } })
      if (!note) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        const row = await tx.soundie.upsert({
          where: {
            playerId_noteId: {
              playerId: input.playerId,
              noteId: input.noteId,
            },
          },
          create: {
            playerId: input.playerId,
            noteId: input.noteId,
            totalListenTime: input.durationSeconds,
            level: levelFromTotalListenSeconds(input.durationSeconds),
            loreUnlocked: loreUnlockedFromTotalListenSeconds(
              input.durationSeconds
            ),
          },
          update: {
            totalListenTime: { increment: input.durationSeconds },
          },
        })

        const total = row.totalListenTime
        const level = levelFromTotalListenSeconds(total)
        const loreUnlocked = loreUnlockedFromTotalListenSeconds(total)

        const soundie = await tx.soundie.update({
          where: { id: row.id },
          data: { level, loreUnlocked, lastSeenAt: new Date() },
        })

        await tx.listenSession.create({
          data: {
            playerId: input.playerId,
            soundieId: soundie.id,
            duration: input.durationSeconds,
          },
        })

        return soundie
      })

      return updated
    }),
})
