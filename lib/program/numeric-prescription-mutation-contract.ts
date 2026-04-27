/**
 * =============================================================================
 * [PHASE 4Z / PHASE I] NUMERIC PRESCRIPTION MUTATION CONTRACT
 *
 * Authoritative, pure, bounded mutation rail for doctrine-driven changes to
 * sets / reps / hold_seconds. Runs AFTER `applyRowLevelMethodPrescriptionMutations`
 * (which already owns `restSeconds` and `targetRPE` under Phase 4M doctrine
 * application corridor) and BEFORE the program is saved / displayed / launched
 * into a live workout. There is exactly ONE writer — this module — for the
 * fields it touches.
 *
 * -----------------------------------------------------------------------------
 * WHY THIS FILE EXISTS:
 * -----------------------------------------------------------------------------
 * Phases 4I / 4J / 4K / 4L deliberately deferred numeric dose mutation of
 * `sets` / `reps` / `hold_seconds` to a dedicated safety phase, because
 * unbounded volume mutation risks unsafe athlete dosage and silent fatigue
 * debt. Phase 4M added a narrow doctrine application corridor that mutates
 * `restSeconds` and `targetRPE` only, with clamps. This file is that
 * dedicated safety phase for the remaining three numeric fields.
 *
 * The Phase 4M doctrine application corridor at
 * `lib/program/doctrine-application-corridor.ts` already declares the
 * families `prescription_sets`, `prescription_reps`, `prescription_holds`
 * in its `DoctrineApplicationFamily` union but never builds plan entries
 * for them. This contract fills that gap — and reuses the same
 * `DoctrineApplicationDelta` shape and the same
 * `exercise.doctrineApplicationDeltas[]` array, so the existing
 * preservation pipeline (Phase 4M normalizer, Phase 4Q live-loader, Phase 4P
 * structural materialization corridor read-back) already carries the new
 * deltas through save / load / normalize / Program display / live workout
 * with zero additional plumbing.
 *
 * -----------------------------------------------------------------------------
 * WHAT THIS FILE DOES:
 * -----------------------------------------------------------------------------
 *   1. CENTRALIZED BOUNDS — `getDefaultNumericMutationBounds(role, weeklyRole)`
 *      defines explicit per-field min/max and per-field per-phase mutation
 *      step caps. No magic numbers anywhere else.
 *
 *   2. ELIGIBILITY FILTER — `isExerciseEligibleForNumericMutation(exercise)`
 *      protects: primary skill rows, straight-arm strength rows, joint-caution
 *      rows, first-technical-position rows, rows already inside an unsupported
 *      density block, rows with missing/ambiguous numeric fields, rows whose
 *      methodStructure is guidanceOnly, and rows whose
 *      `prescriptionBoundsProof` already verdicted ALREADY_WITHIN_BOUNDS for
 *      the field in question.
 *
 *   3. CONSERVATIVE GATES — protected/acclimation/recovery weeks (read off
 *      `weeklyRole.intensityClass` when present) cap RPE-equivalent fatigue
 *      and BLOCK upward volume changes. Allowed in protected weeks: rest
 *      extension and downward clamping toward safe bounds only.
 *
 *   4. DECISION ENGINE — `decideNumericMutationForExercise()` reads the
 *      already-applied doctrine signals on the row (`method`,
 *      `setExecutionMethod`, `methodLabel`, doctrine deltas pushed by Phase
 *      4M, `prescriptionBoundsProof`) plus session-level signals
 *      (methodStructures, weeklyRole, training intent vector) and emits a
 *      list of bounded `NumericMutationFieldChange[]`. Every change includes
 *      before, after, reasonCode, sourceFamily, clamped flag, and a
 *      visibleProofPath.
 *
 *   5. APPLIER — `applyNumericMutationForSession()` walks the session,
 *      consults the decision engine row-by-row, writes the mutated values
 *      back onto the exercise, pushes one `DoctrineApplicationDelta` per
 *      changed field onto `exercise.doctrineApplicationDeltas[]`, stamps a
 *      compact `exercise.numericPrescriptionDelta` proof object (one per
 *      row, never an array), and stamps `session.numericMutationSummary`
 *      with the per-session verdict + reason codes.
 *
 *   6. ROLLUP — `summarizeNumericMutationResult()` produces a JSON-safe
 *      program-level rollup the caller stamps onto the program object so
 *      the Program page and the source map can read a single verdict.
 *
 * -----------------------------------------------------------------------------
 * WHAT THIS FILE DOES NOT DO:
 * -----------------------------------------------------------------------------
 *   - Does NOT mutate `restSeconds` or `targetRPE` — Phase 4M owns those.
 *   - Does NOT invent doctrine. Reads only what is already on the session
 *     (applied `method`, `methodStructures`, `weeklyRole`, etc.).
 *   - Does NOT randomize or use `Date.now()` for variation. Pure decisions.
 *   - Does NOT call hooks, fetch, localStorage, the DB, or any side effect.
 *   - Does NOT redistribute volume across days, change exercise selection,
 *     or implement weekly intensity dispersion. That is the future
 *     recovery/intensity/adaptiveness layer that this contract creates the
 *     safe rail for.
 *   - Does NOT prescribe RPE 9 or 10 in any path.
 *   - Does NOT increase volume on protected/acclimation weeks.
 *   - Does NOT increase volume on primary skill rows.
 * =============================================================================
 */

import type { DoctrineApplicationDelta } from './doctrine-application-corridor'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

/**
 * Numeric prescription fields this contract is allowed to mutate. Note that
 * `restSeconds` and `targetRPE` are intentionally omitted — Phase 4M's
 * doctrine application corridor at
 * `lib/program/doctrine-application-corridor.ts` is the single owner of
 * those two fields. Mutating them here would create a second writer.
 */
export type NumericPrescriptionField = 'sets' | 'reps' | 'hold_seconds'

/**
 * Coarse role classification used by both the bounds table and the
 * eligibility filter. Inferred from `exercise.category` /
 * `exercise.selectionReason` / `exercise.method` / name tokens. Kept narrow
 * because this contract is a safety rail — finer-grained categorization
 * (skill family, isometric grade, etc.) belongs in the future engine-quality
 * recovery/intensity layer.
 */
export type NumericMutationRowRole =
  | 'primary_skill'
  | 'straight_arm_skill'
  | 'final_skill_obligation'
  | 'loadable_strength'
  | 'secondary_strength'
  | 'accessory_hypertrophy'
  | 'core_or_support'
  | 'conditioning'
  | 'unknown'

/**
 * Coarse weekly role classification. Mirrors what
 * `lib/program/weekly-session-role-contract.ts` writes onto
 * `session.weeklyRole.intensityClass`. Captured here as a type-only alias to
 * keep this file decoupled from the weekly role contract module — that
 * contract is allowed to evolve without breaking the numeric mutation rail.
 */
export type NumericMutationWeeklyIntensityClass =
  | 'protected'
  | 'low'
  | 'moderate'
  | 'high'
  | 'unknown'

/**
 * Stable reason codes emitted by every decision and every blocked attempt.
 * UI surfaces should treat these as opaque keys; localized labels live in
 * `numericPrescriptionDeltaVisibleLabel()` below.
 */
