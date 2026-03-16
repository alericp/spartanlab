import { Metadata } from 'next'
import { LandingPage } from '@/components/landing/LandingPage'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'SpartanLab - Adaptive Calisthenics Training Intelligence',
  description: 'AI-powered calisthenics coaching that adapts to you. SpartanLab analyzes skill readiness, detects training constraints, and generates personalized programs with joint integrity protocols for front lever, planche, and muscle-up mastery.',
  keywords: ['calisthenics training app', 'AI calisthenics coach', 'front lever training program', 'planche progression training', 'bodyweight strength program', 'adaptive workout program', 'muscle up progression', 'calisthenics skill training'],
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  openGraph: {
    title: 'SpartanLab - Adaptive Calisthenics Training Intelligence',
    description: 'AI-powered calisthenics coaching. Skill readiness analysis, constraint detection, adaptive programming, and joint integrity protocols.',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpartanLab - Adaptive Calisthenics Training Intelligence',
    description: 'AI coaching for calisthenics. Skill readiness analysis, adaptive programming, and joint integrity protocols.',
  },
}

export default function Home() {
  return <LandingPage />
}
