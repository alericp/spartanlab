'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  Clock,
  Battery,
  ChevronRight,
  Info
} from 'lucide-react'
import type { 
  GlobalConstraintResult, 
  ConstraintCategory,
  SkillType,
} from '@/lib/constraint-detection-engine'

// =============================================================================
// CONSTRAINT INSIGHT CARD
// =============================================================================

interface ConstraintInsightCardProps {
  athleteId?: string
  compact?: boolean
}

export function ConstraintInsightCard({ athleteId, compact = false }: ConstraintInsightCardProps) {
  const [constraints, setConstraints] = useState<GlobalConstraintResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchConstraints() {
      try {
        const response = await fetch('/api/constraints')
        if (!response.ok) throw new Error('Failed to fetch constraints')
        const data = await response.json()
        setConstraints(data)
      } catch (err) {
        console.error('[ConstraintInsight] Error:', err)
        setError('Could not load constraint analysis')
      } finally {
        setLoading(false)
      }
    }
    
    fetchConstraints()
  }, [athleteId])
  
  if (loading) {
    return (
      <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-[#2A2A2A] rounded w-3/4" />
            <div className="h-3 bg-[#2A2A2A] rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error || !constraints) {
    return (
      <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-[#6A6A6A]">
            <Info className="w-4 h-4" />
            <span className="text-sm">Constraint analysis unavailable</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (constraints.dataQuality === 'insufficient') {
    return (
      <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#A5A5A5] flex items-center gap-2">
            <Target className="w-4 h-4" />
            Training Constraints
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-[#6A6A6A]">
            Log more workouts to unlock personalized constraint detection.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  const categoryIcons: Partial<Record<ConstraintCategory, React.ReactNode>> = {
    fatigue_recovery: <Battery className="w-4 h-4" />,
    schedule_time_constraint: <Clock className="w-4 h-4" />,
    pull_strength: <TrendingUp className="w-4 h-4" />,
    push_strength: <TrendingUp className="w-4 h-4" />,
    compression_strength: <Target className="w-4 h-4" />,
  }
  
  const categoryColors: Partial<Record<ConstraintCategory, string>> = {
    fatigue_recovery: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    schedule_time_constraint: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pull_strength: 'bg-red-500/20 text-red-400 border-red-500/30',
    push_strength: 'bg-red-500/20 text-red-400 border-red-500/30',
    compression_strength: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    scapular_control: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    shoulder_stability: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    none: 'bg-green-500/20 text-green-400 border-green-500/30',
  }
  
  const CONSTRAINT_LABELS: Record<ConstraintCategory, string> = {
    pull_strength: 'Pulling Strength',
    push_strength: 'Pushing Strength',
    straight_arm_pull_strength: 'Straight-Arm Pull',
    straight_arm_push_strength: 'Straight-Arm Push',
    compression_strength: 'Compression',
    core_control: 'Core Control',
    scapular_control: 'Scapular Control',
    shoulder_stability: 'Shoulder Stability',
    wrist_tolerance: 'Wrist Tolerance',
    explosive_pull_power: 'Explosive Pull',
    transition_strength: 'Transition Strength',
    vertical_push_strength: 'Vertical Push',
    mobility: 'Mobility',
    shoulder_extension_mobility: 'Shoulder Extension',
    skill_coordination: 'Skill Coordination',
    balance_control: 'Balance Control',
    fatigue_recovery: 'Recovery / Fatigue',
    schedule_time_constraint: 'Time Constraint',
    training_consistency: 'Consistency',
    insufficient_data: 'More Data Needed',
    none: 'Balanced',
  }
  
  const primaryLabel = CONSTRAINT_LABELS[constraints.primaryConstraint] || constraints.primaryConstraint
  const primaryColor = categoryColors[constraints.primaryConstraint] || 'bg-[#2A2A2A] text-[#F5F5F5] border-[#3A3A3A]'
  const primaryIcon = categoryIcons[constraints.primaryConstraint] || <AlertTriangle className="w-4 h-4" />
  
  if (compact) {
    return (
      <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${primaryColor.split(' ')[0]}`}>
                {primaryIcon}
              </div>
              <div>
                <p className="text-xs text-[#6A6A6A] uppercase tracking-wide">Primary Limiter</p>
                <p className="text-sm font-medium text-[#F5F5F5]">{primaryLabel}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#4A4A4A]" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-[#F5F5F5] flex items-center gap-2">
          <Target className="w-5 h-5 text-[#E63946]" />
          Training Constraints
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Constraint */}
        <div className="space-y-2">
          <p className="text-xs text-[#6A6A6A] uppercase tracking-wide">Primary Limiter</p>
          <Badge 
            variant="outline" 
            className={`${primaryColor} font-medium py-1 px-3`}
          >
            {primaryIcon}
            <span className="ml-2">{primaryLabel}</span>
          </Badge>
        </div>
        
        {/* Secondary Constraint */}
        {constraints.secondaryConstraint && (
          <div className="space-y-2">
            <p className="text-xs text-[#6A6A6A] uppercase tracking-wide">Secondary Limiter</p>
            <Badge 
              variant="outline" 
              className="bg-[#2A2A2A] text-[#A5A5A5] border-[#3A3A3A] font-medium py-1 px-3"
            >
              {CONSTRAINT_LABELS[constraints.secondaryConstraint] || constraints.secondaryConstraint}
            </Badge>
          </div>
        )}
        
        {/* Strong Qualities */}
        {constraints.strongQualities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-[#6A6A6A] uppercase tracking-wide">Strong Qualities</p>
            <div className="flex flex-wrap gap-2">
              {constraints.strongQualities.slice(0, 3).map((quality) => (
                <Badge 
                  key={quality}
                  variant="outline" 
                  className="bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                >
                  {CONSTRAINT_LABELS[quality] || quality}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Recommendations */}
        {constraints.overallRecommendations.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#2A2A2A]">
            <p className="text-xs text-[#6A6A6A] uppercase tracking-wide">Recommendations</p>
            <ul className="space-y-1">
              {constraints.overallRecommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-sm text-[#A5A5A5] flex items-start gap-2">
                  <span className="text-[#E63946] mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Status Indicators */}
        <div className="flex gap-4 pt-2 border-t border-[#2A2A2A]">
          {constraints.fatigueStatus.isFatigued && (
            <div className="flex items-center gap-2 text-amber-400">
              <Battery className="w-4 h-4" />
              <span className="text-xs">Fatigued</span>
            </div>
          )}
          {constraints.scheduleStatus.isTimeLimited && (
            <div className="flex items-center gap-2 text-blue-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Time Limited</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[#6A6A6A] ml-auto">
            <span className="text-xs capitalize">Data: {constraints.dataQuality}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// SKILL CONSTRAINT CARD
// =============================================================================

interface SkillConstraintCardProps {
  skill: SkillType
  result: {
    primaryConstraint: ConstraintCategory
    secondaryConstraint: ConstraintCategory | null
    strongQualities: ConstraintCategory[]
    overallReadiness: number
    recommendations: string[]
    explanation: string
  } | null
}

export function SkillConstraintCard({ skill, result }: SkillConstraintCardProps) {
  if (!result) return null
  
  const skillLabels: Record<SkillType, string> = {
    front_lever: 'Front Lever',
    back_lever: 'Back Lever',
    planche: 'Planche',
    hspu: 'HSPU',
    muscle_up: 'Muscle-Up',
    l_sit: 'L-Sit',
  }
  
  const CONSTRAINT_LABELS: Record<ConstraintCategory, string> = {
    pull_strength: 'Pulling Strength',
    push_strength: 'Pushing Strength',
    straight_arm_pull_strength: 'Straight-Arm Pull',
    straight_arm_push_strength: 'Straight-Arm Push',
    compression_strength: 'Compression',
    core_control: 'Core Control',
    scapular_control: 'Scapular Control',
    shoulder_stability: 'Shoulder Stability',
    wrist_tolerance: 'Wrist Tolerance',
    explosive_pull_power: 'Explosive Pull',
    transition_strength: 'Transition Strength',
    vertical_push_strength: 'Vertical Push',
    mobility: 'Mobility',
    shoulder_extension_mobility: 'Shoulder Extension',
    skill_coordination: 'Skill Coordination',
    balance_control: 'Balance Control',
    fatigue_recovery: 'Recovery',
    schedule_time_constraint: 'Time',
    training_consistency: 'Consistency',
    insufficient_data: 'More Data Needed',
    none: 'Balanced',
  }
  
  const readinessColor = 
    result.overallReadiness >= 75 ? 'text-green-400' :
    result.overallReadiness >= 50 ? 'text-amber-400' :
    'text-red-400'
  
  return (
    <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-[#F5F5F5]">{skillLabels[skill]}</h4>
        <span className={`text-sm font-mono ${readinessColor}`}>
          {result.overallReadiness}%
        </span>
      </div>
      
      <p className="text-sm text-[#A5A5A5]">{result.explanation}</p>
      
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant="outline" 
          className="bg-red-500/10 text-red-400 border-red-500/20 text-xs"
        >
          Limiter: {CONSTRAINT_LABELS[result.primaryConstraint]}
        </Badge>
        {result.secondaryConstraint && (
          <Badge 
            variant="outline" 
            className="bg-[#2A2A2A] text-[#6A6A6A] border-[#3A3A3A] text-xs"
          >
            2nd: {CONSTRAINT_LABELS[result.secondaryConstraint]}
          </Badge>
        )}
      </div>
    </div>
  )
}

export default ConstraintInsightCard
