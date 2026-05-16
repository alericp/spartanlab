/**
 * ============================================================================
 * MASTER-8C.22 / AB20.4.15 — COACH RECOMMENDATION CANDIDATE READ-ONLY ANALYZER
 * MASTER-8C.23 / AB20.4.16 — SOURCE QUALITY + EVIDENCE TIER REFINEMENT
 * ============================================================================
 *
 * Pure, deterministic, read-only bridge that turns existing source branch
 * analyzer outputs into honest recommendation candidates for Coach Recs.
 *
 * AB20.4.16 adds a source-quality layer so each candidate clearly explains:
 *   - What evidence tier it is based on (logged user evidence vs plan inference)
 *   - Whether the recommendation is ready for action or needs more data
 *   - Whether scary language should be avoided (no confirmed user harm from inference alone)
 *
 * This does NOT replace or weaken the existing AB11/AB12 evidence-derived
 * recommendation path (EvidenceCoachRecommendationBundle). It is a FALLBACK
 * that produces source-backed read-only candidates when no applied evidence
 * recommendation exists.
 *
 * Contract:
 *   1. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *   2. Deterministic — no Date.now(), no Math.random().
 *   3. No mutation — never changes program, sessions, exercises, sets, reps.
 *   4. No `as any`, no `@ts-ignore`, no `@ts-expect-error`.
 *   5. Safe for old programs with missing fields.
 *   6. Every candidate says appliedToProgram: false.
 *   7. Model always says noProgramChangesApplied: true.
 */

// ─── Output types ────────────────────────────────────────────────────────────

export type CoachRecommendationCandidateStatus =
  | 'read_only_active'
  | 'waiting_for_evidence'
  | 'blocked'
  | 'unavailable'

export type CoachRecommendationCandidatePriority =
  | 'high'
  | 'medium'
  | 'low'
  | 'info'

export type CoachRecommendationCandidateConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'insufficient'

export type CoachRecommendationCandidateCategory =
  | 'recovery'
  | 'prehab_tendon'
  | 'program_balance'
  | 'progression_periodization'
  | 'exercise_knowledge'
  | 'set_volume'
  | 'evidence_collection'
  | 'method_planning'
  | 'general'

// [MASTER-8C.23] Source-quality / evidence-tier types
export type CoachRecommendationEvidenceTier =
  | 'logged_user_evidence'
  | 'source_branch_inference'
  | 'plan_structure_inference'
  | 'missing_evidence'
  | 'mixed'

export type CoachRecommendationActionReadiness =
  | 'observe_only'
  | 'collect_evidence'
  | 'ready_for_review'
  | 'blocked_until_evidence'

export interface CoachRecommendationCandidate {
  readonly id: string
  readonly category: CoachRecommendationCandidateCategory
  readonly priority: CoachRecommendationCandidatePriority
  readonly confidence: CoachRecommendationCandidateConfidence
  readonly title: string
  readonly summary: string
  readonly recommendation: string
  readonly why: readonly string[]
  readonly sourceBasis: readonly string[]
  readonly missingSources: readonly string[]
  readonly appliedToProgram: false
  readonly mutationStatus: 'read_only_not_applied'
  // [MASTER-8C.23] Source-quality fields
  readonly evidenceTier: CoachRecommendationEvidenceTier
  readonly actionReadiness: CoachRecommendationActionReadiness
  readonly sourceQualityLabel: string
  readonly sourceQualityExplanation: string
  readonly shouldAvoidScaryLanguage: boolean
}

export interface CoachRecommendationCandidateReadonlyModel {
  readonly status: CoachRecommendationCandidateStatus
  readonly headline: string
  readonly summary: string
  readonly confidence: CoachRecommendationCandidateConfidence
  readonly sourceBasis: readonly string[]
  readonly missingSources: readonly string[]
  readonly candidates: readonly CoachRecommendationCandidate[]
  readonly topCandidate: CoachRecommendationCandidate | null
  readonly noProgramChangesApplied: true
  readonly noFutureSessionChangesApplied: true
  readonly mutationStatus: 'mutation_locked'
  readonly nextSafeAction: string
  // [MASTER-8C.23] Model-level source-quality fields
  readonly evidenceTierSummary: string
  readonly sourceQualitySummary: string
  readonly appliedRecommendationReadiness: 'not_ready' | 'needs_logged_evidence' | 'ready_for_review'
}

