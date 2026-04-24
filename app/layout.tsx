import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces, Lora, DM_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], variable: '--font-sans' });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: '--font-mono' });
const _fraunces = Fraunces({ subsets: ["latin"], variable: '--font-fraunces' });
const _lora = Lora({ subsets: ["latin"], variable: '--font-lora' });
const _dmMono = DM_Mono({ subsets: ["latin"], weight: "400", variable: '--font-dm-mono' });

export const metadata: Metadata = {
  title: 'Soundie — Heal with Living Notes',
  description: 'A meditative Tamagotchi-style healing sound game where musical notes are living creatures.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{
      '--font-fraunces': _fraunces.style.fontFamily,
      '--font-lora': _lora.style.fontFamily,
      '--font-dm-mono': _dmMono.style.fontFamily,
    } as React.CSSProperties}>
      <body className="font-sans antialiased bg-pearl">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