export type NumericMutationReason =
  // doctrine signals
  | 'DOCTRINE_REQUIRES_LOWER_DOSAGE'
  | 'DOCTRINE_REQUIRES_HIGHER_DOSAGE'
  | 'DOCTRINE_REQUIRES_VOLUME_CAP'
  | 'METHOD_STRUCTURE_REQUIRES_CONSERVATIVE_DOSAGE'
  | 'DENSITY_METHOD_REQUIRES_NO_EXTRA_SETS'
  | 'SUPERSET_REQUIRES_VOLUME_PROTECTION'
  | 'CIRCUIT_REQUIRES_VOLUME_PROTECTION'
  | 'TOP_SET_REQUIRES_BACKOFF_VOLUME'
  | 'CLUSTER_REQUIRES_REDUCED_PER_SET_REPS'
  | 'REST_PAUSE_REQUIRES_REDUCED_BASE_REPS'
  | 'ENDURANCE_DENSITY_REQUIRES_BOUNDED_REPS'
  | 'ACCESSORY_HAS_HEADROOM_FOR_PLUS_ONE_SET'
  | 'HYPERTROPHY_REPS_TIGHTENED_TO_QUALITY'
  // protections
  | 'SKILL_PRIORITY_PROTECTED'
  | 'STRAIGHT_ARM_TENDON_PROTECTED'
  | 'FINAL_SKILL_OBLIGATION_PROTECTED'
  | 'ACCLIMATION_WEEK_PROTECTED'
  | 'PROTECTED_WEEK_NO_VOLUME_INCREASE'
  | 'JOINT_CAUTION_NO_VOLUME_INCREASE'
  | 'FIRST_TECHNICAL_ROW_PROTECTED'
  // safety / shape
  | 'ROW_MISSING_NUMERIC_FIELDS'
  | 'UNSUPPORTED_FIELD_SHAPE'
  | 'METHOD_STRUCTURE_GUIDANCE_ONLY'
  | 'DENSITY_RUNTIME_NOT_SUPPORTED_YET'
  | 'ALREADY_WITHIN_SAFE_BOUNDS'
  | 'MUTATION_CLAMPED_TO_SAFE_BOUND'
  | 'MUTATION_BLOCKED_TO_AVOID_FATIGUE_DEBT'
  | 'NO_DOCTRINE_SIGNAL_FOR_ROW'
  | 'BUILDER_VALUE_RESPECTED'

/**
 * Per-field per-row bounds. Every field is optional because not every row
 * type uses every field — e.g. an isometric skill row uses `hold_seconds`
 * but not `reps`.
 */
export interface NumericPrescriptionMutationBounds {
  sets?: { min: number; max: number; maxDeltaPerPhase: number }
  reps?: { min: number; max: number; maxDeltaPerPhase: number }
  hold_seconds?: { min: number; max: number; maxDeltaPerPhase: number }
}

/**
 * Per-row eligibility verdict. Either eligible (the contract may mutate at
 * least one field on this row) or ineligible (the contract may NOT mutate;
 * a NumericMutationFieldChange may still be emitted with delta=0 to record
 * the protection reason).
 */
export interface NumericMutationEligibility {
  eligible: boolean
  role: NumericMutationRowRole
  reason: NumericMutationReason
}

/**
 * One field-level change. Multiple changes per row are allowed (e.g. an
 * accessory row may receive a sets bump + a reps tightening in the same
 * pass). Every change is bounded and clamped before being emitted.
 */
export interface NumericMutationFieldChange {
  field: NumericPrescriptionField
  before: number | null
  after: number | null
  delta: number
  clampedToSafeBound: boolean
  reasonCode: NumericMutationReason
  /**
   * The doctrine family that authorized this change. Mirrors the existing
   * Phase 4M `DoctrineApplicationFamily` taxonomy so `doctrineApplicationDeltas[]`
   * entries pushed by this contract use the same family vocabulary as the
   * rest of the corridor (no second taxonomy).
   */
  sourceFamily: 'prescription_sets' | 'prescription_reps' | 'prescription_holds'
  visibleProofPath: string
}

/**
 * Per-row decision. Always emitted, even when no field changed — the
 * `fieldChanges` array is empty in the no-change path and `reasonCode`
 * documents why.
 */
export interface NumericMutationRowDecision {
  exerciseId: string
  exerciseName: string
  role: NumericMutationRowRole
  eligibility: NumericMutationEligibility
  fieldChanges: NumericMutationFieldChange[]
  /**
   * Compact one-row no-change reason when `fieldChanges.length === 0`.
   * Empty string when at least one field changed.
   */
  noChangeReason: NumericMutationReason | ''
}

/**
 * Per-row proof object stamped onto `exercise.numericPrescriptionDelta`.
 * This is the single source of truth for "what changed on this row" that
 * the Program card / live workout can read without walking the
 * `doctrineApplicationDeltas[]` array. (The deltas array remains the
 * canonical history; this object is the compact summary.)
 */
export interface NumericPrescriptionDeltaProof {
  version: 'phase-4z.numeric-prescription-delta.v1'
  role: NumericMutationRowRole
  /**
   * High-level status the Program-card chip reads to decide which visual
   * variant to render. Three honest states:
   *   - 'mutated'   — at least one field actually changed (chip = emerald,
   *                   or amber when `clamped` is true).
   *   - 'protected' — eligible signal was suppressed by a safety gate; chip
   *                   renders the protectedBy reason in grey.
   *   - 'no_change' — no doctrine signal called for a change AND no
   *                   protection fired; chip is suppressed by the consumer
   *                   to keep common rows compact.
   */
  status: 'mutated' | 'protected' | 'no_change'
  /**
   * True iff at least one field change in `fieldChanges[]` carries
   * `clampedToSafeBound: true`. Surfaced separately so the Program-card chip
   * can paint the amber "clamped" variant without walking `fieldChanges`.
   */
  clamped: boolean
  changed: boolean
  fieldChanges: NumericMutationFieldChange[]
  protectedBy: NumericMutationReason | null
  /**
   * Short user-visible string suitable for a single chip / one-line
   * subscript on the Program card. Examples:
   *   "Accessory volume +1 set (3 → 4)"
   *   "Reps tightened to quality 12 → 10"
   *   "Hold protected for skill priority"
   *   "No change: already within safe bounds"
   */
  visibleLabel: string
}

/**
 * Per-session summary stamped onto `session.numericMutationSummary`.
 */
export interface NumericMutationSessionSummary {
  version: 'phase-4z.numeric-mutation-session.v1'
  ran: boolean
  rowsEvaluated: number
  rowsEligible: number
  rowsMutated: number
  fieldChangeCount: number
  fieldChangesByKind: Record<NumericPrescriptionField, number>
  protectionsApplied: Partial<Record<NumericMutationReason, number>>
  /** Non-zero only when at least one row was mutated upward in volume. */
  totalSetsAddedAcrossSession: number
  /** Always tracked for honesty even when zero. */
  totalSetsRemovedAcrossSession: number
  finalVerdict: NumericMutationFinalVerdict
  perRowDecisions: NumericMutationRowDecision[]
}

/**
 * Stable per-session verdicts. These are the single key the Program page
 * and source map should read to decide whether to show "Doctrine adjusted
 * dosage", "Protected dosage", or "No numeric change".
 */
