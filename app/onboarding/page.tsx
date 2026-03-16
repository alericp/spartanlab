import { Metadata } from 'next'
import { AthleteOnboarding } from '@/components/onboarding/AthleteOnboarding'

export const metadata: Metadata = {
  title: 'Build Your Training Program - SpartanLab',
  description: 'Create your personalized calisthenics program in about 3 minutes. We analyze your strength, skill experience, equipment, and schedule to detect your limiting factors and generate adaptive training.',
}

export default function OnboardingPage() {
  return <AthleteOnboarding />
}
