'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  type SessionPerformanceResult,
  type PerformanceTier,
  type AdjustmentSignal,
  getPerformanceTierLabel,
  getAdjustmentSignalLabel,
  getPerformanceTierColor,
  getPerformanceTierBgColor,
  getAdjustmentSignalColor,
} from '@/lib/session-performance'
import { ChevronDown, ChevronUp, TrendingUp, Minus, TrendingDown } from 'lucide-react'

interface SessionPerformanceCardProps {
  result: SessionPerformanceResult
  compact?: boolean
  className?: string
}

/**
 * Compact session performance display for workout summary
 */
export function SessionPerformanceCard({
  result,
  compact = false,
  className,
}: SessionPerformanceCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const tierLabel = getPerformanceTierLabel(result.performanceTier)
  const tierColor = getPerformanceTierColor(result.performanceTier)
  const tierBgColor = getPerformanceTierBgColor(result.performanceTier)
  const signalLabel = getAdjustmentSignalLabel(result.adjustmentSignal)
  const signalColor = getAdjustmentSignalColor(result.adjustmentSignal)

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <PerformanceScoreBadge score={result.performanceScore} tier={result.performanceTier} size="sm" />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', tierColor)}>{tierLabel}</p>
          <p className="text-xs text-[#6B7280] truncate">{result.summary}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-[#0F1115] rounded-lg border border-[#2B313A]', className)}>
      {/* Header */}
      <div className="p-4 flex items-start gap-4">
        <PerformanceScoreBadge score={result.performanceScore} tier={result.performanceTier} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn('text-lg font-semibold', tierColor)}>{tierLabel}</h3>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', signalColor)}>
              {signalLabel}
            </span>
          </div>
          <p className="text-sm text-[#A4ACB8]">{result.summary}</p>
        </div>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-4 py-2 flex items-center justify-between text-xs text-[#6B7280] hover:text-[#A4ACB8] border-t border-[#2B313A] transition-colors"
      >
        <span>Session Breakdown</span>
        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showDetails && (
        <div className="px-4 pb-4 space-y-3">
          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-2">
            <BreakdownItem label="Completion" score={result.breakdown.completionScore} />
            <BreakdownItem label="Quality" score={result.breakdown.qualityScore} />
            <BreakdownItem label="Context" score={result.breakdown.contextScore} />
            <BreakdownItem label="Effort" score={result.breakdown.effortScore} />
          </div>

          {/* Contributing Signals */}
          {result.contributingSignals.length > 0 && (
            <div className="pt-2 border-t border-[#2B313A]">
              <p className="text-xs text-[#6B7280] mb-1.5">Key Observations</p>
              <ul className="space-y-1">
                {result.contributingSignals.slice(0, 4).map((signal, idx) => (
                  <li key={idx} className="text-xs text-[#A4ACB8] flex items-start gap-1.5">
                    <span className="text-[#4F6D8A] mt-0.5">-</span>
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Confidence indicator */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#2B313A]">
            <span className="text-xs text-[#6B7280]">Data confidence:</span>
            <ConfidenceBadge confidence={result.confidence} />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Circular score badge
 */
interface PerformanceScoreBadgeProps {
  score: number
  tier: PerformanceTier
  size?: 'sm' | 'md' | 'lg'
}

export function PerformanceScoreBadge({ score, tier, size = 'md' }: PerformanceScoreBadgeProps) {
  const tierColor = getPerformanceTierColor(tier)
  const tierBgColor = getPerformanceTierBgColor(tier)

  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-xl',
    lg: 'w-20 h-20 text-3xl',
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold border',
        tierBgColor,
        tierColor,
        sizes[size]
      )}
    >
      {score}
    </div>
  )
}

/**
 * Breakdown item for detail view
 */
function BreakdownItem({ label, score }: { label: string; score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-400'
    if (s >= 60) return 'text-blue-400'
    if (s >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  const getBarColor = (s: number) => {
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-blue-500'
    if (s >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-[#1A1F26] rounded p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#6B7280]">{label}</span>
        <span className={cn('text-xs font-medium', getScoreColor(score))}>{score}</span>
      </div>
      <div className="h-1.5 bg-[#2B313A] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Confidence badge
 */
function ConfidenceBadge({ confidence }: { confidence: 'low' | 'medium' | 'high' }) {
  const configs = {
    low: { label: 'Low', color: 'text-amber-400 bg-amber-500/10' },
    medium: { label: 'Medium', color: 'text-blue-400 bg-blue-500/10' },
    high: { label: 'High', color: 'text-green-400 bg-green-500/10' },
  }

  const config = configs[confidence]

  return (
    <span className={cn('text-xs px-1.5 py-0.5 rounded', config.color)}>
      {config.label}
    </span>
  )
}

/**
 * Adjustment signal icon
 */
export function AdjustmentSignalIcon({ signal }: { signal: AdjustmentSignal }) {
  if (signal === 'progress') {
    return <TrendingUp className="w-4 h-4 text-green-400" />
  }
  if (signal === 'stay_conservative') {
    return <TrendingDown className="w-4 h-4 text-amber-400" />
  }
  return <Minus className="w-4 h-4 text-blue-400" />
}

/**
 * Inline performance display for history/lists
 */
interface InlinePerformanceProps {
  score: number
  tier: PerformanceTier
  className?: string
}

export function InlinePerformance({ score, tier, className }: InlinePerformanceProps) {
  const tierLabel = getPerformanceTierLabel(tier)
  const tierColor = getPerformanceTierColor(tier)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('text-sm font-semibold', tierColor)}>{score}</span>
      <span className="text-xs text-[#6B7280]">{tierLabel}</span>
    </div>
  )
}
