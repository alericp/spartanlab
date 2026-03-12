'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InsightExplanationProps {
  /** The explanation text - 1-2 sentences describing why this insight was generated */
  explanation: string
  /** Optional title, defaults to "Why this insight" */
  title?: string
  /** Whether to start collapsed (default: true for space efficiency) */
  defaultCollapsed?: boolean
  /** Visual variant */
  variant?: 'subtle' | 'bordered' | 'inline'
  /** Additional CSS classes */
  className?: string
}

/**
 * A collapsible explanation section for intelligence cards.
 * Helps users understand why SpartanLab generated a specific recommendation.
 */
export function InsightExplanation({
  explanation,
  title = 'Why this insight',
  defaultCollapsed = true,
  variant = 'subtle',
  className,
}: InsightExplanationProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  if (variant === 'inline') {
    // Non-collapsible inline variant for cards with space
    return (
      <div className={cn('flex items-start gap-2 text-xs text-[#6B7280]', className)}>
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{explanation}</p>
      </div>
    )
  }

  return (
    <div className={cn(
      variant === 'bordered' 
        ? 'border-t border-[#2B313A] pt-3 mt-3' 
        : 'mt-3',
      className
    )}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors w-full group"
        aria-expanded={!isCollapsed}
      >
        <Lightbulb className="w-3.5 h-3.5 text-[#C1121F]/60 group-hover:text-[#C1121F] transition-colors" />
        <span className="font-medium">{title}</span>
        {isCollapsed ? (
          <ChevronDown className="w-3.5 h-3.5 ml-auto" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 ml-auto" />
        )}
      </button>
      
      {!isCollapsed && (
        <div className="mt-2 pl-5">
          <p className="text-xs text-[#A4ACB8] leading-relaxed">
            {explanation}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Generate context-aware explanations for different insight types
 */
export function generateRecoveryExplanation(
  recoveryLevel: 'HIGH' | 'MODERATE' | 'LOW',
  volumeLoad: string,
  workoutsThisWeek: number
): string {
  if (recoveryLevel === 'HIGH') {
    return `Your training volume (${volumeLoad}) and ${workoutsThisWeek} workout${workoutsThisWeek !== 1 ? 's' : ''} this week suggest you're well-recovered. This is a good time for challenging sessions.`
  } else if (recoveryLevel === 'MODERATE') {
    return `Based on your recent volume (${volumeLoad}) and ${workoutsThisWeek} session${workoutsThisWeek !== 1 ? 's' : ''} this week, your recovery is moderate. Train smart but don't overreach.`
  } else {
    return `Your training load (${volumeLoad}) indicates accumulated fatigue. Consider lighter sessions or rest to optimize recovery and prevent overtraining.`
  }
}

export function generateMomentumExplanation(
  workoutsLast7Days: number,
  trend: 'increasing' | 'decreasing' | 'stable',
  daysSinceLastWorkout: number | null
): string {
  const trendText = trend === 'increasing' 
    ? 'Your consistency is improving' 
    : trend === 'decreasing' 
      ? 'Your training frequency has dropped recently' 
      : 'You\'re maintaining steady consistency'

  const recencyText = daysSinceLastWorkout === null 
    ? '' 
    : daysSinceLastWorkout === 0 
      ? ' You trained today, keeping the momentum going.'
      : daysSinceLastWorkout <= 2
        ? ` Training ${daysSinceLastWorkout} day${daysSinceLastWorkout > 1 ? 's' : ''} ago keeps you on track.`
        : ` ${daysSinceLastWorkout} days since your last workout may slow progress.`

  return `${trendText}. ${workoutsLast7Days} workout${workoutsLast7Days !== 1 ? 's' : ''} in the past week.${recencyText}`
}

export function generateAdjustmentExplanation(
  wellnessState: 'fresh' | 'normal' | 'fatigued',
  wasAdjusted: boolean,
  adjustmentPercent?: number
): string {
  if (!wasAdjusted) {
    return 'Your recovery signals look good. No adjustments needed for today\'s session - train as programmed.'
  }
  
  if (wellnessState === 'fatigued') {
    return `Fatigue signals detected from recent training. ${adjustmentPercent ? `Volume reduced by ${adjustmentPercent}%` : 'Session adjusted'} to support recovery.`
  }
  
  return `Based on your current recovery state (${wellnessState}), minor adjustments applied to optimize today's training.`
}

export function generateProjectionExplanation(
  confidence: number,
  mainLimiter: string | null,
  currentLevel: string,
  nextLevel: string
): string {
  const confidenceText = confidence >= 0.7 
    ? 'High confidence' 
    : confidence >= 0.4 
      ? 'Moderate confidence' 
      : 'Low confidence'
  
  const limiterText = mainLimiter && mainLimiter !== 'None - On Track'
    ? ` Your main bottleneck is ${mainLimiter.toLowerCase()}.`
    : ' You\'re progressing well on all fronts.'
  
  return `${confidenceText} projection from ${currentLevel} to ${nextLevel}.${limiterText}`
}

export function generateLimiterExplanation(
  category: string,
  confidence: string,
  focusAreas: string[]
): string {
  const confidenceText = confidence === 'high' 
    ? 'Strong evidence' 
    : confidence === 'medium' 
      ? 'Moderate evidence' 
      : 'Early indication'
  
  const categoryExplanations: Record<string, string> = {
    'skill': 'Skill technique or hold times are limiting your progression',
    'strength': 'Weighted strength relative to bodyweight is holding you back',
    'volume': 'Training volume may be too high or too low for optimal progress',
    'recovery': 'Recovery patterns suggest fatigue accumulation',
    'balanced': 'No single factor is significantly limiting your progress',
  }
  
  const categoryText = categoryExplanations[category.toLowerCase()] || 'Multiple factors may be contributing'
  
  return `${confidenceText} suggests: ${categoryText}. ${focusAreas.length > 0 ? `Focus on: ${focusAreas.slice(0, 2).join(', ')}.` : ''}`
}
