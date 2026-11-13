import { Geist, JetBrains_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google'
import { getLocale } from '@/lib/locale'
import { dirOf } from '@/lib/i18n'
import './globals.css'

const geist = Geist({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-geist', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' })
const plexAr = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['300', '400', '500', '600', '700'], variable: '--font-plex-ar', display: 'swap', preload: false })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Fouad Mohamed — Frontend & Creative Developer', template: '%s — Fouad Mohamed' },
  description: 'Fouad Mohamed builds fast, interactive 3D web experiences with React, Next.js, Node.js and Three.js.',
  openGraph: {
    type: 'website',
    title: 'Fouad Mohamed — Frontend & Creative Developer',
    description: 'Interactive 3D web experiences with React, Next.js, Node.js and Three.js.',
    siteName: 'Fouad Mohamed',
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport = { themeColor: '#05070c', colorScheme: 'dark' }

export default async function RootLayout({ children }) {
  const locale = await getLocale()
  const fonts = [geist, jetbrains, plexAr].map((f) => f.variable).join(' ')
  return (
    <html lang={locale} dir={dirOf(locale)} className={fonts} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
