import { TRPCError, publicProcedure, router } from '../init'
import {
  createSessionReflectionInput,
  createSessionReflectionOutput,
  setSessionReflectionMoodAfterInput,
  setSessionReflectionMoodAfterOutput,
} from '@/lib/validators/session-reflection'

export const sessionReflectionRouter = router({
  createForSession: publicProcedure
    .input(createSessionReflectionInput)
    .output(createSessionReflectionOutput)
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.listenSession.findUnique({
        where: { id: input.sessionId },
        select: {
          id: true,
          playerId: true,
          soundie: { select: { noteId: true } },
        },
      })
      if (!session || session.playerId !== input.playerId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found for player' })
      }
      if (session.soundie.noteId !== input.noteId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session note mismatch' })
      }

      const reflection = await ctx.db.sessionReflection.upsert({
        where: { sessionId: input.sessionId },
        create: {
          playerId: input.playerId,
          sessionId: input.sessionId,
          noteId: input.noteId,
          moodBefore: input.moodBefore,
        },
        update: {
          playerId: input.playerId,
          noteId: input.noteId,
          moodBefore: input.moodBefore,
        },
      })

      return { reflection }
    }),

  setMoodAfter: publicProcedure
    .input(setSessionReflectionMoodAfterInput)
    .output(setSessionReflectionMoodAfterOutput)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.sessionReflection.findFirst({
        where: { id: input.reflectionId, playerId: input.playerId },
        select: { id: true },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session reflection not found' })
      }
      const reflection = await ctx.db.sessionReflection.update({
        where: { id: existing.id },
        data: { moodAfter: input.moodAfter },
      })
      return { reflection }
    }),
})
