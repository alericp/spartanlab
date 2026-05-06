'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Target, TrendingUp, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  calculateGoalProjection, 
  SUPPORTED_GOALS, 
  type GoalType, 
  type GoalProjection 
} from '@/lib/goal-projection-engine'
import { getAthleteProfile } from '@/lib/data-service'
import { getSkillProgressions } from '@/lib/data-service'

// =============================================================================
// TYPES
// =============================================================================

interface SkillHeatmapEntry {
  id: GoalType
  name: string
  category: 'skill' | 'compression' | 'flexibility'
  progressPercent: number
  currentLevel: string
  nextMilestone: string | null
  status: 'achieved' | 'strong' | 'building' | 'foundation' | 'not_started'
  isActive: boolean
}

interface SkillProgressHeatmapProps {
  variant?: 'default' | 'compact'
  maxSkills?: number
}

// =============================================================================
// PROGRESS BAR STYLING
// =============================================================================

function getProgressStyle(percent: number, status: string) {
  if (status === 'achieved') return {
    bg: 'bg-violet-500/20',
    fill: 'from-violet-500 to-violet-400',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/30',
  }
  if (percent >= 70) return {
    bg: 'bg-emerald-500/20',
    fill: 'from-emerald-500 to-emerald-400',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/30',
  }
  if (percent >= 40) return {
    bg: 'bg-amber-500/20',
    fill: 'from-amber-500 to-amber-400',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/30',
  }
  if (percent > 0) return {
    bg: 'bg-[#C1121F]/20',
    fill: 'from-[#C1121F] to-[#E63946]',
    text: 'text-[#C1121F]',
    glow: 'shadow-[#C1121F]/30',
  }
  return {
    bg: 'bg-[#2B313A]/30',
    fill: 'from-[#3B4149] to-[#4B5563]',
    text: 'text-[#6B7280]',
    glow: 'shadow-none',
  }
}

// =============================================================================
// HEATMAP BAR COMPONENT
// =============================================================================

