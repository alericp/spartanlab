'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/shared/Navigation'
import { Card } from '@/components/ui/card'
import { SpartanScoreCard } from '@/components/performance/SpartanScoreCard'
import { ScoreBreakdown } from '@/components/performance/ScoreBreakdown'
import { calculateSpartanScore, type StrengthScoreBreakdown } from '@/lib/strength-score-engine'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyStates'
import { TrendingUp, BarChart3 } from 'lucide-react'

export default function PerformancePage() {
  const [score, setScore] = useState<StrengthScoreBreakdown | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const scoreData = calculateSpartanScore()
    setScore(scoreData)
  }, [])

  if (!mounted || !score) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-[#2A2A2A] rounded-lg" />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="h-48 bg-[#2A2A2A] rounded-lg" />
              <div className="h-48 bg-[#2A2A2A] rounded-lg" />
              <div className="h-48 bg-[#2A2A2A] rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Check if we have enough data
  const hasData = score.hasEnoughData

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-8">
          {/* Header */}
          <PageHeader 
            title="Performance Analytics"
            description="Your Spartan Strength Score and detailed performance breakdown"
            backHref="/dashboard"
            backLabel="Back to Dashboard"
            icon={<TrendingUp className="w-5 h-5" />}
          />

          {!hasData ? (
            <EmptyState
              icon={<BarChart3 className="w-8 h-8" />}
              title="Build Your Performance Score"
              description="Log strength, skills, and workouts to generate your Spartan Strength Score (0-1000) combining skill progression, weighted strength, readiness, and consistency."
              primaryAction={{
                label: 'Log Strength',
                href: '/strength',
              }}
              secondaryAction={{
                label: 'Track Skills',
                href: '/skills',
              }}
              variant="card"
            />
          ) : (
            <>
              {/* Main Score Card */}
              <SpartanScoreCard score={score} />

              {/* Score Breakdown */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Score Breakdown</h2>
                <ScoreBreakdown score={score} />
              </div>

              {/* Interpretation Guide */}
              <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
                <h3 className="text-xl font-bold mb-4">Spartan Levels (0-1000)</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { name: 'Beginner', range: '0–199', color: '#718096' },
                    { name: 'Developing', range: '200–399', color: '#A0AEC0' },
                    { name: 'Intermediate', range: '400–599', color: '#60A5FA' },
                    { name: 'Advanced', range: '600–799', color: '#E63946' },
                    { name: 'Elite', range: '800–1000', color: '#FFD700' },
                  ].map((level) => (
                    <div key={level.name} className="bg-[#1A1A1A] rounded-lg p-4 text-center border border-[#3A3A3A]">
                      <div
                        className="w-2 h-2 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: level.color }}
                      />
                      <p className="font-semibold text-sm">{level.name}</p>
                      <p className="text-xs text-[#A5A5A5] mt-1">{level.range}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* How It Works */}
              <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
                <h3 className="text-xl font-bold mb-4">How Your Score Is Calculated</h3>
                <div className="space-y-3 text-sm">
                  <p className="text-[#A5A5A5]">
                    Your Spartan Strength Score (0-1000) is a deterministic metric combining four performance pillars:
                  </p>
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <span className="text-[#E63946] font-bold w-10">35%</span>
                      <span className="text-[#A5A5A5]">
                        <strong>Skill Progress</strong> — Your advancement through planche, front lever, muscle-up, and handstand push-up progressions.
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#E63946] font-bold w-10">35%</span>
                      <span className="text-[#A5A5A5]">
                        <strong>Weighted Strength</strong> — Your estimated 1RM across weighted pull-ups, dips, and muscle-ups.
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#E63946] font-bold w-10">15%</span>
                      <span className="text-[#A5A5A5]">
                        <strong>Skill Readiness</strong> — How close you are to progressing based on hold quality and density.
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#E63946] font-bold w-10">15%</span>
                      <span className="text-[#A5A5A5]">
                        <strong>Training Consistency</strong> — Your weekly workout frequency and recent activity.
                      </span>
                    </div>
                  </div>
                  <p className="text-[#A5A5A5] pt-2">
                    This score updates automatically as you log strength, update skills, and record workouts.
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
