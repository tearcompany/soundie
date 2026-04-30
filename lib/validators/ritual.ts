import { z } from 'zod'

export const ritualPhaseSchema = z.object({
  id: z.string(),
  ritualId: z.string(),
  name: z.string(),
  noteIds: z.array(z.string()).min(1),
  untilSec: z.number().int().positive(),
})

export const ritualSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  durationSec: z.number().int().positive(),
  dominantNote: z.string(),
  energyTone: z.string(),
  notes: z.array(z.string()).min(1),
  phases: z.array(ritualPhaseSchema),
})

export const ritualGetByIdInput = z.object({
  ritualId: z.string().min(1),
})

export const ritualGetByIdOutput = ritualSchema

export const ritualListOutput = z.array(ritualSchema)

export type Ritual = z.infer<typeof ritualSchema>
export type RitualPhase = z.infer<typeof ritualPhaseSchema>
