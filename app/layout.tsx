import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inventaris Komputer & Aset Al-Aqsyar',
  description: 'Dashboard inventaris unit komputer & aset SMK Al-Aqsyar terintegrasi QR Code.',
  icons: {
    icon: '/logo-alaqsyar.png',
    shortcut: '/logo-alaqsyar.png',
    apple: '/logo-alaqsyar.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#7c3aed',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
