import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'

// Zod schemas for validation
const NoteSchema = z.object({
  id: z.literal('C'),
  name: z.string(),
  frequency: z.number(),
  level: z.number().int().min(1).max(5),
  totalListenTime: z.number().nonnegative(),
  loreUnlocked: z.number().int().min(0).max(5),
  lastSeen: z.string().datetime(),
})

const SessionSchema = z.object({
  active: z.boolean(),
  startedAt: z.number(),
  duration: z.number().positive(), // target duration in seconds
  elapsed: z.number().nonnegative(),
})

const SoundieStateSchema = z.object({
  note: NoteSchema,
  currentSession: SessionSchema,
})

export type Note = z.infer<typeof NoteSchema>
export type Session = z.infer<typeof SessionSchema>
export type SoundieState = z.infer<typeof SoundieStateSchema>

// Store actions
interface SoundieStore extends SoundieState {
  // Session actions
  startSession: (durationSeconds?: number) => void
  stopSession: () => void
  updateSessionElapsed: (elapsed: number) => void

  // Growth actions
  completeSession: () => void
  unlockLore: () => void

  // Reset for testing
  reset: () => void
}

const INITIAL_STATE: SoundieState = {
  note: {
    id: 'C',
    name: 'The Foundation',
    frequency: 261.63,
    level: 1,
    totalListenTime: 0,
    loreUnlocked: 0,
    lastSeen: new Date().toISOString(),
  },
  currentSession: {
    active: false,
    startedAt: 0,
    duration: 180, // 3 minutes default
    elapsed: 0,
  },
}

export const useSoundieStore = create<SoundieStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      startSession: (durationSeconds = 180) => {
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
          // Session completed
          set((state) => ({
            currentSession: {
              ...state.currentSession,
              elapsed: state.currentSession.duration,
              active: false,
            },
          }))
        } else {
          set((state) => ({
            currentSession: {
              ...state.currentSession,
              elapsed,
            },
          }))
        }
      },

      completeSession: () => {
        const state = get()
        const sessionTime = state.currentSession.elapsed
        const newTotalTime = state.note.totalListenTime + sessionTime

        // Calculate level based on listening time
        // Level up every 10 minutes (600 seconds)
        const newLevel = Math.min(
          5,
          Math.floor(newTotalTime / 600) + 1
        )

        // Unlock lore every 15 minutes (900 seconds)
        const newLoreUnlocked = Math.min(
          5,
          Math.floor(newTotalTime / 900)
        )

        set({
          note: {
            ...state.note,
            totalListenTime: newTotalTime,
            level: newLevel,
            loreUnlocked: newLoreUnlocked,
            lastSeen: new Date().toISOString(),
          },
          currentSession: {
            ...state.currentSession,
            active: false,
            elapsed: 0,
          },
        })
      },

      unlockLore: () => {
        set((state) => ({
          note: {
            ...state.note,
            loreUnlocked: Math.min(5, state.note.loreUnlocked + 1),
          },
        }))
      },

      reset: () => {
        set(INITIAL_STATE)
      },
    }),
    {
      name: 'soundie-storage',
      version: 1,
    }
  )
)
