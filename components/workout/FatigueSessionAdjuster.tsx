'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  getFatigueTrainingDecision,
  getDecisionLabel,
  getDecisionColor,
  getDeloadLabel,
  type FatigueDecision,
  type TrainingDecision,
} from '@/lib/fatigue-decision-engine'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  TrendingDown,
} from 'lucide-react'

interface FatigueSessionAdjusterProps {
  onAcceptAdjustment: (adjustments: FatigueDecision['adjustments']) => void
  onKeepOriginal: () => void
  showFullDetails?: boolean
}

export function FatigueSessionAdjuster({
  onAcceptAdjustment,
  onKeepOriginal,
  showFullDetails = false,
}: FatigueSessionAdjusterProps) {
  const [decision, setDecision] = useState<FatigueDecision | null>(null)
  const [showDetails, setShowDetails] = useState(showFullDetails)
  const [hasChosen, setHasChosen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const result = getFatigueTrainingDecision()
      setDecision(result)
    }
  }, [])

  if (!decision) {
    return null
  }

  // Don't show if training as planned
  if (decision.decision === 'TRAIN_AS_PLANNED') {
    return null
  }

  // User already made a choice
  if (hasChosen) {
    return null
  }

  const handleAccept = () => {
    setHasChosen(true)
    onAcceptAdjustment(decision.adjustments)
  }

  const handleKeepOriginal = () => {
    setHasChosen(true)
    onKeepOriginal()
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 border-b border-[#2B313A] cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DecisionIcon decision={decision.decision} />
            <div>
              <p className="text-sm text-[#6B7280] mb-0.5">Recovery Intelligence</p>
              <p 
                className="font-semibold"
                style={{ color: getDecisionColor(decision.decision) }}
              >
                {getDecisionLabel(decision.decision)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {decision.confidence !== 'low' && (
              <span className="text-xs text-[#6B7280] px-2 py-0.5 bg-[#0F1115] rounded">
                {decision.confidence === 'high' ? 'High Confidence' : 'Moderate Confidence'}
              </span>
            )}
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-[#6B7280]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6B7280]" />
            )}
          </div>
        </div>
      </div>

      {/* Guidance Summary */}
      <div className="px-4 py-3 bg-[#0F1115]">
        <p className="text-sm text-[#A4ACB8]">{decision.shortGuidance}</p>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="p-4 space-y-4 border-t border-[#2B313A]">
          {/* Explanation */}
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">Analysis</p>
            <p className="text-sm text-[#A4ACB8]">{decision.explanation}</p>
          </div>

          {/* Adjustment Details */}
          <div className="grid grid-cols-2 gap-3">
            {decision.adjustments.reduceAccessoryVolume && (
              <div className="bg-[#0F1115] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-[#6B7280]">Accessory Volume</span>
                </div>
                <p className="text-sm font-medium text-[#E6E9EF]">
                  -{decision.adjustments.reduceAccessoryPercent}%
                </p>
              </div>
            )}

            {decision.adjustments.reduceOverallSets && (
              <div className="bg-[#0F1115] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs text-[#6B7280]">Total Sets</span>
                </div>
                <p className="text-sm font-medium text-[#E6E9EF]">
                  -{decision.adjustments.overallSetReduction}%
                </p>
              </div>
            )}

            {decision.adjustments.suggestLowerRPE && (
              <div className="bg-[#0F1115] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs text-[#6B7280]">Target RPE</span>
                </div>
                <p className="text-sm font-medium text-[#E6E9EF]">
                  -{decision.adjustments.rpeReduction} points
                </p>
              </div>
            )}

            {decision.adjustments.preserveSkillWork && (
              <div className="bg-[#0F1115] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-[#6B7280]">Skill Work</span>
                </div>
                <p className="text-sm font-medium text-[#E6E9EF]">Preserved</p>
              </div>
            )}
          </div>

          {/* Deload Recommendation */}
          {decision.deloadRecommendation !== 'NO_DELOAD_NEEDED' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">
                  {getDeloadLabel(decision.deloadRecommendation)}
                </span>
              </div>
              {decision.deloadRecommendation === 'DELOAD_RECOMMENDED' && (
                <p className="text-xs text-amber-400/80 mt-1">
                  Consider a recovery week to restore training capacity.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t border-[#2B313A] flex gap-3">
        <Button
          className="flex-1 bg-[#C1121F] hover:bg-[#A30F1A] text-white"
          onClick={handleAccept}
        >
          Use Recommended
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF]"
          onClick={handleKeepOriginal}
        >
          Keep Original
        </Button>
      </div>
    </Card>
  )
}

function DecisionIcon({ decision }: { decision: TrainingDecision }) {
  const color = getDecisionColor(decision)
  
  switch (decision) {
    case 'TRAIN_AS_PLANNED':
      return <CheckCircle2 className="w-6 h-6" style={{ color }} />
    case 'PRESERVE_QUALITY':
      return <Shield className="w-6 h-6" style={{ color }} />
    case 'LIGHTEN_SESSION':
      return <TrendingDown className="w-6 h-6" style={{ color }} />
    case 'COMPRESS_WEEKLY_LOAD':
      return <Activity className="w-6 h-6" style={{ color }} />
    case 'DELOAD_RECOMMENDED':
      return <AlertTriangle className="w-6 h-6" style={{ color }} />
  }
}

// =============================================================================
// COMPACT FATIGUE INDICATOR FOR SESSION HEADER
// =============================================================================

export function FatigueIndicatorBadge() {
  const [decision, setDecision] = useState<FatigueDecision | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const result = getFatigueTrainingDecision()
      setDecision(result)
    }
  }, [])

  if (!decision || decision.decision === 'TRAIN_AS_PLANNED') {
    return null
  }

  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
      style={{ 
        backgroundColor: `${getDecisionColor(decision.decision)}15`,
        color: getDecisionColor(decision.decision),
      }}
    >
      <Activity className="w-3 h-3" />
      {getDecisionLabel(decision.decision)}
    </div>
  )
}

