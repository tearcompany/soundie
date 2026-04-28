import { z } from 'zod'
import { router, publicProcedure, TRPCError } from '../init'
import {
  completeSessionInput,
  soundieRowSchema,
} from '@/lib/validators/soundie'
import { noteIdInput } from '@/lib/validators/note'
import {
  LORE_THRESHOLDS_MINUTES,
  calcProgressToNextFragment,
  getNewlyUnlockedLoreFragmentIndices,
  loreUnlockedCountFromTotalMinutes,
} from '@/lib/progress'
import { applyTeardropUnlocksAfterSession } from '@/lib/teardrop-unlock'

const playerNoteInput = z.object({
  playerId: z.string().cuid(),
  noteId: noteIdInput,
})

const calcLoreUnlocked = loreUnlockedCountFromTotalMinutes
const SESSION_CYCLE_SECONDS = 180
const SESSION_CYCLE_XP_AWARD = 10

const NOTE_UNLOCK_REQUIREMENTS: Record<number, number> = {
  2: 15,
  3: 30,
  4: 30,
  5: 60,
  6: 60,
  7: 60,
  8: 120,
  9: 120,
  10: 120,
  11: 120,
  12: 120,
}

function calcLevel(totalMinutes: number): number {
  return Math.min(5, Math.floor(totalMinutes / 15) + 1)
}

const sessionItemSchema = z.object({
  id: z.string(),
  duration: z.number().int(),
  completedAt: z.coerce.date(),
})

const sessionsOutputSchema = z.object({
  sessions: z.array(sessionItemSchema),
  totalCount: z.number().int(),
  totalSeconds: z.number().int(),
})

const getOneOutputSchema = soundieRowSchema.extend({
  totalMinutes: z.number().int().nonnegative(),
  progressToNextFragment: z.object({
    current: z.number().int().nonnegative(),
    next: z.number().int().nonnegative().nullable(),
    percent: z.number().int().min(0).max(100),
  }),
  availableFragments: z.array(
    z.object({
      fragment: z.number().int().min(1).max(5),
      unlocked: z.boolean(),
      minutesRequired: z.number().int().nonnegative(),
      minutesListened: z.number().int().nonnegative(),
    })
  ),
})

const completeSessionOutputSchema = z.object({
  soundie: soundieRowSchema,
  session: z.object({
    id: z.string(),
    duration: z.number().int().positive(),
    completedAt: z.coerce.date(),
  }),
  diff: z.object({
    previousLoreLevel: z.number().int().min(0).max(5),
    newLoreLevel: z.number().int().min(0).max(5),
    newlyUnlockedFragments: z.array(z.number().int().min(1).max(5)),
    leveledUp: z.boolean(),
    newLevel: z.number().int().min(1).max(5),
    unlockedNextNote: z
      .object({
        id: z.string(),
        name: z.string(),
        order: z.number().int().positive(),
      })
      .nullable(),
  }),
})

const unlockNoteOutputSchema = z.object({
  soundie: soundieRowSchema,
  alreadyUnlocked: z.boolean(),
})

