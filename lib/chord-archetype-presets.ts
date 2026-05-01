/**
 * Systemowe akordy Soundie — warstwa archetypów.
 * Nutowy sekwencer nadal korzysta z `lib/chord-presets.ts`; rekordy z `noteKey`
 * `arc:*` służą rytuałom, AI i sesji. Dyady z `noteIds` łączą archetype z muzyką.
 */

// ── Deterministyczna mapa archetyp → nuta ────────────────────────────────────
//
//   Ground       → C        Flow         → G
//   Awareness    → F#       Cut          → C#
//   Depth        → D        Signal       → B
//   Action       → D#       Transformation → G#
//   Force        → A#       Balance      → E
//   Identity     → F        Persona      → C#
//   Connection   → A        Expansion    → E
//   Drive        → G#       Pattern      → F
//   Expression   → B        Void         → D
//
// Uwaga: niektóre nuty są wspólne dla dwóch archetypów (np. B=Signal=Expression,
// D=Depth=Void, E=Balance=Expansion, F=Identity=Pattern, G#=Transformation=Drive,
// C#=Cut=Persona). Dyada rozwiązuje potencjalną kolizję przez wybór kontekstu.

/** 22 rdzenie — mapa neutralna PL → rola Soundie-safe (EN id) */
export const ARCHETYPE_SOURCE_MAP = {
  RESH: 'Awareness',
  ZAJIN: 'Cut',
  LAMED: 'Guidance',
  NUN: 'Depth',
  KRZYŻ: 'Decision',
  CIEŃ: 'Unknown',
  ECHO: 'Signal',
  MOC: 'Action',
  PŁOMIEŃ: 'Transformation',
  POPIÓŁ: 'Reset',
  OGIEŃ: 'Force',
  WODA: 'Flow',
  POWIETRZE: 'Balance',
  ZIEMIA: 'Ground',
  PIECZĘĆ: 'Identity',
  MASKA: 'Persona',
  SIEĆ: 'Connection',
  SKRZYDŁO: 'Expansion',
  GŁÓD: 'Drive',
  RYTUAŁ: 'Pattern',
  SŁOWO: 'Expression',
  NICOŚĆ: 'Void',
} as const

/** Deterministyczny słownik: archetyp → nuta Soundie */
export const ARCHETYPE_NOTE_MAP: Record<string, string> = {
  Ground:         'C',
  Flow:           'G',
  Awareness:      'F#',
  Cut:            'C#',
  Depth:          'D',
  Signal:         'B',
  Action:         'D#',
  Transformation: 'G#',
  Force:          'A#',
  Balance:        'E',
  Identity:       'F',
  Persona:        'C#',
  Connection:     'A',
  Expansion:      'E',
  Drive:          'G#',
  Pattern:        'F',
  Expression:     'B',
  Void:           'D',
  // Pomocnicze (używane w triach / tetradach)
  Reset:          'A#',
  Safety:         'C',
  Release:        'G',
  Clarity:        'F#',
  Processing:     'D',
  Insight:        'B',
  Energy:         'D#',
  Momentum:       'G',
  Discipline:     'F',
  Result:         'A',
  Meaning:        'B',
}

/** Warstwa emocji / procesu — obok rdzeni w triach i tetradach */
export type ArchetypeExtendedId =
  | (typeof ARCHETYPE_SOURCE_MAP)[keyof typeof ARCHETYPE_SOURCE_MAP]
  | 'Safety'
  | 'Release'
  | 'Clarity'
  | 'Processing'
  | 'Intuition'
  | 'LettingGo'
  | 'Recovery'
  | 'Discipline'
  | 'Result'
  | 'Meaning'
  | 'Insight'
  | 'Energy'
  | 'Momentum'

export type ChordArchetypeCategory = 'dyad' | 'triad' | 'tetrad'