function HeatmapBar({ 
  entry, 
  showDetails = true 
}: { 
  entry: SkillHeatmapEntry
  showDetails?: boolean
}) {
  const style = getProgressStyle(entry.progressPercent, entry.status)
  const displayPercent = Math.min(100, Math.max(0, entry.progressPercent))
  
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium transition-colors",
            entry.isActive ? "text-[#E6E9EF]" : "text-[#A4ACB8]"
          )}>
            {entry.name}
          </span>
          {entry.status === 'achieved' && (
            <Sparkles className="w-3 h-3 text-violet-400" />
          )}
        </div>
        {showDetails && (
          <span className={cn("text-xs font-medium", style.text)}>
            {entry.status === 'achieved' ? 'Achieved' : `${Math.round(displayPercent)}%`}
          </span>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className={cn(
        "relative h-2 rounded-full overflow-hidden",
        style.bg
      )}>
        <div 
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
            "bg-gradient-to-r",
            style.fill
          )}
          style={{ width: `${displayPercent}%` }}
        >
          {/* Inner shine */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 rounded-full" />
          
          {/* Edge pulse for active skills */}
          {displayPercent > 5 && displayPercent < 100 && entry.isActive && (
            <div className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/70",
              style.glow,
              "shadow-lg"
            )} />
          )}
        </div>
      </div>
      
      {/* Next milestone label */}
      {showDetails && entry.nextMilestone && entry.status !== 'achieved' && (
        <div className="flex items-center gap-1 mt-1">
          <ChevronRight className="w-3 h-3 text-[#6B7280]" />
          <span className="text-xs text-[#6B7280]">
            {entry.nextMilestone}
          </span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MOTIVATION MESSAGE
// =============================================================================

function getMotivationMessage(entries: SkillHeatmapEntry[]): string {
  const activeEntries = entries.filter(e => e.isActive && e.progressPercent > 0)
  const achievedCount = entries.filter(e => e.status === 'achieved').length
  const strongCount = entries.filter(e => e.status === 'strong').length
  const nearMilestone = entries.filter(e => e.progressPercent >= 70 && e.status !== 'achieved')
  
  if (achievedCount > 0) {
    return `${achievedCount} skill${achievedCount > 1 ? 's' : ''} mastered. Keep pushing forward.`
  }
  
  if (nearMilestone.length > 0) {
    return `${nearMilestone.length} skill${nearMilestone.length > 1 ? 's are' : ' is'} close to the next milestone.`
  }
  
  if (strongCount > 0) {
    return 'Progress is building steadily across your skills.'
  }
  
  if (activeEntries.length > 0) {
    return 'Foundation work in progress. Consistency is key.'
  }
  
  return 'Start training to see your progress here.'
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SkillProgressHeatmap({ 
  variant = 'default',
  maxSkills = 6 
}: SkillProgressHeatmapProps) {
  const [entries, setEntries] = useState<SkillHeatmapEntry[]>([])
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    try {
      const profile = getAthleteProfile()
      const progressions = getSkillProgressions()
      // [PRE-AB6 BUILD GREEN GATE / ATHLETEPROFILE NULL GUARD]
      // getAthleteProfile() can return AthleteProfile | null. When the profile
      // is missing, primaryGoal is undefined so goal-name matching evaluates
      // false naturally — but progress-based activation still works through
      // skillProgression?.progressScore. No fallback profile is fabricated.
      const primaryGoal = profile?.primaryGoal

      // Build entries for all supported goals - each projection is wrapped in try-catch
      // so one bad entry doesn't crash the entire dashboard
      const allEntries: SkillHeatmapEntry[] = SUPPORTED_GOALS.map(goal => {
        try {
          const projection = calculateGoalProjection(goal.type)
          const skillProgression = progressions.find(p => p.skillName === goal.type)
          
          // Determine if this skill is active (user's goal or has progress)
          const isActive =
            primaryGoal === goal.type ||
            primaryGoal === goal.name ||
            (skillProgression?.progressScore ?? 0) > 0
          
          // Calculate progress percentage
          let progressPercent = 0
          if (projection.isAtFinalLevel) {
            progressPercent = 100
          } else if (skillProgression) {
            progressPercent = Math.min(95, skillProgression.progressScore || 0)
          } else if (projection.currentLevel > 0) {
            // Estimate based on level progression
            const maxLevels = 5 // Approximate max levels
            progressPercent = Math.min(95, (projection.currentLevel / maxLevels) * 100)
          }
          
          // Determine status
          let status: SkillHeatmapEntry['status'] = 'not_started'
          if (projection.isAtFinalLevel) {
            status = 'achieved'
          } else if (progressPercent >= 70) {
            status = 'strong'
          } else if (progressPercent >= 30) {
            status = 'building'
          } else if (progressPercent > 0) {
            status = 'foundation'
          }
          
          return {
            id: goal.type,
            name: goal.name,
            category: goal.category,
            progressPercent,
            currentLevel: projection.currentLevelName || 'Not Started',
            nextMilestone: projection.nextLevelName,
            status,
            isActive,
          }
        } catch {
          // If projection fails for this goal (e.g., flexibility goals without strength thresholds),
          // return a safe fallback entry. This is expected for some goal types.
          return {
            id: goal.type,
            name: goal.name,
            category: goal.category,
            progressPercent: 0,
            currentLevel: 'Needs Data',
            nextMilestone: null,
            status: 'not_started' as const,
            isActive: false,
          }
        }
      })
      
      // Sort: active skills first, then by progress
      const sortedEntries = allEntries
        .sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
          return b.progressPercent - a.progressPercent
        })
        .slice(0, maxSkills)
      
      setEntries(sortedEntries)
    } catch {
      // Silent fail - skill progress is optional dashboard content
    }
  }, [maxSkills])
  
  if (!mounted || entries.length === 0) {
    return null
  }
  
  const motivationMessage = getMotivationMessage(entries)
  const activeEntries = entries.filter(e => e.isActive || e.progressPercent > 0)
  
  if (activeEntries.length === 0) {
    return null
  }
  
  if (variant === 'compact') {
    return (
      <Card className="p-4 bg-gradient-to-br from-[#1A1F26] to-[#151920] border-[#2B313A]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#C1121F]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#E6E9EF]">Skill Progress</h3>
          </div>
        </div>
        
        <div className="space-y-3">
          {activeEntries.slice(0, 4).map(entry => (
            <HeatmapBar key={entry.id} entry={entry} showDetails={false} />
          ))}
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="p-5 bg-gradient-to-br from-[#1A1F26] to-[#151920] border-[#2B313A]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C1121F]/10 border border-[#C1121F]/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#C1121F]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#E6E9EF]">Skill Progress</h3>
            <p className="text-xs text-[#6B7280]">Your active training goals</p>
          </div>
        </div>
        
        {/* Quick stat */}
        {entries.filter(e => e.progressPercent >= 70).length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">
              {entries.filter(e => e.progressPercent >= 70).length} strong
            </span>
          </div>
        )}
      </div>
      
      {/* Progress Bars */}
      <div className="space-y-4">
        {activeEntries.map(entry => (
          <HeatmapBar key={entry.id} entry={entry} showDetails={true} />
        ))}
      </div>
      
      {/* Motivation Footer */}
      <div className="mt-5 pt-4 border-t border-[#2B313A]/50">
        <p className="text-sm text-[#A4ACB8]">
          {motivationMessage}
        </p>
      </div>
    </Card>
  )
}

