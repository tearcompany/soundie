import { z } from 'zod'
import { noteIdInput } from './note'

const yyyyMmDd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .min(10)
  .max(10)

export const logVisitInput = z.object({
  playerId: z.string().cuid(),
  calendarDate: yyyyMmDd,
  activeNoteId: noteIdInput.optional(),
})

export const returnStorySchema = z.enum(['none', 'first_day', 'second_day', 'returning'])
export type ReturnStory = z.infer<typeof returnStorySchema>

export const RETURN_MILESTONES = [3, 7, 14, 21, 30] as const
export type ReturnMilestone = (typeof RETURN_MILESTONES)[number]

export const logVisitOutput = z.object({
  streakNights: z.number().int().min(0),
  shouldShowWelcomeBack: z.boolean(),
  returnStory: returnStorySchema,
  isFirstVisitEver: z.boolean(),
  noteShort: z.string().min(1).max(4).optional(),
  milestone: z.number().int().min(0),
})
