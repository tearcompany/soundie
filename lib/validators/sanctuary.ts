import { z } from 'zod'

export const sanctuaryDiagramInput = z.object({
  playerId: z.string().cuid(),
  rangeDays: z.number().int().min(3).max(90).default(14),
  heatmapDays: z.number().int().min(7).max(168).default(84).optional(),
  dayStartIso: z.string().optional(),
  dayEndIso: z.string().optional(),
  locale: z.enum(['en', 'pl']).optional(),
})

export const emotionRowOut = z.object({
  emotionId: z.string(),
  namePl: z.string(),
  nameEn: z.string().nullable(),
  listenSeconds: z.number().int().nonnegative(),
  teardropFocusSeconds: z.number().int().nonnegative(),
  teardropClaims: z.number().int().nonnegative(),
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

const todayClaimOut = z
  .object({
    claimDate: z.string(),
    noteId: z.string(),
    rareCaption: z.string(),
    teardrop: z
      .object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        emotionId: z.string().nullable().optional(),
        tagline: z.string().optional(),
        affirmation: z.string().optional(),
        meaningUpright: z.string().optional(),
        meaningShadow: z.string().optional(),
      })
      .nullable(),
  })
  .nullable()

export const noteHeatmapOutput = z.object({
  cells: z.array(
    z.object({
      noteId: z.string(),
      dateStr: z.string(),
      minutes: z.number().int().nonnegative(),
    })
  ),
  notes: z.array(
    z.object({
      noteId: z.string(),
      shortName: z.string(),
      chromaHex: z.string(),
    })
  ),
})

export const sanctuaryDiagramOutput = z.object({
  releaseByEmotion: z.array(emotionRowOut),
  moodInRange: z.array(moodPointOut),
  minutesToday: z.number().int().nonnegative().nullable(),
  totalSecondsInRange: z.number().int().nonnegative(),
  soundieProgress: z.array(soundieProgressRowOut),
  noteHeatmap: noteHeatmapOutput,
  todayClaim: todayClaimOut,
})