export type ChordArchetypeSeed = {
  id: string
  archetypes: ArchetypeExtendedId[]
  category: ChordArchetypeCategory
  intent: string
  captionPl: string
  captionEn: string
  /**
   * Kanoniczne nuty dyady (2 nuty), opcjonalnie przy triadach / tetradach.
   * Pozwala sekwencerowi mapować wybór nut → rytuał archetypowy.
   */
  noteIds?: string[]
}

const LABEL_PL: Partial<Record<string, string>> = {
  Awareness: 'Świadomość',
  Cut: 'Granica',
  Guidance: 'Kierunek',
  Depth: 'Głębia',
  Decision: 'Decyzja',
  Unknown: 'Nieznane',
  Signal: 'Sygnał',
  Action: 'Działanie',
  Transformation: 'Przemiana',
  Reset: 'Reset',
  Force: 'Napięcie',
  Flow: 'Przepływ',
  Balance: 'Równowaga',
  Ground: 'Grunt',
  Identity: 'Ja',
  Persona: 'Persona',
  Connection: 'Więź',
  Expansion: 'Rozprostowanie',
  Drive: 'Głód ruchu',
  Pattern: 'Wzór',
  Expression: 'Ekspresja',
  Void: 'Pustość',
  Safety: 'Schronienie',
  Release: 'Uwolnienie',
  Clarity: 'Jasność',
  Processing: 'Przetwarzanie',
  Intuition: 'Intuicja',
  LettingGo: 'Puszczanie',
  Recovery: 'Odbiór siebie',
  Discipline: 'Rytm wewnętrzny',
  Result: 'Skutek',
  Meaning: 'Sens',
  Insight: 'Wgląd',
  Energy: 'Żywotność',
  Momentum: 'Impet',
}

function titleFromArchetypes(ids: ArchetypeExtendedId[], locale: 'pl' | 'en'): string {
  if (locale === 'pl') {
    return ids.map((id) => LABEL_PL[id] ?? id).join(' \u00b7 ')
  }
  return ids.join(' \u00b7 ')
}

