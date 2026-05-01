/**
 * Chord Presets — named combinations of Soundie notes.
 *
 * - **Dyads (2 notes):** all C(12,2) = 66 pairs are generated; hand-crafted
 *   entries override the default title/copy for that pair.
 * - **Triads / tetrads:** only the curated list below.
 *
 * The `noteKey` is the sorted note IDs joined by `+` — e.g. "C+E+G".
 */

import { NOTE_LIST, getNoteById } from '@/lib/notes'

export type ChordPresetDef = {
  /** Unique stable identifier */
  id: string
  /** Sorted note IDs joined by '+', e.g. "C+E+G" */
  noteKey: string
  /** Sorted array of note IDs */
  noteIds: string[]
  namePl: string
  nameEn: string
  descriptionPl: string
  descriptionEn: string
  /** Emotional quality — maps to healingStyle vocabulary */
  quality: string
}

/** Return a canonical noteKey from any order of note IDs */
export function toNoteKey(noteIds: string[]): string {
  return [...noteIds].sort().join('+')
}

/** All unordered 2-note pairs (66 for 12 chromatic notes). */
export const EXPECTED_DYAD_COUNT = (NOTE_LIST.length * (NOTE_LIST.length - 1)) / 2

function dyadPresetIdFromNoteKey(noteKey: string): string {
  return `dyad_${noteKey.replace(/#/g, 's').replace(/\+/g, '_')}`
}

function generateDyadPreset(ida: string, idb: string): ChordPresetDef {
  const na = getNoteById(ida)
  const nb = getNoteById(idb)
  if (!na || !nb) {
    throw new Error(`[chord-presets] unknown note in dyad: ${ida}, ${idb}`)
  }
  const noteKey = toNoteKey([ida, idb])
  const noteIds = noteKey.split('+') as string[]
  const quality = na.healingStyle ?? nb.healingStyle ?? 'grounding'
  return {
    id: dyadPresetIdFromNoteKey(noteKey),
    noteKey,
    noteIds,
    namePl: `${na.synestheticTitlePl} · ${nb.synestheticTitlePl}`,
    nameEn: `${na.name} · ${nb.name}`,
    descriptionPl: `${na.synestheticTitlePl} — ${nb.synestheticTitlePl}. Jedna chwila, dwa głosy.`,
    descriptionEn: `${na.name} — ${nb.name}. One moment, two presences.`,
    quality,
  }
}

// ── Hand-crafted presets (dyads that override generation + all triads/tetrads) ─

