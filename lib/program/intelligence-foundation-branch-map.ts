/**
 * INTELLIGENCE FOUNDATION BRANCH MAP — MASTER-8C.16
 *
 * =============================================================================
 * CROSS-BRANCH INTELLIGENCE FOUNDATION MAP
 * =============================================================================
 *
 * This module provides a compact, UI-consumable map of all AI intelligence
 * branches in the SpartanLab adaptive training system. It derives from
 * true-source-registry.ts and adds:
 *
 *   - Set / Volume Prescription Rationale (new branch)
 *   - UI-friendly status labels
 *   - Compact next-action summaries
 *   - Risk-if-ignored short descriptions
 *   - Mutation status for honest UI display
 *
 * IMPORTANT GUARANTEES:
 *   - Pure TypeScript, JSON-safe, side-effect free
 *   - No localStorage, no Date.now, no React imports
 *   - No runtime imports from heavy builder/UI files
 *   - No mutation functions
 *   - No `as any`, no `@ts-ignore`
 *
 * Created: MASTER-8C.16
 */

// =============================================================================
// BRANCH STATUS TYPES
// =============================================================================

/**
 * UI-friendly branch status for display chips.
 */
export type IntelligenceBranchUIStatus =
  | 'active'
  | 'partial'
  | 'read_only'
  | 'mutation_locked'
  | 'protected_runtime'
  | 'missing_foundation'
  | 'future_needed'

/**
 * Mutation capability status for honest UI display.
 */
export type IntelligenceBranchMutationStatus =
  | 'none'
  | 'display_only'
  | 'read_only'
  | 'protected'
  | 'mutation_locked'
  | 'user_confirmed_only'
  | 'future_writer_pending'

// =============================================================================
// FOUNDATION BRANCH MAP ENTRY
// =============================================================================

/**
 * Compact UI-consumable branch entry for the foundation map.
 */
export interface IntelligenceFoundationBranchEntry {
  readonly id: string
  readonly label: string
  readonly uiStatus: IntelligenceBranchUIStatus
  readonly mutationStatus: IntelligenceBranchMutationStatus
  readonly currentRole: string
  readonly nextSafeAction: string
  readonly riskIfIgnored: string
  readonly sourceFiles: readonly string[]
  readonly consumedBy: readonly string[]
  readonly currentUISurface: string | null
  readonly order: number
}

// =============================================================================
// FOUNDATION BRANCH MAP
// =============================================================================

/**
 * The canonical foundation branch map for UI consumption.
 * Derived from true-source-registry.ts with UI-friendly formatting.
 */
