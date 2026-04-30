import { TRPCError, publicProcedure, router } from '../init'
import { isValidYyyyMmDd } from '@/lib/calendar-day'
import { LORE_THRESHOLDS_MINUTES } from '@/lib/progress'
import {
  dailyMissionSchema,
  getOrCreateInput,
  syncProgressInput,
} from '@/lib/validators/daily-mission'
import type { Note, Emotion, TeardropCard, TeardropCardText } from '@prisma/client'

const LIGHT_SIZE = 3
const SHADOW_SIZE = 3
const LIGHT_MAX_LORE_INDEX = 3

type MissionKind = 'light' | 'shadow'
type Locale = 'pl' | 'en'

type NoteWithEmotion = Note & { emotion: Emotion | null }

type MissionItemRow = {
  id: string
  orderIndex: number
  noteId: string
  targetLoreIndex: number
  kind: string
  completedAt: Date | null
  note: NoteWithEmotion
}

type CardWithTexts = TeardropCard & { texts: TeardropCardText[] }

type EnrichedCard = {
  name: string
  slug: string
  tagline: string | null
  meaning: string | null
}

function kindForLoreIndex(targetLoreIndex: number): MissionKind {
  return targetLoreIndex <= LIGHT_MAX_LORE_INDEX ? 'light' : 'shadow'
}

function progressPercent(totalListenTime: number, targetLoreIndex: number): number {
  const totalMinutes = Math.floor(totalListenTime / 60)
  const required = LORE_THRESHOLDS_MINUTES[targetLoreIndex - 1] ?? 120
  if (required === 0) return 0
  return Math.min(100, Math.floor((totalMinutes / required) * 100))
}

function minutesRemaining(totalListenTime: number, targetLoreIndex: number): number {
  const totalMinutes = Math.floor(totalListenTime / 60)
  const required = LORE_THRESHOLDS_MINUTES[targetLoreIndex - 1] ?? 120
  return Math.max(0, required - totalMinutes)
}

function toIso(d: Date | null): string | null {
  return d ? d.toISOString() : null
}

function pickText(
  texts: TeardropCardText[],
  field: string,
  locale: Locale,
): string | null {
  const exact = texts.find((t) => t.field === field && t.locale === locale)
  if (exact?.content) return exact.content
  const fallback = texts.find((t) => t.field === field && t.locale === 'pl')
  return fallback?.content ?? null
}

function emotionName(emotion: Emotion | null, locale: Locale): string | null {
  if (!emotion) return null
  if (locale === 'en') return emotion.nameEn ?? emotion.namePl
  return emotion.namePl
}

function synestheticTitle(note: Note, locale: Locale): string {
  if (locale === 'en') return note.name
  return note.synestheticTitlePl || note.name
}

const itemsInclude = {
  items: {
    include: {
      note: { include: { emotion: true } },
    },
    orderBy: { orderIndex: 'asc' as const },
  },
}

async function loadCardMap(
  db: typeof import('@/lib/db').db,
  noteIds: string[],
  kind: MissionKind,
): Promise<Map<string, CardWithTexts[]>> {
  if (noteIds.length === 0) return new Map()
  const links = await db.noteTeardropCard.findMany({
    where: { noteId: { in: noteIds } },
    orderBy: { sortOrder: 'asc' },
    include: { card: { include: { texts: true } } },
  })
  const map = new Map<string, CardWithTexts[]>()
  for (const link of links) {
    if (!map.has(link.noteId)) map.set(link.noteId, [])
    map.get(link.noteId)!.push(link.card)
  }
  return map
}

function pickCardForItem(
  cards: CardWithTexts[] | undefined,
  targetLoreIndex: number,
  kind: MissionKind,
  locale: Locale,
): EnrichedCard | null {
  if (!cards || cards.length === 0) return null
  const idx = Math.min(cards.length - 1, Math.max(0, targetLoreIndex - 1))
  const card = cards[idx]!
  return {
    name: card.name,
    slug: card.slug,
    tagline: pickText(card.texts, 'tagline', locale),
    meaning: pickText(
      card.texts,
      kind === 'shadow' ? 'meaningShadow' : 'meaningUpright',
      locale,
    ),
  }
}

