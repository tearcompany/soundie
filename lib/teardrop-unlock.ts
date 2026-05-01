import type { Prisma } from '@prisma/client'
import { Prisma as PrismaNamespace } from '@prisma/client'
import { MAX_LORE_FRAGMENTS } from '@/lib/progress'
import {
  countTeardropCardsAllowedByPhaseOrder,
  maxTeardropPhaseUnlockOrderForCalendar,
  resolveTeardropAnchorDayString,
} from '@/lib/teardrop-phase-calendar'

export const TEARDROP_DECK_SLUG = 'teardrop-oracle-deck-v0'

/** Pozostaje dla lore (slajdy / copy); Teardrop karty są odblokowywane kalendarzem faz. */
export function unlockedTeardropCount(loreUnlocked: number): number {
  return Math.max(0, Math.min(MAX_LORE_FRAGMENTS, loreUnlocked))
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
  /** Dzień kalendarza użytkownika `YYYY-MM-DD` (jak `DailyVisit.visitDate`). */
  calendarTodayYyyyMmDd: string,
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

  const anchorDay = await resolveTeardropAnchorDayString(tx, playerId)
  const maxPhaseDeckOrder = maxTeardropPhaseUnlockOrderForCalendar(anchorDay, calendarTodayYyyyMmDd)
  const slotsForToday = countTeardropCardsAllowedByPhaseOrder(
    orderedCards,
    phaseOrderBySlug,
    maxPhaseDeckOrder,
  )
  const targetCount = Math.min(totalCards, slotsForToday)

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
      await (tx as Prisma.TransactionClient & {
        teardropXpEvent: { create: (args: { data: { playerId: string; noteId: string; source: 'teardrop_unlock'; amount: number } }) => Promise<unknown> }
      }).teardropXpEvent.create({
        data: {
          playerId,
          noteId,
          source: 'teardrop_unlock',
          amount: xpAwarded,
        },
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
