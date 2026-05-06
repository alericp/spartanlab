'use client'

import { cn } from '@/lib/utils'
import { 
  type Achievement,
  type AchievementDefinition,
  type AchievementTier,
  getTierColors 
} from '@/lib/achievements/achievement-definitions'
import { Trophy, Flame, Target, Zap, Star, Medal, Crown, Dumbbell, Lock, Swords } from 'lucide-react'

// =============================================================================
// ICON MAP
// =============================================================================
// [PRE-AB6 BUILD GREEN GATE / ACHIEVEMENT ICON CONTRACT]
// Mirrors the authoritative Achievement icon union in
// lib/achievements/achievement-definitions.ts. Even though this
// component falls back to `|| Trophy` at runtime, TypeScript
// still rejects ICON_MAP[achievement.icon] when the indexed key
// is not present on the `as const` map. 'swords' is added to
// satisfy the indexed-access check for sibling parity with
// AchievementBadge.tsx.
const ICON_MAP = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  zap: Zap,
  lightning: Zap,
  star: Star,
  medal: Medal,
  crown: Crown,
  dumbbell: Dumbbell,
  swords: Swords,
} as const

// =============================================================================
// TIER BADGE COLORS
// =============================================================================

const TIER_STYLES: Record<AchievementTier, { 
  gradient: string
  glow: string
  icon: string
  ring: string
}> = {
  bronze: {
    gradient: 'from-amber-700 to-amber-900',
    glow: 'shadow-amber-900/30',
    icon: 'text-amber-300',
    ring: 'ring-amber-700/50',
  },
  silver: {
    gradient: 'from-slate-400 to-slate-600',
    glow: 'shadow-slate-500/30',
    icon: 'text-slate-100',
    ring: 'ring-slate-400/50',
  },
  gold: {
    gradient: 'from-yellow-400 to-amber-500',
    glow: 'shadow-yellow-500/40',
    icon: 'text-yellow-100',
    ring: 'ring-yellow-400/50',
  },
  elite: {
    gradient: 'from-purple-500 to-purple-700',
    glow: 'shadow-purple-500/40',
    icon: 'text-purple-100',
    ring: 'ring-purple-500/50',
  },
}

// =============================================================================
// ACHIEVEMENT BADGE COMPONENT
// =============================================================================

interface AchievementBadgeProps {
  achievement: AchievementDefinition
  unlocked?: boolean
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  showDescription?: boolean
  className?: string
}

export function AchievementBadge({
  achievement,
  unlocked = false,
  size = 'md',
  showName = false,
  showDescription = false,
  className,
}: AchievementBadgeProps) {
  const Icon = ICON_MAP[achievement.icon] || Trophy
  const tierStyle = TIER_STYLES[achievement.tier]
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }
  
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Badge Circle */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center ring-2 transition-all',
          sizeClasses[size],
          unlocked
            ? `bg-gradient-to-br ${tierStyle.gradient} ${tierStyle.glow} shadow-lg ${tierStyle.ring}`
            : 'bg-[#1A1D23] ring-[#2A2F38] opacity-50'
        )}
      >
        {unlocked ? (
          <Icon className={cn(iconSizes[size], tierStyle.icon)} />
        ) : (
          <Lock className={cn(iconSizes[size], 'text-[#4B5563]')} />
        )}
        
        {/* Shine effect for unlocked */}
        {unlocked && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
        )}
      </div>
      
      {/* Text */}
      {(showName || showDescription) && (
        <div className="flex-1 min-w-0">
          {showName && (
            <p className={cn(
              'font-medium truncate',
              unlocked ? 'text-[#E6E9EF]' : 'text-[#6B7280]'
            )}>
              {achievement.name}
            </p>
          )}
          {showDescription && (
            <p className={cn(
              'text-sm truncate',
              unlocked ? 'text-[#9CA3AF]' : 'text-[#4B5563]'
            )}>
              {achievement.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ACHIEVEMENT CARD - DETAILED VIEW
// =============================================================================

interface AchievementCardProps {
  achievement: AchievementDefinition
  unlocked?: boolean
  unlockedAt?: string
  currentValue?: number
  progressPercent?: number
  className?: string
}

export function AchievementCard({
  achievement,
  unlocked = false,
  unlockedAt,
  currentValue = 0,
  progressPercent = 0,
  className,
}: AchievementCardProps) {
  const tierColors = getTierColors(achievement.tier)
  
  return (
    <div
      className={cn(
        'relative rounded-xl p-4 border transition-all',
        unlocked
          ? `${tierColors.bg} ${tierColors.border}`
          : 'bg-[#1A1D23] border-[#2A2F38]',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <AchievementBadge 
          achievement={achievement} 
          unlocked={unlocked} 
          size="lg"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              'font-semibold',
              unlocked ? 'text-[#E6E9EF]' : 'text-[#6B7280]'
            )}>
              {achievement.name}
            </h3>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full capitalize',
              tierColors.bg,
              tierColors.text,
              tierColors.border,
              'border'
            )}>
              {achievement.tier}
            </span>
          </div>
          
          <p className={cn(
            'text-sm mb-2',
            unlocked ? 'text-[#9CA3AF]' : 'text-[#4B5563]'
          )}>
            {achievement.description}
          </p>
          
          {/* Progress bar for locked achievements */}
          {!unlocked && progressPercent > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-[#2A2F38] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Unlock date for unlocked achievements */}
          {unlocked && unlockedAt && (
            <p className="text-xs text-[#6B7280] mt-2">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        
        {/* Points */}
        <div className={cn(
          'text-right shrink-0',
          unlocked ? 'text-[#E6E9EF]' : 'text-[#4B5563]'
        )}>
          <span className="text-lg font-bold">{achievement.pointValue}</span>
          <span className="text-xs block text-[#6B7280]">pts</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MINI BADGE ROW - FOR DASHBOARD
// =============================================================================

interface MiniBadgeRowProps {
  achievements: { achievement: AchievementDefinition; unlocked: boolean }[]
  maxVisible?: number
  className?: string
}

export function MiniBadgeRow({
  achievements,
  maxVisible = 5,
  className,
}: MiniBadgeRowProps) {
  const visible = achievements.slice(0, maxVisible)
  const remaining = achievements.length - maxVisible
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {visible.map(({ achievement, unlocked }) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          unlocked={unlocked}
          size="sm"
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-[#6B7280] ml-1">+{remaining}</span>
      )}
    </div>
  )
}
