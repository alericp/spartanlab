/**
 * =============================================================================
 * RECOVERY / READINESS READ-ONLY ANALYZER
 * =============================================================================
 *
 * MASTER-8C.19 / AB20.4.12 — Recovery / Readiness Read-Only Bridge
 *
 * PURPOSE:
 * Provide a single, deterministic, pure read-only analyzer that consolidates
 * available recovery/readiness truth into an honest branch-level model for
 * consumption by Plan Logic / AI Intelligence Foundation Map.
 *
 * THIS MODULE:
 * - Consumes existing adaptive foundation, program balance, session structure
 * - Produces honest recovery/readiness signals with confidence and source basis
 * - Reports missing sources honestly when data is unavailable
 * - Does NOT mutate any program, session, exercise, or workout data
 * - Does NOT invent recovery/soreness/fatigue data that does not exist
 *
 * PURITY CONTRACT:
 * - No React, no DOM, no localStorage, no fetch, no DB
 * - No Date.now(), no Math.random()
 * - No side effects, no mutation
 * - No `as any`, no @ts-ignore, no @ts-expect-error
 * - Deterministic: same input always produces same output
 */

import type { AdaptiveFoundationModel } from './adaptive-foundation-model'

// =============================================================================
// TYPES — RECOVERY/READINESS READ-ONLY MODEL
// =============================================================================

export type RecoveryReadinessStatus =
  | 'read_only_active'
  | 'limited_sources'
  | 'needs_more_data'
  | 'unavailable'

export type ReadinessLevel =
  | 'ready'
  | 'watch'
  | 'reduced'
  | 'protected'
  | 'unknown'

export type RecoveryConfidence = 'low' | 'medium' | 'high'

export type RecoverySignalSeverity = 'info' | 'watch' | 'moderate' | 'high'

export interface RecoveryReadinessSignal {
  id: string
  label: string
  severity: RecoverySignalSeverity
  source: string
  explanation: string
  affectedDays?: string[]
}

export interface RecoveryReadinessReadonlyModel {
  status: RecoveryReadinessStatus
  mutationStatus: 'mutation_locked'
  readinessLevel: ReadinessLevel
  confidence: RecoveryConfidence
  headline: string
  summary: string
  signals: RecoveryReadinessSignal[]
  sourceBasis: string[]
  missingSources: string[]
  blockedActions: string[]
  allowedReadOnlyActions: string[]
  nextSafeAction: string
}

// =============================================================================
// TYPES — INPUT
// =============================================================================

export interface RecoveryReadinessSessionInput {
  dayLabel: string
  dayNumber: number
  dayRole?: string
  exerciseCount: number
  totalSets: number
  hasHighSkillExercises: boolean
  hasTendonHeavyExercises: boolean
  methodsApplied?: string[]
}

export interface RecoveryReadinessReadonlyInput {
  programId?: string
  programName?: string
  sessions: RecoveryReadinessSessionInput[]
  /** From adaptive foundation model sourceStatus array */
  adaptiveFoundationSourceStatus?: Array<{
    key: string
    label: string
    status: string
    detail: string
  }>
  /** From adaptive foundation model constraints */
  constraints?: Array<{
    code: string
    label: string
    severity: string
    category?: string
    detail?: string
  }>
  /** From adaptive foundation model dominant limiters */
  dominantLimiters?: string[]
  /** From adaptive foundation model readiness status */
  readinessStatus?: string | null
  /** Program balance tissue signals if available */
  programBalanceTissueSignals?: Array<{
    area: string
    riskLevel: string
  }>
  /** Whether completed workout evidence exists */
  hasCompletedWorkoutEvidence?: boolean
  /** Whether readiness check-in data exists */
  hasReadinessCheckIn?: boolean
  /** Whether workout history exists */
  hasWorkoutHistory?: boolean
  /** Existing safeguard intelligence risk level */
  safeguardRiskLevel?: string
}

// =============================================================================
// HELPERS
// =============================================================================

function slugifyIdPart(value: string | undefined | null): string {
  if (!value) return 'unknown'
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'unknown'
}

// High-skill exercises that demand more recovery
const HIGH_SKILL_KEYWORDS = [
  'planche', 'lever', 'handstand', 'muscle up', 'muscle-up',
  'iron cross', 'maltese', 'victorian', 'one arm', 'one-arm',
  'flag', 'L-sit', 'V-sit', 'manna',
]

// Tendon-heavy patterns
const TENDON_HEAVY_KEYWORDS = [
  'planche', 'lever', 'maltese', 'iron cross', 'victorian',
  'straight arm', 'cross pull', 'pelican', 'ring',
]

