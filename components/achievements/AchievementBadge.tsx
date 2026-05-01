'use client'

import { Trophy, Medal, Star, Flame, Target, Dumbbell, Crown, Zap, Lock, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  type Achievement, 
  type AchievementTier, 
  TIER_COLORS 
} from '@/lib/achievements/achievement-definitions'

// [PRE-AB6 BUILD GREEN GATE / ACHIEVEMENT ICON CONTRACT]
// Achievement.icon (lib/achievements/achievement-definitions.ts:15)
// declares the canonical icon union, including 'swords'. ICON_MAP
// must cover every member of that union because the component
// indexes it directly via ICON_MAP[achievement.icon] with no
// guarded fallback. Adding 'swords: Swords' aligns the map with
// the authoritative union without weakening the source type.
const ICON_MAP = {
  trophy: Trophy,
  medal: Medal,
  star: Star,
  flame: Flame,
  target: Target,
  dumbbell: Dumbbell,
  crown: Crown,
  lightning: Zap,
  swords: Swords,
} as const

interface AchievementBadgeProps {
  achievement: Achievement
  unlocked?: boolean
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  showDescription?: boolean
  className?: string
}

export function AchievementBadge({
  achievement,
  unlocked = true,
  size = 'md',
  showName = true,
  showDescription = false,
  className,
}: AchievementBadgeProps) {
  const tierColors = TIER_COLORS[achievement.tier]
  const IconComponent = ICON_MAP[achievement.icon]
  
  const sizeClasses = {
    sm: {
      container: 'w-10 h-10',
      icon: 'w-4 h-4',
      text: 'text-xs',
      desc: 'text-[10px]',
    },
    md: {
      container: 'w-14 h-14',
      icon: 'w-6 h-6',
      text: 'text-sm',
      desc: 'text-xs',
    },
    lg: {
      container: 'w-20 h-20',
      icon: 'w-8 h-8',
      text: 'text-base',
      desc: 'text-sm',
    },
  }
  
  const sizes = sizeClasses[size]
  
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {/* Badge circle */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center border-2 transition-all',
          sizes.container,
          unlocked ? [
            tierColors.bg,
            tierColors.border,
            'shadow-lg',
            tierColors.glow,
          ] : [
            'bg-[#1A1F26]',
            'border-[#2B313A]',
            'opacity-50',
          ]
        )}
      >
        {unlocked ? (
          <IconComponent className={cn(sizes.icon, tierColors.text)} />
        ) : (
          <Lock className={cn(sizes.icon, 'text-[#4A5568]')} />
        )}
        
        {/* Tier indicator dot */}
        {unlocked && achievement.tier === 'elite' && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-500 border border-[#0F1115]" />
        )}
        {unlocked && achievement.tier === 'gold' && (
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#0F1115]" />
        )}
      </div>
      
      {/* Name */}
      {showName && (
        <span className={cn(
          'font-medium text-center leading-tight max-w-20',
          sizes.text,
          unlocked ? 'text-[#E6E9EF]' : 'text-[#4A5568]'
        )}>
          {achievement.name}
        </span>
      )}
      
      {/* Description */}
      {showDescription && (
        <span className={cn(
          'text-center leading-tight max-w-24',
          sizes.desc,
          'text-[#6B7280]'
        )}>
          {achievement.description}
        </span>
      )}
    </div>
  )
}

// Compact inline badge for lists
interface AchievementBadgeInlineProps {
  achievement: Achievement
  unlocked?: boolean
  unlockedAt?: string
  className?: string
}

export function AchievementBadgeInline({
  achievement,
  unlocked = true,
  unlockedAt,
  className,
}: AchievementBadgeInlineProps) {
  const tierColors = TIER_COLORS[achievement.tier]
  const IconComponent = ICON_MAP[achievement.icon]
  
  const formattedDate = unlockedAt 
    ? new Date(unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-all',
      unlocked ? [
        'bg-[#1A1F26]',
        'border-[#2B313A]',
      ] : [
        'bg-[#0F1115]',
        'border-[#1A1F26]',
        'opacity-60',
      ],
      className
    )}>
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center border',
        unlocked ? [tierColors.bg, tierColors.border] : 'bg-[#1A1F26] border-[#2B313A]'
      )}>
        {unlocked ? (
          <IconComponent className={cn('w-5 h-5', tierColors.text)} />
        ) : (
          <Lock className="w-5 h-5 text-[#4A5568]" />
        )}
      </div>
      
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium truncate',
            unlocked ? 'text-[#E6E9EF]' : 'text-[#6B7280]'
          )}>
            {achievement.name}
          </span>
          <span className={cn(
            'text-[10px] uppercase px-1.5 py-0.5 rounded font-medium',
            tierColors.bg,
            tierColors.text
          )}>
            {achievement.tier}
          </span>
        </div>
        <p className="text-xs text-[#6B7280] truncate">
          {achievement.description}
        </p>
      </div>
      
      {/* Date */}
      {unlocked && formattedDate && (
        <span className="text-xs text-[#4A5568] shrink-0">
          {formattedDate}
        </span>
      )}
    </div>
  )
}
