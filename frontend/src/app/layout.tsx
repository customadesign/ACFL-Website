import type { Metadata } from 'next'
import Script from 'next/script'
import Providers from '@/components/Providers'
import { ThemeScript } from '@/components/ThemeScript'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACT Coaching For Life',
  description: 'Find the right coach for your personal growth journey',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const squareEnvironment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox';
  const squareScriptUrl = squareEnvironment === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js';

  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <Script
          src={squareScriptUrl}
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
