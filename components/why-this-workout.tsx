'use client'

/**
 * Why This Workout Component
 * 
 * Compact, low-noise UI surface for displaying truthful program explanations.
 * Shows 2-4 lines of grounded explanation based on real engine outputs.
 * 
 * PRINCIPLES:
 * - Never displays fake or unsupported explanations
 * - Keeps content concise and non-hype
 * - Degrades gracefully when data is missing
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Info, Calendar, Zap, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProgramExplanation } from '@/lib/explanations/types'
import { getCompactSummary, hasSubstantiveExplanation } from '@/lib/explanations/explanation-resolver'

// =============================================================================
// TYPES
// =============================================================================

interface WhyThisWorkoutProps {
  explanation: ProgramExplanation | null | undefined
  variant?: 'card' | 'inline' | 'minimal'
  showExpandOption?: boolean
  className?: string
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WhyThisWorkout({
  explanation,
  variant = 'card',
  showExpandOption = false,
  className = '',
}: WhyThisWorkoutProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't render if no meaningful explanation
  if (!explanation || !hasSubstantiveExplanation(explanation)) {
    return null
  }

  const summaryLines = getCompactSummary(explanation)
  
  if (summaryLines.length === 0) {
    return null
  }

  // Minimal variant - just text, no container
  if (variant === 'minimal') {
    return (
      <div className={`text-sm text-[#A5A5A5] space-y-1 ${className}`}>
        {summaryLines.slice(0, 2).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    )
  }

  // Inline variant - subtle background, no border
  if (variant === 'inline') {
    return (
      <div className={`bg-[#1A1A1A]/50 rounded-lg p-3 ${className}`}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[#E63946] mt-0.5 flex-shrink-0" />
          <div className="text-sm text-[#A5A5A5] space-y-1">
            {summaryLines.slice(0, 3).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Card variant - full featured
  return (
    <div className={`bg-gradient-to-b from-[#1A1A1A] to-[#151515] border border-[#2A2A2A] rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#E63946]/10 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-[#E63946]" />
          </div>
          <h3 className="text-sm font-medium text-[#F5F5F5]">Why This Plan</h3>
        </div>
        {showExpandOption && summaryLines.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2 text-[#6A6A6A] hover:text-[#A5A5A5]"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 mr-1" />
                More
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {(isExpanded ? summaryLines : summaryLines.slice(0, 2)).map((line, i) => (
          <p key={i} className="text-sm text-[#A5A5A5] leading-relaxed">
            {line}
          </p>
        ))}
      </div>
      
      {/* Schedule mode indicator for flexible users */}
      {explanation.weekStructure.scheduleMode === 'flexible' && (
        <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-xs text-[#6A6A6A]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Flexible mode: {explanation.weekStructure.currentWeekFrequency} sessions this week</span>
          </div>
        </div>
      )}
      
      {/* Change indicator if program was updated */}
      {explanation.changeExplanation?.changed && (
        <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[#A5A5A5]">{explanation.changeExplanation.summary}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPACT SESSION EXPLANATION
// =============================================================================

interface SessionExplanationProps {
  dayExplanation: ProgramExplanation['dayExplanations'][0] | undefined
  className?: string
}

export function SessionExplanation({ dayExplanation, className = '' }: SessionExplanationProps) {
  if (!dayExplanation) {
    return null
  }

  return (
    <div className={`bg-[#1A1A1A]/50 rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-[#E63946] mt-0.5 flex-shrink-0" />
        <div className="text-sm text-[#A5A5A5]">
          <p>{dayExplanation.whyThisDay}</p>
          {dayExplanation.whyLighterOrHeavier && (
            <p className="mt-1 text-[#6A6A6A]">{dayExplanation.whyLighterOrHeavier}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// CHANGE SUMMARY COMPONENT
// =============================================================================

interface ChangeSummaryProps {
  changeExplanation: ProgramExplanation['changeExplanation'] | undefined
  className?: string
}

export function ChangeSummary({ changeExplanation, className = '' }: ChangeSummaryProps) {
  if (!changeExplanation) {
    return null
  }

  const icon = changeExplanation.changed ? (
    <Zap className="w-4 h-4 text-amber-500" />
  ) : (
    <Info className="w-4 h-4 text-[#6A6A6A]" />
  )

  return (
    <div className={`flex items-start gap-2 text-sm ${className}`}>
      {icon}
      <div>
        <p className="text-[#A5A5A5]">{changeExplanation.summary}</p>
        {changeExplanation.majorReasons.length > 0 && (
          <ul className="mt-1 text-xs text-[#6A6A6A] list-disc list-inside">
            {changeExplanation.majorReasons.slice(0, 2).map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
