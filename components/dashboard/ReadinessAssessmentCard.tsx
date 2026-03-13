'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  getReadinessAssessment, 
  getSessionAdjustments,
  type ReadinessAssessment,
  type SessionAdjustment,
} from '@/lib/recovery-fatigue-engine'
import { CheckCircle, AlertCircle, MinusCircle, XCircle, Zap, Activity, Heart, Brain } from 'lucide-react'

interface ReadinessAssessmentCardProps {
  compact?: boolean
}

export function ReadinessAssessmentCard({ compact = false }: ReadinessAssessmentCardProps) {
  const [assessment, setAssessment] = useState<ReadinessAssessment | null>(null)
  const [adjustments, setAdjustments] = useState<SessionAdjustment[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const result = getReadinessAssessment()
      setAssessment(result)
      setAdjustments(getSessionAdjustments(result))
    } catch {
      // Silent fail - recovery engine is optional enhancement
    }
  }, [])

  if (!mounted || !assessment) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A]">
        <CardContent className="p-4">
          <div className="animate-pulse h-16 bg-[#2B313A] rounded" />
        </CardContent>
      </Card>
    )
  }

  const getStateIcon = () => {
    switch (assessment.state) {
      case 'ready_to_push':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'train_normally':
        return <MinusCircle className="w-5 h-5 text-yellow-400" />
      case 'keep_controlled':
        return <AlertCircle className="w-5 h-5 text-orange-400" />
      case 'recovery_focused':
        return <XCircle className="w-5 h-5 text-red-400" />
    }
  }

  const getStateBadgeColor = () => {
    switch (assessment.state) {
      case 'ready_to_push':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'train_normally':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'keep_controlled':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'recovery_focused':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  }

  const getFatigueIcon = (type: string) => {
    switch (type) {
      case 'nervous_system':
        return <Brain className="w-4 h-4" />
      case 'local_muscular':
        return <Activity className="w-4 h-4" />
      case 'connective_tissue':
        return <Zap className="w-4 h-4" />
      case 'soreness_based':
        return <Heart className="w-4 h-4" />
      default:
        return null
    }
  }

  if (compact) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStateIcon()}
              <div>
                <p className="text-sm font-medium text-[#E6E9EF]">{assessment.shortLabel}</p>
                <p className="text-xs text-[#A4ACB8]">Readiness: {assessment.score}%</p>
              </div>
            </div>
            <Badge variant="outline" className={getStateBadgeColor()}>
              {assessment.confidence} confidence
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1A1F26] border-[#2B313A]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-[#E6E9EF]">
          {getStateIcon()}
          Recovery Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-semibold text-[#E6E9EF]">{assessment.shortLabel}</p>
            <p className="text-sm text-[#A4ACB8]">{assessment.coachMessage}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#E6E9EF]">{assessment.score}</p>
            <p className="text-xs text-[#A4ACB8]">readiness score</p>
          </div>
        </div>

        {/* Fatigue Breakdown */}
        {assessment.fatigueContributions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#A4ACB8] uppercase tracking-wide">Fatigue Factors</p>
            <div className="space-y-1.5">
              {assessment.fatigueContributions.slice(0, 3).map((contrib, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[#A4ACB8]">{getFatigueIcon(contrib.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#E6E9EF] capitalize">
                        {contrib.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[#A4ACB8]">{contrib.level}%</span>
                    </div>
                    <div className="h-1 bg-[#2B313A] rounded-full mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          contrib.level > 60 ? 'bg-red-500' :
                          contrib.level > 40 ? 'bg-orange-500' :
                          contrib.level > 20 ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${contrib.level}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Adjustments */}
        {adjustments.length > 0 && (
          <div className="pt-2 border-t border-[#2B313A]">
            <p className="text-xs font-medium text-[#A4ACB8] uppercase tracking-wide mb-2">
              Today&apos;s Adjustments
            </p>
            <ul className="space-y-1">
              {adjustments.slice(0, 3).map((adj, i) => (
                <li key={i} className="text-xs text-[#E6E9EF] flex items-start gap-2">
                  <span className="text-[#C1121F]">-</span>
                  {adj.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deload Warning */}
        {assessment.shouldDeload && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-sm text-orange-400 font-medium">Deload Recommended</p>
            <p className="text-xs text-orange-400/80 mt-1">
              Multiple signals suggest recovery is compromised. Consider a lighter week.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
