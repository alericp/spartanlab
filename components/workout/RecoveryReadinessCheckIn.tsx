'use client'

/**
 * RECOVERY READINESS CHECK-IN COMPONENT — Phase L2
 * 
 * Compact, optional pre-workout readiness check-in that captures:
 * - Overall readiness today
 * - Soreness level
 * - Sleep quality
 * - Joint pain (optional expansion)
 * 
 * Feeds into the L1 RecoveryAdaptationSnapshot through the L2 adapter pipeline.
 * 
 * UX Requirements:
 * - Fast mobile-friendly selections
 * - Optional skip
 * - No heavy modal
 * - Clear save/skip behavior
 * - Safe defaults when skipped
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import {
  type RecoveryReadinessCheckIn as CheckInType,
  createEmptyCheckIn,
  buildCheckInSignalsFromUserInput,
  deriveRecoveryAdaptationSnapshot,
  getRecoveryStatusLabel,
  deriveDeloadRecommendation,
  type RecoveryAdaptationSnapshot,
  type DeloadRecommendationDecision,
} from '@/lib/program/recovery-adaptation-snapshot-contract'

// =============================================================================
// TYPES
// =============================================================================

interface RecoveryReadinessCheckInProps {
  /** Called when user saves check-in with the full snapshot */
  onCheckInComplete: (checkIn: CheckInType, snapshot: RecoveryAdaptationSnapshot) => void
  /** Called when user skips check-in */
  onSkip: () => void
  /** Initial check-in data if resuming */
  initialCheckIn?: CheckInType | null
  /** Whether to show expanded joint pain section by default */
  defaultExpanded?: boolean
  /** Compact mode for inline display */
  compact?: boolean
}

type ReadinessOption = 'great' | 'normal' | 'low' | 'very_low'
type SorenessOption = 'none' | 'mild' | 'moderate' | 'severe'
type SleepOption = 'good' | 'normal' | 'poor' | 'very_poor'

// =============================================================================
// OPTION CONFIGS
// =============================================================================

