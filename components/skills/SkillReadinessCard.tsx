'use client'

import { Card } from '@/components/ui/card'
import { 
  ArrowUp, 
  ArrowRight, 
  Pause, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  Activity,
  Target,
  Zap,
} from 'lucide-react'
import type { SkillAnalysis, ReadinessStatus } from '@/types/skill-readiness'
import { getSkillLevel, getMicroProgression } from '@/lib/skill-progression-rules'
import { getSkillTrackerContext } from '@/lib/adaptive-athlete-engine'

interface SkillReadinessCardProps {
  analysis: SkillAnalysis
  levelName: string
  targetLevelName: string
}

const STATUS_CONFIG: Record<ReadinessStatus, { 
  label: string
  color: string
  bgColor: string
  icon: React.ReactNode 
}> = {
  progress_now: {
    label: 'Ready to Progress',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    icon: <ArrowUp className="w-5 h-5" />,
  },
  micro_progress: {
    label: 'Micro-Progress',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    icon: <ArrowRight className="w-5 h-5" />,
  },
  stay_current: {
    label: 'Stay Current',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    icon: <Pause className="w-5 h-5" />,
  },
  stabilize: {
    label: 'Stabilize First',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
    icon: <AlertCircle className="w-5 h-5" />,
  },
}

const TREND_ICONS = {
  improving: <TrendingUp className="w-4 h-4 text-green-400" />,
  stable: <Minus className="w-4 h-4 text-blue-400" />,
  declining: <TrendingDown className="w-4 h-4 text-orange-400" />,
  insufficient_data: <Clock className="w-4 h-4 text-[#A5A5A5]" />,
}

const LIMITER_LABELS: Record<string, string> = {
  insufficient_density: 'Training Density',
  insufficient_ownership: 'Level Ownership',
  insufficient_support_strength: 'Support Strength',
  unstable_trend: 'Performance Trend',
  recent_fatigue: 'Accumulated Fatigue',
  no_data: 'No Data',
  none: 'None',
}

