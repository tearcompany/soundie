import { z } from 'zod'
import { publicProcedure, router } from '../init'
import { emotionBalanceOutputSchema, moodPulseOutputSchema, resonanceTraceOutputSchema } from '@/lib/validators/resonance'
import { EMOTIONS, NOTE_LIST } from '@/lib/notes'
import { getNoteHealingProfile } from '@/lib/note-healing-profiles'
import { phaseFromSessionDuration } from '@/lib/soundie-rituals'

const MOOD_WEIGHT: Record<string, number> = {
  hopeful: 2,
  anxious: -1,
  numb: -1,
  heavy: -1,
  scattered: -1,
}

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

const SHADOW_MOODS = new Set(['anxious', 'numb', 'heavy', 'scattered'])
const LIGHT_MOODS = new Set(['hopeful'])

export const resonanceRouter = router({
  getShadowLight: publicProcedure
    .input(
      z.object({
        playerId: z.string().cuid(),
        lookbackDays: z.number().int().min(7).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Each session contributes: actual duration + SESSION_COUNT_BONUS per play
      // This way days with many short sessions are visible alongside long single sessions
      const SESSION_COUNT_BONUS = 3 // minutes added per session for "showing up"

      const since = new Date(Date.now() - input.lookbackDays * 24 * 60 * 60 * 1000)

      const [sessions, visits, mindful] = await Promise.all([
        ctx.db.listenSession.findMany({
          where: { playerId: input.playerId, completedAt: { gte: since } },
          orderBy: { completedAt: 'asc' },
          select: {
            completedAt: true,
            duration: true,
            reflection: { select: { moodBefore: true, moodAfter: true } },
          },
        }),
        ctx.db.dailyVisit.findMany({
          where: { playerId: input.playerId, createdAt: { gte: since } },
          select: { visitDate: true },
        }),
        ctx.db.mindfulMomentLog.findMany({
          where: { playerId: input.playerId, completedAt: { gte: since } },
          select: { completedAt: true },
        }),
      ])

      type Bucket = {
        shadow: number       // composite score (mins + count bonus)
        light: number        // composite score (mins + count bonus)
        shadowSessions: number
        lightSessions: number
        shadowMins: number
        lightMins: number
      }
      const buckets = new Map<string, Bucket>()
      const getOrCreate = (date: string): Bucket => {
        if (!buckets.has(date)) {
          buckets.set(date, { shadow: 0, light: 0, shadowSessions: 0, lightSessions: 0, shadowMins: 0, lightMins: 0 })
        }
        return buckets.get(date)!
      }

      for (const s of sessions) {
        const date = s.completedAt.toISOString().slice(0, 10)
        const b = getOrCreate(date)
        const mins = s.duration / 60
        const before = s.reflection?.moodBefore ?? null
        const after = s.reflection?.moodAfter ?? null

        if (before && SHADOW_MOODS.has(before)) {
          // Came with shadow: duration + count bonus → shadow
          b.shadow += mins + SESSION_COUNT_BONUS
          b.shadowSessions += 1
          b.shadowMins += mins
          // Healed: some of that also lands in light
          if (after && LIGHT_MOODS.has(after)) {
            b.light += (mins + SESSION_COUNT_BONUS) * 0.5
            b.lightSessions += 1
            b.lightMins += mins * 0.5
          }
        } else {
          // Hopeful start, no reflection, or unknown → light presence
          b.light += mins + SESSION_COUNT_BONUS
          b.lightSessions += 1
          b.lightMins += mins
        }
      }

      for (const v of visits) {
        // Daily visit: +SESSION_COUNT_BONUS to light (just showing up)
        const b = getOrCreate(v.visitDate)
        b.light += SESSION_COUNT_BONUS
      }

      for (const m of mindful) {
        const date = m.completedAt.toISOString().slice(0, 10)
        const b = getOrCreate(date)
        b.light += SESSION_COUNT_BONUS
      }

      const r1 = (n: number) => Math.round(n * 10) / 10

      // Fill every day in range so chart has no gaps
      const days = []
      for (let d = 0; d < input.lookbackDays; d++) {
        const date = new Date(since.getTime() + d * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10)
        const b = buckets.get(date)
        days.push({
          date,
          shadow: r1(b?.shadow ?? 0),
          light: r1(b?.light ?? 0),
          shadowSessions: b?.shadowSessions ?? 0,
          lightSessions: b?.lightSessions ?? 0,
          shadowMins: r1(b?.shadowMins ?? 0),
          lightMins: r1(b?.lightMins ?? 0),
        })
      }

      return { days }
    }),

  getHealingJourney: publicProcedure
    .input(
      z.object({
        playerId: z.string().cuid(),
        locale: z.enum(['en', 'pl']).default('pl'),
        lookbackDays: z.number().int().min(7).max(365).default(60),
      }),
    )
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.lookbackDays * 24 * 60 * 60 * 1000)

      const sessions = await ctx.db.listenSession.findMany({
        where: { playerId: input.playerId, completedAt: { gte: since } },
        orderBy: { completedAt: 'asc' },
        select: {
          duration: true,
          completedAt: true,
          reflection: { select: { moodBefore: true, moodAfter: true } },
          soundie: {
            select: {
              note: {
                select: { id: true, short: true, name: true, chromaHex: true, synestheticLinePl: true },
              },
            },
          },
        },
      })

      type NoteRow = {
        noteId: string
        noteShort: string
        noteName: string
        noteHex: string
        synestheticLine: string
        totalMinutes: number
        totalSessions: number
        // profile fields
        treats: string[]
        heals: string[]
        transforms: string[]
        energyTone: string
        shortMeaning: string
        archetype: string
        // mood data
        moodBeforeCounts: Record<string, number>
        moodAfterCounts: Record<string, number>
        healingMoments: number      // sessions where mood improved (shadow→light)
        shadowSessions: number      // sessions where moodBefore was shadow
        lightSessions: number       // sessions where moodBefore was hopeful or no mood
      }

      const byNote = new Map<string, NoteRow>()

      for (const s of sessions) {
        const note = s.soundie.note
        let row = byNote.get(note.id)
        if (!row) {
          const profile = getNoteHealingProfile(note.id, input.locale)
          row = {
            noteId: note.id,
            noteShort: note.short,
            noteName: note.name,
            noteHex: note.chromaHex,
            synestheticLine: note.synestheticLinePl ?? '',
            totalMinutes: 0,
            totalSessions: 0,
            treats: profile?.treats ?? [],
            heals: profile?.heals ?? [],
            transforms: profile?.transforms ?? [],
            energyTone: profile?.energyTone ?? '',
            shortMeaning: profile?.shortMeaning ?? '',
            archetype: profile?.archetype ?? '',
            moodBeforeCounts: {},
            moodAfterCounts: {},
            healingMoments: 0,
            shadowSessions: 0,
            lightSessions: 0,
          }
          byNote.set(note.id, row)
        }

        const mins = Math.round((s.duration / 60) * 10) / 10
        row.totalMinutes += mins
        row.totalSessions += 1

        const before = s.reflection?.moodBefore ?? null
        const after = s.reflection?.moodAfter ?? null

        if (before) {
          row.moodBeforeCounts[before] = (row.moodBeforeCounts[before] ?? 0) + 1
          const bw = MOOD_WEIGHT[before] ?? 0
          if (bw < 0) row.shadowSessions += 1
          else row.lightSessions += 1
        } else {
          row.lightSessions += 1 // presence without burden = light
        }

        if (after) {
          row.moodAfterCounts[after] = (row.moodAfterCounts[after] ?? 0) + 1
        }

        // Healing moment: came in shadow, left in light
        const bw = before ? (MOOD_WEIGHT[before] ?? 0) : 0
        const aw = after ? (MOOD_WEIGHT[after] ?? 0) : 0
        if (bw < 0 && aw > 0) row.healingMoments += 1
      }

      const noteJourneys = Array.from(byNote.values()).sort(
        (a, b) => b.totalMinutes - a.totalMinutes,
      )

      return { noteJourneys }
    }),

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

  /** Per-emotion balance of inLight vs inShadow seconds (today + this week). */
  getEmotionBalance: publicProcedure
    .input(
      z.object({
        playerId: z.string().cuid(),
        locale: z.enum(['en', 'pl']),
        dayStartIso: z.string().optional(),
      }),
    )
    .output(emotionBalanceOutputSchema)
    .query(async ({ ctx, input }) => {
      const ECHO_BONUS = 45        // extra inLight seconds when echo captured near session
      const MOOD_BONUS = 20        // extra seconds per mood signal
      const ECHO_MATCH_WINDOW = 14 * 60 * 1000

      // Per-session classification:
      // session >= 180s                           → all to inLight
      // session <  90s + shadow mood              → all to inShadow
      // session <  90s + no shadow mood           → 35% inLight, 65% inShadow (uncertainty leans shadow)
      // session 90–179s                           → 65% inLight, 35% inShadow (partial presence leans light)
      // echo captured near session                → +ECHO_BONUS to inLight
      // moodBefore == 'hopeful'                   → +MOOD_BONUS to inLight
      // moodBefore in shadow set                  → +MOOD_BONUS to inShadow

      const today = input.dayStartIso ? new Date(input.dayStartIso) : (() => {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d
      })()
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const [sessions, echoEntries] = await Promise.all([
        ctx.db.listenSession.findMany({
          where: { playerId: input.playerId, completedAt: { gte: weekAgo } },
          orderBy: { completedAt: 'asc' },
          select: {
            completedAt: true,
            duration: true,
            reflection: { select: { moodBefore: true } },
            soundie: { select: { note: { select: { id: true, emotionId: true } } } },
          },
        }),
        ctx.db.echoEntry.findMany({
          where: { playerId: input.playerId, savedAt: { gte: weekAgo } },
          select: { noteId: true, savedAt: true },
        }),
      ])

      // Build a fast echo lookup: noteId → sorted timestamps
      const echoByNote = new Map<string, number[]>()
      for (const e of echoEntries) {
        const arr = echoByNote.get(e.noteId) ?? []
        arr.push(e.savedAt.getTime())
        echoByNote.set(e.noteId, arr)
      }
      const hasEchoNear = (noteId: string, completedAtMs: number): boolean => {
        const arr = echoByNote.get(noteId) ?? []
        return arr.some((t) => Math.abs(t - completedAtMs) <= ECHO_MATCH_WINDOW)
      }

      type Acc = { inLight: number; inShadow: number }
      const todayAcc = new Map<string, Acc>()
      const weekAcc = new Map<string, Acc>()
      // First-half vs second-half of week for shift detection
      const midWeek = new Date(weekAgo.getTime() + 3.5 * 24 * 60 * 60 * 1000)
      const earlyAcc: Acc = { inLight: 0, inShadow: 0 }
      const lateAcc: Acc = { inLight: 0, inShadow: 0 }

      const ensureAcc = (map: Map<string, Acc>, eid: string) => {
        if (!map.has(eid)) map.set(eid, { inLight: 0, inShadow: 0 })
        return map.get(eid)!
      }

      for (const s of sessions) {
        const emotionId = s.soundie.note.emotionId
        if (!emotionId) continue
        const completedMs = s.completedAt.getTime()
        const dur = s.duration
        const mood = s.reflection?.moodBefore ?? null
        const isShadowMood = mood ? SHADOW_MOODS.has(mood) : false
        const isLightMood = mood ? LIGHT_MOODS.has(mood) : false
        const echo = hasEchoNear(s.soundie.note.id, completedMs)

        let inLight = 0
        let inShadow = 0

        if (dur >= 180) {
          inLight = dur
        } else if (dur < 90 && isShadowMood) {
          inShadow = dur
        } else if (dur < 90) {
          inLight = dur * 0.35
          inShadow = dur * 0.65
        } else {
          inLight = dur * 0.65
          inShadow = dur * 0.35
        }

        if (echo) inLight += ECHO_BONUS
        if (isLightMood) inLight += MOOD_BONUS
        if (isShadowMood) inShadow += MOOD_BONUS

        const wAcc = ensureAcc(weekAcc, emotionId)
        wAcc.inLight += inLight
        wAcc.inShadow += inShadow

        const isToday = s.completedAt >= today
        if (isToday) {
          const tAcc = ensureAcc(todayAcc, emotionId)
          tAcc.inLight += inLight
          tAcc.inShadow += inShadow
        }

        // shift half-detection
        const halfAcc = s.completedAt < midWeek ? earlyAcc : lateAcc
        halfAcc.inLight += inLight
        halfAcc.inShadow += inShadow
      }

      // Build per-emotion lookup: noteHex from NOTE_LIST
      const noteHexByEmotion = new Map<string, string>()
      for (const n of NOTE_LIST) {
        if (n.emotionId && !noteHexByEmotion.has(n.emotionId)) {
          noteHexByEmotion.set(n.emotionId, n.chromaHex)
        }
      }

      const buildRows = (acc: Map<string, Acc>) =>
        EMOTIONS
          .map((e) => {
            const a = acc.get(e.id)
            if (!a) return null
            const total = a.inLight + a.inShadow
            if (total < 5) return null
            return {
              emotionId: e.id,
              namePl: e.namePl,
              nameEn: e.nameEn ?? null,
              noteHex: noteHexByEmotion.get(e.id) ?? '#8b7b6a',
              inLightSeconds: Math.round(a.inLight),
              inShadowSeconds: Math.round(a.inShadow),
              totalSeconds: Math.round(total),
            }
          })
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .sort((a, b) => b.totalSeconds - a.totalSeconds)

      const today_rows = buildRows(todayAcc)
      const week_rows = buildRows(weekAcc)

      // Weekly shift
      const earlyLean =
        earlyAcc.inLight + earlyAcc.inShadow < 30
          ? null
          : (earlyAcc.inLight - earlyAcc.inShadow) / (earlyAcc.inLight + earlyAcc.inShadow)
      const lateLean =
        lateAcc.inLight + lateAcc.inShadow < 30
          ? null
          : (lateAcc.inLight - lateAcc.inShadow) / (lateAcc.inLight + lateAcc.inShadow)

      let weeklyShift: 'toward_light' | 'toward_shadow' | 'steady' | 'new_arrival'
      if (week_rows.length === 0) {
        weeklyShift = 'new_arrival'
      } else if (earlyLean === null || lateLean === null) {
        weeklyShift = 'steady'
      } else {
        const diff = lateLean - earlyLean
        if (diff > 0.08) weeklyShift = 'toward_light'
        else if (diff < -0.08) weeklyShift = 'toward_shadow'
        else weeklyShift = 'steady'
      }

      // Most shifted emotion (biggest change in light−shadow between early/late half)
      let shiftEmotionId: string | null = null
      let bestShiftAbs = 0
      for (const e of EMOTIONS) {
        const a = weekAcc.get(e.id)
        if (!a) continue
        const netTotal = a.inLight + a.inShadow
        if (netTotal < 30) continue
        const net = Math.abs(a.inLight - a.inShadow) / netTotal
        if (net > bestShiftAbs) {
          bestShiftAbs = net
          shiftEmotionId = e.id
        }
      }
      const shiftEmotion = shiftEmotionId ? EMOTIONS.find((e) => e.id === shiftEmotionId) : null

      return {
        today: today_rows,
        week: week_rows,
        weeklyShift,
        shiftEmotionId,
        shiftEmotionNamePl: shiftEmotion?.namePl ?? null,
        shiftEmotionNameEn: shiftEmotion?.nameEn ?? null,
      }
    }),

  /** Per-note light/shadow density over recent minutes (sessions, Teardrop focus, mood entries) + soft mood hint. */
  getMoodPulse: publicProcedure
    .input(
      z.object({
        playerId: z.string().cuid(),
        noteId: z.string(),
        locale: z.enum(['en', 'pl']),
        windowMinutes: z.number().int().min(10).max(120).default(20),
      }),
    )
    .output(moodPulseOutputSchema)
    .query(async ({ ctx, input }) => {
      const SESSION_COUNT_BONUS = 3
      const windowMs = input.windowMinutes * 60 * 1000
      const windowEnd = Date.now()
      const windowStart = windowEnd - windowMs
      const bucketCount = input.windowMinutes
      const buckets = Array.from({ length: bucketCount }, (_, index) => ({
        index,
        light: 0,
        shadow: 0,
      }))

      const spreadAcrossWindow = (
        eventStartMs: number,
        eventEndMs: number,
        totalLight: number,
        totalShadow: number,
      ) => {
        const n = buckets.length
        const bucketMs = (windowEnd - windowStart) / n
        const s = Math.max(eventStartMs, windowStart)
        const e = Math.min(eventEndMs, windowEnd)
        if (e <= s) return
        const span = e - s
        const lr = totalLight / span
        const sr = totalShadow / span
        for (let i = 0; i < n; i++) {
          const b0 = windowStart + i * bucketMs
          const b1 = b0 + bucketMs
          const ov = Math.max(0, Math.min(e, b1) - Math.max(s, b0))
          if (ov <= 0) continue
          buckets[i].light += lr * ov
          buckets[i].shadow += sr * ov
        }
      }

      const moodEntryImpulse = (mood: string): { L: number; S: number } => {
        if (LIGHT_MOODS.has(mood)) return { L: 2.8, S: 0 }
        if (SHADOW_MOODS.has(mood)) return { L: 0, S: 2.4 }
        return { L: 0.4, S: 0.4 }
      }

      const [sessions, focusSessions, moodEntries, teardropLink] = await Promise.all([
        ctx.db.listenSession.findMany({
          where: {
            playerId: input.playerId,
            completedAt: { gte: new Date(windowStart) },
            soundie: { noteId: input.noteId },
          },
          orderBy: { completedAt: 'asc' },
          select: {
            completedAt: true,
            duration: true,
            reflection: { select: { moodBefore: true, moodAfter: true } },
          },
        }),
        ctx.db.teardropFocusSession.findMany({
          where: {
            playerId: input.playerId,
            noteId: input.noteId,
            endedAt: { gte: new Date(windowStart) },
          },
          select: { startedAt: true, endedAt: true, durationMs: true },
        }),
        ctx.db.moodEntry.findMany({
          where: {
            playerId: input.playerId,
            noteId: input.noteId,
            createdAt: { gte: new Date(windowStart) },
          },
          select: { mood: true, createdAt: true },
        }),
        ctx.db.noteTeardropCard.findFirst({
          where: { noteId: input.noteId },
          orderBy: { sortOrder: 'asc' },
          include: { card: { include: { texts: true } } },
        }),
      ])

      for (const s of sessions) {
        const end = s.completedAt.getTime()
        const start = end - s.duration * 1000
        const weight = s.duration / 60 + SESSION_COUNT_BONUS
        const before = s.reflection?.moodBefore ?? null
        const after = s.reflection?.moodAfter ?? null
        let totalShadow = 0
        let totalLight = 0
        if (before && SHADOW_MOODS.has(before)) {
          totalShadow = weight
          if (after && LIGHT_MOODS.has(after)) {
            totalLight = weight * 0.5
          }
        } else {
          totalLight = weight
        }
        spreadAcrossWindow(start, end, totalLight, totalShadow)
      }

      for (const f of focusSessions) {
        const start = f.startedAt.getTime()
        const end = f.endedAt.getTime()
        const mins = f.durationMs / 60_000 + 0.35
        spreadAcrossWindow(start, end, mins, 0)
      }

      for (const m of moodEntries) {
        const t = m.createdAt.getTime()
        const { L, S } = moodEntryImpulse(m.mood)
        spreadAcrossWindow(t - 25_000, t + 25_000, L, S)
      }

      const r4 = (n: number) => Math.round(n * 10000) / 10000
      const roundedBuckets = buckets.map((b) => ({
        index: b.index,
        light: r4(b.light),
        shadow: r4(b.shadow),
      }))

      const totalEnergy = roundedBuckets.reduce((acc, b) => acc + b.light + b.shadow, 0)
      const hasSignal = totalEnergy > 0.02

      const nets = roundedBuckets.map((b) => b.light - b.shadow)
      const half = Math.max(1, Math.floor(bucketCount / 2))
      const earlyAvg = nets.slice(0, half).reduce((a, x) => a + x, 0) / half
      const lateAvg = nets.slice(half).reduce((a, x) => a + x, 0) / (bucketCount - half)
      const trend = lateAvg - earlyAvg
      const amp = Math.max(0.2, totalEnergy / Math.max(1, bucketCount))
      const projected = lateAvg + trend * 0.4

      let forecastKind: 'toward_light' | 'toward_shadow' | 'steady'
      if (trend > amp * 0.06) forecastKind = 'toward_light'
      else if (trend < -amp * 0.06) forecastKind = 'toward_shadow'
      else forecastKind = 'steady'

      let forecastMoodId: 'hopeful' | 'anxious' | 'numb' | 'heavy' | 'scattered'
      if (projected > amp * 0.08) {
        forecastMoodId = 'hopeful'
      } else if (projected < -amp * 0.08) {
        forecastMoodId = 'heavy'
      } else if (forecastKind === 'toward_shadow') {
        forecastMoodId = 'anxious'
      } else if (forecastKind === 'toward_light') {
        forecastMoodId = 'hopeful'
      } else {
        forecastMoodId = 'scattered'
      }

      const uprightRaw = teardropLink
        ? fieldContent(teardropLink.card.texts, 'meaning_upright', input.locale)
        : null
      const shadowRaw = teardropLink
        ? fieldContent(teardropLink.card.texts, 'meaning_shadow', input.locale)
        : null
      const teardropLightLine = uprightRaw ? firstVisualLine(uprightRaw, 96) : null
      const teardropShadowLine = shadowRaw ? firstVisualLine(shadowRaw, 96) : null

      return {
        buckets: roundedBuckets,
        windowMinutes: input.windowMinutes,
        teardropLightLine,
        teardropShadowLine,
        forecastKind,
        forecastMoodId,
        hasSignal,
      }
    }),
})