export const ARCHETYPE_CHORD_SEEDS: ChordArchetypeSeed[] = [
  // ── 12 Dyad (finalne, deterministyczne) ──────────────────────────────────

  {
    id: 'ground_flow',
    archetypes: ['Ground', 'Flow'],
    category: 'dyad',
    intent: 'regulation',
    noteIds: ['C', 'G'],
    captionPl: 'Pod stopami grunt, w żyłach ruch. Kotwica i nurt w jednym.',
    captionEn: 'Ground underfoot, motion in the veins. Anchor and current as one.',
  },
  {
    id: 'awareness_cut',
    archetypes: ['Awareness', 'Cut'],
    category: 'dyad',
    intent: 'clarity',
    noteIds: ['F#', 'C#'],
    captionPl: 'Świadomość dostaje ostrą krawędź — mgła thinie tam, gdzie widzisz granicę.',
    captionEn: 'Awareness gains a sharp edge — haze thins where you see the cut.',
  },
  {
    id: 'depth_signal',
    archetypes: ['Depth', 'Signal'],
    category: 'dyad',
    intent: 'insight',
    noteIds: ['D', 'B'],
    captionPl: 'Z głębi podnosi się sygnał; wgląd zanim jeszcze jest teoria.',
    captionEn: 'From depth rises a signal; insight before it becomes theory.',
  },
  {
    id: 'action_transformation',
    archetypes: ['Action', 'Transformation'],
    category: 'dyad',
    intent: 'change',
    noteIds: ['D#', 'G#'],
    captionPl: 'Czyn zmienia kształt bycia — nie tylko listę zadań.',
    captionEn: 'Action reshapes how you are — not only your task list.',
  },
  {
    id: 'force_balance',
    archetypes: ['Force', 'Balance'],
    category: 'dyad',
    intent: 'stabilization',
    noteIds: ['A#', 'E'],
    captionPl: 'Siła znajduje równowagę — napięcie, które nie musi rozszarpać.',
    captionEn: 'Force finds balance — tension need not tear.',
  },
  {
    id: 'identity_persona',
    archetypes: ['Identity', 'Persona'],
    category: 'dyad',
    intent: 'self_awareness',
    noteIds: ['F', 'C#'],
    captionPl: 'Między strażnikiem a maską — świadomość obu warstw siebie.',
    captionEn: 'Between keeper and mask — awareness of both layers of self.',
  },
  {
    id: 'connection_expansion',
    archetypes: ['Connection', 'Expansion'],
    category: 'dyad',
    intent: 'relationship_growth',
    noteIds: ['A', 'E'],
    captionPl: 'Więź, która ma przestrzeń rosnąć — relacja jako ruch ku szerzej.',
    captionEn: 'Bond with room to grow — relating as motion toward wider.',
  },
  {
    id: 'drive_pattern',
    archetypes: ['Drive', 'Pattern'],
    category: 'dyad',
    intent: 'habit_building',
    noteIds: ['G#', 'F'],
    captionPl: 'Głód chce kształtu — wzór, który chroni bez kajdanków.',
    captionEn: 'Drive wants a shape — a pattern that holds without shackles.',
  },
  {
    id: 'expression_void',
    archetypes: ['Expression', 'Void'],
    category: 'dyad',
    intent: 'release',
    noteIds: ['B', 'D'],
    captionPl: 'Wypowiedź i pustość: puszczenie tego, co musi odejść, żeby głos był prawdziwy.',
    captionEn: 'Utterance and void: releasing what must go so speech stays true.',
  },
  {
    id: 'ground_depth',
    archetypes: ['Ground', 'Depth'],
    category: 'dyad',
    intent: 'inner_stability',
    noteIds: ['C', 'D'],
    captionPl: 'Grunt pod głębią — wewnętrzna stabilność, która nie wymaga płytkiego spokoju.',
    captionEn: 'Ground beneath depth — inner stability without shallow calm.',
  },
  {
    id: 'signal_expression',
    archetypes: ['Signal', 'Expression'],
    category: 'dyad',
    intent: 'communication',
    noteIds: ['B', 'E'],
    captionPl: 'Sygnał wychodzi w formę: komunikacja, która nie gubi ciała.',
    captionEn: 'Signal finds a form — communication that does not lose the body.',
  },
  {
    id: 'flow_reset',
    archetypes: ['Flow', 'Reset'],
    category: 'dyad',
    intent: 'letting_go',
    noteIds: ['G', 'C'],
    captionPl: 'Przepływ spotyka reset — puszczanie w ruchu, nie na siłę w ciszy.',
    captionEn: 'Flow meets reset — letting go inside motion, not forced stillness.',
  },

  // ── Primary triads ──

  {
    id: 'ground_flow_balance',
    archetypes: ['Ground', 'Flow', 'Balance'],
    category: 'triad',
    intent: 'regulation',
    captionPl: 'Trzy głosy regulacji: kotwica, ruch, wyrównanie.',
    captionEn: 'Three voices of regulation: anchor, motion, equipoise.',
  },
  {
    id: 'awareness_cut_action',
    archetypes: ['Awareness', 'Cut', 'Action'],
    category: 'triad',
    intent: 'decision',
    captionPl: 'Widzenie, granica, krok — decyzja jako całość ciała.',
    captionEn: 'Seeing, edge, step — decision as a whole-bodied act.',
  },
  {
    id: 'depth_signal_expression',
    archetypes: ['Depth', 'Signal', 'Expression'],
    category: 'triad',
    intent: 'insight',
    captionPl: 'Z doliny sygnał wychodzi w słowo lub dźwięk — wgląd dostaje barwę.',
    captionEn: 'From depth, signal rises into word or sound — insight gains color.',
  },
  {
    id: 'force_transformation_reset',
    archetypes: ['Force', 'Transformation', 'Reset'],
    category: 'triad',
    intent: 'breakthrough',
    captionPl: 'Napięcie, które przewraca formę — i przestrzeń po burzy.',
    captionEn: 'Force that turns the shape — and room after weather.',
  },
  {
    id: 'identity_connection_expansion',
    archetypes: ['Identity', 'Connection', 'Expansion'],
    category: 'triad',
    intent: 'relations',
    captionPl: 'Kim jesteś, kogo dotykasz i dokąd rośnie to spotkanie.',
    captionEn: 'Who you are, who you touch, and where that meeting expands.',
  },
  {
    id: 'drive_pattern_discipline',
    archetypes: ['Drive', 'Pattern', 'Discipline'],
    category: 'triad',
    intent: 'habit',
    captionPl: 'Głód, wzór i wewnętrzny rytm — nawyk, który nie sznuruje winy.',
    captionEn: 'Drive, pattern, inner rhythm — habit without a trap of shame.',
  },

  // ── Ritual triads ──

  {
    id: 'ground_flow_release',
    archetypes: ['Ground', 'Flow', 'Release'],
    category: 'triad',
    intent: 'calm',
    captionPl: 'Spokój: zakotwiczenie, nurt i poluzowanie w jednym oddechu.',
    captionEn: 'Calm: anchoring, current, and release in one breath.',
  },
  {
    id: 'awareness_signal_clarity',
    archetypes: ['Awareness', 'Signal', 'Clarity'],
    category: 'triad',
    intent: 'clarity',
    captionPl: 'Świadomość łapie sygnał; jasność jest delikatna, nie ostra.',
    captionEn: 'Awareness catches the signal; clarity stays gentle, not harsh.',
  },
  {
    id: 'depth_processing_reset',
    archetypes: ['Depth', 'Processing', 'Reset'],
    category: 'triad',
    intent: 'healing',
    captionPl: 'Uzdrawianie jako czas w głębi — przetwarzanie i zejście z napięcia.',
    captionEn: 'Healing as time in depth — processing and easing the charge.',
  },
  {
    id: 'drive_action_expansion',
    archetypes: ['Drive', 'Action', 'Expansion'],
    category: 'triad',
    intent: 'energy',
    captionPl: 'Energia: głód spotyka ruch, ruch otwiera przestrzeń.',
    captionEn: 'Energy: drive meets motion; motion opens space.',
  },

  // ── Systemic tetrads ──

  {
    id: 'ground_flow_balance_reset',
    archetypes: ['Ground', 'Flow', 'Balance', 'Reset'],
    category: 'tetrad',
    intent: 'systemic_regulation',
    captionPl: 'Cykl systemu: grunt, przepływ, równowaga i czyste "od nowa".',
    captionEn: 'System cycle: ground, flow, balance, and a fresh "again."',
  },
  {
    id: 'awareness_cut_action_result',
    archetypes: ['Awareness', 'Cut', 'Action', 'Result'],
    category: 'tetrad',
    intent: 'systemic_decision',
    captionPl: 'Od widzenia do skutku — decyzja jako łańcuch, nie cios.',
    captionEn: 'From seeing to outcome — decision as a chain, not a slash.',
  },
  {
    id: 'depth_signal_expression_meaning',
    archetypes: ['Depth', 'Signal', 'Expression', 'Meaning'],
    category: 'tetrad',
    intent: 'systemic_meaning',
    captionPl: 'Sens wychodzi z głębi: sygnał, forma, znaczenie — w tej kolejności lub razem.',
    captionEn: 'Meaning lifts from depth: signal, form, sense — in order or at once.',
  },
  {
    id: 'force_transformation_release_recovery',
    archetypes: ['Force', 'Transformation', 'Release', 'Recovery'],
    category: 'tetrad',
    intent: 'systemic_breakthrough',
    captionPl: 'Przełom z ciałem: napięcie, zmiana, uwolnienie, odbiór.',
    captionEn: 'Breakthrough with body: force, change, release, gathering back.',
  },
  {
    id: 'identity_persona_connection_expansion',
    archetypes: ['Identity', 'Persona', 'Connection', 'Expansion'],
    category: 'tetrad',
    intent: 'systemic_relations',
    captionPl: 'Ja, maska, więź, rozrost — nie wojna ról, tylko mapa relacji.',
    captionEn: 'Self, mask, bond, growth — not role war, but a map of relating.',
  },

  // ── Deep Soundie tetrads ──

  {
    id: 'ground_safety_flow_release',
    archetypes: ['Ground', 'Safety', 'Flow', 'Release'],
    category: 'tetrad',
    intent: 'deep_containment',
    captionPl: 'Schronienie plus ruch: bezpieczna ramka i puszczanie w jednym polu.',
    captionEn: 'Shelter plus motion: safe frame and letting go in one field.',
  },
  {
    id: 'awareness_clarity_cut_action',
    archetypes: ['Awareness', 'Clarity', 'Cut', 'Action'],
    category: 'tetrad',
    intent: 'deep_clarity',
    captionPl: 'Jasny tor: widzieć wyraźnie, oddzielić, ruszyć — bez pogoni.',
    captionEn: 'Clear path: see cleanly, distinguish, move — without chase.',
  },
  {
    id: 'depth_processing_signal_insight',
    archetypes: ['Depth', 'Processing', 'Signal', 'Insight'],
    category: 'tetrad',
    intent: 'deep_insight',
    captionPl: 'Wgląd z procesu: głębia pracy, sygnał, moment rozumienia sobą.',
    captionEn: 'Insight from process: depth of work, signal, the "I grasp myself" beat.',
  },
  {
    id: 'drive_energy_expansion_momentum',
    archetypes: ['Drive', 'Energy', 'Expansion', 'Momentum'],
    category: 'tetrad',
    intent: 'deep_momentum',
    captionPl: 'Impet życzliwy: głód, żywotność, rozprostowanie, ciąg dobrego kierunku.',
    captionEn: 'Kind momentum: drive, vitality, widening, continuity of direction.',
  },
]

