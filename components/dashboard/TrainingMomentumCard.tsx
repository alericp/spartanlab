'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Flame, Activity } from 'lucide-react'
import { 
  type TrainingMomentum, 
  type MomentumLevel,
  getMomentumColor 
} from '@/lib/training-momentum-engine'
import { InsightExplanation, generateMomentumExplanation } from '@/components/shared/InsightExplanation'

interface TrainingMomentumCardProps {
  momentum: TrainingMomentum
}

export function TrainingMomentumCard({ momentum }: TrainingMomentumCardProps) {
  const {
    level,
    label,
    score,
    workoutsLast7Days,
    trend,
    trendDescription,
    explanation,
    suggestion,
    hasData,
    daysSinceLastWorkout,
  } = momentum

  const color = getMomentumColor(level)
  
  // Progress bar segments (10 segments)
  const filledSegments = Math.round(score / 10)

  // Trend icon
  const TrendIcon = trend === 'increasing' 
    ? TrendingUp 
    : trend === 'decreasing' 
      ? TrendingDown 
      : Minus

  const trendColor = trend === 'increasing' 
    ? 'text-green-500' 
    : trend === 'decreasing' 
      ? 'text-[#A4ACB8]' 
      : 'text-[#6B7280]'

  if (!hasData) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#A4ACB8] mb-1">Training Momentum</h3>
            <p className="text-[#6B7280] text-sm">
              Log workouts to start building training momentum.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <Flame className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#A4ACB8]">Training Momentum</h3>
              <p className="text-lg font-semibold" style={{ color }}>{label}</p>
            </div>
          </div>
          
          {/* Trend indicator */}
          <div className={`flex items-center gap-1.5 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-xs">{trend === 'increasing' ? 'Building' : trend === 'decreasing' ? 'Fading' : 'Stable'}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-sm transition-colors"
                style={{
                  backgroundColor: i < filledSegments ? color : '#2B313A',
                }}
              />
            ))}
          </div>
          
          {/* Stats row */}
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>{workoutsLast7Days} workout{workoutsLast7Days !== 1 ? 's' : ''} this week</span>
            {daysSinceLastWorkout !== null && (
              <span>
                {daysSinceLastWorkout === 0 
                  ? 'Trained today' 
                  : daysSinceLastWorkout === 1 
                    ? 'Last: yesterday'
                    : `Last: ${daysSinceLastWorkout} days ago`
                }
              </span>
            )}
          </div>
        </div>
        
        {/* Explanation */}
        <p className="text-sm text-[#A4ACB8]">{explanation}</p>
        
        {/* Suggestion - only show if not at very_strong */}
        {level !== 'very_strong' && (
          <p className="text-xs text-[#6B7280] border-t border-[#2B313A] pt-3">
            {suggestion}
          </p>
        )}

        {/* Explanation Layer */}
        <InsightExplanation
          explanation={generateMomentumExplanation(workoutsLast7Days, trend, daysSinceLastWorkout)}
          variant="bordered"
        />
      </div>
    </Card>
  )
}

// Compact variant for tight spaces
export function TrainingMomentumCompact({ momentum }: TrainingMomentumCardProps) {
  const { level, label, score, workoutsLast7Days, hasData } = momentum
  const color = getMomentumColor(level)
  const filledSegments = Math.round(score / 10)

  if (!hasData) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0F1115] border border-[#2B313A]">
        <Flame className="w-4 h-4 text-[#6B7280]" />
        <span className="text-sm text-[#6B7280]">No momentum data</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-[#0F1115] border border-[#2B313A]">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4" style={{ color }} />
        <span className="text-sm font-medium" style={{ color }}>{label}</span>
      </div>
      
      <div className="flex-1 flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-sm"
            style={{
              backgroundColor: i < filledSegments ? color : '#2B313A',
            }}
          />
        ))}
      </div>
      
      <span className="text-xs text-[#6B7280]">{workoutsLast7Days}/wk</span>
    </div>
  )
}
