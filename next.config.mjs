import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma', 'nodemailer'],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/sanctuary', destination: '/echo', permanent: true },
      { source: '/pl/sanctuary', destination: '/pl/echo', permanent: true },
      { source: '/play', destination: '/teraz', permanent: true },
      { source: '/pl/play', destination: '/pl/teraz', permanent: true },
    ]
  },
}

export default withNextIntl(nextConfig)
