import { Metadata } from 'next'
import { AthleteOnboarding } from '@/components/onboarding/AthleteOnboarding'

export const metadata: Metadata = {
  title: 'Athlete Onboarding - SpartanLab',
  description: 'We analyze your strength, skill experience, equipment, and schedule to generate a calisthenics training program designed specifically for you.',
}

export default function OnboardingPage() {
  return <AthleteOnboarding />
}
