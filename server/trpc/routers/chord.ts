import { z } from 'zod'
import { router, publicProcedure } from '../init'
import {
  ARCHETYPE_CHORD_SEEDS,
  ARCHETYPE_NOTE_MAP,
  getArchetypeDyadByNotes,
  getArchetypeDyadByIntent,
} from '@/lib/chord-archetype-presets'
import { toNoteKey, CHORD_PRESETS } from '@/lib/chord-presets'

export const chordRouter = router({
  /**
   * Return all chord presets (for browsing / discovery UI).
   */
  list: publicProcedure
    .input(z.object({ locale: z.enum(['en', 'pl']).default('pl') }).optional())
    .query(async ({ ctx }) => {
      const presets = await ctx.db.chordPreset.findMany({
        orderBy: { noteKey: 'asc' },
      })
      return presets
    }),

  /**
   * Look up a preset for an exact combination of note IDs.
   * Returns null when the combination has no named preset yet.
   */
  getByNotes: publicProcedure
    .input(z.object({ noteIds: z.array(z.string()).min(2).max(5) }))
    .query(async ({ ctx, input }) => {
      const noteKey = toNoteKey(input.noteIds)
      const preset = await ctx.db.chordPreset.findUnique({
        where: { noteKey },
      })
      return preset ?? null
    }),

  /**
   * Lookup multiple note combinations at once (for sequencer autocomplete).
   * Given a partial chord (1–4 notes), return all presets whose noteIds
   * are a superset of the current selection. Useful for "suggested next note".
   */
  getSuggestions: publicProcedure
    .input(z.object({ noteIds: z.array(z.string()).min(1).max(4) }))
    .query(async ({ ctx, input }) => {
      const selected = new Set(input.noteIds)

      // All presets that contain every currently-selected note
      const presets = await ctx.db.chordPreset.findMany({
        orderBy: { noteKey: 'asc' },
      })

      return presets.filter((p) => {
        // preset must include all currently selected notes
        const pSet = new Set(p.noteIds)
        for (const id of selected) {
          if (!pSet.has(id)) return false
        }
        // and have at least one additional note (to suggest adding)
        return p.noteIds.length > selected.size
      })
    }),

  /**
   * Static list directly from lib (no DB round-trip).
   * Useful for offline / SSR situations.
   */
  listStatic: publicProcedure.query(() => CHORD_PRESETS),

  /**
   * Lista wszystkich seedów archetypowych (statyczna, z lib).
   */
  archetypesStatic: publicProcedure.query(() =>
    ARCHETYPE_CHORD_SEEDS.map((s) => ({
      id: s.id,
      archetypes: s.archetypes,
      category: s.category,
      intent: s.intent,
      noteIds: s.noteIds ?? [],
    })),
  ),

  /**
   * Deterministyczna mapa archetyp → nuta.
   * Używana przez AI / generator sesji.
   */
  archetypeNoteMap: publicProcedure.query(() => ARCHETYPE_NOTE_MAP),

  /**
   * Po noteIds (2 nuty) → dyada archetypowa (lub null).
   * Sekwencer: user wybiera nuty → system sugeruje rytuał.
   */
  archetypeDyadByNotes: publicProcedure
    .input(z.object({ noteIds: z.array(z.string()).length(2) }))
    .query(({ input }) => getArchetypeDyadByNotes(input.noteIds) ?? null),

  /**
   * Po intent → pierwsza pasująca dyada (lub null).
   * AI: intent: 'release' → noteIds: ['B','D'] → sesja.
   */
  archetypeDyadByIntent: publicProcedure
    .input(z.object({ intent: z.string() }))
    .query(({ input }) => getArchetypeDyadByIntent(input.intent) ?? null),
})
