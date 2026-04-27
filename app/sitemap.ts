import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getSiteUrl } from '@/lib/site-url'
import { localizedPath, type PublicSeoPage } from '@/lib/localized-path'

const PAGES: PublicSeoPage[] = ['home', 'play', 'sanctuary']

const PRIORITY: Record<PublicSeoPage, number> = {
  home: 1,
  play: 0.9,
  sanctuary: 0.85,
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const lastModified = new Date()
  const out: MetadataRoute.Sitemap = []
  for (const locale of routing.locales) {
    for (const page of PAGES) {
      const path = localizedPath(locale, page)
      out.push({
        url: new URL(path, base).toString(),
        lastModified,
        changeFrequency: 'weekly',
        priority: PRIORITY[page],
      })
    }
  }
  return out
}
