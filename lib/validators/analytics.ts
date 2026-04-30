import { z } from 'zod'

const analyticsName = z.enum([
  'first_visit',
  'second_day_return',
  'sanctuary_enter',
  'session_started',
  'session_180_complete',
  'teardrop_open',
  'lore_slide_view',
  'share_click',
  'share_complete',
  'share_copy_fallback',
  'daily_gift_revealed',
  'daily_gift_listen_click',
  'mood_check_in',
  'daily_mission_complete',
  'daily_mission_focus',
  'ritual_completed',
])

export const recordEventInput = z.object({
  name: analyticsName,
  playerId: z.string().cuid().nullish(),
  meta: z.unknown().optional(),
})

export const recordEventOutput = z.object({ ok: z.boolean() })