export const INTELLIGENCE_FOUNDATION_BRANCH_MAP: readonly IntelligenceFoundationBranchEntry[] = [
  // -------------------------------------------------------------------------
  // EXERCISE KNOWLEDGE BASE (MASTER-8C.20 - Coverage analyzer active)
  // -------------------------------------------------------------------------
  {
    id: 'exercise_skill_knowledge_base',
    label: 'Exercise Knowledge Base',
    uiStatus: 'read_only',
    mutationStatus: 'read_only',
    currentRole: 'Scans current-program exercises against science seed, adaptive pool, and alias resolver for coverage proof',
    nextSafeAction: 'Expand current-program science coverage; generator mutation deferred',
    riskIfIgnored: 'Generic decisions without exercise science backing',
    sourceFiles: [
      'lib/program/exercise-knowledge-coverage-readonly-analyzer.ts',
      'lib/program/program-balance-exercise-identity-coverage.ts',
      'lib/program/exercise-skill-knowledge-contract.ts',
      'lib/program/exercise-skill-knowledge-seed.ts',
    ],
    consumedBy: ['Program Balance', 'Plan Logic', 'Prehab/Rehab Safeguards'],
    currentUISurface: 'Plan Logic map',
    order: 1,
  },

  // -------------------------------------------------------------------------
  // PROGRAM BALANCE
  // -------------------------------------------------------------------------
  {
    id: 'program_balance',
    label: 'Program Balance',
    uiStatus: 'read_only',
    mutationStatus: 'read_only',
    currentRole: 'Detect planche under-expression, pull dominance, push/pull imbalance, weighted anchor gaps',
    nextSafeAction: 'Read-only analysis active; user-confirmed mutation pending full DB gate',
    riskIfIgnored: 'Imbalanced programs without detection or correction',
    sourceFiles: [
      'lib/program/program-balance-readonly-analyzer.ts',
      'lib/program/program-balance-intelligence-contract.ts',
    ],
    consumedBy: ['Method Planner', 'Future Session Candidates'],
    currentUISurface: 'Program Balance tile',
    order: 2,
  },

  // -------------------------------------------------------------------------
  // PREHAB / REHAB / TENDON / JOINT SAFEGUARDS (MASTER-8C.18 - Read-only analyzer active)
  // -------------------------------------------------------------------------
  {
    id: 'prehab_rehab_tendon_joint',
    label: 'Prehab / Rehab / Tendon Safeguards',
    uiStatus: 'read_only',
    mutationStatus: 'mutation_locked',
    currentRole: 'Scores joint/tendon/prehab stress from visible session structure and exercise knowledge',
    nextSafeAction: 'Expand evidence inputs; mutation deferred until read-only scoring is stronger',
    riskIfIgnored: 'Safeguards are decorative instead of protective',
    sourceFiles: [
      'lib/program/adaptive-foundation-model.ts',
      'lib/program/prehab-rehab-tendon-safeguard-readonly-analyzer.ts',
    ],
    consumedBy: ['Adaptive Foundation', 'Program Balance', 'Plan Logic'],
    currentUISurface: 'Adaptive Foundation sheet, Plan Logic map',
    order: 3,
  },

  // -------------------------------------------------------------------------
  // RECOVERY / READINESS (MASTER-8C.19 - Read-only analyzer active)
  // -------------------------------------------------------------------------
  {
    id: 'recovery_readiness',
    label: 'Recovery / Readiness',
    uiStatus: 'read_only',
    mutationStatus: 'mutation_locked',
    currentRole: 'Scores recovery demand and readiness from session structure, adaptive foundation, and balance signals',
    nextSafeAction: 'Continue readiness source expansion; mutation writer pending stronger evidence',
    riskIfIgnored: 'Recovery data displayed but not used in adaptation',
    sourceFiles: [
      'lib/program/recovery-readiness-readonly-analyzer.ts',
      'lib/program/recovery-adaptation-snapshot-contract.ts',
      'lib/program/recovery-program-awareness-bridge.ts',
      'lib/training-feedback-loop.ts',
    ],
    consumedBy: ['Adaptive Foundation', 'Program Balance', 'Plan Logic'],
    currentUISurface: 'Adaptive Foundation sheet, Plan Logic map',
    order: 4,
  },

  // -------------------------------------------------------------------------
  // PROGRESSION / PERIODIZATION (MASTER-8C.21 - Read-only analyzer active)
  // -------------------------------------------------------------------------
  {
    id: 'progression_periodization',
    label: 'Progression / Periodization',
    uiStatus: 'read_only',
    mutationStatus: 'mutation_locked',
    currentRole: 'Classifies current program posture, progression direction, and phase coherence from all available source branches',
    nextSafeAction: 'Continue read-only observation; generator mutation deferred until stronger evidence',
    riskIfIgnored: 'Progression decisions made without visible posture classification or source proof',
    sourceFiles: [
      'lib/program/progression-periodization-readonly-analyzer.ts',
    ],
    consumedBy: ['Plan Logic', 'Coach Recs'],
    currentUISurface: 'Plan Logic map',
    order: 5,
  },

  // -------------------------------------------------------------------------
  // SET / VOLUME PRESCRIPTION RATIONALE (MASTER-8C.17 - Read-only analyzer active)
  // -------------------------------------------------------------------------
  {
    id: 'set_volume_prescription_rationale',
    label: 'Set / Volume Prescription Rationale',
    uiStatus: 'partial',
    mutationStatus: 'read_only',
    currentRole: 'Read-only analyzer explaining why rows get 3/4/5+ sets based on role, progression, method context, RPE/rest',
    nextSafeAction: 'Expand source coverage; consider bounded set-count mutation only after read-only is proven',
    riskIfIgnored: 'Rows show volume choices without coach-readable rationale',
    sourceFiles: [
      'lib/program/set-volume-prescription-rationale.ts',
    ],
    consumedBy: ['Plan Logic', 'Program Cards'],
    currentUISurface: 'Plan Logic (foundation map)',
    order: 6,
  },

  // -------------------------------------------------------------------------
  // ADAPTIVE FOUNDATION
  // -------------------------------------------------------------------------
  {
    id: 'adaptive_foundation',
    label: 'Adaptive Foundation',
    uiStatus: 'read_only',
    mutationStatus: 'read_only',
    currentRole: 'Typed read-only athlete model, evidence snapshot, constraints, safeguards',
    nextSafeAction: 'Feed readiness/safeguard/program balance; mutation pending',
    riskIfIgnored: 'Looks intelligent without changing training',
    sourceFiles: [
      'lib/program/adaptive-foundation-model.ts',
    ],
    consumedBy: ['Program Balance', 'Coach Recs', 'Calibration'],
    currentUISurface: 'Adaptive Foundation tile',
    order: 6,
  },

  // -------------------------------------------------------------------------
  // EVIDENCE / WORKOUT HISTORY
  // -------------------------------------------------------------------------
  {
    id: 'evidence_workout_history',
    label: 'Evidence / Workout History',
    uiStatus: 'partial',
    mutationStatus: 'read_only',
    currentRole: 'Logged sets, RPE, band usage, discomfort notes, workout completion',
    nextSafeAction: 'Drive adaptation confidence; feed future writer',
    riskIfIgnored: 'Logged data does not change anything',
    sourceFiles: [
      'lib/workout-log-service.ts',
      'lib/training-feedback-loop.ts',
    ],
    consumedBy: ['Adaptive Foundation', 'Calibration', 'Coach Recs', 'Recovery'],
    currentUISurface: 'Adaptive Foundation sheet',
    order: 7,
  },

  // -------------------------------------------------------------------------
  // PLAN LOGIC (MASTER-8C.73 - Marker-save dry-run verification gate)
  // -------------------------------------------------------------------------
  {
    id: 'plan_logic',
    label: 'Plan Logic',
    uiStatus: 'read_only',
    mutationStatus: 'display_only',
    currentRole: 'Construction rationale plus read-only plan evidence hook, evidence trend classification/readiness scoring, mutation-readiness review gate, mutation pathway readiness map, target-session resolution preview with completed/future session identity resolution, confirmation contract preview, caution clearance gate, structural mutation preview contract, marker-only confirmation boundary, marker-save authorization preflight boundary, controlled marker-save action boundary, marker-save artifact preview, marker write readiness ledger, local marker saved proof (in-memory), persistence readiness evaluation, durable marker receipt candidate readiness evaluation, controlled durable receipt writer contract preview, explicit persistence activation lock gate, controlled no-write durable receipt writer harness, read-only durable receipt writer eligibility ledger, read-only durable receipt writer activation preconditions review, read-only explicit persistence activation request preview, read-only activation request authorization lock, read-only explicit activation request intent capture preview, read-only explicit activation authorization review preview, read-only controlled activation permission boundary preview, read-only explicit persistence activation consent preview, read-only consent authorization lock preview, read-only consent decision state preview, read-only consent decision review lock preview, read-only consent permission boundary preview, read-only persistence permission review preview, read-only persistence write preflight preview, read-only persistence writer activation review preview, read-only persistence boundary review preview, read-only persistence writer gate preview, read-only persistence writer boundary step preview, read-only persistence writer boundary continuity preview, mutation unlock roadmap decision gate, writer-open preview boundary, local authorization + caution review gate, future session adaptive preview diff, controlled marker-save dry-run candidate, and marker-save dry-run verification gate',
    nextSafeAction: 'Prompt 78 Program Card adaptation marker preview visible/preview-only; no actual Program Card changes; no Start Workout/Live Workout bridge; no storage/API/DB/schema; next Prompt 79 Program Card changed-session proof according to roadmap',
    riskIfIgnored: 'Local receipt gate skipped, advancing to persistence without verifying local receipt proof',
    sourceFiles: [
      'components/programs/ProgramTruthSummary.tsx',
      'lib/program/program-display-contract.ts',
      'lib/program/plan-evidence-readonly-hook.ts',
      'lib/program/plan-evidence-trend-readiness.ts',
      'lib/program/mutation-readiness-review-gate.ts',
      'lib/program/mutation-pathway-readiness-map.ts',
      'lib/program/mutation-target-session-resolution-preview.ts',
      'lib/program/workout-log-session-identity-readonly-bridge.ts',
      'lib/program/mutation-confirmation-contract-preview.ts',
      'lib/program/mutation-caution-clearance-gate.ts',
      'lib/program/structural-mutation-preview-contract.ts',
      'lib/program/user-confirmation-marker-permission-preview-gate.ts',
      'lib/program/future-session-mutation-writer-readiness-boundary.ts',
      'lib/program/pre-mutation-lock-bundle-closure.ts',
      'lib/program/controlled-future-session-mutation-writer-dry-run.ts',
      'lib/program/bounded-mutation-apply-eligibility-gate.ts',
      'lib/program/marker-only-confirmation-boundary.ts',
      'lib/program/marker-save-authorization-preflight-boundary.ts',
      'lib/program/controlled-marker-save-action-boundary.ts',
      'lib/program/marker-save-artifact-preview.ts',
      'lib/program/marker-write-readiness-ledger.ts',
      'lib/program/durable-marker-receipt-readiness.ts',
      'lib/program/controlled-durable-marker-receipt-writer-preview.ts',
      'lib/program/persistence-writer-activation-lock-gate.ts',
      'lib/program/controlled-durable-marker-receipt-writer-no-write-harness.ts',
      'lib/program/durable-receipt-writer-eligibility-ledger.ts',
      'lib/program/durable-receipt-writer-activation-preconditions-review.ts',
      'lib/program/explicit-persistence-activation-request-preview.ts',
      'lib/program/activation-request-authorization-lock.ts',
      'lib/program/explicit-activation-request-intent-capture-preview.ts',
      'lib/program/explicit-activation-authorization-review-preview.ts',
      'lib/program/controlled-activation-permission-boundary-preview.ts',
      'lib/program/explicit-persistence-activation-consent-preview.ts',
      'lib/program/consent-authorization-lock-preview.ts',
      'lib/program/consent-decision-state-preview.ts',
      'lib/program/consent-decision-review-lock-preview.ts',
      'lib/program/consent-permission-boundary-preview.ts',
      'lib/program/persistence-permission-review-preview.ts',
      'lib/program/persistence-write-preflight-preview.ts',
      'lib/program/persistence-writer-activation-review-preview.ts',
      'lib/program/persistence-boundary-review-preview.ts',
      'lib/program/persistence-writer-gate-preview.ts',
      'lib/program/persistence-writer-boundary-step-preview.ts',
      'lib/program/persistence-writer-boundary-continuity-preview.ts',
      'lib/program/mutation-unlock-roadmap-decision-gate.ts',
      'lib/program/writer-open-preview-boundary.ts',
      'lib/program/local-authorization-caution-review-gate.ts',
      'lib/program/future-session-adaptive-preview-diff.ts',
      'lib/program/controlled-marker-save-dry-run-candidate.ts',
      'lib/program/controlled-marker-save-dry-run-verification-gate.ts',
      'lib/program/controlled-marker-save-local-receipt-gate.ts', // [Prompt 69]
    ],
    consumedBy: ['Coach Intelligence Hub'],
    currentUISurface: 'Plan Logic tile + sheet + AI Intelligence Foundation Map row',
    order: 8,
  },

  // -------------------------------------------------------------------------
  // COACH RECS (MASTER-8C.24 - Workout evidence bridge connected)
  // -------------------------------------------------------------------------
  {
    id: 'coach_recs',
    label: 'Coach Recs',
    uiStatus: 'read_only',
    mutationStatus: 'mutation_locked',
    currentRole: 'Generates source-quality-aware read-only recommendation candidates from Recovery, Prehab/Tendon, Balance, Progression, Exercise Knowledge + local trusted workout evidence; distinguishes plan-structure inference from logged user evidence',
    nextSafeAction: 'Evidence trend classification / pattern detection; applied recommendations still deferred',
    riskIfIgnored: 'Recommendations cannot distinguish plan inference from real workout feedback',
    sourceFiles: [
      'lib/program/coach-recommendation-candidate-readonly-analyzer.ts',
      'lib/program/coach-recommendation-workout-evidence-readonly-bridge.ts',
      'lib/program/evidence-derived-coach-recommendations.ts',
      'components/programs/EvidenceCoachRecommendationCard.tsx',
    ],
    consumedBy: ['Coach Intelligence Hub'],
    currentUISurface: 'Coach Recs tile + sheet + Plan Logic map',
    order: 9,
  },

  // -------------------------------------------------------------------------
  // METHOD PLANNER
  // -------------------------------------------------------------------------
  {
    id: 'method_planner',
    label: 'Method Planner',
    uiStatus: 'active',
    mutationStatus: 'user_confirmed_only',
    currentRole: 'User-requested method additions/overrides with preview and apply capability',
    nextSafeAction: 'Protected working behavior; Superset structural apply complete',
    riskIfIgnored: 'Counts drift or applied/native/preview rows disagree',
    sourceFiles: [
      'lib/program/requested-method-override-planner.ts',
      'lib/program/method-override-artifacts.ts',
    ],
    consumedBy: ['Program Cards', 'Saved Program Persistence'],
    currentUISurface: 'Method Planner tile',
    order: 10,
  },

  // -------------------------------------------------------------------------
  // PROGRAM CARDS
  // -------------------------------------------------------------------------
  {
    id: 'program_cards',
    label: 'Program Cards',
    uiStatus: 'active',
    mutationStatus: 'protected',
    currentRole: 'Final visible proof of session structure',
    nextSafeAction: 'Display mutation proof; consume Method Planner truth',
    riskIfIgnored: 'Backend changes not visible to user',
    sourceFiles: [
      'components/programs/AdaptiveProgramDisplay.tsx',
      'components/programs/AdaptiveSessionCard.tsx',
    ],
    consumedBy: [],
    currentUISurface: 'Program Page',
    order: 11,
  },

  // -------------------------------------------------------------------------
  // SAVED PROGRAM PERSISTENCE
  // -------------------------------------------------------------------------
  {
    id: 'saved_program_persistence',
    label: 'Saved Program Persistence',
    uiStatus: 'active',
    mutationStatus: 'protected',
    currentRole: 'LocalStorage/state persistence of program shape',
    nextSafeAction: 'Preserve registry-derived/adapted truth',
    riskIfIgnored: 'Fresh truth lost after reload',
    sourceFiles: [
      'lib/program-state.ts',
    ],
    consumedBy: ['Method Planner', 'Program Cards', 'Live Workout Runtime'],
    currentUISurface: 'Program Page',
    order: 12,
  },

  // -------------------------------------------------------------------------
  // LIVE WORKOUT RUNTIME
  // -------------------------------------------------------------------------
  {
    id: 'live_workout_runtime',
    label: 'Live Workout Runtime',
    uiStatus: 'protected_runtime',
    mutationStatus: 'protected',
    currentRole: 'Active protected runtime consumer for workout execution',
    nextSafeAction: 'Consume adapted session truth; bridge pending',
    riskIfIgnored: 'Program page says changed, live workout boots old session',
    sourceFiles: [
      'components/workout/StreamlinedWorkoutSession.tsx',
      'lib/workout/load-authoritative-session.ts',
    ],
    consumedBy: [],
    currentUISurface: 'Workout Session page',
    order: 13,
  },
]

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get a branch entry by ID.
 */
