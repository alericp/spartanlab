'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface SkillReadiness {
  skill: string
  skillLabel: string
  readinessScore: number // 0-100
  status: 'ready' | 'close' | 'building' | 'foundational'
  message: string
  strengthGaps?: string[]
}

interface ReadinessAnalysisProps {
  pullUpMax: number | null
  dipMax: number | null
  pushUpMax: number | null
  bodyweight: number | null
  selectedSkills: string[]
  className?: string
}

// =============================================================================
// READINESS CALCULATION
// =============================================================================

const SKILL_REQUIREMENTS = {
  front_lever: {
    label: 'Front Lever',
    minPullUps: 12,
    optimalPullUps: 18,
    minWeightedPull: 0.3, // 30% BW
    optimalWeightedPull: 0.5,
  },
  planche: {
    label: 'Planche',
    minDips: 15,
    optimalDips: 25,
    minPushUps: 30,
    optimalPushUps: 50,
  },
  muscle_up: {
    label: 'Muscle-Up',
    minPullUps: 12,
    optimalPullUps: 15,
    minDips: 15,
    optimalDips: 20,
  },
  handstand_pushup: {
    label: 'Handstand Push-Up',
    minDips: 12,
    optimalDips: 20,
    minPushUps: 25,
    optimalPushUps: 40,
  },
}

function calculateSkillReadiness(
  skill: string,
  pullUpMax: number | null,
  dipMax: number | null,
  pushUpMax: number | null
): SkillReadiness {
  const reqs = SKILL_REQUIREMENTS[skill as keyof typeof SKILL_REQUIREMENTS]
  
  if (!reqs) {
    return {
      skill,
      skillLabel: skill.replace('_', ' '),
      readinessScore: 50,
      status: 'building',
      message: 'Training path identified',
    }
  }

  const gaps: string[] = []
  let totalScore = 0
  let metrics = 0

  // Pull-up based skills
  if ('minPullUps' in reqs && pullUpMax !== null) {
    metrics++
    const pullScore = Math.min(100, (pullUpMax / reqs.optimalPullUps) * 100)
    totalScore += pullScore
    if (pullUpMax < reqs.minPullUps) {
      gaps.push(`Pull-ups: ${pullUpMax}/${reqs.minPullUps} minimum`)
    }
  }

  // Dip based skills
  if ('minDips' in reqs && dipMax !== null) {
    metrics++
    const dipScore = Math.min(100, (dipMax / reqs.optimalDips) * 100)
    totalScore += dipScore
    if (dipMax < reqs.minDips) {
      gaps.push(`Dips: ${dipMax}/${reqs.minDips} minimum`)
    }
  }

  // Push-up based skills
  if ('minPushUps' in reqs && pushUpMax !== null) {
    metrics++
    const pushScore = Math.min(100, (pushUpMax / reqs.optimalPushUps) * 100)
    totalScore += pushScore
    if (pushUpMax < reqs.minPushUps) {
      gaps.push(`Push-ups: ${pushUpMax}/${reqs.minPushUps} minimum`)
    }
  }

  const readinessScore = metrics > 0 ? Math.round(totalScore / metrics) : 30
  
  let status: SkillReadiness['status']
  let message: string
  
  if (readinessScore >= 80) {
    status = 'ready'
    message = 'You have the strength foundation to start working on this skill'
  } else if (readinessScore >= 60) {
    status = 'close'
    message = 'Almost there! A few more weeks of strength work'
  } else if (readinessScore >= 40) {
    status = 'building'
    message = 'Building the foundation — focus on strength first'
  } else {
    status = 'foundational'
    message = 'Start with fundamental strength progressions'
  }

  return {
    skill,
    skillLabel: reqs.label,
    readinessScore,
    status,
    message,
    strengthGaps: gaps.length > 0 ? gaps : undefined,
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ReadinessAnalysis({
  pullUpMax,
  dipMax,
  pushUpMax,
  bodyweight,
  selectedSkills,
  className,
}: ReadinessAnalysisProps) {
  const readinessResults = useMemo(() => {
    return selectedSkills.map(skill => 
      calculateSkillReadiness(skill, pullUpMax, dipMax, pushUpMax)
    )
  }, [selectedSkills, pullUpMax, dipMax, pushUpMax])

  if (selectedSkills.length === 0) {
    return null
  }

  const getStatusColor = (status: SkillReadiness['status']) => {
    switch (status) {
      case 'ready': return 'text-emerald-400'
      case 'close': return 'text-amber-400'
      case 'building': return 'text-blue-400'
      case 'foundational': return 'text-[#6B7280]'
    }
  }

  const getStatusIcon = (status: SkillReadiness['status']) => {
    switch (status) {
      case 'ready': return CheckCircle2
      case 'close': return TrendingUp
      case 'building': return Zap
      case 'foundational': return AlertCircle
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-[#C1121F]" />
        <h3 className="text-sm font-semibold text-[#E6E9EF]">Skill Readiness Analysis</h3>
      </div>

      {readinessResults.map((result) => {
        const StatusIcon = getStatusIcon(result.status)
        
        return (
          <Card 
            key={result.skill}
            className="bg-[#0F1115] border-[#2B313A] p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <StatusIcon className={cn('w-4 h-4', getStatusColor(result.status))} />
                <span className="text-sm font-medium text-[#E6E9EF]">
                  {result.skillLabel}
                </span>
              </div>
              <span className={cn('text-sm font-bold', getStatusColor(result.status))}>
                {result.readinessScore}%
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-1.5 bg-[#2B313A] rounded-full overflow-hidden mb-2">
              <div 
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  result.status === 'ready' ? 'bg-emerald-500' :
                  result.status === 'close' ? 'bg-amber-500' :
                  result.status === 'building' ? 'bg-blue-500' : 'bg-[#4F6D8A]'
                )}
                style={{ width: `${result.readinessScore}%` }}
              />
            </div>

            <p className="text-xs text-[#6B7280]">{result.message}</p>

            {result.strengthGaps && result.strengthGaps.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#2B313A]">
                <p className="text-xs text-[#6B7280] mb-1">Focus areas:</p>
                {result.strengthGaps.map((gap, i) => (
                  <p key={i} className="text-xs text-[#A4ACB8]">• {gap}</p>
                ))}
              </div>
            )}
          </Card>
        )
      })}

      <p className="text-xs text-[#6B7280] text-center pt-2">
        SpartanLab will build progressions that match your current level
      </p>
    </div>
  )
}
