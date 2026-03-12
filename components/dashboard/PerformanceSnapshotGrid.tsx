import { Card } from '@/components/ui/card'
import { Target, Dumbbell, Calendar, ArrowUp, ArrowRight, Pause, AlertCircle } from 'lucide-react'
import type { PrimarySkillSummary, StrengthSummary, ProgramSummary, CurrentFocus } from '@/lib/dashboard-service'
import type { ReadinessStatus } from '@/types/skill-readiness'

const READINESS_CONFIG: Record<ReadinessStatus, { label: string; color: string; icon: React.ReactNode }> = {
  progress_now: { label: 'Ready', color: 'text-green-400', icon: <ArrowUp className="w-3 h-3" /> },
  micro_progress: { label: 'Micro', color: 'text-yellow-400', icon: <ArrowRight className="w-3 h-3" /> },
  stay_current: { label: 'Build', color: 'text-blue-400', icon: <Pause className="w-3 h-3" /> },
  stabilize: { label: 'Rest', color: 'text-orange-400', icon: <AlertCircle className="w-3 h-3" /> },
}

interface PerformanceSnapshotGridProps {
  skillSummary: PrimarySkillSummary
  strengthSummary: StrengthSummary
  programSummary: ProgramSummary
  focusSummary: CurrentFocus
}

export function PerformanceSnapshotGrid({
  skillSummary,
  strengthSummary,
  programSummary,
  focusSummary,
}: PerformanceSnapshotGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Primary Skill */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#0F1115] flex items-center justify-center">
            <Target className="w-4 h-4 text-[#C1121F]" />
          </div>
          {skillSummary.readinessStatus && (
            <div className={`flex items-center gap-1 ${READINESS_CONFIG[skillSummary.readinessStatus].color}`}>
              {READINESS_CONFIG[skillSummary.readinessStatus].icon}
              <span className="text-xs font-medium">
                {READINESS_CONFIG[skillSummary.readinessStatus].label}
              </span>
            </div>
          )}
          {!skillSummary.readinessStatus && skillSummary.hasData && (
            <span className="text-lg font-bold text-[#C1121F]">
              {skillSummary.progressScore.toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
          Primary Skill
        </p>
        <p className="font-semibold text-sm sm:text-base truncate">
          {skillSummary.displayName}
        </p>
        {skillSummary.hasData ? (
          <div>
            <p className="text-xs text-[#A4ACB8] mt-1 truncate">
              {skillSummary.currentLevelName} → {skillSummary.targetLevelName}
            </p>
            {skillSummary.weeklyDensity !== undefined && skillSummary.weeklyDensity > 0 && (
              <p className="text-xs text-[#6B7280] mt-0.5">
                {skillSummary.weeklyDensity}s weekly
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#6B7280] mt-1">Not tracking yet</p>
        )}
      </Card>

      {/* Top Pull Strength */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#0F1115] flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-[#C1121F]" />
          </div>
          {strengthSummary.pullTier && (
            <span className="text-xs font-medium text-blue-400">
              {strengthSummary.pullTier}
            </span>
          )}
        </div>
        <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
          Pull Strength
        </p>
        {strengthSummary.pullUp ? (
          <>
            <p className="font-semibold text-sm sm:text-base">
              +{strengthSummary.pullUp.weightAdded} x {strengthSummary.pullUp.reps}
            </p>
            <p className="text-xs text-[#A4ACB8] mt-1">
              {strengthSummary.pullRatio 
                ? `${(strengthSummary.pullRatio * 100).toFixed(0)}% BW`
                : `1RM: +${strengthSummary.pullUp.estimatedOneRM}`}
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-sm text-[#6B7280]">No records</p>
            <p className="text-xs text-[#6B7280] mt-1">Log a lift</p>
          </>
        )}
      </Card>

      {/* Top Push Strength */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#0F1115] flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-[#C1121F]" />
          </div>
          {strengthSummary.pushTier && (
            <span className="text-xs font-medium text-[#C1121F]">
              {strengthSummary.pushTier}
            </span>
          )}
        </div>
        <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
          Push Strength
        </p>
        {strengthSummary.dip ? (
          <>
            <p className="font-semibold text-sm sm:text-base">
              +{strengthSummary.dip.weightAdded} x {strengthSummary.dip.reps}
            </p>
            <p className="text-xs text-[#A4ACB8] mt-1">
              {strengthSummary.pushRatio 
                ? `${(strengthSummary.pushRatio * 100).toFixed(0)}% BW`
                : `1RM: +${strengthSummary.dip.estimatedOneRM}`}
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-sm text-[#6B7280]">No records</p>
            <p className="text-xs text-[#6B7280] mt-1">Log a lift</p>
          </>
        )}
      </Card>

      {/* Current Program */}
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#0F1115] flex items-center justify-center">
            <Calendar className="w-4 h-4 text-[#C1121F]" />
          </div>
        </div>
        <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">
          Program
        </p>
        {programSummary.hasData ? (
          <>
            <p className="font-semibold text-sm sm:text-base truncate">
              {programSummary.goalLabel}
            </p>
            <p className="text-xs text-[#A4ACB8] mt-1">
              {programSummary.daysPerWeek} days • {programSummary.sessionLength}min
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-sm text-[#6B7280]">No program</p>
            <p className="text-xs text-[#6B7280] mt-1">Build one</p>
          </>
        )}
      </Card>
    </div>
  )
}
