'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  type GoalProjection, 
  getConfidenceColor,
  getConfidenceLabel 
} from '@/lib/goal-projection-engine'
import { Target, ArrowRight, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { InsightExplanation, generateProjectionExplanation } from '@/components/shared/InsightExplanation'
import { AdaptiveEngineBadge, ENGINE_MESSAGES } from '@/components/shared/AdaptiveEngineBadge'
import { ProBadge, InsightUpgradeHint } from '@/components/premium/PremiumFeature'

interface ProgressForecastCardProps {
  nextMilestone: GoalProjection | null
}

export function ProgressForecastCard({ nextMilestone }: ProgressForecastCardProps) {
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-[#C1121F]" />
        <h3 className="font-semibold text-[#E6E9EF]">Goal Projection</h3>
        <ProBadge size="sm" />
      </div>
      
      {nextMilestone ? (
        <div className="space-y-4">
          {/* Goal Reached State */}
          {nextMilestone.status === 'goal_reached' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400" />
                <span className="text-[#E6E9EF] font-semibold">{nextMilestone.goalName}</span>
              </div>
              <div className="px-3 py-2 bg-amber-500/10 rounded-lg">
                <p className="text-sm text-amber-400">
                  {nextMilestone.currentLevelName} achieved!
                </p>
              </div>
            </div>
          ) : nextMilestone.status === 'needs_data' ? (
            /* Needs Data State */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#6B7280]" />
                <span className="text-[#E6E9EF] font-semibold">{nextMilestone.goalName}</span>
              </div>
              <p className="text-sm text-[#A4ACB8]">
                {nextMilestone.explanation}
              </p>
            </div>
          ) : (
            /* Active Projection */
            <div className="space-y-4">
              {/* Current & Next */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#6B7280] uppercase tracking-wider">
                    {nextMilestone.goalName}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getConfidenceColor(nextMilestone.confidence) }}
                    />
                    <span className="text-xs text-[#6B7280]">
                      {getConfidenceLabel(nextMilestone.confidence)}
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-[#A4ACB8]">{nextMilestone.currentLevelName}</span>
                  <ArrowRight className="w-3 h-3 text-[#6B7280]" />
                  <span className="text-lg font-semibold text-[#E6E9EF]">{nextMilestone.nextLevelName}</span>
                </div>
              </div>
              
              {/* Timeline */}
              {nextMilestone.timeRange && (
                <div className="flex items-center gap-2 py-2 px-3 bg-[#0F1115] rounded-lg">
                  <Clock className="w-4 h-4 text-[#A4ACB8]" />
                  <span className="text-sm text-[#A4ACB8]">Estimated:</span>
                  <span className="text-sm font-semibold text-[#C1121F]">
                    {nextMilestone.timeRange.label}
                  </span>
                </div>
              )}
              
              {/* Main Limiter & Focus */}
              {nextMilestone.mainLimiter && nextMilestone.mainLimiter !== 'None - On Track' && (
                <div className="pt-2 border-t border-[#2B313A]">
                  <p className="text-xs text-[#6B7280] mb-1">
                    <span className="text-[#C1121F]">Focus:</span> {nextMilestone.mainLimiter}
                  </p>
                  {nextMilestone.action && (
                    <p className="text-xs text-[#A4ACB8]">{nextMilestone.action.primary}</p>
                  )}
                </div>
              )}

              {/* Explanation Layer */}
              <InsightExplanation
                explanation={generateProjectionExplanation(
                  nextMilestone.confidence,
                  nextMilestone.mainLimiter,
                  nextMilestone.currentLevelName || '',
                  nextMilestone.nextLevelName || ''
                )}
                variant="bordered"
              />
            </div>
          )}
          
          {/* Engine Branding */}
          <div className="pt-2 border-t border-[#2B313A]/50">
            <AdaptiveEngineBadge variant="minimal" message={ENGINE_MESSAGES.forecast} />
          </div>

          {/* Insight Upgrade Hint */}
          <InsightUpgradeHint />
          
          {/* View All Link */}
          <div className="pt-2">
            <Link href="/goals">
              <Button variant="ghost" className="w-full justify-between text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#2B313A]">
                View All Projections
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* No Data State */
        <div className="space-y-4">
          <p className="text-sm text-[#A4ACB8]">
            Set a primary goal and log training data to see projections.
          </p>
          <Link href="/goals">
            <Button variant="ghost" className="w-full justify-between text-[#A4ACB8] hover:text-[#E6E9EF] hover:bg-[#2B313A]">
              View Goals
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
