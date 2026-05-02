'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Target, TrendingUp, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import {
  type CanonicalReadinessResult,
  type LimitingFactor,
  LIMITING_FACTOR_LABELS,
} from '@/lib/readiness/canonical-readiness-engine'

// =============================================================================
// SKILL DISPLAY CONFIGURATION
// =============================================================================

const SKILL_LABELS: Record<string, string> = {
  front_lever: 'Front Lever',
  back_lever: 'Back Lever',
  planche: 'Planche',
  hspu: 'Handstand Push-Up',
  muscle_up: 'Muscle-Up',
  l_sit: 'L-Sit',
  iron_cross: 'Iron Cross',
}

const SKILL_CALCULATOR_LINKS: Record<string, string> = {
  front_lever: '/front-lever-readiness-calculator',
  back_lever: '/skills/back-lever',
  planche: '/planche-readiness-calculator',
  hspu: '/hspu-readiness-calculator',
  muscle_up: '/muscle-up-readiness-calculator',
  l_sit: '/skills/l-sit',
  iron_cross: '/skills/iron-cross',
}

const SKILL_ROADMAP_LINKS: Record<string, string> = {
  front_lever: '/skills/front-lever',
  back_lever: '/skills/back-lever',
  planche: '/skills/planche',
  hspu: '/skills/handstand-push-up',
  muscle_up: '/skills/muscle-up',
  l_sit: '/skills/l-sit',
  iron_cross: '/skills/iron-cross',
}

// Athlete-friendly component labels
const COMPONENT_LABELS: Record<string, string> = {
  pullStrength: 'Pull Strength',
  pushStrength: 'Push Strength',
  compression: 'Compression Strength',
  scapularControl: 'Scapular Control',
  straightArmStrength: 'Straight Arm Strength',
  shoulderStability: 'Shoulder Stability',
  wristTolerance: 'Wrist Tolerance',
  mobility: 'Mobility',
  explosivePower: 'Explosive Power',
  skillSpecific: 'Skill Technique',
}

// Which components to show for each skill (most relevant ones)
const SKILL_RELEVANT_COMPONENTS: Record<string, (keyof typeof COMPONENT_LABELS)[]> = {
  front_lever: ['pullStrength', 'compression', 'scapularControl', 'straightArmStrength'],
  back_lever: ['mobility', 'shoulderStability', 'compression', 'skillSpecific'],
  planche: ['pushStrength', 'compression', 'straightArmStrength', 'shoulderStability'],
  hspu: ['pushStrength', 'shoulderStability', 'skillSpecific', 'compression'],
  muscle_up: ['pullStrength', 'pushStrength', 'explosivePower', 'skillSpecific'],
  l_sit: ['compression', 'pushStrength', 'mobility', 'skillSpecific'],
  iron_cross: ['shoulderStability', 'straightArmStrength', 'compression', 'skillSpecific'],
}

// =============================================================================
// COACHING MICROCOPY
// =============================================================================

function getLimiterMicrocopy(skill: string, limiter: LimitingFactor): string {
  const label = LIMITING_FACTOR_LABELS[limiter] || limiter
  const skillLabel = SKILL_LABELS[skill] || skill
  
  const templates: Record<LimitingFactor, string> = {
    pull_strength: `Pulling strength is currently the main factor holding back your ${skillLabel}.`,
    push_strength: `Pushing strength is limiting your ${skillLabel} progress.`,
    straight_arm_pull_strength: `Straight-arm pulling strength is the key limiter for your ${skillLabel}.`,
    straight_arm_push_strength: `Straight-arm push strength is currently limiting your ${skillLabel}.`,
    compression_strength: `Core compression is the main factor holding back your ${skillLabel}.`,
    core_control: `Core control and tension need improvement for ${skillLabel}.`,
    scapular_control: `Scapular control is limiting your ${skillLabel} stability.`,
    shoulder_stability: `Shoulder stability is the limiting factor for your ${skillLabel}.`,
    wrist_tolerance: `Wrist conditioning needs work before advancing your ${skillLabel}.`,
    explosive_pull_power: `Explosive pulling power is the key limiter for your ${skillLabel}.`,
    transition_strength: `Transition strength needs improvement for your ${skillLabel}.`,
    vertical_push_strength: `Vertical pressing strength is limiting your ${skillLabel} progress.`,
    mobility: `Mobility is currently restricting your ${skillLabel} potential.`,
    shoulder_extension_mobility: `Shoulder extension mobility is the key limiter for ${skillLabel}.`,
    skill_coordination: `Skill-specific coordination needs more practice for ${skillLabel}.`,
    balance_control: `Balance and control are the limiting factors for your ${skillLabel}.`,
    tendon_tolerance: `Tendon and connective-tissue readiness is currently limiting your ${skillLabel}. Progress slowly with isometric holds and tempo work to let tendons adapt.`,
    ring_support_stability: `Ring support stability is the limiting factor for your ${skillLabel} on rings. Build support-position holds and shoulder control before adding load.`,
    none: `You're progressing well toward ${skillLabel}!`,
  }
  
  return templates[limiter] || `${label} is currently your limiting factor for ${skillLabel}.`
}

