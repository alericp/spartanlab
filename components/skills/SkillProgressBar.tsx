'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { 
  Target,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface SkillStage {
  name: string
  shortName?: string
}

export interface SkillProgressBarProps {
  skillName: string
  stages: SkillStage[]
  currentStageIndex: number
  progressWithinStage?: number // 0-100, optional sub-progress within current stage
  trend?: 'improving' | 'stable' | 'needs_focus'
  focusNote?: string // e.g., "Compression strength limiting"
  sessionsThisMonth?: number
  className?: string
  variant?: 'default' | 'compact' | 'expanded'
}

// =============================================================================
// SKILL PROGRESS COLORS - Based on progress tier
// =============================================================================

const PROGRESS_TIERS = {
  early: { 
    gradient: 'from-[#C1121F]/70 to-[#C1121F]',
    glow: 'shadow-[#C1121F]/20',
    text: 'text-[#C1121F]',
    bg: 'bg-[#C1121F]/10',
    border: 'border-[#C1121F]/30',
  },
  mid: { 
    gradient: 'from-amber-500/80 to-amber-400',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  advanced: { 
    gradient: 'from-emerald-500/80 to-emerald-400',
    glow: 'shadow-emerald-500/20',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  master: { 
    gradient: 'from-violet-500/80 to-violet-400',
    glow: 'shadow-violet-500/20',
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
}

function getProgressTier(stageIndex: number, totalStages: number) {
  const progressRatio = stageIndex / (totalStages - 1)
  if (progressRatio >= 0.85) return PROGRESS_TIERS.master
  if (progressRatio >= 0.6) return PROGRESS_TIERS.advanced
  if (progressRatio >= 0.3) return PROGRESS_TIERS.mid
  return PROGRESS_TIERS.early
}

// =============================================================================
// TREND INDICATOR
// =============================================================================

function TrendIndicator({ trend }: { trend: 'improving' | 'stable' | 'needs_focus' }) {
  const config = {
    improving: { 
      Icon: TrendingUp, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      label: 'Improving',
    },
    stable: { 
      Icon: Minus, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10',
      label: 'Stable',
    },
    needs_focus: { 
      Icon: TrendingDown, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10',
      label: 'Focus',
    },
  }
  
  const { Icon, color, bg, label } = config[trend]
  
  return (
    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', bg, color)}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  )
}

// =============================================================================
// PREMIUM PROGRESS BAR VISUAL
// =============================================================================

interface ProgressBarVisualProps {
  stages: SkillStage[]
  currentStageIndex: number
  progressWithinStage?: number
  tier: typeof PROGRESS_TIERS.early
}

function ProgressBarVisual({ 
  stages, 
  currentStageIndex, 
  progressWithinStage = 50,
  tier,
}: ProgressBarVisualProps) {
  const totalStages = stages.length
  
  // Calculate total progress percentage
  // Each completed stage + partial current stage
  const baseProgress = (currentStageIndex / totalStages) * 100
  const stageWidth = 100 / totalStages
  const subProgress = (progressWithinStage / 100) * stageWidth
  const totalProgress = Math.min(baseProgress + subProgress, 100)
  
  return (
    <div className="relative">
      {/* Track background with subtle gradient */}
      <div className="relative h-3 rounded-full bg-[#0F1115] overflow-hidden border border-[#2B313A]/50">
        {/* Subtle track texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2B313A]/10 to-transparent" />
        
        {/* Progress fill with gradient and glow */}
        <div 
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
            `bg-gradient-to-r ${tier.gradient}`,
          )}
          style={{ width: `${totalProgress}%` }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-full" />
          
          {/* Animated pulse at the end */}
          <div 
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80',
              'animate-pulse shadow-lg',
              tier.glow,
            )}
          />
        </div>
        
        {/* Stage markers - subtle dots */}
        <div className="absolute inset-0 flex items-center justify-between px-0.5">
          {stages.slice(0, -1).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-0.5 h-1.5 rounded-full transition-colors duration-300',
                i < currentStageIndex ? 'bg-white/30' : 'bg-[#2B313A]',
              )}
              style={{ marginLeft: `${((i + 1) / totalStages) * 100}%`, position: 'absolute' }}
            />
          ))}
        </div>
      </div>
      
      {/* Stage labels below */}
      <div className="flex justify-between mt-1.5 px-0.5">
        <span className="text-[10px] text-[#6B7280]">{stages[0].shortName || stages[0].name}</span>
        <span className="text-[10px] text-[#6B7280]">{stages[stages.length - 1].shortName || stages[stages.length - 1].name}</span>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT - DEFAULT VARIANT
