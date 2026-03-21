'use client'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { 
  type ChallengeWithProgress,
} from '@/lib/challenges/challenge-engine'
import { getPeriodDisplayName, CHALLENGE_CATEGORY_LABELS, type ChallengeCategory } from '@/lib/challenges/challenge-definitions'
import { Flame, Trophy, Target, Zap, Dumbbell, Star, Clock, CheckCircle2, Medal, Crown } from 'lucide-react'

// =============================================================================
// ICON MAPPING
// =============================================================================

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  trophy: Trophy,
  target: Target,
  zap: Zap,
  lightning: Zap,
  dumbbell: Dumbbell,
  star: Star,
  clock: Clock,
  medal: Medal,
  crown: Crown,
}

// =============================================================================
// CHALLENGE CARD
// =============================================================================

interface ChallengeCardProps {
  challenge: ChallengeWithProgress
  className?: string
  compact?: boolean
}

export function ChallengeCard({ challenge, className, compact = false }: ChallengeCardProps) {
  const Icon = iconMap[challenge.icon || 'target'] || Target
  const isCompleted = challenge.isCompleted || challenge.completed
  
  // Format time remaining
  const formatTimeRemaining = () => {
    if (!challenge.timeRemaining) {
      // For lifetime challenges (skill/strength), show no expiry
      if (challenge.category === 'skill' || challenge.category === 'strength') {
        return 'Lifetime'
      }
      return 'Active'
    }
    const { days, hours, minutes, expired } = challenge.timeRemaining
    if (expired) return 'Expired'
    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }
  
  // Get category label
  const getCategoryLabel = () => {
    if (challenge.category === 'skill') return 'Skill Challenge'
    if (challenge.category === 'strength') return 'Strength Challenge'
    if (challenge.category === 'time') return 'Timed Challenge'
    if (challenge.category === 'seasonal') return 'Seasonal Challenge'
    return `${challenge.period.charAt(0).toUpperCase() + challenge.period.slice(1)} Challenge`
  }
  
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all duration-200',
        isCompleted
          ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30'
          : 'bg-[#1A1D23] border-[#2A2F38] hover:border-[#3A3F48]',
        className
      )}
    >
      {/* Completed overlay glow */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5" />
      )}
      
      <div className={cn('relative', compact ? 'p-3' : 'p-4')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className={cn(
                'flex items-center justify-center rounded-lg',
                compact ? 'w-8 h-8' : 'w-10 h-10',
                isCompleted
                  ? 'bg-amber-500/20'
                  : 'bg-[#2A2F38]'
              )}
            >
              <Icon
                className={cn(
                  compact ? 'w-4 h-4' : 'w-5 h-5',
                  isCompleted ? 'text-amber-400' : 'text-[#9CA3AF]'
                )}
              />
            </div>
            
            {/* Title & Period */}
            <div>
              <h3 className={cn(
                'font-semibold text-[#E6E9EF]',
                compact ? 'text-sm' : 'text-base'
              )}>
                {challenge.name}
              </h3>
              <span className="text-xs text-[#6B7280]">
                {getCategoryLabel()}
                {challenge.tier && challenge.maxTier && (
                  <span className="ml-1 text-amber-400/70">
                    Tier {challenge.tier}/{challenge.maxTier}
                  </span>
                )}
              </span>
            </div>
          </div>
          
          {/* Status/Timer */}
          {/* [baseline-earned-truth] ISSUE E: Show completion source label */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isCompleted ? (
              <span className={cn(
                "flex items-center gap-1 text-xs font-medium",
                challenge.completionSource === 'baseline_satisfied' 
                  ? "text-[#6B7280]" 
                  : "text-amber-400"
              )}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {challenge.completionSource === 'baseline_satisfied' 
                  ? "Baseline met" 
                  : "Earned"}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                <Clock className="w-3 h-3" />
                {formatTimeRemaining()}
              </span>
            )}
          </div>
        </div>
        
        {/* Description */}
        {!compact && (
          <p className="text-sm text-[#9CA3AF] mb-3">
            {challenge.description}
          </p>
        )}
        
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9CA3AF]">
              {challenge.currentValue} / {challenge.goalValue}
            </span>
            <span className={cn(
              'font-medium',
              isCompleted ? 'text-amber-400' : 'text-[#E6E9EF]'
            )}>
              {challenge.progressPercent}%
            </span>
          </div>
          <Progress
            value={challenge.progressPercent}
            className={cn(
              'h-2',
              isCompleted ? '[&>div]:bg-amber-500' : ''
            )}
          />
        </div>
        
        {/* Reward Badge */}
        {!compact && challenge.reward && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A2F38]">
            <span className="text-xs text-[#6B7280]">Reward</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9CA3AF]">
                {challenge.reward.label || challenge.reward.type}
              </span>
              {challenge.reward.type === 'score_boost' && (
                <span className="text-xs font-medium text-amber-400">
                  +{challenge.reward.value} pts
                </span>
              )}
              {challenge.reward.type === 'badge' && (
                <span className="text-xs font-medium text-amber-400">
                  Badge
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// CHALLENGE GRID
// =============================================================================

interface ChallengeGridProps {
  challenges: ChallengeWithProgress[]
  className?: string
  compact?: boolean
}

export function ChallengeGrid({ challenges, className, compact = false }: ChallengeGridProps) {
  if (challenges.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-8 text-center',
        className
      )}>
        <div className="w-12 h-12 rounded-full bg-[#2A2F38] flex items-center justify-center mb-3">
          <Trophy className="w-6 h-6 text-[#6B7280]" />
        </div>
        <p className="text-sm text-[#9CA3AF]">
          No active challenges right now
        </p>
        <p className="text-xs text-[#6B7280] mt-1">
          Check back soon for new challenges
        </p>
      </div>
    )
  }
  
  return (
    <div className={cn(
      'grid gap-3',
      compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2',
      className
    )}>
      {challenges.map(challenge => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          compact={compact}
        />
      ))}
    </div>
  )
}

// =============================================================================
// MINI CHALLENGE PREVIEW
// =============================================================================

interface ChallengePreviewProps {
  challenges: ChallengeWithProgress[]
  maxShow?: number
  className?: string
}

export function ChallengePreview({ challenges, maxShow = 2, className }: ChallengePreviewProps) {
  const displayed = challenges.slice(0, maxShow)
  const remaining = challenges.length - maxShow
  
  return (
    <div className={cn('space-y-2', className)}>
      {displayed.map(challenge => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          compact
        />
      ))}
      
      {remaining > 0 && (
        <p className="text-xs text-center text-[#6B7280]">
          +{remaining} more challenge{remaining > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
