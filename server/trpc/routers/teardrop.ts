import { z } from 'zod'
import { TRPCError, publicProcedure, router } from '../init'

const localeInput = z.string().min(2).max(8).optional()
const deckSlugInput = z.object({ deckSlug: z.string().min(1), locale: localeInput })
const cardSlugInput = z.object({ slug: z.string().min(1), locale: localeInput })
const mappedNoteInput = z.object({ noteId: z.string().min(1), locale: localeInput })

const textItemSchema = z.object({
  locale: z.string(),
  field: z.string(),
  content: z.string(),
})

const teardropCardSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  phase: z.string().nullable(),
  phaseOrder: z.number().int().nullable(),
  arcanaType: z.string(),
  suit: z.string().nullable(),
  cardNumber: z.number().int().nullable(),
  sourcePath: z.string(),
  emotionId: z.string().nullable(),
  isTemplate: z.boolean(),
  texts: z.array(textItemSchema),
})

function pickLocaleTexts(
  texts: Array<{ locale: string; field: string; content: string }>,
  locale: string
) {
  const exact = texts.filter((t) => t.locale === locale)
  if (exact.length > 0) return exact
  const en = texts.filter((t) => t.locale === 'en')
  if (en.length > 0) return en
  return texts.filter((t) => t.locale === 'pl')
}

export const teardropRouter = router({
  listCards: publicProcedure
    .input(deckSlugInput)
    .output(z.array(teardropCardSchema))
    .query(async ({ ctx, input }) => {
      const locale = input.locale ?? 'en'
      const deck = await ctx.db.teardropDeck.findUnique({
        where: { slug: input.deckSlug },
      })
      if (!deck) return []
      const cards = await ctx.db.teardropCard.findMany({
        where: { deckId: deck.id },
        include: { texts: true },
        orderBy: [{ phaseOrder: 'asc' }, { arcanaType: 'asc' }, { suit: 'asc' }, { slug: 'asc' }],
      })
      return cards.map((c) => ({ ...c, texts: pickLocaleTexts(c.texts, locale) }))
    }),

  getCardBySlug: publicProcedure
    .input(cardSlugInput)
    .output(teardropCardSchema)
    .query(async ({ ctx, input }) => {
      const locale = input.locale ?? 'en'
      const card = await ctx.db.teardropCard.findFirst({
        where: { slug: input.slug },
        include: { texts: true },
      })
      if (!card) throw new TRPCError({ code: 'NOT_FOUND', message: 'Card not found' })
      return { ...card, texts: pickLocaleTexts(card.texts, locale) }
    }),

  getMappedForNote: publicProcedure
    .input(mappedNoteInput)
    .output(z.array(teardropCardSchema))
    .query(async ({ ctx, input }) => {
      const locale = input.locale ?? 'en'
      const links = await ctx.db.noteTeardropCard.findMany({
        where: { noteId: input.noteId },
        orderBy: { sortOrder: 'asc' },
        include: {
          card: {
            include: { texts: true },
          },
        },
      })
      return links.map((l) => ({
        ...l.card,
        texts: pickLocaleTexts(l.card.texts, locale),
      }))
    }),
})

