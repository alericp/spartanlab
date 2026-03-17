'use client'

import { useState } from 'react'
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

// =============================================================================
// WHY THIS WORKOUT COMPONENT
// =============================================================================

interface WhyThisWorkoutProps {
  /** The reasoning summary from workout generation */
  reasoning: WorkoutReasoningSummary
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
  
  // Compact inline variant - single line
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-start gap-2 text-xs text-[#A4ACB8]',
        className
      )}>
        <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#C1121F]" />
        <p className="leading-relaxed line-clamp-2">{reasoning.whyThisWorkout}</p>
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
              {reasoning.whyThisWorkout}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Focus: {reasoning.workoutFocus}
              </span>
              {reasoning.reasoningConfidence !== 'low' && (
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {reasoning.reasoningConfidence === 'high' ? 'Personalized' : 'Adaptive'}
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
            {reasoning.workoutFocus}
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
            {reasoning.whyThisWorkout}
          </p>
          
          {/* Primary limiter insight */}
          <div className="flex items-start gap-2 pl-6">
            <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4F6D8A]" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6B7280]">
                <span className="text-[#A4ACB8]">Current limiter:</span>{' '}
                {reasoning.primaryLimiter.label}
              </p>
            </div>
          </div>
          
          {/* Secondary limiter if present */}
          {reasoning.secondaryLimiter && (
            <div className="flex items-start gap-2 pl-6">
              <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4F6D8A]/60" />
              <p className="text-xs text-[#6B7280]">
                <span className="text-[#A4ACB8]/80">Secondary focus:</span>{' '}
                {reasoning.secondaryLimiter.label}
              </p>
            </div>
          )}
          
          {/* Framework influence */}
          {reasoning.frameworkInfluence && (
            <div className="flex items-start gap-2 pl-6">
              <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4F6D8A]/60" />
              <p className="text-xs text-[#6B7280]">
                {reasoning.frameworkInfluence.influence}
              </p>
            </div>
          )}
          
          {/* Envelope adaptations */}
          {reasoning.envelopeInfluence && reasoning.envelopeInfluence.adaptations.length > 0 && (
            <div className="pl-6">
              <p className="text-xs text-[#6B7280] mb-1">Personalized adaptations:</p>
              <ul className="space-y-1">
                {reasoning.envelopeInfluence.adaptations.slice(0, 3).map((adaptation, i) => (
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
            <DataQualityIndicator quality={reasoning.dataQuality} />
            <span className="text-xs text-[#6B7280]">
              {reasoning.dataQuality === 'solid' 
                ? 'Based on your training history'
                : reasoning.dataQuality === 'developing'
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
  /** Session type */
  sessionType?: WorkoutReasoningSummary['sessionType']
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
  quality: WorkoutReasoningSummary['dataQuality']
  className?: string
}

function DataQualityIndicator({ quality, className }: DataQualityIndicatorProps) {
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
