/**
 * ============================================================================
 * MASTER-8C.29 / AB20.4.22 — MUTATION-READINESS REVIEW GATE (READ-ONLY)
 * ============================================================================
 *
 * Pure, deterministic, read-only gate that resolves existing Coach Recs
 * candidates into mutation-readiness review buckets. Combines Coach Recs
 * candidate quality + Plan Evidence Hook + Evidence Trend/Readiness into
 * one candidate-resolution model.
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. No mutation — never changes program, sessions, exercises, sets, reps.
 *   4. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   5. Derives entirely from existing read-only models already computed in Hub.
 *   6. mutationAllowed is always false. appliedToProgram is always false.
 *   7. Never claims applied adaptation, future-session changes, or auto-adjust.
 */

import type {
  CoachRecommendationCandidateReadonlyModel,
  CoachRecommendationCandidate,
  CoachRecommendationActionReadiness,
  CoachRecommendationCandidateCategory,
} from './coach-recommendation-candidate-readonly-analyzer'

import type { PlanEvidenceReadonlyHookModel } from './plan-evidence-readonly-hook'

import type {
  PlanEvidenceTrendReadinessModel,
  PlanEvidenceTrendClassification,
} from './plan-evidence-trend-readiness'

// ─── Types ──────────────────────────────────────────────────────────────────

export type MutationReadinessGateStatus =
  | 'unavailable'
  | 'collect_evidence'
  | 'review_candidates_read_only'
  | 'blocked_by_caution'
  | 'monitor_only'

export type MutationCandidateResolution =
  | 'not_ready'
  | 'collect_more_evidence'
  | 'monitor'
  | 'review_candidate'
  | 'blocked_caution'

export type MutationReadinessSeverity =
  | 'info'
  | 'watch'
  | 'caution'
  | 'blocked'

export interface MutationReadinessReviewCandidate {
  readonly id: string
  readonly sourceCandidateId: string
  readonly category: string
  readonly title: string
  readonly resolution: MutationCandidateResolution
  readonly severity: MutationReadinessSeverity
  readonly confidence: 'insufficient' | 'low' | 'medium' | 'high'
  readonly evidenceBasis: readonly string[]
  readonly blockers: readonly string[]
  readonly reviewReasons: readonly string[]
  readonly missingEvidence: readonly string[]
  readonly mutationAllowed: false
  readonly appliedToProgram: false
  readonly mutationStatus: 'read_only_not_applied'
}

export interface MutationReadinessReviewGateModel {
  readonly status: MutationReadinessGateStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: 'insufficient' | 'low' | 'medium' | 'high'
  readonly readinessLabel: string
  readonly topResolution: MutationCandidateResolution
  readonly candidates: readonly MutationReadinessReviewCandidate[]
  readonly topReviewCandidate: MutationReadinessReviewCandidate | null
  readonly blockedCandidateCount: number
  readonly reviewCandidateCount: number
  readonly collectEvidenceCandidateCount: number
  readonly monitorCandidateCount: number
  readonly globalBlockers: readonly string[]
  readonly globalMissingEvidence: readonly string[]
  readonly nextSafeAction: string
  readonly mutationAllowed: false
  readonly noProgramChangesApplied: true
  readonly noFutureSessionChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
  readonly noMethodPlannerChangesApplied: true
  readonly mutationStatus: 'read_only_not_applied'
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MUTATION_LOCKS = {
  mutationAllowed: false as const,
  noProgramChangesApplied: true as const,
  noFutureSessionChangesApplied: true as const,
  noLiveWorkoutChangesApplied: true as const,
  noMethodPlannerChangesApplied: true as const,
  mutationStatus: 'read_only_not_applied' as const,
}

const CANDIDATE_LOCKS = {
  mutationAllowed: false as const,
  appliedToProgram: false as const,
  mutationStatus: 'read_only_not_applied' as const,
}

// ─── Input ──────────────────────────────────────────────────────────────────

export interface ResolveMutationReadinessReviewGateInput {
  readonly coachRecommendationCandidateModel?: CoachRecommendationCandidateReadonlyModel | null
  readonly planEvidenceHookModel?: PlanEvidenceReadonlyHookModel | null
  readonly planEvidenceTrendReadinessModel?: PlanEvidenceTrendReadinessModel | null
}

// ─── Resolution helpers ─────────────────────────────────────────────────────

const RESOLUTION_SORT_ORDER: Record<MutationCandidateResolution, number> = {
  blocked_caution: 0,
  review_candidate: 1,
  collect_more_evidence: 2,
  monitor: 3,
  not_ready: 4,
}

const SEVERITY_SORT_ORDER: Record<MutationReadinessSeverity, number> = {
  blocked: 0,
  caution: 1,
  watch: 2,
  info: 3,
}

const CONFIDENCE_SORT_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
  insufficient: 3,
}