function buildItemDto(
  item: MissionItemRow,
  listenTime: number,
  cardsByNote: Map<string, CardWithTexts[]>,
  locale: Locale,
  doneOverride: boolean = false,
) {
  const totalMinutes = Math.floor(listenTime / 60)
  const itemKind: MissionKind =
    item.kind === 'shadow' ? 'shadow' : 'light'
  const card = pickCardForItem(
    cardsByNote.get(item.noteId),
    item.targetLoreIndex,
    itemKind,
    locale,
  )
  const isDone = doneOverride || item.completedAt !== null
  return {
    id: item.id,
    orderIndex: item.orderIndex,
    noteId: item.noteId,
    noteShort: item.note.short,
    noteName: item.note.name,
    noteChromaHex: item.note.chromaHex,
    noteSynestheticTitle: synestheticTitle(item.note, locale),
    noteSynestheticLine: item.note.synestheticLinePl || null,
    noteElement: item.note.element || null,
    noteEmotionName: emotionName(item.note.emotion, locale),
    targetLoreIndex: item.targetLoreIndex,
    kind: itemKind,
    teardropCardName: card?.name ?? null,
    teardropCardTagline: card?.tagline ?? null,
    teardropCardMeaning: card?.meaning ?? null,
    teardropCardSlug: card?.slug ?? null,
    progressPercent: isDone ? 100 : progressPercent(listenTime, item.targetLoreIndex),
    minutesRequired: LORE_THRESHOLDS_MINUTES[item.targetLoreIndex - 1] ?? 120,
    minutesListened: totalMinutes,
    completedAt:
      isDone && item.completedAt === null
        ? new Date().toISOString()
        : toIso(item.completedAt),
  }
}

