import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Weighted Pull-Up Calculator | Estimate 1RM & Strength Level | SpartanLab',
  description: 'Calculate your weighted pull-up 1RM and relative strength ratio. Determine your strength level from Beginner to Elite based on added weight percentage.',
  keywords: ['weighted pull-up calculator', 'pull-up 1RM calculator', 'weighted calisthenics calculator', 'relative strength calculator', 'pull-up strength standards'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/weighted-pull-up-calculator`,
  },
  openGraph: {
    title: 'Weighted Pull-Up Calculator | SpartanLab',
    description: 'Calculate your weighted pull-up 1RM and determine your relative strength level.',
    url: `${SITE_CONFIG.url}/weighted-pull-up-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
}

export default function WeightedPullUpCalculatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
