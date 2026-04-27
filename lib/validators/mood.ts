import { z } from 'zod'
import { noteIdInput } from './note'

const yyyyMmDd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .min(10)
  .max(10)

export const moodId = z.enum(['anxious', 'numb', 'heavy', 'scattered', 'hopeful'])

export const saveMoodEntryInput = z.object({
  playerId: z.string().cuid(),
  noteId: noteIdInput,
  mood: moodId,
  entryDate: yyyyMmDd,
})

export const saveMoodEntryOutput = z.object({ ok: z.boolean() })