export const dailyMissionRouter = router({
  getOrCreate: publicProcedure
    .input(getOrCreateInput)
    .output(dailyMissionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isValidYyyyMmDd(input.missionDate)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid mission date' })
      }
      const locale: Locale = input.locale === 'en' ? 'en' : 'pl'

      const player = await ctx.db.player.findUnique({ where: { id: input.playerId } })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }

      const existing = await ctx.db.dailyMission.findUnique({
        where: {
          playerId_missionDate: {
            playerId: input.playerId,
            missionDate: input.missionDate,
          },
        },
        include: itemsInclude,
      })

      if (existing) {
        const noteIds = existing.items.map((i) => i.noteId)
        const soundies = await ctx.db.soundie.findMany({
          where: { playerId: input.playerId, noteId: { in: noteIds } },
          select: { noteId: true, totalListenTime: true, loreUnlocked: true },
        })
        const timeByNote = Object.fromEntries(
          soundies.map((s) => [s.noteId, s.totalListenTime]),
        )
        const cardsByNote = await loadCardMap(ctx.db, noteIds, 'light')
        return {
          id: existing.id,
          missionDate: existing.missionDate,
          completedAt: toIso(existing.completedAt),
          allDone:
            existing.items.length > 0 &&
            existing.items.every((i) => i.completedAt !== null),
          doneCount: existing.items.filter((i) => i.completedAt !== null).length,
          totalCount: existing.items.length,
          items: existing.items.map((item) =>
            buildItemDto(item, timeByNote[item.noteId] ?? 0, cardsByNote, locale),
          ),
        }
      }

      const soundies = await ctx.db.soundie.findMany({
        where: { playerId: input.playerId, loreUnlocked: { lt: 5 } },
        include: { note: { include: { emotion: true } } },
        orderBy: { note: { sortOrder: 'asc' } },
      })

      if (soundies.length === 0) {
        const mission = await ctx.db.dailyMission.create({
          data: { playerId: input.playerId, missionDate: input.missionDate },
          include: itemsInclude,
        })
        return {
          id: mission.id,
          missionDate: mission.missionDate,
          completedAt: toIso(mission.completedAt),
          allDone: false,
          doneCount: 0,
          totalCount: 0,
          items: [],
        }
      }

      const candidates = soundies.map((s) => {
        const targetLoreIndex = s.loreUnlocked + 1
        const minsLeft = minutesRemaining(s.totalListenTime, targetLoreIndex)
        const kind: MissionKind = kindForLoreIndex(targetLoreIndex)
        return { soundie: s, targetLoreIndex, minsLeft, kind }
      })

      candidates.sort((a, b) => a.minsLeft - b.minsLeft)

      const lightPool = candidates.filter((c) => c.kind === 'light')
      const shadowPool = candidates.filter((c) => c.kind === 'shadow')

      const lightSelected = lightPool.slice(0, LIGHT_SIZE)
      const shadowSelected = shadowPool.slice(0, SHADOW_SIZE)

      const lightFill = Math.max(0, LIGHT_SIZE - lightSelected.length)
      if (lightFill > 0) {
        const extra = shadowPool
          .filter((c) => !shadowSelected.includes(c))
          .slice(0, lightFill)
        for (const c of extra) lightSelected.push(c)
      }
      const shadowFill = Math.max(0, SHADOW_SIZE - shadowSelected.length)
      if (shadowFill > 0) {
        const extra = lightPool
          .filter((c) => !lightSelected.includes(c))
          .slice(0, shadowFill)
        for (const c of extra) shadowSelected.push(c)
      }

      const ordered = [
        ...lightSelected.map((c) => ({ ...c, displayKind: 'light' as MissionKind })),
        ...shadowSelected.map((c) => ({ ...c, displayKind: 'shadow' as MissionKind })),
      ]

      const created = await ctx.db.dailyMission.create({
        data: {
          playerId: input.playerId,
          missionDate: input.missionDate,
          items: {
            create: ordered.map((c, i) => ({
              orderIndex: i,
              noteId: c.soundie.noteId,
              targetLoreIndex: c.targetLoreIndex,
              kind: c.displayKind,
              completedAt:
                c.soundie.loreUnlocked >= c.targetLoreIndex ? new Date() : null,
            })),
          },
        },
        include: itemsInclude,
      })

      const timeByNote = Object.fromEntries(
        ordered.map((c) => [c.soundie.noteId, c.soundie.totalListenTime]),
      )
      const noteIds = created.items.map((i) => i.noteId)
      const cardsByNote = await loadCardMap(ctx.db, noteIds, 'light')

      return {
        id: created.id,
        missionDate: created.missionDate,
        completedAt: toIso(created.completedAt),
        allDone:
          created.items.length > 0 && created.items.every((i) => i.completedAt !== null),
        doneCount: created.items.filter((i) => i.completedAt !== null).length,
        totalCount: created.items.length,
        items: created.items.map((item) =>
          buildItemDto(item, timeByNote[item.noteId] ?? 0, cardsByNote, locale),
        ),
      }
    }),

  syncProgress: publicProcedure
    .input(syncProgressInput)
    .output(dailyMissionSchema.nullable())
    .mutation(async ({ ctx, input }) => {
      if (!isValidYyyyMmDd(input.missionDate)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid mission date' })
      }
      const locale: Locale = input.locale === 'en' ? 'en' : 'pl'

      const mission = await ctx.db.dailyMission.findUnique({
        where: {
          playerId_missionDate: {
            playerId: input.playerId,
            missionDate: input.missionDate,
          },
        },
        include: itemsInclude,
      })
      if (!mission) return null

      const noteIds = mission.items.map((i) => i.noteId)
      const cardsByNote = await loadCardMap(ctx.db, noteIds, 'light')

      const incompleteItems = mission.items.filter((i) => i.completedAt === null)

      if (incompleteItems.length === 0) {
        const soundies = await ctx.db.soundie.findMany({
          where: { playerId: input.playerId, noteId: { in: noteIds } },
          select: { noteId: true, totalListenTime: true },
        })
        const timeByNote = Object.fromEntries(
          soundies.map((s) => [s.noteId, s.totalListenTime]),
        )
        return {
          id: mission.id,
          missionDate: mission.missionDate,
          completedAt: toIso(mission.completedAt),
          allDone: mission.items.length > 0,
          doneCount: mission.items.length,
          totalCount: mission.items.length,
          items: mission.items.map((item) =>
            buildItemDto(item, timeByNote[item.noteId] ?? 0, cardsByNote, locale),
          ),
        }
      }

      const soundies = await ctx.db.soundie.findMany({
        where: { playerId: input.playerId, noteId: { in: noteIds } },
        select: { noteId: true, loreUnlocked: true, totalListenTime: true },
      })
      const soundieByNote = Object.fromEntries(soundies.map((s) => [s.noteId, s]))

      const nowCompleted: string[] = []
      for (const item of incompleteItems) {
        const s = soundieByNote[item.noteId]
        if (s && s.loreUnlocked >= item.targetLoreIndex) {
          nowCompleted.push(item.id)
        }
      }

      if (nowCompleted.length > 0) {
        await ctx.db.dailyMissionItem.updateMany({
          where: { id: { in: nowCompleted } },
          data: { completedAt: new Date() },
        })
      }

      const refreshed = await ctx.db.dailyMission.findUnique({
        where: {
          playerId_missionDate: {
            playerId: input.playerId,
            missionDate: input.missionDate,
          },
        },
        include: itemsInclude,
      })
      if (!refreshed) return null

      const allDoneNow =
        refreshed.items.length > 0 &&
        refreshed.items.every((i) => i.completedAt !== null)

      if (allDoneNow && !refreshed.completedAt) {
        await ctx.db.dailyMission.update({
          where: { id: refreshed.id },
          data: { completedAt: new Date() },
        })
        await ctx.db.analyticsEvent.create({
          data: {
            name: 'daily_mission_complete',
            playerId: input.playerId,
            meta: { missionDate: input.missionDate } as object,
          },
        })
      }

      const timeByNote = Object.fromEntries(
        soundies.map((s) => [s.noteId, s.totalListenTime]),
      )
      const doneCount = refreshed.items.filter((i) => i.completedAt !== null).length

      return {
        id: refreshed.id,
        missionDate: refreshed.missionDate,
        completedAt: toIso(allDoneNow ? new Date() : refreshed.completedAt),
        allDone: allDoneNow,
        doneCount: allDoneNow ? refreshed.items.length : doneCount,
        totalCount: refreshed.items.length,
        items: refreshed.items.map((item) => {
          const completedNow = nowCompleted.includes(item.id)
          return buildItemDto(
            item,
            timeByNote[item.noteId] ?? 0,
            cardsByNote,
            locale,
            completedNow,
          )
        }),
      }
    }),
})
