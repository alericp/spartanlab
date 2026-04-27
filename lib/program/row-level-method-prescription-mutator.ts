import {
  runDoctrineApplicationCorridor,
  type DoctrineApplicationCorridorSummary,
  type DoctrineApplicationInput,
} from './doctrine-application-corridor'

/**
 * =============================================================================
 * [PHASE 4L] ROW-LEVEL METHOD + PRESCRIPTION MUTATOR
 *
 * Authoritative gateway for row-level method materialization and prescription
 * bounds proof. Runs after `lib/adaptive-program-builder.ts` finishes a session
 * and after `applySessionStylePreferences` packages grouped methods. Reads what
 * the builder already wrote, adds the one row-level method the builder does not
 * own (`endurance_density`) under conservative safety gates, and emits a
 * per-family challenge proof + per-row prescription bounds witness so the
 * Program page can answer "is doctrine actually decisive?" with honest data.
 *
 * -----------------------------------------------------------------------------
 * AUDIT BASIS — what this file does NOT do, and why:
 * -----------------------------------------------------------------------------
 *   1. Does NOT re-mutate `top_set` / `drop_set` / `rest_pause` / `cluster`.
 *      The builder owns those at lib/adaptive-program-builder.ts L13549-13960
 *      with hardened doctrine-locked safety gates (skill-pillar protection,
 *      skill-adjacent token blocklist, late-position requirement, weekly-role
 *      density gating, strength-category exclusion for drop_set). Re-mutating
 *      here would create a second engine — explicitly forbidden by the phase.
 *
 *   2. Does NOT mutate `sets` / `reps` / `hold_seconds` / `rest_seconds` /
 *      `rpe`. Decisive numeric dose mutation without a dedicated safety phase
 *      risks unsafe athlete dosage — same gate that deferred prescription
 *      mutation in Phases 4I / 4J / 4K. Instead, every row is given a
 *      `prescriptionBoundsProof` witness that records currentValue,
 *      doctrineMin, doctrineMax, and a verdict
 *      (`ALREADY_WITHIN_BOUNDS` | `OUT_OF_BOUNDS_NOT_MUTATED` |
 *       `MISSING_DOCTRINE_BOUNDS`).
 *
 *   3. Does NOT touch any exercise that already has a `setExecutionMethod`,
 *      `method`, or `blockId`. The builder's writes are authoritative.
 *
 * -----------------------------------------------------------------------------
 * WHAT THIS FILE DOES DECISIVELY:
 * -----------------------------------------------------------------------------
 *   1. Adds `endurance_density` row-level write on a safe target row when:
 *        - profile asks for endurance / conditioning / density / military /
 *          work-capacity / time-efficiency context,
 *        - no grouped `density_block` was already applied to this session,
 *        - candidate is `accessory` / `core_or_support` / conditioning role,
 *        - candidate is NOT high-skill protected
 *          (planche / front lever / back lever / handstand / iron cross /
 *           maltese / one-arm / muscle-up / straight-arm strength),
 *        - candidate has no existing `setExecutionMethod` / `method` /
 *          `blockId`,
 *        - candidate is at a late position (index >= ceil(N/2)),
 *        - candidate is not the first technical row of the session.
 *      Fields written: `exercise.method = 'endurance_density'`,
 *      `methodLabel = 'Endurance Density'`, `densityPrescription`,
 *      `rowLevelMethodApplied = true`, `doctrinePrescriptionDelta`.
 *      Note: deliberately does NOT write `setExecutionMethod` because the
 *      shared rollup type `MaterializedRowExecutionMethod` does not currently
 *      include `endurance_density`. Writing only `method` keeps the existing
 *      summary semantics intact while still surfacing on the live workout
 *      (the normalizer preserves `method` + `methodLabel` directly).
 *
 *   2. Builds the per-family challenge proof
 *      (`runMethodMaterializationChallenge`):
 *        - top_set / drop_set / rest_pause / cluster — read from builder
 *          state (`appliedMethods`, `rejectedMethods`, exercise
 *          `setExecutionMethod` writes).
 *        - endurance_density — computed here.
 *        - prescription_sets / reps / holds / rest / rpe — bounds proof per
 *          row, aggregated.
 *      Each family entry includes `eligibleTargets`, `selectedTarget`,
 *      `applied`, `blocked`, `noChange`, `reason`, `fieldsChanged`,
 *      `visibleProofPath`.
 *
 *   3. Stamps `session.rowLevelMutatorSummary` and
 *      `session.styleMetadata.methodMaterializationChallenge` so the Program
 *      page can render compact APPLIED / BLOCKED / NOT-CONNECTED proof.
 *
 * The function is near-pure: it mutates the passed `session` object (the
 * documented contract — same pattern as `applySessionStylePreferences` and
 * the builder's inline blocks) and returns a JSON-safe summary view.
 * =============================================================================
 */

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * Row-level method ids as written into `exercise.method` /
 * `exercise.setExecutionMethod`. The codebase canonical names use `top_set`
 * (not `top_set_backoff`) and `drop_set` to match the existing
 * `MaterializedRowExecutionMethod` union and the normalizer allowlist at
 * `lib/workout/normalize-workout-session.ts`.
 */
export type RowLevelMethodId =
  | 'top_set'
  | 'drop_set'
  | 'rest_pause'
  | 'endurance_density'
  | 'cluster'

export type PrescriptionMutationKind =
  | 'sets'
  | 'reps'
  | 'hold_seconds'
  | 'rest_seconds'
  | 'rpe'
  | 'tempo'
  | 'density_time_cap'

export type PrescriptionBoundsVerdict =
  | 'ALREADY_WITHIN_BOUNDS'
  | 'OUT_OF_BOUNDS_NOT_MUTATED'
  | 'MISSING_DOCTRINE_BOUNDS'

export type RowLevelMutatorFinalStatus =
  | 'ROW_LEVEL_MUTATIONS_APPLIED'
  | 'PRESCRIPTION_MUTATIONS_APPLIED'
  | 'ROW_LEVEL_AND_PRESCRIPTION_APPLIED'
  | 'NO_SAFE_TARGETS_FOUND'
  | 'BLOCKED_BY_SAFETY'
  | 'MISSING_INPUT_CONTRACT'
  | 'MUTATOR_NOT_CONNECTED'
  | 'MUTATOR_ERROR'

