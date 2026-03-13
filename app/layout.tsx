import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Suspense } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProviderWrapper } from '@/components/providers/ClerkProviderWrapper'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { PreviewModeIndicator } from '@/components/shared/PreviewModeIndicator'
import { GlobalErrorBoundary } from '@/components/shared/GlobalErrorBoundary'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: '#0b0b0b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'SpartanLab - Calisthenics Training Decision Engine',
  description: 'Stop guessing your calisthenics training. SpartanLab analyzes your progress, finds your limiters, and tells you exactly what to train next. Like having a coach analyzing your training 24/7.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SpartanLab',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#0F1115] text-[#E6E9EF]">
        <GlobalErrorBoundary>
          <ClerkProviderWrapper>
            <Suspense fallback={null}>
              <AnalyticsProvider>
                {children}
              </AnalyticsProvider>
            </Suspense>
            <PreviewModeIndicator />
          </ClerkProviderWrapper>
        </GlobalErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