function resolveSeverity(resolution: MutationCandidateResolution): MutationReadinessSeverity {
  switch (resolution) {
    case 'blocked_caution': return 'blocked'
    case 'review_candidate': return 'watch'
    case 'collect_more_evidence': return 'info'
    case 'monitor': return 'info'
    case 'not_ready': return 'info'
  }
}

/** Caution-sensitive categories that should block on caution patterns */
const CAUTION_SENSITIVE_CATEGORIES: ReadonlySet<CoachRecommendationCandidateCategory> = new Set([
  'progression_periodization',
  'set_volume',
])

/** Categories that align with caution/recovery review */
const CAUTION_REVIEW_CATEGORIES: ReadonlySet<CoachRecommendationCandidateCategory> = new Set([
  'recovery',
  'prehab_tendon',
  'program_balance',
])

/**
 * Resolve a single source candidate into a mutation-readiness review candidate
 * based on the candidate's own action readiness + the global trend classification.
 */
function resolveCandidate(
  source: CoachRecommendationCandidate,
  trendClassification: PlanEvidenceTrendClassification | null,
  hookStatus: string | null,
): MutationReadinessReviewCandidate {
  const evidenceBasis = [...source.sourceBasis]
  const blockers: string[] = []
  const reviewReasons: string[] = []
  const missingEvidence = [...source.missingSources]
  const category = source.category as CoachRecommendationCandidateCategory

  // Start from the candidate's own action readiness
  let resolution = mapActionReadinessToResolution(source.actionReadiness)

  // Override based on global trend classification
  if (trendClassification === 'caution_pattern_detected') {
    if (CAUTION_SENSITIVE_CATEGORIES.has(category)) {
      // [P32] Progression/volume candidates under caution only block if they have safety evidence
      // Otherwise they become monitor (not hard blockers)
      const reasonLower = (source.summary ?? '').toLowerCase() + ' ' + (source.recommendation ?? '').toLowerCase() + ' ' + (source.why?.join(' ') ?? '').toLowerCase()
      const hasSafetyEvidence = reasonLower.includes('pain') || 
        reasonLower.includes('injury') || 
        reasonLower.includes('tendon') || 
        reasonLower.includes('joint') || 
        reasonLower.includes('tension') ||
        reasonLower.includes('unsafe') ||
        reasonLower.includes('risk') ||
        source.priority === 'high'
      
      if (hasSafetyEvidence) {
        resolution = 'blocked_caution'
        blockers.push('Caution pattern with safety evidence — progression/volume blocked')
      } else {
        // Generic caution without safety evidence → monitor, not block
        resolution = 'monitor'
        reviewReasons.push('Caution pattern detected — progression/volume under observation (no safety block)')
      }
    } else if (CAUTION_REVIEW_CATEGORIES.has(category)) {
      // Recovery / prehab / balance may become review candidates under caution
      if (resolution !== 'blocked_caution') {
        resolution = source.actionReadiness === 'ready_for_review' ? 'review_candidate' : resolution
        reviewReasons.push('Caution pattern supports review of recovery/prehab signals')
      }
    }
  } else if (trendClassification === 'recovery_pressure_detected') {
    if (CAUTION_SENSITIVE_CATEGORIES.has(category)) {
      // Progression under recovery pressure → blocked or monitor
      if (resolution === 'review_candidate') {
        resolution = 'monitor'
        blockers.push('Recovery pressure detected — progression review deferred until recovery stabilizes')
      }
    } else if (CAUTION_REVIEW_CATEGORIES.has(category)) {
      // Recovery-related candidates may upgrade to review
      if (source.actionReadiness === 'ready_for_review' || source.actionReadiness === 'observe_only') {
        resolution = 'review_candidate'
        reviewReasons.push('Recovery pressure supports review of this candidate')
      }
    }
  } else if (trendClassification === 'progression_signal_detected') {
    if (category === 'progression_periodization' || category === 'set_volume') {
      // Progression candidates may upgrade to review
      if (source.actionReadiness === 'ready_for_review') {
        resolution = 'review_candidate'
        reviewReasons.push('Progression signal supports review of this candidate')
      }
    }
    // Prehab/tendon with pain still overrides progression
    if (category === 'prehab_tendon' && source.priority === 'high') {
      resolution = 'blocked_caution'
      blockers.push('High-priority prehab/tendon candidate overrides progression signal')
    }
  } else if (trendClassification === 'monitoring_pattern' || trendClassification === 'evidence_connected') {
    // Weak classification → keep as monitor/collect
    if (resolution === 'review_candidate') {
      resolution = 'monitor'
      reviewReasons.push('Evidence trend is still accumulating — monitoring before review')
    }
  } else if (trendClassification === 'ready_for_review_not_mutation') {
    // Strong evidence but still read-only
    if (source.actionReadiness === 'ready_for_review') {
      resolution = 'review_candidate'
      reviewReasons.push('Evidence depth supports structured review')
    }
  }

  // If no hook is connected, force everything to collect_more_evidence
  if (!hookStatus || hookStatus === 'unavailable') {
    if (resolution === 'review_candidate' || resolution === 'monitor') {
      resolution = 'collect_more_evidence'
      missingEvidence.push('Plan evidence hook not yet connected')
    }
  }

  // Build evidence basis reasons
  if (source.evidenceTier === 'logged_user_evidence' || source.evidenceTier === 'mixed') {
    evidenceBasis.push('Logged workout evidence available')
  }
  if (source.evidenceTier === 'source_branch_inference') {
    evidenceBasis.push('Branch inference only — no logged evidence')
  }

  // Build review reasons for review candidates
  if (resolution === 'review_candidate' && reviewReasons.length === 0) {
    reviewReasons.push(`${source.title} meets review threshold based on evidence and trend`)
  }

  return {
    id: `review-${source.id}`,
    sourceCandidateId: source.id,
    category: source.category,
    title: source.title,
    resolution,
    severity: resolveSeverity(resolution),
    confidence: source.confidence,
    evidenceBasis,
    blockers,
    reviewReasons,
    missingEvidence,
    ...CANDIDATE_LOCKS,
  }
}

