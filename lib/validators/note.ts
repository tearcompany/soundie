import { z } from 'zod'

export const noteIdInput = z.string().min(1).max(4)

export const urlKeyInput = z.string().min(1).max(8)

const captionItemSchema = z.object({ body: z.string() })

export const noteBaseSchema = z.object({
  id: z.string(),
  short: z.string(),
  name: z.string(),
  frequency: z.number(),
  urlKey: z.string(),
  locked: z.boolean(),
  healing: z.string(),
  chromaHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  synestheticTitlePl: z.string(),
  synestheticLinePl: z.string(),
  element: z.string(),
  sortOrder: z.number().int().min(0),
  emotionId: z.string().nullable(),
  healingStyle: z.string().nullable(),
})

export const noteWithLoreSchema = noteBaseSchema.extend({
  loreFragments: z.array(z.string()).min(0).max(8),
  captions: z.array(captionItemSchema).max(10),
})

export const noteListItemSchema = noteBaseSchema

export type NoteWithLore = z.infer<typeof noteWithLoreSchema>
export type NoteListItem = z.infer<typeof noteListItemSchema>
