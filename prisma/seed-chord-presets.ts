import type { PrismaClient } from '@prisma/client'
import {
  ARCHETYPE_CHORD_SEEDS,
  archetypeSeedToDisplay,
  qualityForArchetypeChord,
} from '../lib/chord-archetype-presets'
import { CHORD_PRESETS, EXPECTED_DYAD_COUNT } from '../lib/chord-presets'

export async function seedChordPresets(prisma: PrismaClient) {
  console.log('[seed] chord presets …')
  const dyads = CHORD_PRESETS.filter((p) => p.noteIds.length === 2)
  const multi = CHORD_PRESETS.filter((p) => p.noteIds.length > 2)
  if (dyads.length !== EXPECTED_DYAD_COUNT) {
    throw new Error(`[seed] expected ${EXPECTED_DYAD_COUNT} dyads, got ${dyads.length}`)
  }
  console.log(
    `[seed] chord presets (notes): ${dyads.length} dyads + ${multi.length} triads/tetrads = ${CHORD_PRESETS.length} total`,
  )

  let upserted = 0

  for (const p of CHORD_PRESETS) {
    await prisma.chordPreset.upsert({
      where: { id: p.id },
      update: {
        noteKey: p.noteKey,
        noteIds: p.noteIds,
        archetypes: [],
        category: null,
        intent: null,
        namePl: p.namePl,
        nameEn: p.nameEn,
        descriptionPl: p.descriptionPl,
        descriptionEn: p.descriptionEn,
        quality: p.quality,
      },
      create: {
        id: p.id,
        noteKey: p.noteKey,
        noteIds: p.noteIds,
        archetypes: [],
        category: null,
        intent: null,
        namePl: p.namePl,
        nameEn: p.nameEn,
        descriptionPl: p.descriptionPl,
        descriptionEn: p.descriptionEn,
        quality: p.quality,
      },
    })
    upserted++
  }

  console.log(`[seed] chord presets (archetypes): ${ARCHETYPE_CHORD_SEEDS.length} systemic chords`)
  for (const s of ARCHETYPE_CHORD_SEEDS) {
    const noteKey = `arc:${s.id}`
    const pl = archetypeSeedToDisplay(s, 'pl')
    const en = archetypeSeedToDisplay(s, 'en')
    const noteIds = s.noteIds ?? []
    const quality = qualityForArchetypeChord(s)
    await prisma.chordPreset.upsert({
      where: { id: s.id },
      update: {
        noteKey,
        noteIds,
        archetypes: s.archetypes,
        category: s.category,
        intent: s.intent,
        namePl: pl.name,
        nameEn: en.name,
        descriptionPl: s.captionPl,
        descriptionEn: s.captionEn,
        quality,
      },
      create: {
        id: s.id,
        noteKey,
        noteIds,
        archetypes: s.archetypes,
        category: s.category,
        intent: s.intent,
        namePl: pl.name,
        nameEn: en.name,
        descriptionPl: s.captionPl,
        descriptionEn: s.captionEn,
        quality,
      },
    })
    upserted++
  }

  // Usuń przestarzałe rekordy archetypowe, których id już nie ma w seedzie.
  const currentIds = new Set(ARCHETYPE_CHORD_SEEDS.map((s) => s.id))
  const obsoleteArcIds = ['flow_release'] // id zmienione na flow_reset
  for (const obsoleteId of obsoleteArcIds) {
    if (!currentIds.has(obsoleteId)) {
      await prisma.chordPreset.deleteMany({ where: { id: obsoleteId } })
      console.log(`[seed] chord presets: removed obsolete arc preset '${obsoleteId}'`)
    }
  }

  console.log(`[seed] chord presets: ${upserted} rows upserted`)
}