export function SkillReadinessCard({ 
  analysis, 
  levelName,
  targetLevelName,
}: SkillReadinessCardProps) {
  const status = STATUS_CONFIG[analysis.readiness.status]
  const { readiness, density, nextSteps, microProgression } = analysis
  const engineContext = getSkillTrackerContext()

  return (
    <div className="space-y-4">
      {/* Engine Alert - Delay/Boost Recommendation */}
      {engineContext.shouldDelayProgression && engineContext.delayReason && (
        <Card className="p-3 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">Engine Recommendation</p>
              <p className="text-xs text-[#A5A5A5] mt-0.5">{engineContext.delayReason}</p>
            </div>
          </div>
        </Card>
      )}
      {engineContext.readinessBoost && engineContext.boostReason && !engineContext.shouldDelayProgression && (
        <Card className="p-3 border border-green-500/30 bg-green-500/5">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-400">Optimal Conditions</p>
              <p className="text-xs text-[#A5A5A5] mt-0.5">{engineContext.boostReason}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Readiness Status Banner */}
      <Card className={`p-4 border ${status.bgColor}`}>
        <div className="flex items-center gap-3">
          <div className={status.color}>
            {status.icon}
          </div>
          <div className="flex-1">
            <p className={`font-semibold ${status.color}`}>{status.label}</p>
            <p className="text-sm text-[#A5A5A5]">
              {readiness.primaryLimiter !== 'none' && readiness.primaryLimiter !== 'no_data' && (
                <>Main limiter: {LIMITER_LABELS[readiness.primaryLimiter]}</>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#A5A5A5]">Confidence</p>
            <p className="text-lg font-bold">{readiness.confidence}%</p>
          </div>
        </div>
      </Card>

      {/* Micro-Progression Recommendation */}
      {microProgression && readiness.status === 'micro_progress' && (
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="font-semibold text-yellow-400">{microProgression.name}</p>
              <p className="text-sm text-[#A5A5A5] mt-1">{microProgression.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {microProgression.cues.map((cue, i) => (
                  <span 
                    key={i}
                    className="text-xs bg-[#1A1A1A] px-2 py-1 rounded text-[#A5A5A5]"
                  >
                    {cue}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <p className="text-xs text-[#A5A5A5] mb-1">Best Hold</p>
          <p className="text-2xl font-bold">{analysis.bestHold}s</p>
        </Card>
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <p className="text-xs text-[#A5A5A5] mb-1">Avg Hold</p>
          <p className="text-2xl font-bold">{analysis.averageHold}s</p>
        </Card>
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <p className="text-xs text-[#A5A5A5] mb-1">Session Density</p>
          <p className="text-2xl font-bold">{density.sessionDensity}s</p>
        </Card>
        <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
          <p className="text-xs text-[#A5A5A5] mb-1">Weekly Density</p>
          <p className="text-2xl font-bold">{density.weeklyDensity}s</p>
        </Card>
      </div>

      {/* Factor Scores */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
        <p className="text-sm font-medium mb-3">Readiness Factors</p>
        <div className="space-y-3">
          <FactorBar 
            label="Level Ownership" 
            score={readiness.detailedFactors.ownershipScore}
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
          <FactorBar 
            label="Support Strength" 
            score={readiness.detailedFactors.supportStrengthScore}
            icon={<Activity className="w-4 h-4" />}
          />
          <FactorBar 
            label="Training Density" 
            score={readiness.detailedFactors.densityScore}
            icon={<Target className="w-4 h-4" />}
          />
          <FactorBar 
            label="Performance Trend" 
            score={readiness.detailedFactors.trendScore}
            icon={TREND_ICONS[analysis.recentTrend]}
          />
        </div>
      </Card>

      {/* What to Train Next */}
      <Card className="bg-[#2A2A2A] border-[#3A3A3A] p-4">
        <p className="text-sm font-medium mb-3">What to Train Next</p>
        <div className="space-y-3">
          {/* Priorities */}
          <div>
            <p className="text-xs text-[#A5A5A5] mb-2">Priorities</p>
            <div className="flex flex-wrap gap-2">
              {nextSteps.priorities.map((priority, i) => (
                <span 
                  key={i}
                  className="text-sm bg-[#E63946]/10 text-[#E63946] px-3 py-1 rounded-full"
                >
                  {priority}
                </span>
              ))}
            </div>
          </div>

          {/* Exercises */}
          {nextSteps.exercises.length > 0 && (
            <div>
              <p className="text-xs text-[#A5A5A5] mb-2">Recommended</p>
              <div className="space-y-2">
                {nextSteps.exercises.map((ex, i) => (
                  <div key={i} className="bg-[#1A1A1A] rounded-lg p-3">
                    <p className="font-medium text-sm">{ex.name}</p>
                    <p className="text-xs text-[#A5A5A5]">{ex.purpose}</p>
                    {ex.setsReps && (
                      <p className="text-xs text-[#E63946] mt-1">{ex.setsReps}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus Areas */}
          {nextSteps.focusAreas.length > 0 && (
            <div>
              <p className="text-xs text-[#A5A5A5] mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {nextSteps.focusAreas.map((area, i) => (
                  <span 
                    key={i}
                    className="text-xs bg-[#1A1A1A] px-2 py-1 rounded text-[#A5A5A5]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Science Explanation */}
      <Card className="bg-[#1A1A1A] border-[#3A3A3A] p-4">
        <p className="text-sm text-[#A5A5A5] leading-relaxed">
          {readiness.explanation}
        </p>
      </Card>
    </div>
  )
}

// Factor Bar Component
function FactorBar({ 
  label, 
  score, 
  icon 
}: { 
  label: string
  score: number
  icon: React.ReactNode 
}) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-blue-500'
    if (s >= 40) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm text-[#A5A5A5]">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-medium">{score}%</span>
      </div>
      <div className="w-full bg-[#1A1A1A] rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  )
}
