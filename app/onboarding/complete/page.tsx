import { Metadata } from 'next'
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete'

export const metadata: Metadata = {
  title: 'Setup Complete - SpartanLab',
  description: 'Your personalized training program is ready. Start your calisthenics journey with SpartanLab.',
}

export default function OnboardingCompletePage() {
  return <OnboardingComplete />
}
