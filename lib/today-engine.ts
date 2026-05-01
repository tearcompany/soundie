import { DEFAULT_NOTE_ID, NOTE_LIST, type NoteEntry } from '@/lib/notes'

export type TodaySlotId = 'morning' | 'relationships' | 'stress' | 'soul'

export type TodayEngineInput = {
  weekday: number
  streakNights: number
  lastNoteId: string | null
  recentMoodKeys: string[]
}

function hashSeed(input: TodayEngineInput): number {
  let h = input.weekday * 7919 + input.streakNights * 9973
  if (input.lastNoteId) {
    for (let c = 0; c < input.lastNoteId.length; c++) {
      h += input.lastNoteId.charCodeAt(c) * (c + 1) * 31
    }
  }
  for (let m = 0; m < input.recentMoodKeys.length; m++) {
    const s = input.recentMoodKeys[m]!
    for (let i = 0; i < s.length; i++) {
      h += s.charCodeAt(i) * (i + 3) * (m + 7)
    }
  }
  return Math.abs(h)
}

function byEmotions(ids: string[]): NoteEntry[] {
  const set = new Set(ids)
  return NOTE_LIST.filter((n) => set.has(n.emotionId))
}

function takeFirstUnused(pool: NoteEntry[], used: Set<string>, offset: number): NoteEntry | null {
  if (pool.length === 0) return null
  for (let k = 0; k < pool.length * 2; k++) {
    const n = pool[(offset + k) % pool.length]!
    if (!used.has(n.id)) return n
  }
  return null
}

function takeAnyUnused(used: Set<string>, startIdx: number): NoteEntry {
  for (let k = 0; k < NOTE_LIST.length; k++) {
    const n = NOTE_LIST[(startIdx + k) % NOTE_LIST.length]!
    if (!used.has(n.id)) return n
  }
  return NOTE_LIST.find((n) => n.id === DEFAULT_NOTE_ID) ?? NOTE_LIST[0]!
}

/** Morning invitations lean on the journey spine (F → A → C), then nearby anchors. */
const MORNING_BIAS = ['F', 'A', 'C', 'E', 'D']
const REL_POOL = byEmotions(['attachment', 'envy', 'shame'])
const STRESS_POOL = byEmotions(['anxiety', 'anger', 'frustration', 'guilt'])
const SOUL_POOL = byEmotions(['grief', 'sadness', 'guilt', 'dissatisfaction'])

export function computeTodaySlots(input: TodayEngineInput): { slotId: TodaySlotId; noteId: string }[] {
  const seed = hashSeed(input)
  const used = new Set<string>()
  const out: { slotId: TodaySlotId; noteId: string }[] = []

  const moodStress = input.recentMoodKeys.some((m) =>
    ['anxious', 'heavy', 'numb'].includes(m),
  )
  const moodSoft = input.recentMoodKeys.some((m) =>
    ['hopeful', 'scattered'].includes(m),
  )

  const morningPool = MORNING_BIAS.map(
    (id) => NOTE_LIST.find((n) => n.id === id),
  ).filter(Boolean) as NoteEntry[]
  const mIdx = (input.weekday + input.streakNights + seed) % Math.max(1, morningPool.length)
  let morning = morningPool[mIdx] ?? NOTE_LIST.find((n) => n.id === DEFAULT_NOTE_ID) ?? NOTE_LIST[0]!
  if (used.has(morning.id)) morning = takeAnyUnused(used, (seed + 1) % 12)
  used.add(morning.id)
  out.push({ slotId: 'morning', noteId: morning.id })

  let rel = takeFirstUnused(
    REL_POOL.length ? REL_POOL : NOTE_LIST,
    used,
    (seed + input.streakNights * 2) % 12,
  )
  if (!rel) rel = takeAnyUnused(used, seed % 12)
  used.add(rel.id)
  out.push({ slotId: 'relationships', noteId: rel.id })

  let stressPool = [...STRESS_POOL]
  if (moodStress && stressPool.length > 1) {
    stressPool = [...stressPool].sort((a, b) =>
      a.emotionId === 'anxiety' ? -1 : b.emotionId === 'anxiety' ? 1 : 0,
    )
  }
  if (moodSoft && stressPool.length > 1) {
    stressPool = [...stressPool].reverse()
  }
  let stress = takeFirstUnused(stressPool.length ? stressPool : NOTE_LIST, used, (seed >> 3) % 12)
  if (!stress) stress = takeAnyUnused(used, (seed + 5) % 12)
  used.add(stress.id)
  out.push({ slotId: 'stress', noteId: stress.id })

  let soul: NoteEntry | null = null
  if (input.lastNoteId && NOTE_LIST.some((n) => n.id === input.lastNoteId) && !used.has(input.lastNoteId)) {
    soul = NOTE_LIST.find((n) => n.id === input.lastNoteId) ?? null
  }
  if (!soul) {
    soul = takeFirstUnused(
      SOUL_POOL.length ? SOUL_POOL : NOTE_LIST,
      used,
      (seed >> 5) + input.weekday,
    )
  }
  if (!soul) soul = takeAnyUnused(used, (seed + 9) % 12)
  if (used.has(soul.id)) soul = takeAnyUnused(used, 0)
  used.add(soul.id)
  out.push({ slotId: 'soul', noteId: soul.id })

  return out
}

export function heroOrbHexFromSlots(slots: { noteId: string }[]): string {
  const ids = slots.map((s) => s.noteId)
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (const id of ids) {
    const note = NOTE_LIST.find((x) => x.id === id)
    if (!note) continue
    const hex = note.chromaHex.replace('#', '')
    r += parseInt(hex.slice(0, 2), 16)
    g += parseInt(hex.slice(2, 4), 16)
    b += parseInt(hex.slice(4, 6), 16)
    n += 1
  }
  if (n === 0) return (NOTE_LIST.find((x) => x.id === DEFAULT_NOTE_ID) ?? NOTE_LIST[0]!).chromaHex
  const mix = (x: number) => Math.round(x / n).toString(16).padStart(2, '0')
  return `#${mix(r)}${mix(g)}${mix(b)}`
}
