import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Muscle-Up Readiness Calculator | SpartanLab',
  description: 'Calculate your muscle-up readiness score. Evaluate pull-up strength, dip strength, chest-to-bar ability, and explosive power to get personalized recommendations.',
  keywords: ['muscle-up readiness', 'muscle-up calculator', 'muscle-up requirements', 'calisthenics calculator', 'muscle-up test', 'how many pull-ups for muscle-up'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/muscle-up-readiness-calculator`,
  },
  openGraph: {
    title: 'Muscle-Up Readiness Calculator | SpartanLab',
    description: 'Calculate your muscle-up readiness score. Evaluate pull-up strength, dip strength, chest-to-bar ability, and explosive power.',
    url: `${SITE_CONFIG.url}/muscle-up-readiness-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muscle-Up Readiness Calculator | SpartanLab',
    description: 'Test if you are ready for muscle-up training with this free calculator.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
