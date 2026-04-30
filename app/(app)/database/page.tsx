'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/shared/Navigation'
import { Card } from '@/components/ui/card'
import { PRVaultSection } from '@/components/database/PRVaultSection'
import { SkillHistorySection, StrengthHistorySection, TrainingHistorySection } from '@/components/database/HistorySections'
import { MilestonesSection } from '@/components/database/MilestonesSection'
import { EliteInsightsSection } from '@/components/database/EliteInsightsSection'
import { getPRVault, type PRVault } from '@/lib/pr-vault-engine'
import { getMilestones, type MilestoneSnapshot } from '@/lib/milestone-engine'
import { getHistoryOverview, type HistoryOverview } from '@/lib/history-snapshot-engine'
import { getEliteInsights, type EliteInsightsSnapshot } from '@/lib/elite-insight-engine'
import { getQuickEngineStatus } from '@/lib/adaptive-athlete-engine'
import { calculateSpartanScore, type StrengthScoreBreakdown, getLevelColor } from '@/lib/strength-score-engine'
import { getCurrentUser, getAthleteProfile } from '@/lib/data-service'
// NOTE: seedSampleSessions removed - must not auto-seed real user data
import { Database, Crown, Sparkles, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PerformanceVaultEmptyState } from '@/components/shared/EmptyStates'
import Link from 'next/link'

export default function DatabasePage() {
  const [mounted, setMounted] = useState(false)
  const [prVault, setPRVault] = useState<PRVault | null>(null)
  const [milestones, setMilestones] = useState<MilestoneSnapshot | null>(null)
  const [history, setHistory] = useState<HistoryOverview | null>(null)
  const [insights, setInsights] = useState<EliteInsightsSnapshot | null>(null)
  const [spartanScore, setSpartanScore] = useState<StrengthScoreBreakdown | null>(null)
  const [engineStatus, setEngineStatus] = useState<ReturnType<typeof getQuickEngineStatus> | null>(null)
  
  useEffect(() => {
    setMounted(true)
    // Load real user data only - no auto-seeding
    setPRVault(getPRVault())
    setMilestones(getMilestones())
    setHistory(getHistoryOverview())
    setInsights(getEliteInsights())
    setSpartanScore(calculateSpartanScore())
    setEngineStatus(getQuickEngineStatus())
  }, [])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-[#2A2A2A] rounded-lg" />
            <div className="h-48 bg-[#2A2A2A] rounded-lg" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="h-40 bg-[#2A2A2A] rounded-lg" />
              <div className="h-40 bg-[#2A2A2A] rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  const user = getCurrentUser()
  const profile = getAthleteProfile()
  const hasAnyData = (prVault && prVault.totalPRs > 0) || 
                     (milestones && milestones.totalMilestones > 0) ||
                     (history && (history.skills.totalSessions > 0 || history.strength.totalRecords > 0 || history.training.totalWorkouts > 0))
  
  return (
    <div className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PageHeader 
          title="Performance Database"
          description="Your complete training history and performance records"
          backHref="/dashboard"
          backLabel="Back to Dashboard"
          icon={<Database className="w-5 h-5" />}
        />
        
        <div className="space-y-8">
          {/* Elite Header */}
          <header className="relative overflow-hidden">
            <Card className="bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] border-[#3A3A3A] p-6 sm:p-8">
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#E63946]/10 to-transparent rounded-full blur-3xl" />
              
              <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E63946] to-amber-600 flex items-center justify-center shadow-lg shadow-[#E63946]/20">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl sm:text-3xl font-bold">Performance Database</h1>
                      <Crown className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-[#A5A5A5]">
                      Your historical performance vault and analytics command center
                    </p>
                  </div>
                </div>
                
                {spartanScore && (
                  <Link href="/performance" className="group">
                    <Card className="bg-[#1A1A1A] border-[#3A3A3A] p-4 hover:border-[#E63946]/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-[#6A6A6A] mb-1">Spartan Score</p>
                          <p className="text-2xl font-bold" style={{ color: getLevelColor(spartanScore.level) }}>
                            {spartanScore.totalScore}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#6A6A6A] mb-1">Level</p>
                          <p className="font-semibold" style={{ color: getLevelColor(spartanScore.level) }}>
                            {spartanScore.level}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#6A6A6A] group-hover:text-[#E63946] transition-colors" />
                      </div>
                    </Card>
                  </Link>
                )}
              </div>
              
              {/* Quick stats row */}
              {hasAnyData && (
                <div className="mt-6 pt-6 border-t border-[#3A3A3A] grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-[#6A6A6A]">Personal Records</p>
                    <p className="text-xl font-bold">{prVault?.totalPRs || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6A6A6A]">Milestones</p>
                    <p className="text-xl font-bold">{milestones?.totalMilestones || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6A6A6A]">Insights</p>
                    <p className="text-xl font-bold">{insights?.insights.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6A6A6A]">Momentum</p>
                    <p className={`text-sm font-medium ${
                      engineStatus?.momentum === 'improving' ? 'text-green-400' :
                      engineStatus?.momentum === 'regressing' ? 'text-red-400' :
                      engineStatus?.momentum === 'plateauing' ? 'text-amber-400' :
                      'text-[#A5A5A5]'
                    }`}>
                      {engineStatus?.momentumLabel || 'Analyzing...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6A6A6A]">Primary Goal</p>
                    <p className="text-sm font-medium text-[#E63946] capitalize">
                      {profile.primaryGoal?.replace('_', ' ') || 'Not set'}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </header>
          
          {!hasAnyData ? (
            /* Empty state for new users */
            <PerformanceVaultEmptyState />
          ) : (
            /* Main content sections */
            <>
              {/* Premium Insights - Pro tier analytics section */}
              {insights && <EliteInsightsSection snapshot={insights} />}
              
              {/* PR Vault */}
              {prVault && <PRVaultSection vault={prVault} />}
              
              {/* Skill History */}
              {history && <SkillHistorySection snapshots={history.skillSnapshots} />}
              
              {/* Strength History */}
              {history && <StrengthHistorySection snapshots={history.strengthSnapshots} />}
              
              {/* Training History */}
              {history && <TrainingHistorySection snapshot={history.trainingSnapshot} />}
              
              {/* Milestones */}
              {milestones && <MilestonesSection snapshot={milestones} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
