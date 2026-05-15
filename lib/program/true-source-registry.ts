/**
 * TRUE SOURCE REGISTRY — MASTER-8B.1
 *
 * =============================================================================
 * CROSS-BRANCH TRUE-SOURCE FOUNDATION REGISTRY / CONTRACTS
 * =============================================================================
 *
 * This module defines and exports the ownership contracts for all intelligence
 * branches in the SpartanLab adaptive training system. It answers:
 *
 *   - What branch exists?
 *   - Who owns it (which files)?
 *   - What source data does it read?
 *   - What UI surfaces consume it?
 *   - Is it read-only, preview-only, mutation-capable, display-only, partial, or future-only?
 *   - Is mutation allowed now?
 *   - What future step is allowed to mutate it?
 *   - What surfaces are at risk if it is touched?
 *   - What must not be touched yet?
 *   - Which Coach Intelligence tiles depend on it?
 *   - Which branch must be built before another can safely consume it?
 *
 * IMPORTANT GUARANTEES:
 *   - Pure TypeScript, JSON-safe, side-effect free
 *   - No localStorage, no Date.now, no React imports
 *   - No runtime imports from heavy builder/UI files
 *   - No mutation functions
 *   - No `as any`, no `@ts-ignore`
 *
 * Created: May 14th, 2026
 * Step: MASTER-8B.1
 */

// =============================================================================
// BRANCH IDS
// =============================================================================

/**
 * Canonical identifiers for all true-source branches.
 * These are stable string literals, not display labels.
 */
export const TRUE_SOURCE_BRANCH_IDS = [
  'skill_map',
  'method_decisions',
  'method_planner',
  'adaptive_foundation',
  'calibration',
  'coach_recs',
  'plan_logic',
  'recovery_readiness',
  'prehab_rehab_tendon_joint',
  'program_balance',
  'exercise_skill_knowledge_base',
  'evidence_workout_history',
  'program_cards',
  'saved_program_persistence',
  'live_workout_runtime',
  'active_week_mutation_placeholder',
] as const

export type TrueSourceBranchId = (typeof TRUE_SOURCE_BRANCH_IDS)[number]

// =============================================================================
// COACH INTELLIGENCE TILE IDS
// =============================================================================

/**
 * Canonical identifiers for Coach Intelligence hub tiles.
 */
export const COACH_INTELLIGENCE_TILE_IDS = [
  'skill_map',
  'method_decisions',
  'adaptive_foundation',
  'calibration',
  'coach_recs',
  'method_planner',
  'plan_logic',
] as const

export type CoachIntelligenceTileId = (typeof COACH_INTELLIGENCE_TILE_IDS)[number]

// =============================================================================
// STATUS ENUMS
// =============================================================================

/**
 * Current operational status of a true-source branch.
 */
export type TrueSourceBranchStatus =
  | 'active'
  | 'active_partial'
  | 'protected_active'
  | 'read_only_active'
  | 'missing_needed'
  | 'primitive_placeholder'
  | 'future_only'
  | 'disabled_until_source_ready'

/**
 * Mutation authority classification.
 */
export type TrueSourceMutationAuthority =
  | 'none'
  | 'display_only'
  | 'preview_only'
  | 'existing_writer_only'
  | 'future_writer_only'
  | 'runtime_consumer_only'
  | 'protected_do_not_mutate'

/**
 * Readiness state for future development.
 */
export type TrueSourceReadiness =
  | 'ready_for_read_only_consumption'
  | 'needs_foundation_contract'
  | 'needs_knowledge_schema'
  | 'needs_scoring_layer'
  | 'needs_ui_contract_wiring'
  | 'needs_future_writer'
  | 'protected_current_behavior'

/**
 * Risk level if branch is ignored or miswired.
 */
export type TrueSourceRiskLevel =
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'

/**
 * UI surfaces that consume branch data.
 */
export type TrueSourceUiSurface =
  | 'program_page'
  | 'coach_intelligence_hub'
  | 'skill_map_sheet'
  | 'method_decisions_sheet'
  | 'method_planner_sheet'
  | 'adaptive_foundation_sheet'
  | 'calibration_tile_sheet'
  | 'coach_recs_tile_sheet'
  | 'plan_logic_sheet'
  | 'program_day_cards'
  | 'start_workout_handoff'
  | 'live_workout_runtime'
  | 'saved_program_reload'

/**
 * Future step references for safe insertion points.
 */
export type TrueSourceFutureStep =
  | 'MASTER_8B_1'
  | 'MASTER_8B_2'
  | 'MASTER_8B_3'
  | 'MASTER_8B_4'
  | 'MASTER_8B_5'
  | 'MASTER_8B_6'
  | 'MASTER_8B_7'
  | 'MASTER_8B_8'
  | 'MASTER_8C'
  | 'MASTER_8D'

// =============================================================================
// REGISTRY ENTRY INTERFACE
// =============================================================================

/**
 * Complete contract for a true-source branch.
 */
export interface TrueSourceRegistryEntry {
  readonly id: TrueSourceBranchId
  readonly label: string
  readonly currentStatus: TrueSourceBranchStatus
  readonly currentOwnerFiles: readonly string[]
  readonly currentSourceSummary: string
  readonly futureRole: string
  readonly mutationAuthorityNow: TrueSourceMutationAuthority
  readonly futureMutationStep: TrueSourceFutureStep | null
  readonly uiSurfaces: readonly TrueSourceUiSurface[]
  readonly dependsOnBranches: readonly TrueSourceBranchId[]
  readonly consumedByBranches: readonly TrueSourceBranchId[]
  readonly riskIfIgnored: string
  readonly riskLevel: TrueSourceRiskLevel
  readonly safeInsertionPoint: TrueSourceFutureStep | null
  readonly protectedBehaviors: readonly string[]
  readonly forbiddenNow: readonly string[]
  readonly maxIntentNotes: string
  readonly nextAllowedAction: string
  readonly readiness: TrueSourceReadiness
}

