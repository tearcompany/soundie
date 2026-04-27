import type { Prisma } from '@prisma/client'
import { Prisma as PrismaNamespace } from '@prisma/client'

export const TEARDROP_DECK_SLUG = 'teardrop-oracle-deck-v0'

export const FIRST_TEARDROP_UNLOCK_TOTAL_LISTEN_SECONDS = 540

export function unlockedTeardropCount(totalListenSeconds: number): number {
  if (totalListenSeconds < FIRST_TEARDROP_UNLOCK_TOTAL_LISTEN_SECONDS) return 0
  const mins = Math.max(0, Math.floor(totalListenSeconds / 60))
  return Math.max(1, 1 + Math.floor(mins / 60))
}

export function sortedByPhaseOrder<T extends { phase: string | null; phaseOrder: number | null }>(
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

export async function applyTeardropUnlocksAfterSession(
  tx: Prisma.TransactionClient,
  playerId: string,
  noteId: string,
  totalListenSeconds: number
) {
  const links = await tx.noteTeardropCard.findMany({
    where: { noteId },
    orderBy: { sortOrder: 'asc' },
    include: { card: true },
  })
  const totalCards = links.length
  if (totalCards === 0) return

  const deck = await tx.teardropDeck.findUnique({
    where: { slug: TEARDROP_DECK_SLUG },
    select: { id: true },
  })
  if (!deck) return

  const phases = await tx.teardropPhase.findMany({
    where: { deckId: deck.id },
    orderBy: { unlockOrder: 'asc' },
    select: { slug: true, unlockOrder: true, xpPerUnlock: true },
  })
  const phaseOrderBySlug = Object.fromEntries(phases.map((p) => [p.slug, p.unlockOrder]))
  const phaseXpBySlug = Object.fromEntries(phases.map((p) => [p.slug, p.xpPerUnlock]))

  const cards = links.map((l) => l.card).filter(Boolean) as NonNullable<(typeof links)[number]['card']>[]
  const orderedCards = sortedByPhaseOrder(cards, phaseOrderBySlug)

  const claimBonus = await tx.dailyClaim.count({
    where: { playerId, noteId },
  })
  const targetCount = Math.min(totalCards, unlockedTeardropCount(totalListenSeconds) + claimBonus)

  const existingUnlocks = await tx.teardropCardUnlock.findMany({
    where: { playerId, noteId },
    select: { cardId: true },
  })
  const unlockedSet = new Set(existingUnlocks.map((u) => u.cardId))
  const needToUnlock = Math.max(0, targetCount - unlockedSet.size)

  if (needToUnlock <= 0) return

  const toUnlock = orderedCards.filter((c) => !unlockedSet.has(c.id)).slice(0, needToUnlock)
  for (const card of toUnlock) {
    const phaseSlug = card.phase ?? 'archetypes'
    const xpAwarded = phaseXpBySlug[phaseSlug] ?? 10
    try {
      await tx.teardropCardUnlock.create({
        data: {
          playerId,
          noteId,
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
        error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        unlockedSet.add(card.id)
        continue
      }
      throw error
    }
  }
}
