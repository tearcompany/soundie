import { TRPCError, publicProcedure, router } from '../init'
import { isValidYyyyMmDd } from '@/lib/calendar-day'
import { saveMoodEntryInput, saveMoodEntryOutput } from '@/lib/validators/mood'

export const moodRouter = router({
  saveEntry: publicProcedure
    .input(saveMoodEntryInput)
    .output(saveMoodEntryOutput)
    .mutation(async ({ ctx, input }) => {
      if (!isValidYyyyMmDd(input.entryDate)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid entry date' })
      }
      const player = await ctx.db.player.findUnique({ where: { id: input.playerId } })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }
      const note = await ctx.db.note.findUnique({ where: { id: input.noteId } })
      if (!note) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
      }
      await ctx.db.moodEntry.create({
        data: {
          playerId: input.playerId,
          noteId: input.noteId,
          mood: input.mood,
          entryDate: input.entryDate,
        },
      })
      await ctx.db.analyticsEvent.create({
        data: {
          name: 'mood_check_in',
          playerId: input.playerId,
          meta: { noteId: input.noteId, mood: input.mood, entryDate: input.entryDate },
        },
      })
      return { ok: true }
    }),
})