export type NumericMutationFinalVerdict =
  | 'NUMERIC_MUTATION_APPLIED'
  | 'NUMERIC_MUTATION_NO_ELIGIBLE_ROWS'
  | 'NUMERIC_MUTATION_BLOCKED_BY_PROTECTED_WEEK'
  | 'NUMERIC_MUTATION_BLOCKED_BY_SKILL_PRIORITY'
  | 'NUMERIC_MUTATION_BLOCKED_BY_MISSING_DOCTRINE'
  | 'NUMERIC_MUTATION_GUIDANCE_ONLY'
  | 'NUMERIC_MUTATION_NOT_NEEDED'
  | 'NUMERIC_MUTATION_PARTIAL'

/**
 * Program-level rollup. Built by `summarizeNumericMutationResult()` after
 * every session has run. Stamped onto `program.numericMutationRollup` for
 * the source map and the Program page.
 */
export interface NumericMutationProgramRollup {
  version: 'phase-4z.numeric-mutation-program.v1'
  sessionsProcessed: number
  totalRowsMutated: number
  totalFieldChanges: number
  fieldChangesByKind: Record<NumericPrescriptionField, number>
  totalSetsAdded: number
  totalSetsRemoved: number
  protectionsApplied: Partial<Record<NumericMutationReason, number>>
  finalVerdictCounts: Partial<Record<NumericMutationFinalVerdict, number>>
  programFinalVerdict: NumericMutationFinalVerdict
  /** First applied row sample for the compact one-line proof on the Program page. */
  firstAppliedSample: {
    dayNumber: number | null
    exerciseName: string
    field: NumericPrescriptionField
    before: number | null
    after: number | null
    visibleLabel: string
  } | null
}

// =============================================================================
// EXERCISE-SHAPE TYPES — kept loose because the canonical AdaptiveExercise
// type carries dozens of fields this contract does not care about. We only
// declare what we actually read/write, and we accept extra properties.
// =============================================================================

interface ExerciseShape {
  id?: string | number
  name?: string
  category?: string
  selectionReason?: string
  method?: string
  methodLabel?: string
  setExecutionMethod?: string
  blockId?: string
  sets?: number | string
  reps?: number | string
  repsOrTime?: string
  holdSeconds?: number
  restSeconds?: number
  targetRPE?: number
  rowLevelMethodApplied?: boolean
  /**
   * Stamped by `lib/program/row-level-method-prescription-mutator.ts`. We
   * read its `currentValue` and `doctrineBounds` to anchor mutation
   * decisions to existing per-row doctrine bounds witnesses.
   */
  prescriptionBoundsProof?: {
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
    verdict: 'ALREADY_WITHIN_BOUNDS' | 'OUT_OF_BOUNDS_NOT_MUTATED' | 'MISSING_DOCTRINE_BOUNDS'
  }
  doctrineApplicationDeltas?: DoctrineApplicationDelta[]
  numericPrescriptionDelta?: NumericPrescriptionDeltaProof
}

interface SessionShape {
  dayNumber?: number
  focus?: string
  exercises?: ExerciseShape[]
  weeklyRole?: { roleId?: string; intensityClass?: string }
  styledGroups?: Array<{ groupType?: string }>
  methodStructures?: Array<{
    family?: string
    status?: string
    memberExerciseIds?: string[]
  }>
  numericMutationSummary?: NumericMutationSessionSummary
}

// =============================================================================
// CENTRALIZED BOUNDS
// =============================================================================

/**
 * The single source of truth for safe per-field bounds. Every other function
 * in this file reads from here. No magic numbers anywhere else.
 *
 * The bounds intentionally lean conservative — Phase I is the safety rail,
 * not the periodization brain. Future recovery/intensity adaptiveness logic
 * is permitted to widen these bounds, but only by editing this function.
 */
export function getDefaultNumericMutationBounds(
  role: NumericMutationRowRole,
  weeklyClass: NumericMutationWeeklyIntensityClass,
): NumericPrescriptionMutationBounds {
  // Protected/acclimation weeks: ALL upward mutation is blocked. We still
  // return bounds so a downward clamp toward safe min still has something
  // to clamp against.
  const isProtected = weeklyClass === 'protected'

  switch (role) {
    case 'primary_skill':
    case 'straight_arm_skill':
    case 'final_skill_obligation':
      // Skill rows: reps/hold_seconds bounded TIGHT. Sets cannot be raised.
      return {
        sets: { min: 1, max: 4, maxDeltaPerPhase: 0 },
        reps: { min: 1, max: 8, maxDeltaPerPhase: isProtected ? 0 : 1 },
        hold_seconds: { min: 3, max: 30, maxDeltaPerPhase: isProtected ? 0 : 2 },
      }

    case 'loadable_strength':
      // Heavy compound rows: bounded RPE-equivalent volume. Sets cap of 5
      // matches the prompt's "general maximum" plus a one-set-per-phase
      // step. Top-set / drop-set / rest-pause families lower this further
      // via row-level reasonCodes (see decideNumericMutationForExercise).
      return {
        sets: { min: 2, max: 5, maxDeltaPerPhase: isProtected ? 0 : 1 },
        reps: { min: 1, max: 12, maxDeltaPerPhase: isProtected ? 0 : 2 },
        hold_seconds: { min: 3, max: 60, maxDeltaPerPhase: 0 },
      }

    case 'secondary_strength':
      return {
        sets: { min: 2, max: 4, maxDeltaPerPhase: isProtected ? 0 : 1 },
        reps: { min: 3, max: 15, maxDeltaPerPhase: isProtected ? 0 : 2 },
        hold_seconds: { min: 3, max: 60, maxDeltaPerPhase: 0 },
      }

    case 'accessory_hypertrophy':
      // Accessory: the row type the prompt explicitly calls out for
      // "may add +1 set only if not protected, not grouped-fatigue-risk".
      return {
        sets: { min: 2, max: 4, maxDeltaPerPhase: isProtected ? 0 : 1 },
        reps: { min: 6, max: 20, maxDeltaPerPhase: isProtected ? 0 : 3 },
        hold_seconds: { min: 3, max: 60, maxDeltaPerPhase: 0 },
      }

    case 'core_or_support':
      return {
        sets: { min: 2, max: 4, maxDeltaPerPhase: isProtected ? 0 : 1 },
        reps: { min: 5, max: 25, maxDeltaPerPhase: isProtected ? 0 : 3 },
        hold_seconds: { min: 10, max: 90, maxDeltaPerPhase: isProtected ? 0 : 5 },
      }

    case 'conditioning':
      // Conditioning rows: reps often expressed as time/duration via
      // `repsOrTime` — we deliberately do NOT mutate those rows in this
      // pass to avoid colliding with `densityPrescription`.
      return {
        sets: { min: 1, max: 4, maxDeltaPerPhase: 0 },
        reps: { min: 5, max: 30, maxDeltaPerPhase: 0 },
        hold_seconds: { min: 10, max: 60, maxDeltaPerPhase: 0 },
      }

    case 'unknown':
    default:
      // Unknown role: zero mutation budget. Honest non-mutation is better
      // than guessing.
      return {
        sets: { min: 1, max: 5, maxDeltaPerPhase: 0 },
        reps: { min: 1, max: 20, maxDeltaPerPhase: 0 },
        hold_seconds: { min: 3, max: 60, maxDeltaPerPhase: 0 },
      }
  }
}