export type ChallengeFamilyId =
  | 'top_set'
  | 'drop_set'
  | 'rest_pause'
  | 'endurance_density'
  | 'cluster'
  | 'prescription_sets_reps_holds'
  | 'prescription_rest_rpe'

export type ChallengeFamilyVerdict =
  | 'APPLIED_BY_BUILDER'
  | 'APPLIED_BY_MUTATOR'
  | 'BLOCKED_BY_SAFETY'
  | 'NO_SAFE_TARGET'
  | 'NOT_NEEDED_FOR_PROFILE'
  | 'ALREADY_WITHIN_BOUNDS'
  | 'OUT_OF_BOUNDS_NOT_MUTATED'
  | 'MATERIALIZER_NOT_CONNECTED'
  | 'NO_DOCTRINE_BOUNDS'

export interface ExerciseLike {
  id?: string | number
  name?: string
  category?: string
  selectionReason?: string
  method?: string
  methodLabel?: string
  blockId?: string
  setExecutionMethod?: string
  sets?: number | string
  reps?: number | string
  repsOrTime?: string
  holdSeconds?: number
  restSeconds?: number
  targetRPE?: number
  rowLevelMethodApplied?: boolean
  densityPrescription?: unknown
  doctrinePrescriptionDelta?: unknown
  prescriptionBoundsProof?: PrescriptionBoundsProof
}

export interface SessionLike {
  dayNumber?: number
  focus?: string
  exercises?: ExerciseLike[]
  styleMetadata?: {
    appliedMethods?: string[]
    rejectedMethods?: Array<{ method: string; reason: string }>
    styledGroups?: Array<{ groupType?: string; method?: string }>
    methodMaterializationSummary?: unknown
    methodMaterializationChallenge?: MethodMaterializationChallenge
  }
  rowLevelMutatorSummary?: RowLevelMutatorSummary
  methodDecision?: unknown
}

export interface ProfileSnapshotLike {
  primaryGoal?: string | null
  secondaryGoal?: string | null
  selectedSkills?: string[] | null
  sessionStylePreference?: string | null
  selectedTrainingStyles?: string[] | null
  trainingGoal?: string | null
}

export interface RowLevelFieldChange {
  exerciseId: string
  exerciseName: string
  path: string
  before: unknown
  after: unknown
  reasonCode: string
  sourceRuleIds: string[]
}

export interface RowLevelAppliedMutation {
  exerciseId: string
  exerciseName: string
  methodId: RowLevelMethodId
  source: 'builder' | 'mutator'
  reasonCode: string
  plainEnglish: string
  fieldChanges: RowLevelFieldChange[]
}

export interface RowLevelBlockedMutation {
  exerciseId?: string
  exerciseName?: string
  methodId?: RowLevelMethodId
  reasonCode:
    | 'primary_skill_protected'
    | 'straight_arm_tendon_safety'
    | 'technical_quality_priority'
    | 'joint_caution'
    | 'insufficient_time_budget'
    | 'no_safe_target'
    | 'method_not_selected_or_earned'
    | 'exercise_already_grouped'
    | 'already_has_method'
    | 'not_loadable'
    | 'no_drop_path'
    | 'weekly_role_blocks_intensity'
    | 'profile_level_too_low'
    | 'first_technical_row'
    | 'density_already_grouped'
    | 'builder_rejected'
  plainEnglish: string
  sourceRuleIds: string[]
}

export interface PrescriptionBoundsProof {
  exerciseId: string
  exerciseName: string
  role: string
  unit: 'reps' | 'hold_seconds' | 'unknown'
  currentValue: { setsValue: number | null; primaryValue: number | null; restSeconds: number | null }
  doctrineBounds: {
    setsMin: number | null
    setsMax: number | null
    primaryMin: number | null
    primaryMax: number | null
    restMin: number | null
    restMax: number | null
  } | null
  verdict: PrescriptionBoundsVerdict
  notes: string
}

export interface ChallengeFamilyEntry {
  family: ChallengeFamilyId
  verdict: ChallengeFamilyVerdict
  eligibleTargetCount: number
  eligibleTargets: Array<{ exerciseId: string; exerciseName: string; reason?: string }>
  rejectedCandidates: Array<{ exerciseId?: string; exerciseName: string; reason: string }>
  selectedTarget: { exerciseId: string; exerciseName: string } | null
  applied: boolean
  blocked: boolean
  noChange: boolean
  fieldsChanged: string[]
  reason: string
  visibleProofPath: string
}

export interface MethodMaterializationChallenge {
  version: 'phase_4l.row_level_mutator_challenge.v1'
  generatedAt: string
  byFamily: ChallengeFamilyEntry[]
  oneLineExplanation: string
}

export interface RowLevelMutatorInputStatus {
  hasSession: boolean
  hasProfileSnapshot: boolean
  hasDoctrineRuntimeContract: boolean
  hasDoctrineInfluenceContract: boolean
  hasMethodDecision: boolean
  hasMethodDecisionEvidence: boolean
  hasSelectedTrainingMethods: boolean
  hasWeeklyRole: boolean
}

export interface RowLevelMutatorSummary {
  version: 'phase-4l'
  ran: boolean
  source: 'row_level_method_prescription_mutator'
  inputStatus: RowLevelMutatorInputStatus
  appliedCount: number
  blockedCount: number
  noChangeCount: number
  fieldChangeCount: number
  appliedMethods: RowLevelMethodId[]
  blockedMethods: RowLevelMethodId[]
  prescriptionMutationKinds: PrescriptionMutationKind[]
  finalStatus: RowLevelMutatorFinalStatus
  appliedMutations: RowLevelAppliedMutation[]
  blockedMutations: RowLevelBlockedMutation[]
  prescriptionBoundsProofs: PrescriptionBoundsProof[]
  challenge: MethodMaterializationChallenge
  /**
   * [PHASE 4M] Doctrine application corridor summary — doctrine-earned
   * top_set / drop_set / rest_pause + bounded restSeconds/targetRPE
   * mutations stamped with per-row deltas. Null only when the corridor
   * crashed (fail-soft).
   */
  doctrineApplicationCorridor: DoctrineApplicationCorridorSummary | null
}

