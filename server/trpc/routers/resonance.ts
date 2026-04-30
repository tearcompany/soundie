import { z } from 'zod'
import { publicProcedure, router } from '../init'
import { resonanceTraceOutputSchema } from '@/lib/validators/resonance'
import { getNoteHealingProfile } from '@/lib/note-healing-profiles'
import { phaseFromSessionDuration } from '@/lib/soundie-rituals'

const ECHO_MATCH_MS = 14 * 60 * 1000

function pickLocaleTexts(
  texts: Array<{ locale: string; field: string; content: string }>,
  locale: 'en' | 'pl',
) {
  const exact = texts.filter((t) => t.locale === locale)
  if (exact.length > 0) return exact
  const en = texts.filter((t) => t.locale === 'en')
  if (en.length > 0) return en
  return texts.filter((t) => t.locale === 'pl')
}

function fieldContent(
  texts: Array<{ locale: string; field: string; content: string }>,
  field: string,
  locale: 'en' | 'pl',
): string | null {
  const row = pickLocaleTexts(texts, locale).find((t) => t.field === field)
  const c = row?.content?.trim()
  return c && c.length > 0 ? c : null
}

function firstVisualLine(s: string, max: number): string {
  const line = s.trim().split(/\n/)[0]?.trim() ?? ''
  if (line.length <= max) return line
  return `${line.slice(0, max - 1).trimEnd()}…`
}

export const resonanceRouter = router({
  getTrace: publicProcedure
    .input(
      z.object({
        playerId: z.string().cuid(),
        locale: z.enum(['en', 'pl']),
        hours: z.number().int().min(1).max(6).default(3),
      }),
    )
    .output(resonanceTraceOutputSchema)
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.hours * 60 * 60 * 1000)
      const [sessions, echoes] = await Promise.all([
        ctx.db.listenSession.findMany({
          where: { playerId: input.playerId, completedAt: { gte: since } },
          orderBy: { completedAt: 'asc' },
          take: 48,
          select: {
            id: true,
            completedAt: true,
            duration: true,
            reflection: {
              select: {
                moodBefore: true,
                moodAfter: true,
              },
            },
            soundie: {
              select: {
                note: {
                  select: { id: true, short: true, name: true, chromaHex: true },
                },
              },
            },
          },
        }),
        ctx.db.echoEntry.findMany({
          where: { playerId: input.playerId, savedAt: { gte: since } },
          select: { noteId: true, phrase: true, savedAt: true },
        }),
      ])

      const noteIds = [...new Set(sessions.map((s) => s.soundie.note.id))]
      const teardropLinks =
        noteIds.length === 0
          ? []
          : await ctx.db.noteTeardropCard.findMany({
              where: { noteId: { in: noteIds } },
              orderBy: [{ noteId: 'asc' }, { sortOrder: 'asc' }],
              include: { card: { include: { texts: true } } },
            })
      const cardByNoteId = new Map<(typeof teardropLinks)[number]['noteId'], (typeof teardropLinks)[number]>()
      for (const link of teardropLinks) {
        if (!cardByNoteId.has(link.noteId)) cardByNoteId.set(link.noteId, link)
      }

      const points = sessions.map((s) => {
        const note = s.soundie.note
        const profile = getNoteHealingProfile(note.id, input.locale)
        const treat = profile?.treats[0]
        const heal = profile?.heals[0]
        const profileAffirmation = profile?.shortMeaning
        const link = cardByNoteId.get(note.id)
        const shadowRaw = link ? fieldContent(link.card.texts, 'meaning_shadow', input.locale) : null
        const affCardRaw = link ? fieldContent(link.card.texts, 'affirmation', input.locale) : null
        const shadowLine = shadowRaw
          ? firstVisualLine(shadowRaw, 168)
          : treat
        const teardropAffirmation = affCardRaw ? firstVisualLine(affCardRaw, 220) : undefined
        const completed = s.completedAt.getTime()
        let best: { phrase: string } | null = null
        let bestDelta = Infinity
        for (const e of echoes) {
          if (e.noteId !== note.id) continue
          const d = Math.abs(e.savedAt.getTime() - completed)
          if (d <= ECHO_MATCH_MS && d < bestDelta) {
            bestDelta = d
            best = e
          }
        }
        return {
          timestamp: completed,
          noteId: note.id,
          noteShort: note.short,
          noteName: note.name,
          noteHex: note.chromaHex,
          phase: phaseFromSessionDuration(s.duration),
          shadowLine,
          heal,
          echoPhrase: best?.phrase,
          teardropAffirmation,
          profileAffirmation,
          moodBefore: s.reflection?.moodBefore ?? undefined,
          moodAfter: s.reflection?.moodAfter ?? undefined,
          moodInferred: treat,
          hasEcho: Boolean(best),
        }
      })

      return { points }
    }),
})
