import { Metadata } from 'next'
import { Suspense } from 'react'
import { AthleteOnboarding } from '@/components/onboarding/AthleteOnboarding'

export const metadata: Metadata = {
  title: 'Build Your Training Program - SpartanLab',
  description: 'SpartanLab analyzes your strength, skill experience, equipment, and goals to build adaptive calisthenics programming based on real training methodologies.',
}

// Loading fallback for Suspense (useSearchParams requires Suspense boundary)
// [PHASE 16H] Use 100dvh for true mobile viewport isolation
function OnboardingLoading() {
  return (
    <div className="h-[100dvh] bg-[#0F1115] flex items-center justify-center overflow-hidden">
      <div className="w-8 h-8 border-2 border-[#C1121F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <AthleteOnboarding />
    </Suspense>
  )
}