// ─── Minimal local input types (avoid circular deps) ─────────────────────────

export interface CoachRecRecoveryInput {
  readonly readinessLevel?: string
  readonly confidence?: string
  readonly signals?: readonly { readonly label?: string; readonly severity?: string }[]
}

export interface CoachRecSafeguardInput {
  readonly riskLevel?: string
  readonly confidence?: string
  readonly signals?: readonly { readonly label?: string; readonly severity?: string }[]
}

export interface CoachRecExerciseKnowledgeInput {
  readonly coverageRatio?: number
  readonly totalExerciseCount?: number
  readonly fullScienceKnownCount?: number
  readonly trulyUnknownCount?: number
}

export interface CoachRecProgressionInput {
  readonly posture?: string
  readonly progressionDirection?: string
  readonly confidence?: string
  readonly signals?: readonly { readonly label?: string; readonly severity?: string }[]
}

export interface CoachRecBalanceInput {
  readonly status?: string
  readonly findings?: readonly { readonly label?: string; readonly severity?: string }[]
}

export interface CoachRecommendationCandidateInput {
  readonly recoveryModel?: CoachRecRecoveryInput | null
  readonly safeguardModel?: CoachRecSafeguardInput | null
  readonly exerciseKnowledgeModel?: CoachRecExerciseKnowledgeInput | null
  readonly progressionModel?: CoachRecProgressionInput | null
  readonly balanceModel?: CoachRecBalanceInput | null
  readonly hasCompletedWorkoutEvidence?: boolean
  readonly hasWorkoutHistory?: boolean
  readonly sessionCount?: number
}

// ─── Priority order values (lower = higher priority) ─────────────────────────

const PRIORITY_ORDER: Record<CoachRecommendationCandidatePriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Determine evidence tier based on whether real user evidence exists */
function resolveEvidenceTier(
  hasLoggedEvidence: boolean,
  isFromSourceBranch: boolean
): CoachRecommendationEvidenceTier {
  if (hasLoggedEvidence && isFromSourceBranch) return 'mixed'
  if (hasLoggedEvidence) return 'logged_user_evidence'
  if (isFromSourceBranch) return 'source_branch_inference'
  return 'plan_structure_inference'
}

// ─── Main resolver ───────────────────────────────────────────────────────────