// =============================================================================
// COACH INTELLIGENCE TILE CONTRACT
// =============================================================================

/**
 * Contract for a Coach Intelligence hub tile.
 */
export interface CoachIntelligenceTileContract {
  readonly tileId: CoachIntelligenceTileId
  readonly label: string
  readonly currentStatus: TrueSourceBranchStatus
  readonly sourceBranches: readonly TrueSourceBranchId[]
  readonly opensSurface: TrueSourceUiSurface
  readonly disabledAllowed: boolean
  readonly activationRequirement: string
  readonly mustNotClaim: readonly string[]
  readonly visibleProofRequirement: string
  readonly futureDependency: TrueSourceFutureStep | null
  readonly riskIfMiswired: string
}

// =============================================================================
// REGISTRY DATA
// =============================================================================

/**
 * The canonical true-source registry.
 * This is the single source of truth for branch ownership and contracts.
 */
const TRUE_SOURCE_REGISTRY: readonly TrueSourceRegistryEntry[] = [
  // -------------------------------------------------------------------------
  // SKILL MAP
  // -------------------------------------------------------------------------
  {
    id: 'skill_map',
    label: 'Skill Map / Selected Skill Representation',
    currentStatus: 'active_partial',
    currentOwnerFiles: [
      'components/programs/ProgramCoachIntelligenceHub.tsx',
      'lib/ai-truth-selected-skills-audit.ts',
      'lib/program/weekly-skill-expression-allocator.ts',
    ],
    currentSourceSummary: 'Selected skills from profile, expression state from program sessions',
    futureRole: 'Skill exposure truth, selected-skill coverage, expression balance',
    mutationAuthorityNow: 'display_only',
    futureMutationStep: 'MASTER_8B_3',
    uiSurfaces: ['coach_intelligence_hub', 'skill_map_sheet', 'program_day_cards'],
    dependsOnBranches: [],
    consumedByBranches: ['program_balance', 'adaptive_foundation'],
    riskIfIgnored: 'Selected skills disappear or are under-expressed in generated programs',
    riskLevel: 'high',
    safeInsertionPoint: 'MASTER_8B_3',
    protectedBehaviors: ['Current skill expression display must not change'],
    forbiddenNow: ['Mutating skill expression', 'Changing skill map sheet behavior'],
    maxIntentNotes: 'Skill map must eventually feed Program Balance branch for planche/push-pull detection',
    nextAllowedAction: 'Read-only consumption by Program Balance in MASTER-8B.3',
    readiness: 'ready_for_read_only_consumption',
  },

  // -------------------------------------------------------------------------
  // METHOD DECISIONS
  // -------------------------------------------------------------------------
  {
    id: 'method_decisions',
    label: 'Method Decisions / AI-Selected Methods',
    currentStatus: 'active',
    currentOwnerFiles: [
      'lib/program/per-day-method-summary.ts',
      'components/programs/ProgramCoachIntelligenceHub.tsx',
    ],
    currentSourceSummary: 'AI-selected methods per session from generated program',
    futureRole: 'Explain AI-selected methods, provide transparency',
    mutationAuthorityNow: 'display_only',
    futureMutationStep: null,
    uiSurfaces: ['coach_intelligence_hub', 'method_decisions_sheet'],
    dependsOnBranches: [],
    consumedByBranches: ['method_planner'],
    riskIfIgnored: 'Method explanation diverges from actual session methods',
    riskLevel: 'moderate',
    safeInsertionPoint: null,
    protectedBehaviors: ['Current method decisions display must not change'],
    forbiddenNow: ['Changing method decisions behavior'],
    maxIntentNotes: 'Method decisions must accurately reflect what AI chose; discrepancy is a bug',
    nextAllowedAction: 'None required; display-only branch',
    readiness: 'ready_for_read_only_consumption',
  },

  // -------------------------------------------------------------------------
  // METHOD PLANNER (PROTECTED)
  // -------------------------------------------------------------------------
  {
    id: 'method_planner',
    label: 'Method Planner / User-Requested Method Overrides',
    currentStatus: 'protected_active',
    currentOwnerFiles: [
      'components/programs/ProgramCoachIntelligenceHub.tsx',
      'lib/program/requested-method-override-planner.ts',
      'lib/program/method-override-artifacts.ts',
      'lib/program/method-planner-foundation-context.ts',
    ],
    currentSourceSummary: 'MASTER-8B.5: User-applied method overrides via artifact truth, canonical summary/rows. Foundation context panel now shows Program Balance link as read-only - no method changes applied through this context.',
    futureRole: 'User-requested method additions/overrides with preview capability',
    mutationAuthorityNow: 'existing_writer_only',
    futureMutationStep: 'MASTER_8B_6',
    uiSurfaces: ['coach_intelligence_hub', 'method_planner_sheet'],
    dependsOnBranches: ['method_decisions', 'program_balance'],
    consumedByBranches: ['program_cards', 'saved_program_persistence'],
    riskIfIgnored: 'Counts drift or applied/native/preview rows disagree',
    riskLevel: 'critical',
    safeInsertionPoint: 'MASTER_8B_6',
    protectedBehaviors: [
      'Green Applied 6 badge must remain unchanged',
      'Method Planner sheet shows 6 saved planner additions',
      'Supersets appears as native/original included',
      'Cluster Sets appears as caution/not applied',
      'Apply/revert/reset writer behavior unchanged',
      'Canonical summary and row truth unchanged',
      'Foundation context panel is display-only',
    ],
    forbiddenNow: [
      'Changing applied count calculation',
      'Changing method planner row status logic',
      'Modifying apply/revert/reset writers',
      'Changing native method classification',
      'Changing preview behavior',
      'Foundation context affecting apply eligibility',
    ],
    maxIntentNotes: 'MASTER-8B.5 COMPLETE: Method Planner now displays foundation context from Program Balance as read-only panel. No method changes applied via foundation context. Applied 6 and all writer behavior unchanged.',
    nextAllowedAction: 'Future-session candidate planning in MASTER-8B.6',
    readiness: 'protected_current_behavior',
  },

  // -------------------------------------------------------------------------
  // ADAPTIVE FOUNDATION
  // -------------------------------------------------------------------------
  {
    id: 'adaptive_foundation',
    label: 'Adaptive Foundation / Athlete Model',
    currentStatus: 'read_only_active',
    currentOwnerFiles: [
      'lib/program/adaptive-foundation-model.ts',
      'components/programs/ProgramCoachIntelligenceHub.tsx',
    ],
    currentSourceSummary: 'Typed read-only athlete model, evidence snapshot, constraints, safeguards',
    futureRole: 'Feed readiness/safeguard/program balance/future writer',
    mutationAuthorityNow: 'none',
    futureMutationStep: 'MASTER_8B_6',
    uiSurfaces: ['coach_intelligence_hub', 'adaptive_foundation_sheet'],
    dependsOnBranches: ['evidence_workout_history', 'recovery_readiness', 'prehab_rehab_tendon_joint'],
    consumedByBranches: ['program_balance', 'coach_recs', 'calibration'],
    riskIfIgnored: 'Looks intelligent without changing training later',
    riskLevel: 'high',
    safeInsertionPoint: 'MASTER_8B_6',
    protectedBehaviors: ['Current adaptive foundation sheet content must not change'],
    forbiddenNow: ['Enabling mutation', 'Changing evidence snapshot shape'],
    maxIntentNotes: 'Foundation model must eventually drive future-session adaptation; read-only for now',
    nextAllowedAction: 'Contribute to Program Balance read-only intelligence in MASTER-8B.3',
    readiness: 'ready_for_read_only_consumption',
  },

  // -------------------------------------------------------------------------
  // CALIBRATION
  // -------------------------------------------------------------------------
  {
    id: 'calibration',
    label: 'Calibration / Evidence Lifecycle',
    currentStatus: 'active_partial',
    currentOwnerFiles: [
      'components/programs/CalibrationCheckpointCard.tsx',
      'lib/athlete-calibration.ts',
    ],
    currentSourceSummary: 'Baseline and performance calibration data, partially dependent on evidence',
    futureRole: 'Baseline/performance calibration for adaptive decisions',
    mutationAuthorityNow: 'none',
    futureMutationStep: 'MASTER_8B_6',
    uiSurfaces: ['coach_intelligence_hub', 'calibration_tile_sheet'],
    dependsOnBranches: ['evidence_workout_history', 'adaptive_foundation'],
    consumedByBranches: ['coach_recs', 'plan_logic'],
    riskIfIgnored: 'Baseline claims not used in adaptation',
    riskLevel: 'moderate',
    safeInsertionPoint: 'MASTER_8B_4',
    protectedBehaviors: ['Current calibration display behavior'],
    forbiddenNow: ['Enabling mutation without evidence proof'],
    maxIntentNotes: 'Calibration must have real evidence before claiming accuracy',
    nextAllowedAction: 'Hub tile contract wiring in MASTER-8B.4',
    readiness: 'needs_ui_contract_wiring',
  },

  // -------------------------------------------------------------------------
  // COACH RECS
  // -------------------------------------------------------------------------
  {
    id: 'coach_recs',
    label: 'Coach Recs / Recommendation Bundle',
    currentStatus: 'active_partial',
    currentOwnerFiles: [
      'components/programs/EvidenceCoachRecommendationCard.tsx',
      'lib/program/evidence-derived-coach-recommendations.ts',
    ],
    currentSourceSummary: 'Actionable recommendations, partially dependent on evidence',
    futureRole: 'Actionable advice and next-step coaching',
    mutationAuthorityNow: 'display_only',
    futureMutationStep: null,
    uiSurfaces: ['coach_intelligence_hub', 'coach_recs_tile_sheet'],
    dependsOnBranches: ['evidence_workout_history', 'adaptive_foundation', 'calibration'],
    consumedByBranches: [],
    riskIfIgnored: 'Dead tile or cosmetic recommendations',
    riskLevel: 'moderate',
    safeInsertionPoint: 'MASTER_8B_4',
    protectedBehaviors: ['Must not claim false intelligence'],
    forbiddenNow: ['Claiming certainty without evidence'],
    maxIntentNotes: 'Coach recs must be honest about evidence level; no fake claims',
    nextAllowedAction: 'Hub tile contract wiring in MASTER-8B.4',
    readiness: 'needs_ui_contract_wiring',
  },

  // -------------------------------------------------------------------------
  // PLAN LOGIC
  // -------------------------------------------------------------------------
  {
    id: 'plan_logic',
    label: 'Plan Logic / Construction Rationale',
    currentStatus: 'active_partial',
    currentOwnerFiles: [
      'components/programs/ProgramTruthSummary.tsx',
      'lib/program/program-display-contract.ts',
    ],
    currentSourceSummary: 'Construction rationale and proof of program decisions',
    futureRole: 'Transparent construction rationale',
    mutationAuthorityNow: 'display_only',
    futureMutationStep: null,
    uiSurfaces: ['coach_intelligence_hub', 'plan_logic_sheet'],
    dependsOnBranches: ['exercise_skill_knowledge_base'],
    consumedByBranches: [],
    riskIfIgnored: 'Explanations mask weak programming',
    riskLevel: 'moderate',
    safeInsertionPoint: 'MASTER_8B_4',
    protectedBehaviors: ['Current plan logic display'],
    forbiddenNow: ['Claiming logic not backed by actual generation'],
    maxIntentNotes: 'Plan logic must reflect actual generation decisions, not post-hoc rationalization',
    nextAllowedAction: 'Hub tile contract wiring in MASTER-8B.4',
    readiness: 'needs_ui_contract_wiring',
  },

  // -------------------------------------------------------------------------
  // RECOVERY / READINESS
  // -------------------------------------------------------------------------
  {
    id: 'recovery_readiness',
    label: 'Recovery / Readiness',
    currentStatus: 'active_partial',
    currentOwnerFiles: [
      'lib/training-feedback-loop.ts',
      'lib/active-week-mutation-service.ts',
    ],
    currentSourceSummary: 'Workout feedback, readiness indicators, recovery state',
    futureRole: 'Guide future-session adjustments',
    mutationAuthorityNow: 'none',
    futureMutationStep: 'MASTER_8B_6',
    uiSurfaces: ['adaptive_foundation_sheet', 'program_day_cards'],
    dependsOnBranches: ['evidence_workout_history'],
    consumedByBranches: ['adaptive_foundation', 'program_balance'],
    riskIfIgnored: 'Recovery data displayed but not used',
    riskLevel: 'high',
    safeInsertionPoint: 'MASTER_8B_6',
    protectedBehaviors: [],
    forbiddenNow: ['Enabling mutation without read-only proof'],
    maxIntentNotes: 'Recovery must drive real adaptation, not cosmetic display',
    nextAllowedAction: 'Contribute to Program Balance in MASTER-8B.3',
    readiness: 'needs_future_writer',
  },

  // -------------------------------------------------------------------------
  // PREHAB / REHAB / TENDON / JOINT SAFEGUARDS
  // -------------------------------------------------------------------------
  {
    id: 'prehab_rehab_tendon_joint',
    label: 'Prehab / Rehab / Tendon / Joint Safeguards',
    currentStatus: 'read_only_active',
    currentOwnerFiles: [
      'lib/program/adaptive-foundation-model.ts',
      'lib/injury-risk-engine.ts',
    ],
    currentSourceSummary: 'Constraint and safeguard interfaces for injury prevention',
    futureRole: 'Adjust exercise choice, warm-ups, cooldowns, intensity',
    mutationAuthorityNow: 'none',
    futureMutationStep: 'MASTER_8B_6',
    uiSurfaces: ['adaptive_foundation_sheet', 'program_day_cards', 'live_workout_runtime'],
    dependsOnBranches: ['evidence_workout_history'],
    consumedByBranches: ['adaptive_foundation', 'program_balance'],
    riskIfIgnored: 'Safeguards are decorative',
    riskLevel: 'critical',
    safeInsertionPoint: 'MASTER_8B_6',
    protectedBehaviors: ['Current safeguard display'],
    forbiddenNow: ['Enabling mutation without proper gates'],
    maxIntentNotes: 'Safeguards must eventually gate exercise selection and intensity',
    nextAllowedAction: 'Read-only contribution to Program Balance in MASTER-8B.3',
    readiness: 'ready_for_read_only_consumption',
  },

  // -------------------------------------------------------------------------
  // PROGRAM BALANCE — MASTER-8B.6 COMPLETE
  // -------------------------------------------------------------------------
  {
    id: 'program_balance',
    label: 'Program Balance / Skill Distribution',
    currentStatus: 'read_only_active',
    currentOwnerFiles: [
      'lib/program/program-balance-intelligence-contract.ts',
      'lib/program/program-balance-readonly-analyzer.ts',
      'lib/program/program-balance-validation.ts',
      'lib/program/program-balance-ui-adapter.ts',
      'lib/program/program-balance-future-planning.ts',
      'lib/program/future-session-mutation-writer-contract.ts',
      'lib/program/program-balance-mutation-writer-design.ts',
    ],
    currentSourceSummary: 'MASTER-8B.7 DESIGN GATE: Mutation writer contract staged. Legacy Phase 13 auto-mutation quarantined. Future Candidates now show 8B.7 design proof: user-confirmed only, future sessions only, no saved change, program cards unchanged, live workout later. No actual mutation enabled yet.',
    futureRole: 'Detect planche under-expression, pull dominance, push/pull imbalance, weighted anchor absence, poor skill spacing, repeated same-family days',
    mutationAuthorityNow: 'none',
    futureMutationStep: 'MASTER_8B_7_apply_gate',
    uiSurfaces: ['coach_intelligence_hub'],
    dependsOnBranches: ['skill_map', 'adaptive_foundation', 'recovery_readiness', 'prehab_rehab_tendon_joint', 'exercise_skill_knowledge_base'],
    consumedByBranches: ['method_planner'],
    riskIfIgnored: 'The app creates boring or imbalanced programs',
    riskLevel: 'high',
    safeInsertionPoint: 'MASTER_8B_7_apply_gate',
    protectedBehaviors: ['Analyzer returns mutationAllowedNow: false', 'Knowledge coverage gaps reported honestly', 'UI shows 8B.7 design gate clearly', 'Future candidates show user-confirmed-only chips', 'Legacy auto-mutation quarantined'],
    forbiddenNow: ['Actual mutation', 'Auto-apply without user confirmation', 'Program Card mutation', 'Live runtime consumption', 'Full database completion claim', 'Active Apply Candidate button'],
    maxIntentNotes: 'MASTER-8B.7 DESIGN GATE: Writer contract created. Legacy Phase 13 quarantined behind LEGACY_PHASE13_AUTO_MUTATION_ENABLED=false. Next: apply gate with user confirmation.',
    nextAllowedAction: 'User-confirmed apply gate in MASTER-8B.7 apply phase',
    readiness: 'ready_for_read_only_consumption',
  },

  // -------------------------------------------------------------------------
  // EXERCISE / SKILL KNOWLEDGE BASE
  // -------------------------------------------------------------------------
  {
    id: 'exercise_skill_knowledge_base',
    label: 'Exercise / Skill Knowledge Base',
    currentStatus: 'read_only_active',
    currentOwnerFiles: [
      'lib/program/exercise-skill-knowledge-contract.ts',
      'lib/program/exercise-skill-knowledge-seed.ts',
      'lib/program/exercise-skill-knowledge-validation.ts',
      'lib/doctrine/doctrine-builder-integration-contract.ts',
      'lib/doctrine/doctrine-materializer-registry.ts',
      'lib/doctrine/method-profile-registry.ts',
    ],
    currentSourceSummary: 'MASTER-8B.2: Max-intent exercise/skill knowledge contract + REPRESENTATIVE seed created. 13 exercises, 8 skills seeded (NOT complete database - full expansion in MASTER-8C). Planche Lean/Push-Up taxonomy correctly separated. Weighted Pull-Up and Weighted Dip marked as strength anchors.',
    futureRole: 'Science-guided programming decisions: movement families, skill transfer, tendon stress, frequency tolerance, intensity/volume/failure cost, warm-up/cooldown needs, method compatibility, progression/regression, equipment, ability gating',
    mutationAuthorityNow: 'none',
    futureMutationStep: 'MASTER_8C',
    uiSurfaces: ['plan_logic_sheet'],
    dependsOnBranches: [],
    consumedByBranches: ['plan_logic', 'program_balance'],
    riskIfIgnored: 'Generic cheap decisions',
    riskLevel: 'high',
    safeInsertionPoint: 'MASTER_8B_3',
    protectedBehaviors: ['Knowledge seed is read-only - no generator wiring yet'],
    forbiddenNow: ['Generator wiring until MASTER-8C', 'Mutation of seed data', 'Live runtime consumption'],
    maxIntentNotes: 'MASTER-8B.2 COMPLETE: Knowledge base foundation created. Seed includes critical exercises (weighted anchors, planche progressions, FL progressions, compression skills) and skills (planche, FL, BL, HSPU, MU, OAPU, L-sit, V-sit). Ready for Program Balance read-only consumption in MASTER-8B.3.',
    nextAllowedAction: 'Program Balance read-only detection in MASTER-8B.3',
    readiness: 'ready_for_read_only_consumption',
  },

  // -------------------------------------------------------------------------
  // EVIDENCE / WORKOUT HISTORY
  // -------------------------------------------------------------------------
  {
    id: 'evidence_workout_history',
    label: 'Evidence / Workout History / RPE / Bands / Discomfort',
    currentStatus: 'active_partial',
    currentOwnerFiles: [
      'lib/workout-log-service.ts',
      'lib/training-feedback-loop.ts',
    ],
    currentSourceSummary: 'Logged sets, RPE, band usage, discomfort notes, workout completion',
    futureRole: 'Drive adaptation confidence and future changes',
    mutationAuthorityNow: 'none',
    futureMutationStep: 'MASTER_8B_6',
    uiSurfaces: ['adaptive_foundation_sheet', 'coach_recs_tile_sheet', 'program_day_cards', 'live_workout_runtime'],
    dependsOnBranches: [],
    consumedByBranches: ['adaptive_foundation', 'calibration', 'coach_recs', 'recovery_readiness'],
    riskIfIgnored: 'Logged data does not change anything',
    riskLevel: 'high',
    safeInsertionPoint: 'MASTER_8B_6',
    protectedBehaviors: ['Current workout logging behavior'],
    forbiddenNow: ['Changing workout log shape', 'Changing logging behavior'],
    maxIntentNotes: 'Evidence is the fuel for adaptation; must be consumed by future writer',
    nextAllowedAction: 'Contribute to Program Balance read-only in MASTER-8B.3',
    readiness: 'ready_for_read_only_consumption',
  },

  // -------------------------------------------------------------------------
  // PROGRAM CARDS
  // -------------------------------------------------------------------------
  {
    id: 'program_cards',
    label: 'Program Cards / Session Display',
    currentStatus: 'active',
    currentOwnerFiles: [
      'components/programs/AdaptiveProgramDisplay.tsx',
      'components/programs/AdaptiveSessionCard.tsx',
    ],
    currentSourceSummary: 'Final visible proof of session structure',
    futureRole: 'Final visible proof after mutation',
    mutationAuthorityNow: 'runtime_consumer_only',
    futureMutationStep: 'MASTER_8B_7',
    uiSurfaces: ['program_page', 'program_day_cards'],
    dependsOnBranches: ['method_planner', 'saved_program_persistence'],
    consumedByBranches: [],
    riskIfIgnored: 'Backend changes not visible',
    riskLevel: 'moderate',
    safeInsertionPoint: 'MASTER_8B_7',
    protectedBehaviors: ['Current session card rendering'],
    forbiddenNow: ['Changing card layout for this step'],
    maxIntentNotes: 'Cards are the final truth display; must reflect all upstream changes',
    nextAllowedAction: 'Display mutation proof in MASTER-8B.7',
    readiness: 'ready_for_read_only_consumption',
  },

  // -------------------------------------------------------------------------
  // SAVED PROGRAM PERSISTENCE
  // -------------------------------------------------------------------------
  {
    id: 'saved_program_persistence',
    label: 'Saved Program Persistence',
    currentStatus: 'active',
    currentOwnerFiles: [
      'lib/program-state.ts',
      'app/(app)/program/page.tsx',
    ],
    currentSourceSummary: 'LocalStorage/state persistence of program shape',
    futureRole: 'Preserve registry-derived/adapted truth',
    mutationAuthorityNow: 'none',
    futureMutationStep: 'MASTER_8B_6',
    uiSurfaces: ['program_page', 'saved_program_reload'],
    dependsOnBranches: [],
    consumedByBranches: ['method_planner', 'program_cards', 'live_workout_runtime'],
    riskIfIgnored: 'Fresh truth lost after reload',
    riskLevel: 'critical',
    safeInsertionPoint: 'MASTER_8B_6',
    protectedBehaviors: ['Current save/load behavior', 'Current program shape'],
    forbiddenNow: ['Changing saved program shape', 'Changing persistence logic'],
    maxIntentNotes: 'Persistence must safely handle future-session mutation',
    nextAllowedAction: 'Safe mutation in MASTER-8B.6',
    readiness: 'needs_future_writer',
  },

  // -------------------------------------------------------------------------
  // LIVE WORKOUT RUNTIME
  // -------------------------------------------------------------------------
  {
    id: 'live_workout_runtime',
    label: 'Live Workout Runtime',
    currentStatus: 'protected_active',
    currentOwnerFiles: [
      'components/workout/StreamlinedWorkoutSession.tsx',
      'app/(app)/workout/session/page.tsx',
      'lib/workout/load-authoritative-session.ts',
    ],
    currentSourceSummary: 'Active protected runtime consumer for workout execution',
    futureRole: 'Consume adapted session truth',
    mutationAuthorityNow: 'protected_do_not_mutate',
    futureMutationStep: 'MASTER_8B_8',
    uiSurfaces: ['live_workout_runtime', 'start_workout_handoff'],
    dependsOnBranches: ['saved_program_persistence'],
    consumedByBranches: [],
    riskIfIgnored: 'Program page says changed, live workout boots old session',
    riskLevel: 'critical',
    safeInsertionPoint: 'MASTER_8B_8',
    protectedBehaviors: [
      'Start Workout must work',
      'Live workout execution must not break',
      'Workout logging must work',
      'RPE logging must work',
      'Band usage must work',
    ],
    forbiddenNow: [
      'Any changes to live workout files',
      'Any changes to workout session page',
      'Any changes to workout loading',
    ],
    maxIntentNotes: 'Live runtime is the most protected corridor after Method Planner',
    nextAllowedAction: 'Adaptation bridge only in MASTER-8B.8',
    readiness: 'protected_current_behavior',
  },

  // -------------------------------------------------------------------------
  // ACTIVE WEEK MUTATION PLACEHOLDER
  // -------------------------------------------------------------------------
  {
    id: 'active_week_mutation_placeholder',
    label: 'Active Week Mutation Service (Primitive Placeholder)',
    currentStatus: 'primitive_placeholder',
    currentOwnerFiles: [
      'lib/active-week-mutation-service.ts',
    ],
    currentSourceSummary: 'Primitive frequency-level mutation only, NOT the final adaptation writer',
    futureRole: 'Eventually replaced by MASTER-8B.6 controlled future-session adaptation writer',
    mutationAuthorityNow: 'existing_writer_only',
    futureMutationStep: 'MASTER_8B_6',
    uiSurfaces: ['program_page'],
    dependsOnBranches: ['evidence_workout_history', 'recovery_readiness'],
    consumedByBranches: [],
    riskIfIgnored: 'Mutation claims exceed actual capability',
    riskLevel: 'high',
    safeInsertionPoint: 'MASTER_8B_6',
    protectedBehaviors: ['Current primitive behavior must not expand'],
    forbiddenNow: [
      'Deep exercise/session mutation',
      'Warm-up/cooldown mutation',
      'Live bridge mutation',
      'Claiming full adaptation capability',
    ],
    maxIntentNotes: 'Explicitly classified as NOT the final deep adaptation writer; future MASTER-8B.6 will replace/extend',
    nextAllowedAction: 'Replacement/extension in MASTER-8B.6',
    readiness: 'needs_future_writer',
  },
]

