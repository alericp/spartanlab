'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Info, Shield, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  PreparationValidation,
  WorkoutPreparationAnalysis,
  SuggestedExercise,
} from '@/lib/preparation-chain-engine'

// =============================================================================
// INLINE PREPARATION STATUS BADGE
// =============================================================================

interface PreparationStatusBadgeProps {
  status: PreparationValidation['status']
  score: number
  compact?: boolean
}

export function PreparationStatusBadge({ status, score, compact = false }: PreparationStatusBadgeProps) {
  const statusConfig = {
    ready: {
      label: 'Ready',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-500',
      icon: CheckCircle2,
    },
    nearly_ready: {
      label: 'Nearly Ready',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-500',
      icon: Target,
    },
    needs_work: {
      label: 'Building',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-500',
      icon: AlertCircle,
    },
    not_ready: {
      label: 'Foundation Needed',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-500',
      icon: AlertCircle,
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs', config.bg, config.text)}>
        <Icon className="w-3 h-3" />
        {score}%
      </span>
    )
  }

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md border', config.bg, config.border)}>
      <Icon className={cn('w-3.5 h-3.5', config.text)} />
      <span className={cn('text-xs font-medium', config.text)}>{config.label}</span>
      <span className="text-xs text-[#6B7280]">({score}%)</span>
    </div>
  )
}

// =============================================================================
// INLINE GUIDANCE MESSAGE
// =============================================================================

interface InlineGuidanceMessageProps {
  message: string
  variant?: 'info' | 'warning' | 'success'
  className?: string
}

export function InlineGuidanceMessage({ message, variant = 'info', className }: InlineGuidanceMessageProps) {
  if (!message) return null

  const variants = {
    info: {
      bg: 'bg-[#1A1F26]',
      border: 'border-[#2B313A]',
      icon: 'text-[#4F6D8A]',
    },
    warning: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      icon: 'text-amber-500',
    },
    success: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-500',
    },
  }

  const config = variants[variant]

  return (
    <div className={cn('flex items-start gap-2 p-2.5 rounded-lg border', config.bg, config.border, className)}>
      <Info className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', config.icon)} />
      <p className="text-xs text-[#A4ACB8] leading-relaxed">{message}</p>
    </div>
  )
}

// =============================================================================
// SKILL PREPARATION CARD (EXPANDABLE)
// =============================================================================

interface SkillPreparationCardProps {
  validation: PreparationValidation
  defaultExpanded?: boolean
}

