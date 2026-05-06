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
import { 
  getCurrentSeasonInfo, 
  getOpenHeadToHeadChallenges, 
  type HeadToHeadChallenge,
  CHALLENGE_CATEGORY_LABELS 
} from '@/lib/challenges/challenge-definitions'
import { ChallengeCard, ChallengeGrid, ChallengePreview } from './challenge-card'
import { Trophy, ArrowRight, Flame, Target, Calendar, Star, Dumbbell, Clock, Swords } from 'lucide-react'

// =============================================================================
// FULL CHALLENGES PANEL
// =============================================================================

interface ChallengesPanelProps {
  className?: string
}

type ChallengeTab = 'weekly' | 'monthly' | 'skill' | 'strength' | 'time' | 'seasonal'

export function ChallengesPanel({ className }: ChallengesPanelProps) {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([])
  const [summary, setSummary] = useState<ChallengeSummary | null>(null)
  const [activeTab, setActiveTab] = useState<ChallengeTab>('weekly')
  
  useEffect(() => {
    setChallenges(getAllChallengesWithProgress())
    setSummary(getChallengeSummary())
  }, [])
  
  const weeklyChallenges = challenges.filter(c => c.period === 'weekly')
  const monthlyChallenges = challenges.filter(c => c.period === 'monthly')
  const skillChallenges = challenges.filter(c => c.category === 'skill')
  const strengthChallenges = challenges.filter(c => c.category === 'strength')
  const timeChallenges = challenges.filter(c => c.category === 'time')
  const seasonalChallenges = challenges.filter(c => c.period === 'seasonal')
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
                {currentSeason.name}
              </h2>
              <p className="text-sm text-[#9CA3AF]">
                {currentSeason.theme}
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ChallengeTab)}>
        <TabsList className="bg-[#1A1D23] border border-[#2A2F38] flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="weekly" className="data-[state=active]:bg-[#2A2F38] text-xs sm:text-sm">
            <Flame className="w-3.5 h-3.5 mr-1.5" />
            Weekly ({weeklyChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-[#2A2F38] text-xs sm:text-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Monthly ({monthlyChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="skill" className="data-[state=active]:bg-[#2A2F38] text-xs sm:text-sm">
            <Star className="w-3.5 h-3.5 mr-1.5" />
            Skill ({skillChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="strength" className="data-[state=active]:bg-[#2A2F38] text-xs sm:text-sm">
            <Dumbbell className="w-3.5 h-3.5 mr-1.5" />
            Strength ({strengthChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="time" className="data-[state=active]:bg-[#2A2F38] text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Timed ({timeChallenges.length})
          </TabsTrigger>
          {seasonalChallenges.length > 0 && (
            <TabsTrigger value="seasonal" className="data-[state=active]:bg-[#2A2F38] text-xs sm:text-sm">
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              Seasonal ({seasonalChallenges.length})
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="weekly" className="mt-4">
          <ChallengeGrid challenges={weeklyChallenges} />
        </TabsContent>
        
        <TabsContent value="monthly" className="mt-4">
          <ChallengeGrid challenges={monthlyChallenges} />
        </TabsContent>
        
        <TabsContent value="skill" className="mt-4">
          <div className="mb-4 p-3 rounded-lg bg-[#2A2F38]/50 border border-[#2A2F38]">
            <p className="text-sm text-[#9CA3AF]">
              Skill challenges reward milestone achievements. Log your holds and reps to track progress.
            </p>
          </div>
          <ChallengeGrid challenges={skillChallenges} />
        </TabsContent>
        
        <TabsContent value="strength" className="mt-4">
          <div className="mb-4 p-3 rounded-lg bg-[#2A2F38]/50 border border-[#2A2F38]">
            <p className="text-sm text-[#9CA3AF]">
              Strength challenges track your max consecutive reps and weighted PRs.
            </p>
          </div>
          <ChallengeGrid challenges={strengthChallenges} />
        </TabsContent>
        
        <TabsContent value="time" className="mt-4">
          <div className="mb-4 p-3 rounded-lg bg-[#2A2F38]/50 border border-[#2A2F38]">
            <p className="text-sm text-[#9CA3AF]">
              Timed challenges test your endurance. Complete max reps or holds within the time limit.
            </p>
          </div>
          <ChallengeGrid challenges={timeChallenges} />
        </TabsContent>
        
        <TabsContent value="seasonal" className="mt-4">
          <ChallengeGrid challenges={seasonalChallenges} />
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
    setChallenges(getAllChallengesWithProgress())
    setSummary(getChallengeSummary())
  }, [])
  
  // Show most progressed incomplete challenges first
  const prioritizedChallenges = [...challenges]
    .filter(c => !c.isCompleted && !c.completed)
    .sort((a, b) => (b.progressPercent ?? 0) - (a.progressPercent ?? 0))
    .slice(0, 2)
  
  const completedCount = challenges.filter(c => c.isCompleted || c.completed).length
  
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
    // [PRE-AB6 BUILD GREEN GATE / CHALLENGE DISPLAY CONTRACT]
    // Use the flattened display helper (getAllChallengesWithProgress)
    // instead of the raw nested engine helper (getActiveChallengesWithProgress).
    // The widget state is typed as ChallengeWithProgress[] (flattened
    // UI shape with id/name/percentComplete/isCompleted at the top
    // level), so feeding it the raw { challenge, progress, percentComplete }
    // engine shape was a contract mismatch. ChallengeWithProgress exposes
    // both `percentComplete` (required) and `progressPercent?` (optional)
    // plus both `completed` and `isCompleted?`, so the safe-fallback
    // form below is fully type-checked and matches the pattern already
    // used in ChallengesSummaryCard above.
    const active = getAllChallengesWithProgress()
      .filter(c => !(c.isCompleted ?? c.completed))
      .sort(
        (a, b) =>
          (b.progressPercent ?? b.percentComplete ?? 0) -
          (a.progressPercent ?? a.percentComplete ?? 0)
      )
      .slice(0, 1)
    setChallenges(active)
  }, [])

  if (challenges.length === 0) return null

  const challenge = challenges[0]
  const progressPercent = challenge.progressPercent ?? challenge.percentComplete ?? 0

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
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-[#6B7280] shrink-0">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
