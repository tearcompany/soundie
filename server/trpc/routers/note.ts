import { TRPCError, router, publicProcedure } from '../init'
import { z } from 'zod'
import { noteIdInput, noteListItemSchema, noteWithLoreSchema, urlKeyInput } from '@/lib/validators/note'

const listOutput = z.array(noteListItemSchema)
const byIdInput = z.object({ id: noteIdInput })
const byUrlKeyInput = z.object({ urlKey: urlKeyInput })

export const noteRouter = router({
  list: publicProcedure.output(listOutput).query(async ({ ctx }) => {
    const rows = await ctx.db.note.findMany({ orderBy: { sortOrder: 'asc' } })
    return rows
  }),

  getById: publicProcedure
    .input(byIdInput)
    .output(noteWithLoreSchema)
    .query(async ({ ctx, input }) => {
      const n = await ctx.db.note.findUnique({ where: { id: input.id } })
      if (!n) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
      }
      const [fr, caps] = await Promise.all([
        ctx.db.loreFragment.findMany({
          where: { noteId: input.id },
          orderBy: { orderIndex: 'asc' },
          select: { body: true },
        }),
        ctx.db.noteCaption.findMany({
          where: { noteId: input.id },
          orderBy: { orderIndex: 'asc' },
          select: { body: true },
        }),
      ])
      return { ...n, loreFragments: fr.map((f) => f.body), captions: caps }
    }),

  getByUrlKey: publicProcedure
    .input(byUrlKeyInput)
    .output(noteListItemSchema)
    .query(async ({ ctx, input }) => {
      const n = await ctx.db.note.findUnique({ where: { urlKey: input.urlKey } })
      if (!n) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unknown url key' })
      }
      return n
    }),
})
