'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  type ResistanceBandColor,
  type ProgressionStatus,
  type ProgressionAnalysis,
  BAND_COLORS,
  BAND_SHORT_LABELS,
  ALL_BAND_COLORS,
  getProgressionSummaryText,
} from '@/lib/band-progression-engine'

interface BandSelectorProps {
  selectedBand: ResistanceBandColor | null
  onBandChange: (band: ResistanceBandColor | null) => void
  recommendedBand?: ResistanceBandColor | null
  compact?: boolean
  disabled?: boolean
  className?: string
}

export function BandSelector({
  selectedBand,
  onBandChange,
  recommendedBand,
  compact = false,
  disabled = false,
  className,
}: BandSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (compact && !isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors',
          'border border-[#333333] hover:border-[#4F6D8A]/50',
          selectedBand 
            ? `${BAND_COLORS[selectedBand].bg} ${BAND_COLORS[selectedBand].text} ${BAND_COLORS[selectedBand].border}`
            : 'bg-[#1A1A1A] text-[#A5A5A5]',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <BandIcon color={selectedBand} size={12} />
        <span>{selectedBand ? BAND_SHORT_LABELS[selectedBand] : 'No Band'}</span>
      </button>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Band Selection Grid */}
      <div className="flex flex-wrap gap-1.5">
        {/* No Band Option */}
        <button
          type="button"
          onClick={() => {
            onBandChange(null)
            if (compact) setIsExpanded(false)
          }}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
            'border',
            selectedBand === null
              ? 'bg-[#2A2A2A] border-[#4F6D8A] text-white'
              : 'bg-[#1A1A1A] border-[#333333] text-[#A5A5A5] hover:border-[#4F6D8A]/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="w-3 h-3 rounded-full border border-[#4A4A4A] bg-[#2A2A2A]" />
          No Band
        </button>

        {/* Band Options */}
        {ALL_BAND_COLORS.map((color) => {
          const isSelected = selectedBand === color
          const isRecommended = recommendedBand === color && !isSelected
          const colors = BAND_COLORS[color]

          return (
            <button
              key={color}
              type="button"
              onClick={() => {
                onBandChange(color)
                if (compact) setIsExpanded(false)
              }}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                'border',
                isSelected
                  ? `${colors.bg} ${colors.border} ${colors.text}`
                  : isRecommended
                    ? `bg-[#1A1A1A] border-dashed ${colors.border} ${colors.text}`
                    : 'bg-[#1A1A1A] border-[#333333] text-[#A5A5A5] hover:border-[#4F6D8A]/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <BandIcon color={color} size={12} />
              {BAND_SHORT_LABELS[color]}
              {isRecommended && (
                <span className="text-[10px] opacity-70">(rec)</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Collapse button for compact mode */}
      {compact && isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-xs text-[#6A6A6A] hover:text-[#A5A5A5]"
        >
          Collapse
        </button>
      )}
    </div>
  )
}

// Band Icon Component
function BandIcon({ color, size = 16 }: { color: ResistanceBandColor | null; size?: number }) {
  if (!color) {
    return (
      <span
        className="rounded-full border border-[#4A4A4A] bg-[#2A2A2A]"
        style={{ width: size, height: size }}
      />
    )
  }

  const colorMap: Record<ResistanceBandColor, string> = {
    yellow: '#EAB308',
    red: '#EF4444',
    black: '#6B7280',
    purple: '#A855F7',
    green: '#22C55E',
    blue: '#3B82F6',
  }

  return (
    <span
      className="rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: colorMap[color],
      }}
    />
  )
}

// Band Display Badge (for showing current band in UI)
interface BandBadgeProps {
  bandColor: ResistanceBandColor | null
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function BandBadge({ 
  bandColor, 
  size = 'sm', 
  showLabel = true,
  className 
}: BandBadgeProps) {
  if (!bandColor) return null

  const colors = BAND_COLORS[bandColor]
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium',
        colors.bg,
        colors.text,
        colors.border,
        'border',
        sizeClasses,
        className
      )}
    >
      <BandIcon color={bandColor} size={size === 'sm' ? 8 : 10} />
      {showLabel && BAND_SHORT_LABELS[bandColor]}
    </span>
  )
}

