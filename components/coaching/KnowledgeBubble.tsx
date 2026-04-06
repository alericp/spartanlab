'use client'

import { useState } from 'react'
import { Info, Lightbulb, AlertTriangle, Target, Zap, BookOpen, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getExerciseKnowledge,
  getProtocolKnowledge,
  getStructureKnowledge,
  type KnowledgeBubbleType,
  type KnowledgePriority,
  type ExerciseKnowledge,
} from '@/lib/knowledge-bubble-content'

// =============================================================================
// BASE KNOWLEDGE BUBBLE COMPONENT
// =============================================================================

interface KnowledgeBubbleProps {
  content: string
  type?: KnowledgeBubbleType
  priority?: KnowledgePriority
  title?: string
  expandedContent?: string
  className?: string
  compact?: boolean
}

export function KnowledgeBubble({
  content,
  type = 'exercise_reason',
  priority = 'medium',
  title,
  expandedContent,
  className,
  compact = false,
}: KnowledgeBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const getIcon = () => {
    switch (type) {
      case 'exercise_reason':
        return <Target className="w-3.5 h-3.5" />
      case 'progression_reason':
        return <Zap className="w-3.5 h-3.5" />
      case 'override_warning':
        return <AlertTriangle className="w-3.5 h-3.5" />
      case 'protocol_reason':
        return <Shield className="w-3.5 h-3.5" />
      case 'workout_structure_reason':
        return <BookOpen className="w-3.5 h-3.5" />
      case 'skill_readiness_reason':
        return <Lightbulb className="w-3.5 h-3.5" />
      default:
        return <Info className="w-3.5 h-3.5" />
    }
  }
  
  const getColors = () => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          icon: 'text-red-400',
          text: 'text-red-200',
        }
      case 'high':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          icon: 'text-amber-400',
          text: 'text-amber-200',
        }
      case 'medium':
        return {
          bg: 'bg-[#4F6D8A]/10',
          border: 'border-[#4F6D8A]/20',
          icon: 'text-[#4F6D8A]',
          text: 'text-[#A4ACB8]',
        }
      case 'low':
      default:
        return {
          bg: 'bg-[#1F1F1F]/50',
          border: 'border-[#2B313A]/50',
          icon: 'text-[#6B7280]',
          text: 'text-[#6B7280]',
        }
    }
  }
  
  const colors = getColors()
  
  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        colors.text,
        className
      )}>
        <span className={colors.icon}>{getIcon()}</span>
        <span className="truncate max-w-[200px]">{content}</span>
      </div>
    )
  }
  
  return (
    <div className={cn(
      'rounded-lg border p-2.5',
      colors.bg,
      colors.border,
      className
    )}>
      <div 
        className={cn(
          'flex items-start gap-2',
          expandedContent && 'cursor-pointer'
        )}
        onClick={() => expandedContent && setIsExpanded(!isExpanded)}
      >
        <span className={cn('shrink-0 mt-0.5', colors.icon)}>
          {getIcon()}
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-xs font-medium text-[#E6E9EF] mb-0.5">{title}</p>
          )}
          <p className={cn('text-xs leading-relaxed', colors.text)}>
            {content}
          </p>
        </div>
        {expandedContent && (
          <span className={cn('shrink-0', colors.icon)}>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </div>
      {isExpanded && expandedContent && (
        <div className="mt-2 pt-2 border-t border-[#2B313A]/50">
          <p className="text-xs text-[#6B7280] leading-relaxed">{expandedContent}</p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// INLINE INFO ICON WITH TOOLTIP
// =============================================================================

interface InfoBubbleProps {
  content: string
  className?: string
}

export function InfoBubble({ content, className }: InfoBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-0.5 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        aria-label="More info"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2B313A] shadow-lg">
            <p className="text-xs text-[#A4ACB8] leading-relaxed">{content}</p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-[#2B313A]" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// =============================================================================
// EXERCISE KNOWLEDGE BUBBLE
// =============================================================================

interface ExerciseKnowledgeBubbleProps {
  exerciseId: string
  exerciseName?: string
  showSkillCarryover?: boolean
  showSafetyNote?: boolean
  compact?: boolean
  className?: string
}

export function ExerciseKnowledgeBubble({
  exerciseId,
  exerciseName,
  showSkillCarryover = false,
  showSafetyNote = true,
  compact = false,
  className,
}: ExerciseKnowledgeBubbleProps) {
  const knowledge = getExerciseKnowledge(exerciseId)
  
  if (!knowledge) {
    return null
  }
  
  // Build expanded content
  let expandedContent: string | undefined
  const parts: string[] = []
  
  if (showSkillCarryover && knowledge.skillCarryover?.length) {
    parts.push(`Skill carryover: ${knowledge.skillCarryover.map(s => s.replace(/_/g, ' ')).join(', ')}`)
  }
  if (showSafetyNote && knowledge.safetyNote) {
    parts.push(knowledge.safetyNote)
  }
  if (knowledge.commonMistake) {
    parts.push(knowledge.commonMistake)
  }
  
  if (parts.length > 0) {
    expandedContent = parts.join(' ')
  }
  
  if (compact) {
    return (
      <KnowledgeBubble
        content={knowledge.shortReason}
        type="exercise_reason"
        compact
        className={className}
      />
    )
  }
  
  return (
    <KnowledgeBubble
      content={knowledge.shortReason}
      type="exercise_reason"
      priority="medium"
      expandedContent={expandedContent}
      className={className}
    />
  )
}

// =============================================================================
// PROTOCOL KNOWLEDGE BUBBLE
// =============================================================================

interface ProtocolKnowledgeBubbleProps {
  protocolId: string
  className?: string
}

export function ProtocolKnowledgeBubble({
  protocolId,
  className,
}: ProtocolKnowledgeBubbleProps) {
  const knowledge = getProtocolKnowledge(protocolId)
  
  if (!knowledge) {
    return null
  }
  
  const expandedContent = knowledge.skillConnection?.length
    ? `Supports: ${knowledge.skillConnection.map(s => s.replace(/_/g, ' ')).join(', ')}`
    : undefined
  
  return (
    <KnowledgeBubble
      content={knowledge.shortReason}
      type="protocol_reason"
      priority="medium"
      expandedContent={expandedContent}
      className={className}
    />
  )
}

// =============================================================================
// STRUCTURE KNOWLEDGE BUBBLE
// =============================================================================

interface StructureKnowledgeBubbleProps {
  structureType: string
  className?: string
}

export function StructureKnowledgeBubble({
  structureType,
  className,
}: StructureKnowledgeBubbleProps) {
  const knowledge = getStructureKnowledge(structureType)
  
  if (!knowledge) {
    return null
  }
  
  return (
    <KnowledgeBubble
      content={knowledge.reason}
      type="workout_structure_reason"
      priority="low"
      expandedContent={knowledge.benefit}
      className={className}
    />
  )
}

// =============================================================================
// PROGRESSION KNOWLEDGE BUBBLE
// =============================================================================

interface ProgressionKnowledgeBubbleProps {
  fromStage: string
  toStage: string
  reason?: string
  limitingFactor?: string
  className?: string
}

export function ProgressionKnowledgeBubble({
  fromStage,
  toStage,
  reason,
  limitingFactor,
  className,
}: ProgressionKnowledgeBubbleProps) {
  const content = reason || `Progressing from ${fromStage} to ${toStage} based on your current readiness.`
  const expandedContent = limitingFactor
    ? `Current limiting factor: ${limitingFactor.replace(/_/g, ' ')}`
    : undefined
  
  return (
    <KnowledgeBubble
      content={content}
      type="progression_reason"
      priority="medium"
      expandedContent={expandedContent}
      className={className}
    />
  )
}

// =============================================================================
// READINESS EXPLANATION BUBBLE
// =============================================================================

interface ReadinessKnowledgeBubbleProps {
  explanation: string
  isStrongArea?: boolean
  className?: string
}

export function ReadinessKnowledgeBubble({
  explanation,
  isStrongArea = false,
  className,
}: ReadinessKnowledgeBubbleProps) {
  return (
    <KnowledgeBubble
      content={explanation}
      type="skill_readiness_reason"
      priority={isStrongArea ? 'low' : 'medium'}
      className={className}
    />
  )
}

// =============================================================================
// OVERRIDE WARNING BUBBLE
// =============================================================================

interface OverrideWarningBubbleProps {
  warningMessage: string
  recommendedExercise?: string
  riskLevel?: 'moderate' | 'high' | 'very_high'
  className?: string
}

export function OverrideWarningBubble({
  warningMessage,
  recommendedExercise,
  riskLevel = 'moderate',
  className,
}: OverrideWarningBubbleProps) {
  const priority: KnowledgePriority = riskLevel === 'very_high' ? 'critical' : riskLevel === 'high' ? 'high' : 'medium'
  
  const expandedContent = recommendedExercise
    ? `SpartanLab recommends: ${recommendedExercise}`
    : undefined
  
  return (
    <KnowledgeBubble
      content={warningMessage}
      type="override_warning"
      priority={priority}
      title="Exercise Override Warning"
      expandedContent={expandedContent}
      className={className}
    />
  )
}

// =============================================================================
// METHOD INFO BUBBLE - For training method explanations (Superset, Circuit, etc.)
// =============================================================================

interface MethodInfoBubbleProps {
  /** Training method type */
  methodType: 'superset' | 'circuit' | 'cluster' | 'density_block' | 'emom' | 'straight_sets'
  /** Optional additional context */
  context?: string
  /** Show as inline icon or full bubble */
  variant?: 'icon' | 'inline' | 'full'
  className?: string
}

export function MethodInfoBubble({
  methodType,
  context,
  variant = 'icon',
  className,
}: MethodInfoBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const knowledge = getStructureKnowledge(methodType)
  if (!knowledge) return null
  
  // Icon-only variant with tooltip
  if (variant === 'icon') {
    return (
      <div className={cn('relative inline-flex', className)}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className="p-0.5 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          aria-label={`Learn about ${methodType}`}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-2.5 rounded-lg bg-[#1A1A1A] border border-[#2B313A] shadow-lg">
              <p className="text-xs font-medium text-[#E6E9EF] mb-1 capitalize">{methodType.replace(/_/g, ' ')}</p>
              <p className="text-xs text-[#A4ACB8] leading-relaxed">{knowledge.reason}</p>
              <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">{knowledge.benefit}</p>
              {context && (
                <p className="text-xs text-[#4F6D8A] mt-1.5 italic">{context}</p>
              )}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="border-4 border-transparent border-t-[#2B313A]" />
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
  
  // Inline variant - compact single line
  if (variant === 'inline') {
    return (
      <span className={cn('text-xs text-[#6B7280]', className)}>
        {knowledge.reason}
      </span>
    )
  }
  
  // Full variant - expandable card
  return (
    <KnowledgeBubble
      content={knowledge.reason}
      type="workout_structure_reason"
      priority="low"
      expandedContent={knowledge.benefit}
      className={className}
    />
  )
}

// =============================================================================
// COACHING INSIGHT BUBBLE (Generic)
// =============================================================================

interface CoachingInsightBubbleProps {
  insight: string
  context?: string
  icon?: 'lightbulb' | 'target' | 'zap' | 'info'
  className?: string
}

export function CoachingInsightBubble({
  insight,
  context,
  icon = 'lightbulb',
  className,
}: CoachingInsightBubbleProps) {
  const getIcon = () => {
    switch (icon) {
      case 'lightbulb': return <Lightbulb className="w-3.5 h-3.5" />
      case 'target': return <Target className="w-3.5 h-3.5" />
      case 'zap': return <Zap className="w-3.5 h-3.5" />
      default: return <Info className="w-3.5 h-3.5" />
    }
  }
  
  return (
    <div className={cn(
      'flex items-start gap-2 p-2.5 rounded-lg bg-[#1F1F1F]/50 border border-[#2B313A]/50',
      className
    )}>
      <span className="text-[#4F6D8A] shrink-0 mt-0.5">
        {getIcon()}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#A4ACB8] leading-relaxed">{insight}</p>
        {context && (
          <p className="text-xs text-[#6B7280] mt-1">{context}</p>
        )}
      </div>
    </div>
  )
}
