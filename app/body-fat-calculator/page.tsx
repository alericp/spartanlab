import type { Metadata } from 'next'
import { BodyFatCalculatorPage } from '@/components/calculators/BodyFatCalculatorPage'
import { SITE_CONFIG } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Body Fat Calculator (U.S. Navy Method) | SpartanLab',
  description: 'Calculate your body fat percentage using the accurate U.S. Navy circumference method. Free body fat calculator with measurement instructions for men and women.',
  keywords: ['body fat calculator', 'navy body fat formula', 'body fat percentage', 'fitness calculator', 'calisthenics', 'body composition'],
  alternates: {
    canonical: `${SITE_CONFIG.url}/body-fat-calculator`,
  },
  openGraph: {
    title: 'Body Fat Calculator (U.S. Navy Method) | SpartanLab',
    description: 'Calculate your body fat percentage using the accurate U.S. Navy circumference method. Free body fat calculator with measurement instructions.',
    url: `${SITE_CONFIG.url}/body-fat-calculator`,
    siteName: SITE_CONFIG.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Body Fat Calculator (U.S. Navy Method) | SpartanLab',
    description: 'Free body fat calculator using the U.S. Navy circumference method.',
  },
}

export default function Page() {
  return <BodyFatCalculatorPage />
}