export function SkillPreparationCard({ validation, defaultExpanded = false }: SkillPreparationCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (validation.status === 'ready' && !expanded) {
    // Minimal display for ready skills
    return (
      <div className="flex items-center justify-between p-2 rounded-lg bg-[#1A1F26] border border-[#2B313A]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-[#E6E9EF]">{validation.skillName}</span>
        </div>
        <PreparationStatusBadge status={validation.status} score={validation.preparationScore} compact />
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-[#1A1F26] border border-[#2B313A] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#1F242C] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#E6E9EF]">{validation.skillName}</span>
          <PreparationStatusBadge status={validation.status} score={validation.preparationScore} compact />
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#6B7280]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B7280]" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#2B313A]">
          {/* Guidance message */}
          {validation.guidanceMessage && (
            <div className="pt-3">
              <InlineGuidanceMessage message={validation.guidanceMessage} />
            </div>
          )}

          {/* Incomplete steps */}
          {validation.incompleteSteps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">Building Toward:</p>
              <ul className="space-y-1.5">
                {validation.incompleteSteps.slice(0, 3).map((step) => (
                  <li key={step.exerciseId} className="flex items-start gap-2 text-xs">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                      step.isCritical ? 'bg-amber-500' : 'bg-[#4F6D8A]'
                    )} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[#E6E9EF]">{step.exerciseName}</span>
                      <span className="text-[#6B7280] ml-1">({step.currentProgress}% of {step.targetCompetency})</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {validation.recommendation && (
            <p className="text-xs text-[#A4ACB8] pt-2 border-t border-[#2B313A]/50">
              {validation.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// WORKOUT PREPARATION SUMMARY
// =============================================================================

interface WorkoutPreparationSummaryProps {
  analysis: WorkoutPreparationAnalysis
  compact?: boolean
}

export function WorkoutPreparationSummary({ analysis, compact = false }: WorkoutPreparationSummaryProps) {
  const [expanded, setExpanded] = useState(false)

  // Don't show if everything is ready
  if (analysis.overallScore >= 90 && analysis.criticalGaps.length === 0) {
    return null
  }

  if (compact) {
    // Minimal inline display
    return (
      <InlineGuidanceMessage
        message={analysis.globalGuidance || 'Supporting exercises included to improve readiness.'}
        variant={analysis.overallScore < 50 ? 'warning' : 'info'}
      />
    )
  }

  return (
    <div className="rounded-lg bg-[#1A1F26] border border-[#2B313A] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#1F242C] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#4F6D8A]" />
          <span className="text-sm font-medium text-[#E6E9EF]">Preparation Status</span>
          <span className="text-xs text-[#6B7280] px-1.5 py-0.5 rounded bg-[#2B313A]">
            {analysis.overallScore}%
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#6B7280]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B7280]" />
        )}
      </button>

      {/* Global guidance */}
      {analysis.globalGuidance && (
        <div className="px-3 pb-3">
          <InlineGuidanceMessage message={analysis.globalGuidance} />
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-[#2B313A]">
          {analysis.skillAnalyses.map((validation) => (
            <SkillPreparationCard key={validation.skillId} validation={validation} />
          ))}

          {/* Suggested exercises */}
          {analysis.suggestedFoundationalExercises.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                Suggested Additions:
              </p>
              {analysis.suggestedFoundationalExercises.slice(0, 2).map((ex) => (
                <SuggestedExerciseCard key={ex.exerciseId} exercise={ex} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// SUGGESTED EXERCISE CARD
// =============================================================================

interface SuggestedExerciseCardProps {
  exercise: SuggestedExercise
}

function SuggestedExerciseCard({ exercise }: SuggestedExerciseCardProps) {
  const priorityColors = {
    essential: 'text-amber-500 bg-amber-500/10',
    recommended: 'text-[#4F6D8A] bg-[#4F6D8A]/10',
    beneficial: 'text-[#6B7280] bg-[#6B7280]/10',
  }

  return (
    <div className="flex items-start gap-2 p-2 rounded bg-[#1F242C]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#E6E9EF]">{exercise.exerciseName}</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded', priorityColors[exercise.priority])}>
            {exercise.priority}
          </span>
        </div>
        <p className="text-xs text-[#6B7280] mt-0.5">{exercise.reason}</p>
        <p className="text-xs text-[#4F6D8A] mt-1">
          {exercise.suggestedSets} sets x {exercise.suggestedReps} for {exercise.supportedSkill}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// OVERRIDE WARNING INLINE
// =============================================================================

interface OverrideWarningInlineProps {
  message: string
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high'
  onProceed?: () => void
  onUseRecommended?: () => void
  recommendedExercise?: string
}

export function OverrideWarningInline({
  message,
  riskLevel,
  onProceed,
  onUseRecommended,
  recommendedExercise,
}: OverrideWarningInlineProps) {
  const riskColors = {
    low: 'border-[#2B313A] bg-[#1A1F26]',
    moderate: 'border-amber-500/30 bg-amber-500/5',
    high: 'border-orange-500/30 bg-orange-500/5',
    very_high: 'border-red-500/30 bg-red-500/5',
  }

  const riskTextColors = {
    low: 'text-[#6B7280]',
    moderate: 'text-amber-500',
    high: 'text-orange-500',
    very_high: 'text-red-500',
  }

  return (
    <div className={cn('rounded-lg border p-3 space-y-2', riskColors[riskLevel])}>
      <div className="flex items-start gap-2">
        <AlertCircle className={cn('w-4 h-4 shrink-0 mt-0.5', riskTextColors[riskLevel])} />
        <p className="text-xs text-[#A4ACB8] leading-relaxed">{message}</p>
      </div>

      {(onProceed || onUseRecommended) && (
        <div className="flex items-center gap-2 pt-1">
          {recommendedExercise && onUseRecommended && (
            <button
              onClick={onUseRecommended}
              className="text-xs text-[#4F6D8A] hover:text-[#5D8DAA] transition-colors"
            >
              Use {recommendedExercise}
            </button>
          )}
          {onProceed && (
            <button
              onClick={onProceed}
              className="text-xs text-[#6B7280] hover:text-[#A4ACB8] transition-colors ml-auto"
            >
              Proceed anyway
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// EXERCISE PREPARATION INSIGHT
// =============================================================================

interface ExercisePreparationInsightProps {
  exerciseName: string
  supportedSkill: string
  preparationPurpose: string
  className?: string
}

export function ExercisePreparationInsight({
  exerciseName,
  supportedSkill,
  preparationPurpose,
  className,
}: ExercisePreparationInsightProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn('text-xs', className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[#4F6D8A] hover:text-[#5D8DAA] transition-colors"
      >
        <Target className="w-3 h-3" />
        <span>Supports {supportedSkill}</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      
      {expanded && (
        <p className="text-[#6B7280] mt-1 pl-4 leading-relaxed">
          {preparationPurpose}
        </p>
      )}
    </div>
  )
}
