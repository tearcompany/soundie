import type { Ritual } from '@/lib/validators/ritual'

export const WARMTH_RITUAL_ID = 'warmth_a_f_9m' as const
export const CLARITY_RITUAL_ID = 'clarity_fsharp_csharp_9m' as const
export const GROUNDING_RITUAL_ID = 'grounding_c_f_9m' as const
export const ENERGY_RITUAL_ID = 'energy_dsharp_gsharp_9m' as const
export const RELEASE_RITUAL_ID = 'release_g_asharp_9m' as const

export const ALL_DUAL_RITUAL_IDS = [
  WARMTH_RITUAL_ID,
  CLARITY_RITUAL_ID,
  GROUNDING_RITUAL_ID,
  ENERGY_RITUAL_ID,
  RELEASE_RITUAL_ID,
] as const

export type RitualArchetypeKey = 'warmth' | 'clarity' | 'grounding' | 'energy' | 'release'

export type RitualAttributionSegment = { noteId: string; seconds: number }

export type RitualMomentPhase = 'shelter' | 'meeting' | 'staying'

export type DualRitualEngine = {
  id: string
  ritualKey: RitualArchetypeKey
  entryNoteId: string
  dominantNoteId: string
  durationSeconds: number
  shelterEnd: number
  meetingEnd: number
  attribution: RitualAttributionSegment[]
}

const RUNTIME_DUAL_RITUAL_ENGINES = new Map<string, DualRitualEngine>()

const STANDARD_SHELTER = 150
const STANDARD_MEETING_END = 360

function seg(entry: string, dominant: string): RitualAttributionSegment[] {
  return [
    { noteId: entry, seconds: 255 },
    { noteId: dominant, seconds: 285 },
  ]
}

export const DUAL_RITUAL_ENGINES: Record<string, DualRitualEngine> = {
  [WARMTH_RITUAL_ID]: {
    id: WARMTH_RITUAL_ID,
    ritualKey: 'warmth',
    entryNoteId: 'F',
    dominantNoteId: 'A',
    durationSeconds: 540,
    shelterEnd: STANDARD_SHELTER,
    meetingEnd: STANDARD_MEETING_END,
    attribution: seg('F', 'A'),
  },
  [CLARITY_RITUAL_ID]: {
    id: CLARITY_RITUAL_ID,
    ritualKey: 'clarity',
    entryNoteId: 'F#',
    dominantNoteId: 'C#',
    durationSeconds: 540,
    shelterEnd: STANDARD_SHELTER,
    meetingEnd: STANDARD_MEETING_END,
    attribution: seg('F#', 'C#'),
  },
  [GROUNDING_RITUAL_ID]: {
    id: GROUNDING_RITUAL_ID,
    ritualKey: 'grounding',
    entryNoteId: 'C',
    dominantNoteId: 'F',
    durationSeconds: 540,
    shelterEnd: STANDARD_SHELTER,
    meetingEnd: STANDARD_MEETING_END,
    attribution: seg('C', 'F'),
  },
  [ENERGY_RITUAL_ID]: {
    id: ENERGY_RITUAL_ID,
    ritualKey: 'energy',
    entryNoteId: 'D#',
    dominantNoteId: 'G#',
    durationSeconds: 540,
    shelterEnd: STANDARD_SHELTER,
    meetingEnd: STANDARD_MEETING_END,
    attribution: seg('D#', 'G#'),
  },
  [RELEASE_RITUAL_ID]: {
    id: RELEASE_RITUAL_ID,
    ritualKey: 'release',
    entryNoteId: 'G',
    dominantNoteId: 'A#',
    durationSeconds: 540,
    shelterEnd: STANDARD_SHELTER,
    meetingEnd: STANDARD_MEETING_END,
    attribution: seg('G', 'A#'),
  },
}

function ritualKeyFromIdOrTone(
  ritualId: string,
  energyTone?: string | null,
): RitualArchetypeKey {
  const candidate = (energyTone?.trim().toLowerCase() || ritualId.split('_')[0] || '').trim()
  if (candidate === 'warmth') return 'warmth'
  if (candidate === 'clarity' || candidate === 'clarifying') return 'clarity'
  if (candidate === 'grounding') return 'grounding'
  if (candidate === 'energy' || candidate === 'uplifting') return 'energy'
  if (candidate === 'release' || candidate === 'cooling') return 'release'
  return 'warmth'
}

