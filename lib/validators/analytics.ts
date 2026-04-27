import { z } from 'zod'

const analyticsName = z.enum([
  'first_visit',
  'second_day_return',
  'session_started',
  'session_180_complete',
  'teardrop_open',
  'share_click',
  'daily_gift_revealed',
  'daily_gift_listen_click',
  'mood_check_in',
])

export const recordEventInput = z.object({
  name: analyticsName,
  playerId: z.string().cuid().nullish(),
  meta: z.unknown().optional(),
})

export const recordEventOutput = z.object({ ok: z.boolean() })
