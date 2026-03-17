import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Calisthenics Strength Standards Calculator | SpartanLab',
  description: 'Find your calisthenics strength level from Beginner to Elite. Compare your pull-ups, dips, push-ups, and core strength against structured standards. Identify movement imbalances and see which skills you are ready to pursue.',
  keywords: [
    'calisthenics strength standards',
    'calisthenics strength calculator',
    'pull-up standards',
    'dip strength chart',
    'bodyweight strength levels',
    'calisthenics strength test',
    'calisthenics benchmarks',
    'pull-up test',
    'dip test',
    'bodyweight fitness levels',
    'calisthenics level calculator',
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/calisthenics-strength-standards`,
  },
  openGraph: {
    title: 'Calisthenics Strength Standards Calculator | SpartanLab',
    description: 'Find your calisthenics strength level. Compare your pull-ups, dips, push-ups, and core strength against structured standards.',
    url: `${SITE_CONFIG.url}/calisthenics-strength-standards`,
    siteName: SITE_CONFIG.name,
    type: 'article',
    publishedTime: '2024-01-01T00:00:00Z',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calisthenics Strength Standards Calculator | SpartanLab',
    description: 'Know your strength level from beginner to elite. Identify imbalances and skill readiness.',
  },
}

export default function CalisthenicsStrengthStandardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
