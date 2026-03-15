'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  getAchievementsWithProgress, 
  getAchievementSummary,
  type AchievementWithProgress,
  type AchievementSummary,
} from '@/lib/achievements/achievement-engine'
import { 
  type AchievementCategory,
  getCategoryDisplayName,
} from '@/lib/achievements/achievement-definitions'
import { AchievementCard, AchievementBadge } from './achievement-badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, ChevronRight, Filter } from 'lucide-react'
import Link from 'next/link'

// =============================================================================
// SUMMARY CARD - COMPACT FOR DASHBOARD
// =============================================================================

interface AchievementsSummaryCardProps {
  className?: string
}

export function AchievementsSummaryCard({ className }: AchievementsSummaryCardProps) {
  const [summary, setSummary] = useState<AchievementSummary | null>(null)
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([])
  
  useEffect(() => {
    setSummary(getAchievementSummary())
    setAchievements(getAchievementsWithProgress())
  }, [])
  
  if (!summary) return null
  
  // Get recently unlocked achievements (up to 3)
  const recentUnlocked = achievements
    .filter(a => a.unlocked)
    .slice(0, 3)
  
  return (
    <Card className={cn('bg-[#1A1D23] border-[#2A2F38] p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[#E6E9EF]">Achievements</h3>
            <p className="text-xs text-[#6B7280]">
              {summary.unlockedCount} of {summary.totalAchievements} unlocked
            </p>
          </div>
        </div>
        
        <Link href="/achievements">
          <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#E6E9EF]">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
          <span>{summary.percentComplete}% complete</span>
          <span>{summary.earnedPoints} / {summary.totalPoints} pts</span>
        </div>
        <div className="h-2 bg-[#2A2F38] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
            style={{ width: `${summary.percentComplete}%` }}
          />
        </div>
      </div>
      
      {/* Recent unlocks */}
      {recentUnlocked.length > 0 ? (
        <div className="flex items-center gap-2">
          {recentUnlocked.map(a => (
            <AchievementBadge
              key={a.id}
              achievement={a}
              unlocked={true}
              size="sm"
            />
          ))}
          {summary.unlockedCount > 3 && (
            <span className="text-xs text-[#6B7280]">+{summary.unlockedCount - 3} more</span>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#6B7280]">
          Complete workouts to earn achievements
        </p>
      )}
    </Card>
  )
}

// =============================================================================
// FULL ACHIEVEMENTS PAGE CONTENT
// =============================================================================

interface AchievementsPageContentProps {
  className?: string
}

export function AchievementsPageContent({ className }: AchievementsPageContentProps) {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([])
  const [summary, setSummary] = useState<AchievementSummary | null>(null)
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all')
  const [showLocked, setShowLocked] = useState(true)
  
  useEffect(() => {
    setAchievements(getAchievementsWithProgress())
    setSummary(getAchievementSummary())
  }, [])
  
  const categories: (AchievementCategory | 'all')[] = [
    'all',
    'training_progress',
    'consistency',
    'strength_milestone',
    'skill_progress',
    'volume',
  ]
  
  const filteredAchievements = achievements.filter(a => {
    if (filter !== 'all' && a.category !== filter) return false
    if (!showLocked && !a.unlocked) return false
    return true
  })
  
  // Separate unlocked and locked
  const unlockedAchievements = filteredAchievements.filter(a => a.unlocked)
  const lockedAchievements = filteredAchievements.filter(a => !a.unlocked)
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Header */}
      {summary && (
        <Card className="bg-[#1A1D23] border-[#2A2F38] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#E6E9EF]">Achievements</h1>
                <p className="text-[#6B7280]">
                  {summary.unlockedCount} unlocked | {summary.earnedPoints} points earned
                </p>
              </div>
            </div>
            
            {/* Progress circle */}
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="#2A2F38"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="url(#progress-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${summary.percentComplete} 100`}
                  />
                  <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#E6E9EF]">{summary.percentComplete}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat)}
            className={cn(
              'text-xs',
              filter === cat
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                : 'border-[#2A2F38] text-[#6B7280] hover:text-[#E6E9EF]'
            )}
          >
            {cat === 'all' ? 'All' : getCategoryDisplayName(cat)}
          </Button>
        ))}
        
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLocked(!showLocked)}
            className="text-[#6B7280] hover:text-[#E6E9EF]"
          >
            <Filter className="w-4 h-4 mr-1" />
            {showLocked ? 'Hide Locked' : 'Show Locked'}
          </Button>
        </div>
      </div>
      
      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#E6E9EF] uppercase tracking-wider">
            Unlocked ({unlockedAchievements.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {unlockedAchievements.map(a => (
              <AchievementCard
                key={a.id}
                achievement={a}
                unlocked={true}
                unlockedAt={a.unlockedAt}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Locked Achievements */}
      {showLocked && lockedAchievements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">
            Locked ({lockedAchievements.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lockedAchievements.map(a => (
              <AchievementCard
                key={a.id}
                achievement={a}
                unlocked={false}
                currentValue={a.currentValue}
                progressPercent={a.progressPercent}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {filteredAchievements.length === 0 && (
        <Card className="bg-[#1A1D23] border-[#2A2F38] p-8 text-center">
          <Trophy className="w-12 h-12 text-[#4B5563] mx-auto mb-3" />
          <p className="text-[#6B7280]">
            {filter === 'all' 
              ? 'No achievements yet. Start training to unlock your first achievement!'
              : `No achievements in this category yet.`
            }
          </p>
        </Card>
      )}
    </div>
  )
}
