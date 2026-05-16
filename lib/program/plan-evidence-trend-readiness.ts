/**
 * ============================================================================
 * MASTER-8C.28 / AB20.4.21 — EVIDENCE TREND CLASSIFICATION / PLAN-LEVEL
 *                             READINESS SCORING (READ-ONLY)
 * ============================================================================
 *
 * Pure, deterministic, read-only model that classifies the connected workout
 * evidence into a plan-level trend and readiness posture.
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. No mutation — never changes program, sessions, exercises, sets, reps.
 *   4. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   5. Derives from existing PlanEvidenceReadonlyHookModel and
 *      CoachRecsWorkoutEvidenceSummary — never duplicates storage reads.
 *   6. Never claims applied adaptation or future-session changes.
 */

import type { PlanEvidenceReadonlyHookModel } from './plan-evidence-readonly-hook'
import type { CoachRecsWorkoutEvidenceSummary } from './coach-recommendation-workout-evidence-readonly-bridge'

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanEvidenceTrendClassification =
  | 'insufficient_evidence'
  | 'evidence_connected'
  | 'monitoring_pattern'
  | 'caution_pattern_detected'
  | 'recovery_pressure_detected'
  | 'progression_signal_detected'
  | 'ready_for_review_not_mutation'

export type PlanReadinessPosture =
  | 'collect_more_evidence'
  | 'monitor_only'
  | 'review_recommended'
  | 'caution_review'
  | 'future_mutation_blocked_readonly'

export interface PlanEvidenceTrendReadinessModel {
  readonly status: 'unavailable' | 'insufficient' | 'classified_read_only'
  readonly classification: PlanEvidenceTrendClassification
  readonly readinessPosture: PlanReadinessPosture
  readonly confidence: 'insufficient' | 'low' | 'medium' | 'high'

  readonly headline: string
  readonly summary: string
  readonly evidenceLabel: string | null
  readonly sourceQualityLabel: string
  readonly trendSignals: readonly string[]
  readonly readinessReasons: readonly string[]
  readonly missingEvidence: readonly string[]

  readonly noProgramChangesApplied: true
  readonly noFutureSessionChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
  readonly noMethodPlannerChangesApplied: true
  readonly mutationStatus: 'read_only_not_applied'

  readonly nextSafeAction: string
}

// ─── Input ──────────────────────────────────────────────────────────────────