// =============================================================================

export function SkillProgressBar({
  skillName,
  stages,
  currentStageIndex,
  progressWithinStage = 50,
  trend,
  focusNote,
  sessionsThisMonth,
  className,
  variant = 'default',
}: SkillProgressBarProps) {
  const currentStage = stages[currentStageIndex]
  const nextStage = stages[currentStageIndex + 1]
  const tier = getProgressTier(currentStageIndex, stages.length)
  
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', tier.bg)}>
              <Target className={cn('w-3.5 h-3.5', tier.text)} />
            </div>
            <span className="text-sm font-medium text-[#E6E9EF]">{skillName}</span>
          </div>
          {trend && <TrendIndicator trend={trend} />}
        </div>
        
        <ProgressBarVisual
          stages={stages}
          currentStageIndex={currentStageIndex}
          progressWithinStage={progressWithinStage}
          tier={tier}
        />
        
        <div className="flex items-center justify-between text-xs">
          <span className={cn('font-medium', tier.text)}>{currentStage.name}</span>
          {nextStage && (
            <span className="text-[#6B7280] flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {nextStage.name}
            </span>
          )}
        </div>
      </div>
    )
  }
  
  // Default variant - Card style
  return (
    <Card className={cn(
      'bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#3B4149] transition-colors',
      className
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border',
              tier.bg,
              tier.border,
            )}>
              <Target className={cn('w-5 h-5', tier.text)} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-[#E6E9EF]">{skillName}</h4>
              <p className="text-xs text-[#6B7280]">
                Stage {currentStageIndex + 1} of {stages.length}
              </p>
            </div>
          </div>
          {trend && <TrendIndicator trend={trend} />}
        </div>
        
        {/* Progress Bar */}
        <ProgressBarVisual
          stages={stages}
          currentStageIndex={currentStageIndex}
          progressWithinStage={progressWithinStage}
          tier={tier}
        />
        
        {/* Current / Next Level */}
        <div className="flex items-start justify-between pt-1">
          <div>
            <p className="text-xs text-[#6B7280] mb-0.5">Current Level</p>
            <p className={cn('text-sm font-semibold', tier.text)}>{currentStage.name}</p>
          </div>
          {nextStage && (
            <div className="text-right">
              <p className="text-xs text-[#6B7280] mb-0.5">Next Milestone</p>
              <div className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                <p className="text-sm font-medium text-[#A4ACB8]">{nextStage.name}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Focus Note or Sessions */}
        {(focusNote || sessionsThisMonth !== undefined) && (
          <div className="pt-3 border-t border-[#2B313A]/50">
            {focusNote ? (
              <div className="flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[#A4ACB8]">{focusNote}</p>
              </div>
            ) : sessionsThisMonth !== undefined ? (
              <p className="text-xs text-[#6B7280]">
                {sessionsThisMonth} session{sessionsThisMonth !== 1 ? 's' : ''} this month
              </p>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  )
}

// =============================================================================
// EXPANDED VARIANT - For detail views
// =============================================================================

interface SkillProgressExpandedProps extends SkillProgressBarProps {
  description?: string
  holdTime?: string
  targetHoldTime?: string
}

export function SkillProgressExpanded({
  skillName,
  stages,
  currentStageIndex,
  progressWithinStage = 50,
  trend,
  focusNote,
  description,
  holdTime,
  targetHoldTime,
  className,
}: SkillProgressExpandedProps) {
  const [isHovered, setIsHovered] = useState(false)
  const currentStage = stages[currentStageIndex]
  const nextStage = stages[currentStageIndex + 1]
  const tier = getProgressTier(currentStageIndex, stages.length)
  
  return (
    <Card 
      className={cn(
        'bg-[#1A1F26] border-[#2B313A] overflow-hidden transition-all duration-300',
        isHovered && 'border-[#3B4149] shadow-lg',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top accent bar */}
      <div className={cn(
        'h-1 w-full bg-gradient-to-r transition-all duration-300',
        tier.gradient,
        isHovered && 'h-1.5',
      )} />
      
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center border transition-transform duration-300',
              tier.bg,
              tier.border,
              isHovered && 'scale-105',
            )}>
              <Target className={cn('w-6 h-6', tier.text)} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#E6E9EF]">{skillName}</h3>
              {description && (
                <p className="text-sm text-[#6B7280] mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {trend && <TrendIndicator trend={trend} />}
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
            <span>Progression</span>
            <span>Stage {currentStageIndex + 1} / {stages.length}</span>
          </div>
          <ProgressBarVisual
            stages={stages}
            currentStageIndex={currentStageIndex}
            progressWithinStage={progressWithinStage}
            tier={tier}
          />
        </div>
        
        {/* Current / Next with hold times */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn('p-3 rounded-lg border', tier.bg, tier.border)}>
            <p className="text-xs text-[#6B7280] mb-1">Current Level</p>
            <p className={cn('text-sm font-bold', tier.text)}>{currentStage.name}</p>
            {holdTime && (
              <p className="text-xs text-[#A4ACB8] mt-1">Hold: {holdTime}</p>
            )}
          </div>
          {nextStage ? (
            <div className="p-3 rounded-lg bg-[#0F1115] border border-[#2B313A]/50">
              <p className="text-xs text-[#6B7280] mb-1">Next Milestone</p>
              <p className="text-sm font-semibold text-[#A4ACB8]">{nextStage.name}</p>
              {targetHoldTime && (
                <p className="text-xs text-[#6B7280] mt-1">Target: {targetHoldTime}</p>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
              <p className="text-xs text-emerald-400/80 mb-1">Status</p>
              <p className="text-sm font-bold text-emerald-400">Skill Mastered</p>
            </div>
          )}
        </div>
        
        {/* Focus Note */}
        {focusNote && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-amber-400 font-medium mb-0.5">Focus Area</p>
              <p className="text-sm text-[#A4ACB8]">{focusNote}</p>
            </div>
          </div>
        )}
        
        {/* Stage progression overview */}
        <div className="pt-3 border-t border-[#2B313A]/50">
          <p className="text-xs text-[#6B7280] mb-2">All Stages</p>
          <div className="flex flex-wrap gap-1.5">
            {stages.map((stage, index) => (
              <span
                key={index}
                className={cn(
                  'px-2 py-1 rounded text-xs transition-all',
                  index < currentStageIndex && 'bg-[#2B313A]/50 text-[#6B7280] line-through',
                  index === currentStageIndex && cn(tier.bg, tier.text, 'font-medium'),
                  index > currentStageIndex && 'bg-[#0F1115] text-[#6B7280] border border-[#2B313A]/50',
                )}
              >
                {stage.shortName || stage.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// MULTI-SKILL PROGRESS SECTION
// =============================================================================

interface MultiSkillProgressProps {
  skills: Array<{
    skillName: string
    stages: SkillStage[]
    currentStageIndex: number
    progressWithinStage?: number
    trend?: 'improving' | 'stable' | 'needs_focus'
    focusNote?: string
    sessionsThisMonth?: number
  }>
  title?: string
  className?: string
}

export function MultiSkillProgress({ 
  skills, 
  title = 'Skill Progress',
  className,
}: MultiSkillProgressProps) {
  if (skills.length === 0) {
    return null
  }
  
  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-[#A4ACB8]">{title}</h3>
          <div className="flex-1 h-px bg-[#2B313A]/50" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {skills.map((skill, index) => (
          <SkillProgressBar
            key={skill.skillName}
            {...skill}
          />
        ))}
      </div>
    </div>
  )
}
