import { Metadata } from 'next'
import { AthleteOnboarding } from '@/components/onboarding/AthleteOnboarding'

export const metadata: Metadata = {
  title: 'Build Your Training Program - SpartanLab',
  description: 'SpartanLab analyzes your strength, skill experience, equipment, and goals to build adaptive calisthenics programming based on real training methodologies.',
}

export default function OnboardingPage() {
  return <AthleteOnboarding />
}
