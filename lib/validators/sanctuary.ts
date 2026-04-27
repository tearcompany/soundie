import { z } from 'zod'

export const sanctuaryDiagramInput = z.object({
  playerId: z.string().cuid(),
  rangeDays: z.number().int().min(3).max(90).default(14),
  dayStartIso: z.string().optional(),
  dayEndIso: z.string().optional(),
})

export const emotionRowOut = z.object({
  emotionId: z.string(),
  namePl: z.string(),
  nameEn: z.string().nullable(),
  seconds: z.number().int().nonnegative(),
})

export const moodPointOut = z.object({
  entryDate: z.string(),
  mood: z.string(),
})

export const soundieProgressRowOut = z.object({
  noteId: z.string(),
  noteName: z.string(),
  chromaHex: z.string(),
  level: z.number().int().min(1).max(5),
  totalListenTime: z.number().int().nonnegative(),
  loreUnlocked: z.number().int().min(0).max(5),
})

export const sanctuaryDiagramOutput = z.object({
  releaseByEmotion: z.array(emotionRowOut),
  moodInRange: z.array(moodPointOut),
  minutesToday: z.number().int().nonnegative().nullable(),
  totalSecondsInRange: z.number().int().nonnegative(),
  soundieProgress: z.array(soundieProgressRowOut),
})
