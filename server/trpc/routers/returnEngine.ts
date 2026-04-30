import { TRPCError, publicProcedure, router } from '../init'
import { isValidYyyyMmDd, previousCalendarDay } from '@/lib/calendar-day'
import { djb2U32 } from '@/lib/deterministic-pick'
import type { ReturnStory } from '@/lib/validators/returnEngine'
import { logVisitInput, logVisitOutput, RETURN_MILESTONES } from '@/lib/validators/returnEngine'
import { revealDailyClaimInput, revealDailyClaimOutput } from '@/lib/validators/daily-claim'

const GLOW = ['dawn', 'dusk', 'nocturne'] as const

type Locale = 'en' | 'pl'

function pickLocaleForTexts(
  texts: Array<{ locale: string; field: string; content: string }>,
  locale: string,
) {
  const exact = texts.filter((t) => t.locale === locale)
  if (exact.length > 0) return exact
  const en = texts.filter((t) => t.locale === 'en')
  if (en.length > 0) return en
  return texts
}

function mapTeardropPublic(
  card: {
    id: string
    slug: string
    name: string
    emotionId: string | null
    texts: Array<{ locale: string; field: string; content: string }>
  },
  locale: string,
) {
  const t = pickLocaleForTexts(card.texts, locale)
  const g = (field: string) =>
    t.find((x) => x.field === field)?.content?.trim() ?? ''
  const affirmation = g('affirmation')
  const tagline = g('tagline')
  return {
    id: card.id,
    slug: card.slug,
    name: card.name,
    emotionId: card.emotionId,
    ...(affirmation ? { affirmation } : {}),
    ...(tagline ? { tagline } : {}),
  }
}

export const returnEngineRouter = router({
  logVisit: publicProcedure
    .input(logVisitInput)
    .output(logVisitOutput)
    .mutation(async ({ ctx, input }) => {
      if (!isValidYyyyMmDd(input.calendarDate)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid calendar date' })
      }

      const player = await ctx.db.player.findUnique({ where: { id: input.playerId } })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }

      const { calendarDate, activeNoteId, playerId } = input
      const priorRows = await ctx.db.dailyVisit.findMany({
        where: { playerId },
        select: { visitDate: true },
      })
      const hadAnyPrior = priorRows.length > 0
      const distinctBeforeToday = new Set(
        priorRows.filter((r) => r.visitDate < calendarDate).map((r) => r.visitDate),
      ).size

      const existingToday = await ctx.db.dailyVisit.findUnique({
        where: {
          playerId_visitDate: { playerId, visitDate: calendarDate },
        },
      })

      const wasFirstVisitEver = !hadAnyPrior
      let streakNights = player.streakNights
      const yesterday = previousCalendarDay(calendarDate)
      const hasYesterdayVisit = await ctx.db.dailyVisit.findUnique({
        where: { playerId_visitDate: { playerId, visitDate: yesterday } },
      })

      const newRowForToday = !existingToday
      if (newRowForToday) {
        if (hasYesterdayVisit) {
          streakNights = player.streakNights + 1
        } else if (!hadAnyPrior) {
          streakNights = 1
        } else {
          streakNights = 1
        }
        await ctx.db.dailyVisit.create({
          data: { playerId, visitDate: calendarDate },
        })
        await ctx.db.player.update({
          where: { id: playerId },
          data: { streakNights },
        })
        if (!hadAnyPrior) {
          await ctx.db.analyticsEvent.create({
            data: { name: 'first_visit', playerId },
          })
        } else if (distinctBeforeToday === 1) {
          await ctx.db.analyticsEvent.create({
            data: { name: 'second_day_return', playerId },
          })
        }
      } else {
        streakNights = player.streakNights
      }

      const shouldShowWelcomeBack = Boolean(
        newRowForToday && distinctBeforeToday === 1,
      )

      let returnStory: ReturnStory = 'none'
      if (newRowForToday) {
        if (wasFirstVisitEver) returnStory = 'first_day'
        else if (distinctBeforeToday === 1) returnStory = 'second_day'
        else returnStory = 'returning'
      }

      let noteShort: string | undefined
      if (activeNoteId) {
        const n = await ctx.db.note.findUnique({
          where: { id: activeNoteId },
          select: { short: true },
        })
        if (n) noteShort = n.short
      }

      const milestone =
        newRowForToday && RETURN_MILESTONES.includes(streakNights as (typeof RETURN_MILESTONES)[number])
          ? streakNights
          : 0

      return {
        streakNights,
        shouldShowWelcomeBack,
        returnStory,
        isFirstVisitEver: Boolean(newRowForToday && wasFirstVisitEver),
        noteShort,
        milestone,
      }
    }),

  revealDailyClaim: publicProcedure
    .input(revealDailyClaimInput)
    .output(revealDailyClaimOutput)
    .mutation(async ({ ctx, input }) => {
      if (!isValidYyyyMmDd(input.claimDate)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid claim date' })
      }
      const player = await ctx.db.player.findUnique({ where: { id: input.playerId } })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }
      const { claimDate, playerId, noteId, locale: loc } = input

      const existing = await ctx.db.dailyClaim.findUnique({
        where: { playerId_claimDate: { playerId, claimDate } },
        include: { teardropCard: { include: { texts: true } } },
      })
      if (existing) {
        return {
          isNew: false,
          claimDate: existing.claimDate,
          noteId: existing.noteId,
          glowKey: existing.glowKey as (typeof GLOW)[number],
          rareCaption: existing.rareCaption,
          teardrop: mapTeardropPublic(existing.teardropCard, loc),
        }
      }

      const note = await ctx.db.note.findUnique({ where: { id: noteId } })
      if (!note) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
      }
      const caps = await ctx.db.noteCaption.findMany({
        where: { noteId, locale: loc },
        orderBy: { orderIndex: 'desc' },
        take: 1,
      })
      const rareCaption =
        caps[0]?.body?.trim() ||
        (loc === 'pl' ? note.synestheticLinePl : note.synestheticTitlePl) ||
        note.name

      const links = await ctx.db.noteTeardropCard.findMany({
        where: { noteId },
        orderBy: { sortOrder: 'asc' },
        include: { card: { include: { texts: true } } },
      })

      const fromLinks =
        links.length > 0
          ? links[djb2U32(`${playerId}:${claimDate}`) % links.length]!.card
          : null
      const fromDeck =
        fromLinks ??
        (await ctx.db.teardropCard.findFirst({
          where: { deck: { slug: 'teardrop-oracle-deck-v0' } },
          orderBy: [{ phaseOrder: 'asc' }, { slug: 'asc' }],
          include: { texts: true },
        }))
      if (!fromDeck) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No teardrop card' })
      }
      const chosen = fromDeck

      const hGlow = djb2U32(`${playerId}:${claimDate}:${noteId}`)
      const glowKey = GLOW[hGlow % GLOW.length]!
      const created = await ctx.db.dailyClaim.create({
        data: {
          playerId,
          claimDate,
          noteId,
          glowKey,
          rareCaption,
          teardropCardId: chosen.id,
        },
        include: { teardropCard: { include: { texts: true } } },
      })
      await ctx.db.analyticsEvent.create({
        data: {
          name: 'daily_gift_revealed',
          playerId,
          meta: { noteId, claimDate } as object,
        },
      })
      return {
        isNew: true,
        claimDate: created.claimDate,
        noteId: created.noteId,
        glowKey: created.glowKey as (typeof GLOW)[number],
        rareCaption: created.rareCaption,
        teardrop: mapTeardropPublic(created.teardropCard, loc),
      }
    }),
})
