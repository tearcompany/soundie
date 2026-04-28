import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import { DEFAULT_NOTE_ID, isValidNoteId } from '@/lib/notes'
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
})

export type Progress = z.infer<typeof ProgressSchema>
export type Session = z.infer<typeof SessionSchema>
export type SoundieState = z.infer<typeof SoundieStateSchema>
type PersistedSoundieState = Pick<
  SoundieState,
  'activeNoteId' | 'playerId' | 'progressByNoteId' | 'currentSession' | 'teardropShelfOpen'
>

interface SoundieStore extends SoundieState {
  hasHydrated: boolean
  startSession: (durationSeconds?: number) => void
  stopSession: () => void
  updateSessionElapsed: (elapsed: number) => void
  completeSession: () => void
  unlockLore: () => void
  ensureLoreUnlockedAtLeast: (target: number) => void
  setActiveNote: (id: string) => void
  setPlayerId: (id: string | null) => void
  setTeardropShelfOpen: (open: boolean) => void
  applyDailyClaim: (
    payload: { noteId: string; glowKey: 'dawn' | 'dusk' | 'nocturne'; rareCaption: string } | null,
    activeNoteId: string
  ) => void
  setPendingListenFromDailyGift: (v: boolean) => void
  moodEntranceCleared: boolean
  setMoodEntranceCleared: (v: boolean) => void
  sessionMoodReaction: string | null
  setSessionMoodReaction: (v: string | null) => void
  markHydrated: () => void
  syncFromRemote: (
    row: { totalListenTime: number; level: number; loreUnlocked: number } | null,
    noteId: string
  ) => void
  reset: () => void
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

      setActiveNote: (id: string) => {
        if (!isValidNoteId(id)) return
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

      reset: () => {
        const pid = get().playerId
        set({
          ...INITIAL_STATE,
          playerId: pid,
          hasHydrated: get().hasHydrated,
          moodEntranceCleared: true,
          sessionMoodReaction: null,
        })
      },
    }),
    {
      name: 'soundie-storage',
      version: 6,
      partialize: (state): PersistedSoundieState => ({
        activeNoteId: state.activeNoteId,
        playerId: state.playerId,
        progressByNoteId: state.progressByNoteId,
        currentSession: state.currentSession,
        teardropShelfOpen: state.teardropShelfOpen,
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
        return p as SoundieState
      },
    }
  )
)
