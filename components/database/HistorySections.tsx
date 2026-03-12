'use client'

import { Card } from '@/components/ui/card'
import { Target, Dumbbell, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { SkillHistorySnapshot, StrengthHistorySnapshot, TrainingHistorySnapshot } from '@/lib/history-snapshot-engine'
import type { TrendDirection } from '@/lib/strength-trend-engine'

// =============================================================================
// TREND INDICATOR
// =============================================================================

function TrendIndicator({ trend }: { trend: TrendDirection }) {
  if (trend === 'improving') {
    return (
      <div className="flex items-center gap-1 text-green-400">
        <TrendingUp className="w-3 h-3" />
        <span className="text-xs">Improving</span>
      </div>
    )
  }
  if (trend === 'regressing') {
    return (
      <div className="flex items-center gap-1 text-red-400">
        <TrendingDown className="w-3 h-3" />
        <span className="text-xs">Regressing</span>
      </div>
    )
  }
  if (trend === 'insufficient_data') {
    return (
      <div className="flex items-center gap-1 text-[#6A6A6A]">
        <Minus className="w-3 h-3" />
        <span className="text-xs">New</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 text-[#6A6A6A]">
      <Minus className="w-3 h-3" />
      <span className="text-xs">Stable</span>
    </div>
  )
}

// =============================================================================
// SKILL HISTORY SECTION
// =============================================================================

interface SkillHistorySectionProps {
  snapshots: SkillHistorySnapshot[]
}

export function SkillHistorySection({ snapshots }: SkillHistorySectionProps) {
  const hasData = snapshots.some(s => s.hasData)
  
  if (!hasData) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
            <Target className="w-5 h-5 text-[#E63946]" />
          </div>
          <h2 className="text-lg font-semibold">Skill History</h2>
        </div>
        <p className="text-sm text-[#6A6A6A]">
          Log skill sessions to see your progression history.
        </p>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
          <Target className="w-5 h-5 text-[#E63946]" />
        </div>
        <h2 className="text-lg font-semibold">Skill History</h2>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        {snapshots.filter(s => s.hasData).map(snapshot => (
          <Card 
            key={snapshot.skillName}
            className="bg-[#2A2A2A] border-[#3A3A3A] p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium">{snapshot.skillLabel}</h3>
                <p className="text-xs text-[#6A6A6A]">{snapshot.currentLevelName}</p>
              </div>
              <TrendIndicator trend={snapshot.holdTrend} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#6A6A6A] mb-1">Best Hold</p>
                <p className="text-lg font-semibold">{snapshot.bestHoldSeconds}s</p>
                {snapshot.previousBestHold > 0 && snapshot.previousBestHold !== snapshot.bestHoldSeconds && (
                  <p className="text-xs text-[#6A6A6A]">prev: {snapshot.previousBestHold}s</p>
                )}
              </div>
              <div>
                <p className="text-xs text-[#6A6A6A] mb-1">Sessions</p>
                <p className="text-lg font-semibold">{snapshot.totalSessions}</p>
              </div>
            </div>
            
            {snapshot.lastSessionDate && (
              <p className="text-xs text-[#6A6A6A] mt-3 pt-3 border-t border-[#3A3A3A]">
                Last session: {new Date(snapshot.lastSessionDate).toLocaleDateString()}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// STRENGTH HISTORY SECTION
// =============================================================================

interface StrengthHistorySectionProps {
  snapshots: StrengthHistorySnapshot[]
}

export function StrengthHistorySection({ snapshots }: StrengthHistorySectionProps) {
  const hasData = snapshots.some(s => s.hasData)
  
  if (!hasData) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold">Strength History</h2>
        </div>
        <p className="text-sm text-[#6A6A6A]">
          Log weighted strength to track your history.
        </p>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold">Strength History</h2>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-3">
        {snapshots.filter(s => s.hasData).map(snapshot => (
          <Card 
            key={snapshot.exercise}
            className="bg-[#2A2A2A] border-[#3A3A3A] p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-sm">{snapshot.exerciseLabel}</h3>
              <TrendIndicator trend={snapshot.trend} />
            </div>
            
            <div className="space-y-3">
              {snapshot.bestRecentSet && (
                <div>
                  <p className="text-xs text-[#6A6A6A] mb-1">Recent Best</p>
                  <p className="font-semibold">
                    +{snapshot.bestRecentSet.weight} x {snapshot.bestRecentSet.reps}
                  </p>
                </div>
              )}
              
              {snapshot.allTimeBestSet && (
                <div>
                  <p className="text-xs text-[#6A6A6A] mb-1">All-Time Best</p>
                  <p className="font-semibold">
                    +{snapshot.allTimeBestSet.weight} x {snapshot.allTimeBestSet.reps}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t border-[#3A3A3A]">
                <div>
                  <p className="text-xs text-[#6A6A6A]">Est 1RM</p>
                  <p className="font-semibold">{snapshot.estimatedOneRM}</p>
                </div>
                {snapshot.relativeStrength && (
                  <div className="text-right">
                    <p className="text-xs text-[#6A6A6A]">Relative</p>
                    <p className="font-semibold text-blue-400">{snapshot.relativeStrength}x BW</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// TRAINING HISTORY SECTION
// =============================================================================

interface TrainingHistorySectionProps {
  snapshot: TrainingHistorySnapshot
}

export function TrainingHistorySection({ snapshot }: TrainingHistorySectionProps) {
  if (!snapshot.hasData) {
    return (
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold">Training History</h2>
        </div>
        <p className="text-sm text-[#6A6A6A]">
          Log workouts to see your training history.
        </p>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
          <Activity className="w-5 h-5 text-green-400" />
        </div>
        <h2 className="text-lg font-semibold">Training History</h2>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-[#6A6A6A]">This Week</p>
            <TrendIndicator trend={snapshot.frequencyTrend} />
          </div>
          <p className="text-2xl font-bold">{snapshot.recentWeeklyWorkouts}</p>
          <p className="text-xs text-[#6A6A6A]">workouts</p>
        </Card>
        
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <p className="text-xs text-[#6A6A6A] mb-2">Total Workouts</p>
          <p className="text-2xl font-bold">{snapshot.totalWorkouts}</p>
          <p className="text-xs text-[#6A6A6A]">all time</p>
        </Card>
        
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <p className="text-xs text-[#6A6A6A] mb-2">Avg Duration</p>
          <p className="text-2xl font-bold">{snapshot.averageSessionDuration}</p>
          <p className="text-xs text-[#6A6A6A]">minutes</p>
        </Card>
        
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <p className="text-xs text-[#6A6A6A] mb-2">Consistency</p>
          <p className="text-2xl font-bold">{snapshot.consistencyScore}%</p>
          <p className="text-xs text-[#6A6A6A]">last 8 weeks</p>
        </Card>
      </div>
      
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
        <p className="text-xs text-[#6A6A6A] mb-3">Weekly Volume (This Week)</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-blue-400">{snapshot.pullVolumeWeekly}</p>
            <p className="text-xs text-[#6A6A6A]">Pull sets</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#E63946]">{snapshot.pushVolumeWeekly}</p>
            <p className="text-xs text-[#6A6A6A]">Push sets</p>
          </div>
          <div>
            <p className="text-sm font-medium text-orange-400">{snapshot.coreVolumeWeekly}</p>
            <p className="text-xs text-[#6A6A6A]">Core sets</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
