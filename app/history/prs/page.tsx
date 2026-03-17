'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageContainer, SectionHeader, EmptyState, CardGrid } from '@/components/layout'
import { 
  Trophy, 
  Search, 
  ChevronRight, 
  Calendar,
  Dumbbell,
  Timer,
  TrendingUp,
  Hash,
  ArrowLeft,
  X,
  Flame,
  Target,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { PersonalRecordHistory, PRType, ExerciseCategory } from '@/types/history'

// =============================================================================
// PR TYPE DISPLAY HELPERS
// =============================================================================

const PR_TYPE_CONFIG: Record<PRType, {
  label: string
  shortLabel: string
  icon: React.ReactNode
  unit: (value: number, prUnit?: string) => string
  color: string
}> = {
  max_weight: {
    label: 'Max Weight',
    shortLabel: 'Weight',
    icon: <Dumbbell className="w-3.5 h-3.5" />,
    unit: (v, u) => u ? `${v} ${u}` : `+${v} lb`,
    color: 'text-amber-400',
  },
  best_reps: {
    label: 'Best Reps',
    shortLabel: 'Reps',
    icon: <Hash className="w-3.5 h-3.5" />,
    unit: (v) => `${v} reps`,
    color: 'text-emerald-400',
  },
  best_hold: {
    label: 'Best Hold',
    shortLabel: 'Hold',
    icon: <Timer className="w-3.5 h-3.5" />,
    unit: (v) => `${v} sec`,
    color: 'text-blue-400',
  },
  best_volume: {
    label: 'Best Volume',
    shortLabel: 'Volume',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    unit: (v, u) => u ? `${v} ${u}` : `${v}`,
    color: 'text-purple-400',
  },
  best_density: {
    label: 'Best Density',
    shortLabel: 'Density',
    icon: <Flame className="w-3.5 h-3.5" />,
    unit: (v) => `${v}`,
    color: 'text-orange-400',
  },
  best_level: {
    label: 'Best Level',
    shortLabel: 'Level',
    icon: <Target className="w-3.5 h-3.5" />,
    unit: (v) => `Level ${v}`,
    color: 'text-cyan-400',
  },
  best_sets: {
    label: 'Best Sets',
    shortLabel: 'Sets',
    icon: <Star className="w-3.5 h-3.5" />,
    unit: (v) => `${v} sets`,
    color: 'text-pink-400',
  },
  first_unlock: {
    label: 'First Unlock',
    shortLabel: 'Unlock',
    icon: <Trophy className="w-3.5 h-3.5" />,
    unit: () => 'Unlocked',
    color: 'text-amber-500',
  },
}

const CATEGORY_CONFIG: Record<ExerciseCategory, {
  label: string
  color: string
}> = {
  skill: { label: 'Skill', color: 'text-blue-400' },
  strength: { label: 'Strength', color: 'text-amber-400' },
  weighted: { label: 'Weighted', color: 'text-emerald-400' },
  bodyweight: { label: 'Bodyweight', color: 'text-purple-400' },
  mobility: { label: 'Mobility', color: 'text-cyan-400' },
  conditioning: { label: 'Conditioning', color: 'text-orange-400' },
}

// =============================================================================
// PR SUMMARY STATS COMPONENT
// =============================================================================

interface PRSummaryProps {
  totalPRs: number
  totalExercises: number
  mostRecentDate: string | null
  latestPR: PersonalRecordHistory | null
}

function PRSummaryHeader({ totalPRs, totalExercises, mostRecentDate, latestPR }: PRSummaryProps) {
  return (
    <Card className="bg-gradient-to-br from-[#1A1F26] via-[#0F1115] to-[#1A1F26] border-[#2B313A] p-5 sm:p-6 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#C1121F]/10 to-transparent rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C1121F] to-amber-600 flex items-center justify-center shadow-lg shadow-[#C1121F]/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#E6E9EF]">PR Archive</h1>
            <p className="text-sm text-[#A4ACB8]">Your personal record history</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#0F1115] rounded-lg p-3 sm:p-4 border border-[#2B313A]">
            <p className="text-xl sm:text-2xl font-bold text-[#E6E9EF]">{totalPRs}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Total PRs</p>
          </div>
          <div className="bg-[#0F1115] rounded-lg p-3 sm:p-4 border border-[#2B313A]">
            <p className="text-xl sm:text-2xl font-bold text-[#E6E9EF]">{totalExercises}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">Exercises</p>
          </div>
          <div className="bg-[#0F1115] rounded-lg p-3 sm:p-4 border border-[#2B313A]">
            <p className="text-sm sm:text-base font-semibold text-[#E6E9EF] truncate">
              {mostRecentDate ? formatDate(mostRecentDate) : '—'}
            </p>
            <p className="text-xs text-[#6B7280] mt-0.5">Last PR</p>
          </div>
        </div>

        {/* Latest PR highlight */}
        {latestPR && (
          <div className="mt-4 pt-4 border-t border-[#2B313A]">
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[#A4ACB8]">Latest:</span>
              <span className="text-[#E6E9EF] font-medium">{latestPR.exerciseName}</span>
              <span className={cn("font-semibold", PR_TYPE_CONFIG[latestPR.prType]?.color || 'text-amber-400')}>
                {PR_TYPE_CONFIG[latestPR.prType]?.unit(latestPR.valuePrimary, latestPR.unit || undefined)}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// =============================================================================
// EXERCISE PR CARD COMPONENT
// =============================================================================

interface ExercisePRGroup {
  exerciseKey: string
  exerciseName: string
  category?: ExerciseCategory
  prs: PersonalRecordHistory[]
  latestDate: string
}

interface ExercisePRCardProps {
  group: ExercisePRGroup
  onSelect: (group: ExercisePRGroup) => void
}

function ExercisePRCard({ group, onSelect }: ExercisePRCardProps) {
  // Get the best PR for each type
  const bestByType = useMemo(() => {
    const map = new Map<PRType, PersonalRecordHistory>()
    for (const pr of group.prs) {
      const existing = map.get(pr.prType)
      if (!existing || pr.valuePrimary > existing.valuePrimary) {
        map.set(pr.prType, pr)
      }
    }
    return map
  }, [group.prs])

  const topPRs = Array.from(bestByType.values()).slice(0, 3)
  const categoryConfig = group.category ? CATEGORY_CONFIG[group.category] : null

  return (
    <button
      onClick={() => onSelect(group)}
      className="w-full text-left"
    >
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/50 transition-all group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-[#E6E9EF] truncate">{group.exerciseName}</h3>
              {categoryConfig && (
                <span className={cn("text-xs px-1.5 py-0.5 rounded bg-[#0F1115]", categoryConfig.color)}>
                  {categoryConfig.label}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Last PR: {formatDate(group.latestDate)}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#C1121F] transition-colors flex-shrink-0 mt-0.5" />
        </div>

        {/* PR values */}
        <div className="mt-3 flex flex-wrap gap-2">
          {topPRs.map((pr) => {
            const config = PR_TYPE_CONFIG[pr.prType]
            return (
              <div
                key={pr.id}
                className="flex items-center gap-1.5 bg-[#0F1115] rounded px-2 py-1 border border-[#2B313A]"
              >
                <span className={cn("flex items-center", config?.color || 'text-amber-400')}>
                  {config?.icon}
                </span>
                <span className="text-xs text-[#A4ACB8]">{config?.shortLabel}:</span>
                <span className="text-xs font-semibold text-[#E6E9EF]">
                  {config?.unit(pr.valuePrimary, pr.unit || undefined)}
                </span>
              </div>
            )
          })}
          {group.prs.length > 3 && (
            <span className="text-xs text-[#6B7280] self-center">
              +{group.prs.length - 3} more
            </span>
          )}
        </div>
      </Card>
    </button>
  )
}

// =============================================================================
// EXERCISE PR DETAIL PANEL
// =============================================================================

interface PRDetailPanelProps {
  group: ExercisePRGroup
  onClose: () => void
}

function PRDetailPanel({ group, onClose }: PRDetailPanelProps) {
  // Sort PRs by date (newest first)
  const sortedPRs = useMemo(() => {
    return [...group.prs].sort((a, b) => 
      new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
    )
  }, [group.prs])

  // Group by PR type for display
  const prsByType = useMemo(() => {
    const map = new Map<PRType, PersonalRecordHistory[]>()
    for (const pr of sortedPRs) {
      const list = map.get(pr.prType) || []
      list.push(pr)
      map.set(pr.prType, list)
    }
    return map
  }, [sortedPRs])

  const categoryConfig = group.category ? CATEGORY_CONFIG[group.category] : null

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-[#E6E9EF]">{group.exerciseName}</h2>
            {categoryConfig && (
              <span className={cn("text-xs px-2 py-0.5 rounded bg-[#0F1115] border border-[#2B313A]", categoryConfig.color)}>
                {categoryConfig.label}
              </span>
            )}
          </div>
          <p className="text-sm text-[#A4ACB8]">{group.prs.length} personal record{group.prs.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-[#6B7280] hover:text-[#E6E9EF] hover:bg-[#0F1115] -mt-1 -mr-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* PRs by type */}
      <div className="space-y-4">
        {Array.from(prsByType.entries()).map(([prType, prs]) => {
          const config = PR_TYPE_CONFIG[prType]
          const best = prs[0] // Already sorted, first is newest

          return (
            <div key={prType} className="bg-[#0F1115] rounded-lg p-4 border border-[#2B313A]">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("flex items-center", config?.color || 'text-amber-400')}>
                  {config?.icon}
                </span>
                <span className="text-sm font-medium text-[#E6E9EF]">{config?.label}</span>
              </div>

              {/* Best value highlight */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className={cn("text-2xl font-bold", config?.color || 'text-amber-400')}>
                  {config?.unit(best.valuePrimary, best.unit || undefined)}
                </span>
                <span className="text-sm text-[#6B7280]">
                  {formatDate(best.achievedAt)}
                </span>
              </div>

              {/* PR history for this type */}
              {prs.length > 1 && (
                <div className="space-y-2 pt-3 border-t border-[#2B313A]">
                  <p className="text-xs text-[#6B7280] mb-2">Previous records:</p>
                  {prs.slice(1, 5).map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between text-sm gap-2">
                      <span className="text-[#A4ACB8] truncate">
                        {config?.unit(pr.valuePrimary, pr.unit || undefined)}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-[#6B7280]">
                          {formatDate(pr.achievedAt)}
                        </span>
                        {pr.workoutSessionId && (
                          <Link
                            href={`/history/session/${pr.workoutSessionId}`}
                            className="text-xs text-[#C1121F] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Session
                          </Link>
                        )}
                        {pr.programHistoryId && (
                          <Link
                            href={`/history/program/${pr.programHistoryId}`}
                            className="text-xs text-[#6B7280] hover:text-[#A4ACB8] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Program
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                  {prs.length > 5 && (
                    <p className="text-xs text-[#6B7280]">+{prs.length - 5} more</p>
                  )}
                </div>
              )}

              {/* Context links for best PR */}
              {(best.workoutSessionId || best.programHistoryId) && (
                <div className="mt-3 pt-3 border-t border-[#2B313A] flex items-center gap-4 flex-wrap">
                  {best.workoutSessionId && (
                    <Link
                      href={`/history/session/${best.workoutSessionId}`}
                      className="text-xs text-[#C1121F] hover:underline flex items-center gap-1"
                    >
                      View session
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                  {best.programHistoryId && (
                    <Link
                      href={`/history/program/${best.programHistoryId}`}
                      className="text-xs text-[#6B7280] hover:text-[#A4ACB8] hover:underline flex items-center gap-1"
                    >
                      View program context
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function PRArchivePage() {
  const { userId } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [prs, setPRs] = useState<PersonalRecordHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<ExercisePRGroup | null>(null)

  // Fetch PRs
  useEffect(() => {
    setMounted(true)
    
    async function fetchPRs() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/history/prs?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setPRs(data.prs || [])
        }
      } catch (error) {
        console.error('[PRArchive] Error fetching PRs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPRs()
  }, [userId])

  // Group PRs by exercise
  const exerciseGroups = useMemo<ExercisePRGroup[]>(() => {
    const groupMap = new Map<string, ExercisePRGroup>()

    for (const pr of prs) {
      const existing = groupMap.get(pr.exerciseKey)
      if (existing) {
        existing.prs.push(pr)
        if (new Date(pr.achievedAt) > new Date(existing.latestDate)) {
          existing.latestDate = pr.achievedAt
        }
      } else {
        groupMap.set(pr.exerciseKey, {
          exerciseKey: pr.exerciseKey,
          exerciseName: pr.exerciseName,
          category: pr.exerciseCategory,
          prs: [pr],
          latestDate: pr.achievedAt,
        })
      }
    }

    // Sort by latest date (newest first)
    return Array.from(groupMap.values()).sort(
      (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    )
  }, [prs])

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return exerciseGroups
    const query = searchQuery.toLowerCase()
    return exerciseGroups.filter(g => 
      g.exerciseName.toLowerCase().includes(query) ||
      g.exerciseKey.toLowerCase().includes(query)
    )
  }, [exerciseGroups, searchQuery])

  // Summary stats
  const summaryStats = useMemo(() => {
    const sortedByDate = [...prs].sort(
      (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
    )
    return {
      totalPRs: prs.length,
      totalExercises: exerciseGroups.length,
      mostRecentDate: sortedByDate[0]?.achievedAt || null,
      latestPR: sortedByDate[0] || null,
    }
  }, [prs, exerciseGroups])

  if (!mounted) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-[#1A1F26] rounded-lg" />
          <div className="h-10 bg-[#1A1F26] rounded-lg w-full" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-28 bg-[#1A1F26] rounded-lg" />
            ))}
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Back link */}
      <Link 
        href="/history" 
        className="inline-flex items-center gap-1.5 text-sm text-[#A4ACB8] hover:text-[#E6E9EF] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to History
      </Link>

      {/* Summary Header */}
      <PRSummaryHeader {...summaryStats} />

      {/* Search */}
      {exerciseGroups.length > 0 && (
        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <Input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1A1F26] border-[#2B313A] text-[#E6E9EF] placeholder:text-[#6B7280]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E6E9EF]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-28 bg-[#1A1F26] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : exerciseGroups.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No PRs Tracked Yet"
            description="Personal records will appear here as you train and surpass your previous bests. Complete workouts and log your performance to build your archive."
            action={
              <Link href="/dashboard">
                <Button className="bg-[#C1121F] hover:bg-[#C1121F]/90 text-white">
                  Go to Dashboard
                </Button>
              </Link>
            }
          />
        ) : selectedGroup ? (
          <PRDetailPanel 
            group={selectedGroup} 
            onClose={() => setSelectedGroup(null)} 
          />
        ) : (
          <>
            <SectionHeader
              title={`Exercises (${filteredGroups.length})`}
              description={searchQuery ? `Showing results for "${searchQuery}"` : 'Grouped by exercise, sorted by most recent PR'}
            />
            
            {filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
                <p className="text-[#A4ACB8]">No exercises match "{searchQuery}"</p>
                <Button
                  variant="ghost"
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-[#C1121F]"
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map(group => (
                  <ExercisePRCard
                    key={group.exerciseKey}
                    group={group}
                    onSelect={setSelectedGroup}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  )
}
