'use client'

import { useState, useMemo } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Lightbulb, 
  Zap, 
  Shield,
  TrendingUp,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkoutReasoningSummary } from '@/lib/readiness/canonical-readiness-engine'
import type { SessionLoadSummary, TrainingSessionStyle } from '@/lib/session-load-intelligence'
import type { WorkoutReasoningDisplayContract } from '@/lib/workout-reasoning-display-contract'

// =============================================================================
// WHY THIS WORKOUT COMPONENT
// =============================================================================

interface WhyThisWorkoutProps {
  /** The reasoning summary from workout generation (accepts both raw and safe contract) */
  reasoning: WorkoutReasoningSummary | WorkoutReasoningDisplayContract
  /** Whether to start collapsed */
  defaultCollapsed?: boolean
  /** Visual variant */
  variant?: 'card' | 'inline' | 'compact'
  /** Additional CSS classes */
  className?: string
}

/**
 * Displays the reasoning behind a workout's structure and exercise selection.
 * Helps athletes understand the coach-like logic driving their training.
 */
export function WhyThisWorkout({
  reasoning,
  defaultCollapsed = true,
  variant = 'card',
  className,
}: WhyThisWorkoutProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed)
  
  // ==========================================================================
  // [DISPLAY-CONTRACT] SAFE DERIVED VALUES - NEVER CRASH
  // All UI rendering uses these safe values, not raw reasoning fields
  // ==========================================================================
  const safeValues = useMemo(() => {
    // Safe string helper
    const safeStr = (val: unknown, fallback: string): string => 
      typeof val === 'string' && val.trim() ? val : fallback
    
    // Safe object helper
    // [REASONING-DISPLAY-SAFETY] Cast through `unknown` so this guard
    // accepts either a structural reasoning union or an arbitrary value
    // (such as the `reasoning || {}` fallback) without a TS2352 error.
    const safeObj = (val: unknown): Record<string, unknown> | null =>
      val && typeof val === 'object' && !Array.isArray(val) ? val as unknown as Record<string, unknown> : null
    
    // Safe array helper
    const safeArr = (val: unknown): string[] => {
      if (!Array.isArray(val)) return []
      return val.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
    
    // [REASONING-DISPLAY-SAFETY] Convert the reasoning prop to a plain
    // Record<string, unknown> ONCE via the safeObj guard. The reasoning
    // prop type is a structural union (WorkoutReasoningDisplayContract |
    // WorkoutReasoningSummary) — neither variant structurally satisfies
    // Record<string, unknown>, so direct `as Record<string, unknown>`
    // casts at every property read fail TS2352. Going through `safeObj`
    // funnels the union through `unknown` before narrowing to a record,
    // preserving runtime behavior with no `as any`.
    const r: Record<string, unknown> = safeObj(reasoning) ?? {}
    const primaryLimiter = safeObj(r.primaryLimiter)
    const secondaryLimiter = safeObj(r.secondaryLimiter)
    const frameworkInfluence = safeObj(r.frameworkInfluence)
    const envelopeInfluence = safeObj(r.envelopeInfluence)
    
    return {
      whyThisWorkout: safeStr(r.whyThisWorkout, 'This workout was loaded successfully.'),
      workoutFocus: safeStr(r.workoutFocus, 'Adaptive Session'),
      reasoningConfidence: safeStr(r.reasoningConfidence, 'low'),
      dataQuality: safeStr(r.dataQuality, 'sparse') as 'sparse' | 'developing' | 'solid',
      primaryLimiterLabel: primaryLimiter ? safeStr(primaryLimiter.label, 'Current training priority') : 'Current training priority',
      secondaryLimiterLabel: secondaryLimiter ? safeStr(secondaryLimiter.label, '') : null,
      frameworkInfluence: frameworkInfluence ? safeStr(frameworkInfluence.influence, '') : null,
      adaptations: envelopeInfluence ? safeArr(envelopeInfluence.adaptations) : [],
    }
  }, [reasoning])
  
  // Compact inline variant - single line
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-start gap-2 text-xs text-[#A4ACB8]',
        className
      )}>
        <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C1121F]" />
        <p className="leading-relaxed line-clamp-2">{safeValues.whyThisWorkout}</p>
      </div>
    )
  }
  
  // Inline variant - non-collapsible, slightly more detail
  if (variant === 'inline') {
    return (
      <div className={cn(
        'rounded-lg bg-[#1A1A1A] border border-[#2B313A] p-3',
        className
      )}>
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 shrink-0 mt-0.5 text-[#C1121F]" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#E5E7EB] leading-relaxed">
              {safeValues.whyThisWorkout}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Focus: {safeValues.workoutFocus}
              </span>
              {safeValues.reasoningConfidence !== 'low' && (
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {safeValues.reasoningConfidence === 'high' ? 'Personalized' : 'Adaptive'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Card variant - collapsible with full details
  return (
    <div className={cn(
      'rounded-lg bg-[#1A1A1A] border border-[#2B313A] overflow-hidden',
      className
    )}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#252525] transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#C1121F]" />
          <span className="text-sm font-medium text-[#E5E7EB]">Why This Workout</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B7280] px-2 py-0.5 rounded bg-[#252525]">
            {safeValues.workoutFocus}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          )}
        </div>
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Main explanation */}
          <p className="text-sm text-[#A4ACB8] leading-relaxed pl-6">
            {safeValues.whyThisWorkout}
          </p>
          
          {/* Primary limiter insight - always safe */}
          <div className="flex items-start gap-2 pl-6">
            <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4F6D8A]" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6B7280]">
                <span className="text-[#A4ACB8]">Current limiter:</span>{' '}
                {safeValues.primaryLimiterLabel}
              </p>
            </div>
          </div>
          
          {/* Secondary limiter if present */}
          {safeValues.secondaryLimiterLabel && (
            <div className="flex items-start gap-2 pl-6">
              <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4F6D8A]/60" />
              <p className="text-xs text-[#6B7280]">
                <span className="text-[#A4ACB8]/80">Secondary focus:</span>{' '}
                {safeValues.secondaryLimiterLabel}
              </p>
            </div>
          )}
          
          {/* Framework influence */}
          {safeValues.frameworkInfluence && (
            <div className="flex items-start gap-2 pl-6">
              <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4F6D8A]/60" />
              <p className="text-xs text-[#6B7280]">
                {safeValues.frameworkInfluence}
              </p>
            </div>
          )}
          
          {/* Envelope adaptations */}
          {safeValues.adaptations.length > 0 && (
            <div className="pl-6">
              <p className="text-xs text-[#6B7280] mb-1">Personalized adaptations:</p>
              <ul className="space-y-1">
                {safeValues.adaptations.slice(0, 3).map((adaptation, i) => (
                  <li key={i} className="text-xs text-[#A4ACB8]/80 pl-3 flex items-start gap-1.5">
                    <span className="text-[#4F6D8A] mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                    {adaptation}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Data quality indicator */}
          <div className="flex items-center gap-2 pt-2 pl-6 border-t border-[#2B313A]">
            <DataQualityIndicator quality={safeValues.dataQuality} />
            <span className="text-xs text-[#6B7280]">
              {safeValues.dataQuality === 'solid' 
                ? 'Based on your training history'
                : safeValues.dataQuality === 'developing'
                ? 'Building personalization from your logs'
                : 'Continue logging to improve recommendations'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// EXERCISE REASON BUBBLE
// =============================================================================

interface ExerciseReasonBubbleProps {
  /** Exercise name */
  exerciseName: string
  /** The reason this exercise is included */
  reason: string
  /** Optional skill connection */
  skillConnection?: string
  /** Visual variant */
  variant?: 'tooltip' | 'inline' | 'expanded'
  /** Additional CSS classes */
  className?: string
}

/**
 * Small knowledge bubble explaining why an exercise was selected.
 * Used in workout session exercise cards.
 */
export function ExerciseReasonBubble({
  exerciseName,
  reason,
  skillConnection,
  variant = 'inline',
  className,
}: ExerciseReasonBubbleProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  if (variant === 'tooltip') {
    return (
      <div className="relative">
        <button
          className={cn(
            'p-1 rounded-full hover:bg-[#252525] transition-colors',
            className
          )}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
          aria-label={`Why ${exerciseName}`}
        >
          <Info className="w-3.5 h-3.5 text-[#6B7280]" />
        </button>
        
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-lg bg-[#252525] border border-[#2B313A] shadow-lg z-50">
            <p className="text-xs text-[#A4ACB8] leading-relaxed">{reason}</p>
            {skillConnection && (
              <p className="text-xs text-[#4F6D8A] mt-1">{skillConnection}</p>
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="w-2 h-2 rotate-45 bg-[#252525] border-r border-b border-[#2B313A]" />
            </div>
          </div>
        )}
      </div>
    )
  }
  
  if (variant === 'expanded') {
    return (
      <div className={cn(
        'p-2 rounded bg-[#1F1F1F] border border-[#2B313A]/50',
        className
      )}>
        <p className="text-xs text-[#A4ACB8] leading-relaxed">{reason}</p>
        {skillConnection && (
          <p className="text-xs text-[#4F6D8A] mt-1 flex items-center gap-1">
            <Target className="w-3 h-3" />
            {skillConnection}
          </p>
        )}
      </div>
    )
  }
  
  // Inline variant
  return (
    <div className={cn(
      'flex items-start gap-1.5 text-xs text-[#6B7280]',
      className
    )}>
      <Info className="w-3 h-3 shrink-0 mt-0.5" />
      <span className="line-clamp-2">{reason}</span>
    </div>
  )
}

// =============================================================================
// WORKOUT FOCUS BADGE
// =============================================================================

interface WorkoutFocusBadgeProps {
  /** The focus area */
  focus: string
  /** Session type - tolerates any string, defaults to mixed */
  sessionType?: string
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional CSS classes */
  className?: string
}

/**
 * Compact badge showing the workout's primary focus area.
 */
export function WorkoutFocusBadge({
  focus,
  sessionType = 'mixed',
  size = 'sm',
  className,
}: WorkoutFocusBadgeProps) {
  const getSessionIcon = () => {
    switch (sessionType) {
      case 'skill':
        return <Zap className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      case 'strength':
        return <TrendingUp className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      case 'deload':
      case 'recovery':
        return <Shield className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      default:
        return <Target className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
    }
  }
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full bg-[#252525] border border-[#2B313A]',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      'text-[#A4ACB8]',
      className
    )}>
      {getSessionIcon()}
      <span>{focus}</span>
    </div>
  )
}

// =============================================================================
// DATA QUALITY INDICATOR
// =============================================================================

interface DataQualityIndicatorProps {
  /** Data quality string - tolerates unknown values, defaults to sparse/1 dot */
  quality: string
  className?: string
}

function DataQualityIndicator({ quality, className }: DataQualityIndicatorProps) {
  // [DISPLAY-CONTRACT] Safe dots calculation - any unexpected value defaults to 1
  const dots = quality === 'solid' ? 3 : quality === 'developing' ? 2 : 1
  
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            i <= dots ? 'bg-[#4F6D8A]' : 'bg-[#2B313A]'
          )}
        />
      ))}
    </div>
  )
}