export interface ResolvePlanEvidenceTrendReadinessInput {
  readonly planEvidenceHookModel?: PlanEvidenceReadonlyHookModel | null
  readonly workoutEvidenceSummary?: CoachRecsWorkoutEvidenceSummary | null
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MUTATION_LOCKS = {
  noProgramChangesApplied: true as const,
  noFutureSessionChangesApplied: true as const,
  noLiveWorkoutChangesApplied: true as const,
  noMethodPlannerChangesApplied: true as const,
  mutationStatus: 'read_only_not_applied' as const,
}

// ─── Resolver ───────────────────────────────────────────────────────────────

export function resolvePlanEvidenceTrendReadiness(
  input: ResolvePlanEvidenceTrendReadinessInput
): PlanEvidenceTrendReadinessModel {
  const hook = input.planEvidenceHookModel
  const ev = input.workoutEvidenceSummary

  // ── Unavailable: no plan evidence hook ────────────────────────────────
  if (!hook || hook.status === 'unavailable') {
    return {
      status: 'unavailable',
      classification: 'insufficient_evidence',
      readinessPosture: 'collect_more_evidence',
      confidence: 'insufficient',
      headline: 'Trend classification unavailable',
      summary: 'No plan evidence hook model exists. Evidence trend classification requires the plan evidence hook to be connected first.',
      evidenceLabel: null,
      sourceQualityLabel: 'No source data',
      trendSignals: [],
      readinessReasons: ['Plan evidence hook is unavailable'],
      missingEvidence: ['Plan evidence hook', 'Coach Recs candidate model', 'Workout evidence'],
      nextSafeAction: 'Connect plan evidence hook by building source branch coverage and logging workouts',
      ...MUTATION_LOCKS,
    }
  }

  // ── Insufficient: hook exists but no evidence connected ───────────────
  if (hook.status === 'waiting_for_evidence' || !ev || ev.quality === 'none') {
    return {
      status: 'insufficient',
      classification: 'insufficient_evidence',
      readinessPosture: 'collect_more_evidence',
      confidence: 'insufficient',
      headline: 'Insufficient evidence for trend classification',
      summary: 'Plan Logic can see source branch recommendation candidates, but no trusted workout evidence is available yet. Log workouts with RPE and readiness feedback to enable trend classification.',
      evidenceLabel: null,
      sourceQualityLabel: hook.sourceQualityLabel,
      trendSignals: [],
      readinessReasons: ['No completed trusted workout evidence detected'],
      missingEvidence: [...hook.missingEvidence],
      nextSafeAction: 'Log trusted workouts with RPE and feedback to enable evidence trend classification',
      ...MUTATION_LOCKS,
    }
  }

  // ── Classified: evidence exists — determine trend and readiness ────────
  const trendSignals: string[] = []
  const readinessReasons: string[] = []
  const missingEvidence: string[] = [...hook.missingEvidence]

  // Gather present evidence signals
  if (ev.trustedWorkoutCount > 0) {
    trendSignals.push(`${ev.trustedWorkoutCount} trusted session${ev.trustedWorkoutCount > 1 ? 's' : ''} logged`)
  }
  if (ev.hasRpeEvidence) {
    trendSignals.push('RPE evidence present')
  }
  if (ev.hasPainOrTensionEvidence) {
    trendSignals.push('Pain/tension signals detected')
  }
  if (ev.hasReadinessOrFatigueEvidence) {
    trendSignals.push('Readiness/fatigue feedback present')
  }
  if (ev.hasHighEffortEvidence) {
    trendSignals.push('High-effort sessions detected')
  }
  if (ev.hasUnderTargetPerformanceEvidence) {
    trendSignals.push('Under-target performance detected')
  }

  // Classify trend based on evidence signals
  const { classification, readinessPosture, confidence } = classifyTrend(ev)

  // Build readiness reasons based on classification
  switch (classification) {
    case 'caution_pattern_detected':
      readinessReasons.push('Pain or tension evidence warrants cautious review')
      if (ev.hasHighEffortEvidence) {
        readinessReasons.push('High-effort sessions combined with caution signals')
      }
      break
    case 'recovery_pressure_detected':
      readinessReasons.push('Recovery pressure signals detected from workout evidence')
      if (ev.hasUnderTargetPerformanceEvidence) {
        readinessReasons.push('Under-target performance suggests recovery capacity concern')
      }
      break
    case 'progression_signal_detected':
      readinessReasons.push('Evidence supports progression readiness review')
      if (ev.hasRpeEvidence) {
        readinessReasons.push('RPE data available for progression confidence')
      }
      break
    case 'monitoring_pattern':
      readinessReasons.push('Evidence is accumulating but insufficient for confident trend classification')
      break
    case 'ready_for_review_not_mutation':
      readinessReasons.push('Evidence depth supports structured review before future adaptation')
      break
    case 'evidence_connected':
      readinessReasons.push('Workout evidence is connected but signal detail is limited')
      break
    default:
      readinessReasons.push('Evidence classification pending')
  }

  // Build headline and summary
  const { headline, summary } = buildCopy(classification, ev, confidence)

  return {
    status: 'classified_read_only',
    classification,
    readinessPosture,
    confidence,
    headline,
    summary,
    evidenceLabel: hook.evidenceLabel,
    sourceQualityLabel: hook.sourceQualityLabel,
    trendSignals,
    readinessReasons,
    missingEvidence,
    nextSafeAction: resolveNextAction(classification),
    ...MUTATION_LOCKS,
  }
}

// ─── Classification logic ───────────────────────────────────────────────────

function classifyTrend(ev: CoachRecsWorkoutEvidenceSummary): {
  classification: PlanEvidenceTrendClassification
  readinessPosture: PlanReadinessPosture
  confidence: 'insufficient' | 'low' | 'medium' | 'high'
} {
  const hasDetailedSignals = ev.hasRpeEvidence || ev.hasPainOrTensionEvidence ||
    ev.hasReadinessOrFatigueEvidence || ev.hasUnderTargetPerformanceEvidence || ev.hasHighEffortEvidence

  // Weak evidence — connected but limited
  if (ev.quality === 'weak') {
    if (ev.trustedWorkoutCount >= 3) {
      return {
        classification: 'monitoring_pattern',
        readinessPosture: 'monitor_only',
        confidence: 'low',
      }
    }
    return {
      classification: 'evidence_connected',
      readinessPosture: 'collect_more_evidence',
      confidence: 'low',
    }
  }

  // Usable or strong evidence — classify based on signals present
  // Priority: caution > recovery pressure > progression > ready for review > monitoring

  // Caution: pain/tension evidence takes priority
  if (ev.hasPainOrTensionEvidence) {
    const conf = ev.quality === 'strong' ? 'high' as const : 'medium' as const
    return {
      classification: 'caution_pattern_detected',
      readinessPosture: 'caution_review',
      confidence: conf,
    }
  }

  // Recovery pressure: high effort + under-target or readiness/fatigue
  if ((ev.hasHighEffortEvidence && ev.hasUnderTargetPerformanceEvidence) ||
      (ev.hasHighEffortEvidence && ev.hasReadinessOrFatigueEvidence)) {
    const conf = ev.quality === 'strong' ? 'high' as const : 'medium' as const
    return {
      classification: 'recovery_pressure_detected',
      readinessPosture: 'review_recommended',
      confidence: conf,
    }
  }

  // Progression signal: RPE present, no caution, no recovery pressure
  if (ev.hasRpeEvidence && !ev.hasUnderTargetPerformanceEvidence && ev.trustedWorkoutCount >= 3) {
    const conf = ev.quality === 'strong' ? 'high' as const : 'medium' as const
    return {
      classification: 'progression_signal_detected',
      readinessPosture: 'review_recommended',
      confidence: conf,
    }
  }

  // Strong evidence with detailed signals but no specific pattern match
  if (ev.quality === 'strong' && hasDetailedSignals) {
    return {
      classification: 'ready_for_review_not_mutation',
      readinessPosture: 'review_recommended',
      confidence: 'medium',
    }
  }

  // Usable evidence with some signals
  if (hasDetailedSignals) {
    return {
      classification: 'monitoring_pattern',
      readinessPosture: 'monitor_only',
      confidence: 'medium',
    }
  }

  // Evidence connected but no detailed signals
  return {
    classification: 'evidence_connected',
    readinessPosture: 'collect_more_evidence',
    confidence: 'low',
  }
}

// ─── Copy builders ──────────────────────────────────────────────────────────

function buildCopy(
  classification: PlanEvidenceTrendClassification,
  ev: CoachRecsWorkoutEvidenceSummary,
  confidence: string
): { headline: string; summary: string } {
  const sessionWord = ev.trustedWorkoutCount === 1 ? 'session' : 'sessions'

  switch (classification) {
    case 'caution_pattern_detected':
      return {
        headline: 'Caution pattern detected in workout evidence',
        summary: `Pain or tension signals found across ${ev.trustedWorkoutCount} trusted ${sessionWord}. Review is recommended before future adaptation. No program changes have been applied.`,
      }
    case 'recovery_pressure_detected':
      return {
        headline: 'Recovery pressure detected in workout evidence',
        summary: `High-effort and under-target or fatigue signals detected across ${ev.trustedWorkoutCount} trusted ${sessionWord}. Evidence suggests recovery capacity review before progression. No program changes have been applied.`,
      }
    case 'progression_signal_detected':
      return {
        headline: 'Progression signal detected in workout evidence',
        summary: `RPE and performance evidence across ${ev.trustedWorkoutCount} trusted ${sessionWord} supports readiness for progression review. No program changes have been applied.`,
      }
    case 'ready_for_review_not_mutation':
      return {
        headline: 'Evidence supports structured review',
        summary: `Strong workout evidence from ${ev.trustedWorkoutCount} trusted ${sessionWord} with detailed signals. Evidence depth supports a structured review before any future controlled adaptation. No program changes have been applied.`,
      }
    case 'monitoring_pattern':
      return {
        headline: 'Evidence accumulating — monitoring pattern',
        summary: `Workout evidence from ${ev.trustedWorkoutCount} trusted ${sessionWord} is being monitored. More sessions or signal detail needed for confident trend classification. No program changes have been applied.`,
      }
    case 'evidence_connected':
      return {
        headline: 'Workout evidence connected — limited detail',
        summary: `${ev.trustedWorkoutCount} trusted ${sessionWord} logged with limited signal detail. Continue logging RPE, pain notes, and readiness feedback to enable trend classification. No program changes have been applied.`,
      }
    default:
      return {
        headline: 'Evidence trend classification pending',
        summary: `Evidence is being processed. ${confidence} confidence. No program changes have been applied.`,
      }
  }
}

// ─── Next action resolver ───────────────────────────────────────────────────

function resolveNextAction(classification: PlanEvidenceTrendClassification): string {
  switch (classification) {
    case 'caution_pattern_detected':
      return 'Review caution signals before any future controlled adaptation step'
    case 'recovery_pressure_detected':
      return 'Assess recovery pressure before enabling progression mutation'
    case 'progression_signal_detected':
      return 'Proceed to mutation-readiness review gate with progression evidence'
    case 'ready_for_review_not_mutation':
      return 'Proceed to structured review before controlled future-session mutation'
    case 'monitoring_pattern':
      return 'Continue monitoring; log more workouts with detailed feedback'
    case 'evidence_connected':
      return 'Log RPE, pain notes, and readiness feedback to strengthen evidence'
    default:
      return 'Connect evidence and log workouts to enable trend classification'
  }
}

// ─── UI label helpers ───────────────────────────────────────────────────────

const CLASSIFICATION_LABELS: Record<PlanEvidenceTrendClassification, string> = {
  insufficient_evidence: 'Insufficient evidence',
  evidence_connected: 'Evidence connected',
  monitoring_pattern: 'Monitoring',
  caution_pattern_detected: 'Caution pattern',
  recovery_pressure_detected: 'Recovery pressure',
  progression_signal_detected: 'Progression signal',
  ready_for_review_not_mutation: 'Ready for review',
}

const POSTURE_LABELS: Record<PlanReadinessPosture, string> = {
  collect_more_evidence: 'Collect evidence',
  monitor_only: 'Monitor only',
  review_recommended: 'Review recommended',
  caution_review: 'Caution review',
  future_mutation_blocked_readonly: 'Read-only',
}

export function getClassificationLabel(c: PlanEvidenceTrendClassification): string {
  return CLASSIFICATION_LABELS[c] ?? 'Unknown'
}

export function getPostureLabel(p: PlanReadinessPosture): string {
  return POSTURE_LABELS[p] ?? 'Unknown'
}