function mapActionReadinessToResolution(
  readiness: CoachRecommendationActionReadiness,
): MutationCandidateResolution {
  switch (readiness) {
    case 'blocked_until_evidence': return 'collect_more_evidence'
    case 'collect_evidence': return 'collect_more_evidence'
    case 'observe_only': return 'monitor'
    case 'ready_for_review': return 'review_candidate'
  }
}

function sortCandidates(
  candidates: MutationReadinessReviewCandidate[],
): MutationReadinessReviewCandidate[] {
  return [...candidates].sort((a, b) => {
    // 1. Resolution order: blocked > review > collect > monitor > not_ready
    const resA = RESOLUTION_SORT_ORDER[a.resolution] ?? 4
    const resB = RESOLUTION_SORT_ORDER[b.resolution] ?? 4
    if (resA !== resB) return resA - resB

    // 2. Severity order: blocked > caution > watch > info
    const sevA = SEVERITY_SORT_ORDER[a.severity] ?? 3
    const sevB = SEVERITY_SORT_ORDER[b.severity] ?? 3
    if (sevA !== sevB) return sevA - sevB

    // 3. Confidence order: high > medium > low > insufficient
    const confA = CONFIDENCE_SORT_ORDER[a.confidence] ?? 3
    const confB = CONFIDENCE_SORT_ORDER[b.confidence] ?? 3
    return confA - confB
  })
}

// ─── Gate status resolver ───────────────────────────────────────────────────

function resolveGateStatus(
  trendClassification: PlanEvidenceTrendClassification | null,
  trendStatus: string | null,
  hookStatus: string | null,
  candidates: readonly MutationReadinessReviewCandidate[],
): MutationReadinessGateStatus {
  // No trend data → unavailable
  if (!trendClassification || !trendStatus || trendStatus === 'unavailable') {
    return 'unavailable'
  }

  // Insufficient evidence
  if (trendStatus === 'insufficient' || !hookStatus || hookStatus === 'unavailable' || hookStatus === 'waiting_for_evidence') {
    return 'collect_evidence'
  }

  // [P33] Check caution blocking - only block if there are actual blocked candidates
  // Global caution_pattern_detected alone no longer forces blocked_by_caution
  if (trendClassification === 'caution_pattern_detected') {
    const hasBlockedCandidates = candidates.some(c => c.resolution === 'blocked_caution')
    if (hasBlockedCandidates) {
      return 'blocked_by_caution'
    }
    // No blocked candidates - fall through to check for review/monitor
  }

  // Check if any review candidates exist
  const hasReview = candidates.some(c => c.resolution === 'review_candidate')
  if (hasReview) {
    return 'review_candidates_read_only'
  }

  return 'monitor_only'
}