const CHORD_PRESETS_HANDCRAFTED: ChordPresetDef[] = [
  // ── Dyads ────────────────────────────────────────────────────────────────

  {
    id: 'c_e',
    noteKey: 'C+E',
    noteIds: ['C', 'E'],
    namePl: 'Spokojny Ogród',
    nameEn: 'The Still Garden',
    descriptionPl: 'Fundament spotyka rozkwit. Lęk i wstyd rozpoznają w sobie ziemię, z której mogą wyrosnąć.',
    descriptionEn: 'Foundation meets bloom. Anxiety and shame find in each other the ground from which they may grow.',
    quality: 'grounding',
  },
  {
    id: 'c_g',
    noteKey: 'C+G',
    noteIds: ['C', 'G'],
    namePl: 'Głęboki Nurt',
    nameEn: 'The Deep Current',
    descriptionPl: 'Korzenie przepływają w rzekę. Stara cisza, która wie, gdzie zmierza.',
    descriptionEn: 'Roots flow into river. An ancient stillness that knows where it is going.',
    quality: 'channeling',
  },
  {
    id: 'c_a',
    noteKey: 'C+A',
    noteIds: ['C', 'A'],
    namePl: 'Zakorzenione Serce',
    nameEn: 'The Anchored Heart',
    descriptionPl: 'Grunt daje sercu miejsce, by wiedziało, gdzie jest. Orientacja bez dryfowania.',
    descriptionEn: 'Ground gives the heart a place to know where it is. Orientation without drifting.',
    quality: 'orienting',
  },
  {
    id: 'e_a',
    noteKey: 'A+E',
    noteIds: ['A', 'E'],
    namePl: 'Ciepły Kompas',
    nameEn: 'The Warm Compass',
    descriptionPl: 'Rozkwit i serce — przywracanie godności spotyka poczucie kierunku. Ciepłe, jasne, pewne.',
    descriptionEn: 'Bloom meets heart — restoring dignity meets knowing direction. Warm, clear, certain.',
    quality: 'restoring',
  },
  {
    id: 'd_sharp_a',
    noteKey: 'A+D#',
    noteIds: ['D#', 'A'],
    namePl: 'Czuły Świadek',
    nameEn: 'The Tender Witness',
    descriptionPl: 'Iskra, która widzi smutek, i serce, które go trzyma. Ból uznany, nie rozwiązany.',
    descriptionEn: 'The spark that sees grief, and the heart that holds it. Pain acknowledged, not solved.',
    quality: 'witnessing',
  },
  {
    id: 'f_c',
    noteKey: 'C+F',
    noteIds: ['C', 'F'],
    namePl: 'Dom w Ziemi',
    nameEn: 'The Earthen Shelter',
    descriptionPl: 'Fundament i Strażnik — ochrona bez kontroli. Kiedy korzenie wiedzą, co chronić.',
    descriptionEn: 'Foundation and Keeper — protection without control. When roots know what to guard.',
    quality: 'protecting',
  },
  {
    id: 'g_d_sharp',
    noteKey: 'D#+G',
    noteIds: ['D#', 'G'],
    namePl: 'Fala Pamięci',
    nameEn: 'The Memory Wave',
    descriptionPl: 'Rzeka niesie to, co było świadkowane. Smutek przepływa, nie stoi.',
    descriptionEn: 'The river carries what was witnessed. Grief flows, it does not stand still.',
    quality: 'releasing',
  },
  {
    id: 'c_sharp_g_sharp',
    noteKey: 'C#+G#',
    noteIds: ['C#', 'G#'],
    namePl: 'Ostrze Przemiany',
    nameEn: 'Blade of Transformation',
    descriptionPl: 'Ostrze i Płomień — bolesne stawanie się. Coś kończy się, żeby coś mogło się przerodzić.',
    descriptionEn: 'Blade and Flame — painful becoming. Something ends so something else may transform.',
    quality: 'transforming',
  },
  {
    id: 'f_sharp_b',
    noteKey: 'B+F#',
    noteIds: ['F#', 'B'],
    namePl: 'Pęknięcie i Powrót',
    nameEn: 'The Fracture Returns',
    descriptionPl: 'Lustro i Korona — dysonans, który się domyka. Widzenie siebie na końcu drogi.',
    descriptionEn: 'Mirror and Crown — the dissonance that completes. Seeing oneself at the end of the path.',
    quality: 'completing',
  },
  {
    id: 'd_g',
    noteKey: 'D+G',
    noteIds: ['D', 'G'],
    namePl: 'Ruch Rzeki',
    nameEn: 'River in Motion',
    descriptionPl: 'Wędrowiec trafia na rzekę. Jeden krok wystarczy, a woda pamięta dokąd płynąć.',
    descriptionEn: 'Wanderer finds the river. One step is enough, and the water remembers the way.',
    quality: 'activating',
  },
  {
    id: 'a_b',
    noteKey: 'A+B',
    noteIds: ['A', 'B'],
    namePl: 'Przed Progiem',
    nameEn: 'Before the Threshold',
    descriptionPl: 'Serce i Korona — orientacja na skraju zakończenia. Wiesz, gdzie jesteś, i wiesz, że to się kończy.',
    descriptionEn: 'Heart and Crown — orientation at the edge of completion. You know where you are, and you know this is ending.',
    quality: 'completing',
  },
  {
    id: 'e_f',
    noteKey: 'E+F',
    noteIds: ['E', 'F'],
    namePl: 'Chroniony Rozkwit',
    nameEn: 'The Sheltered Bloom',
    descriptionPl: 'Kiedy godność jest ochraniania, a nie wystawiona. Rozkwit w bezpiecznej przestrzeni.',
    descriptionEn: 'When dignity is sheltered, not exposed. Blooming in a safe space.',
    quality: 'protecting',
  },
  {
    id: 'g_sharp_a',
    noteKey: 'A+G#',
    noteIds: ['G#', 'A'],
    namePl: 'Cicha Przemiana',
    nameEn: 'The Quiet Transformation',
    descriptionPl: 'Płomień i Serce — kiedy wina się uwalnia i serce wraca do siebie. Bez hałasu, bez dramatów.',
    descriptionEn: 'Flame and Heart — when guilt releases and the heart returns to itself. Without noise, without drama.',
    quality: 'transforming',
  },
  {
    id: 'f_a_sharp',
    noteKey: 'A#+F',
    noteIds: ['F', 'A#'],
    namePl: 'Ochrona Burzy',
    nameEn: 'Storm and Shelter',
    descriptionPl: 'Strażnik przy granicy. Cisza chroni to, co nie może jeszcze wyjść na zewnątrz.',
    descriptionEn: 'Keeper at the threshold. Stillness shelters what cannot yet go out into the storm.',
    quality: 'softening',
  },

  // ── Triads ────────────────────────────────────────────────────────────────

  /** F major — journey spine: F → A → C (Strażnik, Serce, Fundament). */
  {
    id: 'f_major_journey_open',
    noteKey: 'A+C+F',
    noteIds: ['F', 'A', 'C'],
    namePl: 'Trójlista Drogi',
    nameEn: 'The Journey Triad',
    descriptionPl:
      'Strażnik, Serce i Fundament — pierwsza wielka harmonia ścieżki: granica, która wie, co chronić; serce, które wraca do rytmu; ziemia, która trzyma.',
    descriptionEn:
      'Keeper, Heart and Foundation — the first great harmony of the path: a boundary that knows what to shelter; a heart that finds its pulse again; earth that holds.',
    quality: 'grounding',
  },
  {
    id: 'c_e_a',
    noteKey: 'A+C+E',
    noteIds: ['C', 'E', 'A'],
    namePl: 'Triada Uzdrowiciela',
    nameEn: "The Healer's Triad",
    descriptionPl: 'Fundament, Rozkwit, Serce — trzy filary powrotu. Kiedy ziemia trzyma, godność wraca, a serce wie, gdzie jest.',
    descriptionEn: 'Foundation, Bloom, Heart — the three pillars of return. When ground holds, dignity returns, and the heart knows where it is.',
    quality: 'restoring',
  },
  {
    id: 'c_e_g',
    noteKey: 'C+E+G',
    noteIds: ['C', 'E', 'G'],
    namePl: 'Pierwsza Cisza',
    nameEn: 'The First Silence',
    descriptionPl: 'Fundament, Rozkwit i Rzeka — najstarsza harmonia. Zakorzenienie, przywracanie i przepływ razem.',
    descriptionEn: 'Foundation, Bloom and River — the oldest harmony. Grounding, restoration and flow together.',
    quality: 'grounding',
  },
  {
    id: 'c_g_a',
    noteKey: 'A+C+G',
    noteIds: ['C', 'G', 'A'],
    namePl: 'Rzeka Wie Dokąd',
    nameEn: 'The River That Knows',
    descriptionPl: 'Ziemia, Rzeka i Serce razem. Orientacja bez lęku — wiesz dokąd idziesz.',
    descriptionEn: 'Earth, River and Heart together. Orientation without fear — you know where you are going.',
    quality: 'orienting',
  },
  {
    id: 'd_sharp_g_a',
    noteKey: 'A+D#+G',
    noteIds: ['D#', 'G', 'A'],
    namePl: 'Opłakana Rzeka',
    nameEn: 'The Mourned River',
    descriptionPl: 'Świadek, Rzeka i Serce — smutek jest niesiony, nie tłumiony. Płacze i przepływa.',
    descriptionEn: 'Witness, River and Heart — grief is carried, not suppressed. It weeps and it flows.',
    quality: 'witnessing',
  },
  {
    id: 'c_sharp_g_sharp_b',
    noteKey: 'B+C#+G#',
    noteIds: ['C#', 'G#', 'B'],
    namePl: 'Łuk Zakończenia',
    nameEn: 'The Arc of Ending',
    descriptionPl: 'Ostrze, Płomień i Korona — przejście przez ogień, uwolnienie i domknięcie. Coś tu się kończy całkowicie.',
    descriptionEn: 'Blade, Flame and Crown — passage through fire, release and completion. Something here ends completely.',
    quality: 'completing',
  },
  {
    id: 'f_a_e',
    noteKey: 'A+E+F',
    noteIds: ['F', 'A', 'E'],
    namePl: 'Ciepłe Schronienie',
    nameEn: 'The Warm Sanctuary',
    descriptionPl: 'Strażnik, Serce i Rozkwit — miejsce, w którym wolno rosnąć. Chroniona przestrzeń przywracania.',
    descriptionEn: 'Keeper, Heart and Bloom — a place where growth is allowed. A sheltered space of restoration.',
    quality: 'protecting',
  },

  // ── Triads · wariacje (trzy nuty, trzy oddechy) ───────────────────────────

  {
    id: 'd_f_g',
    noteKey: 'D+F+G',
    noteIds: ['D', 'F', 'G'],
    namePl: 'Most Nad Rzeką',
    nameEn: 'The Bridge Over the River',
    descriptionPl: 'Wędrowiec, Strażnik i Rzeka — ruch, który ma brzeg. Nie musisz wiedzieć dokładnie dokąd: wystarczy, że idziesz przy wodzie.',
    descriptionEn: 'Wanderer, Keeper and River — motion that has a shore. You do not need to know exactly where: it is enough to walk beside the water.',
    quality: 'channeling',
  },
  {
    id: 'd_sharp_e_f',
    noteKey: 'D#+E+F',
    noteIds: ['D#', 'E', 'F'],
    namePl: 'Iskra Pod Skórą',
    nameEn: 'The Spark Beneath the Skin',
    descriptionPl: 'Iskra, Rozkwit i Strażnik — delikatność, która nie prosi o głośność. To, co ledwo drży, też jest prawdą.',
    descriptionEn: 'Spark, Bloom and Keeper — tenderness that does not ask to be loud. What barely trembles is still true.',
    quality: 'witnessing',
  },
  {
    id: 'a_b_g',
    noteKey: 'A+B+G',
    noteIds: ['A', 'B', 'G'],
    namePl: 'Horyzont Po Burzy',
    nameEn: 'The Horizon After Weather',
    descriptionPl: 'Serce, Korona i Rzeka — szeroki widok, kiedy emocja już przeszła. Została przestrzeń i oddech.',
    descriptionEn: 'Heart, Crown and River — a wide view once the weather has passed. What remains is space and breath.',
    quality: 'orienting',
  },

  // ── Tetrads ───────────────────────────────────────────────────────────────

  {
    id: 'c_e_g_a',
    noteKey: 'A+C+E+G',
    noteIds: ['C', 'E', 'G', 'A'],
    namePl: 'Wielka Cisza',
    nameEn: 'The Grand Silence',
    descriptionPl: 'Cztery filary: Fundament, Rozkwit, Rzeka i Serce. Kompletna obecność — wszystko, co potrzebne do powrotu do siebie.',
    descriptionEn: 'Four pillars: Foundation, Bloom, River and Heart. Complete presence — everything needed to return to oneself.',
    quality: 'grounding',
  },
  {
    id: 'c_sharp_g_sharp_d_sharp_a',
    noteKey: 'A+C#+D#+G#',
    noteIds: ['C#', 'D#', 'G#', 'A'],
    namePl: 'Droga przez Cień',
    nameEn: 'Path Through Shadow',
    descriptionPl: 'Ostrze, Iskra, Płomień i Serce — pełna droga przez trudność. Każda ciemność tu jest obecna i trzymana.',
    descriptionEn: 'Blade, Spark, Flame and Heart — the full path through difficulty. Every shadow here is present and held.',
    quality: 'transforming',
  },
]

