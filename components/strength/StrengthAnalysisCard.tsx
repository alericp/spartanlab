'use client'

import { Card } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle,
  Scale,
  Target,
  Info,
} from 'lucide-react'
import type { ExerciseAnalysis } from '@/lib/strength-guidance-engine'
import { getTierColor, getTrendStatusColor } from '@/lib/strength-guidance-engine'

interface StrengthAnalysisCardProps {
  analysis: ExerciseAnalysis
  hasBodyweight: boolean
}

export function StrengthAnalysisCard({ analysis, hasBodyweight }: StrengthAnalysisCardProps) {
  const { 
    exerciseName, 
    recentPerformance, 
    relativeMetrics, 
    trend, 
    supportedSkills,
    primaryInsight,
    explanation,
    nextTierInfo,
  } = analysis

  const TrendIcon = {
    improving: TrendingUp,
    stable: Minus,
    regressing: TrendingDown,
    insufficient_data: AlertCircle,
  }[trend.direction]

  const bestRecord = recentPerformance.bestRecent || recentPerformance.bestAllTime

  // [PATTERN-BANK / NULLABLE-OBJECT-JSX-CONTROL-FLOW]
  // Both `relativeMetrics` and `nextTierInfo` are doubly nullable:
  //   relativeMetrics: RelativeStrengthMetrics | null
  //     -> oneRMRatio: number | null
  //   nextTierInfo: { nextTier: string | null; gapWeight: number | null } | null
  // The previous JSX used `obj?.field !== null` and then read `obj.field`
  // directly. That predicate does NOT narrow the outer object: it is true
  // when the outer is undefined too, so direct member access remained unsafe.
  // We derive typed `number | null` locals up-front via `typeof === 'number'`
  // (Phase 7 Pattern 1). No `!`, no casts, no fake values — when data is
  // missing we render the existing honest '—' fallback.
  const oneRMRatio: number | null =
    typeof relativeMetrics?.oneRMRatio === 'number' ? relativeMetrics.oneRMRatio : null
  const gapWeight: number | null =
    typeof nextTierInfo?.gapWeight === 'number' ? nextTierInfo.gapWeight : null

  return (
    <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{exerciseName}</h3>
          <p className="text-xs text-[#6A6A6A] mt-0.5">
            Supports {supportedSkills.join(', ')}
          </p>
        </div>
        {relativeMetrics?.tier && (
          <span className={`text-sm font-medium ${getTierColor(relativeMetrics.tier)}`}>
            {relativeMetrics.tierLabel}
          </span>
        )}
      </div>

      {/* Core Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Best Set */}
        <div className="bg-[#1A1A1A] rounded-lg p-3">
          <p className="text-xs text-[#6A6A6A] mb-1">Best Recent</p>
          <p className="text-lg font-bold text-[#E63946]">
            {bestRecord 
              ? `+${bestRecord.weightAdded}×${bestRecord.reps}` 
              : '—'}
          </p>
        </div>

        {/* Est 1RM */}
        <div className="bg-[#1A1A1A] rounded-lg p-3">
          <p className="text-xs text-[#6A6A6A] mb-1">Est. 1RM</p>
          <p className="text-lg font-bold">
            {relativeMetrics 
              ? `+${relativeMetrics.estimatedOneRM}` 
              : bestRecord 
                ? `+${bestRecord.estimatedOneRM}` 
                : '—'}
          </p>
        </div>

        {/* Relative Strength */}
        <div className="bg-[#1A1A1A] rounded-lg p-3">
          <p className="text-xs text-[#6A6A6A] mb-1">Relative</p>
          <p className="text-lg font-bold">
            {oneRMRatio !== null
              ? `${(oneRMRatio * 100).toFixed(0)}%`
              : '—'}
          </p>
          {!hasBodyweight && (
            <p className="text-[10px] text-[#6A6A6A]">Add BW</p>
          )}
        </div>
      </div>

      {/* Trend Row */}
      <div className="flex items-center justify-between bg-[#1A1A1A] rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <TrendIcon className={`w-4 h-4 ${getTrendStatusColor(trend.direction)}`} />
          <span className={`text-sm font-medium ${getTrendStatusColor(trend.direction)}`}>
            {trend.label}
          </span>
          {trend.percentChange !== null && trend.direction !== 'insufficient_data' && (
            <span className="text-xs text-[#6A6A6A]">
              ({trend.percentChange > 0 ? '+' : ''}{(trend.percentChange * 100).toFixed(1)}%)
            </span>
          )}
        </div>
        {trend.recordCount > 0 && (
          <span className="text-xs text-[#6A6A6A]">
            {trend.recordCount} logs
          </span>
        )}
      </div>

      {/* Next Tier Progress (if close) */}
      {gapWeight !== null && gapWeight <= 25 && (
        <div className="flex items-center gap-2 text-xs text-[#A5A5A5]">
          <Target className="w-3 h-3" />
          <span>
            +{gapWeight}lbs to reach{' '}
            <span className="text-[#F5F5F5]">{nextTierInfo?.nextTier ?? '—'}</span> tier
          </span>
        </div>
      )}

      {/* Primary Insight */}
      <div className="border-t border-[#3A3A3A] pt-3">
        <p className="text-sm text-[#A5A5A5] leading-relaxed">
          {primaryInsight}
        </p>
      </div>

      {/* Explanation */}
      <div className="flex gap-2 text-xs text-[#6A6A6A]">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <p className="leading-relaxed">{explanation}</p>
      </div>
    </Card>
  )
}
