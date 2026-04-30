import noteHealingProfilesEn from '@/data/note-healing-profiles.json'
import noteHealingProfilesPl from '@/data/note-healing-profiles-pl.json'
import type { NoteHealingProfile } from '@/lib/validators/note-healing-profile'
import { noteHealingProfileListSchema } from '@/lib/validators/note-healing-profile'

const EN = noteHealingProfileListSchema.parse(noteHealingProfilesEn)
const PL = noteHealingProfileListSchema.parse(noteHealingProfilesPl)

const BY_ID_EN = new Map(EN.map((p) => [p.noteId, p]))
const BY_ID_PL = new Map(PL.map((p) => [p.noteId, p]))

export const NOTE_HEALING_PROFILES_EN: readonly NoteHealingProfile[] = EN
export const NOTE_HEALING_PROFILES_PL: readonly NoteHealingProfile[] = PL

export function getNoteHealingProfile(
  noteId: string,
  locale: 'en' | 'pl',
): NoteHealingProfile | undefined {
  return locale === 'pl' ? BY_ID_PL.get(noteId) : BY_ID_EN.get(noteId)
}

export function listNoteHealingProfileIds(): string[] {
  return EN.map((p) => p.noteId)
}
