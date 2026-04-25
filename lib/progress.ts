export const MAX_LEVEL = 5
export const MAX_LORE_FRAGMENTS = 5
export const LEVEL_SECONDS_PER_STEP = 600
export const LORE_SECONDS_PER_FRAGMENT = 900

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

export function loreUnlockedFromTotalListenSeconds(totalSeconds: number) {
  return Math.min(MAX_LORE_FRAGMENTS, Math.floor(totalSeconds / LORE_SECONDS_PER_FRAGMENT))
}

export function secondsRequiredForLoreFragment(fragmentIndexOneBased: number) {
  return Math.max(1, fragmentIndexOneBased) * LORE_SECONDS_PER_FRAGMENT
}

export function secondsToNextLoreUnlock(totalSeconds: number) {
  const unlocked = loreUnlockedFromTotalListenSeconds(totalSeconds)
  if (unlocked >= MAX_LORE_FRAGMENTS) return 0
  const required = secondsRequiredForLoreFragment(unlocked + 1)
  return Math.max(0, required - totalSeconds)
}

export function loreUnlockStatusFromTotalListenSeconds(
  totalSeconds: number
): LoreUnlockStatus {
  const unlockedFragments = loreUnlockedFromTotalListenSeconds(totalSeconds)
  const secondsToNextUnlock = secondsToNextLoreUnlock(totalSeconds)
  const nextUnlockAtSeconds =
    unlockedFragments >= MAX_LORE_FRAGMENTS
      ? null
      : secondsRequiredForLoreFragment(unlockedFragments + 1)
  const progressWithinCurrentFragmentPercent =
    unlockedFragments >= MAX_LORE_FRAGMENTS
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            ((totalSeconds - unlockedFragments * LORE_SECONDS_PER_FRAGMENT) /
              LORE_SECONDS_PER_FRAGMENT) *
              100
          )
        )

  return {
    unlockedFragments,
    maxFragments: MAX_LORE_FRAGMENTS,
    secondsPerFragment: LORE_SECONDS_PER_FRAGMENT,
    secondsToNextUnlock,
    nextUnlockAtSeconds,
    progressWithinCurrentFragmentPercent,
  }
}
