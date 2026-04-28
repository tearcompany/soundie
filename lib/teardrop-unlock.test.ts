import { describe, it, expect, vi } from 'vitest'
import {
  applyTeardropUnlocksAfterSession,
  sortedByPhaseOrder,
  unlockedTeardropCount,
} from '@/lib/teardrop-unlock'

describe('unlockedTeardropCount', () => {
  it('returns 0 when no lore fragments are unlocked', () => {
    expect(unlockedTeardropCount(0)).toBe(0)
  })

  it('returns one card per unlocked lore fragment', () => {
    expect(unlockedTeardropCount(1)).toBe(1)
    expect(unlockedTeardropCount(3)).toBe(3)
  })

  it('caps at five cards', () => {
    expect(unlockedTeardropCount(6)).toBe(5)
  })
})

describe('sortedByPhaseOrder', () => {
  it('orders by phase unlock order then phaseOrder', () => {
    const phaseOrderBySlug = { alpha: 1, beta: 2 }
    const items = [
      { id: 'b', phase: 'beta', phaseOrder: 1 },
      { id: 'a', phase: 'alpha', phaseOrder: 2 },
      { id: 'c', phase: 'alpha', phaseOrder: 1 },
    ]
    const sorted = sortedByPhaseOrder(items, phaseOrderBySlug)
    expect(sorted.map((x) => x.id)).toEqual(['c', 'a', 'b'])
  })
})

describe('applyTeardropUnlocksAfterSession', () => {
  it('does not create unlocks when no lore fragments are unlocked', async () => {
    const unlockCreate = vi.fn()
    const tx = {
      noteTeardropCard: {
        findMany: vi.fn().mockResolvedValue([
          {
            card: {
              id: 'card1',
              phase: 'p1',
              phaseOrder: 1,
            },
          },
        ]),
      },
      teardropDeck: {
        findUnique: vi.fn().mockResolvedValue({ id: 'deck1' }),
      },
      teardropPhase: {
        findMany: vi.fn().mockResolvedValue([
          { slug: 'p1', unlockOrder: 1, xpPerUnlock: 10 },
        ]),
      },
      teardropCardUnlock: {
        findMany: vi.fn().mockResolvedValue([]),
        create: unlockCreate,
      },
      teardropXpEvent: { create: vi.fn() },
      teardropProgress: { upsert: vi.fn() },
    }
    await applyTeardropUnlocksAfterSession(tx as never, 'player1', 'note1', 0)
    expect(unlockCreate).not.toHaveBeenCalled()
  })

  it('creates unlock rows when threshold met and slots remain', async () => {
    const unlockCreate = vi.fn().mockResolvedValue({})
    const upsert = vi.fn().mockResolvedValue({})
    const tx = {
      noteTeardropCard: {
        findMany: vi.fn().mockResolvedValue([
          {
            card: {
              id: 'card1',
              phase: 'p1',
              phaseOrder: 1,
            },
          },
        ]),
      },
      teardropDeck: {
        findUnique: vi.fn().mockResolvedValue({ id: 'deck1' }),
      },
      teardropPhase: {
        findMany: vi.fn().mockResolvedValue([
          { slug: 'p1', unlockOrder: 1, xpPerUnlock: 12 },
        ]),
      },
      teardropCardUnlock: {
        findMany: vi.fn().mockResolvedValue([]),
        create: unlockCreate,
      },
      teardropXpEvent: { create: vi.fn() },
      teardropProgress: { upsert },
    }
    await applyTeardropUnlocksAfterSession(tx as never, 'player1', 'note1', 1)
    expect(unlockCreate).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})
