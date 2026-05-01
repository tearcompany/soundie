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

export const moodPulseBucketSchema = z.object({
  index: z.number().int(),
  light: z.number(),
  shadow: z.number(),
})

export const moodPulseForecastMoodSchema = z.enum([
  'hopeful',
  'anxious',
  'numb',
  'heavy',
  'scattered',
])

export const moodPulseOutputSchema = z.object({
  buckets: z.array(moodPulseBucketSchema),
  windowMinutes: z.number().int(),
  teardropLightLine: z.string().nullable(),
  teardropShadowLine: z.string().nullable(),
  forecastKind: z.enum(['toward_light', 'toward_shadow', 'steady']),
  forecastMoodId: moodPulseForecastMoodSchema,
  hasSignal: z.boolean(),
})

export type MoodPulseOutput = z.infer<typeof moodPulseOutputSchema>

export const emotionBalanceRowSchema = z.object({
  emotionId: z.string(),
  namePl: z.string(),
  nameEn: z.string().nullable(),
  noteHex: z.string(),
  inLightSeconds: z.number().nonnegative(),
  inShadowSeconds: z.number().nonnegative(),
  totalSeconds: z.number().nonnegative(),
})

export const emotionBalanceOutputSchema = z.object({
  today: z.array(emotionBalanceRowSchema),
  week: z.array(emotionBalanceRowSchema),
  weeklyShift: z.enum(['toward_light', 'toward_shadow', 'steady', 'new_arrival']),
  shiftEmotionId: z.string().nullable(),
  shiftEmotionNamePl: z.string().nullable(),
  shiftEmotionNameEn: z.string().nullable(),
})

export type EmotionBalanceRow = z.infer<typeof emotionBalanceRowSchema>
export type EmotionBalanceOutput = z.infer<typeof emotionBalanceOutputSchema>
