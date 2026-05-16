/**
 * ============================================================================
 * MASTER-8C.22 / AB20.4.15 — COACH RECOMMENDATION CANDIDATE READ-ONLY ANALYZER
 * ============================================================================
 *
 * Pure, deterministic, read-only bridge that turns existing source branch
 * analyzer outputs into honest recommendation candidates for Coach Recs.
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

// ─── Main resolver ───────────────────────────────────────────────────────────

export function resolveCoachRecommendationCandidates(
  input: CoachRecommendationCandidateInput
): CoachRecommendationCandidateReadonlyModel {
  const candidates: CoachRecommendationCandidate[] = []
  const allSourceBasis: string[] = []
  const allMissingSources: string[] = []

  // ── 1. Prehab / Tendon safeguard candidate ──────────────────────────────
  if (input.safeguardModel) {
    allSourceBasis.push('Prehab/Rehab/Tendon Safeguards')
    const risk = input.safeguardModel.riskLevel || ''
    const riskSignals = (input.safeguardModel.signals || [])
      .filter(s => s.severity === 'caution' || s.severity === 'watch')
      .slice(0, 2)
      .map(s => s.label || 'tendon risk signal')

    if (risk === 'elevated' || risk === 'high') {
      candidates.push({
        id: 'candidate_prehab_tendon_risk',
        category: 'prehab_tendon',
        priority: 'high',
        confidence: risk === 'high' ? 'high' : 'medium',
        title: 'Watch tendon-heavy work',
        summary: `Safeguard analysis found ${risk} tendon/joint risk in this program.`,
        recommendation: 'Keep high-stress skill work (straight-arm, planche, front lever) controlled. Collect pain/RPE feedback before allowing mutation. Consider reducing volume on overlapping tendon-intensive exercises.',
        why: riskSignals.length > 0
          ? riskSignals
          : [`Safeguard risk level: ${risk}`],
        sourceBasis: ['Prehab/Rehab/Tendon Safeguards'],
        missingSources: [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
      })
    } else if (risk === 'moderate') {
      candidates.push({
        id: 'candidate_prehab_tendon_moderate',
        category: 'prehab_tendon',
        priority: 'medium',
        confidence: 'medium',
        title: 'Monitor tendon stress',
        summary: 'Moderate tendon/joint stress detected; monitor but not blocking.',
        recommendation: 'Continue current program but track pain/discomfort in tendon-heavy exercises. Mutation is deferred until safeguard risk stabilizes.',
        why: riskSignals.length > 0
          ? riskSignals
          : ['Moderate safeguard risk level'],
        sourceBasis: ['Prehab/Rehab/Tendon Safeguards'],
        missingSources: [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
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

    if (readiness === 'reduced' || readiness === 'protected' || readiness === 'low') {
      candidates.push({
        id: 'candidate_recovery_reduced',
        category: 'recovery',
        priority: 'high',
        confidence: input.recoveryModel.confidence === 'high' ? 'high' : 'medium',
        title: 'Monitor recovery before progressing',
        summary: `Recovery/readiness is ${readiness}; progression should stay conservative.`,
        recommendation: 'Stay conservative on volume and intensity. Log readiness and recovery state before increasing training demands. Do not advance progression until recovery improves.',
        why: recSignals.length > 0
          ? recSignals
          : [`Readiness level: ${readiness}`],
        sourceBasis: ['Recovery/Readiness'],
        missingSources: [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
      })
    } else if (readiness === 'moderate') {
      candidates.push({
        id: 'candidate_recovery_moderate',
        category: 'recovery',
        priority: 'medium',
        confidence: 'medium',
        title: 'Keep progression conservative until readiness improves',
        summary: 'Recovery state is moderate; some caution advised.',
        recommendation: 'Continue current training but avoid aggressive increases. Monitor readiness signals and collect logged workout feedback.',
        why: recSignals.length > 0
          ? recSignals
          : ['Moderate readiness level'],
        sourceBasis: ['Recovery/Readiness'],
        missingSources: [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
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
        priority: isBlocking ? 'high' : 'medium',
        confidence: progConfidence === 'high' ? 'high'
          : progConfidence === 'medium' ? 'medium' : 'low',
        title: isBlocking
          ? 'Progression is blocked or recovery-protective'
          : 'Keep progression conservative for now',
        summary: `Progression posture: ${posture || 'unknown'}. Direction: ${direction || 'unknown'}.`,
        recommendation: isBlocking
          ? 'Program appears in a protective or blocked phase. Do not increase intensity, volume, or complexity until the blocking constraint resolves (recovery, evidence, or source quality).'
          : 'Progression should remain conservative. Multiple source signals suggest caution before advancing phase or increasing training demands.',
        why: (input.progressionModel.signals || [])
          .slice(0, 2)
          .map(s => s.label || 'progression signal'),
        sourceBasis: ['Progression/Periodization'],
        missingSources: [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
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
        summary: 'Program balance analysis found areas to monitor before mutation.',
        recommendation: 'Current program has balance considerations. Review movement family distribution and push/pull ratio before allowing automated changes.',
        why: balanceFindings.length > 0
          ? balanceFindings.map(f => f.label || 'balance finding')
          : [`Balance status: ${balanceStatus}`],
        sourceBasis: ['Program Balance'],
        missingSources: [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
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
        title: 'Improve exercise knowledge before deeper automation',
        summary: `Exercise knowledge covers ${Math.round(coverage * 100)}% of program exercises${unknowns > 0 ? `; ${unknowns} truly unknown` : ''}.`,
        recommendation: 'Expand exercise science coverage for current program exercises before allowing mutation to rely on exercise knowledge. Unknown exercises may receive generic or incorrect prescriptions.',
        why: unknowns > 0
          ? [`${unknowns} exercises have no science knowledge`]
          : [`Coverage ratio: ${Math.round(coverage * 100)}%`],
        sourceBasis: ['Exercise Knowledge'],
        missingSources: [],
        appliedToProgram: false,
        mutationStatus: 'read_only_not_applied',
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
      summary: 'No completed workout evidence detected. Applied recommendations require logged sessions.',
      recommendation: 'Complete and log workouts with RPE and readiness feedback to build evidence. Applied coach recommendations, progression decisions, and future-session mutation all depend on real performance data.',
      why: ['No completed workout history found', 'Applied recommendations require evidence'],
      sourceBasis: ['Adaptive Foundation'],
      missingSources: ['Logged performance', 'Recent RPE', 'Completed workout trend'],
      appliedToProgram: false,
      mutationStatus: 'read_only_not_applied',
    })
  }

  // ── 7. Set / Volume rationale info candidate ────────────────────────────
  // Always include as low-priority info when we have session data
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
    }
  }

  const topCandidate = candidates[0]

  // Determine overall confidence from top candidate + source count
  let overallConfidence: CoachRecommendationCandidateConfidence = 'low'
  if (uniqueSources.length >= 3 && topCandidate.confidence !== 'insufficient') {
    overallConfidence = topCandidate.confidence === 'high' ? 'high' : 'medium'
  } else if (uniqueSources.length >= 2) {
    overallConfidence = topCandidate.confidence === 'high' ? 'medium' : 'low'
  } else {
    overallConfidence = 'low'
  }

  // Determine status
  const hasEvidence = input.hasCompletedWorkoutEvidence || input.hasWorkoutHistory
  const status: CoachRecommendationCandidateStatus = hasEvidence
    ? 'read_only_active'
    : candidates.some(c => c.priority === 'high' || c.priority === 'medium')
    ? 'waiting_for_evidence'
    : 'read_only_active'

  const highCount = candidates.filter(c => c.priority === 'high').length
  const medCount = candidates.filter(c => c.priority === 'medium').length

  const headline = highCount > 0
    ? `${highCount} high-priority recommendation${highCount > 1 ? 's' : ''}`
    : medCount > 0
    ? `${medCount} recommendation${medCount > 1 ? 's' : ''} to review`
    : `${candidates.length} recommendation candidate${candidates.length > 1 ? 's' : ''}`

  const summaryText = `${candidates.length} source-backed candidate${candidates.length > 1 ? 's' : ''}. ` +
    `Top: ${topCandidate.title}. ` +
    `${uniqueSources.length} source branch${uniqueSources.length > 1 ? 'es' : ''} contributing.`

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
    nextSafeAction: hasEvidence
      ? 'Refine candidate priority scoring; mutation still deferred'
      : 'Log workouts to unlock applied recommendations; mutation deferred',
  }
}
