'use client'

import { Card } from '@/components/ui/card'
import { 
  Battery, 
  AlertTriangle, 
  TrendingDown, 
  Activity,
  CheckCircle2,
} from 'lucide-react'
import {
  deriveDeloadRecommendation,
  type RecoveryAdaptationSnapshot,
  type RecoveryReadinessCheckIn,
  type DeloadRecommendationDecision,
  type DeloadRecommendationLevel,
} from '@/lib/program/recovery-adaptation-snapshot-contract'

// =============================================================================
// PHASE L4.2 — DELOAD RECOMMENDATION CARD
// User-facing compact recovery recommendation surface.
// Consumes L4.1 deriveDeloadRecommendation() — does NOT recompute decision.
// Advisory only — no mutation, no automatic changes.
// =============================================================================

interface DeloadRecommendationCardProps {
  snapshot: RecoveryAdaptationSnapshot | null
  checkIn: RecoveryReadinessCheckIn | null
  /** If decision is pre-computed, pass it directly to avoid recomputation */
  precomputedDecision?: DeloadRecommendationDecision | null
  /** Compact mode for smaller display */
  compact?: boolean
}

/**
 * Get the display configuration for a recommendation level.
 */
function getRecommendationDisplay(level: DeloadRecommendationLevel): {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Battery
} {
  switch (level) {
    case 'STRONGLY_RECOMMEND_DELOAD':
      return {
        label: 'Deload Strongly Recommended',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: AlertTriangle,
      }
    case 'CONSIDER_DELOAD':
      return {
        label: 'Consider a Deload',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        icon: TrendingDown,
      }
    case 'WATCH':
      return {
        label: 'Monitor Recovery',
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10',
        borderColor: 'border-sky-500/30',
        icon: Activity,
      }
    case 'NONE':
    default:
      return {
        label: 'Continue as Planned',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        icon: CheckCircle2,
      }
  }
}

/**
 * Get human-readable reason chip labels from reason codes.
 */
function getReasonChipLabel(code: string): string {
  const labels: Record<string, string> = {
    LOW_READINESS: 'Low readiness',
    RED_READINESS: 'Low readiness',
    ORANGE_READINESS: 'Reduced readiness',
    HIGH_FATIGUE: 'High fatigue',
    VERY_HIGH_FATIGUE: 'Very high fatigue',
    HIGH_SORENESS: 'Elevated soreness',
    SEVERE_SORENESS: 'Severe soreness',
    POOR_SLEEP: 'Poor sleep',
    JOINT_PAIN_REPORTED: 'Joint caution',
    INJURY_CONSTRAINT_ACTIVE: 'Injury caution',
    MISSED_OR_PARTIAL_SESSION: 'Missed session',
    HIGH_WEEKLY_STRESS: 'High weekly stress',
    CONSECUTIVE_HARD_DAYS: 'Consecutive hard days',
    WEEKS_SINCE_DELOAD_HIGH: 'Extended without deload',
    PERFORMANCE_STAGNATION: 'Performance plateau',
    MULTIPLE_STRAIN_FACTORS: 'Multiple factors',
    DELOAD_SIGNAL_REQUIRED: 'Deload needed',
    DELOAD_SIGNAL_RECOMMENDED: 'Deload suggested',
    NO_DELOAD_FACTORS: 'No concerns',
  }
  return labels[code] || code.toLowerCase().replace(/_/g, ' ')
}

/**
 * DeloadRecommendationCard — L4.2 user-facing recovery recommendation surface.
 * 
 * Displays the L4.1 deload recommendation in a clean, compact, premium card.
 * This is ADVISORY ONLY — no automatic program changes are applied.
 */