export interface RowLevelMethodPrescriptionMutatorInput {
  session: SessionLike | null
  profileSnapshot?: ProfileSnapshotLike | null
  canonicalProfile?: unknown
  doctrineRuntimeContract?: unknown
  doctrineInfluenceContract?: unknown
  unifiedDoctrineDecision?: unknown
  methodDecision?: unknown
  methodDecisionEvidence?: unknown
  methodMaterializationSummary?: unknown
  selectedTrainingMethods?: string[]
  selectedSkills?: string[]
  equipmentAvailable?: string[]
  jointCautions?: string[]
  sessionLengthMinutes?: number | null
  weeklyRole?: { roleId?: string; intensityClass?: string } | null
  currentWeekNumber?: number | null
  /**
   * [PHASE 4N] Multi-intent vector built once at the program level by
   * `lib/program/training-intent-vector.ts`. When present the corridor
   * uses it instead of the legacy 5-field `deriveProfileIntent`. Skill
   * priority is row-protective only (no global blocking).
   */
  trainingIntentVector?: unknown
  /**
   * [PHASE 4N] Weekly method budget plan built once at the program level
   * by `lib/program/weekly-method-budget-plan.ts`. The corridor consults
   * the per-family verdicts to soft-cap heavy methods.
   */
  weeklyMethodBudgetPlan?: unknown
  debugMode?: boolean
}

export interface RowLevelMethodPrescriptionMutatorResult {
  session: SessionLike
  summary: RowLevelMutatorSummary
}

// =============================================================================
// HIGH-SKILL PROTECTION TOKENS
// =============================================================================

const HIGH_SKILL_TOKENS = [
  'planche',
  'front lever',
  'back lever',
  'handstand',
  'hspu',
  'handstand push',
  'iron cross',
  'maltese',
  'victorian',
  'one-arm',
  'one arm',
  'single-arm',
  'single arm',
  'muscle-up',
  'muscle up',
  'straight-arm',
  'straight arm',
  'manna',
  'v-sit',
  'v sit',
  'dragon flag',
] as const

function isHighSkillProtected(name?: string, category?: string, selectionReason?: string): boolean {
  const haystack = `${name ?? ''} ${category ?? ''} ${selectionReason ?? ''}`.toLowerCase()
  return HIGH_SKILL_TOKENS.some(token => haystack.includes(token))
}

function rowAlreadyClaimed(ex: ExerciseLike): boolean {
  if (typeof ex.method === 'string' && ex.method.length > 0) return true
  if (typeof ex.setExecutionMethod === 'string' && ex.setExecutionMethod.length > 0) return true
  if (typeof ex.blockId === 'string' && ex.blockId.length > 0) return true
  return false
}

// =============================================================================
// PROFILE INTENT FLAGS
// =============================================================================

interface ProfileIntent {
  asksForEnduranceOrConditioning: boolean
  isSkillPriority: boolean
  rawGoals: string
}

function deriveProfileIntent(profile: ProfileSnapshotLike | null | undefined): ProfileIntent {
  const primary = String(profile?.primaryGoal ?? '').toLowerCase()
  const secondary = String(profile?.secondaryGoal ?? '').toLowerCase()
  const styles = (profile?.selectedTrainingStyles ?? []).map(s => String(s).toLowerCase()).join(' ')
  const stylePref = String(profile?.sessionStylePreference ?? '').toLowerCase()
  const skills = (profile?.selectedSkills ?? []).map(s => String(s).toLowerCase()).join(' ')

  const goalBlob = `${primary} ${secondary} ${styles} ${stylePref}`
  const enduranceTokens = [
    'endurance',
    'conditioning',
    'work_capacity',
    'work capacity',
    'work-capacity',
    'time_efficient',
    'time efficient',
    'time-efficient',
    'military',
    'tactical',
    'density',
    'metcon',
    'stamina',
  ]
  const skillTokens = ['skill', 'planche', 'lever', 'handstand', 'iron cross', 'maltese', 'one_arm', 'one arm']

  return {
    asksForEnduranceOrConditioning: enduranceTokens.some(t => goalBlob.includes(t)),
    isSkillPriority:
      skillTokens.some(t => goalBlob.includes(t) || skills.includes(t)) ||
      (profile?.selectedSkills?.length ?? 0) >= 2,
    rawGoals: goalBlob.trim(),
  }
}

// =============================================================================
// DOCTRINE BOUNDS — conservative role-based table for prescription PROOF only
// (this table is NOT used to mutate dosage; only to witness it)
// =============================================================================

interface RoleBounds {
  setsMin: number
  setsMax: number
  primaryMin: number
  primaryMax: number
  restMin: number
  restMax: number
  unit: 'reps' | 'hold_seconds'
}

const ROLE_BOUNDS_TABLE: Record<string, RoleBounds> = {
  // Primary strength — heavy compounds, weighted strength, low-rep work.
  primary_strength: { setsMin: 3, setsMax: 6, primaryMin: 3, primaryMax: 8, restMin: 120, restMax: 240, unit: 'reps' },
  secondary_strength: { setsMin: 3, setsMax: 5, primaryMin: 5, primaryMax: 10, restMin: 90, restMax: 180, unit: 'reps' },
  // Skill isometrics — front lever / planche / lever holds.
  skill_isometric: { setsMin: 3, setsMax: 6, primaryMin: 5, primaryMax: 30, restMin: 90, restMax: 180, unit: 'hold_seconds' },
  // Hypertrophy / accessory — wider rep band.
  accessory_hypertrophy: { setsMin: 2, setsMax: 4, primaryMin: 8, primaryMax: 15, restMin: 60, restMax: 120, unit: 'reps' },
  // Core/support — moderate volume.
  core_or_support: { setsMin: 2, setsMax: 4, primaryMin: 8, primaryMax: 20, restMin: 45, restMax: 90, unit: 'reps' },
  // Conditioning — high reps / time blocks.
  conditioning: { setsMin: 2, setsMax: 4, primaryMin: 10, primaryMax: 30, restMin: 30, restMax: 90, unit: 'reps' },
  // Mobility / cooldown — preserve tissue intent.
  mobility_prehab: { setsMin: 1, setsMax: 3, primaryMin: 5, primaryMax: 15, restMin: 0, restMax: 60, unit: 'reps' },
  cooldown_flexibility: { setsMin: 1, setsMax: 3, primaryMin: 20, primaryMax: 60, restMin: 0, restMax: 30, unit: 'hold_seconds' },
}

