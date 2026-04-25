import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Play — Soundie',
  description: 'Listen to living notes. Your healing sound Tamagotchi.',
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
