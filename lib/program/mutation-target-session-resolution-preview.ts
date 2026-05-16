/**
 * ============================================================================
 * MASTER-8C.31 / AB20.4.24 — TARGET SESSION RESOLUTION PREVIEW (READ-ONLY)
 * ============================================================================
 *
 * Pure, deterministic, read-only target-session resolution preview that answers:
 * "If mutation were allowed in a future step, which uncompleted future sessions
 *  could theoretically be targeted, which candidates cannot be targeted yet,
 *  and what proof is still missing?"
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. No mutation — never changes program, sessions, exercises, sets, reps.
 *   4. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   5. Derives from existing MutationReadinessReviewGateModel,
 *      MutationPathwayReadinessMapModel, and a local session adapter.
 *   6. All can* flags are always false. mutationAllowed is always false.
 *   7. Never creates confirmed plans, never saves markers.
 *   8. Never claims applied adaptation, future-session changes, or auto-adjust.
 *   9. Does NOT call loadMutationPlans(), addConfirmedPlan(), clearMutationPlans(),
 *      or any apply/confirm/storage function.
 */

import type {
  MutationReadinessReviewGateModel,
  MutationReadinessReviewCandidate,
} from './mutation-readiness-review-gate'

import type {
  MutationPathwayReadinessMapModel,
} from './mutation-pathway-readiness-map'

// ─── Local adapter types (avoids importing AdaptiveProgram directly) ────────

export interface TargetResolutionSessionInput {
  readonly id?: string | null
  readonly title?: string | null
  readonly dayNumber?: number | null
  readonly dayLabel?: string | null
  readonly focus?: string | null
  readonly focusLabel?: string | null
  readonly completed?: boolean | null
}

export interface TargetResolutionProgramInput {
  readonly sessions: readonly TargetResolutionSessionInput[]
}

// ─── Output types ───────────────────────────────────────────────────────────

export type MutationTargetResolutionStatus =
  | 'unavailable'
  | 'blocked_by_caution'
  | 'no_future_targets'
  | 'targets_unresolved'
  | 'targets_resolved_read_only'
  | 'future_locked'

export type MutationTargetCandidateStatus =
  | 'blocked'
  | 'unresolved'
  | 'review_only'
  | 'future_locked'
  | 'resolved_read_only'

export interface MutationTargetSessionCandidate {
  readonly dayNumber: number
  readonly sessionId: string | null
  readonly sessionTitle: string
  readonly isCompleted: boolean
  readonly isFutureSession: boolean
  readonly eligibleForFutureMutationPreview: boolean
  readonly status: MutationTargetCandidateStatus
  readonly reason: string
  readonly blockedReason: string | null
  readonly protectedCompletedSession: boolean
  readonly canMutateNow: false
}

export interface MutationCandidateTargetResolution {
  readonly sourceCandidateId: string
  readonly title: string
  readonly category: string
  readonly resolution: string
  readonly status: MutationTargetCandidateStatus
  readonly targetDayNumbers: readonly number[]
  readonly targetSessions: readonly MutationTargetSessionCandidate[]
  readonly blockedReasons: readonly string[]
  readonly missingProof: readonly string[]
  readonly reviewSummary: string
  readonly canCreateConfirmedPlanNow: false
  readonly canApplyMarkerNow: false
  readonly canPreviewStructuralMutationNow: false
  readonly canMutateNow: false
}