export function getFoundationBranchById(
  id: string
): IntelligenceFoundationBranchEntry | undefined {
  return INTELLIGENCE_FOUNDATION_BRANCH_MAP.find((b) => b.id === id)
}

/**
 * Get branches filtered by UI status.
 */
export function getFoundationBranchesByStatus(
  status: IntelligenceBranchUIStatus
): readonly IntelligenceFoundationBranchEntry[] {
  return INTELLIGENCE_FOUNDATION_BRANCH_MAP.filter((b) => b.uiStatus === status)
}

/**
 * Get branches filtered by mutation status.
 */
export function getFoundationBranchesByMutationStatus(
  status: IntelligenceBranchMutationStatus
): readonly IntelligenceFoundationBranchEntry[] {
  return INTELLIGENCE_FOUNDATION_BRANCH_MAP.filter((b) => b.mutationStatus === status)
}

/**
 * Get UI-friendly status label for display chips.
 */
export function getUIStatusLabel(status: IntelligenceBranchUIStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'partial':
      return 'Partial'
    case 'read_only':
      return 'Read-only'
    case 'mutation_locked':
      return 'Mutation Locked'
    case 'protected_runtime':
      return 'Protected Runtime'
    case 'missing_foundation':
      return 'Foundation Needed'
    case 'future_needed':
      return 'Future Needed'
    default:
      return 'Unknown'
  }
}