function attributionFromPhases(
  phases: Array<{ noteIds: string[]; untilSec: number }>,
): RitualAttributionSegment[] {
  const sorted = [...phases].sort((a, b) => a.untilSec - b.untilSec)
  const byNote = new Map<string, number>()
  let previousUntil = 0

  for (const phase of sorted) {
    const until = Math.max(phase.untilSec, previousUntil)
    const segment = until - previousUntil
    previousUntil = until
    if (segment <= 0) continue
    const ids = phase.noteIds.length > 0 ? phase.noteIds : []
    if (ids.length === 0) continue
    const perNote = Math.floor(segment / ids.length)
    const remainder = segment % ids.length
    ids.forEach((noteId, index) => {
      const add = perNote + (index < remainder ? 1 : 0)
      byNote.set(noteId, (byNote.get(noteId) ?? 0) + add)
    })
  }

  return Array.from(byNote.entries()).map(([noteId, seconds]) => ({ noteId, seconds }))
}

export function dualRitualEngineFromDb(
  ritual: Pick<Ritual, 'id' | 'dominantNote' | 'durationSec' | 'energyTone' | 'notes' | 'phases'>,
): DualRitualEngine | null {
  const phases = [...ritual.phases].sort((a, b) => a.untilSec - b.untilSec)
  if (phases.length < 3) return null
  const first = phases[0]
  const second = phases[1]
  if (!first || !second) return null
  const entry =
    first.noteIds[0] ??
    ritual.notes.find((id) => id !== ritual.dominantNote) ??
    ritual.notes[0] ??
    ritual.dominantNote
  const dominant = ritual.dominantNote
  if (!entry || !dominant) return null
  return {
    id: ritual.id,
    ritualKey: ritualKeyFromIdOrTone(ritual.id, ritual.energyTone),
    entryNoteId: entry,
    dominantNoteId: dominant,
    durationSeconds: ritual.durationSec,
    shelterEnd: first.untilSec,
    meetingEnd: second.untilSec,
    attribution: attributionFromPhases(phases),
  }
}

export function registerDualRitualFromDb(
  ritual: Pick<Ritual, 'id' | 'dominantNote' | 'durationSec' | 'energyTone' | 'notes' | 'phases'>,
): DualRitualEngine | null {
  const mapped = dualRitualEngineFromDb(ritual)
  if (!mapped) return null
  RUNTIME_DUAL_RITUAL_ENGINES.set(mapped.id, mapped)
  return mapped
}

export function registerDualRitualsFromDb(
  rituals: Array<Pick<Ritual, 'id' | 'dominantNote' | 'durationSec' | 'energyTone' | 'notes' | 'phases'>>,
): void {
  rituals.forEach((ritual) => {
    registerDualRitualFromDb(ritual)
  })
}

export function getDualRitualEngine(ritualId: string | null): DualRitualEngine | null {
  if (!ritualId) return null
  return RUNTIME_DUAL_RITUAL_ENGINES.get(ritualId) ?? DUAL_RITUAL_ENGINES[ritualId] ?? null
}

export function dualRitualFeaturedForBrowse(
  activeNoteId: string,
  armedRitualId: string | null,
): DualRitualEngine {
  if (armedRitualId) {
    return getDualRitualEngine(armedRitualId) ?? DUAL_RITUAL_ENGINES[WARMTH_RITUAL_ID]!
  }
  for (const rid of ALL_DUAL_RITUAL_IDS) {
    const cfg = DUAL_RITUAL_ENGINES[rid]!
    if (cfg.entryNoteId === activeNoteId) return cfg
  }
  for (const rid of ALL_DUAL_RITUAL_IDS) {
    const cfg = DUAL_RITUAL_ENGINES[rid]!
    if (cfg.dominantNoteId === activeNoteId) return cfg
  }
  return DUAL_RITUAL_ENGINES[WARMTH_RITUAL_ID]!
}

export function ritualAttributionFor(ritualId: string): RitualAttributionSegment[] {
  return getDualRitualEngine(ritualId)?.attribution ?? []
}

export function ritualDurationSeconds(ritualId: string): number {
  return getDualRitualEngine(ritualId)?.durationSeconds ?? 540
}

export function ritualPhaseAt(cfg: DualRitualEngine, elapsedSeconds: number): RitualMomentPhase {
  if (elapsedSeconds < cfg.shelterEnd) return 'shelter'
  if (elapsedSeconds < cfg.meetingEnd) return 'meeting'
  return 'staying'
}

export function dualRitualGain(
  phase: RitualMomentPhase,
): { entry: number; dominant: number } {
  const v = 1
  if (phase === 'shelter') return { entry: v, dominant: 0 }
  if (phase === 'meeting') return { entry: v, dominant: v }
  return { entry: 0, dominant: v }
}

