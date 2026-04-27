import { z } from 'zod'
import { TRPCError, publicProcedure, router } from '../init'
import { Prisma } from '@prisma/client'

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

function unlockedTeardropCount(totalListenSeconds: number): number {
  const firstUnlockThresholdSeconds = 540
  if (totalListenSeconds < firstUnlockThresholdSeconds) return 0
  const mins = Math.max(0, Math.floor(totalListenSeconds / 60))
  return Math.max(1, 1 + Math.floor(mins / 60))
}

const TEARDROP_DECK_SLUG = 'teardrop-oracle-deck-v0'

function sortedByPhaseOrder<T extends { phase: string | null; phaseOrder: number | null }>(
  items: T[],
  phaseOrderBySlug: Record<string, number>
) {
  return [...items].sort((a, b) => {
    const aPhase = a.phase ? (phaseOrderBySlug[a.phase] ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
    const bPhase = b.phase ? (phaseOrderBySlug[b.phase] ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
    if (aPhase !== bPhase) return aPhase - bPhase
    const aOrder = a.phaseOrder ?? Number.MAX_SAFE_INTEGER
    const bOrder = b.phaseOrder ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    return 0
  })
}

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
        return { cards: [], unlockedCards: 0, totalDeckCards: 0 }
      }
      const [phases, totalDeckCards, unlocks] = await Promise.all([
        ctx.db.teardropPhase.findMany({
          where: { deckId: deck.id },
          select: { slug: true, unlockOrder: true },
        }),
        ctx.db.teardropCard.count({ where: { deckId: deck.id } }),
        ctx.db.teardropCardUnlock.findMany({
          where: { playerId: input.playerId },
          orderBy: { createdAt: 'asc' },
          distinct: ['cardId'],
          select: { cardId: true },
        }),
      ])
      const phaseOrderBySlug = Object.fromEntries(phases.map((p) => [p.slug, p.unlockOrder]))
      const unlockedIds = unlocks.map((u) => u.cardId)
      if (unlockedIds.length === 0) {
        return { cards: [], unlockedCards: 0, totalDeckCards }
      }
      const cards = await ctx.db.teardropCard.findMany({
        where: { deckId: deck.id, id: { in: unlockedIds } },
        include: { texts: true },
      })
      const ordered = sortedByPhaseOrder(cards, phaseOrderBySlug).map((c) => ({
        ...c,
        texts: pickLocaleTexts(c.texts, locale),
      }))
      return { cards: ordered, unlockedCards: ordered.length, totalDeckCards }
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
      const totalUnlockedGlobal = allUnlocks.length
      let noteUnlocks = noteUnlockCount
      if (noteUnlocks === 0) {
        const [soundie, claimBonus] = await Promise.all([
          ctx.db.soundie.findUnique({
            where: { playerId_noteId: { playerId: input.playerId, noteId: input.noteId } },
            select: { totalListenTime: true },
          }),
          ctx.db.dailyClaim.count({ where: { playerId: input.playerId, noteId: input.noteId } }),
        ])
        noteUnlocks = Math.min(noteLinks, unlockedTeardropCount(soundie?.totalListenTime ?? 0) + claimBonus)
      }
      return {
        xp: totalXp,
        unlockedCardsGlobal: totalUnlockedGlobal,
        unlockedCardsForNote: noteUnlocks,
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
      const allPhases = deckForPhases
        ? await ctx.db.teardropPhase.findMany({
            where: { deckId: deckForPhases.id },
            orderBy: { unlockOrder: 'asc' },
            select: { slug: true, titlePl: true, titleEn: true, unlockOrder: true },
          })
        : []

      if (!input.playerId) {
        const ordered = sortedByPhaseOrder(cards, {})
        return { cards: ordered.slice(0, 1), totalCards, phases: allPhases }
      }
      const playerId = input.playerId

      const { visibleIds, phaseOrderBySlug } = await ctx.db.$transaction(async (tx) => {
        const soundie = await tx.soundie.findUnique({
          where: { playerId_noteId: { playerId, noteId: input.noteId } },
          select: { totalListenTime: true },
        })
        const totalListenTime = soundie?.totalListenTime ?? 0
        const baseCount = unlockedTeardropCount(totalListenTime)
        const claimBonus = await tx.dailyClaim.count({
          where: { playerId, noteId: input.noteId },
        })
        const targetCount = Math.min(totalCards, baseCount + claimBonus)

        const deck = await tx.teardropDeck.findUnique({
          where: { slug: TEARDROP_DECK_SLUG },
          select: { id: true },
        })
        const phases = deck
          ? await tx.teardropPhase.findMany({
              where: { deckId: deck.id },
              select: { slug: true, unlockOrder: true, xpPerUnlock: true },
            })
          : []
        const phaseOrderBySlug = Object.fromEntries(phases.map((p) => [p.slug, p.unlockOrder]))
        const phaseXpBySlug = Object.fromEntries(phases.map((p) => [p.slug, p.xpPerUnlock]))

        const orderedCards = sortedByPhaseOrder(cards, phaseOrderBySlug)
        const existingUnlocks = await tx.teardropCardUnlock.findMany({
          where: { playerId, noteId: input.noteId },
          select: { cardId: true },
        })
        const unlockedSet = new Set(existingUnlocks.map((u) => u.cardId))
        const needToUnlock = Math.max(0, targetCount - unlockedSet.size)

        if (needToUnlock > 0) {
          const toUnlock = orderedCards
            .filter((c) => !unlockedSet.has(c.id))
            .slice(0, needToUnlock)
          for (const card of toUnlock) {
            const phaseSlug = card.phase ?? 'archetypes'
            const xpAwarded = phaseXpBySlug[phaseSlug] ?? 10
            try {
              await tx.teardropCardUnlock.create({
                data: {
                  playerId,
                  noteId: input.noteId,
                  cardId: card.id,
                  phase: phaseSlug,
                  phaseOrder: card.phaseOrder,
                  xpAwarded,
                },
              })
              await tx.teardropProgress.upsert({
                where: { playerId },
                create: { playerId, xp: xpAwarded, unlockedCards: 1 },
                update: { xp: { increment: xpAwarded }, unlockedCards: { increment: 1 } },
              })
              unlockedSet.add(card.id)
            } catch (error) {
              if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
              ) {
                unlockedSet.add(card.id)
                continue
              }
              throw error
            }
          }
        }

        const visibleIds = new Set(orderedCards.slice(0, targetCount).map((c) => c.id))
        return { visibleIds, phaseOrderBySlug }
      })

      const ordered = sortedByPhaseOrder(cards, phaseOrderBySlug)
      const visibleCards = ordered.filter((card) => visibleIds.has(card.id))
      return { cards: visibleCards, totalCards, phases: allPhases }
    }),
})

