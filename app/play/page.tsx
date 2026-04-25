'use client'

import { Suspense } from 'react'
import { NoteCreature } from '@/components/note-creature'
import { SoundieQueryBridge } from '@/components/soundie-query-bridge'
import { SoundiePlayerBridge } from '@/components/soundie-player-bridge'

export default function PlayPage() {
  return (
    <main className="flex min-h-dvh flex-col overflow-x-hidden bg-pearl">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <NoteCreature />
      </div>
      <Suspense fallback={null}>
        <SoundiePlayerBridge />
        <SoundieQueryBridge />
      </Suspense>
    </main>
  )
}