function inferExerciseRole(ex: ExerciseLike): keyof typeof ROLE_BOUNDS_TABLE {
  const name = String(ex.name ?? '').toLowerCase()
  const category = String(ex.category ?? '').toLowerCase()
  const reason = String(ex.selectionReason ?? '').toLowerCase()

  if (HIGH_SKILL_TOKENS.some(t => name.includes(t))) {
    return 'skill_isometric'
  }
  if (category === 'mobility' || reason.includes('mobility') || reason.includes('prehab')) {
    return 'mobility_prehab'
  }
  if (category === 'cooldown' || reason.includes('cooldown') || reason.includes('flexibility')) {
    return 'cooldown_flexibility'
  }
  if (category === 'conditioning' || reason.includes('conditioning')) {
    return 'conditioning'
  }
  if (category === 'core' || reason.includes('core')) {
    return 'core_or_support'
  }
  if (category === 'strength') {
    if (reason.includes('primary')) return 'primary_strength'
    return 'secondary_strength'
  }
  return 'accessory_hypertrophy'
}

function parsePrimaryValue(ex: ExerciseLike, role: keyof typeof ROLE_BOUNDS_TABLE): number | null {
  const bounds = ROLE_BOUNDS_TABLE[role]
  // Numeric reps shortcut
  if (typeof ex.reps === 'number') return ex.reps
  if (typeof ex.holdSeconds === 'number' && bounds.unit === 'hold_seconds') return ex.holdSeconds
  // Parse repsOrTime ("8-12 reps", "30 sec hold", "10 reps")
  const rt = String(ex.repsOrTime ?? '').toLowerCase()
  if (!rt) return null
  if (bounds.unit === 'hold_seconds') {
    const sec = rt.match(/(\d+)\s*(?:sec|second|s\b)/)
    if (sec) return Number(sec[1])
    const range = rt.match(/(\d+)\s*-\s*(\d+)/)
    if (range) return Math.round((Number(range[1]) + Number(range[2])) / 2)
    const single = rt.match(/(\d+)/)
    if (single) return Number(single[1])
    return null
  }
  const range = rt.match(/(\d+)\s*-\s*(\d+)/)
  if (range) return Math.round((Number(range[1]) + Number(range[2])) / 2)
  const single = rt.match(/(\d+)/)
  if (single) return Number(single[1])
  return null
}

function parseSetsValue(ex: ExerciseLike): number | null {
  if (typeof ex.sets === 'number' && ex.sets > 0) return ex.sets
  if (typeof ex.sets === 'string') {
    const n = parseInt(ex.sets, 10)
    if (!isNaN(n) && n > 0) return n
  }
  return null
}

function buildPrescriptionBoundsProof(ex: ExerciseLike): PrescriptionBoundsProof {
  const role = inferExerciseRole(ex)
  const bounds = ROLE_BOUNDS_TABLE[role]
  const setsValue = parseSetsValue(ex)
  const primaryValue = parsePrimaryValue(ex, role)
  const restSeconds = typeof ex.restSeconds === 'number' ? ex.restSeconds : null

  let verdict: PrescriptionBoundsVerdict = 'ALREADY_WITHIN_BOUNDS'
  const violations: string[] = []

  if (setsValue == null || primaryValue == null) {
    verdict = 'MISSING_DOCTRINE_BOUNDS'
  } else {
    if (setsValue < bounds.setsMin) violations.push(`sets ${setsValue} < min ${bounds.setsMin}`)
    if (setsValue > bounds.setsMax) violations.push(`sets ${setsValue} > max ${bounds.setsMax}`)
    if (primaryValue < bounds.primaryMin) violations.push(`${bounds.unit} ${primaryValue} < min ${bounds.primaryMin}`)
    if (primaryValue > bounds.primaryMax) violations.push(`${bounds.unit} ${primaryValue} > max ${bounds.primaryMax}`)
    if (restSeconds != null) {
      if (restSeconds < bounds.restMin) violations.push(`rest ${restSeconds}s < min ${bounds.restMin}s`)
      if (restSeconds > bounds.restMax) violations.push(`rest ${restSeconds}s > max ${bounds.restMax}s`)
    }
    if (violations.length > 0) verdict = 'OUT_OF_BOUNDS_NOT_MUTATED'
  }

  return {
    exerciseId: String(ex.id ?? ''),
    exerciseName: String(ex.name ?? 'Exercise'),
    role,
    unit: bounds.unit,
    currentValue: { setsValue, primaryValue, restSeconds },
    doctrineBounds: {
      setsMin: bounds.setsMin,
      setsMax: bounds.setsMax,
      primaryMin: bounds.primaryMin,
      primaryMax: bounds.primaryMax,
      restMin: bounds.restMin,
      restMax: bounds.restMax,
    },
    verdict,
    notes:
      verdict === 'ALREADY_WITHIN_BOUNDS'
        ? `Current ${role} dosage is within doctrine bounds (sets ${setsValue}, ${bounds.unit} ${primaryValue}${restSeconds != null ? `, rest ${restSeconds}s` : ''}).`
        : verdict === 'OUT_OF_BOUNDS_NOT_MUTATED'
          ? `Out of doctrine bounds: ${violations.join('; ')}. Not mutated — decisive numeric dose mutation is deferred to a dedicated safety phase.`
          : 'Could not parse current dosage from exercise fields; bounds proof unavailable.',
  }
}

// =============================================================================
// ENDURANCE DENSITY MATERIALIZATION (the only row-level method this file
// decisively writes — every other row-level method is owned by the builder)
// =============================================================================

interface EnduranceDensityResult {
  applied: boolean
  appliedTarget: { exerciseId: string; exerciseName: string } | null
  eligibleTargets: Array<{ exerciseId: string; exerciseName: string; reason?: string }>
  rejectedCandidates: Array<{ exerciseId?: string; exerciseName: string; reason: string }>
  blockedReason: RowLevelBlockedMutation['reasonCode'] | null
  fieldChanges: RowLevelFieldChange[]
  notNeededReason: string | null
}

