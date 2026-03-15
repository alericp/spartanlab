'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  getAllChallengesWithProgress,
  getChallengesByPeriodWithProgress,
  getChallengeSummary,
  type ChallengeWithProgress,
  type ChallengeSummary,
} from '@/lib/challenges/challenge-engine'
import { getCurrentSeasonInfo } from '@/lib/challenges/challenge-definitions'
import { ChallengeCard, ChallengeGrid, ChallengePreview } from './challenge-card'
import { Trophy, ArrowRight, Flame, Target, Calendar } from 'lucide-react'

// =============================================================================
// FULL CHALLENGES PANEL
// =============================================================================

interface ChallengesPanelProps {
  className?: string
}

export function ChallengesPanel({ className }: ChallengesPanelProps) {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([])
  const [summary, setSummary] = useState<ChallengeSummary | null>(null)
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly')
  
  useEffect(() => {
    setChallenges(getAllChallengesWithProgress())
    setSummary(getChallengeSummary())
  }, [])
  
  const weeklyChallenges = challenges.filter(c => c.period === 'weekly')
  const monthlyChallenges = challenges.filter(c => c.period === 'monthly')
  const currentSeason = getCurrentSeasonInfo()
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Season Header */}
      {currentSeason && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-[#E6E9EF]">
                {currentSeason.displayName}
              </h2>
              <p className="text-sm text-[#9CA3AF]">
                {currentSeason.description}
              </p>
            </div>
          </div>
          
          {summary && (
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">
                  {summary.completedThisMonth}
                </p>
                <p className="text-xs text-[#6B7280]">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#E6E9EF]">
                  +{summary.totalPointsEarned}
                </p>
                <p className="text-xs text-[#6B7280]">Points</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Challenge Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'weekly' | 'monthly')}>
        <TabsList className="bg-[#1A1D23] border border-[#2A2F38]">
          <TabsTrigger value="weekly" className="data-[state=active]:bg-[#2A2F38]">
            <Flame className="w-4 h-4 mr-2" />
            Weekly ({weeklyChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-[#2A2F38]">
            <Calendar className="w-4 h-4 mr-2" />
            Monthly ({monthlyChallenges.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="mt-4">
          <ChallengeGrid challenges={weeklyChallenges} />
        </TabsContent>
        
        <TabsContent value="monthly" className="mt-4">
          <ChallengeGrid challenges={monthlyChallenges} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =============================================================================
// DASHBOARD SUMMARY CARD
// =============================================================================

interface ChallengesSummaryCardProps {
  className?: string
}

export function ChallengesSummaryCard({ className }: ChallengesSummaryCardProps) {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([])
  const [summary, setSummary] = useState<ChallengeSummary | null>(null)
  
  useEffect(() => {
    setChallenges(getActiveChallengesWithProgress())
    setSummary(getChallengeSummary())
  }, [])
  
  // Show most progressed incomplete challenges first
  const prioritizedChallenges = [...challenges]
    .filter(c => !c.isCompleted)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 2)
  
  const completedCount = challenges.filter(c => c.isCompleted).length
  
  return (
    <Card className={cn(
      'bg-[#1A1D23] border-[#2A2F38] overflow-hidden',
      className
    )}>
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2A2F38] flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[#E6E9EF]">Active Challenges</h3>
              <p className="text-xs text-[#6B7280]">
                {completedCount} of {challenges.length} completed
              </p>
            </div>
          </div>
          
          <Link href="/challenges">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#9CA3AF] hover:text-[#E6E9EF]"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        {/* Challenge Preview */}
        {prioritizedChallenges.length > 0 ? (
          <ChallengePreview challenges={prioritizedChallenges} maxShow={2} />
        ) : challenges.length > 0 ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-sm font-medium text-amber-400">All Complete!</p>
              <p className="text-xs text-[#6B7280]">Great work this week</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <p className="text-sm text-[#6B7280]">No active challenges</p>
          </div>
        )}
        
        {/* Quick Stats */}
        {summary && summary.totalPointsEarned > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2A2F38]">
            <span className="text-xs text-[#6B7280]">Points earned from challenges</span>
            <span className="text-sm font-medium text-amber-400">
              +{summary.totalPointsEarned}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

// =============================================================================
// COMPACT WIDGET
// =============================================================================

interface ChallengesWidgetProps {
  className?: string
}

export function ChallengesWidget({ className }: ChallengesWidgetProps) {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([])
  
  useEffect(() => {
    const active = getActiveChallengesWithProgress()
      .filter(c => !c.isCompleted)
      .sort((a, b) => b.progressPercent - a.progressPercent)
      .slice(0, 1)
    setChallenges(active)
  }, [])
  
  if (challenges.length === 0) return null
  
  const challenge = challenges[0]
  
  return (
    <Link href="/challenges" className={cn('block', className)}>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1D23] border border-[#2A2F38] hover:border-[#3A3F48] transition-colors">
        <div className="w-8 h-8 rounded-lg bg-[#2A2F38] flex items-center justify-center shrink-0">
          <Target className="w-4 h-4 text-amber-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#E6E9EF] truncate">
            {challenge.name}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-[#2A2F38] overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${challenge.progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-[#6B7280] shrink-0">
              {challenge.progressPercent}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