// =============================================================================
// MINI HEATMAP (For inline display)
// =============================================================================

export function SkillProgressMini() {
  const [entries, setEntries] = useState<SkillHeatmapEntry[]>([])
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    try {
      const profile = getAthleteProfile()
      const progressions = getSkillProgressions()
      // [PRE-AB6 BUILD GREEN GATE / ATHLETEPROFILE NULL GUARD]
      // Mirror the null-safe pattern from the main heatmap: read primaryGoal
      // through optional chaining so SkillProgressMini still renders
      // progress-based skills when the profile is absent.
      const primaryGoal = profile?.primaryGoal

      // Get only active skills (max 3)
      const activeEntries: SkillHeatmapEntry[] = SUPPORTED_GOALS
        .filter(goal => {
          const isUserGoal = primaryGoal === goal.type || primaryGoal === goal.name
          const hasProgress = progressions.some(p => p.skillName === goal.type && p.progressScore > 0)
          return isUserGoal || hasProgress
        })
        .slice(0, 3)
        .map(goal => {
          const projection = calculateGoalProjection(goal.type)
          const skillProgression = progressions.find(p => p.skillName === goal.type)
          
          let progressPercent = 0
          if (projection.isAtFinalLevel) {
            progressPercent = 100
          } else if (skillProgression) {
            progressPercent = Math.min(95, skillProgression.progressScore || 0)
          }
          
          return {
            id: goal.type,
            name: goal.name,
            category: goal.category,
            progressPercent,
            currentLevel: projection.currentLevelName || 'Start',
            nextMilestone: projection.nextLevelName,
            status: progressPercent >= 100 ? 'achieved' : 
                   progressPercent >= 70 ? 'strong' : 
                   progressPercent >= 30 ? 'building' : 
                   progressPercent > 0 ? 'foundation' : 'not_started',
            isActive: true,
          }
        })
      
      setEntries(activeEntries)
    } catch {
      // Silent fail
    }
  }, [])
  
  if (!mounted || entries.length === 0) {
    return null
  }
  
  return (
    <div className="flex items-center gap-3">
      {entries.map(entry => {
        const style = getProgressStyle(entry.progressPercent, entry.status)
        return (
          <div key={entry.id} className="flex items-center gap-2">
            <span className="text-xs text-[#6B7280] truncate max-w-[60px]">
              {entry.name.split(' ')[0]}
            </span>
            <div className={cn("w-12 h-1.5 rounded-full", style.bg)}>
              <div 
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all",
                  style.fill
                )}
                style={{ width: `${entry.progressPercent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