function resolveGateConfidence(
  trend: PlanEvidenceTrendReadinessModel | null,
  candidates: readonly MutationReadinessReviewCandidate[],
): 'insufficient' | 'low' | 'medium' | 'high' {
  if (!trend || trend.confidence === 'insufficient') return 'insufficient'

  // Gate confidence is the minimum of trend confidence and best candidate confidence
  const candidateConfs = candidates.map(c => CONFIDENCE_SORT_ORDER[c.confidence] ?? 3)
  const bestCandidateConf = candidateConfs.length > 0 ? Math.min(...candidateConfs) : 3

  const trendConf = CONFIDENCE_SORT_ORDER[trend.confidence] ?? 3
  const worstConf = Math.max(trendConf, bestCandidateConf)

  if (worstConf === 0) return 'high'
  if (worstConf === 1) return 'medium'
  if (worstConf === 2) return 'low'
  return 'insufficient'
}

// ─── UI label helpers ───────────────────────────────────────────────────────

export function getGateStatusLabel(status: MutationReadinessGateStatus): string {
  switch (status) {
    case 'unavailable': return 'Unavailable'
    case 'collect_evidence': return 'Collect evidence'
    case 'review_candidates_read_only': return 'Review candidates'
    case 'blocked_by_caution': return 'Blocked by caution'
    case 'monitor_only': return 'Monitor only'
  }
}

export function getResolutionLabel(resolution: MutationCandidateResolution): string {
  switch (resolution) {
    case 'not_ready': return 'Not ready'
    case 'collect_more_evidence': return 'Collect evidence'
    case 'monitor': return 'Monitor'
    case 'review_candidate': return 'Review candidate'
    case 'blocked_caution': return 'Blocked (caution)'
  }
}

// ─── Main resolver ──────────────────────────────────────────────────────────

export function resolveMutationReadinessReviewGate(
  input: ResolveMutationReadinessReviewGateInput,
): MutationReadinessReviewGateModel {
  const coachModel = input.coachRecommendationCandidateModel
  const hookModel = input.planEvidenceHookModel
  const trendModel = input.planEvidenceTrendReadinessModel

  // ── Unavailable: no Coach Recs model ──────────────────────────────────
  if (!coachModel || coachModel.status === 'unavailable') {
    return {
      status: 'unavailable',
      headline: 'Mutation-readiness review unavailable',
      summary: 'Coach Recommendation candidates are not available. The mutation-readiness review gate requires source branch recommendation candidates to resolve.',
      confidence: 'insufficient',
      readinessLabel: 'No source candidates',
      topResolution: 'not_ready',
      candidates: [],
      topReviewCandidate: null,
      blockedCandidateCount: 0,
      reviewCandidateCount: 0,
      collectEvidenceCandidateCount: 0,
      monitorCandidateCount: 0,
      globalBlockers: ['Coach Recommendation candidate model unavailable'],
      globalMissingEvidence: ['Source branch coverage', 'Workout evidence'],
      nextSafeAction: 'Build source branch coverage and log workouts to enable mutation-readiness review',
      ...MUTATION_LOCKS,
    }
  }

  // ── Resolve each candidate ────────────────────────────────────────────
  const trendClassification = trendModel?.classification ?? null
  const hookStatus = hookModel?.status ?? null

  const resolvedCandidates = sortCandidates(
    coachModel.candidates.map(c => resolveCandidate(c, trendClassification, hookStatus))
  )

  // ── Counts ────────────────────────────────────────────────────────────
  const blockedCandidateCount = resolvedCandidates.filter(c => c.resolution === 'blocked_caution').length
  const reviewCandidateCount = resolvedCandidates.filter(c => c.resolution === 'review_candidate').length
  const collectEvidenceCandidateCount = resolvedCandidates.filter(c => c.resolution === 'collect_more_evidence').length
  const monitorCandidateCount = resolvedCandidates.filter(c => c.resolution === 'monitor').length

  // ── Gate status ───────────────────────────────────────────────────────
  const status = resolveGateStatus(
    trendClassification,
    trendModel?.status ?? null,
    hookStatus,
    resolvedCandidates,
  )

  const confidence = resolveGateConfidence(trendModel ?? null, resolvedCandidates)

  // ── Top candidates ────────────────────────────────────────────────────
  const topReviewCandidate = resolvedCandidates.find(c => c.resolution === 'review_candidate') ?? null

  const topResolution: MutationCandidateResolution =
    blockedCandidateCount > 0 ? 'blocked_caution' :
    reviewCandidateCount > 0 ? 'review_candidate' :
    collectEvidenceCandidateCount > 0 ? 'collect_more_evidence' :
    monitorCandidateCount > 0 ? 'monitor' :
    'not_ready'

  // ── Global blockers / missing evidence ────────────────────────────────
  const globalBlockers: string[] = []
  const globalMissingEvidence: string[] = []

  if (status === 'blocked_by_caution') {
    globalBlockers.push('Caution pattern detected — review required before any future adaptation')
  }
  if (status === 'collect_evidence') {
    globalMissingEvidence.push('Insufficient trusted workout evidence for mutation-readiness assessment')
  }
  if (trendModel?.missingEvidence) {
    for (const me of trendModel.missingEvidence) {
      if (!globalMissingEvidence.includes(me)) {
        globalMissingEvidence.push(me)
      }
    }
  }

  // ── Headline / summary ────────────────────────────────────────────────
  const { headline, summary } = buildCopy(status, resolvedCandidates.length, reviewCandidateCount, blockedCandidateCount, confidence)

  // ── Readiness label ───────────────────────────────────────────────────
  const parts: string[] = []
  if (reviewCandidateCount > 0) parts.push(`${reviewCandidateCount} review`)
  if (blockedCandidateCount > 0) parts.push(`${blockedCandidateCount} caution-blocked`)
  if (collectEvidenceCandidateCount > 0) parts.push(`${collectEvidenceCandidateCount} collect evidence`)
  if (monitorCandidateCount > 0) parts.push(`${monitorCandidateCount} monitor`)
  const readinessLabel = parts.length > 0
    ? `Review gate: ${parts.join(' / ')}`
    : 'Review gate: no candidates resolved'

  return {
    status,
    headline,
    summary,
    confidence,
    readinessLabel,
    topResolution,
    candidates: resolvedCandidates,
    topReviewCandidate,
    blockedCandidateCount,
    reviewCandidateCount,
    collectEvidenceCandidateCount,
    monitorCandidateCount,
    globalBlockers,
    globalMissingEvidence,
    nextSafeAction: resolveNextSafeAction(status),
    ...MUTATION_LOCKS,
  }
}

