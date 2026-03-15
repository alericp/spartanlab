'use client'

import { Navigation } from '@/components/shared/Navigation'
import { ChallengesPanel } from '@/components/challenges/challenges-panel'
import { ChallengeNotificationContainer } from '@/components/challenges/challenge-notification'

export default function ChallengesPage() {
  return (
    <div className="min-h-screen bg-[#0F1115]">
      <Navigation />
      
      <main className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#E6E9EF] mb-2">Challenges</h1>
          <p className="text-sm text-[#9CA3AF]">
            Complete challenges to earn points and badges
          </p>
        </div>
        
        <ChallengesPanel />
      </main>
      
      <ChallengeNotificationContainer />
    </div>
  )
}
