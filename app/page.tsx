'use client'

import { NoteCreature } from '@/components/note-creature'
import { LockedNotes } from '@/components/locked-notes'

export default function Home() {
  return (
    <main className="bg-pearl min-h-screen relative overflow-hidden">
      <NoteCreature />
      <LockedNotes />
    </main>
  )
}