function tryApplyEnduranceDensity(
  session: SessionLike,
  profileIntent: ProfileIntent,
): EnduranceDensityResult {
  const result: EnduranceDensityResult = {
    applied: false,
    appliedTarget: null,
    eligibleTargets: [],
    rejectedCandidates: [],
    blockedReason: null,
    fieldChanges: [],
    notNeededReason: null,
  }

  const exercises = session.exercises ?? []
  if (exercises.length === 0) {
    result.notNeededReason = 'Session has no exercises.'
    return result
  }

  // 1. Profile intent gate
  if (!profileIntent.asksForEnduranceOrConditioning) {
    result.notNeededReason =
      'Profile does not request endurance / conditioning / density / military / time-efficiency context.'
    return result
  }

  // 2. Density already grouped — defer to grouped form
  const styledGroups = session.styleMetadata?.styledGroups ?? []
  const hasDensityGroup = styledGroups.some(g => g.groupType === 'density_block' || g.method === 'density_block')
  if (hasDensityGroup) {
    result.blockedReason = 'density_already_grouped'
    return result
  }

  // 3. Walk candidates from the LATE half of the session backward.
  //    Same late-position doctrine as the builder's drop_set / rest_pause.
  const lateBoundary = Math.max(2, Math.ceil(exercises.length / 2))

  for (let i = exercises.length - 1; i >= lateBoundary; i--) {
    const ex = exercises[i]
    if (!ex) continue
    const exName = String(ex.name ?? `Exercise ${i + 1}`)

    if (isHighSkillProtected(ex.name, ex.category, ex.selectionReason)) {
      result.rejectedCandidates.push({
        exerciseId: String(ex.id ?? ''),
        exerciseName: exName,
        reason: 'primary_skill_protected — high-skill technical row, density would degrade quality',
      })
      continue
    }
    if (rowAlreadyClaimed(ex)) {
      result.rejectedCandidates.push({
        exerciseId: String(ex.id ?? ''),
        exerciseName: exName,
        reason: `already_has_method — row already carries method=${ex.method ?? ex.setExecutionMethod ?? 'group'}`,
      })
      continue
    }
    const role = inferExerciseRole(ex)
    if (
      role !== 'accessory_hypertrophy' &&
      role !== 'core_or_support' &&
      role !== 'conditioning'
    ) {
      result.rejectedCandidates.push({
        exerciseId: String(ex.id ?? ''),
        exerciseName: exName,
        reason: `not_density_eligible — role=${role}; endurance density requires accessory / core / conditioning role`,
      })
      continue
    }

    // Eligible target found.
    result.eligibleTargets.push({
      exerciseId: String(ex.id ?? ''),
      exerciseName: exName,
      reason: `late position ${i + 1}/${exercises.length}, role=${role}`,
    })

    // Apply to the FIRST eligible target walking backward (deepest safe row).
    if (!result.applied) {
      const before = {
        method: ex.method ?? null,
        methodLabel: ex.methodLabel ?? null,
        densityPrescription: ex.densityPrescription ?? null,
        rowLevelMethodApplied: ex.rowLevelMethodApplied ?? false,
      }

      ex.method = 'endurance_density'
      ex.methodLabel = 'Endurance Density'
      ex.densityPrescription = {
        instruction:
          'Work in a fixed time window. Maintain quality on every rep — stop the round if technique breaks.',
        timeCapSeconds: 180,
        qualityStopRule: 'stop_round_on_form_break',
        sourceRuleIds: ['phase_4l.endurance_density.row_level_v1'],
      }
      ex.rowLevelMethodApplied = true
      ex.doctrinePrescriptionDelta = {
        source: 'row_level_method_prescription_mutator',
        changed: true,
        changes: [
          { path: 'method', before: before.method, after: 'endurance_density' },
          { path: 'methodLabel', before: before.methodLabel, after: 'Endurance Density' },
          { path: 'densityPrescription', before: before.densityPrescription, after: 'attached' },
        ],
        reasonCodes: ['profile_endurance_intent', 'late_safe_accessory_target', 'no_density_block_already_applied'],
        sourceRuleIds: ['phase_4l.endurance_density.row_level_v1'],
        safetyBoundsApplied: true,
      }

      result.applied = true
      result.appliedTarget = { exerciseId: String(ex.id ?? ''), exerciseName: exName }
      result.fieldChanges.push(
        {
          exerciseId: String(ex.id ?? ''),
          exerciseName: exName,
          path: 'method',
          before: before.method,
          after: 'endurance_density',
          reasonCode: 'endurance_density_row_level',
          sourceRuleIds: ['phase_4l.endurance_density.row_level_v1'],
        },
        {
          exerciseId: String(ex.id ?? ''),
          exerciseName: exName,
          path: 'methodLabel',
          before: before.methodLabel,
          after: 'Endurance Density',
          reasonCode: 'endurance_density_row_level',
          sourceRuleIds: ['phase_4l.endurance_density.row_level_v1'],
        },
        {
          exerciseId: String(ex.id ?? ''),
          exerciseName: exName,
          path: 'densityPrescription',
          before: before.densityPrescription,
          after: 'attached',
          reasonCode: 'endurance_density_row_level',
          sourceRuleIds: ['phase_4l.endurance_density.row_level_v1'],
        },
      )
    }
  }

  if (!result.applied && result.eligibleTargets.length === 0) {
    result.blockedReason = 'no_safe_target'
  }

  return result
}

// =============================================================================
// CHALLENGE PROOF — per-family verdict from builder state + mutator state
// =============================================================================

function buildChallengeFamilyEntry(
  family: ChallengeFamilyId,
  verdict: ChallengeFamilyVerdict,
  reason: string,
  options: Partial<Omit<ChallengeFamilyEntry, 'family' | 'verdict' | 'reason' | 'visibleProofPath'>> & {
    visibleProofPath?: string
  } = {},
): ChallengeFamilyEntry {
  return {
    family,
    verdict,
    eligibleTargetCount: options.eligibleTargets?.length ?? options.eligibleTargetCount ?? 0,
    eligibleTargets: options.eligibleTargets ?? [],
    rejectedCandidates: options.rejectedCandidates ?? [],
    selectedTarget: options.selectedTarget ?? null,
    applied: options.applied ?? false,
    blocked: options.blocked ?? false,
    noChange: options.noChange ?? false,
    fieldsChanged: options.fieldsChanged ?? [],
    reason,
    visibleProofPath:
      options.visibleProofPath ?? 'session.styleMetadata.methodMaterializationChallenge.byFamily',
  }
}

