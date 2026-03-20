'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/shared/Navigation'
import { GoalProjectionList } from '@/components/goals/GoalProjectionList'
import { ProjectionExplanation } from '@/components/goals/ProjectionExplanation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  calculateAllProjections, 
  type GoalProjection,
  SUPPORTED_GOALS 
} from '@/lib/goal-projection-engine'
import { Target, Trophy, TrendingUp, ArrowRight, Zap, Crosshair } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { GoalProjectionEmptyState } from '@/components/shared/EmptyStates'

export default function GoalsPage() {
  const [projections, setProjections] = useState<GoalProjection[]>([])
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    setProjections(calculateAllProjections())
  }, [])
  
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-[#1A1F26] rounded w-1/3"></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-48 bg-[#1A1F26] rounded-lg"></div>
              <div className="h-48 bg-[#1A1F26] rounded-lg"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  const achievedCount = projections.filter(p => p.status === 'goal_reached').length
  const inProgressCount = projections.filter(p => p.status !== 'goal_reached' && p.status !== 'needs_data').length
  const onTrackCount = projections.filter(p => p.status === 'on_track').length
  const needsDataCount = projections.filter(p => p.status === 'needs_data').length
  
  // Check if all projections need data
  const allNeedData = needsDataCount === projections.length || projections.length === 0
  
  // Find nearest milestone (shortest timeline)
  const nearestMilestone = projections
    .filter(p => p.timeRange !== null && p.status !== 'goal_reached')
    .sort((a, b) => (a.timeRange?.minWeeks || 999) - (b.timeRange?.minWeeks || 999))[0]
  
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E6E9EF]">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-8">
          {/* Header */}
          <PageHeader 
            title="Goal Projections"
            description="Realistic timeline estimates based on your skill level, strength, and training consistency"
            backHref="/dashboard"
            backLabel="Back to Dashboard"
            icon={<Crosshair className="w-5 h-5" />}
          />
          
          {/* Empty State */}
          {allNeedData && <GoalProjectionEmptyState />}

          {/* Summary Cards */}
          {!allNeedData && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#C1121F]/10 rounded-lg">
                  <Target className="w-5 h-5 text-[#C1121F]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E6E9EF]">{inProgressCount}</p>
                  <p className="text-sm text-[#A4ACB8]">Goals In Progress</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E6E9EF]">{onTrackCount}</p>
                  <p className="text-sm text-[#A4ACB8]">On Track</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-lg">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E6E9EF]">{achievedCount}</p>
                  <p className="text-sm text-[#A4ACB8]">Goals Achieved</p>
                </div>
              </div>
            </Card>
          </div>
          )}
          
          {/* Nearest Milestone Highlight */}
          {nearestMilestone && nearestMilestone.timeRange && (
            <Card className="bg-gradient-to-r from-[#C1121F]/5 to-[#1A1F26] border-[#C1121F]/20 p-5">
              <div className="flex flex-col gap-5">
                {/* Top Row - Milestone Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#C1121F] uppercase tracking-wider font-medium mb-1">
                      Nearest Milestone
                    </p>
                    <p className="text-xl font-bold text-[#E6E9EF]">
                      {nearestMilestone.nextLevelName} {nearestMilestone.goalName}
                    </p>
                    <p className="text-sm text-[#A4ACB8] mt-1">
                      Currently at {nearestMilestone.currentLevelName}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Estimated</p>
                    <p className="text-2xl font-bold text-[#C1121F]">
                      {nearestMilestone.timeRange.label}
                    </p>
                  </div>
                </div>
                
                {/* Limiter & Action */}
                {nearestMilestone.mainLimiter && nearestMilestone.mainLimiter !== 'None - On Track' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#2B313A]">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#E6E9EF]">
                          Main Factor: {nearestMilestone.mainLimiter}
                        </p>
                        {nearestMilestone.action && (
                          <p className="text-sm text-[#A4ACB8] mt-0.5">
                            {nearestMilestone.action.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link href="/program">
                      <Button className="bg-[#C1121F] hover:bg-[#A30F1A] text-white gap-2 whitespace-nowrap">
                        Open Program
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Card>
          )}
          
          {/* How it works */}
          <ProjectionExplanation />
          
          {/* All Projections */}
          <GoalProjectionList
            projections={projections}
            title="Skill Projections"
            emptyMessage="Update your skill progressions to see projections."
          />
        </div>
      </main>
    </div>
  )
}
