'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/shared/Navigation'
import { WeeklyVolumeCard } from '@/components/recovery/WeeklyVolumeCard'
import { VolumeDistributionChart } from '@/components/recovery/VolumeDistributionChart'
import { MovementBalanceCard } from '@/components/recovery/MovementBalanceCard'
import { RecoverySignalCard } from '@/components/recovery/RecoverySignalCard'
import { TrainingInsightsCard } from '@/components/recovery/TrainingInsightsCard'
import {
  calculateWeeklyVolume,
  calculateVolumeDistribution,
  calculateMovementBalance,
  type WeeklyVolumeSummary,
  type VolumeDistribution,
  type MovementBalance,
} from '@/lib/volume-analyzer'
import { calculateRecoverySignal, type RecoverySignal } from '@/lib/recovery-engine'
import { generateTrainingInsights, type TrainingInsight } from '@/lib/training-insights'
import { Activity } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { RecoveryEmptyState } from '@/components/shared/EmptyStates'

export default function RecoveryPage() {
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolumeSummary | null>(null)
  const [volumeDistribution, setVolumeDistribution] = useState<VolumeDistribution[]>([])
  const [movementBalance, setMovementBalance] = useState<MovementBalance | null>(null)
  const [recoverySignal, setRecoverySignal] = useState<RecoverySignal | null>(null)
  const [insights, setInsights] = useState<TrainingInsight[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setWeeklyVolume(calculateWeeklyVolume())
    setVolumeDistribution(calculateVolumeDistribution())
    setMovementBalance(calculateMovementBalance())
    setRecoverySignal(calculateRecoverySignal())
    setInsights(generateTrainingInsights())
  }, [])

  // Check for meaningful data
  const hasData = weeklyVolume && weeklyVolume.totalSets > 0

  // Loading state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-[#2A2A2A] rounded w-1/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-28 bg-[#2A2A2A] rounded-lg"></div>
              <div className="h-28 bg-[#2A2A2A] rounded-lg"></div>
              <div className="h-28 bg-[#2A2A2A] rounded-lg"></div>
              <div className="h-28 bg-[#2A2A2A] rounded-lg"></div>
            </div>
            <div className="h-64 bg-[#2A2A2A] rounded-lg"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <PageHeader 
          title="Volume & Recovery"
          description="Analyze your training load and recovery status to optimize performance"
          backHref="/dashboard"
          backLabel="Back to Dashboard"
          icon={<Activity className="w-5 h-5" />}
        />

        <div className="space-y-6">
          {/* Empty State */}
          {!hasData && <RecoveryEmptyState />}

          {/* Weekly Volume Summary */}
          {hasData && weeklyVolume && <WeeklyVolumeCard volume={weeklyVolume} />}

          {/* Two column layout for distribution and balance */}
          {hasData && (
            <div className="grid lg:grid-cols-2 gap-6">
              <VolumeDistributionChart distribution={volumeDistribution} />
              {movementBalance && <MovementBalanceCard balance={movementBalance} />}
            </div>
          )}

          {/* Recovery and Insights */}
          {hasData && (
            <div className="grid lg:grid-cols-2 gap-6">
              {recoverySignal && <RecoverySignalCard recovery={recoverySignal} />}
              <TrainingInsightsCard insights={insights} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