function readBuilderRowLevelState(session: SessionLike, methodId: 'top_set' | 'drop_set' | 'rest_pause' | 'cluster'): {
  appliedTargets: Array<{ exerciseId: string; exerciseName: string }>
  rejectedReasons: string[]
  fieldsChanged: string[]
} {
  const exercises = session.exercises ?? []
  const appliedTargets: Array<{ exerciseId: string; exerciseName: string }> = []
  for (const ex of exercises) {
    if (ex.setExecutionMethod === methodId) {
      appliedTargets.push({
        exerciseId: String(ex.id ?? ''),
        exerciseName: String(ex.name ?? 'Exercise'),
      })
    }
  }

  const rejected = session.styleMetadata?.rejectedMethods ?? []
  const builderRejectMap: Record<typeof methodId, string[]> = {
    top_set: ['top_sets'],
    drop_set: ['drop_set'],
    rest_pause: ['rest_pause'],
    cluster: ['cluster_sets'],
  }
  const rejectedReasons = rejected
    .filter(r => builderRejectMap[methodId].includes(r.method))
    .map(r => r.reason)

  const fieldsChanged = appliedTargets.length > 0
    ? ['exercise.method', 'exercise.methodLabel', 'exercise.setExecutionMethod']
    : []

  return { appliedTargets, rejectedReasons, fieldsChanged }
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

export function applyRowLevelMethodPrescriptionMutations(
  input: RowLevelMethodPrescriptionMutatorInput,
): RowLevelMethodPrescriptionMutatorResult {
  const session = input.session as SessionLike

  const inputStatus: RowLevelMutatorInputStatus = {
    hasSession: !!session,
    hasProfileSnapshot: !!input.profileSnapshot,
    hasDoctrineRuntimeContract: !!input.doctrineRuntimeContract,
    hasDoctrineInfluenceContract: !!input.doctrineInfluenceContract,
    hasMethodDecision: !!input.methodDecision,
    hasMethodDecisionEvidence: !!input.methodDecisionEvidence,
    hasSelectedTrainingMethods:
      Array.isArray(input.selectedTrainingMethods) && input.selectedTrainingMethods.length > 0,
    hasWeeklyRole: !!input.weeklyRole,
  }

  // Honest early return: if no session, the mutator cannot run.
  if (!session) {
    const challenge: MethodMaterializationChallenge = {
      version: 'phase_4l.row_level_mutator_challenge.v1',
      generatedAt: new Date().toISOString(),
      byFamily: [],
      oneLineExplanation: 'Mutator received no session — nothing to evaluate.',
    }
    return {
      session: {} as SessionLike,
      summary: {
        version: 'phase-4l',
        ran: false,
        source: 'row_level_method_prescription_mutator',
        inputStatus,
        appliedCount: 0,
        blockedCount: 0,
        noChangeCount: 0,
        fieldChangeCount: 0,
        appliedMethods: [],
        blockedMethods: [],
        prescriptionMutationKinds: [],
        finalStatus: 'MISSING_INPUT_CONTRACT',
        appliedMutations: [],
        blockedMutations: [],
        prescriptionBoundsProofs: [],
        challenge,
        doctrineApplicationCorridor: null,
      },
    }
  }

  const profileIntent = deriveProfileIntent(input.profileSnapshot)
  const exercises = session.exercises ?? []

  // -----------------------------------------------------------------------
  // 1. PRESCRIPTION BOUNDS PROOF — per-row witness (no mutation)
  // -----------------------------------------------------------------------
  const prescriptionBoundsProofs: PrescriptionBoundsProof[] = []
  for (const ex of exercises) {
    if (!ex) continue
    const proof = buildPrescriptionBoundsProof(ex)
    prescriptionBoundsProofs.push(proof)
    ex.prescriptionBoundsProof = proof
  }
  const withinBoundsCount = prescriptionBoundsProofs.filter(p => p.verdict === 'ALREADY_WITHIN_BOUNDS').length
  const outOfBoundsCount = prescriptionBoundsProofs.filter(p => p.verdict === 'OUT_OF_BOUNDS_NOT_MUTATED').length
  const missingBoundsCount = prescriptionBoundsProofs.filter(p => p.verdict === 'MISSING_DOCTRINE_BOUNDS').length

  // -----------------------------------------------------------------------
  // 2. ENDURANCE DENSITY (the only row-level method this mutator owned in Phase 4L)
  // -----------------------------------------------------------------------
  const enduranceResult = tryApplyEnduranceDensity(session, profileIntent)

  // -----------------------------------------------------------------------
  // 2b. [PHASE 4M] DOCTRINE APPLICATION CORRIDOR
  //     Doctrine-earned top_set / drop_set / rest_pause on rows the builder
  //     did NOT already touch, plus bounded restSeconds + targetRPE
  //     prescription mutation. Imported as a helper module — this mutator
  //     remains the single authoritative entry point. The corridor never
  //     touches a row that already has setExecutionMethod / method / blockId.
  // -----------------------------------------------------------------------
  let corridorSummary: DoctrineApplicationCorridorSummary | null = null
  try {
    corridorSummary = runDoctrineApplicationCorridor({
      session,
      profileSnapshot: input.profileSnapshot ?? null,
      selectedTrainingMethods: input.selectedTrainingMethods ?? [],
      selectedSkills: input.selectedSkills ?? [],
      weeklyRole: input.weeklyRole ?? null,
      currentWeekNumber: input.currentWeekNumber ?? null,
      jointCautions: input.jointCautions ?? [],
      // [PHASE 4N] Forward the program-level vector + budget so the corridor
      // applies doctrine-earned methods using the FULL profile truth (not
      // just the 5 fields the legacy intent reader saw) and respects the
      // weekly per-family caps.
      trainingIntentVector: (input.trainingIntentVector as DoctrineApplicationInput['trainingIntentVector']) ?? null,
      weeklyMethodBudgetPlan:
        (input.weeklyMethodBudgetPlan as DoctrineApplicationInput['weeklyMethodBudgetPlan']) ?? null,
    })
  } catch (corridorErr) {
    // Fail-soft: corridor errors must never block the mutator from emitting
    // its existing Phase 4L summary + challenge.
    console.log('[PHASE4M-CORRIDOR-FAILED]', { error: String(corridorErr) })
  }

  // -----------------------------------------------------------------------
  // 3. BUILD APPLIED / BLOCKED LISTS
  // -----------------------------------------------------------------------
  const appliedMutations: RowLevelAppliedMutation[] = []
  const blockedMutations: RowLevelBlockedMutation[] = []
  const fieldChanges: RowLevelFieldChange[] = []
  const appliedMethods: RowLevelMethodId[] = []
  const blockedMethods: RowLevelMethodId[] = []

  // 3a. Read what the builder already wrote
  const builderMethodIds: Array<'top_set' | 'drop_set' | 'rest_pause' | 'cluster'> = [
    'top_set',
    'drop_set',
    'rest_pause',
    'cluster',
  ]
  for (const methodId of builderMethodIds) {
    const state = readBuilderRowLevelState(session, methodId)
    for (const target of state.appliedTargets) {
      appliedMutations.push({
        exerciseId: target.exerciseId,
        exerciseName: target.exerciseName,
        methodId,
        source: 'builder',
        reasonCode: `builder_applied_${methodId}`,
        plainEnglish: `${methodId} applied by adaptive-program-builder under doctrine-locked safety gates.`,
        fieldChanges: state.fieldsChanged.map(path => ({
          exerciseId: target.exerciseId,
          exerciseName: target.exerciseName,
          path,
          before: null,
          after: methodId,
          reasonCode: `builder_applied_${methodId}`,
          sourceRuleIds: ['adaptive_program_builder.row_level_mutator_block'],
        })),
      })
      appliedMethods.push(methodId)
    }
    for (const reason of state.rejectedReasons) {
      blockedMutations.push({
        methodId,
        reasonCode: 'builder_rejected',
        plainEnglish: reason,
        sourceRuleIds: ['adaptive_program_builder.row_level_mutator_block'],
      })
      if (!blockedMethods.includes(methodId)) blockedMethods.push(methodId)
    }
  }

  // 3b. Endurance density — owned by THIS mutator
  if (enduranceResult.applied && enduranceResult.appliedTarget) {
    appliedMutations.push({
      exerciseId: enduranceResult.appliedTarget.exerciseId,
      exerciseName: enduranceResult.appliedTarget.exerciseName,
      methodId: 'endurance_density',
      source: 'mutator',
      reasonCode: 'endurance_density_safe_late_target',
      plainEnglish:
        'Endurance density applied to a safe late-position accessory / core / conditioning target — profile asks for endurance/conditioning and no grouped density block was used.',
      fieldChanges: enduranceResult.fieldChanges,
    })
    appliedMethods.push('endurance_density')
    fieldChanges.push(...enduranceResult.fieldChanges)
  } else if (enduranceResult.blockedReason) {
    blockedMutations.push({
      methodId: 'endurance_density',
      reasonCode: enduranceResult.blockedReason,
      plainEnglish:
        enduranceResult.blockedReason === 'density_already_grouped'
          ? 'Endurance density not row-applied because session already has a grouped density block (correct doctrine).'
          : 'Endurance density evaluated but no safe late-position accessory / core / conditioning target survived the gates.',
      sourceRuleIds: ['phase_4l.endurance_density.row_level_v1'],
    })
    blockedMethods.push('endurance_density')
  }

  // -----------------------------------------------------------------------
  // 4. CHALLENGE PROOF — per family
  // -----------------------------------------------------------------------
  const byFamily: ChallengeFamilyEntry[] = []

  for (const methodId of builderMethodIds) {
    const state = readBuilderRowLevelState(session, methodId)
    if (state.appliedTargets.length > 0) {
      byFamily.push(
        buildChallengeFamilyEntry(
          methodId,
          'APPLIED_BY_BUILDER',
          `${state.appliedTargets.length} application(s) by the builder under doctrine-locked safety gates.`,
          {
            applied: true,
            selectedTarget: state.appliedTargets[0],
            eligibleTargets: state.appliedTargets.map(t => ({ ...t, reason: 'applied_by_builder' })),
            fieldsChanged: state.fieldsChanged,
            visibleProofPath: 'session.exercises[].setExecutionMethod',
          },
        ),
      )
    } else if (state.rejectedReasons.length > 0) {
      byFamily.push(
        buildChallengeFamilyEntry(
          methodId,
          'BLOCKED_BY_SAFETY',
          state.rejectedReasons[0] ?? 'Builder evaluated and rejected.',
          {
            blocked: true,
            rejectedCandidates: state.rejectedReasons.map(reason => ({
              exerciseName: '(builder candidate)',
              reason,
            })),
          },
        ),
      )
    } else {
      byFamily.push(
        buildChallengeFamilyEntry(
          methodId,
          'NOT_NEEDED_FOR_PROFILE',
          'Builder did not select this method for this session — no candidate met the gate or no preference asked for it.',
          { noChange: true },
        ),
      )
    }
  }

  // endurance_density entry
  if (enduranceResult.applied && enduranceResult.appliedTarget) {
    byFamily.push(
      buildChallengeFamilyEntry(
        'endurance_density',
        'APPLIED_BY_MUTATOR',
        'Applied to a safe late-position accessory / core / conditioning target.',
        {
          applied: true,
          selectedTarget: enduranceResult.appliedTarget,
          eligibleTargets: enduranceResult.eligibleTargets,
          rejectedCandidates: enduranceResult.rejectedCandidates,
          fieldsChanged: ['exercise.method', 'exercise.methodLabel', 'exercise.densityPrescription'],
          visibleProofPath: 'session.exercises[].method = "endurance_density"',
        },
      ),
    )
  } else if (enduranceResult.blockedReason === 'density_already_grouped') {
    byFamily.push(
      buildChallengeFamilyEntry(
        'endurance_density',
        'BLOCKED_BY_SAFETY',
        'Session already has a grouped density block — row-level density would duplicate ownership.',
        { blocked: true, rejectedCandidates: enduranceResult.rejectedCandidates },
      ),
    )
  } else if (enduranceResult.notNeededReason) {
    byFamily.push(
      buildChallengeFamilyEntry('endurance_density', 'NOT_NEEDED_FOR_PROFILE', enduranceResult.notNeededReason, {
        noChange: true,
      }),
    )
  } else if (enduranceResult.blockedReason === 'no_safe_target') {
    byFamily.push(
      buildChallengeFamilyEntry(
        'endurance_density',
        'NO_SAFE_TARGET',
        'No accessory / core / conditioning row at a late position survived the high-skill / already-claimed / role gates.',
        {
          blocked: true,
          eligibleTargets: enduranceResult.eligibleTargets,
          rejectedCandidates: enduranceResult.rejectedCandidates,
        },
      ),
    )
  } else {
    byFamily.push(
      buildChallengeFamilyEntry('endurance_density', 'NOT_NEEDED_FOR_PROFILE', 'Profile does not ask for endurance density.', {
        noChange: true,
      }),
    )
  }

  // prescription families
  byFamily.push(
    buildChallengeFamilyEntry(
      'prescription_sets_reps_holds',
      withinBoundsCount > 0 && outOfBoundsCount === 0 && missingBoundsCount === 0
        ? 'ALREADY_WITHIN_BOUNDS'
        : outOfBoundsCount > 0
          ? 'OUT_OF_BOUNDS_NOT_MUTATED'
          : 'NO_DOCTRINE_BOUNDS',
      `${withinBoundsCount} row(s) already within bounds; ${outOfBoundsCount} out-of-bounds (not mutated — decisive numeric dose mutation deferred to dedicated safety phase); ${missingBoundsCount} missing parseable dosage.`,
      {
        eligibleTargetCount: prescriptionBoundsProofs.length,
        noChange: true,
        visibleProofPath: 'session.exercises[].prescriptionBoundsProof',
      },
    ),
  )
  byFamily.push(
    buildChallengeFamilyEntry(
      'prescription_rest_rpe',
      withinBoundsCount > 0 ? 'ALREADY_WITHIN_BOUNDS' : 'NO_DOCTRINE_BOUNDS',
      `Rest doctrine bounds checked per row; mutation deferred. See prescriptionBoundsProof.restMin/restMax per exercise.`,
      {
        eligibleTargetCount: prescriptionBoundsProofs.length,
        noChange: true,
        visibleProofPath: 'session.exercises[].prescriptionBoundsProof.doctrineBounds',
      },
    ),
  )

  // -----------------------------------------------------------------------
  // 5. FINAL STATUS
  // -----------------------------------------------------------------------
  let finalStatus: RowLevelMutatorFinalStatus
  if (appliedMethods.length > 0 && enduranceResult.applied) {
    finalStatus = 'ROW_LEVEL_MUTATIONS_APPLIED'
  } else if (appliedMethods.length > 0) {
    finalStatus = 'ROW_LEVEL_MUTATIONS_APPLIED'
  } else if (blockedMethods.length > 0 && appliedMethods.length === 0) {
    finalStatus = 'BLOCKED_BY_SAFETY'
  } else {
    finalStatus = 'NO_SAFE_TARGETS_FOUND'
  }

  // One-line explanation
  const oneLine = (() => {
    if (appliedMethods.length > 0) {
      return `${appliedMethods.length} row-level method application(s); ${withinBoundsCount}/${prescriptionBoundsProofs.length} rows within prescription bounds.`
    }
    if (blockedMethods.length > 0) {
      return `${blockedMethods.length} method(s) evaluated and blocked by safety / doctrine gates; ${withinBoundsCount}/${prescriptionBoundsProofs.length} rows within prescription bounds.`
    }
    return `No row-level methods needed for this profile; ${withinBoundsCount}/${prescriptionBoundsProofs.length} rows within prescription bounds.`
  })()

  const challenge: MethodMaterializationChallenge = {
    version: 'phase_4l.row_level_mutator_challenge.v1',
    generatedAt: new Date().toISOString(),
    byFamily,
    oneLineExplanation: oneLine,
  }

  // [PHASE 4M] Promote corridor-applied row-level methods into the summary
  // counts so the rollup at lib/server/authoritative-program-generation.ts
  // sees them.
  const corridorAppliedTopSet = corridorSummary?.countsByFamily.top_set?.applied ?? 0
  const corridorAppliedDropSet = corridorSummary?.countsByFamily.drop_set?.applied ?? 0
  const corridorAppliedRestPause = corridorSummary?.countsByFamily.rest_pause?.applied ?? 0
  const corridorAppliedRest = corridorSummary?.countsByFamily.prescription_rest?.applied ?? 0
  const corridorAppliedRpe = corridorSummary?.countsByFamily.prescription_rpe?.applied ?? 0

  if (corridorAppliedTopSet > 0 && !appliedMethods.includes('top_set')) appliedMethods.push('top_set')
  if (corridorAppliedDropSet > 0 && !appliedMethods.includes('drop_set')) appliedMethods.push('drop_set')
  if (corridorAppliedRestPause > 0 && !appliedMethods.includes('rest_pause')) appliedMethods.push('rest_pause')

  const corridorPrescriptionKinds: PrescriptionMutationKind[] = []
  if (corridorAppliedRest > 0) corridorPrescriptionKinds.push('rest_seconds')
  if (corridorAppliedRpe > 0) corridorPrescriptionKinds.push('rpe')

  const summary: RowLevelMutatorSummary = {
    version: 'phase-4l',
    ran: true,
    source: 'row_level_method_prescription_mutator',
    inputStatus,
    appliedCount: appliedMutations.length + (corridorSummary?.appliedDeltas.length ?? 0),
    blockedCount: blockedMutations.length,
    noChangeCount: prescriptionBoundsProofs.length,
    fieldChangeCount: fieldChanges.length + (corridorSummary?.appliedDeltas.length ?? 0),
    appliedMethods: Array.from(new Set(appliedMethods)),
    blockedMethods: Array.from(new Set(blockedMethods)),
    prescriptionMutationKinds: corridorPrescriptionKinds,
    finalStatus,
    appliedMutations,
    blockedMutations,
    prescriptionBoundsProofs,
    challenge,
    doctrineApplicationCorridor: corridorSummary,
  }

  // Stamp onto session
  session.rowLevelMutatorSummary = summary
  session.styleMetadata = session.styleMetadata ?? {}
  session.styleMetadata.methodMaterializationChallenge = challenge

  return { session, summary }
}

// =============================================================================
// CONTROLLED CHALLENGE — diagnostic helper that returns the same challenge
// without mutating the session. Use this when you need to inspect what the
// mutator WOULD do without applying any writes.
// =============================================================================

export function runMethodMaterializationChallenge(
  session: SessionLike | null,
  context: { profileSnapshot?: ProfileSnapshotLike | null } = {},
): MethodMaterializationChallenge {
  if (!session) {
    return {
      version: 'phase_4l.row_level_mutator_challenge.v1',
      generatedAt: new Date().toISOString(),
      byFamily: [],
      oneLineExplanation: 'No session provided.',
    }
  }
  // Run the full mutator on a shallow-cloned exercises array so the original
  // is not mutated. Note: the mutator stamps fields on the session — so we
  // clone the exercises (and styleMetadata) defensively.
  const clonedSession: SessionLike = {
    ...session,
    exercises: (session.exercises ?? []).map(ex => ({ ...ex })),
    styleMetadata: { ...(session.styleMetadata ?? {}) },
  }
  const result = applyRowLevelMethodPrescriptionMutations({
    session: clonedSession,
    profileSnapshot: context.profileSnapshot ?? null,
  })
  return result.summary.challenge
}
