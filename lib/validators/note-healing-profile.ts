import { z } from 'zod'

export const energyToneSchema = z.enum([
  'grounding',
  'clarifying',
  'warming',
  'opening',
  'cooling',
  'uplifting',
])

export const noteHealingProfileSchema = z.object({
  noteId: z.string(),
  noteName: z.string(),
  emotionCore: z.string(),
  archetype: z.string(),
  treats: z.array(z.string()),
  heals: z.array(z.string()),
  supports: z.array(z.string()),
  transforms: z.array(z.string()),
  bodyFocus: z.array(z.string()).optional(),
  energyTone: energyToneSchema,
  shortMeaning: z.string(),
  todayUse: z.string(),
})

export type NoteHealingProfile = z.infer<typeof noteHealingProfileSchema>

export const noteHealingProfileListSchema = z.array(noteHealingProfileSchema)