function getStrongAreaMicrocopy(skill: string, strongAreas: LimitingFactor[]): string | null {
  if (strongAreas.length === 0) return null
  
  const labels = strongAreas
    .slice(0, 2)
    .map(a => LIMITING_FACTOR_LABELS[a] || a)
    .join(' and ')
  
  return `${labels} ${strongAreas.length === 1 ? 'is' : 'are'} already strong enough for your current stage.`
}

// =============================================================================
// VISUAL HELPERS
// =============================================================================

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400'
  if (score >= 70) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  if (score >= 25) return 'text-orange-400'
  return 'text-red-400'
}

function getScoreBgColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500/20'
  if (score >= 70) return 'bg-green-500/20'
  if (score >= 50) return 'bg-yellow-500/20'
  if (score >= 25) return 'bg-orange-500/20'
  return 'bg-red-500/20'
}

function getBarColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500'
  if (score >= 70) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-500'
  if (score >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface SkillReadinessVisualProps {
  result: CanonicalReadinessResult
  showBreakdown?: boolean
  showCoaching?: boolean
  compact?: boolean
  className?: string
}

/**
 * Compact Skill Readiness Visual
 * Displays readiness score, primary limiter, next milestone, and optional breakdown.
 * Designed for dashboard placement - clean, mobile-friendly, and actionable.
 */
export function SkillReadinessVisual({
  result,
  showBreakdown = true,
  showCoaching = true,
  compact = false,
  className,
}: SkillReadinessVisualProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)
  
  const {
    skill,
    overallScore,
    levelLabel,
    components,
    primaryLimiter,
    strongAreas,
    nextProgression,
  } = result
  
  const skillLabel = SKILL_LABELS[skill] || skill
  const calculatorLink = SKILL_CALCULATOR_LINKS[skill]
  const roadmapLink = SKILL_ROADMAP_LINKS[skill]
  const relevantComponents = SKILL_RELEVANT_COMPONENTS[skill] || []
  
  // Coaching microcopy
  const limiterMicrocopy = primaryLimiter !== 'none' 
    ? getLimiterMicrocopy(skill, primaryLimiter) 
    : null
  const strongMicrocopy = getStrongAreaMicrocopy(skill, strongAreas)
  
  return (
    <Card className={cn(
      "p-4 bg-[#0F1318] border-[#2B313A] transition-all",
      className
    )}>
      {/* Header: Skill Name + Score */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[#F5F5F5] truncate">{skillLabel}</h3>
            {roadmapLink && (
              <Link 
                href={roadmapLink}
                className="text-xs text-[#6B7280] hover:text-[#E63946] transition-colors"
              >
                View Roadmap
              </Link>
            )}
          </div>
          <p className="text-sm text-[#A5A5A5]">{levelLabel}</p>
        </div>
        
        {/* Score Badge */}
        <div className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-lg",
          getScoreBgColor(overallScore)
        )}>
          <span className={cn("text-2xl font-bold", getScoreColor(overallScore))}>
            {overallScore}
          </span>
          <span className="text-[#6B7280] text-sm">%</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#1A1F26] rounded-full overflow-hidden mb-3">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", getBarColor(overallScore))}
          style={{ width: `${overallScore}%` }}
        />
      </div>
      
      {/* Primary Limiter + Next Milestone */}
      <div className="flex flex-wrap gap-3 mb-3 text-sm">
        {primaryLimiter && primaryLimiter !== 'none' && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[#A5A5A5]">Limiter:</span>
            <span className="text-[#F5F5F5] font-medium">
              {LIMITING_FACTOR_LABELS[primaryLimiter] || primaryLimiter}
            </span>
          </div>
        )}
        
        {nextProgression && (
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#E63946]" />
            <span className="text-[#A5A5A5]">Next:</span>
            <span className="text-[#F5F5F5] font-medium">{nextProgression}</span>
          </div>
        )}
      </div>
      
      {/* Expand/Collapse for Breakdown */}
      {showBreakdown && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#A5A5A5] transition-colors mb-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Hide Breakdown
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show Breakdown
            </>
          )}
        </button>
      )}
      
      {/* Component Breakdown */}
      {isExpanded && showBreakdown && (
        <div className="space-y-2 mb-3">
          {relevantComponents.map((componentKey) => {
            const score = components[componentKey as keyof typeof components] ?? 50
            const label = COMPONENT_LABELS[componentKey] || componentKey
            const isLimiter = primaryLimiter && 
              componentKey.toLowerCase().includes(primaryLimiter.replace(/_/g, ''))
            const isStrong = strongAreas.some(a => 
              componentKey.toLowerCase().includes(a.replace(/_/g, ''))
            )
            
            return (
              <div key={componentKey} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    "flex items-center gap-1",
                    isLimiter && "text-amber-400",
                    isStrong && "text-emerald-400",
                    !isLimiter && !isStrong && "text-[#A5A5A5]"
                  )}>
                    {isStrong && <CheckCircle2 className="w-3 h-3" />}
                    {label}
                  </span>
                  <span className={cn(
                    "font-medium",
                    isLimiter && "text-amber-400",
                    isStrong && "text-emerald-400",
                    !isLimiter && !isStrong && "text-[#E5E5E5]"
                  )}>
                    {score}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1A1F26] rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      isLimiter && "bg-amber-500",
                      isStrong && "bg-emerald-500",
                      !isLimiter && !isStrong && getBarColor(score)
                    )}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Coaching Microcopy */}
      {showCoaching && isExpanded && (
        <div className="space-y-2 mt-3 pt-3 border-t border-[#2B313A]">
          {limiterMicrocopy && (
            <div className="flex items-start gap-2 text-xs">
              <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-[#A5A5A5] leading-relaxed">{limiterMicrocopy}</p>
            </div>
          )}
          
          {strongMicrocopy && (
            <div className="flex items-start gap-2 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-[#A5A5A5] leading-relaxed">{strongMicrocopy}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Calculator Link */}
      {calculatorLink && (
        <Link
          href={calculatorLink}
          className="block mt-3 pt-3 border-t border-[#2B313A] text-xs text-[#6B7280] hover:text-[#E63946] transition-colors text-center"
        >
          Take Full Readiness Assessment
        </Link>
      )}
    </Card>
  )
}

// =============================================================================
// COMPACT INLINE VERSION
// =============================================================================

interface CompactReadinessProps {
  result: CanonicalReadinessResult
  className?: string
}

/**
 * Ultra-compact readiness display for tight spaces
 */
export function CompactSkillReadiness({ result, className }: CompactReadinessProps) {
  const { skill, overallScore, primaryLimiter, nextProgression } = result
  const skillLabel = SKILL_LABELS[skill] || skill
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 bg-[#0F1318] rounded-lg border border-[#2B313A]",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold",
          getScoreBgColor(overallScore)
        )}>
          <span className={getScoreColor(overallScore)}>{overallScore}</span>
        </div>
        <div>
          <p className="font-medium text-[#F5F5F5] text-sm">{skillLabel}</p>
          {primaryLimiter && primaryLimiter !== 'none' && (
            <p className="text-xs text-[#A5A5A5]">
              {LIMITING_FACTOR_LABELS[primaryLimiter]}
            </p>
          )}
        </div>
      </div>
      {nextProgression && (
        <div className="text-right">
          <p className="text-xs text-[#6B7280]">Next</p>
          <p className="text-xs text-[#F5F5F5] font-medium">{nextProgression}</p>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { SkillReadinessVisualProps, CompactReadinessProps }