// =============================================================================
// LIMITER INSIGHT CARD
// =============================================================================

interface LimiterInsightCardProps {
  /** The primary limiter data */
  limiter: WorkoutReasoningSummary['primaryLimiter']
  /** Optional secondary limiter */
  secondaryLimiter?: WorkoutReasoningSummary['secondaryLimiter']
  /** Whether this is for dashboard (more detail) or session (compact) */
  context?: 'dashboard' | 'session'
  /** Additional CSS classes */
  className?: string
}

/**
 * Card displaying the athlete's current limiting factor with explanation.
 * Used in dashboard readiness cards and session summaries.
 */
export function LimiterInsightCard({
  limiter,
  secondaryLimiter,
  context = 'session',
  className,
}: LimiterInsightCardProps) {
  return (
    <div className={cn(
      'rounded-lg bg-[#1A1A1A] border border-[#2B313A] p-3',
      className
    )}>
      <div className="flex items-start gap-2">
        <Target className="w-4 h-4 shrink-0 mt-0.5 text-[#C1121F]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#E5E7EB]">
            {limiter.label}
          </p>
          <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
            {limiter.explanation}
          </p>
          
          {secondaryLimiter && context === 'dashboard' && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#2B313A]">
              <Zap className="w-3 h-3 text-[#4F6D8A]" />
              <span className="text-xs text-[#6B7280]">
                Secondary: {secondaryLimiter.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SESSION LOAD INSIGHT
// =============================================================================

interface SessionLoadInsightProps {
  /** The session load summary from exercise selection */
  loadSummary: SessionLoadSummary
  /** The session style */
  sessionStyle: TrainingSessionStyle
  /** Optional rationale strings */
  rationale?: string[]
  /** Anti-bloat validation results */
  antiBloatValidation?: {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  }
  /** Visual variant */
  variant?: 'compact' | 'detailed'
  /** Additional CSS classes */
  className?: string
}

/**
 * Displays session load information and anti-bloat validation.
 * Helps athletes understand the structured exercise count philosophy.
 */
export function SessionLoadInsight({
  loadSummary,
  sessionStyle,
  rationale,
  antiBloatValidation,
  variant = 'compact',
  className,
}: SessionLoadInsightProps) {
  // Format session style for display
  const styleLabel = sessionStyle.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  // Determine load quality indicator
  const getLoadQuality = () => {
    if (!antiBloatValidation) return 'balanced'
    if (antiBloatValidation.isValid) return 'balanced'
    if (antiBloatValidation.issues.length <= 1) return 'moderate'
    return 'heavy'
  }
  
  const loadQuality = getLoadQuality()
  
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-2 text-xs text-[#6B7280]',
        className
      )}>
        <div className={cn(
          'w-2 h-2 rounded-full',
          loadQuality === 'balanced' ? 'bg-green-500' :
          loadQuality === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
        )} />
        <span>
          {loadSummary.weightedExerciseCount.toFixed(1)} effective load
          {loadSummary.totalExerciseCount !== Math.round(loadSummary.weightedExerciseCount) && (
            <span className="text-[#4F6D8A]"> ({loadSummary.totalExerciseCount} items)</span>
          )}
        </span>
      </div>
    )
  }
  
  // Detailed variant
  return (
    <div className={cn(
      'rounded-lg bg-[#1A1A1A] border border-[#2B313A] p-3 space-y-2',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full',
            loadQuality === 'balanced' ? 'bg-green-500' :
            loadQuality === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
          )} />
          <span className="text-sm font-medium text-[#E5E7EB]">Session Load</span>
        </div>
        <span className="text-xs text-[#6B7280] px-2 py-0.5 rounded bg-[#252525]">
          {styleLabel}
        </span>
      </div>
      
      {/* Load breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-[#6B7280]">Weighted load:</span>
          <span className="text-[#A4ACB8]">{loadSummary.weightedExerciseCount.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B7280]">Total items:</span>
          <span className="text-[#A4ACB8]">{loadSummary.totalExerciseCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B7280]">High-fatigue:</span>
          <span className="text-[#A4ACB8]">{loadSummary.highFatigueCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6B7280]">Primary moves:</span>
          <span className="text-[#A4ACB8]">{loadSummary.primaryCount}</span>
        </div>
      </div>
      
      {/* Rationale */}
      {rationale && rationale.length > 0 && (
        <div className="pt-2 border-t border-[#2B313A]">
          <p className="text-xs text-[#A4ACB8] leading-relaxed">
            {rationale[0]}
          </p>
        </div>
      )}
      
      {/* Anti-bloat warnings */}
      {antiBloatValidation && !antiBloatValidation.isValid && (
        <div className="pt-2 border-t border-[#2B313A] space-y-1">
          {antiBloatValidation.issues.slice(0, 2).map((issue, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <Shield className="w-3 h-3 shrink-0 mt-0.5 text-yellow-500" />
              <span className="text-yellow-400/80">{issue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
