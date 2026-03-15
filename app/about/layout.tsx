import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About SpartanLab | Calisthenics Training Platform',
  description: 'Learn how SpartanLab helps calisthenics athletes train smarter using data-driven programming and adaptive training recommendations.',
  keywords: ['calisthenics training system', 'calisthenics training platform', 'adaptive calisthenics training', 'fitness technology'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/about`,
  },
  openGraph: {
    title: 'About SpartanLab | Calisthenics Training Platform',
    description: 'Learn how SpartanLab helps calisthenics athletes train smarter using data-driven programming.',
    url: `${SITE_CONFIG.url}/about`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About SpartanLab',
    description: 'Calisthenics training intelligence built by athletes, for athletes.',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