export function classifySessionRecoveryDemand(
  exerciseCount: number,
  totalSets: number,
  hasHighSkill: boolean,
  hasTendonHeavy: boolean,
  methods?: string[]
): 'low' | 'moderate' | 'high' | 'very_high' {
  let score = 0

  // Volume scoring
  if (totalSets >= 25) score += 3
  else if (totalSets >= 18) score += 2
  else if (totalSets >= 12) score += 1

  // Exercise count
  if (exerciseCount >= 8) score += 1

  // Skill complexity
  if (hasHighSkill) score += 2
  if (hasTendonHeavy) score += 2

  // Method density
  if (methods && methods.length >= 2) score += 1

  if (score >= 6) return 'very_high'
  if (score >= 4) return 'high'
  if (score >= 2) return 'moderate'
  return 'low'
}

// =============================================================================
// MAIN RESOLVER
// =============================================================================

export function resolveRecoveryReadinessReadonly(
  input: RecoveryReadinessReadonlyInput
): RecoveryReadinessReadonlyModel {
  const signals: RecoveryReadinessSignal[] = []
  const sourceBasis: string[] = []
  const missingSources: string[] = []
  let signalIndex = 0

  // -------------------------------------------------------------------------
  // 1. Assess available sources
  // -------------------------------------------------------------------------

  const hasAdaptiveFoundation = !!(
    input.adaptiveFoundationSourceStatus?.length ||
    input.constraints?.length ||
    input.dominantLimiters?.length
  )

  const hasProgramStructure = input.sessions.length > 0
  const hasBalanceData = !!(input.programBalanceTissueSignals?.length)
  const hasSafeguardData = !!(input.safeguardRiskLevel)
  const hasWorkoutHistory = input.hasWorkoutHistory === true
  const hasReadinessCheckIn = input.hasReadinessCheckIn === true
  const hasCompletedWorkoutEvidence = input.hasCompletedWorkoutEvidence === true

  if (hasProgramStructure) sourceBasis.push('program_structure')
  if (hasAdaptiveFoundation) sourceBasis.push('adaptive_foundation')
  if (hasBalanceData) sourceBasis.push('program_balance')
  if (hasSafeguardData) sourceBasis.push('safeguard_intelligence')
  if (hasWorkoutHistory) sourceBasis.push('workout_history')
  if (hasReadinessCheckIn) sourceBasis.push('readiness_checkin')
  if (hasCompletedWorkoutEvidence) sourceBasis.push('completed_workout_evidence')

  // Always-missing sources (app doesn't collect these yet)
  if (!hasCompletedWorkoutEvidence) missingSources.push('completed_workout_feedback')
  if (!hasReadinessCheckIn) missingSources.push('readiness_checkin')
  if (!hasWorkoutHistory) missingSources.push('recent_rpe_trend')
  missingSources.push('sleep_or_recovery_checkin')
  missingSources.push('soreness_or_pain_notes')

  // -------------------------------------------------------------------------
  // 2. No sources at all — unavailable
  // -------------------------------------------------------------------------

  if (sourceBasis.length === 0) {
    return {
      status: 'unavailable',
      mutationStatus: 'mutation_locked',
      readinessLevel: 'unknown',
      confidence: 'low',
      headline: 'No recovery data available',
      summary: 'No program structure, adaptive foundation, or external recovery signals are available for analysis.',
      signals: [],
      sourceBasis: [],
      missingSources,
      blockedActions: ['future_session_mutation', 'deload_automation', 'exercise_substitution'],
      allowedReadOnlyActions: ['display_branch_status'],
      nextSafeAction: 'Collect workout feedback and readiness data to enable recovery scoring.',
    }
  }

  // -------------------------------------------------------------------------
  // 3. Analyze session recovery demands from program structure
  // -------------------------------------------------------------------------

  if (hasProgramStructure) {
    const sessionDemands = input.sessions.map(s => ({
      ...s,
      demand: classifySessionRecoveryDemand(
        s.exerciseCount,
        s.totalSets,
        s.hasHighSkillExercises,
        s.hasTendonHeavyExercises,
        s.methodsApplied
      ),
    }))

    // High-demand session signals
    const highDemandDays = sessionDemands.filter(d =>
      d.demand === 'high' || d.demand === 'very_high'
    )

    if (highDemandDays.length > 0) {
      signals.push({
        id: `recovery-session-demand-high-${signalIndex++}`,
        label: `High recovery demand: ${highDemandDays.length} session${highDemandDays.length > 1 ? 's' : ''}`,
        severity: highDemandDays.some(d => d.demand === 'very_high') ? 'moderate' : 'watch',
        source: 'program_structure',
        explanation: `${highDemandDays.map(d => d.dayLabel).join(', ')} ${highDemandDays.length > 1 ? 'have' : 'has'} high volume/skill complexity requiring adequate recovery.`,
        affectedDays: highDemandDays.map(d => d.dayLabel),
      })
    }

    // Total weekly volume signal
    const totalWeeklySets = sessionDemands.reduce((sum, s) => sum + s.totalSets, 0)
    if (totalWeeklySets >= 60) {
      signals.push({
        id: `recovery-weekly-volume-high-${signalIndex++}`,
        label: 'Elevated weekly volume',
        severity: totalWeeklySets >= 80 ? 'high' : 'moderate',
        source: 'program_structure',
        explanation: `Total weekly volume is ${totalWeeklySets} sets. High volume demands careful recovery management.`,
      })
    } else if (totalWeeklySets >= 40) {
      signals.push({
        id: `recovery-weekly-volume-moderate-${signalIndex++}`,
        label: 'Moderate weekly volume',
        severity: 'info',
        source: 'program_structure',
        explanation: `Total weekly volume is ${totalWeeklySets} sets. Monitor for accumulation over mesocycle.`,
      })
    }

    // Consecutive high-demand days
    for (let i = 0; i < sessionDemands.length - 1; i++) {
      const current = sessionDemands[i]
      const next = sessionDemands[i + 1]
      if (
        (current.demand === 'high' || current.demand === 'very_high') &&
        (next.demand === 'high' || next.demand === 'very_high')
      ) {
        signals.push({
          id: `recovery-consecutive-high-${slugifyIdPart(current.dayLabel)}-${signalIndex++}`,
          label: 'Consecutive high-demand sessions',
          severity: 'watch',
          source: 'program_structure',
          explanation: `${current.dayLabel} and ${next.dayLabel} are both high-demand. Adjacent hard days increase recovery need.`,
          affectedDays: [current.dayLabel, next.dayLabel],
        })
        break // Only report first occurrence to avoid clutter
      }
    }

    // Skill intensity signal
    const skillHeavyDays = sessionDemands.filter(d => d.hasHighSkillExercises)
    if (skillHeavyDays.length >= 3) {
      signals.push({
        id: `recovery-skill-frequency-${signalIndex++}`,
        label: 'High skill frequency',
        severity: 'watch',
        source: 'program_structure',
        explanation: `${skillHeavyDays.length} sessions include high-skill exercises. CNS recovery from skill work is often underestimated.`,
      })
    }
  }

  // -------------------------------------------------------------------------
  // 4. Consume adaptive foundation constraint/limiter signals
  // -------------------------------------------------------------------------

  if (hasAdaptiveFoundation) {
    // Check dominant limiters for recovery-related signals
    const recoveryLimiters = (input.dominantLimiters || []).filter(l =>
      /recovery|fatigue|overreach|deload|strain|stress|sleep/i.test(l)
    )

    if (recoveryLimiters.length > 0) {
      signals.push({
        id: `recovery-limiter-${signalIndex++}`,
        label: 'Recovery-related constraint detected',
        severity: 'watch',
        source: 'adaptive_foundation',
        explanation: `Adaptive Foundation reports: ${recoveryLimiters.slice(0, 2).join(', ')}.`,
      })
    }

    // Check constraints for deload/fatigue/recovery signals
    const recoveryConstraints = (input.constraints || []).filter(c =>
      /recovery|fatigue|deload|overreach|strain/i.test(c.code) ||
      /recovery|fatigue|deload|overreach|strain/i.test(c.label)
    )

    for (const constraint of recoveryConstraints.slice(0, 2)) {
      signals.push({
        id: `recovery-constraint-${slugifyIdPart(constraint.code)}-${signalIndex++}`,
        label: constraint.label,
        severity: constraint.severity === 'major' ? 'high'
          : constraint.severity === 'moderate' ? 'moderate'
          : 'watch',
        source: 'adaptive_foundation',
        explanation: constraint.detail || `Constraint: ${constraint.label}`,
      })
    }

    // Check readiness source status
    const readinessSource = (input.adaptiveFoundationSourceStatus || []).find(
      s => s.key === 'readiness_recovery'
    )

    if (readinessSource) {
      if (readinessSource.status === 'active') {
        signals.push({
          id: `recovery-readiness-source-active-${signalIndex++}`,
          label: 'Readiness data contributing',
          severity: 'info',
          source: 'adaptive_foundation',
          explanation: readinessSource.detail || 'Recovery data is active in the adaptive model.',
        })
      } else if (readinessSource.status === 'missing' || readinessSource.status === 'not_connected') {
        signals.push({
          id: `recovery-readiness-source-missing-${signalIndex++}`,
          label: 'No readiness data connected',
          severity: 'watch',
          source: 'adaptive_foundation',
          explanation: readinessSource.detail || 'Readiness/recovery data is not yet connected to the adaptive model.',
        })
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5. Consume safeguard risk level
  // -------------------------------------------------------------------------

  if (hasSafeguardData && input.safeguardRiskLevel) {
    const riskLevel = input.safeguardRiskLevel
    if (riskLevel === 'elevated' || riskLevel === 'high') {
      signals.push({
        id: `recovery-safeguard-risk-${signalIndex++}`,
        label: `Safeguard risk: ${riskLevel}`,
        severity: riskLevel === 'high' ? 'high' : 'moderate',
        source: 'safeguard_intelligence',
        explanation: `Tendon/joint safeguard branch reports ${riskLevel} risk, which increases recovery demands.`,
      })
    }
  }

  // -------------------------------------------------------------------------
  // 6. Consume program balance tissue signals
  // -------------------------------------------------------------------------

  if (hasBalanceData) {
    const elevatedTissue = (input.programBalanceTissueSignals || []).filter(
      t => t.riskLevel === 'elevated' || t.riskLevel === 'high'
    )

    if (elevatedTissue.length > 0) {
      signals.push({
        id: `recovery-tissue-stress-${signalIndex++}`,
        label: `Tissue stress: ${elevatedTissue.length} area${elevatedTissue.length > 1 ? 's' : ''} elevated`,
        severity: 'watch',
        source: 'program_balance',
        explanation: `${elevatedTissue.map(t => t.area).slice(0, 3).join(', ')} show elevated stress — may need extra recovery.`,
      })
    }
  }

  // -------------------------------------------------------------------------
  // 7. Determine overall readiness level and confidence
  // -------------------------------------------------------------------------

  const highSeverityCount = signals.filter(s => s.severity === 'high').length
  const moderateCount = signals.filter(s => s.severity === 'moderate').length
  const watchCount = signals.filter(s => s.severity === 'watch').length

  let readinessLevel: ReadinessLevel
  if (highSeverityCount >= 2) {
    readinessLevel = 'protected'
  } else if (highSeverityCount >= 1 || moderateCount >= 2) {
    readinessLevel = 'reduced'
  } else if (moderateCount >= 1 || watchCount >= 2) {
    readinessLevel = 'watch'
  } else if (signals.length > 0) {
    readinessLevel = 'ready'
  } else {
    readinessLevel = 'unknown'
  }

  // Confidence based on source breadth
  let confidence: RecoveryConfidence
  if (sourceBasis.length >= 4 && (hasWorkoutHistory || hasCompletedWorkoutEvidence)) {
    confidence = 'high'
  } else if (sourceBasis.length >= 2) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  // Status classification
  let status: RecoveryReadinessStatus
  if (sourceBasis.length >= 3) {
    status = 'read_only_active'
  } else if (sourceBasis.length >= 1) {
    status = 'limited_sources'
  } else {
    status = 'needs_more_data'
  }

  // -------------------------------------------------------------------------
  // 8. Compose headline/summary
  // -------------------------------------------------------------------------

  const readinessLabels: Record<ReadinessLevel, string> = {
    ready: 'Ready to train',
    watch: 'Recovery watch',
    reduced: 'Reduced capacity',
    protected: 'Protected / recovery needed',
    unknown: 'Insufficient recovery data',
  }

  const headline = readinessLabels[readinessLevel]

  let summary: string
  if (status === 'limited_sources' || status === 'needs_more_data') {
    summary = `Plan-derived recovery assessment only. ${signals.length} signal${signals.length !== 1 ? 's' : ''} detected from ${sourceBasis.join(', ')}. Missing: ${missingSources.slice(0, 3).join(', ')}.`
  } else {
    summary = `${signals.length} recovery signal${signals.length !== 1 ? 's' : ''} detected from ${sourceBasis.join(', ')}. Recovery assessment is read-only — no workouts changed.`
  }

  return {
    status,
    mutationStatus: 'mutation_locked',
    readinessLevel,
    confidence,
    headline,
    summary,
    signals: signals.slice(0, 8), // Cap at 8 to avoid bloat
    sourceBasis,
    missingSources: missingSources.slice(0, 5),
    blockedActions: [
      'future_session_mutation',
      'deload_automation',
      'exercise_substitution',
      'warmup_cooldown_change',
    ],
    allowedReadOnlyActions: [
      'display_branch_status',
      'surface_recovery_signals',
      'report_missing_sources',
    ],
    nextSafeAction: 'Continue readiness source expansion; mutation writer pending stronger evidence.',
  }
}

// =============================================================================
// BRANCH SUMMARY HELPER — for compact UI display
// =============================================================================

export function getRecoveryReadinessBranchSummary(
  model: RecoveryReadinessReadonlyModel
): {
  statusLabel: string
  topSignals: string[]
  sourceList: string[]
  missingList: string[]
} {
  return {
    statusLabel: `${model.readinessLevel} / ${model.confidence} confidence`,
    topSignals: model.signals.slice(0, 3).map(s => s.label),
    sourceList: model.sourceBasis.slice(0, 3),
    missingList: model.missingSources.slice(0, 3),
  }
}
