'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ChevronDown,
  ChevronUp,
  Target,
  Check,
  Lock,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import {
  type SkillRoadmapType,
  type AthleteRoadmapPosition,
  type RoadmapLevel,
  getRoadmap,
  determineRoadmapPosition,
} from '@/lib/roadmap/skill-roadmap-service'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface SkillRoadmapDisplayProps {
  skillKey: SkillRoadmapType
  compact?: boolean
  onLevelSelect?: (level: number) => void
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SkillRoadmapDisplay({
  skillKey,
  compact = false,
  onLevelSelect,
}: SkillRoadmapDisplayProps) {
  const [expanded, setExpanded] = useState(!compact)
  const [showAllLevels, setShowAllLevels] = useState(false)
  
  const roadmap = getRoadmap(skillKey)
  const position = determineRoadmapPosition(skillKey)
  
  if (!roadmap || !position) {
    return null
  }
  
  // Show only nearby levels by default to avoid overwhelming beginners
  const visibleLevels = showAllLevels 
    ? roadmap.levels 
    : getVisibleLevels(roadmap.levels, position.currentLevelIndex)
  
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'ready to push':
        return 'text-emerald-400'
      case 'almost ready':
        return 'text-green-400'
      case 'developing':
        return 'text-yellow-400'
      case 'early foundation':
        return 'text-orange-400'
      default:
        return 'text-red-400'
    }
  }

  return (
    <Card className="bg-[#12151A] border-[#2A2F36]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C1121F]/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-[#C1121F]" />
            </div>
            <div>
              <CardTitle className="text-[#E6E9EF] text-lg">
                {roadmap.skillName} Roadmap
              </CardTitle>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {roadmap.shortDescription}
              </p>
            </div>
          </div>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-[#A4ACB8] hover:text-[#E6E9EF]"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4">
          {/* Current Position Summary */}
          <div className="bg-[#1A1D23] rounded-lg p-4 border border-[#2A2F36]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                  Current Level
                </p>
                <p className="text-[#E6E9EF] font-medium">
                  {position.currentLevel.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-1">
                  Readiness
                </p>
                <p className={cn('font-semibold', getTierColor(position.readinessTier))}>
                  {position.readinessScore}%
                </p>
              </div>
            </div>
            
            {/* Progress to Next Level */}
            {position.nextLevel && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A4ACB8]">
                    Progress to {position.nextLevel.name}
                  </span>
                  <span className="text-[#6B7280]">
                    {position.progressPercentage}%
                  </span>
                </div>
                <Progress 
                  value={position.progressPercentage} 
                  className="h-2 bg-[#2A2F36]"
                />
              </div>
            )}
            
            {/* Readiness Tier Badge */}
            <div className="flex items-center gap-2 mt-3">
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs border',
                  position.readinessTier === 'Ready to Push' && 'border-emerald-500/40 text-emerald-400',
                  position.readinessTier === 'Almost Ready' && 'border-green-500/40 text-green-400',
                  position.readinessTier === 'Developing' && 'border-yellow-500/40 text-yellow-400',
                  position.readinessTier === 'Early Foundation' && 'border-orange-500/40 text-orange-400',
                  position.readinessTier === 'Not Ready Yet' && 'border-red-500/40 text-red-400',
                )}
              >
                {position.readinessTier}
              </Badge>
              <span className="text-xs text-[#6B7280]">
                Level {position.currentLevelIndex + 1} of {roadmap.totalLevels}
              </span>
            </div>
          </div>
          
          {/* Weak Points / Missing Prerequisites */}
          {(position.weakPoints.length > 0 || position.missingPrerequisites.length > 0) && (
            <div className="bg-[#1A1D23] rounded-lg p-4 border border-[#2A2F36]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <p className="text-sm text-[#E6E9EF] font-medium">
                  Areas to Improve
                </p>
              </div>
              <div className="space-y-2">
                {position.missingPrerequisites.slice(0, 2).map((prereq, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                    <p className="text-xs text-[#A4ACB8]">{prereq}</p>
                  </div>
                ))}
                {position.weakPoints.slice(0, 2).map((wp, i) => (
                  <div key={`wp-${i}`} className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                    <p className="text-xs text-[#A4ACB8]">
                      {wp.name}: {wp.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Coaching Message */}
          <div className="bg-[#C1121F]/10 border border-[#C1121F]/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#C1121F] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#E6E9EF]">
                {position.coachingMessage}
              </p>
            </div>
          </div>
          
          {/* Progression Ladder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#E6E9EF] font-medium">
                Progression Ladder
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllLevels(!showAllLevels)}
                className="text-xs text-[#6B7280] hover:text-[#E6E9EF] h-auto py-1"
              >
                {showAllLevels ? 'Show Less' : 'Show All'}
              </Button>
            </div>
            
            <div className="space-y-1">
              {visibleLevels.map((level) => (
                <RoadmapLevelRow
                  key={level.id}
                  level={level}
                  isCompleted={level.level <= position.currentLevelIndex}
                  isCurrent={level.level === position.currentLevelIndex + 1}
                  isNext={level.level === position.currentLevelIndex + 2}
                  isLocked={level.level > position.currentLevelIndex + 2}
                  onSelect={() => onLevelSelect?.(level.level - 1)}
                />
              ))}
            </div>
          </div>
          
          {/* Actionable Next Step */}
          <div className="pt-2 border-t border-[#2A2F36]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C1121F]" />
              <p className="text-sm text-[#E6E9EF] font-medium">Next Step</p>
            </div>
            <p className="text-xs text-[#A4ACB8] mt-1">
              {position.actionableNextStep}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

interface RoadmapLevelRowProps {
  level: RoadmapLevel
  isCompleted: boolean
  isCurrent: boolean
  isNext: boolean
  isLocked: boolean
  onSelect?: () => void
}

function RoadmapLevelRow({
  level,
  isCompleted,
  isCurrent,
  isNext,
  isLocked,
  onSelect,
}: RoadmapLevelRowProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        isCompleted && 'bg-emerald-500/10 border-emerald-500/30',
        isCurrent && 'bg-[#C1121F]/15 border-[#C1121F]/40',
        isNext && 'bg-[#1A1D23] border-[#2A2F36]',
        isLocked && 'bg-[#12151A] border-[#1A1D23] opacity-60',
        !isCompleted && !isCurrent && !isNext && !isLocked && 'bg-[#1A1D23] border-[#2A2F36]'
      )}
    >
      <button
        className="w-full p-3 text-left flex items-center gap-3"
        onClick={() => {
          setShowDetails(!showDetails)
          if (!isLocked && onSelect) onSelect()
        }}
        disabled={isLocked}
      >
        {/* Status Icon */}
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isCompleted && 'bg-emerald-500/20',
          isCurrent && 'bg-[#C1121F]/20',
          !isCompleted && !isCurrent && 'bg-[#2A2F36]'
        )}>
          {isCompleted ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : isLocked ? (
            <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
          ) : isCurrent ? (
            <Target className="w-4 h-4 text-[#C1121F]" />
          ) : (
            <span className="text-xs text-[#A4ACB8] font-medium">{level.level}</span>
          )}
        </div>
        
        {/* Level Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-medium text-sm',
              isCompleted && 'text-emerald-400',
              isCurrent && 'text-[#C1121F]',
              !isCompleted && !isCurrent && 'text-[#E6E9EF]'
            )}>
              {level.name}
            </span>
            {isCurrent && (
              <Badge className="bg-[#C1121F]/20 text-[#C1121F] text-[10px] py-0">
                Current Target
              </Badge>
            )}
            {isNext && (
              <Badge variant="outline" className="text-[10px] py-0 border-[#2A2F36] text-[#6B7280]">
                Next
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#6B7280] truncate mt-0.5">
            {level.description}
          </p>
        </div>
        
        {/* Expand Icon */}
        {!isLocked && (
          <ChevronDown className={cn(
            'w-4 h-4 text-[#6B7280] transition-transform flex-shrink-0',
            showDetails && 'rotate-180'
          )} />
        )}
      </button>
      
      {/* Expanded Details */}
      {showDetails && !isLocked && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-[#2A2F36]/50 mt-0">
          {/* Requirements */}
          <div className="mt-2">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wide mb-1">
              Requirements
            </p>
            <ul className="space-y-1">
              {level.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                    isCompleted ? 'bg-emerald-400' : 'bg-[#6B7280]'
                  )} />
                  <span className="text-xs text-[#A4ACB8]">{req}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Hold Time / Reps Goal */}
          {(level.holdTimeGoal || level.repsGoal) && (
            <div className="flex gap-4">
              {level.holdTimeGoal && (
                <div>
                  <p className="text-[10px] text-[#6B7280]">Hold Goal</p>
                  <p className="text-sm text-[#E6E9EF] font-medium">{level.holdTimeGoal}s</p>
                </div>
              )}
              {level.repsGoal && (
                <div>
                  <p className="text-[10px] text-[#6B7280]">Reps Goal</p>
                  <p className="text-sm text-[#E6E9EF] font-medium">{level.repsGoal} reps</p>
                </div>
              )}
            </div>
          )}
          
          {/* Coaching Tip */}
          <div className="bg-[#12151A] rounded p-2">
            <p className="text-[10px] text-[#6B7280] uppercase tracking-wide mb-0.5">
              Tip
            </p>
            <p className="text-xs text-[#A4ACB8]">{level.coachingTip}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COMPACT SUMMARY COMPONENT (for dashboard)
// =============================================================================

interface SkillRoadmapSummaryProps {
  skillKey: SkillRoadmapType
  onClick?: () => void
}

export function SkillRoadmapSummary({ skillKey, onClick }: SkillRoadmapSummaryProps) {
  const roadmap = getRoadmap(skillKey)
  const position = determineRoadmapPosition(skillKey)
  
  if (!roadmap || !position) return null
  
  const getTierBgColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'ready to push':
        return 'bg-emerald-500/20'
      case 'almost ready':
        return 'bg-green-500/20'
      case 'developing':
        return 'bg-yellow-500/20'
      case 'early foundation':
        return 'bg-orange-500/20'
      default:
        return 'bg-red-500/20'
    }
  }
  
  const getTierTextColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'ready to push':
        return 'text-emerald-400'
      case 'almost ready':
        return 'text-green-400'
      case 'developing':
        return 'text-yellow-400'
      case 'early foundation':
        return 'text-orange-400'
      default:
        return 'text-red-400'
    }
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[#1A1D23] rounded-lg p-3 border border-[#2A2F36] hover:border-[#3A4553] transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#E6E9EF] font-medium">
          {roadmap.skillName}
        </span>
        <span className={cn('text-sm font-semibold', getTierTextColor(position.readinessTier))}>
          {position.readinessScore}%
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <Badge 
          className={cn(
            'text-[10px] py-0',
            getTierBgColor(position.readinessTier),
            getTierTextColor(position.readinessTier)
          )}
        >
          {position.currentLevel.name}
        </Badge>
        {position.nextLevel && (
          <>
            <ArrowRight className="w-3 h-3 text-[#6B7280]" />
            <span className="text-[10px] text-[#6B7280]">
              {position.nextLevel.name}
            </span>
          </>
        )}
      </div>
      
      <Progress 
        value={position.progressPercentage} 
        className="h-1.5 bg-[#2A2F36]"
      />
    </button>
  )
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get visible levels - shows current, previous, and next 2 levels
 * to avoid overwhelming beginners with distant goals
 */
function getVisibleLevels(levels: RoadmapLevel[], currentIndex: number): RoadmapLevel[] {
  const startIndex = Math.max(0, currentIndex - 1)
  const endIndex = Math.min(levels.length, currentIndex + 4)
  return levels.slice(startIndex, endIndex)
}
