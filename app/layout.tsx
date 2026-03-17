/**
 * Root Layout - Minimal, Auth-Free Shell
 * 
 * This layout is applied to ALL routes and must be completely prerender-safe.
 * 
 * INTENTIONALLY EXCLUDES:
 * - ClerkProvider (only in app/(app) layout for authenticated routes)
 * - OwnerSimulationToggleWrapper (only in app/(app) layout)
 * - GlobalErrorBoundary (only in app/(app) layout)
 * - Toaster (only in app/(app) layout to prevent auth hook failures)
 * 
 * INCLUDES:
 * - AnalyticsProvider (auth-safe, no direct Clerk dependencies)
 * - Global SEO schemas (static, no auth)
 * - Fonts and CSS (static)
 * 
 * Public routes via app/(public) - No auth, prerenderable ✓
 * App routes via app/(app) - Auth-wrapped separately ✓
 */

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'
import { JsonLdMultiple } from '@/components/seo/JsonLd'
import { generateOrganizationSchema, generateWebsiteSchema, generateSoftwareSchema } from '@/lib/seo'
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
  title: {
    default: 'SpartanLab - Calisthenics-First Training Intelligence',
    template: '%s | SpartanLab',
  },
  description: 'Calisthenics-first training intelligence that analyzes your performance and builds adaptive programs using real strength methodologies. Supports weighted calisthenics and hybrid strength for front lever, planche, and muscle-up progression.',
  keywords: ['calisthenics training app', 'calisthenics programming', 'front lever training program', 'planche progression training', 'bodyweight strength program', 'calisthenics skill training', 'adaptive training program', 'muscle up progression', 'weighted calisthenics', 'streetlifting'],
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
    title: 'SpartanLab - Calisthenics-First Training Intelligence',
    description: 'Training intelligence that analyzes your performance and builds adaptive calisthenics programs. Built from real strength methodologies.',
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
  verification: {
    google: 'n302TRNGAeOTVkU3PA14R8x6MBPovgFYZq9iILqrcjg',
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
        {/* AnalyticsProvider is auth-safe - no Clerk dependencies */}
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  )
}
