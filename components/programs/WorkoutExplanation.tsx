'use client'

/**
 * WorkoutExplanation Component
 * 
 * Displays a compact, truthful "Why This Workout" explanation
 * based on actual engine data and reason codes.
 * 
 * CRITICAL: Only shows explanations that are grounded in real metadata.
 * Never shows fabricated or generic explanations.
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Info, ChevronDown, ChevronUp, Sparkles, TrendingUp, Calendar } from 'lucide-react'
import type { ProgramExplanationMetadata } from '@/lib/explanation-types'
import { 
  getCompactWorkoutExplanation, 
  getCompactPlanExplanation,
  getCompactChangeExplanation 
} from '@/lib/explanation-resolver'

interface WorkoutExplanationProps {
  metadata: ProgramExplanationMetadata | undefined
  dayNumber?: number
  variant?: 'session' | 'program' | 'change'
  compact?: boolean
}

export function WorkoutExplanation({ 
  metadata, 
  dayNumber = 1,
  variant = 'session',
  compact = true,
}: WorkoutExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Don't render if no metadata
  if (!metadata) {
    return null
  }
  
  // Get the appropriate explanation based on variant
  let explanation: { title: string; lines: string[] } | null = null
  
  if (variant === 'session') {
    explanation = getCompactWorkoutExplanation(metadata, dayNumber)
  } else if (variant === 'program') {
    explanation = getCompactPlanExplanation(metadata)
  } else if (variant === 'change') {
    explanation = getCompactChangeExplanation(metadata)
  }
  
  // Don't render if no explanation available
  if (!explanation || explanation.lines.length === 0) {
    return null
  }
  
  const { title, lines } = explanation
  const displayLines = compact && !isExpanded ? lines.slice(0, 2) : lines
  const hasMore = lines.length > 2
  
  // Choose icon based on variant
  const Icon = variant === 'change' ? TrendingUp : variant === 'program' ? Calendar : Info
  
  return (
    <Card className="bg-[#1A1A1A] border-[#2A2A2A] p-3">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded bg-[#E63946]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-3.5 h-3.5 text-[#E63946]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-medium text-[#A5A5A5] uppercase tracking-wide">
              {title}
            </h4>
            {hasMore && compact && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-[#6A6A6A] hover:text-[#A5A5A5]"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
          <ul className="mt-1.5 space-y-1">
            {displayLines.map((line, idx) => (
              <li key={idx} className="text-sm text-[#D0D0D0] leading-snug">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

/**
 * PlanExplanationBadge - Ultra-compact inline badge for program header
 */
interface PlanExplanationBadgeProps {
  metadata: ProgramExplanationMetadata | undefined
}

export function PlanExplanationBadge({ metadata }: PlanExplanationBadgeProps) {
  if (!metadata?.summary?.primaryGoalReason) {
    return null
  }
  
  // Show first line of schedule reason or fallback
  const shortReason = metadata.weekStructure?.rationale || 
                      metadata.summary.scheduleReason || 
                      metadata.summary.primaryGoalReason
  
  // Truncate to fit badge
  const truncated = shortReason.length > 60 
    ? shortReason.substring(0, 57) + '...' 
    : shortReason
  
  return (
    <div className="flex items-center gap-1.5 text-xs text-[#A5A5A5]">
      <Sparkles className="w-3 h-3 text-[#E63946]" />
      <span>{truncated}</span>
    </div>
  )
}

/**
 * ChangeExplanationBanner - Shows "Why It Changed" or "Why It Stayed" 
 * after program regeneration
 */
interface ChangeExplanationBannerProps {
  metadata: ProgramExplanationMetadata | undefined
  className?: string
}

export function ChangeExplanationBanner({ metadata, className = '' }: ChangeExplanationBannerProps) {
  if (!metadata?.changeExplanation) {
    return null
  }
  
  const changeExplanation = getCompactChangeExplanation(metadata)
  if (!changeExplanation) {
    return null
  }
  
  const { title, lines } = changeExplanation
  const isChanged = metadata.changeExplanation.changed
  
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg ${
      isChanged 
        ? 'bg-amber-500/5 border border-amber-500/20' 
        : 'bg-green-500/5 border border-green-500/20'
    } ${className}`}>
      <TrendingUp className={`w-4 h-4 mt-0.5 ${
        isChanged ? 'text-amber-400' : 'text-green-400'
      }`} />
      <div>
        <p className={`text-xs font-medium ${
          isChanged ? 'text-amber-400' : 'text-green-400'
        }`}>
          {title}
        </p>
        <ul className="mt-1 space-y-0.5">
          {lines.map((line, idx) => (
            <li key={idx} className="text-sm text-[#A5A5A5]">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * DataConfidenceBadge - Shows data confidence level
 */
interface DataConfidenceBadgeProps {
  confidence: 'none' | 'low' | 'medium' | 'high'
  workoutCount: number
}

export function DataConfidenceBadge({ confidence, workoutCount }: DataConfidenceBadgeProps) {
  if (confidence === 'high') {
    return null // No need to show when confidence is high
  }
  
  const messages: Record<typeof confidence, string> = {
    none: 'Complete workouts to enable smart adaptation',
    low: `${workoutCount} workout${workoutCount === 1 ? '' : 's'} logged — building data`,
    medium: 'Building training history for smarter adaptation',
  }
  
  const colors: Record<typeof confidence, string> = {
    none: 'text-[#6A6A6A]',
    low: 'text-amber-400/70',
    medium: 'text-blue-400/70',
  }
  
  return (
    <p className={`text-xs ${colors[confidence]}`}>
      {messages[confidence]}
    </p>
  )
}
