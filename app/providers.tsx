'use client'

import { TrpcProvider } from '@/lib/trpc/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <TrpcProvider>{children}</TrpcProvider>
}
