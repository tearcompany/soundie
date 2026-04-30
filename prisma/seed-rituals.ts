import type { PrismaClient } from '@prisma/client'

type RitualSeed = {
  id: string
  name: string
  description: string
  durationSec: number
  dominantNote: string
  energyTone: string
  notes: string[]
  phases: Array<{
    name: string
    noteIds: string[]
    untilSec: number
  }>
}

const RITUALS: RitualSeed[] = [
  {
    id: 'warmth_a_f_9m',
    name: 'Warmth',
    description: 'A presence that stays with you.',
    durationSec: 540,
    dominantNote: 'A',
    energyTone: 'warmth',
    notes: ['F', 'A'],
    phases: [
      { name: 'shelter', noteIds: ['F'], untilSec: 150 },
      { name: 'meeting', noteIds: ['F', 'A'], untilSec: 360 },
      { name: 'staying', noteIds: ['A'], untilSec: 540 },
    ],
  },
  {
    id: 'clarity_fsharp_csharp_9m',
    name: 'Clarity',
    description: 'A precise seeing that cuts through haze.',
    durationSec: 540,
    dominantNote: 'C#',
    energyTone: 'clarity',
    notes: ['F#', 'C#'],
    phases: [
      { name: 'reflection', noteIds: ['F#'], untilSec: 150 },
      { name: 'cut', noteIds: ['F#', 'C#'], untilSec: 360 },
      { name: 'precision', noteIds: ['C#'], untilSec: 540 },
    ],
  },
  {
    id: 'grounding_c_f_9m',
    name: 'Grounding',
    description: 'A slower breath returning weight to the body.',
    durationSec: 540,
    dominantNote: 'F',
    energyTone: 'grounding',
    notes: ['C', 'F'],
    phases: [
      { name: 'roots', noteIds: ['C'], untilSec: 150 },
      { name: 'hold', noteIds: ['C', 'F'], untilSec: 360 },
      { name: 'settle', noteIds: ['F'], untilSec: 540 },
    ],
  },
  {
    id: 'energy_dsharp_gsharp_9m',
    name: 'Energy',
    description: 'A gentle ignition that lifts without rush.',
    durationSec: 540,
    dominantNote: 'G#',
    energyTone: 'energy',
    notes: ['D#', 'G#'],
    phases: [
      { name: 'spark', noteIds: ['D#'], untilSec: 150 },
      { name: 'rise', noteIds: ['D#', 'G#'], untilSec: 360 },
      { name: 'carry', noteIds: ['G#'], untilSec: 540 },
    ],
  },
  {
    id: 'release_g_asharp_9m',
    name: 'Release',
    description: 'A cooling current for what is ready to move.',
    durationSec: 540,
    dominantNote: 'A#',
    energyTone: 'release',
    notes: ['G', 'A#'],
    phases: [
      { name: 'soften', noteIds: ['G'], untilSec: 150 },
      { name: 'unwind', noteIds: ['G', 'A#'], untilSec: 360 },
      { name: 'clear', noteIds: ['A#'], untilSec: 540 },
    ],
  },
]

export async function seedRituals(prisma: PrismaClient): Promise<void> {
  for (const ritual of RITUALS) {
    await prisma.ritual.upsert({
      where: { id: ritual.id },
      create: {
        id: ritual.id,
        name: ritual.name,
        description: ritual.description,
        durationSec: ritual.durationSec,
        dominantNote: ritual.dominantNote,
        energyTone: ritual.energyTone,
        notes: ritual.notes,
      },
      update: {
        name: ritual.name,
        description: ritual.description,
        durationSec: ritual.durationSec,
        dominantNote: ritual.dominantNote,
        energyTone: ritual.energyTone,
        notes: ritual.notes,
      },
    })

    await prisma.ritualPhase.deleteMany({ where: { ritualId: ritual.id } })
    for (const phase of ritual.phases) {
      await prisma.ritualPhase.create({
        data: {
          ritualId: ritual.id,
          name: phase.name,
          noteIds: phase.noteIds,
          untilSec: phase.untilSec,
        },
      })
    }
  }
}