// =============================================================================
// ROW ROLE INFERENCE
// =============================================================================

const SKILL_NAME_TOKENS = [
  'planche',
  'front lever',
  'back lever',
  'maltese',
  'iron cross',
  'one-arm',
  'one arm',
  'muscle-up',
  'muscle up',
  'handstand',
  'hspu',
  'dragon flag',
  'human flag',
  'manna',
  'press to handstand',
]

const STRAIGHT_ARM_TOKENS = ['planche', 'front lever', 'back lever', 'iron cross', 'maltese', 'manna']

const LOADABLE_STRENGTH_TOKENS = [
  'weighted pull',
  'weighted chin',
  'weighted dip',
  'weighted row',
  'weighted push',
  'barbell row',
  'barbell press',
  'overhead press',
  'bench press',
  'deadlift',
  'squat',
]

function nameTokensMatch(name: string, tokens: string[]): boolean {
  const lc = name.toLowerCase()
  return tokens.some((t) => lc.includes(t))
}

/**
 * Coarse role inference. Falls back to `unknown` rather than guessing — the
 * unknown role has a zero mutation budget, so a misclassification cannot
 * produce an unsafe mutation.
 */
export function inferNumericMutationRowRole(
  exercise: ExerciseShape,
  positionIndex: number,
  totalRows: number,
): NumericMutationRowRole {
  const name = String(exercise.name ?? '')
  const category = String(exercise.category ?? '').toLowerCase()
  const reason = String(exercise.selectionReason ?? '').toLowerCase()

  // First-position highly technical row — protected as final skill obligation
  // when the row carries a skill token. Otherwise role flows through.
  const isFirstTechnical = positionIndex === 0 && category === 'skill'
  if (isFirstTechnical && nameTokensMatch(name, SKILL_NAME_TOKENS)) {
    return 'final_skill_obligation'
  }

  if (nameTokensMatch(name, STRAIGHT_ARM_TOKENS)) return 'straight_arm_skill'
  if (category === 'skill' || nameTokensMatch(name, SKILL_NAME_TOKENS)) {
    return 'primary_skill'
  }

  if (category === 'strength' && nameTokensMatch(name, LOADABLE_STRENGTH_TOKENS)) {
    return 'loadable_strength'
  }
  if (category === 'strength') {
    // Late-position strength rows are typically secondary; early-position
    // ones are usually primary compound work without external load tokens
    // (e.g. dips, pull-ups). Treat early non-loadable strength as
    // `secondary_strength` with bounded headroom rather than `loadable_strength`
    // because their RPE signal isn't load-anchored.
    const isLate = positionIndex >= Math.ceil(totalRows / 2)
    return isLate ? 'secondary_strength' : 'secondary_strength'
  }
  if (/accessory|hypertroph/.test(reason) || category === 'accessory') {
    return 'accessory_hypertrophy'
  }
  if (category === 'core' || category === 'support' || /core|support/.test(reason)) {
    return 'core_or_support'
  }
  if (category === 'conditioning') return 'conditioning'

  return 'unknown'
}

// =============================================================================
// ELIGIBILITY FILTER
// =============================================================================

interface EligibilityContext {
  exercise: ExerciseShape
  role: NumericMutationRowRole
  positionIndex: number
  totalRows: number
  weeklyClass: NumericMutationWeeklyIntensityClass
  jointCautions: string[]
  /** True iff the row is a member of a methodStructure entry whose status is `applied`. */
  isInExecutableGroupedBlock: boolean
  /** True iff the row is in a `density_block` family methodStructure (executable or not). */
  isInDensityBlock: boolean
  /**
   * True iff the row is a member of any methodStructure whose status is not
   * `applied` (i.e. blocked / not_needed / no_safe_target / unknown). These
   * are the "guidance only" cases the Phase 4Y live runtime banner covers.
   */
  isInGuidanceOnlyMethodStructure: boolean
}

export function isExerciseEligibleForNumericMutation(
  ctx: EligibilityContext,
): NumericMutationEligibility {
  const { exercise, role, positionIndex, weeklyClass, jointCautions, isInDensityBlock, isInGuidanceOnlyMethodStructure } = ctx

  // 1. Skill protections — applies regardless of weekly class.
  if (role === 'primary_skill') {
    return { eligible: false, role, reason: 'SKILL_PRIORITY_PROTECTED' }
  }
  if (role === 'straight_arm_skill') {
    return { eligible: false, role, reason: 'STRAIGHT_ARM_TENDON_PROTECTED' }
  }
  if (role === 'final_skill_obligation') {
    return { eligible: false, role, reason: 'FINAL_SKILL_OBLIGATION_PROTECTED' }
  }

  // 2. First technical row of the session — protected even when not skill.
  // Ensures the warm-up / movement-quality opener is not mutated.
  if (positionIndex === 0) {
    return { eligible: false, role, reason: 'FIRST_TECHNICAL_ROW_PROTECTED' }
  }

  // 3. Joint caution — never increase volume on a flagged joint.
  const name = String(exercise.name ?? '').toLowerCase()
  for (const caution of jointCautions) {
    if (caution && name.includes(caution.toLowerCase())) {
      return { eligible: false, role, reason: 'JOINT_CAUTION_NO_VOLUME_INCREASE' }
    }
  }

  // 4. Density block — runtime is intentionally guidance-only (Phase 4Y).
  // Adding sets to a density row would imply an executable timer that does
  // not exist yet.
  if (isInDensityBlock) {
    return { eligible: false, role, reason: 'DENSITY_RUNTIME_NOT_SUPPORTED_YET' }
  }

  // 5. Guidance-only method structures — the row is part of a structural
  // block the live runtime cannot execute interactively. Mutating volume
  // there would create a mismatch between Program display and live
  // execution.
  if (isInGuidanceOnlyMethodStructure) {
    return { eligible: false, role, reason: 'METHOD_STRUCTURE_GUIDANCE_ONLY' }
  }

  // 6. Conditioning rows — `repsOrTime` is typically time-based and
  // collides with `densityPrescription`. Skip.
  if (role === 'conditioning') {
    return { eligible: false, role, reason: 'UNSUPPORTED_FIELD_SHAPE' }
  }

  // 7. Unknown role — zero budget. Safer to skip than guess.
  if (role === 'unknown') {
    return { eligible: false, role, reason: 'NO_DOCTRINE_SIGNAL_FOR_ROW' }
  }

  // 8. Protected week — the row is technically eligible, but the bounds
  // returned by `getDefaultNumericMutationBounds` will have
  // `maxDeltaPerPhase: 0` for every field, which means the decision engine
  // can only emit downward clamps. We mark eligible so a clamp can still
  // occur but tag the reason.
  if (weeklyClass === 'protected') {
    return { eligible: true, role, reason: 'PROTECTED_WEEK_NO_VOLUME_INCREASE' }
  }

  return { eligible: true, role, reason: 'BUILDER_VALUE_RESPECTED' }
}

// =============================================================================
// CLAMPING
// =============================================================================

/**
 * Clamp a candidate after-value to the configured bounds. Returns both the
 * clamped value and a flag indicating whether clamping occurred. The flag
 * propagates onto the emitted `NumericMutationFieldChange.clampedToSafeBound`
 * and onto the per-row `numericPrescriptionDelta` so the Program page can
 * render an honest "clamped" badge if needed.
 */
