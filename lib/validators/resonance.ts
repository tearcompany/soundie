import { z } from 'zod'

export const resonanceTracePointSchema = z.object({
  timestamp: z.number(),
  noteId: z.string(),
  noteShort: z.string(),
  noteName: z.string(),
  noteHex: z.string(),
  phase: z.enum(['shelter', 'meeting', 'staying']).optional(),
  shadowLine: z.string().optional(),
  heal: z.string().optional(),
  echoPhrase: z.string().optional(),
  teardropAffirmation: z.string().optional(),
  profileAffirmation: z.string().optional(),
  moodBefore: z.string().optional(),
  moodAfter: z.string().optional(),
  moodInferred: z.string().optional(),
  hasEcho: z.boolean(),
})

export const resonanceTraceOutputSchema = z.object({
  points: z.array(resonanceTracePointSchema),
})

export type ResonanceTracePoint = z.infer<typeof resonanceTracePointSchema>
