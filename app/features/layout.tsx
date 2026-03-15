import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Features | SpartanLab Calisthenics Training Platform',
  description: 'Explore SpartanLab features: skill progression tracking, adaptive training programs, strength analytics, fatigue detection, and intelligent workout recommendations.',
  keywords: ['calisthenics features', 'training app features', 'skill tracking', 'workout analytics', 'adaptive training'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/features`,
  },
  openGraph: {
    title: 'Features | SpartanLab Calisthenics Training Platform',
    description: 'Explore SpartanLab features: skill progression tracking, adaptive training programs, and intelligent workout recommendations.',
    url: `${SITE_CONFIG.url}/features`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpartanLab Features',
    description: 'Skill tracking, adaptive training, and intelligent workout recommendations.',
  },
}

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
