export const MAX_LEVEL = 5
export const MAX_LORE_FRAGMENTS = 5
export const LEVEL_SECONDS_PER_STEP = 600

export const LORE_THRESHOLDS_MINUTES = [0, 15, 30, 60, 120] as const

export type LoreUnlockStatus = {
  unlockedFragments: number
  maxFragments: number
  secondsPerFragment: number
  secondsToNextUnlock: number
  nextUnlockAtSeconds: number | null
  progressWithinCurrentFragmentPercent: number
}

export function levelFromTotalListenSeconds(totalSeconds: number) {
  return Math.min(MAX_LEVEL, Math.floor(totalSeconds / LEVEL_SECONDS_PER_STEP) + 1)
}

export function loreUnlockedCountFromTotalSeconds(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  return Math.min(
    MAX_LORE_FRAGMENTS,
    LORE_THRESHOLDS_MINUTES.filter((t) => m >= t).length
  )
}

export function loreUnlockedCountFromTotalMinutes(totalMinutes: number) {
  return loreUnlockedCountFromTotalSeconds(totalMinutes * 60)
}

export const loreUnlockedFromTotalListenSeconds = loreUnlockedCountFromTotalSeconds

export function getNewlyUnlockedLoreFragmentIndices(
  previousLoreUnlocked: number,
  newLoreUnlocked: number
) {
  if (newLoreUnlocked <= previousLoreUnlocked) return [] as number[]
  const out: number[] = []
  for (let i = previousLoreUnlocked + 1; i <= newLoreUnlocked; i++) out.push(i)
  return out
}

export function calcProgressToNextFragment(totalMinutes: number) {
  for (let i = 0; i < LORE_THRESHOLDS_MINUTES.length - 1; i++) {
    const current = LORE_THRESHOLDS_MINUTES[i]!
    const next = LORE_THRESHOLDS_MINUTES[i + 1]!
    if (totalMinutes < next) {
      const percent = Math.round(((totalMinutes - current) / (next - current)) * 100)
      return { current, next, percent: Math.min(100, Math.max(0, percent)) }
    }
  }
  return { current: 120, next: null, percent: 100 }
}

export function minutesRequiredForLoreSlideIndexZeroBased(index: number) {
  return LORE_THRESHOLDS_MINUTES[Math.max(0, Math.min(4, index))] ?? 120
}

export function loreUnlockStatusFromTotalListenSeconds(
  totalSeconds: number
): LoreUnlockStatus {
  const totalMinutes = Math.floor(totalSeconds / 60)
  const unlockedFragments = loreUnlockedCountFromTotalSeconds(totalSeconds)
  const p = calcProgressToNextFragment(totalMinutes)

  let nextUnlockAtSeconds: number | null
  if (unlockedFragments >= MAX_LORE_FRAGMENTS) {
    nextUnlockAtSeconds = null
  } else {
    const nextM = p.next
    if (nextM == null) {
      nextUnlockAtSeconds = null
    } else {
      nextUnlockAtSeconds = nextM * 60
    }
  }

  let secondsToNextUnlock = 0
  if (unlockedFragments < MAX_LORE_FRAGMENTS && p.next != null) {
    const target = p.next * 60
    secondsToNextUnlock = Math.max(0, target - totalSeconds)
  }

  const segmentMins = p.next != null ? p.next - p.current : 1
  const averageSegmentSeconds = Math.max(1, segmentMins) * 60

  return {
    unlockedFragments,
    maxFragments: MAX_LORE_FRAGMENTS,
    secondsPerFragment: averageSegmentSeconds,
    secondsToNextUnlock,
    nextUnlockAtSeconds,
    progressWithinCurrentFragmentPercent: p.percent,
  }
}
