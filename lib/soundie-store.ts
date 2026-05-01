import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import { DEFAULT_NOTE_ID, isValidNoteId } from '@/lib/notes'
import type {
  RitualAttributionSegment,
  RitualSealPayload,
} from '@/lib/soundie-rituals'
import {
  levelFromTotalListenSeconds,
  loreUnlockedFromTotalListenSeconds,
} from '@/lib/progress'

const ProgressSchema = z.object({
  level: z.number().int().min(1).max(5),
  totalListenTime: z.number().nonnegative(),
  loreUnlocked: z.number().int().min(0).max(5),
  lastSeen: z.string().datetime(),
})

const SessionSchema = z.object({
  active: z.boolean(),
  startedAt: z.number(),
  duration: z.number().positive(),
  elapsed: z.number().nonnegative(),
})

const DailyGiftGlowSchema = z.enum(['dawn', 'dusk', 'nocturne'])
const SessionMoodBeforeSchema = z.enum(['anxious', 'numb', 'heavy', 'scattered', 'hopeful'])

const RitualSealSchema = z.object({
  ritualKey: z.enum(['warmth', 'clarity', 'grounding', 'energy', 'release']),
  ritualId: z.string(),
  dominantNoteId: z.string(),
  entryNoteId: z.string(),
  notesInvolved: z.array(z.string()),
  phrase: z.string(),
  elapsedSeconds: z.number().nonnegative(),
  sealedAt: z.string().datetime(),
})

const SoundieStateSchema = z.object({
  activeNoteId: z.string(),
  playerId: z.string().cuid().nullable(),
  progressByNoteId: z.record(z.string(), ProgressSchema),
  currentSession: SessionSchema,
  teardropShelfOpen: z.boolean(),
  dailyGiftGlow: DailyGiftGlowSchema.nullable(),
  dailyGiftForNoteId: z.string().nullable(),
  dailyGiftCaption: z.string().nullable(),
  pendingListenFromDailyGift: z.boolean(),
  activeRitualId: z.string().nullable(),
  ritualSeal: RitualSealSchema.nullable(),
  sessionMoodBefore: SessionMoodBeforeSchema.nullable(),
  lastCompletedSessionId: z.string().cuid().nullable(),
  lastReflectionId: z.string().cuid().nullable(),
})

export type Progress = z.infer<typeof ProgressSchema>
export type Session = z.infer<typeof SessionSchema>
export type SoundieState = z.infer<typeof SoundieStateSchema>
type PersistedSoundieState = Pick<
  SoundieState,
  'activeNoteId' | 'playerId' | 'progressByNoteId' | 'currentSession' | 'teardropShelfOpen' | 'activeRitualId'
>

interface SoundieStore extends SoundieState {
  hasHydrated: boolean
  /** Continuous low-volume note bed — not persisted (no surprise autoplay after reload). */
  presenceEnabled: boolean
  setPresenceEnabled: (v: boolean) => void
  /** True while the main Teraz player holds the sound field (session or listen tone). */
  mainListenActive: boolean
  setMainListenActive: (v: boolean) => void
  pendingLoreFocusIndex: number | null
  startSession: (durationSeconds?: number) => void
  stopSession: () => void
  updateSessionElapsed: (elapsed: number) => void
  completeSession: () => void
  unlockLore: () => void
  ensureLoreUnlockedAtLeast: (target: number) => void
  setActiveNote: (id: string) => void
  setPlayerId: (id: string | null) => void
  setTeardropShelfOpen: (open: boolean) => void
  setPendingLoreFocusIndex: (idx: number | null) => void
  focusNoteFragment: (noteId: string, loreIndexZeroBased: number, openShelf?: boolean) => void
  applyDailyClaim: (
    payload: { noteId: string; glowKey: 'dawn' | 'dusk' | 'nocturne'; rareCaption: string } | null,
    activeNoteId: string
  ) => void
  setPendingListenFromDailyGift: (v: boolean) => void
  moodEntranceCleared: boolean
  setMoodEntranceCleared: (v: boolean) => void
  sessionMoodReaction: string | null
  setSessionMoodReaction: (v: string | null) => void
  setSessionMoodBefore: (v: z.infer<typeof SessionMoodBeforeSchema> | null) => void
  setLastSessionReflection: (sessionId: string | null, reflectionId: string | null) => void
  clearLastSessionReflection: () => void
  markHydrated: () => void
  syncFromRemote: (
    row: { totalListenTime: number; level: number; loreUnlocked: number } | null,
    noteId: string
  ) => void
  reset: () => void
  setActiveRitualId: (id: string | null) => void
  completeRitualListen: (
    segments: RitualAttributionSegment[],
    seal?: RitualSealPayload | null
  ) => void
}

