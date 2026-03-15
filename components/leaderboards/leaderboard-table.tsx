'use client'

/**
 * SpartanLab Leaderboard Table Component
 * 
 * Displays ranked leaderboard entries with user position visibility.
 * Mobile-friendly, premium design.
 */

import { cn } from '@/lib/utils'
import { Crown, Medal, Trophy, Shield, Flame, User } from 'lucide-react'
import type { LeaderboardEntry, LeaderboardData } from '@/lib/leaderboards/leaderboard-types'

// =============================================================================
// RANK BADGE
// =============================================================================

interface RankBadgeProps {
  rank: number
  size?: 'sm' | 'md'
}

function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
  
  if (rank === 1) {
    return (
      <div className={cn(
        sizeClasses,
        'flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold shadow-lg'
      )}>
        <Crown className="w-4 h-4" />
      </div>
    )
  }
  
  if (rank === 2) {
    return (
      <div className={cn(
        sizeClasses,
        'flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 font-bold shadow'
      )}>
        <Medal className="w-4 h-4" />
      </div>
    )
  }
  
  if (rank === 3) {
    return (
      <div className={cn(
        sizeClasses,
        'flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 font-bold shadow'
      )}>
        <Medal className="w-4 h-4" />
      </div>
    )
  }
  
  return (
    <div className={cn(
      sizeClasses,
      'flex items-center justify-center rounded-full',
      'bg-[#2A2A2A] text-[#A5A5A5] font-semibold'
    )}>
      {rank}
    </div>
  )
}

// =============================================================================
// LEADERBOARD ROW
// =============================================================================

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  isHighlighted?: boolean
}

function LeaderboardRow({ entry, isHighlighted = false }: LeaderboardRowProps) {
  const isTopThree = entry.rank <= 3
  
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
        isHighlighted && 'bg-amber-500/10 border border-amber-500/20',
        !isHighlighted && isTopThree && 'bg-[#1F1F1F]',
        !isHighlighted && !isTopThree && 'hover:bg-[#1A1A1A]'
      )}
    >
      {/* Rank */}
      <RankBadge rank={entry.rank} size="md" />
      
      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium truncate',
            entry.isCurrentUser ? 'text-amber-400' : 'text-[#F5F5F5]'
          )}>
            {entry.displayName}
          </span>
          
          {/* Pro badge */}
          {entry.isPro && (
            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-400">
              PRO
            </span>
          )}
          
          {/* Achievement badges (show up to 2) */}
          {entry.badges && entry.badges.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {entry.badges.slice(0, 2).map(badge => (
                <span
                  key={badge.id}
                  className={cn(
                    'shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded',
                    badge.tier === 'legendary' && 'bg-purple-500/20 text-purple-400',
                    badge.tier === 'epic' && 'bg-amber-500/20 text-amber-400',
                    badge.tier === 'rare' && 'bg-blue-500/20 text-blue-400',
                    badge.tier === 'common' && 'bg-slate-500/20 text-slate-400'
                  )}
                  title={badge.name}
                >
                  {badge.name}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Level indicator for skill leaderboards */}
        {entry.level && (
          <span className="text-xs text-[#6B7280]">
            {entry.level}
          </span>
        )}
      </div>
      
      {/* Score */}
      <div className="text-right">
        <span className={cn(
          'font-bold tabular-nums',
          isTopThree ? 'text-[#F5F5F5]' : 'text-[#A5A5A5]'
        )}>
          {entry.formattedScore}
        </span>
      </div>
    </div>
  )
}

// =============================================================================
// USER POSITION BANNER
// =============================================================================

interface UserPositionBannerProps {
  entry: LeaderboardEntry
  totalParticipants: number
}

function UserPositionBanner({ entry, totalParticipants }: UserPositionBannerProps) {
  const percentile = Math.round((entry.rank / totalParticipants) * 100)
  const topPercent = Math.max(1, percentile)
  
  return (
    <div className="mt-4 pt-4 border-t border-[#3A3A3A]/50">
      <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-500/20">
          <User className="w-5 h-5 text-amber-400" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-400">Your Position</span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/20 text-amber-400">
              Top {topPercent}%
            </span>
          </div>
          <span className="text-sm text-[#A5A5A5]">
            Rank #{entry.rank} of {totalParticipants}
          </span>
        </div>
        
        <div className="text-right">
          <span className="font-bold text-[#F5F5F5] tabular-nums">
            {entry.formattedScore}
          </span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface LeaderboardTableProps {
  data: LeaderboardData
  className?: string
  showHeader?: boolean
  compact?: boolean
}

export function LeaderboardTable({
  data,
  className,
  showHeader = true,
  compact = false,
}: LeaderboardTableProps) {
  const { entries, userRank, totalParticipants, categoryConfig } = data
  
  if (entries.length === 0) {
    return (
      <div className={cn('p-8 text-center', className)}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#2A2A2A] flex items-center justify-center">
          <Trophy className="w-6 h-6 text-[#6B7280]" />
        </div>
        <p className="text-[#A5A5A5]">No rankings yet</p>
        <p className="text-xs text-[#6B7280] mt-1">Be the first to compete!</p>
      </div>
    )
  }
  
  return (
    <div className={cn('space-y-1', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 text-xs text-[#6B7280]">
          <span>RANK</span>
          <span>{categoryConfig.scoreUnit.toUpperCase()}</span>
        </div>
      )}
      
      {/* Entries */}
      <div className="space-y-1">
        {entries.map(entry => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            isHighlighted={entry.isCurrentUser}
          />
        ))}
      </div>
      
      {/* User position if not in top entries */}
      {userRank && !entries.some(e => e.isCurrentUser) && (
        <UserPositionBanner
          entry={userRank}
          totalParticipants={totalParticipants}
        />
      )}
    </div>
  )
}

// =============================================================================
// COMPACT PREVIEW
// =============================================================================

interface LeaderboardPreviewProps {
  data: LeaderboardData
  limit?: number
  className?: string
}

export function LeaderboardPreview({
  data,
  limit = 5,
  className,
}: LeaderboardPreviewProps) {
  const previewEntries = data.entries.slice(0, limit)
  const userInPreview = previewEntries.some(e => e.isCurrentUser)
  
  return (
    <div className={cn('space-y-2', className)}>
      {previewEntries.map(entry => (
        <div
          key={entry.userId}
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded',
            entry.isCurrentUser && 'bg-amber-500/10'
          )}
        >
          <RankBadge rank={entry.rank} size="sm" />
          <span className={cn(
            'flex-1 text-sm truncate',
            entry.isCurrentUser ? 'text-amber-400 font-medium' : 'text-[#A5A5A5]'
          )}>
            {entry.displayName}
          </span>
          <span className="text-sm font-medium tabular-nums text-[#F5F5F5]">
            {entry.formattedScore}
          </span>
        </div>
      ))}
      
      {/* Show user position if not in preview */}
      {!userInPreview && data.userRank && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-amber-500/10 mt-2 border-t border-[#3A3A3A]/50 pt-2">
          <span className="text-xs text-[#6B7280]">You:</span>
          <span className="text-sm text-amber-400 font-medium">#{data.userRank.rank}</span>
          <span className="flex-1" />
          <span className="text-sm font-medium tabular-nums text-[#F5F5F5]">
            {data.userRank.formattedScore}
          </span>
        </div>
      )}
    </div>
  )
}
