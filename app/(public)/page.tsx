import { Metadata } from 'next'
import { LandingPage } from '@/components/landing/LandingPage'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'SpartanLab - Calisthenics-First Training Intelligence',
  description: 'Calisthenics training intelligence that analyzes your performance and builds adaptive programs using real strength methodologies. Supports weighted calisthenics and hybrid strength for front lever, planche, and muscle-up progression.',
  keywords: ['calisthenics training app', 'calisthenics programming', 'front lever training program', 'planche progression training', 'bodyweight strength program', 'adaptive training program', 'muscle up progression', 'weighted calisthenics', 'streetlifting'],
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  openGraph: {
    title: 'SpartanLab - Calisthenics-First Training Intelligence',
    description: 'Training intelligence that analyzes your performance and builds adaptive programs. Built from real strength methodologies.',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpartanLab - Calisthenics-First Training Intelligence',
    description: 'Training intelligence that analyzes performance and builds adaptive calisthenics programs.',
  },
}

export default function Home() {
  return <LandingPage />
}
