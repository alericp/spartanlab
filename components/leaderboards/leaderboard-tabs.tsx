'use client'

/**
 * SpartanLab Leaderboard Tabs Component
 * 
 * Tabbed interface for switching between leaderboard categories.
 * Mobile-friendly with horizontal scroll.
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Flame, Calendar, Target, Dumbbell, ArrowUp, RefreshCw, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LeaderboardTable, LeaderboardPreview } from './leaderboard-table'
import { 
  type LeaderboardCategory, 
  type LeaderboardData,
  LEADERBOARD_CATEGORIES,
  getCategoryConfig,
  CATEGORY_CONFIGS,
} from '@/lib/leaderboards/leaderboard-types'
import { getLeaderboard, refreshLeaderboard } from '@/lib/leaderboards/leaderboard-service'

// Fallback icon mapping
const CATEGORY_ICONS: Record<LeaderboardCategory, typeof Flame> = {
  global_spartan_score: Flame,
  consistency: Calendar,
  front_lever: Target,
  planche: Target,
  muscle_up: Dumbbell,
  handstand_push_up: ArrowUp,
}

// =============================================================================
// CATEGORY TAB
// =============================================================================

interface CategoryTabProps {
  category: LeaderboardCategory
  isActive: boolean
  onClick: () => void
}

function CategoryTab({ category, isActive, onClick }: CategoryTabProps) {
  const config = getCategoryConfig(category)
  const Icon = CATEGORY_ICONS[category] || Flame
  
  if (!config) return null
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
        isActive
          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          : 'bg-[#2A2A2A] text-[#A5A5A5] border border-transparent hover:bg-[#333] hover:text-[#F5F5F5]'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{config.label}</span>
      <span className="sm:hidden">{config.shortLabel}</span>
    </button>
  )
}

// =============================================================================
// MAIN TABS COMPONENT
// =============================================================================

interface LeaderboardTabsProps {
  defaultCategory?: LeaderboardCategory
  categories?: LeaderboardCategory[]
  className?: string
  showRefresh?: boolean
}

export function LeaderboardTabs({
  defaultCategory = 'global_spartan_score',
  categories = ['global_spartan_score', 'consistency', 'front_lever', 'planche', 'muscle_up'],
  className,
  showRefresh = true,
}: LeaderboardTabsProps) {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>(defaultCategory)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  
  // Load leaderboard data when category changes
  useEffect(() => {
    setIsLoading(true)
    
    // Small delay to prevent flashing
    const timer = setTimeout(() => {
      const data = getLeaderboard(activeCategory)
      setLeaderboardData(data)
      setIsLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [activeCategory])
  
  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    const data = refreshLeaderboard(activeCategory)
    setLeaderboardData(data)
    setTimeout(() => setIsRefreshing(false), 500)
  }
  
  const activeConfig = getCategoryConfig(activeCategory)
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#3A3A3A] scrollbar-track-transparent">
        {categories.map(category => (
          <CategoryTab
            key={category}
            category={category}
            isActive={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          />
        ))}
        
        {/* Help button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHelp(true)}
          className="shrink-0 ml-auto text-[#6B7280] hover:text-[#F5F5F5]"
          title="How rankings work"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
        
        {/* Refresh button */}
        {showRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0 text-[#6B7280] hover:text-[#F5F5F5]"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </Button>
        )}
      </div>
      
      {/* Help overlay */}
      {showHelp && (
        <div className="relative bg-[#1A1A1A] border border-amber-500/20 rounded-lg p-4 mb-4">
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-2 right-2 text-[#6B7280] hover:text-[#A5A5A5]"
          >
            <span className="sr-only">Close</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h4 className="font-medium text-[#F5F5F5] mb-2">How Rankings Work</h4>
          <p className="text-sm text-[#A5A5A5] mb-3">
            Your Spartan Score determines your leaderboard position. It increases when you:
          </p>
          <ul className="text-sm text-[#A5A5A5] space-y-1.5 list-disc list-inside">
            <li>Complete workouts and maintain streaks</li>
            <li>Progress your strength and skill levels</li>
            <li>Unlock achievements and complete challenges</li>
          </ul>
        </div>
      )}
      
      {/* Category Description */}
      {activeConfig && (
        <p className="text-sm text-[#6B7280]">
          {activeConfig.description}
        </p>
      )}
      
      {/* Leaderboard Content */}
      <Card className="bg-[#1A1A1A] border-[#2A2A2A] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : leaderboardData ? (
          <LeaderboardTable data={leaderboardData} />
        ) : (
          <div className="py-12 text-center text-[#6B7280]">
            Unable to load leaderboard
          </div>
        )}
      </Card>
      
      {/* Participant count */}
      {leaderboardData && !leaderboardData.isEarlyAccess && (
        <p className="text-xs text-center text-[#6B7280]">
          {leaderboardData.totalParticipants} total athletes
        </p>
      )}
      
      {/* Early access notice */}
      {leaderboardData?.isEarlyAccess && (
        <p className="text-xs text-center text-amber-400/70">
          Building the Spartan community
        </p>
      )}
    </div>
  )
}

// =============================================================================
// COMPACT TABBED PREVIEW (for dashboard)
// =============================================================================

interface LeaderboardTabsCompactProps {
  categories?: LeaderboardCategory[]
  previewLimit?: number
  className?: string
}

export function LeaderboardTabsCompact({
  categories = ['global_spartan_score', 'consistency'],
  previewLimit = 5,
  className,
}: LeaderboardTabsCompactProps) {
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>(categories[0])
  const [data, setData] = useState<LeaderboardData | null>(null)
  
  useEffect(() => {
    const leaderboard = getLeaderboard(activeCategory)
    setData(leaderboard)
  }, [activeCategory])
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Compact tabs */}
      <div className="flex items-center gap-1">
        {categories.map(category => {
          const config = getCategoryConfig(category)
          const Icon = CATEGORY_ICONS[category] || Flame
          const isActive = activeCategory === category
          
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all',
                isActive
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-[#6B7280] hover:text-[#A5A5A5]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{config?.shortLabel || category}</span>
            </button>
          )
        })}
      </div>
      
      {/* Preview content */}
      {data && (
        <LeaderboardPreview data={data} limit={previewLimit} />
      )}
    </div>
  )
}
