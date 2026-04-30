import { z } from 'zod'
import { noteIdInput } from './note'
import { moodId } from './mood'

export const sessionReflectionSchema = z.object({
  id: z.string().cuid(),
  playerId: z.string().cuid(),
  sessionId: z.string().cuid(),
  noteId: noteIdInput,
  moodBefore: moodId,
  moodAfter: moodId.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const createSessionReflectionInput = z.object({
  playerId: z.string().cuid(),
  sessionId: z.string().cuid(),
  noteId: noteIdInput,
  moodBefore: moodId,
})

export const setSessionReflectionMoodAfterInput = z.object({
  playerId: z.string().cuid(),
  reflectionId: z.string().cuid(),
  moodAfter: moodId,
})

export const createSessionReflectionOutput = z.object({
  reflection: sessionReflectionSchema,
})

export const setSessionReflectionMoodAfterOutput = z.object({
  reflection: sessionReflectionSchema,
})

export type SessionReflectionRow = z.infer<typeof sessionReflectionSchema>