// ─── Copy builder ───────────────────────────────────────────────────────────

function buildCopy(
  status: MutationReadinessGateStatus,
  totalCount: number,
  reviewCount: number,
  blockedCount: number,
  confidence: string,
): { headline: string; summary: string } {
  switch (status) {
    case 'unavailable':
      return {
        headline: 'Mutation-readiness review unavailable',
        summary: 'Source recommendation candidates are not available to resolve.',
      }
    case 'collect_evidence':
      return {
        headline: 'Collecting evidence for mutation-readiness review',
        summary: `${totalCount} candidate${totalCount !== 1 ? 's' : ''} identified from source branches, but trusted workout evidence is insufficient for mutation-readiness assessment. No changes applied.`,
      }
    case 'blocked_by_caution':
      return {
        headline: 'Mutation-readiness blocked by caution pattern',
        summary: `${blockedCount} candidate${blockedCount !== 1 ? 's' : ''} blocked by caution pattern. Review caution signals before any future controlled adaptation. No changes applied.`,
      }
    case 'review_candidates_read_only':
      return {
        headline: 'Candidates resolved for read-only review',
        summary: `${reviewCount} candidate${reviewCount !== 1 ? 's' : ''} resolved as ready for human review (${confidence} confidence). Mutation remains locked. No changes applied.`,
      }
    case 'monitor_only':
      return {
        headline: 'Monitoring — no candidates ready for review',
        summary: `${totalCount} candidate${totalCount !== 1 ? 's' : ''} resolved, but none meet the review threshold yet. Continue monitoring workout evidence. No changes applied.`,
      }
  }
}

function resolveNextSafeAction(status: MutationReadinessGateStatus): string {
  switch (status) {
    case 'unavailable':
      return 'Build source branch coverage and log workouts to enable review gate'
    case 'collect_evidence':
      return 'Log more trusted workouts with RPE and feedback to strengthen evidence basis'
    case 'blocked_by_caution':
      return 'Review caution signals before considering any controlled adaptation'
    case 'review_candidates_read_only':
      return 'Controlled writer remains locked — review candidates are read-only proof only'
    case 'monitor_only':
      return 'Continue logging workouts to accumulate evidence for candidate readiness'
  }
}
