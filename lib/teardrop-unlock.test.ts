import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  const anchorVisit = vi.fn()
  const playerBackup = vi.fn()

  beforeEach(() => {
    anchorVisit.mockReset()
    anchorVisit.mockResolvedValue({ visitDate: '2026-05-01' })
    playerBackup.mockReset()
  })

  function baseTx(overrides: Record<string, unknown> = {}) {
    return {
      dailyVisit: { findFirst: anchorVisit },
      player: { findUnique: playerBackup },
      noteTeardropCard: { findMany: vi.fn().mockResolvedValue([]) },
      teardropDeck: { findUnique: vi.fn().mockResolvedValue({ id: 'deck1' }) },
      teardropPhase: {
        findMany: vi.fn().mockResolvedValue([
          { slug: 'roots', unlockOrder: 1, xpPerUnlock: 10 },
          { slug: 'flow', unlockOrder: 2, xpPerUnlock: 10 },
        ]),
      },
      teardropCardUnlock: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
      },
      teardropXpEvent: { create: vi.fn() },
      teardropProgress: { upsert: vi.fn() },
      ...overrides,
    }
  }

  it('does not unlock when earliest allowed phase excludes card phase', async () => {
    const unlockCreate = vi.fn()
    const tx = baseTx({
      noteTeardropCard: {
        findMany: vi.fn().mockResolvedValue([
          {
            card: {
              id: 'c1',
              phase: 'flow',
              phaseOrder: 1,
            },
          },
        ]),
      },
      teardropCardUnlock: { findMany: vi.fn().mockResolvedValue([]), create: unlockCreate },
    })
    await applyTeardropUnlocksAfterSession(tx as never, 'player1', 'note1', '2026-05-01')
    expect(unlockCreate).not.toHaveBeenCalled()
  })

  it('creates unlock when card lies in phases allowed today', async () => {
    const unlockCreate = vi.fn().mockResolvedValue({})
    const upsert = vi.fn().mockResolvedValue({})
    const tx = baseTx({
      noteTeardropCard: {
        findMany: vi.fn().mockResolvedValue([
          {
            card: {
              id: 'card1',
              phase: 'roots',
              phaseOrder: 1,
            },
          },
        ]),
      },
      teardropCardUnlock: { findMany: vi.fn().mockResolvedValue([]), create: unlockCreate },
      teardropProgress: { upsert },
    })
    await applyTeardropUnlocksAfterSession(tx as never, 'player1', 'note1', '2026-05-04')
    expect(unlockCreate).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledTimes(1)
  })
})
