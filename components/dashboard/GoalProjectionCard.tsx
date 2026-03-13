'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, TrendingUp, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { 
  calculateGoalProjection, 
  calculateProjectionForPrimaryGoal,
  type GoalProjection,
  type GoalType,
  getConfidenceLabel,
} from '@/lib/goal-projection-engine'

interface GoalProjectionCardProps {
  goalType?: GoalType
  compact?: boolean
}

export function GoalProjectionCard({ goalType, compact = false }: GoalProjectionCardProps) {
  const [projection, setProjection] = useState<GoalProjection | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const result = goalType 
        ? calculateGoalProjection(goalType)
        : calculateProjectionForPrimaryGoal()
      setProjection(result)
    } catch {
      // Silent fail
    }
  }, [goalType])

  if (!mounted || !projection) {
    return null
  }

  const statusColors = {
    on_track: 'text-emerald-400',
    building: 'text-[#C1121F]',
    goal_reached: 'text-amber-400',
    needs_data: 'text-[#6B7280]',
  }

  const statusLabels = {
    on_track: 'On Track',
    building: 'Building',
    goal_reached: 'Achieved',
    needs_data: 'Needs Data',
  }

  const StatusIcon = projection.status === 'goal_reached' ? CheckCircle2 :
                    projection.status === 'on_track' ? TrendingUp :
                    projection.status === 'needs_data' ? AlertCircle : Target

  if (compact) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${projection.status === 'goal_reached' ? 'bg-amber-500/10' : 'bg-[#C1121F]/10'}`}>
                <StatusIcon className={`w-4 h-4 ${statusColors[projection.status]}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#E6E9EF]">{projection.goalName}</p>
                <p className="text-xs text-[#6B7280]">
                  {projection.isAtFinalLevel ? 'Goal Achieved' : projection.nextLevelName}
                </p>
              </div>
            </div>
            {projection.timeRange && (
              <div className="text-right">
                <p className="text-sm font-semibold text-[#E6E9EF]">{projection.timeRange.label}</p>
                <p className="text-xs text-[#6B7280]">{getConfidenceLabel(projection.confidence)} est.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-[#E6E9EF] flex items-center gap-2">
            <Target className="w-4 h-4 text-[#C1121F]" />
            {projection.goalName}
          </CardTitle>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            projection.status === 'goal_reached' ? 'bg-amber-500/10 text-amber-400' :
            projection.status === 'on_track' ? 'bg-emerald-500/10 text-emerald-400' :
            projection.status === 'needs_data' ? 'bg-gray-500/10 text-gray-400' :
            'bg-[#C1121F]/10 text-[#C1121F]'
          }`}>
            {statusLabels[projection.status]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current & Next Level */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#6B7280]">Current:</span>
          <span className="text-[#E6E9EF] font-medium">{projection.currentLevelName}</span>
          {projection.nextLevelName && (
            <>
              <ChevronRight className="w-4 h-4 text-[#6B7280]" />
              <span className="text-[#C1121F] font-medium">{projection.nextLevelName}</span>
            </>
          )}
        </div>

        {/* Time Projection */}
        {projection.timeRange && (
          <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C1121F]" />
                <span className="text-sm text-[#A4ACB8]">Estimated Timeline</span>
              </div>
              <span className="text-xs text-[#6B7280]">{getConfidenceLabel(projection.confidence)}</span>
            </div>
            <p className="text-xl font-bold text-[#E6E9EF]">{projection.timeRange.label}</p>
            <p className="text-xs text-[#6B7280] mt-1">{projection.confidenceReason}</p>
          </div>
        )}

        {/* Explanation */}
        <p className="text-sm text-[#A4ACB8]">{projection.explanation}</p>

        {/* Factors */}
        <div className="grid grid-cols-2 gap-2">
          <FactorBadge 
            label="Strength" 
            value={projection.factors.strengthSupport} 
          />
          <FactorBadge 
            label="Consistency" 
            value={projection.factors.trainingConsistency} 
          />
        </div>

        {/* Action Recommendation */}
        {projection.action && (
          <div className="bg-[#C1121F]/5 border border-[#C1121F]/20 rounded-lg p-3">
            <p className="text-xs text-[#C1121F] font-medium mb-1">Focus Area</p>
            <p className="text-sm text-[#E6E9EF] font-medium">{projection.action.primary}</p>
            <p className="text-xs text-[#A4ACB8] mt-1">{projection.action.reasoning}</p>
            {projection.action.exercises.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {projection.action.exercises.slice(0, 2).map((ex, i) => (
                  <span key={i} className="text-xs bg-[#2B313A] text-[#A4ACB8] px-2 py-0.5 rounded">
                    {ex}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FactorBadge({ label, value }: { label: string; value: string }) {
  const colors = {
    strong: 'text-emerald-400 bg-emerald-500/10',
    high: 'text-emerald-400 bg-emerald-500/10',
    good: 'text-emerald-400 bg-emerald-500/10',
    moderate: 'text-amber-400 bg-amber-500/10',
    developing: 'text-amber-400 bg-amber-500/10',
    weak: 'text-red-400 bg-red-500/10',
    low: 'text-red-400 bg-red-500/10',
    early: 'text-gray-400 bg-gray-500/10',
    unknown: 'text-gray-400 bg-gray-500/10',
  }

  const colorClass = colors[value as keyof typeof colors] || colors.unknown

  return (
    <div className={`text-xs px-2 py-1.5 rounded ${colorClass}`}>
      <span className="text-[#6B7280]">{label}:</span>{' '}
      <span className="capitalize font-medium">{value}</span>
    </div>
  )
}

// Multiple projections view
export function GoalProjectionsOverview() {
  const [projections, setProjections] = useState<GoalProjection[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const { calculateAllProjections } = require('@/lib/goal-projection-engine')
      const results = calculateAllProjections()
      // Filter to show only those with data or selected goals
      setProjections(results.filter((p: GoalProjection) => p.hasEnoughData || p.status !== 'needs_data'))
    } catch {
      // Silent fail
    }
  }, [])

  if (!mounted || projections.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-[#A4ACB8] flex items-center gap-2">
        <Target className="w-4 h-4" />
        Goal Projections
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        {projections.slice(0, 4).map(projection => (
          <GoalProjectionCard key={projection.goalType} goalType={projection.goalType} compact />
        ))}
      </div>
    </div>
  )
}