// =============================================================================
// DELOAD WEEK CARD
// =============================================================================

interface DeloadWeekCardProps {
  onAcceptDeload: () => void
  onDismiss: () => void
}

export function DeloadWeekCard({ onAcceptDeload, onDismiss }: DeloadWeekCardProps) {
  const [decision, setDecision] = useState<FatigueDecision | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const result = getFatigueTrainingDecision()
      setDecision(result)
    }
  }, [])

  if (!decision || decision.deloadRecommendation !== 'DELOAD_RECOMMENDED') {
    return null
  }

  return (
    <Card className="bg-[#1A1F26] border-amber-500/30 overflow-hidden">
      <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-400">Deload Week Recommended</p>
            <p className="text-sm text-amber-400/80">Recovery signals suggest a lighter training week</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-[#A4ACB8]">{decision.explanation}</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0F1115] rounded-lg p-3 text-center">
            <p className="text-xs text-[#6B7280] mb-1">Volume</p>
            <p className="text-lg font-bold text-amber-400">
              -{decision.weeklyAdjustments.volumeReductionPercent}%
            </p>
          </div>
          <div className="bg-[#0F1115] rounded-lg p-3 text-center">
            <p className="text-xs text-[#6B7280] mb-1">Sessions</p>
            <p className="text-lg font-bold text-[#E6E9EF]">
              {decision.weeklyAdjustments.sessionsToPreserve}
            </p>
          </div>
          <div className="bg-[#0F1115] rounded-lg p-3 text-center">
            <p className="text-xs text-[#6B7280] mb-1">RPE Target</p>
            <p className="text-lg font-bold text-[#E6E9EF]">
              -{decision.adjustments.rpeReduction}
            </p>
          </div>
        </div>

        <div className="bg-[#0F1115] rounded-lg p-3">
          <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">Focus Areas</p>
          <ul className="space-y-1">
            <li className="text-sm text-[#A4ACB8] flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-green-400" />
              Maintain movement patterns
            </li>
            <li className="text-sm text-[#A4ACB8] flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-green-400" />
              Reduce loading and density
            </li>
            <li className="text-sm text-[#A4ACB8] flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-green-400" />
              Prioritize skill practice
            </li>
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-[#2B313A] flex gap-3">
        <Button
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
          onClick={onAcceptDeload}
        >
          Start Deload Week
        </Button>
        <Button
          variant="outline"
          className="border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF]"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </Card>
  )
}
