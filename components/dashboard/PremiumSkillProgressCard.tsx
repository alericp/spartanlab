'use client'

import { Card } from '@/components/ui/card'
import { Target, ArrowRight, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { type SkillProgressData, getProgressColor, getTrendColor } from '@/lib/progress-streak-engine'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

export interface SkillFocusNote {
  skillName: string
  note: string
  type: 'limiter' | 'progress' | 'suggestion'
}

interface PremiumSkillProgressCardProps {
  skill: SkillProgressData
  focusNote?: SkillFocusNote
  variant?: 'default' | 'compact'
}

// =============================================================================
// PREMIUM PROGRESS BAR
// =============================================================================

function PremiumProgressBar({ 
  percent, 
  tier 
}: { 
  percent: number
  tier: { gradient: string; glow: string }
}) {
  return (
    <div className="relative h-2.5 rounded-full bg-[#0F1115] overflow-hidden border border-[#2B313A]/50">
      {/* Track texture */}
      <div className="absolute inset-0 opacity-30" 
        style={{ 
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.03) 4px, rgba(255,255,255,0.03) 8px)' 
        }} 
      />
      
      {/* Fill */}
      <div 
        className={cn(
          "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
          `bg-gradient-to-r ${tier.gradient}`
        )}
        style={{ width: `${percent}%` }}
      >
        {/* Inner shine */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/10 rounded-full" />
        
        {/* Edge glow */}
        {percent > 5 && (
          <div 
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80",
              "shadow-lg animate-pulse",
              tier.glow
            )} 
          />
        )}
      </div>
    </div>
  )
}

// =============================================================================
// TIER STYLING
// =============================================================================

function getProgressTier(percent: number) {
  if (percent >= 85) return { 
    gradient: 'from-violet-500/90 to-violet-400',
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'shadow-violet-500/40',
    label: 'Near Mastery',
  }
  if (percent >= 60) return { 
    gradient: 'from-emerald-500/90 to-emerald-400',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/40',
    label: 'Strong Progress',
  }
  if (percent >= 30) return { 
    gradient: 'from-amber-500/90 to-amber-400',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/40',
    label: 'Building',
  }
  return { 
    gradient: 'from-[#C1121F]/80 to-[#C1121F]',
    text: 'text-[#C1121F]',
    bg: 'bg-[#C1121F]/10',
    border: 'border-[#C1121F]/20',
    glow: 'shadow-[#C1121F]/40',
    label: 'Foundation',
  }
}

// =============================================================================
// PREMIUM SKILL PROGRESS CARD
// =============================================================================

