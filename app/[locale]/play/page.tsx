'use client'

import { Suspense } from 'react'
import { NoteCreature } from '@/components/note-creature'
import { SoundieQueryBridge } from '@/components/soundie-query-bridge'
import { SoundiePlayerBridge } from '@/components/soundie-player-bridge'
import { ReturnEngineBridge } from '@/components/return-engine-bridge'
import { MoodCheckInBridge } from '@/components/mood-check-in-bridge'

export default function PlayPage() {
  return (
    <main className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden bg-pearl">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <NoteCreature />
      </div>
      <Suspense fallback={null}>
        <MoodCheckInBridge />
        <ReturnEngineBridge />
        <SoundiePlayerBridge />
        <SoundieQueryBridge />
      </Suspense>
    </main>
  )
}
