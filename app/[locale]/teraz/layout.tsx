import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { HREFLANG_TERAZ, localizedPath } from '@/lib/localized-path'
import { getSiteUrl } from '@/lib/site-url'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  const title = t('terazTitle')
  const description = t('terazDescription')
  const keywords = t('keywords')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const canonicalPath = localizedPath(locale, 'teraz')
  const pageUrl = new URL(canonicalPath, getSiteUrl()).toString()
  return {
    title,
    description,
    applicationName: t('applicationName'),
    keywords,
    alternates: {
      canonical: canonicalPath,
      languages: { ...HREFLANG_TERAZ },
    },
    openGraph: {
      type: 'website',
      url: pageUrl,
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

export default function TerazLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
