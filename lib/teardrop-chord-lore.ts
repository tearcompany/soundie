import teardropCardTextsEn from '@/data/teardrop-card-texts-en.json'
import teardropCardTextsPl from '@/data/teardrop-card-texts-pl.json'
import { NOTE_TEARDROP_PLAYLIST } from '@/lib/teardrop-note-playlist'

type CardBlock = {
  meaningUpright?: string
  meaningShadow?: string
}

/** Same ordering as `toNoteKey` / chord presets — first id → first Teardrop card on that note’s path (seed). */
export function primaryTeardropSlugForChordNotes(noteIds: string[]): string | null {
  if (noteIds.length === 0) return null
  const root = [...noteIds].sort()[0]!
  return NOTE_TEARDROP_PLAYLIST[root]?.[0] ?? null
}

export function getTeardropLightShadowForSlug(
  slug: string,
  locale: 'en' | 'pl',
): { light: string; shadow: string } | null {
  const table = (locale === 'pl' ? teardropCardTextsPl : teardropCardTextsEn) as Record<
    string,
    CardBlock
  >
  const row = table[slug]
  const light = row?.meaningUpright?.trim()
  const shadow = row?.meaningShadow?.trim()
  if (!light || !shadow) return null
  return { light, shadow }
}

/** Teardrop “in the light” / “in the shadow” copy for the chord’s root note’s first path card. */
export function getTeardropLoreForChordNotes(
  noteIds: string[],
  locale: 'en' | 'pl',
): { slug: string; light: string; shadow: string } | null {
  const slug = primaryTeardropSlugForChordNotes(noteIds)
  if (!slug) return null
  const pair = getTeardropLightShadowForSlug(slug, locale)
  if (!pair) return null
  return { slug, ...pair }
}
