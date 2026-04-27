export const TEARDROP_VESSEL_BOOK_PRIMARY_SLUG = {
  C: 'the-vessel',
  'C#': 'the-echo',
  D: 'the-path',
  'D#': 'the-seed',
  E: 'the-lightkeeper',
  F: 'the-spiral',
  'F#': 'the-watcher',
  G: 'the-wave',
  'G#': 'the-pulse',
  B: 'the-return',
} as const

const VESSEL_BOOK_SLUGS = new Set<string>(
  Object.values(TEARDROP_VESSEL_BOOK_PRIMARY_SLUG) as string[],
)

export function getTeardropVesselBookPrimarySlug(
  noteId: string,
): string | null {
  return (
    (TEARDROP_VESSEL_BOOK_PRIMARY_SLUG as Record<string, string | undefined>)[
      noteId
    ] ?? null
  )
}

export function isTeardropVesselBookCardSlug(slug: string): boolean {
  return VESSEL_BOOK_SLUGS.has(slug)
}