// =============================================================================
// COACH INTELLIGENCE TILE CONTRACTS
// =============================================================================

const COACH_INTELLIGENCE_TILE_CONTRACTS: readonly CoachIntelligenceTileContract[] = [
  {
    tileId: 'skill_map',
    label: 'Skill Map',
    currentStatus: 'active_partial',
    sourceBranches: ['skill_map'],
    opensSurface: 'skill_map_sheet',
    disabledAllowed: false,
    activationRequirement: 'Program with selected skills must exist',
    mustNotClaim: ['Skills that are not actually selected'],
    visibleProofRequirement: 'Shows selected skills with expression status',
    futureDependency: 'MASTER_8B_3',
    riskIfMiswired: 'Selected skills appear missing or over-represented',
  },
  {
    tileId: 'method_decisions',
    label: 'Method Decisions',
    currentStatus: 'active',
    sourceBranches: ['method_decisions'],
    opensSurface: 'method_decisions_sheet',
    disabledAllowed: false,
    activationRequirement: 'Program with session methods must exist',
    mustNotClaim: ['Methods not actually in the session'],
    visibleProofRequirement: 'Shows AI-selected methods per session',
    futureDependency: null,
    riskIfMiswired: 'Method explanations diverge from actual session content',
  },
  {
    tileId: 'adaptive_foundation',
    label: 'Adaptive Foundation',
    currentStatus: 'read_only_active',
    sourceBranches: ['adaptive_foundation', 'recovery_readiness', 'prehab_rehab_tendon_joint'],
    opensSurface: 'adaptive_foundation_sheet',
    disabledAllowed: false,
    activationRequirement: 'Program and athlete profile must exist',
    mustNotClaim: ['Adaptation that is not actually happening'],
    visibleProofRequirement: 'Shows athlete model, evidence state, safeguards',
    futureDependency: 'MASTER_8B_6',
    riskIfMiswired: 'Claims intelligence without delivering adaptation',
  },
  {
    tileId: 'calibration',
    label: 'Calibration',
    currentStatus: 'active_partial',
    sourceBranches: ['calibration', 'evidence_workout_history'],
    opensSurface: 'calibration_tile_sheet',
    disabledAllowed: true,
    activationRequirement: 'Sufficient workout evidence for calibration',
    mustNotClaim: ['Calibration accuracy without evidence'],
    visibleProofRequirement: 'Shows calibration checkpoints with evidence level',
    futureDependency: 'MASTER_8B_4',
    riskIfMiswired: 'False calibration claims',
  },
  {
    tileId: 'coach_recs',
    label: 'Coach Recs',
    currentStatus: 'active_partial',
    sourceBranches: ['coach_recs', 'evidence_workout_history', 'adaptive_foundation'],
    opensSurface: 'coach_recs_tile_sheet',
    disabledAllowed: true,
    activationRequirement: 'Sufficient evidence for recommendations',
    mustNotClaim: ['Specific recommendations without evidence basis'],
    visibleProofRequirement: 'Shows actionable recommendations with evidence level',
    futureDependency: 'MASTER_8B_4',
    riskIfMiswired: 'Cosmetic or false recommendations',
  },
  {
    tileId: 'method_planner',
    label: 'Method Planner',
    currentStatus: 'protected_active',
    sourceBranches: ['method_planner', 'method_decisions'],
    opensSurface: 'method_planner_sheet',
    disabledAllowed: false,
    activationRequirement: 'Program with method override capability must exist',
    mustNotClaim: ['Applied count not backed by artifacts', 'Native methods as user-applied'],
    visibleProofRequirement: 'Green Applied badge matches artifact truth, rows match canonical summary',
    futureDependency: 'MASTER_8B_5',
    riskIfMiswired: 'Applied count drift, row status disagreement, native/override confusion',
  },
  {
    tileId: 'plan_logic',
    label: 'Plan Logic',
    currentStatus: 'active_partial',
    sourceBranches: ['plan_logic', 'exercise_skill_knowledge_base'],
    opensSurface: 'plan_logic_sheet',
    disabledAllowed: true,
    activationRequirement: 'Program with construction rationale must exist',
    mustNotClaim: ['Logic not backed by actual generation decisions'],
    visibleProofRequirement: 'Shows construction rationale that matches program',
    futureDependency: 'MASTER_8B_4',
    riskIfMiswired: 'Post-hoc rationalization instead of real logic',
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the complete true-source registry.
 */
export function getTrueSourceRegistry(): readonly TrueSourceRegistryEntry[] {
  return TRUE_SOURCE_REGISTRY
}

/**
 * Get a specific branch by ID.
 */
export function getTrueSourceBranch(id: TrueSourceBranchId): TrueSourceRegistryEntry | null {
  return TRUE_SOURCE_REGISTRY.find(entry => entry.id === id) ?? null
}

/**
 * Get all Coach Intelligence tile contracts.
 */
export function getCoachIntelligenceTileContracts(): readonly CoachIntelligenceTileContract[] {
  return COACH_INTELLIGENCE_TILE_CONTRACTS
}

/**
 * Get a specific tile contract by ID.
 */
export function getCoachIntelligenceTileContract(id: CoachIntelligenceTileId): CoachIntelligenceTileContract | null {
  return COACH_INTELLIGENCE_TILE_CONTRACTS.find(tile => tile.tileId === id) ?? null
}

/**
 * Get all branches affected by a future step.
 */
export function getBranchesForFutureStep(step: TrueSourceFutureStep): readonly TrueSourceRegistryEntry[] {
  return TRUE_SOURCE_REGISTRY.filter(
    entry => entry.futureMutationStep === step || entry.safeInsertionPoint === step
  )
}

/**
 * Check if mutation is currently allowed for a branch.
 */
export function isBranchMutationAllowedNow(id: TrueSourceBranchId): boolean {
  const branch = getTrueSourceBranch(id)
  if (!branch) return false
  
  return (
    branch.mutationAuthorityNow === 'existing_writer_only' ||
    branch.mutationAuthorityNow === 'runtime_consumer_only'
  )
}

/**
 * Get protected behaviors for a branch.
 */
export function getProtectedBranchBehaviors(id: TrueSourceBranchId): readonly string[] {
  const branch = getTrueSourceBranch(id)
  return branch?.protectedBehaviors ?? []
}

/**
 * Get branches that are currently protected and must not be changed.
 */
export function getProtectedBranches(): readonly TrueSourceRegistryEntry[] {
  return TRUE_SOURCE_REGISTRY.filter(
    entry => 
      entry.currentStatus === 'protected_active' ||
      entry.mutationAuthorityNow === 'protected_do_not_mutate'
  )
}

/**
 * Get branches that are missing and needed for future work.
 */
export function getMissingNeededBranches(): readonly TrueSourceRegistryEntry[] {
  return TRUE_SOURCE_REGISTRY.filter(entry => entry.currentStatus === 'missing_needed')
}

/**
 * Get branches with critical risk level.
 */
export function getCriticalRiskBranches(): readonly TrueSourceRegistryEntry[] {
  return TRUE_SOURCE_REGISTRY.filter(entry => entry.riskLevel === 'critical')
}

// =============================================================================
// SELF-AUDIT / VALIDATION
// =============================================================================

/**
 * Validation result for registry completeness.
 */
export interface RegistryValidationResult {
  readonly ok: boolean
  readonly missingBranchIds: readonly string[]
  readonly missingTileIds: readonly string[]
  readonly protectedMethodPlannerRegistered: boolean
  readonly activeWeekPlaceholderClassified: boolean
  readonly allBranchesHaveMutationAuthority: boolean
  readonly allBranchesHaveSafeInsertionPoint: boolean
  readonly allTilesHaveSourceBranches: boolean
  readonly branchCount: number
  readonly tileCount: number
  readonly protectedBranchCount: number
  readonly criticalRiskBranchCount: number
}

/**
 * Validate registry completeness.
 * Does not throw by default; returns a typed result object.
 */
export function validateTrueSourceRegistryCompleteness(): RegistryValidationResult {
  const registeredBranchIds = new Set(TRUE_SOURCE_REGISTRY.map(e => e.id))
  const registeredTileIds = new Set(COACH_INTELLIGENCE_TILE_CONTRACTS.map(t => t.tileId))
  
  const missingBranchIds = TRUE_SOURCE_BRANCH_IDS.filter(id => !registeredBranchIds.has(id))
  const missingTileIds = COACH_INTELLIGENCE_TILE_IDS.filter(id => !registeredTileIds.has(id))
  
  const methodPlannerEntry = getTrueSourceBranch('method_planner')
  const protectedMethodPlannerRegistered = 
    methodPlannerEntry !== null && 
    methodPlannerEntry.currentStatus === 'protected_active'
  
  const activeWeekEntry = getTrueSourceBranch('active_week_mutation_placeholder')
  const activeWeekPlaceholderClassified = 
    activeWeekEntry !== null && 
    activeWeekEntry.currentStatus === 'primitive_placeholder'
  
  const allBranchesHaveMutationAuthority = TRUE_SOURCE_REGISTRY.every(
    e => e.mutationAuthorityNow !== undefined
  )
  
  const allBranchesHaveSafeInsertionPoint = TRUE_SOURCE_REGISTRY.every(
    e => e.safeInsertionPoint !== undefined
  )
  
  const allTilesHaveSourceBranches = COACH_INTELLIGENCE_TILE_CONTRACTS.every(
    t => t.sourceBranches.length > 0
  )
  
  const protectedBranches = getProtectedBranches()
  const criticalRiskBranches = getCriticalRiskBranches()
  
  const ok = 
    missingBranchIds.length === 0 &&
    missingTileIds.length === 0 &&
    protectedMethodPlannerRegistered &&
    activeWeekPlaceholderClassified &&
    allBranchesHaveMutationAuthority &&
    allTilesHaveSourceBranches
  
  return {
    ok,
    missingBranchIds,
    missingTileIds,
    protectedMethodPlannerRegistered,
    activeWeekPlaceholderClassified,
    allBranchesHaveMutationAuthority,
    allBranchesHaveSafeInsertionPoint,
    allTilesHaveSourceBranches,
    branchCount: TRUE_SOURCE_REGISTRY.length,
    tileCount: COACH_INTELLIGENCE_TILE_CONTRACTS.length,
    protectedBranchCount: protectedBranches.length,
    criticalRiskBranchCount: criticalRiskBranches.length,
  }
}

// =============================================================================
// REGISTRY SUMMARY (for documentation/debugging)
// =============================================================================

/**
 * Get a human-readable summary of the registry state.
 */
export function getTrueSourceRegistrySummary(): {
  readonly totalBranches: number
  readonly totalTiles: number
  readonly protectedBranches: readonly string[]
  readonly missingBranches: readonly string[]
  readonly criticalRiskBranches: readonly string[]
  readonly primitivePlaceholders: readonly string[]
  readonly readyForReadOnly: readonly string[]
} {
  return {
    totalBranches: TRUE_SOURCE_REGISTRY.length,
    totalTiles: COACH_INTELLIGENCE_TILE_CONTRACTS.length,
    protectedBranches: getProtectedBranches().map(b => b.id),
    missingBranches: getMissingNeededBranches().map(b => b.id),
    criticalRiskBranches: getCriticalRiskBranches().map(b => b.id),
    primitivePlaceholders: TRUE_SOURCE_REGISTRY
      .filter(b => b.currentStatus === 'primitive_placeholder')
      .map(b => b.id),
    readyForReadOnly: TRUE_SOURCE_REGISTRY
      .filter(b => b.readiness === 'ready_for_read_only_consumption')
      .map(b => b.id),
  }
}
