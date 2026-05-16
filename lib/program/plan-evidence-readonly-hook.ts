/**
 * ============================================================================
 * MASTER-8C.27 / AB20.4.20 — PLAN EVIDENCE READ-ONLY HOOK
 * ============================================================================
 *
 * Pure, deterministic, read-only hook that translates the Coach Recs candidate
 * model into a Plan Logic-visible evidence summary. This lets Plan Logic
 * honestly say whether workout evidence is visible to the plan-intelligence
 * layer, without mutating the program.
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. No mutation — never changes program, sessions, exercises, sets, reps.
 *   4. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   5. Derives entirely from CoachRecommendationCandidateReadonlyModel.
 *   6. Never claims applied adaptation or future-session changes.
 */

import type { CoachRecommendationCandidateReadonlyModel } from './coach-recommendation-candidate-readonly-analyzer'

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanEvidenceHookStatus =
  | 'read_only_connected'
  | 'waiting_for_evidence'
  | 'unavailable'

export type PlanEvidenceHookConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'insufficient'

export interface PlanEvidenceReadonlyHookModel {
  readonly status: PlanEvidenceHookStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: PlanEvidenceHookConfidence
  readonly evidenceLabel: string | null
  readonly sourceQualityLabel: string
  readonly evidenceSignals: readonly string[]
  readonly missingEvidence: readonly string[]
  readonly sourceBasis: readonly string[]
  readonly noProgramChangesApplied: true
  readonly noFutureSessionChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
  readonly mutationStatus: 'read_only_not_applied'
  readonly nextSafeAction: string
}

// ─── Input ──────────────────────────────────────────────────────────────────

export interface ResolvePlanEvidenceReadonlyHookInput {
  readonly coachRecommendationCandidateModel?: CoachRecommendationCandidateReadonlyModel | null
}

// ─── Resolver ───────────────────────────────────────────────────────────────

export function resolvePlanEvidenceReadonlyHook(
  input: ResolvePlanEvidenceReadonlyHookInput
): PlanEvidenceReadonlyHookModel {
  const model = input.coachRecommendationCandidateModel

  // ── Unavailable: no candidate model at all ────────────────────────────
  if (!model) {
    return {
      status: 'unavailable',
      headline: 'Plan evidence hook unavailable',
      summary: 'No Coach Recs candidate model exists. Plan Logic cannot see workout evidence until source branches produce recommendation candidates.',
      confidence: 'insufficient',
      evidenceLabel: null,
      sourceQualityLabel: 'No source data',
      evidenceSignals: [],
      missingEvidence: ['Coach Recs candidate model', 'Source branch outputs', 'Workout evidence'],
      sourceBasis: [],
      noProgramChangesApplied: true,
      noFutureSessionChangesApplied: true,
      noLiveWorkoutChangesApplied: true,
      mutationStatus: 'read_only_not_applied',
      nextSafeAction: 'Build source branch coverage and log workouts to enable plan evidence visibility',
    }
  }

  // ── Waiting: model exists but no workout evidence label ───────────────
  if (!model.workoutEvidenceLabel) {
    // Derive evidence signals from candidate source basis
    const evidenceSignals: string[] = []
    if (model.candidates.length > 0) {
      evidenceSignals.push(`${model.candidates.length} recommendation candidate${model.candidates.length > 1 ? 's' : ''} from source branches`)
    }
    if (model.sourceBasis.length > 0) {
      evidenceSignals.push(`${model.sourceBasis.length} source branch${model.sourceBasis.length > 1 ? 'es' : ''} contributing`)
    }

    return {
      status: 'waiting_for_evidence',
      headline: 'Waiting for logged workout evidence',
      summary: 'Plan Logic can see source branch recommendation candidates, but no trusted workout evidence is available yet. Log workouts with RPE and feedback to connect real evidence to plan intelligence.',
      confidence: mapModelConfidence(model.confidence),
      evidenceLabel: null,
      sourceQualityLabel: model.sourceQualitySummary,
      evidenceSignals,
      missingEvidence: [...model.missingSources],
      sourceBasis: [...model.sourceBasis],
      noProgramChangesApplied: true,
      noFutureSessionChangesApplied: true,
      noLiveWorkoutChangesApplied: true,
      mutationStatus: 'read_only_not_applied',
      nextSafeAction: 'Log trusted workouts with RPE/feedback to upgrade plan evidence from branch inference to logged evidence',
    }
  }

  // ── Connected: model exists and workout evidence is available ──────────
  const evidenceSignals: string[] = []
  evidenceSignals.push(model.workoutEvidenceLabel)
  if (model.candidates.length > 0) {
    evidenceSignals.push(`${model.candidates.length} recommendation candidate${model.candidates.length > 1 ? 's' : ''} from ${model.sourceBasis.length} branch${model.sourceBasis.length > 1 ? 'es' : ''}`)
  }

  // Determine confidence based on applied recommendation readiness
  let confidence: PlanEvidenceHookConfidence
  if (model.appliedRecommendationReadiness === 'ready_for_review') {
    confidence = 'high'
  } else if (model.appliedRecommendationReadiness === 'needs_logged_evidence') {
    confidence = 'medium'
  } else {
    confidence = mapModelConfidence(model.confidence)
  }

  return {
    status: 'read_only_connected',
    headline: 'Workout evidence visible to Plan Logic',
    summary: 'Plan Logic can now see trusted workout evidence through the Coach Recs read-only bridge. This improves future adaptation review quality, but no program changes are applied yet.',
    confidence,
    evidenceLabel: model.workoutEvidenceLabel,
    sourceQualityLabel: model.sourceQualitySummary,
    evidenceSignals,
    missingEvidence: model.missingSources.length > 0 ? [...model.missingSources] : [],
    sourceBasis: [...model.sourceBasis],
    noProgramChangesApplied: true,
    noFutureSessionChangesApplied: true,
    noLiveWorkoutChangesApplied: true,
    mutationStatus: 'read_only_not_applied',
    nextSafeAction: 'Use this evidence for read-only trend classification before enabling future-session mutation',
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapModelConfidence(
  c: CoachRecommendationCandidateReadonlyModel['confidence']
): PlanEvidenceHookConfidence {
  switch (c) {
    case 'high': return 'high'
    case 'medium': return 'medium'
    case 'low': return 'low'
    case 'insufficient': return 'insufficient'
    default: return 'insufficient'
  }
}
