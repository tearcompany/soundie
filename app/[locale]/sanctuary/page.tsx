'use client'

import { Suspense } from 'react'
import { SanctuaryDashboard } from '@/components/sanctuary/sanctuary-dashboard'
import { SoundieQueryBridge } from '@/components/soundie-query-bridge'
import { SanctuaryUnlockBridge } from '@/components/sanctuary/sanctuary-unlock-bridge'

export default function SanctuaryPage() {
  return (
    <main className="relative min-h-0 flex-1 overflow-x-hidden bg-pearl">
      <SanctuaryDashboard />
      <Suspense fallback={null}>
        <SoundieQueryBridge />
        <SanctuaryUnlockBridge />
      </Suspense>
    </main>
  )
}
