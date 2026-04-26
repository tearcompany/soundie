'use client'

import { Suspense } from 'react'
import { NoteCreature } from '@/components/note-creature'
import { LanguageSwitcher } from '@/components/language-switcher'
import { SoundieQueryBridge } from '@/components/soundie-query-bridge'
import { SoundiePlayerBridge } from '@/components/soundie-player-bridge'

export default function PlayPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden bg-pearl">
      <div className="pointer-events-auto absolute right-4 top-4 z-30 sm:right-6 sm:top-5">
        <LanguageSwitcher />
      </div>
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
