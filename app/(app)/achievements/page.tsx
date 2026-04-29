'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { PageContainer, Section, SectionHeader } from '@/components/layout'
import type { LucideIcon } from 'lucide-react'
import { Trophy, Medal, Star, Flame, Target, Dumbbell, Crown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AchievementBadge } from '@/components/achievements/AchievementBadge'
import { 
  getUnlockedAchievements,
  ACHIEVEMENTS,
  type Achievement,
  type AchievementCategory,
  type UnlockedAchievement,
  TIER_COLORS,
  CATEGORY_LABELS,
} from '@/lib/achievements/achievement-definitions'

// [BUILD-FIX] Must be exhaustive for every member of the authoritative
// AchievementCategory union in lib/achievements/achievement-definitions.ts
// (training | strength | skill | consistency | volume | challenge | h2h |
// longevity | balance). Stores `LucideIcon` *component references* (not
// rendered JSX) because `SectionHeader.icon` is typed as `LucideIcon`
// (see components/layout/index.tsx) and renders the component itself
// internally. The filter chip strip below instantiates the component
// inline with the desired className.
const CATEGORY_ICONS: Record<AchievementCategory, LucideIcon> = {
  training: Dumbbell,
  strength: Target,
  skill: Star,
  consistency: Flame,
  volume: Trophy,
  challenge: Zap,
  h2h: Crown,
  longevity: Medal,
  balance: Trophy,
}

export default function AchievementsPage() {
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([])
  const [mounted, setMounted] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')

  useEffect(() => {
    setMounted(true)
    setUnlocked(getUnlockedAchievements())
  }, [])

  if (!mounted) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[#2A2D31] rounded w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-[#2A2D31] rounded-lg" />
            ))}
          </div>
        </div>
      </PageContainer>
    )
  }

  const unlockedIds = new Set(unlocked.map(ua => ua.achievementId))
  // [BUILD-FIX] Aligned with the authoritative AchievementCategory union
  // so the filter chip strip surfaces every category that has achievements.
  const categories: (AchievementCategory | 'all')[] = [
    'all',
    'training',
    'strength',
    'skill',
    'consistency',
    'volume',
    'challenge',
    'h2h',
    'longevity',
    'balance',
  ]
  
  const filteredAchievements = selectedCategory === 'all' 
    ? ACHIEVEMENTS 
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory)

  const totalUnlocked = unlocked.length
  const totalAchievements = ACHIEVEMENTS.length
  const progressPercent = (totalUnlocked / totalAchievements) * 100

  // [BUILD-FIX] Group by category for display. Partial<Record<...>> is
  // the honest shape: after filtering not every category is necessarily
  // present, and the render path below null-coalesces the per-category
  // array so the UI never crashes on an empty entry.
  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category]!.push(achievement)
    return acc
  }, {} as Partial<Record<AchievementCategory, Achievement[]>>)

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5]">Achievements</h1>
            <p className="text-sm text-[#6B7280]">
              {totalUnlocked} of {totalAchievements} unlocked
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-[#2A2D31] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map(category => {
          // [BUILD-FIX] CATEGORY_ICONS now stores LucideIcon component
          // references, so the filter chip must instantiate the
          // component inline with the desired sizing className.
          const ChipIcon = category !== 'all' ? CATEGORY_ICONS[category] : null
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                selectedCategory === category
                  ? "bg-[#2A2D31] text-[#F5F5F5]"
                  : "text-[#6B7280] hover:text-[#A5A5A5] hover:bg-[#1A1D21]"
              )}
            >
              {ChipIcon && <ChipIcon className="w-4 h-4" />}
              {category === 'all' ? 'All' : CATEGORY_LABELS[category]}
            </button>
          )
        })}
      </div>

      {/* Achievements by category */}
      {selectedCategory === 'all' ? (
        Object.entries(groupedAchievements).map(([category, achievements]) => {
          // [BUILD-FIX] Partial<Record> means `achievements` is
          // `Achievement[] | undefined`. Null-coalesce so a missing
          // category entry never crashes the render.
          const typedCategory = category as AchievementCategory
          const categoryAchievements = achievements ?? []
          return (
            <Section key={category} className="mb-8">
              <SectionHeader
                title={CATEGORY_LABELS[typedCategory]}
                icon={CATEGORY_ICONS[typedCategory]}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {categoryAchievements.map(achievement => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={unlockedIds.has(achievement.id)}
                    unlockedAt={unlocked.find(ua => ua.achievementId === achievement.id)?.unlockedAt}
                  />
                ))}
              </div>
            </Section>
          )
        })
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAchievements.map(achievement => (
            <AchievementCard 
              key={achievement.id}
              achievement={achievement}
              unlocked={unlockedIds.has(achievement.id)}
              unlockedAt={unlocked.find(ua => ua.achievementId === achievement.id)?.unlockedAt}
            />
          ))}
        </div>
      )}
    </PageContainer>
  )
}

interface AchievementCardProps {
  achievement: Achievement
  unlocked: boolean
  unlockedAt?: string
}

function AchievementCard({ achievement, unlocked, unlockedAt }: AchievementCardProps) {
  const tierColors = TIER_COLORS[achievement.tier]
  
  return (
    <Card className={cn(
      "p-4 border transition-all",
      unlocked 
        ? "bg-[#1A1D21] border-[#2A2D31]" 
        : "bg-[#0F1115] border-[#1A1D21] opacity-60"
    )}>
      <div className="flex flex-col items-center text-center">
        <AchievementBadge 
          achievement={achievement}
          unlocked={unlocked}
          size="lg"
          showName={false}
        />
        <h3 className={cn(
          "text-sm font-medium mt-3",
          unlocked ? "text-[#F5F5F5]" : "text-[#6B7280]"
        )}>
          {achievement.name}
        </h3>
        <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
          {achievement.description}
        </p>
        {unlocked && unlockedAt && (
          <p className="text-[10px] text-[#4B5563] mt-2">
            {new Date(unlockedAt).toLocaleDateString()}
          </p>
        )}
        {!unlocked && (
          // [BUILD-FIX] TIER_COLORS shape is { bg, text, border, glow }
          // (all Tailwind class strings) — there is no `primary` raw
          // color. Render the locked-tier pill with the existing class
          // tokens via `cn` so the same visual intent is preserved
          // without re-introducing a phantom raw-color contract.
          <div
            className={cn(
              "mt-2 px-2 py-0.5 rounded text-[10px] font-medium uppercase border",
              tierColors.bg,
              tierColors.text,
              tierColors.border,
            )}
          >
            {achievement.tier}
          </div>
        )}
      </div>
    </Card>
  )
}
