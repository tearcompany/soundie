import { TRPCError, router, publicProcedure } from '../init'
import { z } from 'zod'
import {
  localeInput,
  noteIdInput,
  noteListItemSchema,
  noteWithLoreSchema,
  urlKeyInput,
} from '@/lib/validators/note'

const listOutput = z.array(noteListItemSchema)
const byIdInput = z.object({ id: noteIdInput, locale: localeInput })
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
      const locale = input.locale ?? 'en'
      const n = await ctx.db.note.findUnique({ where: { id: input.id } })
      if (!n) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
      }
      const loreLoc =
        locale.toLowerCase().startsWith('pl') ? 'pl' : 'en'
      const [frInit, caps, emotion] = await Promise.all([
        ctx.db.loreFragment.findMany({
          where: { noteId: input.id, locale: loreLoc },
          orderBy: { orderIndex: 'asc' },
          select: { body: true },
        }),
        ctx.db.noteCaption.findMany({
          where: { noteId: input.id, locale },
          orderBy: { orderIndex: 'asc' },
          select: { body: true },
        }),
        n.emotionId
          ? ctx.db.emotion.findUnique({ where: { id: n.emotionId } })
          : Promise.resolve(null),
      ])
      const fr =
        frInit.length === 0 && loreLoc === 'pl'
          ? await ctx.db.loreFragment.findMany({
              where: { noteId: input.id, locale: 'en' },
              orderBy: { orderIndex: 'asc' },
              select: { body: true },
            })
          : frInit
      const fallbackCaps =
        caps.length === 0
          ? await ctx.db.noteCaption.findMany({
              where: { noteId: input.id, locale: 'en' },
              orderBy: { orderIndex: 'asc' },
              select: { body: true },
            })
          : caps
      const emotionName =
        locale.startsWith('pl')
          ? (emotion?.namePl ?? null)
          : (emotion?.nameEn ?? emotion?.namePl ?? null)
      return {
        ...n,
        emotionName,
        loreFragments: fr.map((f) => f.body),
        captions: fallbackCaps,
      }
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
