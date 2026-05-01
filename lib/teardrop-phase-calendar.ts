import type { Prisma } from '@prisma/client'
import {
  differenceCalendarDaysYyyyMmDd,
  utcCalendarDayString,
} from '@/lib/calendar-day'

/** Pięć faz Talii (TeardropPhase.unlockOrder po seedzie): 1 roots … 5 archetypes */
export const TEARDROP_VISIBLE_PHASE_ORDER_MAX = 5

/**
 * Kotwiczny dzień drogi — pierwszy `DailyVisit` gracza, inaczej pierwszy dzień UTC
 * utworzenia profilu.
 */
export async function resolveTeardropAnchorDayString(
  tx: Prisma.TransactionClient,
  playerId: string,
): Promise<string> {
  const firstVisit = await tx.dailyVisit.findFirst({
    where: { playerId },
    orderBy: { visitDate: 'asc' },
    select: { visitDate: true },
  })
  if (firstVisit?.visitDate) return firstVisit.visitDate

  const player = await tx.player.findUnique({
    where: { id: playerId },
    select: { createdAt: true },
  })
  return player?.createdAt ? utcCalendarDayString(player.createdAt) : utcCalendarDayString()
}

/** Fazy o `unlockOrder` ≤ tej wartości są tego dnia dozwolone (1 pierwszego dnia, +1 na każdy kolejny dzień, max 5). */
export function maxTeardropPhaseUnlockOrderForCalendar(
  anchorYyyyMmDd: string,
  todayYyyyMmDd: string,
): number {
  const elapsedDays = differenceCalendarDaysYyyyMmDd(todayYyyyMmDd, anchorYyyyMmDd)
  return Math.min(TEARDROP_VISIBLE_PHASE_ORDER_MAX, 1 + elapsedDays)
}

/**
 * Dowolna karta, której faza miesci się w dopuszczalnym kolejność-faz zakresie —
 * dla sortowania listy kart na nucie wg `sortedByPhaseOrder`.
 */
export function countTeardropCardsAllowedByPhaseOrder<T extends { phase: string | null }>(
  sortedCards: T[],
  phaseDeckOrderBySlug: Record<string, number>,
  maxDeckPhaseOrderInclusive: number,
): number {
  let n = 0
  for (const card of sortedCards) {
    const slug = card.phase ?? 'archetypes'
    const deckOrder = phaseDeckOrderBySlug[slug]
    const orderRank = typeof deckOrder === 'number' ? deckOrder : 99
    if (orderRank <= maxDeckPhaseOrderInclusive) n += 1
  }
  return n
}
