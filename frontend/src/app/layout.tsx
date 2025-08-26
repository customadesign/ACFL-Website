import type { Metadata } from 'next'
import Providers from '@/components/Providers'
import { ThemeScript } from '@/components/ThemeScript'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACT Coaching For Life',
  description: 'Find the right coach for your personal growth journey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