const DYAD_OVERRIDE_BY_KEY = new Map<string, ChordPresetDef>()
const CHORD_PRESETS_MULTI: ChordPresetDef[] = []
for (const p of CHORD_PRESETS_HANDCRAFTED) {
  if (p.noteIds.length === 2) {
    DYAD_OVERRIDE_BY_KEY.set(p.noteKey, p)
  } else {
    CHORD_PRESETS_MULTI.push(p)
  }
}

function buildAllDyadPresets(): ChordPresetDef[] {
  const ids = NOTE_LIST.map((n) => n.id)
  const out: ChordPresetDef[] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i]!
      const b = ids[j]!
      const noteKey = toNoteKey([a, b])
      const override = DYAD_OVERRIDE_BY_KEY.get(noteKey)
      if (override) {
        out.push(override)
      } else {
        const sorted = noteKey.split('+') as [string, string]
        out.push(generateDyadPreset(sorted[0]!, sorted[1]!))
      }
    }
  }
  if (out.length !== EXPECTED_DYAD_COUNT) {
    throw new Error(`[chord-presets] dyad count ${out.length} !== ${EXPECTED_DYAD_COUNT}`)
  }
  return out
}

/** All dyads (66) + curated triads/tetrads. Single source for UI + seed. */
export const CHORD_PRESETS: ChordPresetDef[] = [...buildAllDyadPresets(), ...CHORD_PRESETS_MULTI]

/** Lookup a preset by exact noteKey (order-independent) */
export function getChordPreset(noteIds: string[]): ChordPresetDef | undefined {
  const key = toNoteKey(noteIds)
  return CHORD_PRESETS.find((p) => p.noteKey === key)
}