export interface MutationTargetSessionResolutionPreviewModel {
  readonly status: MutationTargetResolutionStatus
  readonly headline: string
  readonly summary: string
  readonly candidateResolutions: readonly MutationCandidateTargetResolution[]
  readonly futureSessionCandidates: readonly MutationTargetSessionCandidate[]
  readonly completedSessionCount: number
  readonly futureSessionCount: number
  readonly blockedCandidateCount: number
  readonly unresolvedCandidateCount: number
  readonly resolvedReadOnlyCandidateCount: number
  readonly nextSafeGate: string
  readonly missingProof: readonly string[]
  readonly safetyNotes: readonly string[]
  readonly canCreateConfirmedPlanNow: false
  readonly canApplyMarkerNow: false
  readonly canPreviewStructuralMutationNow: false
  readonly canMutateNow: false
  readonly mutationAllowed: false
  readonly noProgramChangesApplied: true
  readonly noFutureSessionChangesApplied: true
  readonly noProgramCardChangesApplied: true
  readonly noLiveWorkoutChangesApplied: true
  readonly noMethodPlannerChangesApplied: true
  readonly mutationStatus: 'read_only_target_resolution_preview'
}

// ─── Constants ──────────────────────────────────────────────────────────────

const LOCKED_FLAGS = {
  canCreateConfirmedPlanNow: false as const,
  canApplyMarkerNow: false as const,
  canPreviewStructuralMutationNow: false as const,
  canMutateNow: false as const,
}

const MODEL_LOCKED_FLAGS = {
  ...LOCKED_FLAGS,
  mutationAllowed: false as const,
  noProgramChangesApplied: true as const,
  noFutureSessionChangesApplied: true as const,
  noProgramCardChangesApplied: true as const,
  noLiveWorkoutChangesApplied: true as const,
  noMethodPlannerChangesApplied: true as const,
  mutationStatus: 'read_only_target_resolution_preview' as const,
}

const REQUIRED_PROOF = [
  'Candidate-to-session mapping rule',
  'Uncompleted session target identity',
  'User confirmation contract',
  'Structural preview gate',
  'Program Card visibility proof',
  'Live Workout bridge proof',
] as const

const CAUTION_CATEGORIES = new Set([
  'prehab_rehab',
  'tendon_health',
  'pain_management',
  'recovery_optimization',
])

const VOLUME_PROGRESSION_CATEGORIES = new Set([
  'set_volume_adjustment',
  'progression_periodization',
  'program_balance',
  'intensity_management',
])

// ─── Label helpers ──────────────────────────────────────────────────────────

export function getTargetResolutionStatusLabel(
  status: MutationTargetResolutionStatus,
): string {
  switch (status) {
    case 'unavailable': return 'Unavailable'
    case 'blocked_by_caution': return 'Blocked by caution'
    case 'no_future_targets': return 'No future targets'
    case 'targets_unresolved': return 'Targets unresolved'
    case 'targets_resolved_read_only': return 'Targets resolved (read-only)'
    case 'future_locked': return 'Future locked'
    default: return 'Unknown'
  }
}

export function getTargetCandidateStatusLabel(
  status: MutationTargetCandidateStatus,
): string {
  switch (status) {
    case 'blocked': return 'Blocked'
    case 'unresolved': return 'Unresolved'
    case 'review_only': return 'Review only'
    case 'future_locked': return 'Future locked'
    case 'resolved_read_only': return 'Resolved (read-only)'
    default: return 'Unknown'
  }
}

export function getTargetCandidateStatusColor(status: MutationTargetCandidateStatus): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'blocked':
      return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' }
    case 'unresolved':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'review_only':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
    case 'future_locked':
      return { bg: 'bg-[#1A1A2E]', text: 'text-[#6A6A7A]', border: 'border-[#2A2A35]' }
    case 'resolved_read_only':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    default:
      return { bg: 'bg-[#1A1A2E]', text: 'text-[#8A8A9A]', border: 'border-[#2A2A35]' }
  }
}

// ─── Session candidate builder ──────────────────────────────────────────────

