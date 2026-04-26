import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SoundieLanding } from '@/components/soundie-landing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  const title = t('homeTitle')
  const description = t('homeDescription')
  const keywords = t('keywords')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const canonicalPath = locale === 'en' ? '/' : `/${locale}`

  return {
    title,
    description,
    applicationName: t('applicationName'),
    keywords,
    alternates: {
      canonical: canonicalPath,
      languages: {
        'x-default': '/',
        en: '/',
        pl: '/pl',
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      siteName: 'Soundie',
      locale: t('ogLocale'),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default function Home() {
  return <SoundieLanding />
}
