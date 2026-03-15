'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Target, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Zap,
  Activity,
  Info
} from 'lucide-react'
import type { UnifiedSkillPrediction } from '@/lib/prediction'
import { ProBadge } from '@/components/premium/PremiumFeature'

interface UnifiedPredictionCardProps {
  prediction: UnifiedSkillPrediction
  showDetails?: boolean
  compact?: boolean
}

/**
 * UnifiedPredictionCard
 * 
 * A premium prediction card that displays unified skill predictions
 * with timeline estimates, limiters, and coach guidance.
 */
export function UnifiedPredictionCard({ 
  prediction, 
  showDetails = true,
  compact = false 
}: UnifiedPredictionCardProps) {
  const isAchieved = prediction.currentStage.level >= prediction.longTermTarget.level
  const hasInsufficientData = prediction.dataQuality === 'insufficient'
  
  // Status-based styling
  const getStatusBadge = () => {
    if (isAchieved) {
      return (
        <div className="px-2.5 py-1 bg-amber-500/10 rounded-full">
          <span className="text-amber-400 text-xs font-semibold">Achieved</span>
        </div>
      )
    }
    if (hasInsufficientData) {
      return (
        <div className="px-2.5 py-1 bg-[#6B7280]/10 rounded-full">
          <span className="text-[#6B7280] text-xs font-semibold">Needs Data</span>
        </div>
      )
    }
    if (prediction.readinessScore >= 70) {
      return (
        <div className="px-2.5 py-1 bg-green-500/10 rounded-full">
          <span className="text-green-400 text-xs font-semibold">On Track</span>
        </div>
      )
    }
    return (
      <div className="px-2.5 py-1 bg-[#C1121F]/10 rounded-full">
        <span className="text-[#C1121F] text-xs font-semibold">Building</span>
      </div>
    )
  }
  
  // Confidence band color
  const getConfidenceBandColor = () => {
    switch (prediction.estimatedTimeToNextStage?.confidenceBand) {
      case 'confident': return 'text-green-400'
      case 'likely': return 'text-[#C1121F]'
      case 'rough_estimate': return 'text-[#A4ACB8]'
      default: return 'text-[#6B7280]'
    }
  }
  
  // Momentum indicator
  const getMomentumIcon = () => {
    switch (prediction.momentumModifier.direction) {
      case 'accelerating':
        return <TrendingUp className="w-3.5 h-3.5 text-green-400" />
      case 'decelerating':
        return <TrendingUp className="w-3.5 h-3.5 text-orange-400 rotate-180" />
      default:
        return <Activity className="w-3.5 h-3.5 text-[#A4ACB8]" />
    }
  }
  
  if (compact) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${isAchieved ? 'bg-amber-500/10' : 'bg-[#C1121F]/10'}`}>
              {isAchieved ? (
                <CheckCircle className="w-4 h-4 text-amber-400" />
              ) : (
                <Target className="w-4 h-4 text-[#C1121F]" />
              )}
            </div>
            <div>
              <p className="font-medium text-[#E6E9EF] text-sm">{prediction.skillName}</p>
              <p className="text-xs text-[#A4ACB8]">{prediction.currentStage.name}</p>
            </div>
          </div>
          
          <div className="text-right">
            {prediction.estimatedTimeToNextStage && !isAchieved && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#A4ACB8]" />
                <span className={`text-sm font-medium ${getConfidenceBandColor()}`}>
                  {prediction.estimatedTimeToNextStage.displayLabel}
                </span>
              </div>
            )}
            {isAchieved && (
              <span className="text-xs text-amber-400">Mastered</span>
            )}
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isAchieved ? 'bg-amber-500/10' : 'bg-[#C1121F]/10'}`}>
            {isAchieved ? (
              <CheckCircle className="w-5 h-5 text-amber-400" />
            ) : (
              <Target className="w-5 h-5 text-[#C1121F]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#E6E9EF] text-lg">{prediction.skillName}</h3>
              <ProBadge size="sm" />
            </div>
            <p className="text-sm text-[#A4ACB8] mt-0.5">
              {prediction.currentStage.name}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>
      
      {/* Active Prediction Content */}
      {!isAchieved && !hasInsufficientData && (
        <div className="space-y-4">
          {/* Next Milestone with Timeline */}
          <div className="flex items-center justify-between py-3 px-4 bg-[#0F1115] rounded-lg">
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Next Level</p>
              <p className="text-[#E6E9EF] font-semibold">{prediction.nextStage?.name}</p>
            </div>
            {prediction.estimatedTimeToNextStage && (
              <div className="text-right">
                <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Estimated</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#A4ACB8]" />
                  <span className={`font-semibold ${getConfidenceBandColor()}`}>
                    {prediction.estimatedTimeToNextStage.displayLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Primary Limiter */}
          {prediction.primaryLimiter && (
            <div className="py-3 px-4 bg-[#C1121F]/5 border border-[#C1121F]/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#C1121F]" />
                <p className="text-xs text-[#C1121F] uppercase tracking-wider font-semibold">
                  Primary Limiter
                </p>
              </div>
              <p className="text-[#E6E9EF] font-medium">{prediction.primaryLimiter.label}</p>
              <p className="text-sm text-[#A4ACB8] mt-1">{prediction.primaryLimiter.explanation}</p>
              <p className="text-xs text-[#6B7280] mt-2 italic">{prediction.primaryLimiter.timelineImpact}</p>
            </div>
          )}
          
          {/* Dynamic Modifiers */}
          {showDetails && (
            <div className="flex items-center gap-4 text-sm">
              {/* Momentum */}
              <div className="flex items-center gap-1.5">
                {getMomentumIcon()}
                <span className="text-[#A4ACB8] capitalize">
                  {prediction.momentumModifier.direction}
                </span>
              </div>
              
              {/* Recovery */}
              <div className="flex items-center gap-1.5">
                <Zap className={`w-3.5 h-3.5 ${
                  prediction.recoveryModifier.status === 'optimal' ? 'text-green-400' :
                  prediction.recoveryModifier.status === 'fatigued' ? 'text-orange-400' :
                  'text-[#A4ACB8]'
                }`} />
                <span className="text-[#A4ACB8] capitalize">
                  {prediction.recoveryModifier.status}
                </span>
              </div>
              
              {/* Readiness */}
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#A4ACB8]" />
                <span className="text-[#A4ACB8]">
                  {prediction.readinessScore}% ready
                </span>
              </div>
            </div>
          )}
          
          {/* Coach Notes */}
          {showDetails && prediction.coachNotes.length > 0 && (
            <div className="pt-2 border-t border-[#2B313A]">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="w-3.5 h-3.5 text-[#6B7280]" />
                <p className="text-xs text-[#6B7280] uppercase tracking-wider">Coach Notes</p>
              </div>
              <ul className="space-y-1">
                {prediction.coachNotes.slice(0, 2).map((note, i) => (
                  <li key={i} className="text-sm text-[#A4ACB8]">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Suggested Focus */}
          {showDetails && prediction.suggestedExercises.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-[#6B7280] uppercase tracking-wider">
                Suggested Focus
              </p>
              <div className="flex flex-wrap gap-2">
                {prediction.suggestedExercises.slice(0, 3).map((exercise, i) => (
                  <span 
                    key={i}
                    className="px-2.5 py-1 bg-[#0F1115] border border-[#2B313A] rounded-md text-xs text-[#E6E9EF]"
                  >
                    {exercise}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Long-term Target */}
          {prediction.estimatedTimeToTarget && (
            <div className="pt-3 border-t border-[#2B313A]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">
                  Full {prediction.longTermTarget.name}
                </span>
                <span className="text-[#A4ACB8]">
                  {prediction.estimatedTimeToTarget.displayLabel}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Achieved State */}
      {isAchieved && (
        <div className="space-y-3">
          <div className="py-3 px-4 bg-amber-500/10 rounded-lg">
            <p className="text-sm text-amber-400">
              {prediction.longTermTarget.name} achieved! Focus on hold quality and duration.
            </p>
          </div>
          {prediction.coachNotes.length > 0 && (
            <p className="text-sm text-[#A4ACB8]">{prediction.coachNotes[0]}</p>
          )}
        </div>
      )}
      
      {/* Needs Data State */}
      {hasInsufficientData && !isAchieved && (
        <div className="space-y-3">
          <p className="text-sm text-[#A4ACB8]">
            Log more training data for a reliable projection.
          </p>
          {prediction.missingDataPoints.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {prediction.missingDataPoints.map((point, i) => (
                <span 
                  key={i}
                  className="px-2.5 py-1 bg-[#0F1115] border border-[#2B313A] rounded-md text-xs text-[#6B7280]"
                >
                  Missing: {point}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Data Quality Indicator */}
      <div className="mt-4 pt-3 border-t border-[#2B313A]/50">
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span>Data quality: {prediction.dataQuality}</span>
          <span>
            Based on {prediction.basedOnSessions} sessions, {prediction.basedOnStrengthRecords} strength records
          </span>
        </div>
      </div>
    </Card>
  )
}
