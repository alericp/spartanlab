import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'SpartanLab - Calisthenics Training Decision Engine',
  description: 'Stop guessing your calisthenics training. SpartanLab analyzes your progress, finds what\'s holding you back, and tells you exactly what to train next.',
  keywords: ['calisthenics', 'training', 'front lever', 'planche', 'muscle up', 'weighted pull ups', 'calisthenics program'],
  openGraph: {
    title: 'SpartanLab - Calisthenics Training Decision Engine',
    description: 'Stop guessing your calisthenics training. SpartanLab analyzes your progress, finds what\'s holding you back, and tells you exactly what to train next.',
    type: 'website',
    url: 'https://spartanlab.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpartanLab - Calisthenics Training Decision Engine',
    description: 'Stop guessing your calisthenics training. SpartanLab analyzes your progress and tells you exactly what to train next.',
  },
}

export default function Page() {
  return <LandingPage />
}