/**
 * Get UI-friendly mutation status label.
 */
export function getMutationStatusLabel(status: IntelligenceBranchMutationStatus): string {
  switch (status) {
    case 'none':
      return 'No mutation'
    case 'display_only':
      return 'Display only'
    case 'read_only':
      return 'Read-only'
    case 'protected':
      return 'Protected'
    case 'mutation_locked':
      return 'Mutation locked'
    case 'user_confirmed_only':
      return 'User confirmed'
    case 'future_writer_pending':
      return 'Writer pending'
    default:
      return 'Unknown'
  }
}

/**
 * Get summary counts for foundation map display.
 */
export function getFoundationMapSummary(): {
  total: number
  active: number
  partial: number
  readOnly: number
  mutationLocked: number
  protectedRuntime: number
  missingFoundation: number
} {
  const branches = INTELLIGENCE_FOUNDATION_BRANCH_MAP
  return {
    total: branches.length,
    active: branches.filter((b) => b.uiStatus === 'active').length,
    partial: branches.filter((b) => b.uiStatus === 'partial').length,
    readOnly: branches.filter((b) => b.uiStatus === 'read_only').length,
    mutationLocked: branches.filter((b) => b.uiStatus === 'mutation_locked').length,
    protectedRuntime: branches.filter((b) => b.uiStatus === 'protected_runtime').length,
    missingFoundation: branches.filter((b) => b.uiStatus === 'missing_foundation').length,
  }
}
