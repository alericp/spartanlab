'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import {
  analyzeFatigue,
  getFatigueLevelColor,
  getFatigueTrendColor,
  type FatigueIndicators,
  type RecoveryStatus,
  type FatigueTrend,
} from '@/lib/fatigue-engine'
import {
  getQuickFatigueDecision,
  getDecisionLabel,
  getDecisionColor,
  type TrainingDecision,
} from '@/lib/fatigue-decision-engine'
import { Activity, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import { InsightExplanation } from '@/components/shared/InsightExplanation'
import { AdaptiveEngineBadge, ENGINE_MESSAGES } from '@/components/shared/AdaptiveEngineBadge'
import { ProBadge, InsightUpgradeHint } from '@/components/premium/PremiumFeature'

// =============================================================================
// STATUS MAPPING
// =============================================================================

interface StatusConfig {
  label: string
  description: string
  color: string
}

function getStatusConfig(recoveryStatus: RecoveryStatus, fatigueScore: number): StatusConfig {
  if (fatigueScore >= 80) {
    return {
      label: 'Deload Recommended',
      description: 'Recent performance patterns indicate recovery may be beneficial.',
      color: '#EF4444',
    }
  }
  if (fatigueScore >= 60) {
    return {
      label: 'Elevated Fatigue',
      description: 'Fatigue accumulation is rising. Consider preserving strength quality.',
      color: '#F97316',
    }
  }
  if (fatigueScore >= 30) {
    return {
      label: 'Moderate Fatigue',
      description: 'Training load is increasing. Continue monitoring recovery.',
      color: '#EAB308',
    }
  }
  return {
    label: 'Optimal',
    description: 'Your recent training performance shows good recovery capacity.',
    color: '#22C55E',
  }
}

function getTrendIcon(trend: FatigueTrend) {
  switch (trend) {
    case 'stable':
      return <Minus className="w-4 h-4" />
    case 'rising':
      return <TrendingUp className="w-4 h-4" />
    case 'elevated':
      return <TrendingUp className="w-4 h-4" />
    case 'critical':
      return <AlertCircle className="w-4 h-4" />
  }
}

function getTrendLabel(trend: FatigueTrend): string {
  switch (trend) {
    case 'stable':
      return 'Stable'
    case 'rising':
      return 'Rising'
    case 'elevated':
      return 'Elevated'
    case 'critical':
      return 'Critical'
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

interface FatigueIntelligenceCardProps {
  className?: string
  compact?: boolean
}

export function FatigueIntelligenceCard({ className = '', compact = false }: FatigueIntelligenceCardProps) {
  const [indicators, setIndicators] = useState<FatigueIndicators | null>(null)
  const [decision, setDecision] = useState<{ decision: TrainingDecision; shortGuidance: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const data = analyzeFatigue()
    setIndicators(data)
    const decisionData = getQuickFatigueDecision()
    setDecision(decisionData)
  }, [])

  if (!mounted || !indicators) {
    return (
      <Card className={`bg-[#1A1F26] border-[#2B313A] p-5 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-[#2B313A] rounded" />
          <div className="h-16 bg-[#2B313A] rounded" />
        </div>
      </Card>
    )
  }

  const statusConfig = getStatusConfig(indicators.recoveryStatus, indicators.fatigueScore.value)
  const trendColor = getFatigueTrendColor(indicators.fatigueTrend.trend)

  if (compact) {
    return (
      <Card className={`bg-[#1A1F26] border-[#2B313A] p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${statusConfig.color}15` }}
            >
              <Activity className="w-5 h-5" style={{ color: statusConfig.color }} />
            </div>
            <div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wider">Recovery</div>
              <div className="text-base font-semibold" style={{ color: statusConfig.color }}>
                {statusConfig.label}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end" style={{ color: trendColor }}>
              {getTrendIcon(indicators.fatigueTrend.trend)}
              <span className="text-sm font-medium">{getTrendLabel(indicators.fatigueTrend.trend)}</span>
            </div>
            <div className="text-xs text-[#6B7280]">Trend</div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`bg-[#1A1F26] border-[#2B313A] p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-[#C1121F]" />
        <h3 className="font-semibold text-[#E6E9EF]">Fatigue Intelligence</h3>
        <ProBadge size="sm" />
        <h3 className="text-lg font-semibold text-[#E6E9EF]">Recovery Status</h3>
      </div>

      {/* Main Status */}
      <div className="bg-[#0F1115] rounded-lg p-4 border border-[#2B313A] mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div 
              className="text-xl font-bold mb-1"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </div>
            <p className="text-sm text-[#A4ACB8] leading-relaxed">
              {statusConfig.description}
            </p>
          </div>
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ml-4"
            style={{ backgroundColor: `${statusConfig.color}15` }}
          >
            {indicators.fatigueScore.value >= 60 ? (
              <AlertCircle className="w-6 h-6" style={{ color: statusConfig.color }} />
            ) : (
              <CheckCircle2 className="w-6 h-6" style={{ color: statusConfig.color }} />
            )}
          </div>
        </div>
      </div>

      {/* Secondary Signals */}
      <div className="grid grid-cols-2 gap-3">
        {/* Fatigue Trend */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Fatigue Trend</div>
          <div className="flex items-center gap-2" style={{ color: trendColor }}>
            {getTrendIcon(indicators.fatigueTrend.trend)}
            <span className="text-base font-semibold">{getTrendLabel(indicators.fatigueTrend.trend)}</span>
          </div>
        </div>

        {/* Training Load */}
        <div className="bg-[#0F1115] rounded-lg p-3 border border-[#2B313A]">
          <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Load Trend</div>
          <div className="flex items-center gap-2 text-[#E6E9EF]">
            {indicators.recentTrainingLoad.loadTrend === 'increasing' && <TrendingUp className="w-4 h-4 text-amber-400" />}
            {indicators.recentTrainingLoad.loadTrend === 'decreasing' && <TrendingDown className="w-4 h-4 text-green-400" />}
            {indicators.recentTrainingLoad.loadTrend === 'stable' && <Minus className="w-4 h-4 text-blue-400" />}
            <span className="text-base font-semibold capitalize">{indicators.recentTrainingLoad.loadTrend}</span>
          </div>
        </div>
      </div>

      {/* Training Decision */}
      {decision && decision.decision !== 'TRAIN_AS_PLANNED' && (
        <div className="mt-4 pt-4 border-t border-[#2B313A]">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4" style={{ color: getDecisionColor(decision.decision) }} />
            <span 
              className="text-sm font-semibold"
              style={{ color: getDecisionColor(decision.decision) }}
            >
              {getDecisionLabel(decision.decision)}
            </span>
          </div>
          <p className="text-sm text-[#A4ACB8]">{decision.shortGuidance}</p>
        </div>
      )}

      {/* Additional Recommendation (if available and no decision shown) */}
      {decision?.decision === 'TRAIN_AS_PLANNED' && indicators.recommendations.length > 0 && indicators.fatigueScore.value >= 50 && (
        <div className="mt-4 pt-4 border-t border-[#2B313A]">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#A4ACB8]">
              {indicators.recommendations[0]}
            </p>
          </div>
        </div>
      )}

      {/* Explanation Layer */}
      <InsightExplanation
        explanation={`Recovery status based on ${indicators.recentTrainingLoad.workoutsAnalyzed} recent workouts. Fatigue score (${indicators.fatigueScore.value}) reflects RPE patterns, session density, and training load trends.`}
        variant="bordered"
      />

      {/* Engine Branding */}
      <div className="mt-3 pt-3 border-t border-[#2B313A]/50">
        <AdaptiveEngineBadge variant="minimal" message={ENGINE_MESSAGES.trainingSignals} />
      </div>

      {/* Insight Upgrade Hint */}
      <InsightUpgradeHint className="mt-3" />
    </Card>
  )
}

// =============================================================================
// MINIMAL INDICATOR FOR INLINE USE
// =============================================================================

interface FatigueIndicatorProps {
  className?: string
}

export function FatigueIndicator({ className = '' }: FatigueIndicatorProps) {
  const [indicators, setIndicators] = useState<FatigueIndicators | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const data = analyzeFatigue()
    setIndicators(data)
  }, [])

  if (!mounted || !indicators) {
    return null
  }

  const statusConfig = getStatusConfig(indicators.recoveryStatus, indicators.fatigueScore.value)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: statusConfig.color }}
      />
      <span className="text-sm" style={{ color: statusConfig.color }}>
        {statusConfig.label}
      </span>
    </div>
  )
}

// =============================================================================
// WORKOUT GUIDANCE MESSAGE HELPER
// =============================================================================

export function getFatigueGuidanceMessage(): string | null {
  if (typeof window === 'undefined') return null
  
  const indicators = analyzeFatigue()
  const score = indicators.fatigueScore.value

  if (score >= 80) {
    return 'Recovery signals suggest preserving intensity. Focus on quality over volume.'
  }
  if (score >= 60) {
    return 'Fatigue building faster than expected. Preserve strength quality in upcoming sets.'
  }
  if (score >= 40 && indicators.fatigueTrend.trend === 'rising') {
    return 'Fatigue trending upward. Monitor effort and maintain planned rest periods.'
  }
  if (score < 30) {
    return 'Recovery signals remain strong. Maintain planned training intensity.'
  }
  return null
}