export const EMPTY_NOTE_PROGRESS: Progress = Object.freeze({
  level: 1,
  totalListenTime: 0,
  loreUnlocked: 0,
  lastSeen: '1970-01-01T00:00:00.000Z',
})

const INITIAL_STATE: SoundieState = {
  activeNoteId: DEFAULT_NOTE_ID,
  playerId: null,
  progressByNoteId: {},
  currentSession: {
    active: false,
    startedAt: 0,
    duration: 300,
    elapsed: 0,
  },
  teardropShelfOpen: false,
  dailyGiftGlow: null,
  dailyGiftForNoteId: null,
  dailyGiftCaption: null,
  pendingListenFromDailyGift: false,
  activeRitualId: null,
  ritualSeal: null,
  sessionMoodBefore: null,
  lastCompletedSessionId: null,
  lastReflectionId: null,
}

type V1StateSlice = {
  note?: {
    id?: string
    level?: number
    totalListenTime?: number
    loreUnlocked?: number
    lastSeen?: string
  }
  currentSession?: Session
}

export const useSoundieStore = create<SoundieStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      hasHydrated: false,
      presenceEnabled: false,
      mainListenActive: false,

      setPresenceEnabled: (v: boolean) => {
        set({ presenceEnabled: v })
      },

      setMainListenActive: (v: boolean) => {
        set({ mainListenActive: v })
      },

      pendingLoreFocusIndex: null,

      setPendingLoreFocusIndex: (idx: number | null) => {
        set({ pendingLoreFocusIndex: idx })
      },

      focusNoteFragment: (noteId: string, loreIndexZeroBased: number, openShelf = true) => {
        if (!isValidNoteId(noteId)) return
        const clamped = Math.max(0, Math.min(4, Math.floor(loreIndexZeroBased)))
        set((s) => ({
          activeNoteId: noteId,
          pendingLoreFocusIndex: clamped,
          teardropShelfOpen: openShelf ? true : s.teardropShelfOpen,
          dailyGiftGlow:
            s.dailyGiftForNoteId && noteId !== s.dailyGiftForNoteId ? null : s.dailyGiftGlow,
          dailyGiftForNoteId:
            s.dailyGiftForNoteId && noteId !== s.dailyGiftForNoteId ? null : s.dailyGiftForNoteId,
          dailyGiftCaption:
            s.dailyGiftForNoteId && noteId !== s.dailyGiftForNoteId ? null : s.dailyGiftCaption,
          sessionMoodReaction: noteId !== s.activeNoteId ? null : s.sessionMoodReaction,
        }))
      },

      setActiveRitualId: (id: string | null) => {
        set((s) => ({
          activeRitualId: id,
          ritualSeal: id !== null ? null : s.ritualSeal,
        }))
      },

      setActiveNote: (id: string) => {
        if (!isValidNoteId(id)) return
        if (get().activeRitualId && get().currentSession.active) return
        set((s) => {
          const next: {
            activeNoteId: string
            dailyGiftGlow: typeof s.dailyGiftGlow
            dailyGiftForNoteId: typeof s.dailyGiftForNoteId
            dailyGiftCaption: typeof s.dailyGiftCaption
            sessionMoodReaction: string | null
          } = {
            activeNoteId: id,
            dailyGiftGlow: s.dailyGiftGlow,
            dailyGiftForNoteId: s.dailyGiftForNoteId,
            dailyGiftCaption: s.dailyGiftCaption,
            sessionMoodReaction: s.sessionMoodReaction,
          }
          if (s.dailyGiftForNoteId && id !== s.dailyGiftForNoteId) {
            next.dailyGiftGlow = null
            next.dailyGiftForNoteId = null
            next.dailyGiftCaption = null
          }
          if (id !== s.activeNoteId) {
            next.sessionMoodReaction = null
          }
          return next
        })
      },

      applyDailyClaim: (payload, activeNoteId) => {
        if (!payload) {
          set({
            dailyGiftGlow: null,
            dailyGiftForNoteId: null,
            dailyGiftCaption: null,
          })
          return
        }
        if (payload.noteId !== activeNoteId) {
          set({
            dailyGiftGlow: null,
            dailyGiftForNoteId: null,
            dailyGiftCaption: null,
          })
          return
        }
        set({
          dailyGiftGlow: payload.glowKey,
          dailyGiftForNoteId: payload.noteId,
          dailyGiftCaption: payload.rareCaption,
        })
      },

      setPendingListenFromDailyGift: (v: boolean) => {
        set({ pendingListenFromDailyGift: v })
      },

      moodEntranceCleared: false,
      setMoodEntranceCleared: (v: boolean) => {
        set({ moodEntranceCleared: v })
      },
      sessionMoodReaction: null as string | null,
      setSessionMoodReaction: (v: string | null) => {
        set({ sessionMoodReaction: v })
      },
      setSessionMoodBefore: (v) => {
        set({ sessionMoodBefore: v })
      },
      setLastSessionReflection: (sessionId: string | null, reflectionId: string | null) => {
        set({ lastCompletedSessionId: sessionId, lastReflectionId: reflectionId })
      },
      clearLastSessionReflection: () => {
        set({ lastCompletedSessionId: null, lastReflectionId: null })
      },

      setPlayerId: (id: string | null) => {
        set({ playerId: id })
      },

      setTeardropShelfOpen: (open: boolean) => {
        set({ teardropShelfOpen: open })
      },

      markHydrated: () => {
        set({ hasHydrated: true })
      },

      startSession: (durationSeconds = 300) => {
        set({
          currentSession: {
            active: true,
            startedAt: Date.now(),
            duration: durationSeconds,
            elapsed: 0,
          },
          lastCompletedSessionId: null,
          lastReflectionId: null,
        })
      },

      stopSession: () => {
        set((state) => ({
          currentSession: {
            ...state.currentSession,
            active: false,
          },
        }))
      },

      updateSessionElapsed: (elapsed: number) => {
        const state = get()
        if (elapsed >= state.currentSession.duration) {
          set((s) => ({
            currentSession: {
              ...s.currentSession,
              elapsed: s.currentSession.duration,
              active: false,
            },
          }))
        } else {
          set((s) => ({
            currentSession: {
              ...s.currentSession,
              elapsed,
            },
          }))
        }
      },

      completeSession: () => {
        const state = get()
        const noteId = state.activeNoteId
        const sessionTime = state.currentSession.elapsed
        const prev = state.progressByNoteId[noteId] ?? EMPTY_NOTE_PROGRESS
        const newTotalTime = prev.totalListenTime + sessionTime
        const newLevel = levelFromTotalListenSeconds(newTotalTime)
        const newLoreUnlocked = loreUnlockedFromTotalListenSeconds(newTotalTime)

        set({
          progressByNoteId: {
            ...state.progressByNoteId,
            [noteId]: {
              ...prev,
              totalListenTime: newTotalTime,
              level: newLevel,
              loreUnlocked: newLoreUnlocked,
              lastSeen: new Date().toISOString(),
            },
          },
          currentSession: {
            ...state.currentSession,
            active: false,
            elapsed: 0,
          },
          lastCompletedSessionId: null,
          lastReflectionId: null,
        })
      },

      unlockLore: () => {
        set((state) => {
          const noteId = state.activeNoteId
          const prev = state.progressByNoteId[noteId] ?? EMPTY_NOTE_PROGRESS
          return {
            progressByNoteId: {
              ...state.progressByNoteId,
              [noteId]: {
                ...prev,
                loreUnlocked: Math.min(5, prev.loreUnlocked + 1),
              },
            },
          }
        })
      },

      ensureLoreUnlockedAtLeast: (target: number) => {
        set((state) => {
          const noteId = state.activeNoteId
          const prev = state.progressByNoteId[noteId] ?? EMPTY_NOTE_PROGRESS
          return {
            progressByNoteId: {
              ...state.progressByNoteId,
              [noteId]: {
                ...prev,
                loreUnlocked: Math.max(
                  prev.loreUnlocked,
                  Math.min(5, Math.max(0, Math.floor(target))),
                ),
              },
            },
          }
        })
      },

      syncFromRemote: (row, noteId) => {
        set((state) => ({
          progressByNoteId: {
            ...state.progressByNoteId,
            [noteId]: {
              totalListenTime: row?.totalListenTime ?? 0,
              level: row?.level ?? 1,
              loreUnlocked: row?.loreUnlocked ?? 0,
              lastSeen: new Date().toISOString(),
            },
          },
        }))
      },

      completeRitualListen: (segments, seal) => {
        set((state) => {
          const nextProg = { ...state.progressByNoteId }
          for (const seg of segments) {
            const prev = nextProg[seg.noteId] ?? EMPTY_NOTE_PROGRESS
            const nt = prev.totalListenTime + seg.seconds
            nextProg[seg.noteId] = {
              ...prev,
              totalListenTime: nt,
              level: levelFromTotalListenSeconds(nt),
              loreUnlocked: loreUnlockedFromTotalListenSeconds(nt),
              lastSeen: new Date().toISOString(),
            }
          }
          const sealedAt = new Date().toISOString()
          return {
            progressByNoteId: nextProg,
            currentSession: {
              ...state.currentSession,
              active: false,
              elapsed: 0,
            },
            activeRitualId: null,
            ritualSeal: seal
              ? {
                  ritualKey: seal.ritualKey,
                  ritualId: seal.ritualId,
                  dominantNoteId: seal.dominantNoteId,
                  entryNoteId: seal.entryNoteId,
                  notesInvolved: [...seal.notesInvolved],
                  phrase: seal.phrase,
                  elapsedSeconds: seal.elapsedSeconds,
                  sealedAt,
                }
              : state.ritualSeal,
          }
        })
      },

      reset: () => {
        const pid = get().playerId
        set({
          ...INITIAL_STATE,
          playerId: pid,
          hasHydrated: get().hasHydrated,
          moodEntranceCleared: true,
          sessionMoodReaction: null,
          activeRitualId: null,
          presenceEnabled: false,
          mainListenActive: false,
        })
      },
    }),
    {
      name: 'soundie-storage',
      version: 9,
      partialize: (state): PersistedSoundieState => ({
        activeNoteId: state.activeNoteId,
        playerId: state.playerId,
        progressByNoteId: state.progressByNoteId,
        currentSession: state.currentSession,
        teardropShelfOpen: state.teardropShelfOpen,
        activeRitualId: state.activeRitualId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated()
      },
      migrate: (persisted, version) => {
        let p: object = { ...(persisted as object) }

        if (version < 2) {
          const raw = persisted as V1StateSlice
          const n = raw?.note
          const activeNoteId =
            n?.id && isValidNoteId(n.id) ? n.id : DEFAULT_NOTE_ID
          const prog: Progress = {
            level: n?.level ?? 1,
            totalListenTime: n?.totalListenTime ?? 0,
            loreUnlocked: n?.loreUnlocked ?? 0,
            lastSeen: n?.lastSeen ?? new Date().toISOString(),
          }
          p = {
            ...INITIAL_STATE,
            activeNoteId,
            playerId: null,
            progressByNoteId: { [activeNoteId]: prog },
            currentSession: raw?.currentSession ?? {
              ...INITIAL_STATE.currentSession,
            },
            teardropShelfOpen: false,
          }
        }
        if (version < 3) {
          const cur = p as SoundieState & { playerId?: string | null }
          p = { ...cur, playerId: cur.playerId ?? null, teardropShelfOpen: false }
        }
        if (version < 4) {
          const cur = p as SoundieState & { teardropShelfOpen?: boolean }
          p = { ...cur, teardropShelfOpen: cur.teardropShelfOpen ?? false }
        }
        if (version < 5) {
          const cur = p as SoundieState & {
            dailyGiftGlow?: null
            dailyGiftForNoteId?: null
            dailyGiftCaption?: null
            pendingListenFromDailyGift?: boolean
          }
          p = {
            ...cur,
            dailyGiftGlow: cur.dailyGiftGlow ?? null,
            dailyGiftForNoteId: cur.dailyGiftForNoteId ?? null,
            dailyGiftCaption: cur.dailyGiftCaption ?? null,
            pendingListenFromDailyGift: cur.pendingListenFromDailyGift ?? false,
          }
        }
        if (version < 6) {
          const cur = p as SoundieState & { progress?: Progress }
          const aid = cur.activeNoteId ?? DEFAULT_NOTE_ID
          const next: Record<string, Progress> = { ...(cur.progressByNoteId ?? {}) }
          if (cur.progress && next[aid] === undefined) {
            next[aid] = cur.progress
          }
          const { progress: _drop, ...rest } = cur as SoundieState & { progress?: Progress }
          p = { ...rest, progressByNoteId: next }
        }
        if (version < 7) {
          const cur = p as SoundieState & { activeRitualId?: string | null }
          p = { ...cur, activeRitualId: cur.activeRitualId ?? null }
        }
        if (version < 8) {
          const cur = p as SoundieState & { ritualSeal?: SoundieState['ritualSeal'] }
          p = { ...cur, ritualSeal: cur.ritualSeal ?? null }
        }
        if (version < 9) {
          const cur = p as SoundieState & { activeRitualId?: string | null }
          p = { ...cur, activeRitualId: cur.activeRitualId ?? null }
        }
        return p as SoundieState
      },
    }
  )
)
