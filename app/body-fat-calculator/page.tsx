import type { Metadata } from 'next'
import { BodyFatCalculatorPage } from '@/components/calculators/BodyFatCalculatorPage'

export const metadata: Metadata = {
  title: 'Body Fat Calculator (U.S. Navy Method) | SpartanLab',
  description: 'Calculate your body fat percentage using the accurate U.S. Navy circumference method. Free body fat calculator with measurement instructions for men and women.',
  keywords: ['body fat calculator', 'navy body fat formula', 'body fat percentage', 'fitness calculator', 'calisthenics'],
  openGraph: {
    title: 'Body Fat Calculator (U.S. Navy Method) | SpartanLab',
    description: 'Calculate your body fat percentage using the accurate U.S. Navy circumference method. Free body fat calculator with measurement instructions.',
    type: 'website',
  },
}

export default function Page() {
  return <BodyFatCalculatorPage />
}
