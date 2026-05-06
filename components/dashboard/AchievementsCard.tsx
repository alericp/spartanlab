'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, ChevronRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AchievementBadge } from '@/components/achievements/AchievementBadge'
import { 
  getUnlockedAchievements,
  ACHIEVEMENTS,
  type Achievement,
  type UnlockedAchievement,
  TIER_COLORS,
} from '@/lib/achievements/achievement-definitions'

interface AchievementsCardProps {
  className?: string
  maxDisplay?: number
}

export function AchievementsCard({ className, maxDisplay = 6 }: AchievementsCardProps) {
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setUnlocked(getUnlockedAchievements())
  }, [])

  if (!mounted) {
    return (
      <Card className={cn("p-5 bg-[#1A1D21] border-[#2A2D31]", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-[#2A2D31] rounded w-1/3" />
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 h-12 bg-[#2A2D31] rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  // Get full achievement details for unlocked ones
  const unlockedAchievements = unlocked
    .map(ua => {
      const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievementId)
      return achievement ? { ...achievement, unlockedAt: ua.unlockedAt } : null
    })
    .filter((a): a is Achievement & { unlockedAt: string } => a !== null)
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, maxDisplay)

  // Get some locked achievements to show as aspirational
  const lockedAchievements = ACHIEVEMENTS
    .filter(a => !unlocked.some(ua => ua.achievementId === a.id))
    .slice(0, Math.max(0, maxDisplay - unlockedAchievements.length))

  const totalUnlocked = unlocked.length
  const totalAchievements = ACHIEVEMENTS.length
  const progressPercent = (totalUnlocked / totalAchievements) * 100

  // Empty state
  if (totalUnlocked === 0) {
    return (
      <Card className={cn("p-5 bg-[#1A1D21] border-[#2A2D31]", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#2A2D31] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#F5F5F5]">Achievements</h3>
            <p className="text-xs text-[#6B7280]">Complete workouts to earn medals</p>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {ACHIEVEMENTS.slice(0, 4).map(achievement => (
            <div 
              key={achievement.id}
              className="w-12 h-12 rounded-lg bg-[#2A2D31] flex items-center justify-center opacity-40"
            >
              <Lock className="w-4 h-4 text-[#6B7280]" />
            </div>
          ))}
        </div>
        
        <p className="text-xs text-[#6B7280] mt-4">
          {totalAchievements} achievements to unlock
        </p>
      </Card>
    )
  }

  return (
    <Card className={cn("p-5 bg-[#1A1D21] border-[#2A2D31]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#F5F5F5]">Achievements</h3>
            <p className="text-xs text-[#6B7280]">
              {totalUnlocked} of {totalAchievements} unlocked
            </p>
          </div>
        </div>
        <Link href="/achievements">
          <Button variant="ghost" size="sm" className="text-[#6B7280] hover:text-[#F5F5F5] h-8 px-2">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#2A2D31] rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Achievements grid */}
      <div className="flex gap-2 flex-wrap">
        {unlockedAchievements.map(achievement => (
          <AchievementBadge 
            key={achievement.id}
            achievement={achievement}
            unlocked={true}
            size="sm"
            showName={false}
          />
        ))}
        {lockedAchievements.map(achievement => (
          <AchievementBadge 
            key={achievement.id}
            achievement={achievement}
            unlocked={false}
            size="sm"
            showName={false}
          />
        ))}
      </div>

      {/* Recent unlock */}
      {unlockedAchievements.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#2A2D31]">
          <p className="text-xs text-[#6B7280] mb-1">Most recent</p>
          <div className="flex items-center gap-2">
            {/*
              [PRE-AB6 BUILD GREEN GATE / TIER_COLORS CLASS-TOKEN CONTRACT]
              TIER_COLORS exposes Tailwind class tokens
              ({ bg, text, border, glow }), not raw inline color values.
              The previous `style={{ color: ...primary }}` read a phantom
              field that does not exist on the contract. Switching to the
              existing `text` class token preserves the tier-colored
              styling without widening TIER_COLORS or casting.
            */}
            <span
              className={cn(
                "text-sm font-medium",
                TIER_COLORS[unlockedAchievements[0].tier].text
              )}
            >
              {unlockedAchievements[0].name}
            </span>
            <span className="text-xs text-[#6B7280]">
              {unlockedAchievements[0].description}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

// Compact version for sidebar or smaller spaces
export function AchievementsMiniCard({ className }: { className?: string }) {
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setUnlocked(getUnlockedAchievements())
  }, [])

  if (!mounted) return null

  const totalUnlocked = unlocked.length
  const totalAchievements = ACHIEVEMENTS.length

  return (
    <Link href="/achievements">
      <Card className={cn(
        "p-3 bg-[#1A1D21] border-[#2A2D31] hover:border-[#3A3D41] transition-colors cursor-pointer",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F5F5F5]">
              {totalUnlocked} Achievement{totalUnlocked !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-[#6B7280] truncate">
              {totalAchievements - totalUnlocked} more to unlock
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B7280]" />
        </div>
      </Card>
    </Link>
  )
}