export type ListeningPresence =
  | { mode: 'single'; noteId: string }
  | { mode: 'blend'; entryNoteId: string; partnerNoteId: string }

export function listeningPresenceForDualRitual(
  cfg: DualRitualEngine,
  elapsedSeconds: number,
): ListeningPresence {
  const phase = ritualPhaseAt(cfg, elapsedSeconds)
  if (phase === 'shelter') return { mode: 'single', noteId: cfg.entryNoteId }
  if (phase === 'meeting') {
    return {
      mode: 'blend',
      entryNoteId: cfg.entryNoteId,
      partnerNoteId: cfg.dominantNoteId,
    }
  }
  return { mode: 'single', noteId: cfg.dominantNoteId }
}

export function resolveListeningQueryNoteId(presence: ListeningPresence): string {
  if (presence.mode === 'single') return presence.noteId
  return presence.entryNoteId
}

export function dualRitualEffectiveListenSeconds(
  elapsed: number,
  baseEntry: number,
  baseDominant: number,
  meetingEndExclusive: number,
): number {
  if (elapsed < meetingEndExclusive) {
    return baseEntry + elapsed
  }
  return baseDominant + (elapsed - meetingEndExclusive)
}

const warmthEngine = DUAL_RITUAL_ENGINES[WARMTH_RITUAL_ID]

export function phaseFromSessionDuration(seconds: number): RitualMomentPhase {
  return ritualPhaseAt(warmthEngine, seconds)
}

export const warmthAttributionSegments = warmthEngine.attribution

export function warmthPhaseAt(elapsedSeconds: number): RitualMomentPhase {
  return ritualPhaseAt(warmthEngine, elapsedSeconds)
}

export function warmthListeningNoteId(elapsedSeconds: number): string {
  return resolveListeningQueryNoteId(
    listeningPresenceForDualRitual(warmthEngine, elapsedSeconds),
  )
}

export function warmthEffectiveListenSecondsForLoreDerived(
  elapsedSeconds: number,
  baseF: number,
  baseA: number,
): number {
  return dualRitualEffectiveListenSeconds(
    elapsedSeconds,
    baseF,
    baseA,
    warmthEngine.meetingEnd,
  )
}

export function warmthEffectiveListenSecondsForLoreDraft(
  elapsedSeconds: number,
  baseF: number,
  baseA: number,
): number {
  return warmthEffectiveListenSecondsForLoreDerived(elapsedSeconds, baseF, baseA)
}

export function warmthGainMultiplier(elapsedSeconds: number): {
  f: number
  a: number
} {
  const g = dualRitualGain(warmthPhaseAt(elapsedSeconds))
  return { f: g.entry, a: g.dominant }
}

export const NEXT_RITUAL_ARCHETYPES = [
  'clarity_fsharp_csharp',
  'grounding_c_f',
  'energy_dsharp_gsharp',
  'release_g_asharp',
] as const

export function pickWarmthEchoLine(lines: readonly string[]): string {
  if (lines.length === 0) return ''
  const i = Math.floor(Math.random() * lines.length)
  return lines[i] ?? ''
}

export function isArrivalTransitionWindow(
  cfg: DualRitualEngine,
  elapsedSeconds: number,
): boolean {
  return elapsedSeconds >= cfg.shelterEnd && elapsedSeconds < cfg.shelterEnd + 15
}

export type RitualEchoMeta = {
  ritualKey: RitualArchetypeKey
  ritualId: string
  entryNote: string
  dominantNote: string
  notes: readonly string[]
  elapsedSeconds: number
}

export function buildRitualEchoMeta(
  cfg: DualRitualEngine,
  elapsedSeconds: number,
): RitualEchoMeta {
  return {
    ritualKey: cfg.ritualKey,
    ritualId: cfg.id,
    entryNote: cfg.entryNoteId,
    dominantNote: cfg.dominantNoteId,
    notes: [cfg.entryNoteId, cfg.dominantNoteId],
    elapsedSeconds,
  }
}

export type RitualSealPayload = {
  ritualKey: RitualArchetypeKey
  ritualId: string
  dominantNoteId: string
  entryNoteId: string
  notesInvolved: readonly string[]
  phrase: string
  elapsedSeconds: number
}

export function ritualCycleDisplayPhase(
  sessionActive: boolean,
  sealed: boolean,
  cfg: DualRitualEngine | null,
  elapsedSeconds: number,
): RitualMomentPhase | 'idle' | 'sealed' {
  if (sealed) return 'sealed'
  if (!sessionActive || !cfg) return 'idle'
  return ritualPhaseAt(cfg, elapsedSeconds)
}
