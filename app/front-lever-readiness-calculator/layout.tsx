import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Front Lever Readiness Calculator | SpartanLab',
  description: 'Calculate your front lever readiness score. Evaluate pulling strength, weighted pull-ups, hollow hold, and tuck hold to get personalized recommendations.',
  keywords: ['front lever readiness', 'front lever calculator', 'front lever requirements', 'calisthenics calculator', 'front lever test', 'how many pull-ups for front lever'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/front-lever-readiness-calculator`,
  },
  openGraph: {
    title: 'Front Lever Readiness Calculator | SpartanLab',
    description: 'Calculate your front lever readiness score. Evaluate pulling strength, weighted pull-ups, hollow hold, and tuck hold.',
    url: `${SITE_CONFIG.url}/front-lever-readiness-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Front Lever Readiness Calculator | SpartanLab',
    description: 'Test if you are ready for front lever training with this free calculator.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
