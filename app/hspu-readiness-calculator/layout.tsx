import { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Handstand Push-Up Readiness Calculator | HSPU Test | SpartanLab',
  description: 'Calculate your HSPU readiness score. Evaluate pike push-up strength, wall handstand ability, dip strength, and overhead pressing to get personalized recommendations for handstand push-up training.',
  keywords: ['hspu readiness', 'handstand push-up calculator', 'hspu requirements', 'hspu test', 'hspu prerequisites', 'wall hspu', 'calisthenics calculator'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/hspu-readiness-calculator`,
  },
  openGraph: {
    title: 'Handstand Push-Up Readiness Calculator | SpartanLab',
    description: 'Test if you are ready for HSPU training. Evaluate your pike push-up strength, handstand ability, and overhead pressing power.',
    url: `${SITE_CONFIG.url}/hspu-readiness-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HSPU Readiness Calculator | SpartanLab',
    description: 'Test if you are ready for handstand push-up training with this free calculator.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