export function clampNumericMutation(
  field: NumericPrescriptionField,
  before: number,
  proposedAfter: number,
  bounds: NumericPrescriptionMutationBounds,
): { after: number; clamped: boolean } {
  const fieldBounds = bounds[field]
  if (!fieldBounds) return { after: before, clamped: false }
  const { min, max, maxDeltaPerPhase } = fieldBounds
  const maxAllowed = before + maxDeltaPerPhase
  const minAllowed = before - maxDeltaPerPhase
  let after = proposedAfter
  let clamped = false
  if (after > maxAllowed) {
    after = maxAllowed
    clamped = true
  } else if (after < minAllowed) {
    after = minAllowed
    clamped = true
  }
  if (after > max) {
    after = max
    clamped = true
  } else if (after < min) {
    after = min
    clamped = true
  }
  return { after: Math.round(after), clamped }
}

// =============================================================================
// DECISION ENGINE
// =============================================================================

interface DecisionContext extends EligibilityContext {
  bounds: NumericPrescriptionMutationBounds
}

/**
 * Read the `sets` value off an exercise. Returns null when the value is
 * non-numeric (e.g. "AMRAP"), which short-circuits the sets mutation path.
 */
function parseNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    const n = Number(trimmed)
    if (Number.isFinite(n)) return n
    // "8-12" → 8 (treat the lower bound as authoritative for safety)
    const m = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)/)
    if (m) return Number(m[1])
  }
  return null
}

function parseRepsOrTime(value: string | undefined): { primary: number | null; isTimeBased: boolean } {
  if (!value || typeof value !== 'string') return { primary: null, isTimeBased: false }
  const lc = value.toLowerCase()
  if (/min|sec|hold|s\b|m\b/.test(lc)) {
    return { primary: parseNumber(value), isTimeBased: true }
  }
  return { primary: parseNumber(value), isTimeBased: false }
}

/**
 * Build the per-row decision. Reads ONLY already-applied doctrine signals
 * on the row plus the eligibility/bounds context — never invents new
 * doctrine.
 */