export function DeloadRecommendationCard({
  snapshot,
  checkIn,
  precomputedDecision,
  compact = false,
}: DeloadRecommendationCardProps) {
  // Use precomputed decision if provided, otherwise derive from L4.1
  const decision = precomputedDecision ?? deriveDeloadRecommendation(snapshot, checkIn)
  
  // Get display configuration
  const display = getRecommendationDisplay(decision.recommendationLevel)
  const IconComponent = display.icon
  
  // Get top 4 reason chips (excluding NO_DELOAD_FACTORS for clean display)
  const reasonChips = decision.recommendationReasonCodes
    .filter(code => code !== 'NO_DELOAD_FACTORS')
    .slice(0, 4)
    .map(code => getReasonChipLabel(code))
  
  // Legacy safety: if no decision or empty source quality, show minimal fallback
  if (!decision || decision.sourceSignals.sourceQuality === null) {
    return (
      <Card 
        className="bg-[#1E1E1E] border-[#3A3A3A] p-4"
        data-phase-l4-deload-card="true"
        data-l4-card-status="no-data"
      >
        <div className="flex items-center gap-3">
          <Battery className="w-5 h-5 text-[#6B7280]" />
          <div>
            <p className="text-sm text-[#A5A5A5]">Recovery Recommendation</p>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Complete a check-in to see your recovery recommendation.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (compact) {
    // Compact mode: single line status chip
    return (
      <div
        className={`rounded-lg border px-3 py-2 ${display.bgColor} ${display.borderColor}`}
        data-phase-l4-deload-card="true"
        data-l4-card-status="active"
        data-l4-deload-level={decision.recommendationLevel}
        data-l4-applied-to-program="false"
        data-l4-mutation-allowed="false"
        data-l4-recommendation-only="true"
      >
        <div className="flex items-center gap-2">
          <IconComponent className={`w-4 h-4 ${display.color}`} />
          <span className={`text-sm font-medium ${display.color}`}>
            {display.label}
          </span>
        </div>
        {reasonChips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {reasonChips.slice(0, 2).map((chip, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2A2A] text-[#A5A5A5]"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Full card mode
  return (
    <Card 
      className="bg-[#1E1E1E] border-[#3A3A3A] p-5"
      data-phase-l4-deload-card="true"
      data-l4-card-status="active"
      data-l4-deload-level={decision.recommendationLevel}
      data-l4-reason-count={decision.recommendationReasonCodes.length}
      data-l4-applied-to-program="false"
      data-l4-mutation-allowed="false"
      data-l4-recommendation-only="true"
    >
      <h3 className="text-sm font-medium text-[#A5A5A5] mb-3">
        Recovery Recommendation
      </h3>
      
      {/* Main recommendation status */}
      <div className={`rounded-lg border p-4 ${display.bgColor} ${display.borderColor}`}>
        <div className="flex items-center gap-3 mb-2">
          <IconComponent className={`w-6 h-6 ${display.color}`} />
          <div className={`text-lg font-semibold ${display.color}`}>
            {display.label}
          </div>
        </div>
        <p className="text-sm text-[#E5E5E5]">
          {decision.userFacingSummary}
        </p>
      </div>
      
      {/* Reason chips */}
      {reasonChips.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-[#6B7280] mb-2">Contributing factors</p>
          <div className="flex flex-wrap gap-2">
            {reasonChips.map((chip, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-md bg-[#2A2A2A] text-[#A5A5A5] border border-[#3A3A3A]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Non-mutation guarantee */}
      <div className="mt-4 pt-3 border-t border-[#2A2A2A]">
        <p className="text-[10px] text-[#6B7280] italic">
          Recommendation only — no automatic program changes applied
        </p>
      </div>
    </Card>
  )
}

/**
 * Compact inline status for use in headers or summary rows.
 */
export function DeloadRecommendationInline({
  snapshot,
  checkIn,
  precomputedDecision,
}: {
  snapshot: RecoveryAdaptationSnapshot | null
  checkIn: RecoveryReadinessCheckIn | null
  precomputedDecision?: DeloadRecommendationDecision | null
}) {
  const decision = precomputedDecision ?? deriveDeloadRecommendation(snapshot, checkIn)
  const display = getRecommendationDisplay(decision.recommendationLevel)
  const IconComponent = display.icon
  
  return (
    <div 
      className="flex items-center gap-1.5"
      data-phase-l4-inline="true"
      data-l4-deload-level={decision.recommendationLevel}
    >
      <IconComponent className={`w-3.5 h-3.5 ${display.color}`} />
      <span className={`text-xs ${display.color}`}>
        {display.label}
      </span>
    </div>
  )
}
