import { Metadata } from 'next'
import { AthleteOnboarding } from '@/components/onboarding/AthleteOnboarding'

export const metadata: Metadata = {
  title: 'Athlete Onboarding - SpartanLab',
  description: 'Complete your athlete profile to calibrate the SpartanLab Adaptive Training Engine for personalized calisthenics programming.',
}

export default function OnboardingPage() {
  return <AthleteOnboarding />
}
