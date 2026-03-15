import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'SpartanLab Pricing | Calisthenics Training Platform',
  description: 'Explore SpartanLab pricing and unlock adaptive calisthenics training programs, strength analytics, and performance tracking.',
  keywords: ['calisthenics training intelligence', 'adaptive training engine', 'calisthenics program generator', 'calisthenics training platform', 'fitness app pricing'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/pricing`,
  },
  openGraph: {
    title: 'SpartanLab Pricing | Calisthenics Training Platform',
    description: 'Explore SpartanLab pricing and unlock adaptive calisthenics training programs, strength analytics, and performance tracking.',
    url: `${SITE_CONFIG.url}/pricing`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpartanLab Pricing',
    description: 'Adaptive calisthenics training programs and analytics.',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
