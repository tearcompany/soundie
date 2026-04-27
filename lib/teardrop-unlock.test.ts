import { describe, it, expect, vi } from 'vitest'
import {
  applyTeardropUnlocksAfterSession,
  FIRST_TEARDROP_UNLOCK_TOTAL_LISTEN_SECONDS,
  sortedByPhaseOrder,
  unlockedTeardropCount,
} from '@/lib/teardrop-unlock'

describe('unlockedTeardropCount', () => {
  it('returns 0 below first unlock threshold', () => {
    expect(unlockedTeardropCount(0)).toBe(0)
    expect(unlockedTeardropCount(FIRST_TEARDROP_UNLOCK_TOTAL_LISTEN_SECONDS - 1)).toBe(0)
  })

  it('returns at least one slot at threshold', () => {
    expect(unlockedTeardropCount(FIRST_TEARDROP_UNLOCK_TOTAL_LISTEN_SECONDS)).toBeGreaterThanOrEqual(1)
  })

  it('scales with additional hour buckets after threshold', () => {
    expect(unlockedTeardropCount(3600)).toBeGreaterThan(unlockedTeardropCount(FIRST_TEARDROP_UNLOCK_TOTAL_LISTEN_SECONDS))
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
  it('does not create unlocks when listen total is below threshold', async () => {
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
      dailyClaim: { count: vi.fn().mockResolvedValue(0) },
      teardropCardUnlock: {
        findMany: vi.fn().mockResolvedValue([]),
        create: unlockCreate,
      },
      teardropProgress: { upsert: vi.fn() },
    }
    await applyTeardropUnlocksAfterSession(tx as never, 'player1', 'note1', 100)
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
      dailyClaim: { count: vi.fn().mockResolvedValue(0) },
      teardropCardUnlock: {
        findMany: vi.fn().mockResolvedValue([]),
        create: unlockCreate,
      },
      teardropProgress: { upsert },
    }
    await applyTeardropUnlocksAfterSession(
      tx as never,
      'player1',
      'note1',
      FIRST_TEARDROP_UNLOCK_TOTAL_LISTEN_SECONDS
    )
    expect(unlockCreate).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})