function buildSessionCandidates(
  sessions: readonly TargetResolutionSessionInput[],
  isGloballyBlocked: boolean,
): readonly MutationTargetSessionCandidate[] {
  return sessions.map((s, idx) => {
    const dayNumber = s.dayNumber ?? (idx + 1)
    const isCompleted = s.completed === true
    const sessionTitle = s.title ?? s.focusLabel ?? s.focus ?? s.dayLabel ?? `Day ${dayNumber}`

    if (isCompleted) {
      return {
        dayNumber,
        sessionId: s.id ?? null,
        sessionTitle,
        isCompleted: true,
        isFutureSession: false,
        eligibleForFutureMutationPreview: false,
        status: 'blocked' as const,
        reason: 'Completed sessions are permanently protected',
        blockedReason: 'Session already completed — protected from mutation',
        protectedCompletedSession: true,
        canMutateNow: false as const,
      }
    }

    // Uncompleted session
    const status: MutationTargetCandidateStatus = isGloballyBlocked
      ? 'blocked'
      : 'unresolved'

    const reason = isGloballyBlocked
      ? 'Caution pattern must be cleared before any future adaptation'
      : 'Possible future target candidate — requires confirmation and preview gates'

    const blockedReason = isGloballyBlocked
      ? 'Global caution block prevents target resolution'
      : null

    return {
      dayNumber,
      sessionId: s.id ?? null,
      sessionTitle,
      isCompleted: false,
      isFutureSession: true,
      eligibleForFutureMutationPreview: !isGloballyBlocked,
      status,
      reason,
      blockedReason,
      protectedCompletedSession: false,
      canMutateNow: false as const,
    }
  })
}

// ─── Candidate-to-session resolution ────────────────────────────────────────

function resolveCandidateTargets(
  candidate: MutationReadinessReviewCandidate,
  futureSessions: readonly MutationTargetSessionCandidate[],
  isGloballyBlocked: boolean,
): MutationCandidateTargetResolution {
  const base = {
    sourceCandidateId: candidate.sourceCandidateId,
    title: candidate.title,
    category: candidate.category,
    resolution: candidate.resolution,
    ...LOCKED_FLAGS,
  }

  // If globally blocked by caution
  if (isGloballyBlocked || candidate.resolution === 'blocked_caution') {
    return {
      ...base,
      status: 'blocked',
      targetDayNumbers: [],
      targetSessions: [],
      blockedReasons: [
        ...(isGloballyBlocked ? ['Global caution pattern must clear before target resolution'] : []),
        ...candidate.blockers,
      ],
      missingProof: [...REQUIRED_PROOF],
      reviewSummary: `${candidate.title} is blocked — caution must clear before targeting any future session`,
    }
  }

  // If no future sessions exist
  if (futureSessions.length === 0) {
    return {
      ...base,
      status: 'unresolved',
      targetDayNumbers: [],
      targetSessions: [],
      blockedReasons: ['No uncompleted future sessions available for targeting'],
      missingProof: [...REQUIRED_PROOF],
      reviewSummary: `${candidate.title} has no available future sessions to target`,
    }
  }

  // Conservative category-based mapping
  const isCautionCategory = CAUTION_CATEGORIES.has(candidate.category)
  const isVolumeProgressionCategory = VOLUME_PROGRESSION_CATEGORIES.has(candidate.category)

  // For caution-related candidates, list future sessions but mark as review_only
  if (isCautionCategory) {
    const targetSessions = futureSessions.map(s => ({
      ...s,
      status: 'review_only' as const,
      reason: `${candidate.title} — recovery/prehab candidate requires careful review before any targeting`,
    }))

    return {
      ...base,
      status: 'review_only',
      targetDayNumbers: targetSessions.map(s => s.dayNumber),
      targetSessions,
      blockedReasons: [],
      missingProof: [...REQUIRED_PROOF],
      reviewSummary: `${candidate.title} could affect multiple future sessions but requires careful review — no sessions targeted`,
    }
  }

  // For volume/progression candidates, map to future sessions as unresolved
  if (isVolumeProgressionCategory) {
    const targetSessions = futureSessions.map(s => ({
      ...s,
      status: 'unresolved' as const,
      reason: `${candidate.title} — volume/progression candidate maps to possible future target but unresolved`,
    }))

    return {
      ...base,
      status: 'unresolved',
      targetDayNumbers: targetSessions.map(s => s.dayNumber),
      targetSessions,
      blockedReasons: [],
      missingProof: [...REQUIRED_PROOF],
      reviewSummary: `${candidate.title} could theoretically target ${targetSessions.length} future session(s) — mapping unresolved`,
    }
  }

  // Generic fallback — list future sessions as unresolved
  const targetSessions = futureSessions.map(s => ({
    ...s,
    status: 'unresolved' as const,
    reason: `${candidate.title} — generic candidate maps to possible future target but unresolved`,
  }))

  return {
    ...base,
    status: 'unresolved',
    targetDayNumbers: targetSessions.map(s => s.dayNumber),
    targetSessions,
    blockedReasons: [],
    missingProof: [...REQUIRED_PROOF],
    reviewSummary: `${candidate.title} could theoretically target ${targetSessions.length} future session(s) — mapping unresolved`,
  }
}

