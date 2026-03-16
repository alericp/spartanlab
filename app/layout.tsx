// AUTH_PROD_UNBLOCK_V1
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { GlobalErrorBoundary } from '@/components/shared/GlobalErrorBoundary'
import { OwnerSimulationToggle } from '@/components/billing/OwnerSimulationToggle'
import { Toaster } from '@/components/ui/toaster'
import { AUTH_BUILD_STAMP } from '@/lib/build-stamp'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateOrganizationSchema, generateWebsiteSchema, generateSoftwareSchema } from '@/lib/seo'
import './globals.css'

// Hard proof marker for deployment verification
console.log("[AUTH_PROOF] layout auth-prod-unblock-v1")
console.log(`[SpartanLab] Build: ${AUTH_BUILD_STAMP} (root-layout)`)

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
  title: {
    default: 'SpartanLab - Adaptive Calisthenics Training Intelligence',
    template: '%s | SpartanLab',
  },
  description: 'AI-powered calisthenics coaching that adapts to you. SpartanLab analyzes skill readiness, detects training limiters, and generates personalized programs with joint integrity protocols. Master front lever, planche, and muscle-up intelligently.',
  keywords: ['calisthenics training app', 'AI calisthenics coach', 'front lever training program', 'planche progression training', 'bodyweight strength program', 'calisthenics skill training', 'adaptive workout program', 'muscle up progression'],
  authors: [{ name: 'SpartanLab' }],
  creator: 'SpartanLab',
  publisher: 'SpartanLab',
  generator: 'v0.app',
  manifest: '/manifest.json',
  metadataBase: new URL('https://spartanlab.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'SpartanLab',
    title: 'SpartanLab - Adaptive Calisthenics Training Intelligence',
    description: 'AI-powered calisthenics coaching. Skill readiness analysis, constraint detection, adaptive programming, and joint integrity protocols for front lever, planche, and muscle-up mastery.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'SpartanLab - Adaptive Calisthenics Training Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpartanLab - Adaptive Calisthenics Training Intelligence',
    description: 'AI coaching for calisthenics. Skill readiness analysis, adaptive programming, and joint integrity protocols.',
    creator: '@spartanlabapp',
    images: ['/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
  // Global structured data for SEO
  const globalSchemas = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
    generateSoftwareSchema(),
  ]

  return (
    <html lang="en">
      <head>
        <JsonLdMultiple schemas={globalSchemas} />
      </head>
      <body className="font-sans antialiased bg-[#0F1115] text-[#E6E9EF]">
        <ClerkProvider>
          <GlobalErrorBoundary>
            {children}
            {/* Owner-only simulation toggle for testing Free/Pro states */}
            <OwnerSimulationToggle />
            <Toaster />
          </GlobalErrorBoundary>
        </ClerkProvider>
      </body>
    </html>
  )
}
