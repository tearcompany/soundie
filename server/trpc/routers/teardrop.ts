import { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import { TRPCError, publicProcedure, router } from '../init'
import {
  TEARDROP_DECK_SLUG,
  sortedByPhaseOrder,
} from '@/lib/teardrop-unlock'

const localeInput = z.string().min(2).max(8).optional()
const deckSlugInput = z.object({ deckSlug: z.string().min(1), locale: localeInput })
const cardSlugInput = z.object({ slug: z.string().min(1), locale: localeInput })
const mappedNoteInput = z.object({
  noteId: z.string().min(1),
  locale: localeInput,
  playerId: z.string().cuid().optional(),
})
const recordFocusInput = z.object({
  playerId: z.string().cuid(),
  noteId: z.string().min(1),
  cardId: z.string().cuid(),
  durationMs: z.number().int().min(0),
  source: z.string().min(1).max(64).optional(),
})
const progressInput = z.object({
  playerId: z.string().cuid(),
  noteId: z.string().min(1),
})

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
const phaseInfoSchema = z.object({
  slug: z.string(),
  titlePl: z.string(),
  titleEn: z.string(),
  unlockOrder: z.number().int(),
})

const mappedTeardropResponse = z.object({
  cards: z.array(teardropCardSchema),
  totalCards: z.number().int().nonnegative(),
  phases: z.array(phaseInfoSchema),
})
const recordFocusOutput = z.object({ ok: z.boolean() })
const progressOutput = z.object({
  xp: z.number().int().nonnegative(),
  unlockedCardsGlobal: z.number().int().nonnegative(),
  unlockedCardsForNote: z.number().int().nonnegative(),
  totalCardsForNote: z.number().int().nonnegative(),
})
const unlockedCollectionInput = z.object({
  playerId: z.string().cuid(),
  locale: localeInput,
})
const unlockedCollectionOutput = z.object({
  cards: z.array(teardropCardSchema),
  phases: z.array(phaseInfoSchema),
  unlockedCards: z.number().int().nonnegative(),
  totalDeckCards: z.number().int().nonnegative(),
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

async function phasesMetaForDeck(db: Pick<PrismaClient, 'teardropPhase'>, deckId: string) {
  return db.teardropPhase.findMany({
    where: { deckId },
    orderBy: { unlockOrder: 'asc' },
    select: { slug: true, titlePl: true, titleEn: true, unlockOrder: true },
  })
}

async function cardUnlockIdsForPlayer(db: Pick<PrismaClient, 'teardropCardUnlock'>, playerId: string) {
  const rows = await db.teardropCardUnlock.findMany({
    where: { playerId },
    orderBy: { createdAt: 'asc' },
    select: { cardId: true },
  })
  const seen = new Set<string>()
  const ids: string[] = []
  for (const r of rows) {
    if (!seen.has(r.cardId)) {
      seen.add(r.cardId)
      ids.push(r.cardId)
    }
  }
  return ids
}

export const teardropRouter = router({
  getUnlockedCollection: publicProcedure
    .input(unlockedCollectionInput)
    .output(unlockedCollectionOutput)
    .query(async ({ ctx, input }) => {
      const locale = input.locale ?? 'en'
      const deck = await ctx.db.teardropDeck.findUnique({
        where: { slug: TEARDROP_DECK_SLUG },
        select: { id: true },
      })
      if (!deck) {
        return { cards: [], phases: [], unlockedCards: 0, totalDeckCards: 0 }
      }
      const [phases, totalDeckCards, unlockedIds] = await Promise.all([
        phasesMetaForDeck(ctx.db, deck.id),
        ctx.db.teardropCard.count({ where: { deckId: deck.id } }),
        cardUnlockIdsForPlayer(ctx.db, input.playerId),
      ])
      const phaseOrderBySlug = Object.fromEntries(phases.map((p) => [p.slug, p.unlockOrder]))
      if (unlockedIds.length === 0) {
        return { cards: [], phases, unlockedCards: 0, totalDeckCards }
      }
      const cards = await ctx.db.teardropCard.findMany({
        where: { deckId: deck.id, id: { in: unlockedIds } },
        include: { texts: true },
      })
      const ordered = sortedByPhaseOrder(cards, phaseOrderBySlug).map((c) => ({
        ...c,
        texts: pickLocaleTexts(c.texts, locale),
      }))
      return { cards: ordered, phases, unlockedCards: ordered.length, totalDeckCards }
    }),

  getProgress: publicProcedure
    .input(progressInput)
    .output(progressOutput)
    .query(async ({ ctx, input }) => {
      const [noteLinks, allUnlocks, noteUnlockCount] = await Promise.all([
        ctx.db.noteTeardropCard.count({ where: { noteId: input.noteId } }),
        ctx.db.teardropCardUnlock.findMany({
          where: { playerId: input.playerId },
          select: { xpAwarded: true },
        }),
        ctx.db.teardropCardUnlock.count({
          where: { playerId: input.playerId, noteId: input.noteId },
        }),
      ])
      const totalXp = allUnlocks.reduce((sum, u) => sum + u.xpAwarded, 0)
      return {
        xp: totalXp,
        unlockedCardsGlobal: allUnlocks.length,
        unlockedCardsForNote: noteUnlockCount,
        totalCardsForNote: noteLinks,
      }
    }),

  recordFocus: publicProcedure
    .input(recordFocusInput)
    .output(recordFocusOutput)
    .mutation(async ({ ctx, input }) => {
      if (input.durationMs < 1500) return { ok: true }
      const endedAt = new Date()
      const startedAt = new Date(endedAt.getTime() - input.durationMs)
      try {
        await ctx.db.teardropFocusSession.create({
          data: {
            playerId: input.playerId,
            noteId: input.noteId,
            cardId: input.cardId,
            durationMs: input.durationMs,
            startedAt,
            endedAt,
            ...(input.source ? { source: input.source } : {}),
          },
        })
      } catch {}
      return { ok: true }
    }),

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
    .output(mappedTeardropResponse)
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
      const cards = links.map((l) => ({
        ...l.card,
        texts: pickLocaleTexts(l.card.texts, locale),
      }))
      const totalCards = cards.length

      const deckForPhases = await ctx.db.teardropDeck.findUnique({
        where: { slug: TEARDROP_DECK_SLUG },
        select: { id: true },
      })
      const allPhases = deckForPhases ? await phasesMetaForDeck(ctx.db, deckForPhases.id) : []

      if (!input.playerId) {
        const ordered = sortedByPhaseOrder(cards, {})
        return { cards: ordered.slice(0, 1), totalCards, phases: allPhases }
      }
      const playerId = input.playerId
      const phaseOrderBySlug = Object.fromEntries(allPhases.map((p) => [p.slug, p.unlockOrder]))
      const ordered = sortedByPhaseOrder(cards, phaseOrderBySlug)

      const existingUnlocks = await ctx.db.teardropCardUnlock.findMany({
        where: { playerId, noteId: input.noteId },
        select: { cardId: true },
      })
      const unlockedSet = new Set(existingUnlocks.map((u) => u.cardId))
      const visibleCards = ordered.filter((card) => unlockedSet.has(card.id))
      return { cards: visibleCards, totalCards, phases: allPhases }
    }),
})
