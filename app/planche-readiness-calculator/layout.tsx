import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Planche Readiness Calculator | SpartanLab',
  description: 'Calculate your planche readiness score. Evaluate pushing strength, dip strength, planche lean, and shoulder conditioning to get personalized recommendations.',
  keywords: ['planche readiness', 'planche calculator', 'planche requirements', 'calisthenics calculator', 'planche test', 'planche prerequisites'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/planche-readiness-calculator`,
  },
  openGraph: {
    title: 'Planche Readiness Calculator | SpartanLab',
    description: 'Calculate your planche readiness score. Evaluate pushing strength, dip strength, planche lean, and shoulder conditioning.',
    url: `${SITE_CONFIG.url}/planche-readiness-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planche Readiness Calculator | SpartanLab',
    description: 'Test if you are ready for planche training with this free calculator.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
