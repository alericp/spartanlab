'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Dumbbell,
  ArrowRight,
  Calendar,
  Award,
} from 'lucide-react'
import {
  type TrainingStreak,
  type SkillProgressData,
  type StrengthProgressData,
  type MilestoneNotification,
  getStreakColor,
  getProgressColor,
  getTrendColor,
} from '@/lib/progress-streak-engine'

// =============================================================================
// TRAINING STREAK CARD
// =============================================================================

interface TrainingStreakCardProps {
  streak: TrainingStreak
}

export function TrainingStreakCard({ streak }: TrainingStreakCardProps) {
  const { currentStreak, bestStreak, lastTrainingDate, streakActive, hasData } = streak
  const color = getStreakColor(currentStreak)
  
  if (!hasData) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#A4ACB8] mb-1">Training Streak</h3>
            <p className="text-[#6B7280] text-sm">
              Log workouts to start building your training streak.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <Flame className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#A4ACB8]">Training Streak</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color }}>
                  {currentStreak}
                </span>
                <span className="text-sm text-[#6B7280]">
                  {currentStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className={`px-2 py-1 rounded text-xs ${
            streakActive 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-amber-500/10 text-amber-500'
          }`}>
            {streakActive ? 'Active' : 'At risk'}
          </div>
        </div>
        
        {/* Best streak */}
        <div className="flex items-center gap-3 py-2 px-3 bg-[#0F1115] rounded-lg">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-[#A4ACB8]">Best Streak:</span>
          <span className="text-sm font-semibold text-[#E6E9EF]">{bestStreak} days</span>
        </div>
        
        {/* Last training */}
        {lastTrainingDate && (
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <Calendar className="w-3 h-3" />
            <span>Last training: {formatDate(lastTrainingDate)}</span>
          </div>
        )}
        
        {/* Encouragement */}
        {!streakActive && currentStreak > 0 && (
          <p className="text-xs text-amber-500 border-t border-[#2B313A] pt-3">
            Train today to keep your {currentStreak}-day streak alive!
          </p>
        )}
      </div>
    </Card>
  )
}

// Compact variant
export function TrainingStreakCompact({ streak }: TrainingStreakCardProps) {
  const { currentStreak, bestStreak, streakActive, hasData } = streak
  const color = getStreakColor(currentStreak)

  if (!hasData) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0F1115] border border-[#2B313A]">
        <Flame className="w-4 h-4 text-[#6B7280]" />
        <span className="text-sm text-[#6B7280]">No streak data</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0F1115] border border-[#2B313A]">
      <div className="flex items-center gap-3">
        <Flame className="w-4 h-4" style={{ color }} />
        <div>
          <span className="text-lg font-bold" style={{ color }}>{currentStreak}</span>
          <span className="text-xs text-[#6B7280] ml-1">day streak</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Trophy className="w-3 h-3 text-amber-400" />
        <span>Best: {bestStreak}</span>
      </div>
    </div>
  )
}

// =============================================================================
// SKILL PROGRESS CARD
// =============================================================================

interface SkillProgressCardProps {
  skill: SkillProgressData
  compact?: boolean
}

export function SkillProgressCard({ skill, compact = false }: SkillProgressCardProps) {
  const {
    displayName,
    currentLevel,
    progressPercent,
    nextMilestone,
    trend,
    sessionsThisMonth,
  } = skill
  
  const progressColor = getProgressColor(progressPercent)
  const trendColor = getTrendColor(trend)
  
  const TrendIcon = trend === 'improving' 
    ? TrendingUp 
    : trend === 'needs_focus' 
      ? TrendingDown 
      : Minus

  // Determine progress tier for visual styling
  const getTier = (percent: number) => {
    if (percent >= 85) return { 
      gradient: 'from-violet-500/80 to-violet-400',
      text: 'text-violet-400',
      bg: 'bg-violet-500/10',
      glow: 'shadow-violet-500/30',
    }
    if (percent >= 60) return { 
      gradient: 'from-emerald-500/80 to-emerald-400',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      glow: 'shadow-emerald-500/30',
    }
    if (percent >= 30) return { 
      gradient: 'from-amber-500/80 to-amber-400',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      glow: 'shadow-amber-500/30',
    }
    return { 
      gradient: 'from-[#C1121F]/70 to-[#C1121F]',
      text: 'text-[#C1121F]',
      bg: 'bg-[#C1121F]/10',
      glow: 'shadow-[#C1121F]/30',
    }
  }
  
  const tier = getTier(progressPercent)

  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-[#0F1115] border border-[#2B313A] hover:border-[#3B4149] transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded flex items-center justify-center ${tier.bg}`}>
              <Target className={`w-3 h-3 ${tier.text}`} />
            </div>
            <span className="text-sm font-medium text-[#E6E9EF]">{displayName}</span>
          </div>
          <span className={`text-xs font-semibold ${tier.text}`}>{progressPercent}%</span>
        </div>
        
        {/* Premium progress bar */}
        <div className="relative h-2 rounded-full bg-[#1A1F26] overflow-hidden border border-[#2B313A]/30">
          <div 
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-500 ease-out`}
            style={{ width: `${progressPercent}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-full" />
            {/* Pulse indicator */}
            {progressPercent > 5 && (
              <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse ${tier.glow} shadow-lg`} />
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className={`font-medium ${tier.text}`}>{currentLevel}</span>
          <span className="text-[#6B7280] flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            {nextMilestone}
          </span>
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#3B4149] transition-colors">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tier.bg} border border-[#2B313A]/30`}>
              <Target className={`w-4 h-4 ${tier.text}`} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#E6E9EF]">{displayName}</h4>
              <p className="text-xs text-[#6B7280]">{sessionsThisMonth} sessions this month</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: `${trendColor}15`, color: trendColor }}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-xs font-medium capitalize">{trend.replace('_', ' ')}</span>
          </div>
        </div>
        
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${tier.text}`}>{currentLevel}</span>
            <span className={`font-bold ${tier.text}`}>{progressPercent}%</span>
          </div>
          
          {/* Premium progress bar */}
          <div className="relative h-3 rounded-full bg-[#0F1115] overflow-hidden border border-[#2B313A]/50">
            {/* Subtle track texture */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2B313A]/10 to-transparent" />
            
            <div 
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-700 ease-out`}
              style={{ width: `${progressPercent}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent rounded-full" />
              {/* Animated pulse at the end */}
              {progressPercent > 5 && (
                <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 animate-pulse ${tier.glow} shadow-lg`} />
              )}
            </div>
          </div>
        </div>
        
        {/* Next milestone */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2B313A]/50">
          <span className="text-xs text-[#6B7280]">Next milestone</span>
          <span className="text-xs font-medium text-[#A4ACB8] flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-[#6B7280]" />
            {nextMilestone}
          </span>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// STRENGTH PROGRESS CARD