export function decideNumericMutationForExercise(
  ctx: DecisionContext,
): NumericMutationRowDecision {
  const { exercise, role, eligibility, bounds, isInExecutableGroupedBlock, isInDensityBlock, weeklyClass } = ctx as DecisionContext & {
    eligibility: NumericMutationEligibility
  }

  const exerciseId = String(exercise.id ?? '')
  const exerciseName = String(exercise.name ?? 'Exercise')
  const fieldChanges: NumericMutationFieldChange[] = []

  if (!eligibility.eligible) {
    return {
      exerciseId,
      exerciseName,
      role,
      eligibility,
      fieldChanges,
      noChangeReason: eligibility.reason,
    }
  }

  // ---------------------------------------------------------------------------
  // SETS DECISION
  // ---------------------------------------------------------------------------
  const beforeSets = parseNumber(exercise.sets)
  if (beforeSets != null && bounds.sets) {
    let proposedSetsDelta = 0
    let setsReason: NumericMutationReason = 'ALREADY_WITHIN_SAFE_BOUNDS'

    // Doctrine signals that PROHIBIT upward sets mutation.
    const setExecMethod = String(exercise.setExecutionMethod ?? '').toLowerCase()
    const groupedFatigueGuard =
      isInExecutableGroupedBlock || isInDensityBlock || setExecMethod === 'top_set' ||
      setExecMethod === 'drop_set' || setExecMethod === 'rest_pause' || setExecMethod === 'cluster'

    if (weeklyClass === 'protected') {
      // Already covered by maxDeltaPerPhase: 0; the reasonCode below is the
      // honest non-mutation reason the UI surfaces.
      setsReason = 'PROTECTED_WEEK_NO_VOLUME_INCREASE'
    } else if (groupedFatigueGuard) {
      // Phase 4Y grouped runtime carries its own fatigue cost — never
      // stack +1 set on top.
      if (setExecMethod === 'top_set') setsReason = 'TOP_SET_REQUIRES_BACKOFF_VOLUME'
      else if (isInDensityBlock) setsReason = 'DENSITY_METHOD_REQUIRES_NO_EXTRA_SETS'
      else if (isInExecutableGroupedBlock) setsReason = 'METHOD_STRUCTURE_REQUIRES_CONSERVATIVE_DOSAGE'
      else setsReason = 'MUTATION_BLOCKED_TO_AVOID_FATIGUE_DEBT'
    } else if (role === 'accessory_hypertrophy') {
      // Accessory headroom: only add +1 set if currently below the
      // doctrine bounds upper limit AND below our hard max.
      const proofMax = exercise.prescriptionBoundsProof?.doctrineBounds?.setsMax ?? null
      const upperTarget = Math.min(bounds.sets.max, proofMax ?? bounds.sets.max)
      if (beforeSets < upperTarget) {
        proposedSetsDelta = 1
        setsReason = 'ACCESSORY_HAS_HEADROOM_FOR_PLUS_ONE_SET'
      } else {
        setsReason = 'ALREADY_WITHIN_SAFE_BOUNDS'
      }
    } else if (role === 'core_or_support') {
      // Core/support: same +1 set headroom rule as accessory but with
      // tighter ceiling. We only add when significantly below the role max.
      if (beforeSets < bounds.sets.max - 1) {
        proposedSetsDelta = 1
        setsReason = 'ACCESSORY_HAS_HEADROOM_FOR_PLUS_ONE_SET'
      }
    }

    if (proposedSetsDelta !== 0) {
      const proposedAfter = beforeSets + proposedSetsDelta
      const { after, clamped } = clampNumericMutation('sets', beforeSets, proposedAfter, bounds)
      const finalDelta = after - beforeSets
      if (finalDelta !== 0) {
        fieldChanges.push({
          field: 'sets',
          before: beforeSets,
          after,
          delta: finalDelta,
          clampedToSafeBound: clamped,
          reasonCode: clamped ? 'MUTATION_CLAMPED_TO_SAFE_BOUND' : setsReason,
          sourceFamily: 'prescription_sets',
          visibleProofPath: `session.exercises[].numericPrescriptionDelta.sets`,
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // REPS DECISION
  // ---------------------------------------------------------------------------
  const repsOrTime = exercise.repsOrTime
  const repsCandidate = parseRepsOrTime(repsOrTime)
  // Only mutate reps when the row is rep-based AND we have a bounds entry.
  // Hold-based rows go through the holdSeconds path below.
  const beforeReps =
    !repsCandidate.isTimeBased && repsCandidate.primary != null
      ? repsCandidate.primary
      : parseNumber(exercise.reps)

  if (beforeReps != null && bounds.reps && !repsCandidate.isTimeBased) {
    let proposedRepsDelta = 0
    let repsReason: NumericMutationReason = 'ALREADY_WITHIN_SAFE_BOUNDS'

    const setExecMethod = String(exercise.setExecutionMethod ?? '').toLowerCase()

    if (weeklyClass === 'protected') {
      repsReason = 'PROTECTED_WEEK_NO_VOLUME_INCREASE'
    } else if (setExecMethod === 'cluster') {
      // Cluster sets carry intra-set rest — base rep target should be
      // tightened toward quality, not raised.
      if (beforeReps > bounds.reps.min + 2) {
        proposedRepsDelta = -Math.min(2, bounds.reps.maxDeltaPerPhase)
        repsReason = 'CLUSTER_REQUIRES_REDUCED_PER_SET_REPS'
      }
    } else if (setExecMethod === 'rest_pause') {
      if (beforeReps > bounds.reps.min + 2) {
        proposedRepsDelta = -Math.min(2, bounds.reps.maxDeltaPerPhase)
        repsReason = 'REST_PAUSE_REQUIRES_REDUCED_BASE_REPS'
      }
    } else if (role === 'accessory_hypertrophy') {
      // Hypertrophy quality: when reps are at the upper end of the role
      // bounds (e.g. 18 of 20), tighten toward the middle of the
      // hypertrophy band so quality goes up before volume.
      const upper = bounds.reps.max
      if (beforeReps >= upper - 2) {
        proposedRepsDelta = -Math.min(2, bounds.reps.maxDeltaPerPhase)
        repsReason = 'HYPERTROPHY_REPS_TIGHTENED_TO_QUALITY'
      }
    } else if (role === 'loadable_strength') {
      // Loadable strength: keep reps where the builder set them. The Phase
      // 4M corridor handles RPE caps; this contract intentionally does NOT
      // expand the rep target on heavy compounds in Phase I.
      repsReason = 'BUILDER_VALUE_RESPECTED'
    }

    if (proposedRepsDelta !== 0) {
      const proposedAfter = beforeReps + proposedRepsDelta
      const { after, clamped } = clampNumericMutation('reps', beforeReps, proposedAfter, bounds)
      const finalDelta = after - beforeReps
      if (finalDelta !== 0) {
        fieldChanges.push({
          field: 'reps',
          before: beforeReps,
          after,
          delta: finalDelta,
          clampedToSafeBound: clamped,
          reasonCode: clamped ? 'MUTATION_CLAMPED_TO_SAFE_BOUND' : repsReason,
          sourceFamily: 'prescription_reps',
          visibleProofPath: `session.exercises[].numericPrescriptionDelta.reps`,
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HOLD_SECONDS DECISION
  // ---------------------------------------------------------------------------
  // Phase I rule from the prompt: "no aggressive hold increases for
  // planche / front lever / back lever / HSPU / dragon flag skill rows".
  // Those rows are already filtered out by the eligibility step (role
  // primary_skill / straight_arm_skill / final_skill_obligation). For
  // remaining hold-based rows (typically core_or_support) we allow a
  // bounded +2 to +5s expansion.
  const beforeHold = exercise.holdSeconds != null ? Number(exercise.holdSeconds) : null
  if (beforeHold != null && bounds.hold_seconds && bounds.hold_seconds.maxDeltaPerPhase > 0) {
    if (role === 'core_or_support' && beforeHold < bounds.hold_seconds.max - 5) {
      const proposedAfter = beforeHold + Math.min(5, bounds.hold_seconds.maxDeltaPerPhase)
      const { after, clamped } = clampNumericMutation('hold_seconds', beforeHold, proposedAfter, bounds)
      const finalDelta = after - beforeHold
      if (finalDelta > 0) {
        fieldChanges.push({
          field: 'hold_seconds',
          before: beforeHold,
          after,
          delta: finalDelta,
          clampedToSafeBound: clamped,
          reasonCode: clamped ? 'MUTATION_CLAMPED_TO_SAFE_BOUND' : 'ACCESSORY_HAS_HEADROOM_FOR_PLUS_ONE_SET',
          sourceFamily: 'prescription_holds',
          visibleProofPath: `session.exercises[].numericPrescriptionDelta.hold_seconds`,
        })
      }
    }
  }

  return {
    exerciseId,
    exerciseName,
    role,
    eligibility,
    fieldChanges,
    noChangeReason: fieldChanges.length === 0 ? 'ALREADY_WITHIN_SAFE_BOUNDS' : '',
  }
}

// =============================================================================
// VISIBLE LABEL
// =============================================================================

const REASON_VISIBLE_LABEL: Record<NumericMutationReason, string> = {
  DOCTRINE_REQUIRES_LOWER_DOSAGE: 'Doctrine: lower dosage',
  DOCTRINE_REQUIRES_HIGHER_DOSAGE: 'Doctrine: higher dosage',
  DOCTRINE_REQUIRES_VOLUME_CAP: 'Doctrine: volume cap',
  METHOD_STRUCTURE_REQUIRES_CONSERVATIVE_DOSAGE: 'Conservative volume (grouped block)',
  DENSITY_METHOD_REQUIRES_NO_EXTRA_SETS: 'No extra sets (density block)',
  SUPERSET_REQUIRES_VOLUME_PROTECTION: 'Volume preserved (superset)',
  CIRCUIT_REQUIRES_VOLUME_PROTECTION: 'Volume preserved (circuit)',
  TOP_SET_REQUIRES_BACKOFF_VOLUME: 'Top set + back-off volume',
  CLUSTER_REQUIRES_REDUCED_PER_SET_REPS: 'Reps tightened for cluster',
  REST_PAUSE_REQUIRES_REDUCED_BASE_REPS: 'Reps tightened for rest-pause',
  ENDURANCE_DENSITY_REQUIRES_BOUNDED_REPS: 'Reps bounded for density',
  ACCESSORY_HAS_HEADROOM_FOR_PLUS_ONE_SET: 'Accessory volume +1 set',
  HYPERTROPHY_REPS_TIGHTENED_TO_QUALITY: 'Reps tightened to quality',
  SKILL_PRIORITY_PROTECTED: 'Protected for skill priority',
  STRAIGHT_ARM_TENDON_PROTECTED: 'Tendon-protected (straight-arm)',
  FINAL_SKILL_OBLIGATION_PROTECTED: 'Protected: final skill obligation',
  ACCLIMATION_WEEK_PROTECTED: 'Acclimation week — no increase',
  PROTECTED_WEEK_NO_VOLUME_INCREASE: 'Protected week — volume preserved',
  JOINT_CAUTION_NO_VOLUME_INCREASE: 'Joint caution — no volume increase',
  FIRST_TECHNICAL_ROW_PROTECTED: 'First technical row — preserved',
  ROW_MISSING_NUMERIC_FIELDS: 'No numeric change',
  UNSUPPORTED_FIELD_SHAPE: 'No numeric change (time-based)',
  METHOD_STRUCTURE_GUIDANCE_ONLY: 'Guidance-only block — no volume change',
  DENSITY_RUNTIME_NOT_SUPPORTED_YET: 'Density bounded — runtime guidance only',
  ALREADY_WITHIN_SAFE_BOUNDS: 'Already within safe bounds',
  MUTATION_CLAMPED_TO_SAFE_BOUND: 'Clamped to safe bound',
  MUTATION_BLOCKED_TO_AVOID_FATIGUE_DEBT: 'Volume preserved to avoid fatigue debt',
  NO_DOCTRINE_SIGNAL_FOR_ROW: 'No doctrine signal — preserved',
  BUILDER_VALUE_RESPECTED: 'Builder dosage respected',
}

function buildVisibleLabel(decision: NumericMutationRowDecision): string {
  if (decision.fieldChanges.length === 0) {
    return REASON_VISIBLE_LABEL[decision.noChangeReason || 'ALREADY_WITHIN_SAFE_BOUNDS']
  }
  // Prefer the most specific change for the chip.
  const primary = decision.fieldChanges[0]
  const fieldName =
    primary.field === 'sets' ? 'Sets' : primary.field === 'reps' ? 'Reps' : 'Hold'
  const direction = primary.delta > 0 ? '+' : ''
  return `${fieldName} ${direction}${primary.delta} (${primary.before} → ${primary.after}) — ${REASON_VISIBLE_LABEL[primary.reasonCode]}`
}

// =============================================================================
// SESSION APPLIER
// =============================================================================

export interface RunNumericMutationInput {
  session: SessionShape
  jointCautions?: string[]
}

export interface RunNumericMutationResult {
  summary: NumericMutationSessionSummary
}

/**
 * Mutate a single session's eligible numeric prescriptions in place. Pure
 * with respect to module-scope state; mutates only the passed-in session
 * object (documented contract — same pattern as
 * `applyRowLevelMethodPrescriptionMutations` and
 * `applySessionStylePreferences`).
 */
export function runNumericPrescriptionMutationForSession(
  input: RunNumericMutationInput,
): RunNumericMutationResult {
  const { session, jointCautions = [] } = input
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  const totalRows = exercises.length

  const weeklyClass: NumericMutationWeeklyIntensityClass =
    (session.weeklyRole?.intensityClass as NumericMutationWeeklyIntensityClass | undefined) ?? 'unknown'

  // Pre-compute methodStructure membership for each exercise. Cheap; saves
  // O(N*M) work in the eligibility loop.
  const methodStructures = Array.isArray(session.methodStructures) ? session.methodStructures : []
  const executableGroupedIds = new Set<string>()
  const guidanceOnlyGroupedIds = new Set<string>()
  const densityIds = new Set<string>()
  for (const ms of methodStructures) {
    const status = String(ms.status ?? '').toLowerCase()
    const family = String(ms.family ?? '').toLowerCase()
    const ids = Array.isArray(ms.memberExerciseIds) ? ms.memberExerciseIds : []
    if (family === 'density_block') {
      for (const id of ids) densityIds.add(String(id))
    }
    if (status === 'applied' || status === 'already_applied') {
      for (const id of ids) executableGroupedIds.add(String(id))
    } else {
      for (const id of ids) guidanceOnlyGroupedIds.add(String(id))
    }
  }

  const perRowDecisions: NumericMutationRowDecision[] = []
  const fieldChangesByKind: Record<NumericPrescriptionField, number> = {
    sets: 0,
    reps: 0,
    hold_seconds: 0,
  }
  const protectionsApplied: Partial<Record<NumericMutationReason, number>> = {}
  let rowsEligible = 0
  let rowsMutated = 0
  let totalSetsAdded = 0
  let totalSetsRemoved = 0

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    if (!ex) continue
    const role = inferNumericMutationRowRole(ex, i, totalRows)
    const exId = String(ex.id ?? '')
    const eligibility = isExerciseEligibleForNumericMutation({
      exercise: ex,
      role,
      positionIndex: i,
      totalRows,
      weeklyClass,
      jointCautions,
      isInExecutableGroupedBlock: executableGroupedIds.has(exId),
      isInDensityBlock: densityIds.has(exId),
      isInGuidanceOnlyMethodStructure:
        guidanceOnlyGroupedIds.has(exId) && !executableGroupedIds.has(exId),
    })
    if (eligibility.eligible) rowsEligible += 1
    const bounds = getDefaultNumericMutationBounds(role, weeklyClass)
    const decision = decideNumericMutationForExercise({
      exercise: ex,
      role,
      positionIndex: i,
      totalRows,
      weeklyClass,
      jointCautions,
      isInExecutableGroupedBlock: executableGroupedIds.has(exId),
      isInDensityBlock: densityIds.has(exId),
      isInGuidanceOnlyMethodStructure:
        guidanceOnlyGroupedIds.has(exId) && !executableGroupedIds.has(exId),
      eligibility,
      bounds,
    } as DecisionContext & { eligibility: NumericMutationEligibility })

    perRowDecisions.push(decision)

    // Tally protection reasons even when no field changed — the Program
    // page shows a "Protected" chip when this is non-empty.
    if (decision.fieldChanges.length === 0 && decision.noChangeReason) {
      protectionsApplied[decision.noChangeReason] =
        (protectionsApplied[decision.noChangeReason] ?? 0) + 1
    }

    // Apply field changes back onto the exercise.
    if (decision.fieldChanges.length > 0) {
      rowsMutated += 1
      for (const change of decision.fieldChanges) {
        fieldChangesByKind[change.field] += 1
        if (change.field === 'sets' && change.delta > 0) totalSetsAdded += change.delta
        if (change.field === 'sets' && change.delta < 0) totalSetsRemoved += -change.delta

        // 1. Write the new value onto the row using the field that the
        // Phase 4M corridor / display layer actually consumes.
        if (change.field === 'sets' && change.after != null) {
          ex.sets = change.after
        } else if (change.field === 'reps' && change.after != null) {
          // Preserve `repsOrTime` shape if it was a string range like "8-12".
          // The card reads `repsOrTime` in preference to `reps`; keep them
          // in sync when the original value was a plain number.
          const originalRepsOrTime = String(ex.repsOrTime ?? '')
          if (/^\d+$/.test(originalRepsOrTime.trim())) {
            ex.repsOrTime = String(change.after)
          } else if (/^\d+\s*[-–]\s*\d+$/.test(originalRepsOrTime.trim())) {
            // For ranges like "8-12", anchor the LOW end to the new value
            // and shrink the range proportionally toward quality.
            const m = originalRepsOrTime.trim().match(/^(\d+)\s*[-–]\s*(\d+)/)
            if (m) {
              const low = Number(m[1])
              const high = Number(m[2])
              const span = Math.max(0, high - low)
              const newLow = change.after
              const newHigh = newLow + span
              ex.repsOrTime = `${newLow}-${newHigh}`
            }
          }
          ex.reps = change.after
        } else if (change.field === 'hold_seconds' && change.after != null) {
          ex.holdSeconds = change.after
        }

        // 2. Push a Phase 4M-shaped DoctrineApplicationDelta entry so the
        // existing preservation pipeline (normalizer, live loader, source
        // map) carries this change through save/load/normalize/Program/live
        // workout for free. One delta per changed field.
        const delta: DoctrineApplicationDelta = {
          family: change.sourceFamily,
          fieldPath: `exercise.${change.field === 'hold_seconds' ? 'holdSeconds' : change.field}`,
          before: change.before,
          after: change.after,
          source: 'doctrine_application_corridor',
          reason: `${change.reasonCode}: ${REASON_VISIBLE_LABEL[change.reasonCode]}`,
          safetyGate: change.clampedToSafeBound ? 'numeric_mutation_clamped' : 'numeric_mutation_bounded',
          appliedAt: 'phase-4z.numeric-prescription-mutation-contract',
          visibleLabel:
            change.field === 'sets'
              ? `Sets ${change.before} → ${change.after}`
              : change.field === 'reps'
                ? `Reps ${change.before} → ${change.after}`
                : `Hold ${change.before}s → ${change.after}s`,
        }
        ex.doctrineApplicationDeltas = ex.doctrineApplicationDeltas ?? []
        ex.doctrineApplicationDeltas.push(delta)
      }
    }

    // 3. Stamp the per-row compact proof object — single object per row,
    // never an array. Always written, even on no-change rows, so the
    // Program card can render an honest "protected" chip.
    const changed = decision.fieldChanges.length > 0
    const clamped = decision.fieldChanges.some((c) => c.clampedToSafeBound === true)
    const protectedBy =
      !changed && decision.noChangeReason ? decision.noChangeReason : null
    // Status drives the Program-card chip variant. Keep this derivation
    // here (not in the consumer) so the contract owns honesty:
    //   - any field actually moved -> 'mutated'
    //   - no fields moved AND a protection reason fired -> 'protected'
    //   - everything else -> 'no_change' (chip suppressed by consumer)
    const status: 'mutated' | 'protected' | 'no_change' = changed
      ? 'mutated'
      : protectedBy
        ? 'protected'
        : 'no_change'
    const proof: NumericPrescriptionDeltaProof = {
      version: 'phase-4z.numeric-prescription-delta.v1',
      role,
      status,
      clamped,
      changed,
      fieldChanges: decision.fieldChanges,
      protectedBy,
      visibleLabel: buildVisibleLabel(decision),
    }
    ex.numericPrescriptionDelta = proof
  }

  // -----------------------------------------------------------------------
  // SESSION VERDICT
  // -----------------------------------------------------------------------
  const fieldChangeCount = Object.values(fieldChangesByKind).reduce((a, b) => a + b, 0)
  let finalVerdict: NumericMutationFinalVerdict
  if (rowsMutated > 0 && rowsEligible > 0) {
    finalVerdict =
      rowsMutated < rowsEligible
        ? 'NUMERIC_MUTATION_PARTIAL'
        : 'NUMERIC_MUTATION_APPLIED'
  } else if (weeklyClass === 'protected' && rowsEligible === 0) {
    finalVerdict = 'NUMERIC_MUTATION_BLOCKED_BY_PROTECTED_WEEK'
  } else if (rowsEligible === 0 && totalRows > 0) {
    // Distinguish skill-protected vs other ineligibility for the verdict.
    const skillProtected =
      perRowDecisions.filter(
        (d) =>
          d.noChangeReason === 'SKILL_PRIORITY_PROTECTED' ||
          d.noChangeReason === 'STRAIGHT_ARM_TENDON_PROTECTED' ||
          d.noChangeReason === 'FINAL_SKILL_OBLIGATION_PROTECTED',
      ).length > 0
    finalVerdict = skillProtected
      ? 'NUMERIC_MUTATION_BLOCKED_BY_SKILL_PRIORITY'
      : 'NUMERIC_MUTATION_NO_ELIGIBLE_ROWS'
  } else {
    finalVerdict = 'NUMERIC_MUTATION_NOT_NEEDED'
  }

  const summary: NumericMutationSessionSummary = {
    version: 'phase-4z.numeric-mutation-session.v1',
    ran: true,
    rowsEvaluated: totalRows,
    rowsEligible,
    rowsMutated,
    fieldChangeCount,
    fieldChangesByKind,
    protectionsApplied,
    totalSetsAddedAcrossSession: totalSetsAdded,
    totalSetsRemovedAcrossSession: totalSetsRemoved,
    finalVerdict,
    perRowDecisions,
  }
  session.numericMutationSummary = summary
  return { summary }
}

// =============================================================================
// PROGRAM-LEVEL ROLLUP
// =============================================================================

export function summarizeNumericMutationResult(
  perSessionSummaries: NumericMutationSessionSummary[],
  perSessionDayNumbers: Array<number | null>,
): NumericMutationProgramRollup {
  const fieldChangesByKind: Record<NumericPrescriptionField, number> = {
    sets: 0,
    reps: 0,
    hold_seconds: 0,
  }
  const protectionsApplied: Partial<Record<NumericMutationReason, number>> = {}
  const finalVerdictCounts: Partial<Record<NumericMutationFinalVerdict, number>> = {}
  let totalRowsMutated = 0
  let totalFieldChanges = 0
  let totalSetsAdded = 0
  let totalSetsRemoved = 0
  let firstAppliedSample: NumericMutationProgramRollup['firstAppliedSample'] = null

  for (let s = 0; s < perSessionSummaries.length; s++) {
    const summary = perSessionSummaries[s]
    totalRowsMutated += summary.rowsMutated
    totalFieldChanges += summary.fieldChangeCount
    totalSetsAdded += summary.totalSetsAddedAcrossSession
    totalSetsRemoved += summary.totalSetsRemovedAcrossSession
    fieldChangesByKind.sets += summary.fieldChangesByKind.sets
    fieldChangesByKind.reps += summary.fieldChangesByKind.reps
    fieldChangesByKind.hold_seconds += summary.fieldChangesByKind.hold_seconds
    for (const [reason, count] of Object.entries(summary.protectionsApplied)) {
      const key = reason as NumericMutationReason
      protectionsApplied[key] = (protectionsApplied[key] ?? 0) + (count ?? 0)
    }
    finalVerdictCounts[summary.finalVerdict] = (finalVerdictCounts[summary.finalVerdict] ?? 0) + 1

    if (firstAppliedSample === null) {
      for (const decision of summary.perRowDecisions) {
        if (decision.fieldChanges.length > 0) {
          const primary = decision.fieldChanges[0]
          firstAppliedSample = {
            dayNumber: perSessionDayNumbers[s] ?? null,
            exerciseName: decision.exerciseName,
            field: primary.field,
            before: primary.before,
            after: primary.after,
            visibleLabel: REASON_VISIBLE_LABEL[primary.reasonCode],
          }
          break
        }
      }
    }
  }

  let programFinalVerdict: NumericMutationFinalVerdict
  if (totalRowsMutated > 0 && (finalVerdictCounts.NUMERIC_MUTATION_PARTIAL ?? 0) === 0) {
    programFinalVerdict = 'NUMERIC_MUTATION_APPLIED'
  } else if (totalRowsMutated > 0) {
    programFinalVerdict = 'NUMERIC_MUTATION_PARTIAL'
  } else if ((finalVerdictCounts.NUMERIC_MUTATION_BLOCKED_BY_PROTECTED_WEEK ?? 0) > 0) {
    programFinalVerdict = 'NUMERIC_MUTATION_BLOCKED_BY_PROTECTED_WEEK'
  } else if ((finalVerdictCounts.NUMERIC_MUTATION_BLOCKED_BY_SKILL_PRIORITY ?? 0) > 0) {
    programFinalVerdict = 'NUMERIC_MUTATION_BLOCKED_BY_SKILL_PRIORITY'
  } else {
    programFinalVerdict = 'NUMERIC_MUTATION_NO_ELIGIBLE_ROWS'
  }

  return {
    version: 'phase-4z.numeric-mutation-program.v1',
    sessionsProcessed: perSessionSummaries.length,
    totalRowsMutated,
    totalFieldChanges,
    fieldChangesByKind,
    totalSetsAdded,
    totalSetsRemoved,
    protectionsApplied,
    finalVerdictCounts,
    programFinalVerdict,
    firstAppliedSample,
  }
}