export function resolveCoachRecommendationCandidates(
  input: CoachRecommendationCandidateInput
): CoachRecommendationCandidateReadonlyModel {
  const candidates: CoachRecommendationCandidate[] = []
  const allSourceBasis: string[] = []
  const allMissingSources: string[] = []

  const hasLoggedEvidence = !!(input.hasCompletedWorkoutEvidence || input.hasWorkoutHistory)

  // ── 1. Prehab / Tendon safeguard candidate ──────────────────────────────
  if (input.safeguardModel) {
    allSourceBasis.push('Prehab/Rehab/Tendon Safeguards')
    const risk = input.safeguardModel.riskLevel || ''
    const riskSignals = (input.safeguardModel.signals || [])
      .filter(s => s.severity === 'caution' || s.severity === 'watch')
      .slice(0, 2)
      .map(s => s.label || 'tendon risk signal')

    // [MASTER-8C.23] Without logged pain/RPE, this is plan-structure inference only
    const tier = resolveEvidenceTier(hasLoggedEvidence, true)
    const noUserPainEvidence = !hasLoggedEvidence

    if (risk === 'elevated' || risk === 'high') {
      candidates.push({
        id: 'candidate_prehab_tendon_risk',
        category: 'prehab_tendon',
        // [MASTER-8C.23] Keep high for structural caution but clarify it is not confirmed harm
        priority: 'high',
        confidence: risk === 'high' ? 'medium' : 'medium',
        title: noUserPainEvidence
          ? 'High structural caution on tendon-heavy work'
          : 'Watch tendon-heavy work',
        summary: noUserPainEvidence
          ? `Safeguard analysis found ${risk} tendon/joint stress patterns in program structure. Not confirmed by logged pain or RPE data.`
          : `Safeguard analysis found ${risk} tendon/joint risk confirmed by workout evidence.`,
        recommendation: noUserPainEvidence
          ? 'Program contains tendon-heavy exercise patterns (straight-arm, planche, front lever). Keep high-stress skill work controlled. Log pain/RPE feedback to confirm or rule out actual risk before allowing applied changes.'
          : 'Keep high-stress skill work controlled. Collect ongoing pain/RPE feedback before allowing mutation.',
        why: riskSignals.length > 0
          ? riskSignals
          : [`Safeguard risk level: ${risk}`],
        sourceBasis: ['Prehab/Rehab/Tendon Safeguards'],
        missingSources: noUserPainEvidence ? ['Logged pain notes', 'Per-exercise RPE'] : [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
        evidenceTier: tier,
        actionReadiness: noUserPainEvidence ? 'collect_evidence' : 'observe_only',
        sourceQualityLabel: noUserPainEvidence ? 'Plan-structure signal' : 'Source-branch + evidence',
        sourceQualityExplanation: noUserPainEvidence
          ? 'Based on tendon-heavy exercise patterns in program structure, not confirmed by logged pain or RPE data.'
          : 'Supported by safeguard branch analysis and logged workout evidence.',
        shouldAvoidScaryLanguage: noUserPainEvidence,
      })
    } else if (risk === 'moderate') {
      candidates.push({
        id: 'candidate_prehab_tendon_moderate',
        category: 'prehab_tendon',
        priority: 'medium',
        confidence: 'medium',
        title: 'Monitor tendon stress patterns',
        summary: 'Moderate tendon/joint stress detected from program structure; monitoring recommended.',
        recommendation: 'Continue current program but track pain/discomfort in tendon-heavy exercises. Log per-exercise RPE to build evidence. Mutation is deferred until safeguard risk is better understood.',
        why: riskSignals.length > 0
          ? riskSignals
          : ['Moderate safeguard risk level'],
        sourceBasis: ['Prehab/Rehab/Tendon Safeguards'],
        missingSources: noUserPainEvidence ? ['Logged pain notes'] : [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
        evidenceTier: tier,
        actionReadiness: 'observe_only',
        sourceQualityLabel: 'Plan-structure signal',
        sourceQualityExplanation: 'Based on exercise stress patterns in program design, not confirmed by user-reported pain.',
        shouldAvoidScaryLanguage: true,
      })
    }
  } else {
    allMissingSources.push('Prehab/Rehab/Tendon Safeguards')
  }

  // ── 2. Recovery / Readiness candidate ───────────────────────────────────
  if (input.recoveryModel) {
    allSourceBasis.push('Recovery/Readiness')
    const readiness = input.recoveryModel.readinessLevel || ''
    const recSignals = (input.recoveryModel.signals || [])
      .filter(s => s.severity === 'caution' || s.severity === 'watch')
      .slice(0, 2)
      .map(s => s.label || 'recovery signal')

    // [MASTER-8C.23] Without logged readiness check-ins, this is plan-demand inference
    const tier = resolveEvidenceTier(hasLoggedEvidence, true)
    const noReadinessLogs = !hasLoggedEvidence

    if (readiness === 'reduced' || readiness === 'protected' || readiness === 'low') {
      candidates.push({
        id: 'candidate_recovery_reduced',
        category: 'recovery',
        // [MASTER-8C.23] High structural caution, but clarify it is not confirmed overtraining
        priority: 'high',
        confidence: noReadinessLogs ? 'low' : (input.recoveryModel.confidence === 'high' ? 'medium' : 'low'),
        title: noReadinessLogs
          ? 'Program structure suggests recovery should be monitored'
          : 'Monitor recovery before progressing',
        summary: noReadinessLogs
          ? `Recovery/readiness appears ${readiness} based on session demand patterns. Not confirmed by readiness check-ins or fatigue logs.`
          : `Recovery/readiness is ${readiness}; progression should stay conservative.`,
        recommendation: noReadinessLogs
          ? 'Program demand patterns suggest recovery monitoring is needed. Log readiness check-ins and per-session RPE to confirm whether recovery is actually limited. Do not assume overtraining from structure alone.'
          : 'Stay conservative on volume and intensity. Continue logging readiness and recovery state before increasing training demands.',
        why: recSignals.length > 0
          ? recSignals
          : [`Readiness level: ${readiness}`],
        sourceBasis: ['Recovery/Readiness'],
        missingSources: noReadinessLogs ? ['Readiness check-ins', 'Fatigue/sleep logs'] : [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
        evidenceTier: tier,
        actionReadiness: noReadinessLogs ? 'collect_evidence' : 'observe_only',
        sourceQualityLabel: noReadinessLogs ? 'Plan-demand signal' : 'Source-branch + evidence',
        sourceQualityExplanation: noReadinessLogs
          ? 'Inferred from session demand and exercise patterns. Not confirmed by logged readiness or fatigue data.'
          : 'Based on recovery/readiness branch analysis and logged training data.',
        shouldAvoidScaryLanguage: noReadinessLogs,
      })
    } else if (readiness === 'moderate') {
      candidates.push({
        id: 'candidate_recovery_moderate',
        category: 'recovery',
        priority: 'medium',
        confidence: 'medium',
        title: 'Keep progression conservative until readiness improves',
        summary: 'Recovery state is moderate based on program structure; some caution advised.',
        recommendation: 'Continue current training but avoid aggressive increases. Monitor readiness signals and collect logged workout feedback.',
        why: recSignals.length > 0
          ? recSignals
          : ['Moderate readiness level'],
        sourceBasis: ['Recovery/Readiness'],
        missingSources: noReadinessLogs ? ['Readiness check-ins'] : [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
        evidenceTier: tier,
        actionReadiness: 'observe_only',
        sourceQualityLabel: 'Source-branch inference',
        sourceQualityExplanation: 'Based on recovery/readiness branch analysis of program demand.',
        shouldAvoidScaryLanguage: true,
      })
    }
  } else {
    allMissingSources.push('Recovery/Readiness')
  }

  // ── 3. Progression / Periodization candidate ────────────────────────────
  if (input.progressionModel) {
    allSourceBasis.push('Progression/Periodization')
    const posture = input.progressionModel.posture || ''
    const direction = input.progressionModel.progressionDirection || ''
    const progConfidence = input.progressionModel.confidence || ''

    const tier = resolveEvidenceTier(hasLoggedEvidence, true)

    if (
      posture === 'recovery_protective' ||
      posture === 'mixed' ||
      posture === 'unclear' ||
      direction === 'blocked' ||
      direction === 'conservative'
    ) {
      const isBlocking = direction === 'blocked' || posture === 'recovery_protective'
      candidates.push({
        id: 'candidate_progression_conservative',
        category: 'progression_periodization',
        // [MASTER-8C.23] Blocking is medium, not high, unless confirmed by evidence
        priority: isBlocking && hasLoggedEvidence ? 'high' : 'medium',
        confidence: progConfidence === 'high' ? 'medium'
          : progConfidence === 'medium' ? 'low' : 'low',
        title: isBlocking
          ? 'Progression not ready for applied changes'
          : 'Keep progression conservative for now',
        summary: `Progression posture: ${posture || 'unknown'}. Direction: ${direction || 'unknown'}. ${hasLoggedEvidence ? 'Supported by workout evidence.' : 'Based on program structure and source branches.'}`,
        recommendation: isBlocking
          ? 'Progression appears constrained by recovery, missing evidence, or source quality. Do not increase intensity, volume, or complexity until the constraint resolves. Log workouts to build evidence.'
          : 'Progression should remain conservative. Multiple source signals suggest caution before advancing phase or increasing training demands.',
        why: (input.progressionModel.signals || [])
          .slice(0, 2)
          .map(s => s.label || 'progression signal'),
        sourceBasis: ['Progression/Periodization'],
        missingSources: hasLoggedEvidence ? [] : ['Logged performance trend'],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
        evidenceTier: tier,
        actionReadiness: isBlocking ? 'blocked_until_evidence' : 'observe_only',
        sourceQualityLabel: hasLoggedEvidence ? 'Source-branch + evidence' : 'Source-branch inference',
        sourceQualityExplanation: hasLoggedEvidence
          ? 'Based on progression branch analysis and logged workout evidence.'
          : 'Inferred from program structure, source branches, and missing performance data. Not confirmed by completed workout trends.',
        shouldAvoidScaryLanguage: !hasLoggedEvidence,
      })
    }
  } else {
    allMissingSources.push('Progression/Periodization')
  }

  // ── 4. Program Balance candidate ────────────────────────────────────────
  if (input.balanceModel) {
    allSourceBasis.push('Program Balance')
    const balanceStatus = input.balanceModel.status || ''
    const balanceFindings = (input.balanceModel.findings || [])
      .filter(f => f.severity === 'caution' || f.severity === 'watch')
      .slice(0, 2)

    if (balanceStatus === 'moderate' || balanceStatus === 'imbalanced' || balanceFindings.length > 0) {
      candidates.push({
        id: 'candidate_balance_monitor',
        category: 'program_balance',
        priority: balanceStatus === 'imbalanced' ? 'medium' : 'low',
        confidence: 'medium',
        title: 'Review balance before future adaptation',
        summary: 'Program balance analysis found structural patterns to monitor before mutation.',
        recommendation: 'Current program has balance considerations in movement family distribution. Review push/pull ratio and movement coverage before allowing automated changes. This is a structural observation, not a confirmed issue.',
        why: balanceFindings.length > 0
          ? balanceFindings.map(f => f.label || 'balance finding')
          : [`Balance status: ${balanceStatus}`],
        sourceBasis: ['Program Balance'],
        missingSources: [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
        evidenceTier: 'plan_structure_inference',
        actionReadiness: 'observe_only',
        sourceQualityLabel: 'Plan-structure signal',
        sourceQualityExplanation: 'Based on movement family and push/pull analysis of program design. Balance findings are structural observations.',
        shouldAvoidScaryLanguage: true,
      })
    }
  } else {
    allMissingSources.push('Program Balance')
  }

  // ── 5. Exercise Knowledge candidate ─────────────────────────────────────
  if (input.exerciseKnowledgeModel) {
    allSourceBasis.push('Exercise Knowledge')
    const coverage = input.exerciseKnowledgeModel.coverageRatio ?? 0
    const unknowns = input.exerciseKnowledgeModel.trulyUnknownCount ?? 0

    if (coverage < 0.7 || unknowns > 0) {
      candidates.push({
        id: 'candidate_exercise_knowledge_gaps',
        category: 'exercise_knowledge',
        priority: unknowns > 2 ? 'medium' : 'low',
        confidence: 'medium',
        title: 'Expand exercise knowledge before deeper automation',
        summary: `Exercise knowledge covers ${Math.round(coverage * 100)}% of program exercises${unknowns > 0 ? `; ${unknowns} truly unknown` : ''}.`,
        recommendation: 'Some exercises lack full science knowledge entries. Expand coverage for current program exercises before allowing mutation to rely on exercise knowledge. Unknown exercises may receive generic prescriptions.',
        why: unknowns > 0
          ? [`${unknowns} exercises have no science knowledge`]
          : [`Coverage ratio: ${Math.round(coverage * 100)}%`],
        sourceBasis: ['Exercise Knowledge'],
        missingSources: [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
        evidenceTier: 'source_branch_inference',
        actionReadiness: 'observe_only',
        sourceQualityLabel: 'Source-branch inference',
        sourceQualityExplanation: 'Based on exercise knowledge seed coverage analysis. Coverage gaps are factual, not inferred.',
        shouldAvoidScaryLanguage: true,
      })
    }
  } else {
    allMissingSources.push('Exercise Knowledge')
  }

  // ── 6. Evidence collection candidate ────────────────────────────────────
  if (!input.hasCompletedWorkoutEvidence && !input.hasWorkoutHistory) {
    candidates.push({
      id: 'candidate_evidence_collection',
      category: 'evidence_collection',
      priority: 'medium',
      confidence: 'high',
      title: 'Log workouts to unlock applied recommendations',
      summary: 'No completed workout evidence detected. All current recommendations are based on program structure and source branch inference only.',
      recommendation: 'Complete and log workouts with RPE and readiness feedback to build real evidence. Applied coach recommendations, progression decisions, and future-session mutation all depend on logged performance data. Until then, all recommendations remain read-only previews.',
      why: ['No completed workout history found', 'All recommendations are plan-structure inference only'],
      sourceBasis: ['Adaptive Foundation'],
      missingSources: ['Completed workouts', 'Per-exercise RPE', 'Readiness check-ins', 'Session completion rate'],
      appliedToProgram: false,
      mutationStatus: 'read_only_not_applied',
      evidenceTier: 'missing_evidence',
      actionReadiness: 'collect_evidence',
      sourceQualityLabel: 'Needs logged evidence',
      sourceQualityExplanation: 'No completed workout evidence exists. All current recommendations are inferred from program design, not confirmed by user performance.',
      shouldAvoidScaryLanguage: true,
    })
  }

  // ── 7. Set / Volume rationale info candidate ────────────────────────────
  if ((input.sessionCount ?? 0) > 0) {
    candidates.push({
      id: 'candidate_set_volume_info',
      category: 'set_volume',
      priority: 'info',
      confidence: 'low',
      title: 'Set/volume rationale needs stronger evidence',
      summary: 'Set/volume prescription rationale is partially sourced; stronger evidence needed before changing sets.',
      recommendation: 'Current set counts are based on generator defaults and partial rationale. Do not change sets automatically until prescription rationale has full source backing and logged performance evidence.',
      why: ['Set/volume rationale is partial'],
      sourceBasis: ['Set/Volume Rationale'],
      missingSources: ['Logged RPE per exercise', 'Volume response trend'],
      appliedToProgram: false,
      mutationStatus: 'read_only_not_applied',
      evidenceTier: 'plan_structure_inference',
      actionReadiness: 'observe_only',
      sourceQualityLabel: 'Plan-structure signal',
      sourceQualityExplanation: 'Set counts are from generator defaults. No logged RPE or volume response data available to refine.',
      shouldAvoidScaryLanguage: true,
    })
  }

  // ── Sort candidates by priority ─────────────────────────────────────────
  candidates.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  // ── Determine overall status and confidence ─────────────────────────────
  const uniqueSources = [...new Set(allSourceBasis)]
  const uniqueMissing = [...new Set(allMissingSources)]

  if (candidates.length === 0) {
    return {
      status: 'unavailable',
      headline: 'Coach recommendations need source data',
      summary: 'No source branches provided enough signals to generate recommendation candidates.',
      confidence: 'insufficient',
      sourceBasis: uniqueSources,
      missingSources: uniqueMissing,
      candidates: [],
      topCandidate: null,
      noProgramChangesApplied: true,
      noFutureSessionChangesApplied: true,
      mutationStatus: 'mutation_locked',
      nextSafeAction: 'Build source branch coverage; log workouts to unlock applied recommendations',
      evidenceTierSummary: 'No evidence tier available',
      sourceQualitySummary: 'No source branches contributed recommendations',
      appliedRecommendationReadiness: 'not_ready',
    }
  }

  const topCandidate = candidates[0]

  // [MASTER-8C.23] Determine overall confidence — downgrade if no logged evidence
  let overallConfidence: CoachRecommendationCandidateConfidence = 'low'
  if (hasLoggedEvidence && uniqueSources.length >= 3) {
    overallConfidence = topCandidate.confidence === 'high' ? 'high' : 'medium'
  } else if (uniqueSources.length >= 3) {
    overallConfidence = 'medium'
  } else if (uniqueSources.length >= 2) {
    overallConfidence = 'low'
  } else {
    overallConfidence = 'low'
  }

  // Determine status
  const status: CoachRecommendationCandidateStatus = hasLoggedEvidence
    ? 'read_only_active'
    : candidates.some(c => c.priority === 'high' || c.priority === 'medium')
    ? 'waiting_for_evidence'
    : 'read_only_active'

  const highCount = candidates.filter(c => c.priority === 'high').length
  const medCount = candidates.filter(c => c.priority === 'medium').length

  const headline = highCount > 0
    ? `${highCount} structural caution${highCount > 1 ? 's' : ''} to review`
    : medCount > 0
    ? `${medCount} recommendation${medCount > 1 ? 's' : ''} to review`
    : `${candidates.length} recommendation candidate${candidates.length > 1 ? 's' : ''}`

  const summaryText = `${candidates.length} source-backed candidate${candidates.length > 1 ? 's' : ''}. ` +
    `Top: ${topCandidate.title}. ` +
    `${uniqueSources.length} source branch${uniqueSources.length > 1 ? 'es' : ''} contributing.`

  // [MASTER-8C.23] Evidence tier summary
  const tierCounts = {
    logged: candidates.filter(c => c.evidenceTier === 'logged_user_evidence' || c.evidenceTier === 'mixed').length,
    branch: candidates.filter(c => c.evidenceTier === 'source_branch_inference').length,
    plan: candidates.filter(c => c.evidenceTier === 'plan_structure_inference').length,
    missing: candidates.filter(c => c.evidenceTier === 'missing_evidence').length,
  }

  let evidenceTierSummary: string
  if (tierCounts.logged > 0 && tierCounts.plan === 0 && tierCounts.missing === 0) {
    evidenceTierSummary = 'All candidates supported by logged evidence'
  } else if (tierCounts.logged === 0 && tierCounts.missing === 0) {
    evidenceTierSummary = 'All candidates from branch/plan inference only'
  } else if (tierCounts.missing > 0 && tierCounts.logged === 0) {
    evidenceTierSummary = 'Branch inference + missing evidence; no logged workout data'
  } else {
    evidenceTierSummary = 'Mixed evidence tiers'
  }

  const sourceQualitySummary = hasLoggedEvidence
    ? `Source quality: branch inference + logged evidence from ${uniqueSources.length} branches`
    : `Source quality: branch/plan inference only; needs logged workout evidence`

  const appliedRecommendationReadiness = hasLoggedEvidence
    ? 'ready_for_review' as const
    : candidates.some(c => c.actionReadiness === 'blocked_until_evidence')
    ? 'not_ready' as const
    : 'needs_logged_evidence' as const

  return {
    status,
    headline,
    summary: summaryText,
    confidence: overallConfidence,
    sourceBasis: uniqueSources,
    missingSources: uniqueMissing,
    candidates: candidates.slice(0, 5),
    topCandidate,
    noProgramChangesApplied: true,
    noFutureSessionChangesApplied: true,
    mutationStatus: 'mutation_locked',
    nextSafeAction: hasLoggedEvidence
      ? 'Refine candidate priority scoring; mutation still deferred'
      : 'Log workouts to unlock applied recommendations; mutation deferred',
    evidenceTierSummary,
    sourceQualitySummary,
    appliedRecommendationReadiness,
  }
}
