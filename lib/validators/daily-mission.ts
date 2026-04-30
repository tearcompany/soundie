import { z } from 'zod'

const yyyyMmDd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .min(10)
  .max(10)

export const dailyMissionItemKind = z.enum(['light', 'shadow'])

export const dailyMissionItemSchema = z.object({
  id: z.string(),
  orderIndex: z.number().int().min(0),
  noteId: z.string(),
  noteShort: z.string(),
  noteName: z.string(),
  noteChromaHex: z.string(),
  noteSynestheticTitle: z.string(),
  noteSynestheticLine: z.string().nullable(),
  noteElement: z.string().nullable(),
  noteEmotionName: z.string().nullable(),
  targetLoreIndex: z.number().int().min(1).max(5),
  kind: dailyMissionItemKind,
  teardropCardName: z.string().nullable(),
  teardropCardTagline: z.string().nullable(),
  teardropCardMeaning: z.string().nullable(),
  teardropCardSlug: z.string().nullable(),
  progressPercent: z.number().int().min(0).max(100),
  minutesRequired: z.number().int().nonnegative(),
  minutesListened: z.number().int().nonnegative(),
  completedAt: z.string().nullable(),
})

export const dailyMissionSchema = z.object({
  id: z.string(),
  missionDate: z.string(),
  completedAt: z.string().nullable(),
  items: z.array(dailyMissionItemSchema),
  allDone: z.boolean(),
  doneCount: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
})

export const getOrCreateInput = z.object({
  playerId: z.string().cuid(),
  missionDate: yyyyMmDd,
  locale: z.enum(['pl', 'en']).default('pl'),
})

export const syncProgressInput = z.object({
  playerId: z.string().cuid(),
  missionDate: yyyyMmDd,
  locale: z.enum(['pl', 'en']).default('pl'),
})

export type DailyMissionItem = z.infer<typeof dailyMissionItemSchema>
export type DailyMission = z.infer<typeof dailyMissionSchema>
