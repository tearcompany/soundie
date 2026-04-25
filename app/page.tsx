import type { Metadata } from 'next'
import { SoundieLanding } from '@/components/soundie-landing'

const SITE_TITLE = 'Soundie — Sound that knows you\'re here'
const SITE_DESCRIPTION =
  'A meditative world of living notes. Twelve frequencies, each one heals something different. The longer you listen, the more it reveals.'

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: 'Soundie',
  keywords: [
    'sound healing',
    'meditative app',
    'frequency therapy',
    'Soundie',
    'living notes',
    'presence',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: 'Soundie',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Home() {
  return <SoundieLanding />
}
