import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'One-Arm Pull-Up Readiness Calculator | Am I Strong Enough? | SpartanLab',
  description: 'Calculate your one-arm pull-up readiness score based on weighted pull-up strength, archer pull-ups, and unilateral development. Free OAP strength requirements calculator.',
  keywords: [
    'one arm pull up requirements',
    'one arm pull up strength',
    'OAP readiness calculator',
    'one arm pull up calculator',
    'how strong for one arm pull up',
    'weighted pull up for OAP',
    'one arm chin up requirements',
    'archer pull up progression',
    'one arm pull up prerequisites',
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/one-arm-pull-up-readiness-calculator`,
  },
  openGraph: {
    title: 'One-Arm Pull-Up Readiness Calculator | SpartanLab',
    description: 'Calculate your one-arm pull-up readiness based on weighted pull-up strength, archer pull-ups, and grip development.',
    url: `${SITE_CONFIG.url}/one-arm-pull-up-readiness-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'One-Arm Pull-Up Readiness Calculator',
    description: 'Are you strong enough for one-arm pull-ups? Test your readiness with this calculator.',
  },
}

export default function OneArmPullUpReadinessCalculatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
