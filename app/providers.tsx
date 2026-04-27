'use client'

import { useEffect, useRef } from 'react'
import { TrpcProvider } from '@/lib/trpc/react'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  const bellAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio('/bells.wav')
    audio.preload = 'auto'
    audio.volume = 0.42
    bellAudioRef.current = audio
    return () => {
      bellAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    const playBell = (event: PointerEvent) => {
      if (event.button !== 0) return
      const audio = bellAudioRef.current
      if (!audio) return
      audio.currentTime = 0
      void audio.play().catch(() => {})
    }
    window.addEventListener('pointerdown', playBell, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', playBell, { capture: true })
    }
  }, [])

  return (
    <SessionProvider>
      <TrpcProvider>
        {children}
        <Toaster richColors position="top-center" />
      </TrpcProvider>
    </SessionProvider>
  )
}
