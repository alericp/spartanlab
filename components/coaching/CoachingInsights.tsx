'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  Zap,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// WARM-UP INSIGHT
// =============================================================================

interface WarmUpInsightProps {
  /** The reason for this warm-up element */
  reason: string
  /** Joint or movement being prepared */
  target: string
  /** Skill being trained this session */
  skillFocus?: string
  /** Compact display variant */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Minimal insight explaining why a specific warm-up element was included.
 * Example: "Wrist preparation added to support planche training."
 */
export function WarmUpInsight({
  reason,
  target,
  skillFocus,
  compact = false,
  className,
}: WarmUpInsightProps) {
  if (compact) {
    return (
      <div className={cn('flex items-start gap-1.5 text-xs text-[#6B7280]', className)}>
        <Shield className="w-3 h-3 shrink-0 mt-0.5" />
        <span className="line-clamp-1">{reason}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-[#1A1A1A] border border-[#2B313A]/50 p-2.5 text-sm',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#4F6D8A]" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#A4ACB8] leading-relaxed">{reason}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#6B7280]">
            <span>→ {target}</span>
            {skillFocus && <span className="text-[#4F6D8A]">for {skillFocus}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// PROGRESSION REASONING CARD
// =============================================================================

interface ProgressionReasoningProps {
  /** Current progression stage */
  currentStage: string
  /** Next progression stage or reason to stay */
  nextStage?: string
  /** Why this progression was chosen */
  reason: string
  /** Any limiting factors */
  limitingFactor?: string
  /** Whether to show as expandable */
  expandable?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Explains why a specific progression level was chosen.
 * Example: "Advanced tuck planche selected based on your readiness score."
 */
export function ProgressionReasoning({
  currentStage,
  nextStage,
  reason,
  limitingFactor,
  expandable = false,
  className,
}: ProgressionReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(!expandable)

  const content = (
    <div className="space-y-2">
      <div>
        <p className="text-xs text-[#6B7280]">Current Level:</p>
        <p className="text-sm font-medium text-[#E5E7EB]">{currentStage}</p>
      </div>
      {nextStage && (
        <div>
          <p className="text-xs text-[#6B7280]">Working Toward:</p>
          <p className="text-sm text-[#A4ACB8]">{nextStage}</p>
        </div>
      )}
      <p className="text-xs text-[#A4ACB8] leading-relaxed">{reason}</p>
      {limitingFactor && (
        <div className="flex items-start gap-2 pt-1 border-t border-[#2B313A]/50">
          <TrendingUp className="w-3 h-3 shrink-0 mt-0.5 text-[#4F6D8A]" />
          <span className="text-xs text-[#6B7280]">{limitingFactor}</span>
        </div>
      )}
    </div>
  )

  if (!expandable) {
    return (
      <div
        className={cn(
          'rounded-lg bg-[#1A1A1A] border border-[#2B313A]/50 p-3',
          className
        )}
      >
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-[#C1121F]" />
          <div className="flex-1 min-w-0">{content}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-[#1A1A1A] border border-[#2B313A]/50 overflow-hidden',
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#252525] transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#C1121F]" />
          <span className="text-sm font-medium text-[#E5E7EB]">{currentStage}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#6B7280]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B7280]" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-[#2B313A]/50">
          <div className="flex gap-3 pt-3">
            <div className="shrink-0" />
            <div className="flex-1">{content}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MOVEMENT BIAS INSIGHT
// =============================================================================

interface MovementBiasInsightProps {
  /** The detected bias type */
  biasType: 'pull_dominant' | 'push_dominant' | 'compression_dominant' | 'balanced'
  /** What we're increasing to balance it */
  adjustment: string
  /** Optional readiness context */
  readinessContext?: string
  /** Compact display */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Shows how the program adapts for movement bias.
 * Example: "Increased pushing volume to balance pulling dominance."
 */
export function MovementBiasInsight({
  biasType,
  adjustment,
  readinessContext,
  compact = false,
  className,
}: MovementBiasInsightProps) {
  const biasLabel = {
    pull_dominant: 'Pull Dominant',
    push_dominant: 'Push Dominant',
    compression_dominant: 'Compression Focused',
    balanced: 'Balanced',
  }[biasType]

  if (compact) {
    return (
      <div className={cn('flex items-start gap-1.5 text-xs text-[#6B7280]', className)}>
        <Zap className="w-3 h-3 shrink-0 mt-0.5" />
        <span className="line-clamp-1">{adjustment}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-[#1A1A1A] border border-[#2B313A]/50 p-3',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Zap className="w-4 h-4 shrink-0 mt-0.5 text-[#4F6D8A]" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#6B7280]">
            <span className="text-[#A4ACB8]">Pattern detected:</span> {biasLabel}
          </p>
          <p className="text-sm text-[#A4ACB8] mt-1 leading-relaxed">{adjustment}</p>
          {readinessContext && (
            <p className="text-xs text-[#6B7280] mt-1">{readinessContext}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// OVERRIDE PROTECTION INSIGHT
// =============================================================================

interface OverrideProtectionInsightProps {
  /** Original exercise name */
  originalExerciseName: string
  /** Why it was selected */
  selectionReason: string
  /** Skill carryover it provides */
  skillCarryover?: string[]
  /** Whether to show confirmation state */
  confirming?: boolean
  /** Callback when user proceeds with replacement */
  onConfirm?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Subtle warning when user replaces an exercise, explaining what they're losing.
 * User can still proceed.
 */
export function OverrideProtectionInsight({
  originalExerciseName,
  selectionReason,
  skillCarryover,
  confirming = false,
  onConfirm,
  className,
}: OverrideProtectionInsightProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-[#1F2937]/50 border border-[#EF4444]/20 p-3',
        confirming && 'border-[#FCA5A5] bg-[#7F1D1D]/20',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          className={cn(
            'w-4 h-4 shrink-0 mt-0.5 text-[#6B7280]',
            confirming && 'text-[#EF4444]'
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            <span className="text-[#E5E7EB]">{originalExerciseName}</span> was selected for specific skill carryover.
            Replacing it may reduce effectiveness.
          </p>
          <p className="text-xs text-[#6B7280] mt-1">{selectionReason}</p>
          {skillCarryover && skillCarryover.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-[#374151]">
              <Lightbulb className="w-3 h-3 text-[#4F6D8A]" />
              <span className="text-xs text-[#6B7280]">
                Supports: {skillCarryover.join(', ')}
              </span>
            </div>
          )}
          {onConfirm && (
            <button
              onClick={onConfirm}
              className="text-xs text-[#C1121F] hover:text-[#EF4444] mt-2 transition-colors"
            >
              Proceed with replacement →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// EXERCISE SWAP SUGGESTION
// =============================================================================

interface ExerciseSwapSuggestionProps {
  /** The current exercise */
  currentExercise: string
  /** Suggested alternative */
  suggestedExercise: string
  /** Why this alternative is suggested */
  reason: string
  /** Compact variant */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Lightweight suggestion when a better exercise choice might exist.
 */
export function ExerciseSwapSuggestion({
  currentExercise,
  suggestedExercise,
  reason,
  compact = false,
  className,
}: ExerciseSwapSuggestionProps) {
  if (compact) {
    return (
      <div className={cn('flex items-start gap-1.5 text-xs text-[#4F6D8A]', className)}>
        <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
        <span className="line-clamp-1">Consider {suggestedExercise}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-[#1A1A1A] border border-[#2B313A]/50 p-3',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-[#4F6D8A]" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#6B7280]">
            Consider <span className="text-[#A4ACB8] font-medium">{suggestedExercise}</span> instead of {currentExercise}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">{reason}</p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// DELOAD / RECOVERY INSIGHT
// =============================================================================

interface RecoveryInsightProps {
  /** The recovery phase */
  phase: 'deload' | 'recovery' | 'maintenance' | 'aggressive'
  /** Explanation of why this phase */
  reason: string
  /** What to expect */
  guidance?: string
  /** Compact display */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Explains why the current session is in a different training phase.
 */
export function RecoveryInsight({
  phase,
  reason,
  guidance,
  compact = false,
  className,
}: RecoveryInsightProps) {
  const phaseLabel = {
    deload: 'Deload Week',
    recovery: 'Recovery Focus',
    maintenance: 'Maintenance Phase',
    aggressive: 'Progression Push',
  }[phase]

  if (compact) {
    return (
      <div className={cn('flex items-start gap-1.5 text-xs text-[#6B7280]', className)}>
        <Shield className="w-3 h-3 shrink-0 mt-0.5" />
        <span className="line-clamp-1">{phaseLabel}: {reason}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-[#1A1A1A] border border-[#2B313A]/50 p-3',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-[#4F6D8A]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#E5E7EB]">{phaseLabel}</p>
          <p className="text-xs text-[#A4ACB8] mt-1 leading-relaxed">{reason}</p>
          {guidance && (
            <p className="text-xs text-[#6B7280] mt-2 pt-2 border-t border-[#2B313A]/50">
              {guidance}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
