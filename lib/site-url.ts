export function getSiteUrl(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  if (fromEnv) {
    const s = fromEnv.replace(/\/$/, '')
    return new URL(s.startsWith('http') ? s : `https://${s}`)
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`)
  }
  return new URL('http://localhost:3000')
}
