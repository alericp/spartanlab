'use client'

import { Trophy, Medal, Crown, Flame, Target, Dumbbell, Star, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type LeaderboardEntry, type LeaderboardMetadata } from '@/lib/leaderboards/leaderboard-types'

// Icon mapping for leaderboard categories
const ICON_MAP = {
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  flame: Flame,
  target: Target,
  dumbbell: Dumbbell,
  star: Star,
} as const

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  metadata: LeaderboardMetadata
  userPosition?: LeaderboardEntry | null
  showUserPosition?: boolean
  compact?: boolean
  className?: string
}

// Rank badge component
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
        <Crown className="w-4 h-4 text-white" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-400/20">
        <span className="text-sm font-bold text-slate-700">2</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-700/20">
        <span className="text-sm font-bold text-amber-100">3</span>
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#1F242B] border border-[#2B313A] flex items-center justify-center">
      <span className="text-sm font-medium text-[#6B7280]">{rank}</span>
    </div>
  )
}

// Subscription badge
function SubscriptionBadge({ tier }: { tier?: 'free' | 'pro' | 'elite' }) {
  if (tier === 'pro' || tier === 'elite') {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
        PRO
      </span>
    )
  }
  return null
}

export function LeaderboardTable({
  entries,
  metadata,
  userPosition,
  showUserPosition = true,
  compact = false,
  className,
}: LeaderboardTableProps) {
  const showUserSeparately = showUserPosition && userPosition && !entries.some(e => e.isCurrentUser)
  
  return (
    <div className={cn('space-y-1', className)}>
      {/* Header */}
      <div className={cn(
        'grid items-center px-3 py-2 text-xs font-medium text-[#6B7280] uppercase tracking-wider',
        compact ? 'grid-cols-[40px_1fr_80px]' : 'grid-cols-[48px_1fr_100px_60px]'
      )}>
        <span>Rank</span>
        <span>Athlete</span>
        <span className="text-right">{metadata.scoreUnit === 'pts' ? 'Score' : metadata.title}</span>
        {!compact && <span className="text-right">Medals</span>}
      </div>
      
      {/* Entries */}
      <div className="space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className={cn(
              'grid items-center px-3 py-2.5 rounded-lg transition-colors',
              compact ? 'grid-cols-[40px_1fr_80px]' : 'grid-cols-[48px_1fr_100px_60px]',
              entry.isCurrentUser 
                ? 'bg-[#C1121F]/10 border border-[#C1121F]/30' 
                : 'bg-[#1A1F26] hover:bg-[#1F242B]'
            )}
          >
            {/* Rank */}
            <div className="flex items-center justify-center">
              <RankBadge rank={entry.rank} />
            </div>
            
            {/* User info */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Avatar placeholder */}
              <div className={cn(
                'shrink-0 rounded-full bg-[#2B313A] flex items-center justify-center',
                compact ? 'w-7 h-7' : 'w-8 h-8'
              )}>
                <User className={cn('text-[#6B7280]', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'font-medium truncate',
                    entry.isCurrentUser ? 'text-[#C1121F]' : 'text-[#E6E9EF]',
                    compact ? 'text-sm' : 'text-base'
                  )}>
                    {entry.displayName}
                    {entry.isCurrentUser && ' (You)'}
                  </span>
                  <SubscriptionBadge tier={entry.subscriptionTier} />
                </div>
                {entry.level && !compact && (
                  <span className="text-xs text-[#6B7280]">{entry.level}</span>
                )}
              </div>
            </div>
            
            {/* Score */}
            <div className="text-right">
              <span className={cn(
                'font-semibold',
                entry.isCurrentUser ? 'text-[#C1121F]' : 'text-[#E6E9EF]',
                compact ? 'text-sm' : 'text-base'
              )}>
                {entry.scoreLabel}
              </span>
            </div>
            
            {/* Achievement count */}
            {!compact && (
              <div className="flex items-center justify-end gap-1">
                <Medal className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-[#A4ACB8]">{entry.achievementCount || 0}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* User position (if not in top list) */}
      {showUserSeparately && userPosition && (
        <>
          <div className="flex items-center gap-2 px-3 py-1">
            <div className="flex-1 border-t border-dashed border-[#2B313A]" />
            <span className="text-xs text-[#6B7280]">Your Position</span>
            <div className="flex-1 border-t border-dashed border-[#2B313A]" />
          </div>
          
          <div
            className={cn(
              'grid items-center px-3 py-2.5 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/30',
              compact ? 'grid-cols-[40px_1fr_80px]' : 'grid-cols-[48px_1fr_100px_60px]'
            )}
          >
            <div className="flex items-center justify-center">
              <RankBadge rank={userPosition.rank} />
            </div>
            
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                'shrink-0 rounded-full bg-[#2B313A] flex items-center justify-center',
                compact ? 'w-7 h-7' : 'w-8 h-8'
              )}>
                <User className={cn('text-[#6B7280]', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'font-medium truncate text-[#C1121F]',
                    compact ? 'text-sm' : 'text-base'
                  )}>
                    {userPosition.displayName} (You)
                  </span>
                  <SubscriptionBadge tier={userPosition.subscriptionTier} />
                </div>
                {userPosition.level && !compact && (
                  <span className="text-xs text-[#6B7280]">{userPosition.level}</span>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <span className={cn(
                'font-semibold text-[#C1121F]',
                compact ? 'text-sm' : 'text-base'
              )}>
                {userPosition.scoreLabel}
              </span>
            </div>
            
            {!compact && (
              <div className="flex items-center justify-end gap-1">
                <Medal className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-[#A4ACB8]">{userPosition.achievementCount || 0}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
