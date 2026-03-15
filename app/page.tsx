import { Metadata } from 'next'
import { LandingPage } from '@/components/landing/LandingPage'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'SpartanLab - Calisthenics Training Decision Engine',
  description: 'Stop guessing your calisthenics training. SpartanLab analyzes your progress, finds your limiters, and tells you exactly what to train next. Like having a coach analyzing your training 24/7.',
  keywords: ['calisthenics', 'bodyweight training', 'workout planner', 'fitness app', 'training program', 'front lever', 'planche', 'muscle up'],
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  openGraph: {
    title: 'SpartanLab - Calisthenics Training Decision Engine',
    description: 'Stop guessing your calisthenics training. SpartanLab analyzes your progress, finds your limiters, and tells you exactly what to train next.',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpartanLab - Calisthenics Training Decision Engine',
    description: 'Stop guessing your calisthenics training. Get personalized coaching intelligence.',
  },
}

export default function Home() {
  return <LandingPage />
}
