import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  const canonicalPath = locale === 'en' ? '/play' : `/${locale}/play`
  return {
    title: t('playTitle'),
    description: t('playDescription'),
    alternates: {
      canonical: canonicalPath,
      languages: {
        'x-default': '/play',
        en: '/play',
        pl: '/pl/play',
      },
    },
  }
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