// =============================================================================

interface StrengthProgressCardProps {
  strength: StrengthProgressData
  compact?: boolean
}

export function StrengthProgressCard({ strength, compact = false }: StrengthProgressCardProps) {
  const {
    displayName,
    previousBest,
    currentBest,
    improvement,
    unit,
    trend,
  } = strength
  
  const trendColor = getTrendColor(trend)
  const TrendIcon = trend === 'improving' 
    ? TrendingUp 
    : trend === 'declining' 
      ? TrendingDown 
      : Minus

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#0F1115] border border-[#2B313A]">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-[#C1121F]" />
          <span className="text-sm text-[#E6E9EF]">{displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#E6E9EF]">
            +{currentBest} {unit}
          </span>
          {improvement !== 0 && (
            <span className={`text-xs ${improvement > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {improvement > 0 ? '+' : ''}{improvement}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#C1121F]" />
            <h4 className="text-sm font-medium text-[#E6E9EF]">{displayName}</h4>
          </div>
          <div className="flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon className="w-3 h-3" />
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-[#0F1115] rounded">
            <p className="text-xs text-[#6B7280] mb-1">Previous</p>
            <p className="text-sm font-medium text-[#A4ACB8]">
              +{previousBest} {unit}
            </p>
          </div>
          <div className="text-center p-2 bg-[#0F1115] rounded">
            <p className="text-xs text-[#6B7280] mb-1">Current</p>
            <p className="text-sm font-semibold text-[#E6E9EF]">
              +{currentBest} {unit}
            </p>
          </div>
          <div className="text-center p-2 bg-[#0F1115] rounded">
            <p className="text-xs text-[#6B7280] mb-1">Progress</p>
            <p className={`text-sm font-semibold ${
              improvement > 0 ? 'text-green-500' : improvement < 0 ? 'text-red-500' : 'text-[#6B7280]'
            }`}>
              {improvement > 0 ? '+' : ''}{improvement} {unit}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// MILESTONE NOTIFICATION
// =============================================================================

interface MilestoneNotificationCardProps {
  milestone: MilestoneNotification
  onDismiss?: () => void
}

export function MilestoneNotificationCard({ milestone, onDismiss }: MilestoneNotificationCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-[#1A1F26] border border-[#C1121F]/30 rounded-lg">
      <div className="w-8 h-8 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
        <Award className="w-4 h-4 text-[#C1121F]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#C1121F] font-medium mb-0.5">Milestone Achieved</p>
        <p className="text-sm font-semibold text-[#E6E9EF]">{milestone.title}</p>
        <p className="text-xs text-[#A4ACB8] mt-1">{milestone.description}</p>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// =============================================================================
// COMBINED PROGRESS SECTION
// =============================================================================

interface ProgressOverviewSectionProps {
  streak: TrainingStreak
  skills: SkillProgressData[]
  strength: StrengthProgressData[]
}

export function ProgressOverviewSection({ streak, skills, strength }: ProgressOverviewSectionProps) {
  // Filter to show only skills/strength with data
  const activeSkills = skills.filter(s => s.progressPercent > 0 || s.sessionsThisMonth > 0)
  const activeStrength = strength.filter(s => s.currentBest > 0)

  return (
    <div className="space-y-4">
      {/* Streak */}
      <TrainingStreakCompact streak={streak} />
      
      {/* Skills */}
      {activeSkills.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider px-1">
            Skill Progress
          </h4>
          <div className="grid gap-2">
            {activeSkills.slice(0, 3).map(skill => (
              <SkillProgressCard key={skill.skillName} skill={skill} compact />
            ))}
          </div>
        </div>
      )}
      
      {/* Strength */}
      {activeStrength.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-[#6B7280] uppercase tracking-wider px-1">
            Strength Progress
          </h4>
          <div className="grid gap-2">
            {activeStrength.slice(0, 3).map(s => (
              <StrengthProgressCard key={s.exerciseName} strength={s} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}