// Band Recommendation Display
interface BandRecommendationProps {
  recommendedBand: ResistanceBandColor | null
  currentBand?: ResistanceBandColor | null
  reason?: string
  className?: string
}

export function BandRecommendation({
  recommendedBand,
  currentBand,
  reason,
  className,
}: BandRecommendationProps) {
  if (!recommendedBand) return null

  const isProgression = currentBand && 
    recommendedBand !== currentBand

  return (
    <div className={cn('text-xs space-y-1', className)}>
      <div className="flex items-center gap-2">
        <span className="text-[#6A6A6A]">Recommended:</span>
        <BandBadge bandColor={recommendedBand} />
        {isProgression && currentBand && (
          <>
            <span className="text-[#6A6A6A]">from</span>
            <BandBadge bandColor={currentBand} />
          </>
        )}
      </div>
      {reason && (
        <p className="text-[#6A6A6A] italic">{reason}</p>
      )}
    </div>
  )
}

// Progression Status Display Component
interface ProgressionStatusDisplayProps {
  analysis: ProgressionAnalysis
  showDetails?: boolean
  className?: string
}

const STATUS_COLORS: Record<ProgressionStatus, { bg: string; text: string; border: string }> = {
  ready_to_reduce: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  progressing: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  maintaining: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  stagnating: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  regressing: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  new: { bg: 'bg-[#2A2A2A]', text: 'text-[#A5A5A5]', border: 'border-[#333333]' },
}

const STATUS_LABELS: Record<ProgressionStatus, string> = {
  ready_to_reduce: 'Ready to Progress',
  progressing: 'Progressing',
  maintaining: 'Maintaining',
  stagnating: 'Stagnating',
  regressing: 'Needs Recovery',
  new: 'New',
}

export function ProgressionStatusDisplay({
  analysis,
  showDetails = false,
  className,
}: ProgressionStatusDisplayProps) {
  const colors = STATUS_COLORS[analysis.status]
  const label = STATUS_LABELS[analysis.status]
  const summaryText = getProgressionSummaryText(analysis)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border',
            colors.bg,
            colors.text,
            colors.border
          )}
        >
          <StatusIcon status={analysis.status} />
          {label}
        </span>
        {analysis.currentBand && (
          <BandBadge bandColor={analysis.currentBand} size="sm" />
        )}
      </div>

      {/* Summary */}
      <p className="text-xs text-[#A5A5A5]">{summaryText}</p>

      {/* Detailed Info */}
      {showDetails && (
        <div className="text-xs space-y-1.5 text-[#6A6A6A]">
          {/* Signals */}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {analysis.signals.recentRPE !== null && (
              <span>RPE: {analysis.signals.recentRPE.toFixed(1)}</span>
            )}
            {analysis.signals.averageHoldTime !== null && (
              <span>Avg Hold: {Math.round(analysis.signals.averageHoldTime)}s</span>
            )}
            {analysis.signals.averageReps !== null && (
              <span>Avg Reps: {Math.round(analysis.signals.averageReps)}</span>
            )}
            <span>Sessions: {analysis.signals.sessionsAtCurrentBand}</span>
          </div>

          {/* Recommendation */}
          {analysis.recommendation && (
            <p className="italic pt-1 border-t border-[#333333]">
              {analysis.recommendation}
            </p>
          )}

          {/* Fatigue Warning */}
          {analysis.fatigueWarning && analysis.fatigueReason && (
            <div className="flex items-start gap-1.5 text-yellow-400 pt-1">
              <span className="text-base">!</span>
              <span>{analysis.fatigueReason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Status Icon
function StatusIcon({ status }: { status: ProgressionStatus }) {
  switch (status) {
    case 'ready_to_reduce':
      return <span>↑</span>
    case 'progressing':
      return <span>↗</span>
    case 'maintaining':
      return <span>→</span>
    case 'stagnating':
      return <span>⇆</span>
    case 'regressing':
      return <span>↓</span>
    case 'new':
      return <span>•</span>
    default:
      return null
  }
}