/** Jakość rezonansu dla seedu */
export function qualityForArchetypeChord(seed: ChordArchetypeSeed): string {
  const i = seed.intent
  if (/calm|containment|safety|recovery|renewal|regulation|stabilization|inner_stability/.test(i)) return 'grounding'
  if (/clarity|insight|awareness|signal|meaning|decision|communication|habit_building|self_awareness/.test(i))
    return 'orienting'
  if (/energy|momentum|drive|action|breakthrough|force|^change$/.test(i)) return 'activating'
  if (/healing|processing|depth|letting_go|(^release$)|transformation/.test(i)) return 'releasing'
  if (/relations|relationship|connection|bond|identity|persona/.test(i)) return 'restoring'
  return 'grounding'
}

export function archetypeSeedToDisplay(seed: ChordArchetypeSeed, locale: 'pl' | 'en') {
  return {
    name: titleFromArchetypes(seed.archetypes, locale),
    description: locale === 'pl' ? seed.captionPl : seed.captionEn,
  }
}

/**
 * Lookup: noteIds (2 nuty) → dyada archetypowa.
 * Sekwencer wywołuje to po wyborze pary nut, żeby zaproponować rytuał.
 */
export function getArchetypeDyadByNotes(noteIds: string[]): ChordArchetypeSeed | undefined {
  if (noteIds.length !== 2) return undefined
  const key = [...noteIds].sort().join('+')
  return ARCHETYPE_CHORD_SEEDS.find((s) => {
    if (s.category !== 'dyad' || !s.noteIds || s.noteIds.length !== 2) return false
    return [...s.noteIds].sort().join('+') === key
  })
}

/**
 * Lookup: intent (string) → pierwsza pasująca dyada.
 * AI może podać intent i dostać nuty do sesji.
 */
export function getArchetypeDyadByIntent(intent: string): ChordArchetypeSeed | undefined {
  return ARCHETYPE_CHORD_SEEDS.find((s) => s.category === 'dyad' && s.intent === intent)
}
