import { getTranslations } from 'next-intl/server'
import { getSiteUrl } from '@/lib/site-url'
import { localizedPath } from '@/lib/localized-path'

type Props = {
  locale: string
}

export async function JsonLdWebsite({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'meta' })
  const homePath = localizedPath(locale, 'home')
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('applicationName'),
    description: t('rootDescription'),
    url: new URL(homePath, getSiteUrl()).toString(),
    inLanguage: locale === 'pl' ? 'pl' : 'en',
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
