import { z } from 'zod'
import { noteIdInput } from './note'

const yyyyMmDd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .min(10)
  .max(10)

const localeIn = z.enum(['en', 'pl'])

const glow = z.enum(['dawn', 'dusk', 'nocturne'])

export const revealDailyClaimInput = z.object({
  playerId: z.string().cuid(),
  claimDate: yyyyMmDd,
  noteId: noteIdInput,
  locale: localeIn,
})

const teardropOut = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    affirmation: z.string().optional(),
    tagline: z.string().optional(),
  })
  .nullable()

export const revealDailyClaimOutput = z.object({
  isNew: z.boolean(),
  claimDate: z.string(),
  noteId: z.string(),
  glowKey: glow,
  rareCaption: z.string(),
  teardrop: teardropOut,
})
