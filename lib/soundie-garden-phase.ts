import { MAX_LORE_FRAGMENTS } from '@/lib/progress'

export const GARDEN_PHASES = [
  'sleeping',
  'discovered',
  'bonded',
  'awakened',
  'mastered',
] as const

export type GardenPhase = (typeof GARDEN_PHASES)[number]

export function gardenPhaseForSoundie(row: {
  totalListenTime: number
  loreUnlocked: number
}): GardenPhase {
  const sec = row.totalListenTime
  const lore = row.loreUnlocked
  if (sec === 0) return 'sleeping'
  if (lore >= MAX_LORE_FRAGMENTS) return 'mastered'
  if (lore >= 3) return 'awakened'
  if (lore >= 1) return 'bonded'
  return 'discovered'
}
