import { z } from 'zod'
import { noteIdInput } from '@/lib/validators/note'

export const playerEnsureInput = z
  .object({
    playerId: z.string().cuid().optional(),
  })
  .optional()

export const playerEnsureOutput = z.object({
  id: z.string().cuid(),
})

export const completeSessionInput = z.object({
  playerId: z.string().cuid(),
  noteId: noteIdInput,
  durationSeconds: z.number().int().min(1).max(7200),
})

export const soundieRowSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  noteId: z.string(),
  level: z.number().int().min(1).max(5),
  totalListenTime: z.number().int().nonnegative(),
  loreUnlocked: z.number().int().min(0).max(5),
  discoveredAt: z.coerce.date(),
  lastSeenAt: z.coerce.date(),
})