const READINESS_OPTIONS: { value: ReadinessOption; label: string; color: string }[] = [
  { value: 'great', label: 'Great', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' },
  { value: 'normal', label: 'Normal', color: 'bg-sky-500/20 border-sky-500/40 text-sky-400' },
  { value: 'low', label: 'Low', color: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
  { value: 'very_low', label: 'Very Low', color: 'bg-red-500/20 border-red-500/40 text-red-400' },
]

const SORENESS_OPTIONS: { value: SorenessOption; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' },
  { value: 'mild', label: 'Mild', color: 'bg-sky-500/20 border-sky-500/40 text-sky-400' },
  { value: 'moderate', label: 'Moderate', color: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
  { value: 'severe', label: 'Severe', color: 'bg-red-500/20 border-red-500/40 text-red-400' },
]

const SLEEP_OPTIONS: { value: SleepOption; label: string; color: string }[] = [
  { value: 'good', label: 'Good', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' },
  { value: 'normal', label: 'Normal', color: 'bg-sky-500/20 border-sky-500/40 text-sky-400' },
  { value: 'poor', label: 'Poor', color: 'bg-amber-500/20 border-amber-500/40 text-amber-400' },
  { value: 'very_poor', label: 'Very Poor', color: 'bg-red-500/20 border-red-500/40 text-red-400' },
]

const JOINT_OPTIONS = ['wrist', 'elbow', 'shoulder', 'back', 'hip', 'knee', 'ankle', 'other'] as const

// =============================================================================
// COMPONENT
// =============================================================================

export function RecoveryReadinessCheckIn({
  onCheckInComplete,
  onSkip,
  initialCheckIn,
  defaultExpanded = false,
  compact = false,
}: RecoveryReadinessCheckInProps) {
  // ----- State -----
  const [readiness, setReadiness] = useState<ReadinessOption | null>(
    initialCheckIn?.readinessToday ?? null
  )
  const [soreness, setSoreness] = useState<SorenessOption | null>(
    initialCheckIn?.sorenessLevel ?? null
  )
  const [sleep, setSleep] = useState<SleepOption | null>(
    initialCheckIn?.sleepQuality ?? null
  )
  const [jointPainExpanded, setJointPainExpanded] = useState(defaultExpanded)
  const [selectedJoints, setSelectedJoints] = useState<string[]>(
    initialCheckIn?.jointPainAreas ?? []
  )

  // ----- Handlers -----
  const toggleJoint = useCallback((joint: string) => {
    setSelectedJoints(prev =>
      prev.includes(joint) ? prev.filter(j => j !== joint) : [...prev, joint]
    )
  }, [])

  const handleSave = useCallback(() => {
    const checkIn: CheckInType = {
      readinessToday: readiness,
      sorenessLevel: soreness,
      sleepQuality: sleep,
      jointPainReported: selectedJoints.length > 0,
      jointPainAreas: selectedJoints,
      notes: null,
      capturedAt: new Date().toISOString(),
    }

    // Derive snapshot from check-in
    const checkInSignals = buildCheckInSignalsFromUserInput(checkIn, 0)
    const snapshot = deriveRecoveryAdaptationSnapshot({
      profileRecovery: null, // L2 focuses on check-in; profile signals come from elsewhere
      workoutStress: null,
      checkIn: checkInSignals,
      weeklyStressSummary: null,
    })

    onCheckInComplete(checkIn, snapshot)
  }, [readiness, soreness, sleep, selectedJoints, onCheckInComplete])

  const hasAnySelection = readiness !== null || soreness !== null || sleep !== null

  // ----- Render -----
  return (
    <div
      className={`rounded-lg border border-[#2B313A] bg-[#1A1F26] ${compact ? 'p-3' : 'p-4'}`}
      data-phase-l2-readiness-input="true"
      data-readiness-level={readiness || 'not-selected'}
      data-soreness-level={soreness || 'not-selected'}
      data-sleep-quality={sleep || 'not-selected'}
      data-joint-pain-reported={selectedJoints.length > 0}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-[#6B7280] uppercase tracking-wider font-medium">
          Today&apos;s Readiness
        </p>
        <button
          onClick={onSkip}
          className="text-[10px] text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Readiness Section */}
      <div className="mb-3">
        <p className="text-[10px] text-[#A4ACB8] mb-2">How do you feel today?</p>
        <div className="flex flex-wrap gap-1.5">
          {READINESS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setReadiness(opt.value)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all ${
                readiness === opt.value
                  ? opt.color
                  : 'bg-[#252B33] border-[#2B313A] text-[#6B7280] hover:border-[#3B4149]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Soreness Section */}
      <div className="mb-3">
        <p className="text-[10px] text-[#A4ACB8] mb-2">Soreness level?</p>
        <div className="flex flex-wrap gap-1.5">
          {SORENESS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSoreness(opt.value)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all ${
                soreness === opt.value
                  ? opt.color
                  : 'bg-[#252B33] border-[#2B313A] text-[#6B7280] hover:border-[#3B4149]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sleep Section */}
      <div className="mb-3">
        <p className="text-[10px] text-[#A4ACB8] mb-2">Sleep quality?</p>
        <div className="flex flex-wrap gap-1.5">
          {SLEEP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSleep(opt.value)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all ${
                sleep === opt.value
                  ? opt.color
                  : 'bg-[#252B33] border-[#2B313A] text-[#6B7280] hover:border-[#3B4149]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Joint Pain Section (Expandable) */}
      <div className="mb-4">
        <button
          onClick={() => setJointPainExpanded(!jointPainExpanded)}
          className="flex items-center gap-1 text-[10px] text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        >
          {jointPainExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          <span>Any joint pain?</span>
          {selectedJoints.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px]">
              {selectedJoints.length}
            </span>
          )}
        </button>
        {jointPainExpanded && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {JOINT_OPTIONS.map(joint => (
              <button
                key={joint}
                onClick={() => toggleJoint(joint)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all capitalize ${
                  selectedJoints.includes(joint)
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-[#252B33] border-[#2B313A] text-[#6B7280] hover:border-[#3B4149]'
                }`}
              >
                {joint}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasAnySelection}
          size="sm"
          className="flex-1 bg-sky-600 hover:bg-sky-700 text-white text-[11px] h-8 disabled:opacity-50"
        >
          <Check size={14} className="mr-1" />
          Save Check-in
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          size="sm"
          className="text-[#6B7280] hover:text-[#A4ACB8] text-[11px] h-8"
        >
          <X size={14} className="mr-1" />
          Skip
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// COMPACT DISPLAY COMPONENT — Shows saved check-in status
// =============================================================================

interface RecoveryCheckInStatusProps {
  checkIn: CheckInType | null
  snapshot: RecoveryAdaptationSnapshot | null
  onEdit?: () => void
}

export function RecoveryCheckInStatus({
  checkIn,
  snapshot,
  onEdit,
}: RecoveryCheckInStatusProps) {
  if (!checkIn && !snapshot) {
    return null
  }

  const statusLabel = snapshot ? getRecoveryStatusLabel(snapshot) : null
  
  // [PHASE L4] Derive deload recommendation from L1 snapshot + L2 check-in
  const deloadDecision = deriveDeloadRecommendation(snapshot, checkIn)
  const showDeloadRecommendation = deloadDecision.active && deloadDecision.recommendationLevel !== 'NONE'

  return (
    <div
      className="rounded-md border border-[#2B313A] bg-[#1A1F26]/50 px-3 py-2"
      data-phase-l2-recovery-status="true"
      data-readiness-level={snapshot?.readinessLevel || 'unknown'}
      data-fatigue-level={snapshot?.fatigueLevel || 'unknown'}
      data-joint-risk-level={snapshot?.jointRiskLevel || 'unknown'}
      data-deload-signal={snapshot?.deloadSignal || 'none'}
      data-recovery-source-quality={snapshot?.sourceQuality || 'empty'}
      // [PHASE L4] Deload recommendation data attributes
      data-phase-l4-deload-recommendation={showDeloadRecommendation ? 'true' : 'false'}
      data-l4-deload-level={deloadDecision.recommendationLevel}
      data-l4-deload-active={deloadDecision.active ? 'true' : 'false'}
      data-l4-reason-count={deloadDecision.recommendationReasonCodes.length}
      data-l4-applied-to-program={deloadDecision.appliedToProgram ? 'true' : 'false'}
      data-l4-mutation-allowed={deloadDecision.mutationAllowed ? 'true' : 'false'}
      data-l4-recommendation-only={deloadDecision.recommendationOnly ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              snapshot?.readinessLevel === 'green' ? 'bg-emerald-500' :
              snapshot?.readinessLevel === 'yellow' ? 'bg-amber-400' :
              snapshot?.readinessLevel === 'orange' ? 'bg-orange-500' :
              snapshot?.readinessLevel === 'red' ? 'bg-red-500' :
              'bg-[#6B7280]'
            }`}
          />
          <p className="text-[11px] text-[#A4ACB8]">
            {statusLabel || (checkIn ? 'Check-in saved' : 'Recovery check-in')}
          </p>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
      {snapshot?.visibleCoachLine && (
        <p className="text-[10px] text-[#6B7280] mt-1">
          {snapshot.visibleCoachLine}
        </p>
      )}
      
      {/* [PHASE L4] Deload recommendation display — advisory only, no mutation */}
      {showDeloadRecommendation && (
        <div className="mt-2 pt-2 border-t border-[#2B313A]/50">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                deloadDecision.recommendationLevel === 'STRONGLY_RECOMMEND_DELOAD' ? 'bg-red-500' :
                deloadDecision.recommendationLevel === 'CONSIDER_DELOAD' ? 'bg-amber-500' :
                'bg-sky-400'
              }`}
            />
            <p className={`text-[10px] ${
              deloadDecision.recommendationLevel === 'STRONGLY_RECOMMEND_DELOAD' ? 'text-red-400/90' :
              deloadDecision.recommendationLevel === 'CONSIDER_DELOAD' ? 'text-amber-400/90' :
              'text-sky-400/80'
            }`}>
              {deloadDecision.recommendationLabel}
            </p>
          </div>
          <p className="text-[9px] text-[#6B7280] mt-0.5 ml-3.5">
            {deloadDecision.userFacingSummary}
          </p>
          <p className="text-[8px] text-[#4B5563] mt-1 ml-3.5 italic">
            Recommendation only — no automatic changes applied
          </p>
        </div>
      )}
    </div>
  )
}
