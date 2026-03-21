'use client'

import { useState, useEffect } from 'react'
import { Flame, Target, Trophy, Star, Dumbbell, Zap, Medal, Crown, Clock, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { 
  type Challenge, 
  type ChallengeProgress,
  getChallengeTimeRemaining,
  CHALLENGE_CATEGORY_LABELS,
  GOAL_TYPE_LABELS,
  getCompletionPolicy,
} from '@/lib/challenges/challenge-definitions'
import { Info } from 'lucide-react'

// Icon mapping
const CHALLENGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  target: Target,
  trophy: Trophy,
  star: Star,
  dumbbell: Dumbbell,
  lightning: Zap,
  zap: Zap,
  medal: Medal,
  crown: Crown,
  clock: Clock,
}

// Category colors
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  weekly: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
  },
  monthly: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-400',
  },
  seasonal: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400',
  },
  special: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400',
  },
  skill: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-400',
  },
  strength: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400',
  },
  time: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-400',
  },
  h2h: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    text: 'text-pink-400',
    badge: 'bg-pink-500/20 text-pink-400',
  },
}

interface ChallengeCardProps {
  challenge: Challenge
  progress: ChallengeProgress
  percentComplete: number
  compact?: boolean
}

export function ChallengeCard({ challenge, progress, percentComplete, compact = false }: ChallengeCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(getChallengeTimeRemaining(challenge))
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getChallengeTimeRemaining(challenge))
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [challenge])
  
  const Icon = CHALLENGE_ICONS[challenge.icon] || Target
  const colors = CATEGORY_COLORS[challenge.category] || CATEGORY_COLORS.weekly
  const isComplete = progress.completed
  
  // [baseline-earned-truth] ISSUE F: Check if progress is from baseline vs earned
  const progressSource = progress.progressSource
  const isBaselineOnly = progressSource === 'baseline'
  const policy = getCompletionPolicy(challenge)
  
  // [baseline-earned-truth] TASK 6: Determine completion label based on source
  const getCompletionLabel = () => {
    if (!isComplete) return null
    if (isBaselineOnly && policy === 'baseline_recognized') {
      return 'Recognized'
    }
    return 'Complete'
  }
  const completionLabel = getCompletionLabel()
  
  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${isComplete ? 'bg-emerald-500/10 border-emerald-500/20' : `${colors.bg} ${colors.border}`}`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isComplete ? 'bg-emerald-500/20' : colors.bg}`}>
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Icon className={`w-4 h-4 ${colors.text}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm font-medium truncate ${isComplete ? 'text-emerald-400' : 'text-[#E6E9EF]'}`}>
                {challenge.name}
              </span>
              <span className="text-xs text-[#6B7280] whitespace-nowrap">
                {/* [baseline-earned-truth] TASK 6: Show appropriate status */}
                {isComplete ? (completionLabel || 'Complete') : `${progress.currentValue}/${challenge.goalValue}`}
              </span>
            </div>
            <Progress 
              value={percentComplete} 
              className="h-1.5 mt-1.5 bg-[#1A1F26]"
            />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`p-4 rounded-xl border ${isComplete ? 'bg-emerald-500/10 border-emerald-500/20' : `${colors.bg} ${colors.border}`}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isComplete ? 'bg-emerald-500/20' : colors.bg}`}>
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Icon className={`w-5 h-5 ${colors.text}`} />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${isComplete ? 'text-emerald-400' : 'text-[#E6E9EF]'}`}>
              {challenge.name}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
              {CHALLENGE_CATEGORY_LABELS[challenge.category]}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Tier indicator */}
          {challenge.tier && challenge.maxTier && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#2A2F36] text-[#A4ACB8]">
              T{challenge.tier}/{challenge.maxTier}
            </span>
          )}
          
          {/* Time remaining */}
          {!isComplete && !timeRemaining.expired && (
            <div className="flex items-center gap-1 text-xs text-[#6B7280]">
              <Clock className="w-3 h-3" />
              <span>{timeRemaining.label}</span>
            </div>
          )}
          {/* [baseline-earned-truth] TASK 6: Distinguish completion source */}
          {isComplete && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              {completionLabel || 'Complete'}
            </span>
          )}
        </div>
      </div>
      
      {/* Description */}
      <p className="text-sm text-[#A4ACB8] mb-3">
        {challenge.description}
      </p>
      
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Progress</span>
          <span className={isComplete ? 'text-emerald-400' : 'text-[#E6E9EF]'}>
            {progress.currentValue} / {challenge.goalValue} {GOAL_TYPE_LABELS[challenge.goalType]}
          </span>
        </div>
        <Progress 
          value={percentComplete} 
          className={`h-2 ${isComplete ? 'bg-emerald-500/10' : 'bg-[#1A1F26]'}`}
        />
      </div>
      
      {/* Reward */}
      <div className="mt-3 pt-3 border-t border-[#2A2F36] flex items-center justify-between">
        <span className="text-xs text-[#6B7280]">Reward</span>
        <span className={`text-xs font-medium ${isComplete ? 'text-emerald-400' : colors.text}`}>
          {challenge.reward.label}
        </span>
      </div>
    </div>
  )
}

// Compact list of challenges for dashboard
interface ChallengeListProps {
  challenges: Array<{
    challenge: Challenge
    progress: ChallengeProgress
    percentComplete: number
  }>
  maxDisplay?: number
}

export function ChallengeList({ challenges, maxDisplay = 3 }: ChallengeListProps) {
  const displayChallenges = challenges.slice(0, maxDisplay)
  
  if (displayChallenges.length === 0) {
    return (
      <div className="text-center py-6 text-[#6B7280]">
        <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No active challenges</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {displayChallenges.map(({ challenge, progress, percentComplete }) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          progress={progress}
          percentComplete={percentComplete}
          compact
        />
      ))}
    </div>
  )
}