// ─── Main resolver ──────────────────────────────────────────────────────────

export function resolveMutationTargetSessionResolutionPreview(input: {
  readonly programSessions?: TargetResolutionProgramInput | null
  readonly mutationReadinessReviewGateModel?: MutationReadinessReviewGateModel | null
  readonly mutationPathwayReadinessMapModel?: MutationPathwayReadinessMapModel | null
}): MutationTargetSessionResolutionPreviewModel {
  const { programSessions, mutationReadinessReviewGateModel, mutationPathwayReadinessMapModel } = input

  // ── Unavailable: no review gate or pathway map ──────────────────────────
  if (!mutationReadinessReviewGateModel || !mutationPathwayReadinessMapModel) {
    return {
      status: 'unavailable',
      headline: 'Target resolution unavailable',
      summary: 'Mutation-readiness review gate or pathway map is not available. Cannot resolve target sessions.',
      candidateResolutions: [],
      futureSessionCandidates: [],
      completedSessionCount: 0,
      futureSessionCount: 0,
      blockedCandidateCount: 0,
      unresolvedCandidateCount: 0,
      resolvedReadOnlyCandidateCount: 0,
      nextSafeGate: 'Mutation-readiness review and pathway map required',
      missingProof: [...REQUIRED_PROOF],
      safetyNotes: ['No upstream models available for target resolution'],
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Determine global caution block ──────────────────────────────────────
  const isGloballyBlocked =
    mutationReadinessReviewGateModel.status === 'blocked_by_caution' ||
    mutationPathwayReadinessMapModel.status === 'blocked_by_caution'

  // ── Build session candidates from program ───────────────────────────────
  const sessions = programSessions?.sessions ?? []
  const allSessionCandidates = buildSessionCandidates(sessions, isGloballyBlocked)
  const completedSessions = allSessionCandidates.filter(s => s.isCompleted)
  const futureSessions = allSessionCandidates.filter(s => s.isFutureSession)

  // ── No program sessions ─────────────────────────────────────────────────
  if (sessions.length === 0) {
    return {
      status: 'unavailable',
      headline: 'No program sessions available',
      summary: 'Cannot resolve target sessions without a program. Generate a program first.',
      candidateResolutions: [],
      futureSessionCandidates: [],
      completedSessionCount: 0,
      futureSessionCount: 0,
      blockedCandidateCount: 0,
      unresolvedCandidateCount: 0,
      resolvedReadOnlyCandidateCount: 0,
      nextSafeGate: 'Program generation required',
      missingProof: [...REQUIRED_PROOF],
      safetyNotes: ['No program sessions exist'],
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── No uncompleted future sessions ──────────────────────────────────────
  if (futureSessions.length === 0) {
    return {
      status: 'no_future_targets',
      headline: 'All sessions completed — no future targets',
      summary: `All ${completedSessions.length} session(s) are completed and permanently protected. No uncompleted future sessions available for targeting.`,
      candidateResolutions: [],
      futureSessionCandidates: [],
      completedSessionCount: completedSessions.length,
      futureSessionCount: 0,
      blockedCandidateCount: 0,
      unresolvedCandidateCount: 0,
      resolvedReadOnlyCandidateCount: 0,
      nextSafeGate: 'Next program generation cycle',
      missingProof: [],
      safetyNotes: ['All sessions completed — protected from mutation'],
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Globally blocked by caution ─────────────────────────────────────────
  if (isGloballyBlocked) {
    const candidateResolutions = mutationReadinessReviewGateModel.candidates.map(c =>
      resolveCandidateTargets(c, futureSessions, true),
    )

    return {
      status: 'blocked_by_caution',
      headline: 'Target resolution blocked by caution',
      summary: `Caution pattern must be cleared before any future adaptation. ${futureSessions.length} future session(s) exist but are blocked. ${completedSessions.length} completed session(s) are permanently protected.`,
      candidateResolutions,
      futureSessionCandidates: allSessionCandidates,
      completedSessionCount: completedSessions.length,
      futureSessionCount: futureSessions.length,
      blockedCandidateCount: candidateResolutions.length,
      unresolvedCandidateCount: 0,
      resolvedReadOnlyCandidateCount: 0,
      nextSafeGate: 'Clear caution pattern before target resolution',
      missingProof: [...REQUIRED_PROOF, 'Caution pattern clearance'],
      safetyNotes: [
        'Caution pattern blocks all target resolution',
        'Completed sessions are permanently protected',
        'Future sessions listed for transparency only',
      ],
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Review gate status determines resolution ────────────────────────────
  const gateStatus = mutationReadinessReviewGateModel.status
  const reviewCandidates = mutationReadinessReviewGateModel.candidates

  // No candidates to resolve
  if (reviewCandidates.length === 0) {
    return {
      status: 'targets_unresolved',
      headline: 'No review candidates to target',
      summary: `No mutation-readiness candidates exist to map to future sessions. ${futureSessions.length} future session(s) available but no candidate resolutions.`,
      candidateResolutions: [],
      futureSessionCandidates: allSessionCandidates,
      completedSessionCount: completedSessions.length,
      futureSessionCount: futureSessions.length,
      blockedCandidateCount: 0,
      unresolvedCandidateCount: 0,
      resolvedReadOnlyCandidateCount: 0,
      nextSafeGate: 'Collect more evidence and generate review candidates',
      missingProof: [...REQUIRED_PROOF],
      safetyNotes: ['No candidates exist for target mapping'],
      ...MODEL_LOCKED_FLAGS,
    }
  }

  // ── Resolve each candidate to target sessions ───────────────────────────
  const candidateResolutions = reviewCandidates.map(c =>
    resolveCandidateTargets(c, futureSessions, false),
  )

  // Count resolution statuses
  const blockedCount = candidateResolutions.filter(r => r.status === 'blocked').length
  const unresolvedCount = candidateResolutions.filter(r => r.status === 'unresolved').length
  const reviewOnlyCount = candidateResolutions.filter(r => r.status === 'review_only').length
  const resolvedReadOnlyCount = candidateResolutions.filter(r => r.status === 'resolved_read_only').length

  // Determine global status
  let status: MutationTargetResolutionStatus
  let headline: string
  let summary: string
  let nextSafeGate: string

  if (blockedCount > 0 && blockedCount === candidateResolutions.length) {
    status = 'blocked_by_caution'
    headline = 'All candidates blocked'
    summary = `All ${blockedCount} candidate(s) are blocked. ${futureSessions.length} future session(s) exist but cannot be targeted.`
    nextSafeGate = 'Clear blocked conditions before target resolution'
  } else if (gateStatus === 'collect_evidence' || gateStatus === 'monitor_only') {
    status = 'targets_unresolved'
    headline = 'Target resolution: collecting evidence'
    summary = `${reviewCandidates.length} candidate(s) mapped to ${futureSessions.length} future session(s). Target mapping is unresolved — more evidence or review needed. ${completedSessions.length} completed session(s) protected.`
    nextSafeGate = 'Collect more evidence and advance through review gates'
  } else if (unresolvedCount > 0 || reviewOnlyCount > 0) {
    status = 'targets_unresolved'
    headline = 'Target resolution: review needed'
    summary = `${candidateResolutions.length} candidate(s) mapped to ${futureSessions.length} future session(s). ${unresolvedCount} unresolved, ${reviewOnlyCount} review-only, ${blockedCount} blocked. ${completedSessions.length} completed session(s) protected. Confirmation and preview gates still required.`
    nextSafeGate = 'User confirmation contract and structural preview gates'
  } else if (resolvedReadOnlyCount > 0) {
    status = 'targets_resolved_read_only'
    headline = 'Target resolution: read-only preview'
    summary = `${resolvedReadOnlyCount} candidate(s) resolved to read-only targets across ${futureSessions.length} future session(s). No mutation applied. ${completedSessions.length} completed session(s) protected.`
    nextSafeGate = 'User confirmation contract required before any structural preview'
  } else {
    status = 'future_locked'
    headline = 'Target resolution: future locked'
    summary = `${candidateResolutions.length} candidate(s) and ${futureSessions.length} future session(s) identified. All target mapping remains future-locked.`
    nextSafeGate = 'Advance through remaining pathway gates'
  }

  // Collect all missing proof
  const allMissingProof = new Set<string>([...REQUIRED_PROOF])
  for (const cr of candidateResolutions) {
    for (const mp of cr.missingProof) {
      allMissingProof.add(mp)
    }
  }

  // Safety notes
  const safetyNotes: string[] = [
    'Completed sessions are permanently protected',
    'Target mapping is read-only preview only',
    'No confirmed plan created',
    'No marker saved',
    'No structural mutation preview active',
  ]

  if (blockedCount > 0) {
    safetyNotes.push(`${blockedCount} candidate(s) are blocked by caution or missing evidence`)
  }

  return {
    status,
    headline,
    summary,
    candidateResolutions,
    futureSessionCandidates: allSessionCandidates,
    completedSessionCount: completedSessions.length,
    futureSessionCount: futureSessions.length,
    blockedCandidateCount: blockedCount,
    unresolvedCandidateCount: unresolvedCount + reviewOnlyCount,
    resolvedReadOnlyCandidateCount: resolvedReadOnlyCount,
    nextSafeGate,
    missingProof: [...allMissingProof],
    safetyNotes,
    ...MODEL_LOCKED_FLAGS,
  }
}

// ─── Session adapter builder (used by Hub to build TargetResolutionProgramInput) ─

/**
 * Builds a TargetResolutionProgramInput from a program's sessions array.
 * Does NOT import AdaptiveProgram — uses duck typing on the session shape.
 * The `completedDayNumbers` set is built from workout log evidence to mark
 * which sessions are completed (since AdaptiveSession has no `completed` field).
 */
export function buildTargetResolutionProgramInput(
  sessions: readonly {
    dayNumber?: number
    dayLabel?: string
    focus?: string
    focusLabel?: string
  }[],
  completedDayNumbers: ReadonlySet<number>,
): TargetResolutionProgramInput {
  return {
    sessions: sessions.map((s, idx) => ({
      id: null,
      title: s.focusLabel ?? s.focus ?? s.dayLabel ?? `Day ${s.dayNumber ?? idx + 1}`,
      dayNumber: s.dayNumber ?? (idx + 1),
      dayLabel: s.dayLabel ?? null,
      focus: s.focus ?? null,
      focusLabel: s.focusLabel ?? null,
      completed: completedDayNumbers.has(s.dayNumber ?? (idx + 1)),
    })),
  }
}
