'use client'

/**
 * Why This Workout Block
 * 
 * A small, non-intrusive UI surface for displaying truthful, grounded
 * explanations about why the workout/program was structured this way.
 * 
 * CRITICAL: Only displays explanations that are backed by real engine data.
 * Does NOT generate or fabricate explanations - only renders what the
 * explanation layer has already computed and stored.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import type { ProgramExplanationMetadata } from '@/lib/explanation-types'
import {
  getCompactPlanExplanation,
  getCompactWorkoutExplanation,
  getCompactChangeExplanation,
} from '@/lib/explanation-resolver'

// =============================================================================
// WHY THIS PLAN BLOCK - Program-level explanation
// =============================================================================

interface WhyThisPlanBlockProps {
  explanationMetadata?: ProgramExplanationMetadata
  className?: string
}

export function WhyThisPlanBlock({ explanationMetadata, className = '' }: WhyThisPlanBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Don't render if no explanation metadata available
  if (!explanationMetadata) {
    return null
  }
  
  const compact = getCompactPlanExplanation(explanationMetadata)
  if (!compact || compact.lines.length === 0) {
    return null
  }
  
  // Also check for change explanation
  const changeCompact = getCompactChangeExplanation(explanationMetadata)
  
  return (
    <div className={`p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#E63946]" />
          <span className="text-sm font-medium text-[#F5F5F5]">{compact.title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[#6A6A6A]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6A6A6A]" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {compact.lines.map((line, idx) => (
            <p key={idx} className="text-sm text-[#A5A5A5] pl-6">
              {line}
            </p>
          ))}
          
          {/* Change explanation if available */}
          {changeCompact && (
            <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
              <p className="text-xs font-medium text-[#6A6A6A] mb-1">{changeCompact.title}</p>
              {changeCompact.lines.map((line, idx) => (
                <p key={idx} className="text-xs text-[#6A6A6A] pl-0">
                  {line}
                </p>
              ))}
            </div>
          )}
          
          {/* Data confidence indicator */}
          {explanationMetadata.dataConfidence && (
            <p className="text-xs text-[#4A4A4A] pl-6 mt-2">
              {explanationMetadata.dataConfidence === 'none' || explanationMetadata.dataConfidence === 'low'
                ? 'Building training data for smarter adaptation.'
                : explanationMetadata.dataConfidence === 'medium'
                  ? `Based on ${explanationMetadata.trustedWorkoutCount} recent workouts.`
                  : `Confidently adapted from ${explanationMetadata.trustedWorkoutCount} workouts.`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// WHY THIS SESSION BLOCK - Session/day-level explanation
// [PHASE 15F] Updated to prefer truthful session explanation from final assembly
// =============================================================================

interface WhyThisSessionBlockProps {
  explanationMetadata?: ProgramExplanationMetadata
  dayNumber: number
  className?: string
  // [PHASE 15F] Direct session-level truthful explanation from final assembly
  truthfulSessionExplanation?: string
  resolvedNarrativeReason?: string
}

export function WhyThisSessionBlock({ 
  explanationMetadata, 
  dayNumber, 
  className = '',
  truthfulSessionExplanation,
  resolvedNarrativeReason,
}: WhyThisSessionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // [PHASE 15F TASK 2] Prefer truthful session explanation from final assembly
  // This reads from final session truth, NOT template-level assumptions
  if (truthfulSessionExplanation || resolvedNarrativeReason) {
    const truthfulLines = [
      truthfulSessionExplanation,
      resolvedNarrativeReason,
    ].filter(Boolean) as string[]
    
    console.log('[phase15f-why-block-uses-truthful-explanation]', {
      dayNumber,
      hasTruthfulExplanation: !!truthfulSessionExplanation,
      hasResolvedNarrative: !!resolvedNarrativeReason,
      usedFinalSessionTruth: true,
    })
    
    return (
      <div className={`p-3 bg-[#1A1A1A]/50 rounded-lg border border-[#2A2A2A]/50 ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-[#4F6D8A]" />
            <span className="text-xs font-medium text-[#A5A5A5]">Why This Workout</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#6A6A6A]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#6A6A6A]" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-2 space-y-1 pl-5">
            {truthfulLines.map((line, idx) => (
              <p key={idx} className="text-xs text-[#6A6A6A]">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // Fallback to metadata-based explanation if no truthful explanation available
  // Don't render if no explanation metadata available
  if (!explanationMetadata) {
    return null
  }
  
  const compact = getCompactWorkoutExplanation(explanationMetadata, dayNumber)
  if (!compact || compact.lines.length === 0) {
    return null
  }
  
  return (
    <div className={`p-3 bg-[#1A1A1A]/50 rounded-lg border border-[#2A2A2A]/50 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-[#4F6D8A]" />
          <span className="text-xs font-medium text-[#A5A5A5]">{compact.title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#6A6A6A]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#6A6A6A]" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-2 space-y-1 pl-5">
          {compact.lines.map((line, idx) => (
            <p key={idx} className="text-xs text-[#6A6A6A]">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// INLINE EXPLANATION - Very compact, single-line version
// =============================================================================

interface InlineExplanationProps {
  explanationMetadata?: ProgramExplanationMetadata
  dayNumber?: number
  type: 'plan' | 'session'
}

export function InlineExplanation({ explanationMetadata, dayNumber, type }: InlineExplanationProps) {
  if (!explanationMetadata) return null
  
  if (type === 'plan') {
    const compact = getCompactPlanExplanation(explanationMetadata)
    if (!compact || compact.lines.length === 0) return null
    
    return (
      <p className="text-xs text-[#6A6A6A] italic">
        {compact.lines[0]}
      </p>
    )
  }
  
  if (type === 'session' && dayNumber !== undefined) {
    const compact = getCompactWorkoutExplanation(explanationMetadata, dayNumber)
    if (!compact || compact.lines.length === 0) return null
    
    return (
      <p className="text-xs text-[#6A6A6A] italic">
        {compact.lines[0]}
      </p>
    )
  }
  
  return null
}