export const soundieRouter = router({
  getAll: publicProcedure
    .input(z.object({ playerId: z.string().cuid() }))
    .output(z.array(soundieRowSchema))
    .query(async ({ ctx, input }) => {
      return ctx.db.soundie.findMany({
        where: { playerId: input.playerId },
        orderBy: { note: { sortOrder: 'asc' } },
      })
    }),

  getProgress: publicProcedure
    .input(playerNoteInput)
    .output(soundieRowSchema.nullable())
    .query(async ({ ctx, input }) => {
      return ctx.db.soundie.findUnique({
        where: {
          playerId_noteId: {
            playerId: input.playerId,
            noteId: input.noteId,
          },
        },
      })
    }),

  getSessions: publicProcedure
    .input(playerNoteInput)
    .output(sessionsOutputSchema)
    .query(async ({ ctx, input }) => {
      const soundie = await ctx.db.soundie.findUnique({
        where: {
          playerId_noteId: {
            playerId: input.playerId,
            noteId: input.noteId,
          },
        },
        include: {
          sessions: {
            orderBy: { completedAt: 'desc' },
            take: 50,
            select: { id: true, duration: true, completedAt: true },
          },
        },
      })
      if (!soundie) return { sessions: [], totalCount: 0, totalSeconds: 0 }
      const total = soundie.sessions.reduce((acc, s) => acc + s.duration, 0)
      return {
        sessions: soundie.sessions,
        totalCount: soundie.sessions.length,
        totalSeconds: total,
      }
    }),

  getOne: publicProcedure
    .input(playerNoteInput)
    .output(getOneOutputSchema)
    .query(async ({ ctx, input }) => {
      const soundie = await ctx.db.soundie.findUnique({
        where: {
          playerId_noteId: {
            playerId: input.playerId,
            noteId: input.noteId,
          },
        },
      })
      if (!soundie) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Note ${input.noteId} is not yet unlocked`,
        })
      }

      const totalMinutes = Math.floor(soundie.totalListenTime / 60)
      const availableFragments = LORE_THRESHOLDS_MINUTES.map((threshold, idx) => ({
        fragment: idx + 1,
        unlocked: totalMinutes >= threshold,
        minutesRequired: threshold,
        minutesListened: totalMinutes,
      }))

      return {
        ...soundie,
        totalMinutes,
        availableFragments,
        progressToNextFragment: calcProgressToNextFragment(totalMinutes),
      }
    }),

  getSessionHistory: publicProcedure
    .input(
      z.object({
        playerId: z.string().cuid(),
        noteId: noteIdInput.optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .output(
      z.array(
        z.object({
          id: z.string(),
          duration: z.number().int(),
          completedAt: z.coerce.date(),
          soundieId: z.string(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.listenSession.findMany({
        where: {
          playerId: input.playerId,
          ...(input.noteId
            ? {
                soundie: {
                  noteId: input.noteId,
                },
              }
            : {}),
        },
        orderBy: { completedAt: 'desc' },
        take: input.limit,
      })
      return sessions
    }),

  completeSession: publicProcedure
    .input(completeSessionInput)
    .output(completeSessionOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.player.findUnique({
        where: { id: input.playerId },
      })
      if (!player) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Player not found' })
      }

      const note = await ctx.db.note.findUnique({ where: { id: input.noteId } })
      if (!note) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' })
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        let current = await tx.soundie.findUnique({
          where: {
            playerId_noteId: {
              playerId: input.playerId,
              noteId: input.noteId,
            },
          },
          include: { note: true },
        })
        if (!current) {
          const created = await tx.soundie.create({
            data: {
              playerId: input.playerId,
              noteId: input.noteId,
              level: 1,
              loreUnlocked: 0,
              totalListenTime: 0,
            },
          })
          const withNote = await tx.soundie.findUnique({
            where: { id: created.id },
            include: { note: true },
          })
          if (!withNote) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to initialize soundie row for session',
            })
          }
          current = withNote
        }

        const prevTotalMinutes = Math.floor(current.totalListenTime / 60)
        const newTotalSeconds = current.totalListenTime + input.durationSeconds
        const newTotalMinutes = Math.floor(newTotalSeconds / 60)
        const previousCompletedCycles = Math.floor(current.totalListenTime / SESSION_CYCLE_SECONDS)
        const newCompletedCycles = Math.floor(newTotalSeconds / SESSION_CYCLE_SECONDS)
        const newlyCompletedCycles = Math.max(0, newCompletedCycles - previousCompletedCycles)
        const previousLoreLevel = current.loreUnlocked
        const newLoreLevel = calcLoreUnlocked(newTotalMinutes)
        const newLevel = calcLevel(newTotalMinutes)

        const soundie = await tx.soundie.update({
          where: { id: current.id },
          data: {
            totalListenTime: newTotalSeconds,
            level: newLevel,
            loreUnlocked: Math.min(5, newLoreLevel),
            lastSeenAt: new Date(),
          },
        })

        await applyTeardropUnlocksAfterSession(
          tx,
          input.playerId,
          input.noteId,
          Math.min(5, newLoreLevel)
        )
        if (newlyCompletedCycles > 0) {
          const cycleXp = newlyCompletedCycles * SESSION_CYCLE_XP_AWARD
          await tx.teardropProgress.upsert({
            where: { playerId: input.playerId },
            create: {
              playerId: input.playerId,
              xp: cycleXp,
              unlockedCards: 0,
            },
            update: {
              xp: { increment: cycleXp },
            },
          })
          await (tx as typeof tx & {
            teardropXpEvent: { create: (args: { data: { playerId: string; noteId: string; source: 'cycle'; amount: number } }) => Promise<unknown> }
          }).teardropXpEvent.create({
            data: {
              playerId: input.playerId,
              noteId: input.noteId,
              source: 'cycle',
              amount: cycleXp,
            },
          })
        }

        const session = await tx.listenSession.create({
          data: {
            playerId: input.playerId,
            soundieId: current.id,
            duration: input.durationSeconds,
          },
        })

        let unlockedNextNote: { id: string; name: string; order: number } | null = null
        const nextNote = await tx.note.findFirst({
          where: { sortOrder: current.note.sortOrder + 1 },
        })
        if (nextNote) {
          const nextOrder = nextNote.sortOrder + 1
          const requiredMinutes = NOTE_UNLOCK_REQUIREMENTS[nextOrder] ?? 120
          const existingNext = await tx.soundie.findUnique({
            where: {
              playerId_noteId: {
                playerId: input.playerId,
                noteId: nextNote.id,
              },
            },
          })
          const crossedThreshold =
            prevTotalMinutes < requiredMinutes && newTotalMinutes >= requiredMinutes
          if (crossedThreshold && !existingNext) {
            await tx.soundie.create({
              data: {
                playerId: input.playerId,
                noteId: nextNote.id,
                level: 1,
                loreUnlocked: 0,
                totalListenTime: 0,
              },
            })
            unlockedNextNote = {
              id: nextNote.id,
              name: nextNote.name,
              order: nextOrder,
            }
          }
        }

        if (input.durationSeconds >= 180) {
          await tx.analyticsEvent.create({
            data: {
              name: 'session_180_complete',
              playerId: input.playerId,
              meta: { noteId: input.noteId, durationSeconds: input.durationSeconds },
            },
          })
        }

        return {
          soundie,
          session: {
            id: session.id,
            duration: session.duration,
            completedAt: session.completedAt,
          },
          diff: {
            previousLoreLevel,
            newLoreLevel: Math.min(5, newLoreLevel),
            newlyUnlockedFragments: getNewlyUnlockedLoreFragmentIndices(
              previousLoreLevel,
              Math.min(5, newLoreLevel)
            ),
            leveledUp: newLevel > current.level,
            newLevel,
            unlockedNextNote,
          },
        }
      })

      return updated
    }),

  unlockNote: publicProcedure
    .input(playerNoteInput)
    .output(unlockNoteOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const targetNote = await ctx.db.note.findUnique({ where: { id: input.noteId } })
      if (!targetNote) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Note ${input.noteId} not found` })
      }
      if (targetNote.sortOrder === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Note C is always unlocked' })
      }

      const previousNote = await ctx.db.note.findFirst({
        where: { sortOrder: targetNote.sortOrder - 1 },
      })
      if (!previousNote) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Previous note missing' })
      }

      const previousSoundie = await ctx.db.soundie.findUnique({
        where: {
          playerId_noteId: {
            playerId: input.playerId,
            noteId: previousNote.id,
          },
        },
      })
      if (!previousSoundie) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You have not started listening to ${previousNote.id} yet`,
        })
      }

      const totalMinutes = Math.floor(previousSoundie.totalListenTime / 60)
      const requiredMinutes = NOTE_UNLOCK_REQUIREMENTS[targetNote.sortOrder + 1] ?? 120
      if (totalMinutes < requiredMinutes) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You need ${requiredMinutes} minutes on ${previousNote.id}. You have ${totalMinutes}.`,
        })
      }

      const existing = await ctx.db.soundie.findUnique({
        where: {
          playerId_noteId: {
            playerId: input.playerId,
            noteId: input.noteId,
          },
        },
      })

      const soundie = await ctx.db.soundie.upsert({
        where: {
          playerId_noteId: {
            playerId: input.playerId,
            noteId: input.noteId,
          },
        },
        create: {
          playerId: input.playerId,
          noteId: input.noteId,
          level: 1,
          loreUnlocked: 0,
          totalListenTime: 0,
        },
        update: {},
      })

      return {
        soundie,
        alreadyUnlocked: !!existing,
      }
    }),
})

export { LORE_THRESHOLDS_MINUTES, NOTE_UNLOCK_REQUIREMENTS, calcLoreUnlocked, calcProgressToNextFragment }
