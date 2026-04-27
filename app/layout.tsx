import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces, Lora, DM_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { headers } from 'next/headers'
import './globals.css'
import { Providers } from './providers'
import { getSiteUrl } from '@/lib/site-url'

const _geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const _geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
const _fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' })
const _lora = Lora({ subsets: ['latin'], variable: '--font-lora' })
const _dmMono = DM_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-mono',
})
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),

  title: {
    default: 'Soundie — Sound Healing App with Living Notes',
    template: '%s | Soundie',
  },

  description:
    'Soundie is a meditative sound healing app where musical notes become living companions — a tone of affirmation and a correlational intention mechanism. Listen, unlock lore, reduce stress, and build calm through frequency-based sessions.',

  keywords: [
    'sound healing app',
    'healing frequencies',
    'meditation app',
    'calm app alternative',
    'stress relief sounds',
    'frequency therapy',
    'music wellness app',
    'mindfulness app',
    'relaxation sounds',
    'sleep sounds',
    'nervous system regulation',
    'breathing app',
    'sound meditation',
    'wellness app',
    'Soundie',
    'affirmation',
    'intention',
  ],

  applicationName: 'Soundie',

  authors: [{ name: 'Soundie' }],
  creator: 'Soundie',
  publisher: 'Soundie',

  openGraph: {
    type: 'website',
    siteName: 'Soundie',
    title: 'Soundie — Sound Healing App with Living Notes',
    description:
      'A new kind of meditation app. Living notes, healing frequencies, lore, calm listening — affirmation and intention made audible.',
    url: '/',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Soundie — Living Notes',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Soundie — Sound Healing App with Living Notes',
    description:
      'Reduce stress and reconnect through living notes, frequencies, meditative listening — affirming sound and intentional presence.',
    images: ['/og-image.jpg'],
  },

  robots: {
    index: true,
    follow: true,
  },

  category: 'health',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headerStore = await headers()
  const locale =
    headerStore.get('x-next-intl-locale') ??
    headerStore.get('X-NEXT-INTL-LOCALE') ??
    'en'

  return (
    <html
      lang={locale}
      style={
        {
          '--font-fraunces': _fraunces.style.fontFamily,
          '--font-lora': _lora.style.fontFamily,
          '--font-dm-mono': _dmMono.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <body className="font-sans antialiased bg-pearl">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
