'use client'

import { useState, useEffect } from 'react'
import { Trophy, Flame, Target, Dumbbell, Star, ChevronRight, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  type LeaderboardCategory, 
  type LeaderboardData,
  LEADERBOARD_CATEGORIES,
} from '@/lib/leaderboards/leaderboard-types'
import { getLeaderboard } from '@/lib/leaderboards/leaderboard-service'
import { LeaderboardTable } from './LeaderboardTable'

// Icon mapping
const CATEGORY_ICONS: Record<LeaderboardCategory, typeof Trophy> = {
  global_spartan_score: Trophy,
  consistency: Flame,
  front_lever: Target,
  planche: Target,
  muscle_up: Dumbbell,
  handstand_push_up: Star,
}

interface LeaderboardTabsProps {
  defaultCategory?: LeaderboardCategory
  showAllCategories?: boolean
  compact?: boolean
  className?: string
}

export function LeaderboardTabs({
  defaultCategory = 'global_spartan_score',
  showAllCategories = true,
  compact = false,
  className,
}: LeaderboardTabsProps) {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>(defaultCategory)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Categories to show
  const categories: LeaderboardCategory[] = showAllCategories
    ? ['global_spartan_score', 'consistency', 'front_lever', 'planche', 'muscle_up', 'handstand_push_up']
    : ['global_spartan_score', 'consistency']
  
  useEffect(() => {
    setLoading(true)
    // Small delay to simulate loading
    const timer = setTimeout(() => {
      const data = getLeaderboard(activeCategory)
      setLeaderboardData(data)
      setLoading(false)
    }, 150)
    
    return () => clearTimeout(timer)
  }, [activeCategory])
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => {
          const meta = LEADERBOARD_CATEGORIES[category]
          const Icon = CATEGORY_ICONS[category]
          const isActive = activeCategory === category
          
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'bg-[#C1121F] text-white shadow-lg shadow-[#C1121F]/20'
                  : 'bg-[#1A1F26] text-[#A4ACB8] hover:bg-[#1F242B] hover:text-[#E6E9EF]'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{meta.title}</span>
            </button>
          )
        })}
      </div>
      
      {/* Leaderboard content */}
      <div className="bg-[#141820] rounded-xl border border-[#2B313A] overflow-hidden">
        {/* Header */}
        {leaderboardData && (
          <div className="px-4 py-3 border-b border-[#2B313A] bg-[#1A1F26]/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#E6E9EF]">{leaderboardData.metadata.title} Rankings</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">{leaderboardData.metadata.description}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                <Users className="w-3.5 h-3.5" />
                <span>{leaderboardData.totalParticipants} athletes</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Table */}
        <div className="p-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-[#1A1F26] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : leaderboardData ? (
            <LeaderboardTable
              entries={leaderboardData.entries}
              metadata={leaderboardData.metadata}
              userPosition={leaderboardData.userPosition}
              showUserPosition={true}
              compact={compact}
            />
          ) : (
            <div className="py-8 text-center text-[#6B7280]">
              No leaderboard data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact preview card for dashboard
interface LeaderboardPreviewCardProps {
  className?: string
}

export function LeaderboardPreviewCard({ className }: LeaderboardPreviewCardProps) {
  const [data, setData] = useState<LeaderboardData | null>(null)
  
  useEffect(() => {
    const leaderboard = getLeaderboard('global_spartan_score')
    setData(leaderboard)
  }, [])
  
  if (!data) {
    return (
      <div className={cn('bg-[#141820] rounded-xl border border-[#2B313A] p-4', className)}>
        <div className="h-40 bg-[#1A1F26] rounded-lg animate-pulse" />
      </div>
    )
  }
  
  // Show top 3 + user position
  const topThree = data.entries.slice(0, 3)
  
  return (
    <div className={cn('bg-[#141820] rounded-xl border border-[#2B313A] overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2B313A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[#E6E9EF] text-sm">Leaderboard</h3>
            <p className="text-xs text-[#6B7280]">Top Spartans</p>
          </div>
        </div>
        <a 
          href="/leaderboard" 
          className="flex items-center gap-1 text-xs text-[#C1121F] hover:text-[#E6363F] transition-colors"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
      
      {/* Top 3 mini display */}
      <div className="p-3 space-y-2">
        {topThree.map((entry, index) => (
          <div
            key={entry.userId}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg',
              entry.isCurrentUser ? 'bg-[#C1121F]/10' : 'bg-[#1A1F26]'
            )}
          >
            {/* Rank medal */}
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
              index === 0 && 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
              index === 1 && 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700',
              index === 2 && 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100',
            )}>
              {index + 1}
            </div>
            
            {/* Name */}
            <span className={cn(
              'flex-1 text-sm font-medium truncate',
              entry.isCurrentUser ? 'text-[#C1121F]' : 'text-[#E6E9EF]'
            )}>
              {entry.displayName}
              {entry.isCurrentUser && ' (You)'}
            </span>
            
            {/* Score */}
            <span className={cn(
              'text-sm font-semibold',
              entry.isCurrentUser ? 'text-[#C1121F]' : 'text-[#A4ACB8]'
            )}>
              {entry.score}
            </span>
          </div>
        ))}
        
        {/* User position if not in top 3 */}
        {data.userPosition && data.userPosition.rank > 3 && (
          <>
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 border-t border-dashed border-[#2B313A]" />
              <span className="text-[10px] text-[#6B7280]">You</span>
              <div className="flex-1 border-t border-dashed border-[#2B313A]" />
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#C1121F]/10">
              <div className="w-6 h-6 rounded-full bg-[#1F242B] flex items-center justify-center text-xs font-medium text-[#6B7280]">
                {data.userPosition.rank}
              </div>
              <span className="flex-1 text-sm font-medium text-[#C1121F] truncate">
                {data.userPosition.displayName}
              </span>
              <span className="text-sm font-semibold text-[#C1121F]">
                {data.userPosition.score}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
