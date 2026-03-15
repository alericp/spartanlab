import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'How It Works | SpartanLab',
  description: 'Learn how SpartanLab analyzes your training, identifies weak points, and generates personalized calisthenics programs to accelerate your progress.',
  keywords: ['how spartanlab works', 'calisthenics training system', 'adaptive training', 'personalized workout'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/how-it-works`,
  },
  openGraph: {
    title: 'How It Works | SpartanLab',
    description: 'Learn how SpartanLab analyzes your training and generates personalized calisthenics programs.',
    url: `${SITE_CONFIG.url}/how-it-works`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How SpartanLab Works',
    description: 'Personalized calisthenics training powered by intelligent analysis.',
  },
}

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