export function PremiumSkillProgressCard({ 
  skill, 
  focusNote,
  variant = 'default' 
}: PremiumSkillProgressCardProps) {
  const {
    displayName,
    currentLevel,
    progressPercent,
    nextMilestone,
    trend,
    sessionsThisMonth,
  } = skill
  
  const tier = getProgressTier(progressPercent)
  const trendColor = getTrendColor(trend)
  
  const TrendIcon = trend === 'improving' 
    ? TrendingUp 
    : trend === 'needs_focus' 
      ? TrendingDown 
      : Minus

  if (variant === 'compact') {
    return (
      <div className={cn(
        "p-4 rounded-xl bg-gradient-to-br from-[#1A1F26] to-[#151920]",
        "border border-[#2B313A] hover:border-[#3B4149]",
        "transition-all duration-300 group"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              tier.bg, tier.border, "border"
            )}>
              <Target className={cn("w-3.5 h-3.5", tier.text)} />
            </div>
            <span className="text-sm font-semibold text-[#E6E9EF]">{displayName}</span>
          </div>
          <span className={cn("text-sm font-bold", tier.text)}>
            {progressPercent}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <PremiumProgressBar percent={progressPercent} tier={tier} />
        
        {/* Stage Info */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-xs font-medium", tier.text)}>{currentLevel}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#6B7280]">
            <ArrowRight className="w-3 h-3" />
            <span>{nextMilestone}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      "bg-gradient-to-br from-[#1A1F26] to-[#151920]",
      "border-[#2B313A] hover:border-[#3B4149]",
      "p-5 transition-all duration-300 group overflow-hidden relative"
    )}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              tier.bg, tier.border, "border",
              "group-hover:scale-105 transition-transform duration-300"
            )}>
              <Target className={cn("w-5 h-5", tier.text)} />
            </div>
            <div>
              <h4 className="text-base font-semibold text-[#E6E9EF]">{displayName}</h4>
              <p className="text-xs text-[#6B7280]">{sessionsThisMonth} sessions this month</p>
            </div>
          </div>
          
          {/* Trend Badge */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${trendColor}15`, color: trendColor }}
          >
            <TrendIcon className="w-3 h-3" />
            <span className="capitalize">{trend === 'needs_focus' ? 'Focus' : trend}</span>
          </div>
        </div>
        
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B7280] uppercase tracking-wider">Progress</span>
            <span className={cn("text-sm font-bold", tier.text)}>{progressPercent}%</span>
          </div>
          
          <PremiumProgressBar percent={progressPercent} tier={tier} />
        </div>
        
        {/* Current Stage & Next Milestone */}
        <div className="flex items-center justify-between py-3 px-3.5 rounded-lg bg-[#0F1115]/60 border border-[#2B313A]/30">
          <div>
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-0.5">Current</p>
            <p className={cn("text-sm font-medium", tier.text)}>{currentLevel}</p>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-[#4B5563]" />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-0.5">Next</p>
            <p className="text-sm font-medium text-[#A4ACB8]">{nextMilestone}</p>
          </div>
        </div>
        
        {/* Focus Note (if provided) */}
        {focusNote && (
          <div className={cn(
            "flex items-start gap-2 py-2.5 px-3 rounded-lg",
            focusNote.type === 'limiter' ? 'bg-amber-500/5 border border-amber-500/10' :
            focusNote.type === 'progress' ? 'bg-emerald-500/5 border border-emerald-500/10' :
            'bg-[#4F6D8A]/5 border border-[#4F6D8A]/10'
          )}>
            <Info className={cn(
              "w-3.5 h-3.5 mt-0.5 flex-shrink-0",
              focusNote.type === 'limiter' ? 'text-amber-400/70' :
              focusNote.type === 'progress' ? 'text-emerald-400/70' :
              'text-[#4F6D8A]/70'
            )} />
            <p className="text-xs text-[#A4ACB8] leading-relaxed">{focusNote.note}</p>
          </div>
        )}
      </div>
    </Card>
  )
}

// =============================================================================
// OVERALL GOAL SUMMARY CARD
// =============================================================================

export interface GoalCategorySummary {
  category: 'skill' | 'strength' | 'flexibility' | 'endurance'
  label: string
  progressPercent: number
  activeSkillsCount: number
  totalMilestones: number
  completedMilestones: number
}

interface OverallGoalSummaryCardProps {
  categories: GoalCategorySummary[]
}

export function OverallGoalSummaryCard({ categories }: OverallGoalSummaryCardProps) {
  if (categories.length === 0) return null
  
  const getCategoryColor = (category: GoalCategorySummary['category']) => {
    switch (category) {
      case 'skill': return { 
        text: 'text-violet-400', 
        bg: 'bg-violet-500/10',
        gradient: 'from-violet-500/70 to-violet-400',
      }
      case 'strength': return { 
        text: 'text-[#C1121F]', 
        bg: 'bg-[#C1121F]/10',
        gradient: 'from-[#C1121F]/70 to-[#C1121F]',
      }
      case 'flexibility': return { 
        text: 'text-cyan-400', 
        bg: 'bg-cyan-500/10',
        gradient: 'from-cyan-500/70 to-cyan-400',
      }
      case 'endurance': return { 
        text: 'text-emerald-400', 
        bg: 'bg-emerald-500/10',
        gradient: 'from-emerald-500/70 to-emerald-400',
      }
    }
  }

  return (
    <div className="p-4 rounded-xl bg-[#1A1F26]/50 border border-[#2B313A]/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-[#4F6D8A]/10 flex items-center justify-center">
          <Target className="w-3.5 h-3.5 text-[#4F6D8A]" />
        </div>
        <h4 className="text-sm font-medium text-[#A4ACB8]">Goal Progress Overview</h4>
      </div>
      
      <div className="space-y-3">
        {categories.map(cat => {
          const colors = getCategoryColor(cat.category)
          return (
            <div key={cat.category} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#E6E9EF]">{cat.label}</span>
                <span className={cn("text-xs font-medium", colors.text)}>
                  {cat.progressPercent}%
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-[#0F1115] overflow-hidden">
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    `bg-gradient-to-r ${colors.gradient}`
                  )}
                  style={{ width: `${cat.progressPercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// SKILL PROGRESS SECTION (Container Component)
// =============================================================================

interface SkillProgressSectionProps {
  skills: SkillProgressData[]
  focusNotes?: SkillFocusNote[]
  goalSummaries?: GoalCategorySummary[]
  maxDisplay?: number
}

export function SkillProgressSection({ 
  skills, 
  focusNotes = [],
  goalSummaries = [],
  maxDisplay = 4 
}: SkillProgressSectionProps) {
  const activeSkills = skills.filter(s => s.progressPercent > 0 || s.sessionsThisMonth > 0)
  
  if (activeSkills.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-[#1A1F26]/50 border border-[#2B313A]/50 text-center">
        <Target className="w-8 h-8 text-[#4F6D8A] mx-auto mb-3" />
        <p className="text-sm text-[#A4ACB8] mb-1">No active skill progress yet</p>
        <p className="text-xs text-[#6B7280]">Start training skills to see your progress here</p>
      </div>
    )
  }
  
  const displaySkills = activeSkills.slice(0, maxDisplay)
  
  // Helper to find focus note for a skill
  const getFocusNote = (skillName: string) => {
    return focusNotes.find(n => n.skillName.toLowerCase() === skillName.toLowerCase())
  }

  return (
    <div className="space-y-4">
      {/* Skill Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {displaySkills.map(skill => (
          <PremiumSkillProgressCard 
            key={skill.skillName} 
            skill={skill}
            focusNote={getFocusNote(skill.skillName)}
          />
        ))}
      </div>
      
      {/* Overall Goal Summary (Secondary) */}
      {goalSummaries.length > 0 && (
        <OverallGoalSummaryCard categories={goalSummaries} />
      )}
    </div>
  )
}
