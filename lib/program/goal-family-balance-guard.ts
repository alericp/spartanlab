/**
 * GOAL-FAMILY BALANCE + TISSUE-LOAD SATURATION GUARD
 *
 * =============================================================================
 * POST-PHASE-P PROGRAM INTELLIGENCE CALIBRATION
 * =============================================================================
 *
 * SpartanLab already runs (in order):
 *   builder → Phase J/K weekly stress + recovery distribution
 *           → Phase L/M post-workout performance feedback adaptation
 *           → Phase O trend / coach decision intelligence
 *           → Phase P doctrine quality / sharpness audit (RPE caps, per-side
 *             notes, skill carryover attribution)
 *           → Phase R session-length truth lock
 *           → Phase Q doctrine utilization causal trace
 *           → Phase AA2 doctrine utilization map
 *
 * The existing weekly balance logic (`analyzeWeekLoadBalance` in
 * `lib/prescription-contract.ts`) only counts coarse FOCUS LABELS and
 * straight-arm stress. With heavy advanced-skill goal mixes (planche +
 * front lever + back lever + muscle-up + HSPU + dragon flag) it cannot tell
 * apart:
 *   - vertical push vs horizontal push vs straight-arm push
 *   - dynamic push progression vs static / isometric push support
 *   - vertical pull vs horizontal pull vs straight-arm pull vs explosive
 *     transition pull
 *   - biceps / elbow tendon load (which all of FL / BL / OAP / muscle-up
 *     contribute to and which can saturate fast)
 *   - compression core / dragon-flag carryover vs generic anti-extension abs
 *
 * This contract adds a bounded, source-owned guard that runs AFTER all
 * earlier phases on the final adapted program. It answers a single question:
 *
 *   "Given the user's selected goals, are we genuinely covering the
 *    push / pull / core tissue families that those goals actually require —
 *    or are pull-dominant goals crowding out push / core exposure?"
 *
 * It is a pure deterministic resolver. It does NOT:
 *   - run another generator
 *   - swap exercises in grouped methods (superset / circuit / density /
 *     cluster) — those slots are doctrine-bound and untouched
 *   - delete selected-skill work
 *   - inject new methods or grouped structures
 *   - override Phase L safety bounds, Phase O conclusions, or Phase P
 *     RPE caps
 *   - mutate completed days
 *   - modify `sets` / `repsOrTime` / `targetRPE` / `restSeconds` /
 *     `prescribedLoad` on existing rows
 *   - touch user settings, onboarding, or evidence
 *   - fabricate non-database exercises (live-runtime DB-truth contract is
 *     preserved)
 *
 * It performs THREE passes:
 *   1. CLASSIFY — every visible-week exercise is classified into 0..N
 *      goal families using the canonical `EXERCISE_CLASSIFICATIONS`
 *      registry first, with a doctrine-true name+category fallback for
 *      rows the registry does not know.
 *   2. COUNT + SATURATION — weekly tissue-load counts are summed per
 *      family, biceps/elbow tendon stress is counted ACROSS straight-arm
 *      pull + back-lever + transition-pull rows (not just labeled rows).
 *   3. VERDICT — for every selected skill, the guard checks whether the
 *      family it materially requires is covered, weak, or crowded out
 *      and either:
 *        a. records a `preserve_no_change` correction with an honest
 *           protected reason (e.g. recovery / equipment / session length /
 *           DB-truth pool / tendon saturation), OR
 *        b. records an `insert` / `replace` recommendation that the
 *           pipeline could safely apply against a non-grouped, non-cluster,
 *           low-priority accessory tail row (v1 records the
 *           recommendation but does not synthesize non-DB rows — keeping
 *           AB10 live-runtime DB-truth parity intact).
 *
 * The result of the guard is:
 *   - `program.goalFamilyBalanceAudit` (top-level audit slice — JSON-safe)
 *   - a `visibleSummary` field, set to a single short string ONLY when the
 *     audit found something materially worth telling the user, otherwise
 *     `null`. The Program card / ProgramTruthSummary reads it as-is.
 *
 * NO localStorage. NO window. NO fetch. NO React. NO DB. NO Date.now in the
 * core resolver — clock is injected via `options.nowIso`. Every output
 * field is optional and additive so save/load via whole-object spread
 * continues to round-trip cleanly. Failure must be non-blocking at the
 * call-site (try/catch absorbs errors, mirroring Phase P).
 */

import type {
  AdaptiveProgram,
  AdaptiveSession,
  AdaptiveExercise,
} from '../adaptive-program-builder'
import {
  EXERCISE_CLASSIFICATIONS,
  getExerciseClassification,
} from '../exercise-classification-registry'
import type { ExerciseClassification } from '../exercise-classification-registry'
// =============================================================================
// [V2] DB-TRUTH SWAP POOL IMPORTS
// =============================================================================
// `getAllExercises()` is the canonical exercise pool consumed by the rest of
// the program builder (see `lib/adaptive-program-builder.ts:mapToAdaptiveExercises`).
// Pulling V2 swap candidates from this exact source guarantees that any row
// the guard inserts will survive into live workout execution and preserves
// the AB10 live-runtime DB-truth parity contract (`source: 'database'`).
import { getAllExercises } from '../adaptive-exercise-pool'
import type { Exercise as PoolExercise } from '../adaptive-exercise-pool'

// =============================================================================
// PUBLIC TYPES — all fields optional / JSON-safe / additive
// =============================================================================

/**
 * Goal families used by this guard. Distinct from
 * `MovementFamily` in `movement-family-registry` so the guard can carry
 * orthogonal concepts the registry does not expose (transition_pull,
 * biceps_elbow_tendon, mobility_integrity rollup) without polluting the
 * canonical movement-family enum.
 */
export type GoalFamily =
  | 'pull_vertical'
  | 'pull_horizontal'
  | 'straight_arm_pull'
  | 'transition_pull'
  | 'biceps_elbow_tendon'
  | 'push_vertical'
  | 'push_horizontal'
  | 'straight_arm_push'
  | 'dip_pattern'
  | 'compression_core'
  | 'mobility_integrity'

/** Stable correction action kinds. */
export type GoalFamilyBalanceAction = 'replace' | 'insert' | 'preserve_no_change'

/** Stable machine reason codes. Never user-facing. */
export type GoalFamilyBalanceReasonCode =
  // weak / missing exposure findings
  | 'selected_goal_family_under_exposed'
  | 'selected_goal_family_static_only'
  | 'selected_goal_family_carryover_only'
  // saturation findings
  | 'pull_family_saturated'
  | 'biceps_elbow_tendon_saturated'
  | 'straight_arm_volume_saturated'
  // protection / no-change reasons
  | 'protected_completed_day'
  | 'protected_grouped_method_block'
  | 'protected_cluster_set_execution'
  | 'protected_session_length_capped'
  | 'protected_db_truth_pool_unavailable'
  | 'protected_recovery_already_high'
  | 'protected_tendon_overload_risk'
  | 'protected_no_low_priority_swap_target'
  | 'protected_already_balanced'
  // recommendation reasons
  | 'recommend_dynamic_push_for_planche'
  | 'recommend_vertical_press_for_hspu'
  | 'recommend_compression_core_for_dragon_flag'
  | 'recommend_explosive_pull_for_muscle_up'
  | 'recommend_horizontal_pull_for_lever'
  | 'recommend_mobility_integrity_for_tendon_load'

export interface GoalFamilyBalanceWeakExposure {
  family: GoalFamily
  selectedSkill: string
  reason: string
  reasonCode: GoalFamilyBalanceReasonCode
}

export interface GoalFamilyBalanceSaturatedExposure {
  family: GoalFamily
  count: number
  reason: string
  reasonCode: GoalFamilyBalanceReasonCode
}

export interface GoalFamilyBalanceCorrection {
  dayNumber: number
  action: GoalFamilyBalanceAction
  family: GoalFamily
  fromExercise?: string
  toExercise?: string
  /**
   * [V2] DB-truth exercise id introduced into the program. Stamped only when
   * `action === 'replace'` and a real DB-truth candidate was applied. Carries
   * the canonical pool id (e.g. `pppu`, `pike_pushup`, `dragon_flag_neg`) so
   * downstream auditors can verify the swap originated from the same pool the
   * builder uses.
   */
  toExerciseId?: string
  reason: string
  reasonCode: GoalFamilyBalanceReasonCode
}

/**
 * [V2] A typed DB-truth candidate pulled from `getAllExercises()`. All fields
 * are echoes of canonical pool data — the guard NEVER fabricates names or
 * ids. `source` is fixed to `'exercise_pool'` for v2; future iterations may
 * extend with `'exercise_selector' | 'classification_registry'` if richer
 * sources are wired.
 */
export interface GoalFamilySwapCandidate {
  exerciseId: string
  exerciseName: string
  family: GoalFamily
  reason: string
  source: 'exercise_pool' | 'exercise_selector' | 'classification_registry'
}

/**
 * [V2] The outcome of a single replacement attempt. Returned by the
 * resolver for diagnostics; the per-row audit lives on
 * `GoalFamilyBalanceCorrection`. `applied = true` IFF a row was actually
 * mutated; otherwise the resolver records `preserve_no_change` with a
 * stable typed reasonCode.
 */
export interface GoalFamilyReplacementResult {
  applied: boolean
  dayNumber: number
  family: GoalFamily
  fromExercise?: string
  toExercise?: string
  reason: string
  reasonCode: GoalFamilyBalanceReasonCode
}

/** Top-level audit. Stamped on `program.goalFamilyBalanceAudit`.
 *
 * Version history:
 *   - v1 = audit-only (every weak exposure -> preserve_no_change with
 *          `protected_db_truth_pool_unavailable`).
 *   - v2 = real correction layer. The guard may apply at least one
 *          `replace` action when (a) a selected goal is underexposed,
 *          (b) a DB-truth candidate exists in `getAllExercises()`, and
 *          (c) a safe accessory tail slot exists in a non-completed,
 *          non-grouped, non-cluster session.
 *
 * Older programs (saved under v1) still pass the strict version check
 * because the field is optional on `AdaptiveProgram` and consumers
 * already null-guard. Programs generated under v2 carry `version: 'v2'`.
 */
export interface GoalFamilyBalanceAudit {
  version: 'goal-family-balance-v1' | 'goal-family-balance-v2'
  /** Skills that drove the audit (echo of `program.selectedSkills`). */
  selectedSkills: string[]
  /** Per-family weekly tissue-load counts (working-set rows only —
   *  warmups and cooldowns are NOT counted toward training stress). */
  weeklyCounts: Record<GoalFamily, number>
  /** Selected goals whose tissue family is missing or only carryover. */
  weakExposures: GoalFamilyBalanceWeakExposure[]
  /** Tissue families saturated across the week. */
  saturatedExposures: GoalFamilyBalanceSaturatedExposure[]
  /** Evaluated correction opportunities. Includes preserve_no_change
   *  rows so the audit is honest about what was protected and why. */
  correctionsApplied: GoalFamilyBalanceCorrection[]
  /** Free-text protected reasons that did not map to a single
   *  correction row (e.g. whole-week protection by recovery). */
  protectedNoChangeReasons: string[]
  /** ONE compact, non-cluttered line for the Program card / summary.
   *  Null when the audit found nothing materially useful to surface. */
  visibleSummary: string | null
  /** Diagnostic counters. */
  proof: {
    sessionsAudited: number
    workingExercisesClassified: number
    classifiedFromRegistry: number
    classifiedFromHeuristics: number
    completedSessionsSkipped: number
    /**
     * [V2] Number of `replace` actions actually applied in-place to the
     * program. 0 on v1 audits and on v2 audits where every weak exposure
     * was protected by tendon / saturation / no-slot / no-candidate gates.
     */
    replacementsApplied: number
    /**
     * [V2] Total number of DB-truth candidates considered across all
     * weak exposures (sum of pool searches). Useful for auditing whether
     * the pool is too narrow for the current goal mix.
     */
    candidatesConsidered: number
  }
  /** Stable reason codes rolled up across the audit. */
  reasonCodes: GoalFamilyBalanceReasonCode[]
}

/** Options for the guard. All bounds are conservative defaults. */
export interface GoalFamilyBalanceOptions {
  /** Day numbers (1-based) the guard must NEVER touch. Mirrors Phase P. */
  completedDayNumbers?: number[]
  /** Weekly minimum direct exposures required for a SELECTED push goal
   *  (planche / HSPU) before we consider the goal "covered". */
  minDirectPushExposurePerSelectedGoal?: number
  /** Weekly minimum direct exposures required for a SELECTED core goal
   *  (dragon flag) before we consider it "covered". */
  minDirectCoreExposurePerSelectedGoal?: number
  /** Weekly threshold above which combined biceps/elbow tendon stress
   *  is considered saturated. */
  bicepsElbowTendonSaturationThreshold?: number
  /** Optional injected ISO clock — kept for forward compatibility. */
  nowIso?: string
}

// =============================================================================
// PUBLIC CONSTANTS — exposed for tests / docs
// =============================================================================

export const GOAL_FAMILY_BALANCE_BOUNDS = Object.freeze({
  /** Default minimum direct push exposures for a selected push goal. */
  DEFAULT_MIN_DIRECT_PUSH: 1,
  /** Default minimum direct core exposures for a selected core goal. */
  DEFAULT_MIN_DIRECT_CORE: 1,
  /** Default saturation threshold for combined biceps / elbow tendon load. */
  DEFAULT_BICEPS_ELBOW_TENDON_SATURATION: 5,
  /** Pull-family saturation threshold (sum of all pull families). */
  DEFAULT_PULL_FAMILY_SATURATION: 8,
  /** Straight-arm volume saturation threshold (sum of straight_arm_pull
   *  + straight_arm_push). */
  DEFAULT_STRAIGHT_ARM_SATURATION: 5,
} as const)

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

const lower = (s: string | null | undefined): string =>
  typeof s === 'string' ? s.toLowerCase() : ''

const ALL_GOAL_FAMILIES: readonly GoalFamily[] = [
  'pull_vertical',
  'pull_horizontal',
  'straight_arm_pull',
  'transition_pull',
  'biceps_elbow_tendon',
  'push_vertical',
  'push_horizontal',
  'straight_arm_push',
  'dip_pattern',
  'compression_core',
  'mobility_integrity',
]

function emptyCounts(): Record<GoalFamily, number> {
  const counts = {} as Record<GoalFamily, number>
  for (const f of ALL_GOAL_FAMILIES) counts[f] = 0
  return counts
}

/**
 * Classify a single exercise into 0..N goal families, deterministically.
 *
 * Strategy (in priority order):
 *   1. Look the exercise up in `EXERCISE_CLASSIFICATIONS` by id (typed).
 *      If found, map its primary + secondary movement families and any
 *      tendon-relevant joint stress markers to goal families.
 *   2. Otherwise fall back to a doctrine-true name + category keyword
 *      classifier. Conservative — returns `[]` when uncertain.
 *
 * Returns a `{ families, source }` pair where `source` discloses how the
 * classification was reached. We never invent attribution.
 */
function classifyExerciseFamilies(
  exercise: AdaptiveExercise,
): { families: GoalFamily[]; source: 'registry' | 'heuristic' | 'unknown' } {
  if (!exercise) return { families: [], source: 'unknown' }

  const name = lower(exercise.name)
  const category = lower(exercise.category)

  // ---- 1. typed registry lookup ----
  const classification: ExerciseClassification | null =
    typeof exercise.id === 'string' && exercise.id in EXERCISE_CLASSIFICATIONS
      ? getExerciseClassification(exercise.id)
      : null

  if (classification) {
    const families: GoalFamily[] = []
    const movementFamilies = [
      classification.primaryFamily,
      ...(classification.secondaryFamilies ?? []),
    ]
    for (const mf of movementFamilies) {
      switch (mf) {
        case 'vertical_pull':
          families.push('pull_vertical')
          break
        case 'horizontal_pull':
          families.push('pull_horizontal')
          break
        case 'straight_arm_pull':
          families.push('straight_arm_pull')
          // Straight-arm pull always loads the biceps long-head tendon.
          families.push('biceps_elbow_tendon')
          break
        case 'vertical_push':
          families.push('push_vertical')
          break
        case 'horizontal_push':
          families.push('push_horizontal')
          break
        case 'straight_arm_push':
          families.push('straight_arm_push')
          break
        case 'dip_pattern':
          families.push('dip_pattern')
          break
        case 'compression_core':
          families.push('compression_core')
          break
        case 'explosive_pull':
          families.push('transition_pull')
          break
        case 'transition':
          families.push('transition_pull')
          break
        case 'joint_integrity':
          families.push('mobility_integrity')
          break
        case 'mobility':
          families.push('mobility_integrity')
          break
        case 'scapular_control':
          families.push('mobility_integrity')
          break
        case 'arm_isolation':
          // Curls / chin-curls / biceps-isolation rows DO contribute to
          // biceps tendon load. Tricep work does not — we filter by name
          // below.
          if (name.includes('curl') || name.includes('chin') || name.includes('bicep')) {
            families.push('biceps_elbow_tendon')
          }
          break
        default:
          // Other registry families (squat / hinge / anti-extension /
          // rotational / etc.) do not map to any of our goal families.
          break
      }
    }
    // Detect biceps/elbow tendon load from registered joint-stress profile
    // (front lever, back lever, planche straight-arm) when the registry
    // marks it.
    const stressProfile = classification.jointStressProfile
    if (stressProfile) {
      const stressors = [
        ...(stressProfile.primaryStressors ?? []),
        ...(stressProfile.secondaryStressors ?? []),
      ]
      const hasBicepsTendon = stressors.some(
        (s) =>
          (s.region === 'biceps_tendon' || s.region === 'elbow') &&
          (s.level === 'high' || s.level === 'very_high' || s.level === 'moderate'),
      )
      if (hasBicepsTendon && !families.includes('biceps_elbow_tendon')) {
        families.push('biceps_elbow_tendon')
      }
    }
    if (families.length > 0) {
      // De-dupe deterministically.
      return { families: dedupeFamilies(families), source: 'registry' }
    }
    // Registry knew the exercise but it mapped to no goal family — fall
    // through to the heuristic so we can still attempt to classify by name.
  }

  // ---- 2. doctrine-true name + category heuristic ----
  if (!name && !category) return { families: [], source: 'unknown' }
  const heuristic: GoalFamily[] = []

  // Vertical pull
  if (
    name.includes('pull-up') ||
    name.includes('pull up') ||
    name.includes('pullup') ||
    name.includes('chin-up') ||
    name.includes('chin up') ||
    name.includes('chinup') ||
    name.includes('lat pulldown')
  ) {
    heuristic.push('pull_vertical')
    if (name.includes('chin') || name.includes('curl')) {
      heuristic.push('biceps_elbow_tendon')
    }
  }
  // Archer pull-up — vertical pull + biceps/elbow tendon load
  if (name.includes('archer') && (name.includes('pull') || name.includes('chin'))) {
    heuristic.push('pull_vertical')
    heuristic.push('biceps_elbow_tendon')
  }
  // Horizontal pull
  if (
    name.includes('row') &&
    !name.includes('rowing') /* exclude cardio rowing */
  ) {
    heuristic.push('pull_horizontal')
  }
  if (name.includes('inverted row') || name.includes('australian')) {
    heuristic.push('pull_horizontal')
  }
  // Straight-arm pull / lever holds
  if (
    name.includes('front lever') ||
    name.includes('front_lever') ||
    name.includes('back lever') ||
    name.includes('back_lever') ||
    name.includes('skin the cat') ||
    name.includes('german hang') ||
    name.includes('ice cream maker')
  ) {
    heuristic.push('straight_arm_pull')
    heuristic.push('biceps_elbow_tendon')
  }
  // Transition pull
  if (
    name.includes('muscle-up') ||
    name.includes('muscle up') ||
    name.includes('muscleup') ||
    name.includes('explosive pull') ||
    name.includes('high pull')
  ) {
    heuristic.push('transition_pull')
    heuristic.push('biceps_elbow_tendon')
  }
  // Vertical push
  if (
    name.includes('pike push') ||
    name.includes('pike pushup') ||
    name.includes('hspu') ||
    name.includes('handstand push') ||
    name.includes('overhead press') ||
    name.includes('shoulder press') ||
    name.includes('wall walk')
  ) {
    heuristic.push('push_vertical')
  }
  // Horizontal push
  if (
    (name.includes('push-up') || name.includes('push up') || name.includes('pushup')) &&
    !name.includes('pike') &&
    !name.includes('handstand')
  ) {
    heuristic.push('push_horizontal')
  }
  if (name.includes('bench press') || name.includes('floor press')) {
    heuristic.push('push_horizontal')
  }
  // Straight-arm push (planche / pseudo planche / lean / maltese)
  if (
    name.includes('planche') ||
    name.includes('maltese') ||
    name.includes('pseudo planche') ||
    name.includes('pseudo-planche')
  ) {
    heuristic.push('straight_arm_push')
    // Planche push-up variants also hit horizontal_push dynamically.
    if (name.includes('push')) heuristic.push('push_horizontal')
  }
  // Dip pattern
  if (name.includes('dip') && !name.includes('hip dip')) {
    heuristic.push('dip_pattern')
  }
  // Compression core / dragon flag
  if (
    name.includes('l-sit') ||
    name.includes('l sit') ||
    name.includes('lsit') ||
    name.includes('v-sit') ||
    name.includes('v sit') ||
    name.includes('manna') ||
    name.includes('compression') ||
    name.includes('leg raise') ||
    name.includes('toes-to-bar') ||
    name.includes('toes to bar')
  ) {
    heuristic.push('compression_core')
  }
  if (name.includes('dragon flag') || name.includes('dragon-flag')) {
    heuristic.push('compression_core')
  }
  // Mobility / integrity
  if (
    name.includes('mobility') ||
    name.includes('stretch') ||
    name.includes('prehab') ||
    name.includes('cuban press') ||
    name.includes('face pull') ||
    name.includes('band pull-apart') ||
    name.includes('scap pull') ||
    name.includes('scapular') ||
    category.includes('mobility') ||
    category.includes('joint_integrity')
  ) {
    heuristic.push('mobility_integrity')
  }
  // Biceps / elbow tendon load from name (curls, chin-overs, etc.)
  if (name.includes('curl') && !name.includes('leg curl')) {
    heuristic.push('biceps_elbow_tendon')
  }

  if (heuristic.length === 0) return { families: [], source: 'unknown' }
  return { families: dedupeFamilies(heuristic), source: 'heuristic' }
}

function dedupeFamilies(input: GoalFamily[]): GoalFamily[] {
  const seen = new Set<GoalFamily>()
  const out: GoalFamily[] = []
  for (const f of input) {
    if (!seen.has(f)) {
      seen.add(f)
      out.push(f)
    }
  }
  return out
}

/**
 * Determine whether an exercise row is "working" (counts toward weekly
 * tissue stress) or "support" (warmup / cooldown / mobility-only). Working
 * counts come from `session.exercises[]`; warmups + cooldowns are excluded
 * by the caller, so this helper only filters out rows the registry marks
 * as activation / mobility-only.
 */
function isWorkingExercise(exercise: AdaptiveExercise): boolean {
  if (!exercise) return false
  if (exercise.isSkipped) return false
  const c = lower(exercise.category)
  if (c.includes('warmup') || c.includes('warm_up') || c.includes('warm up')) return false
  if (c.includes('cooldown') || c.includes('cool_down') || c.includes('cool down')) return false
  return true
}

/**
 * Whether a row sits inside a grouped method (superset / circuit /
 * density / cluster) — those slots are doctrine-bound and Phase L/P/this
 * guard never recommend swapping them.
 */
function isGroupedOrClusterRow(exercise: AdaptiveExercise): boolean {
  if (!exercise) return false
  if (typeof exercise.blockId === 'string' && exercise.blockId.length > 0) return true
  if (exercise.setExecutionMethod === 'cluster') return true
  return false
}

/**
 * Map a selected skill to the goal family the skill primarily requires.
 * Conservative — returns null when no doctrine mapping is known.
 */
function selectedSkillToRequiredFamily(
  selectedSkill: string,
): { family: GoalFamily; reasonCode: GoalFamilyBalanceReasonCode } | null {
  const k = lower(selectedSkill)
  if (!k) return null
  if (k === 'planche' || k.includes('planche')) {
    return {
      family: 'straight_arm_push',
      reasonCode: 'recommend_dynamic_push_for_planche',
    }
  }
  if (k === 'hspu' || k === 'handstand_pushup' || k.includes('handstand push')) {
    return {
      family: 'push_vertical',
      reasonCode: 'recommend_vertical_press_for_hspu',
    }
  }
  if (k === 'dragon_flag' || k.includes('dragon flag') || k.includes('dragon_flag')) {
    return {
      family: 'compression_core',
      reasonCode: 'recommend_compression_core_for_dragon_flag',
    }
  }
  if (k === 'muscle_up' || k.includes('muscle up') || k.includes('muscle-up') || k.includes('muscleup')) {
    return {
      family: 'transition_pull',
      reasonCode: 'recommend_explosive_pull_for_muscle_up',
    }
  }
  if (k === 'front_lever' || k.includes('front lever') || k === 'back_lever' || k.includes('back lever')) {
    return {
      family: 'straight_arm_pull',
      reasonCode: 'recommend_horizontal_pull_for_lever',
    }
  }
  if (k === 'archer_pull_up' || k.includes('archer')) {
    return {
      family: 'pull_vertical',
      reasonCode: 'recommend_horizontal_pull_for_lever',
    }
  }
  return null
}

// =============================================================================
// [V2] DB-TRUTH CANDIDATE PICKER + SAFE REPLACEMENT SLOT RESOLVER
// =============================================================================

/**
 * [V2] Per-family preferred candidate id list, ordered easiest -> hardest
 * within the same family. Names are NOT invented — every entry must exist
 * in `getAllExercises()` (the canonical pool used by the rest of the
 * builder). The picker walks this list, returning the FIRST candidate
 * whose id resolves in the pool, so the list also doubles as a fallback
 * chain when individual ids are renamed/removed in the pool.
 *
 * The lists are intentionally short and conservative. They cover only the
 * families the prompt names as actionable: planche / HSPU / dragon flag /
 * mobility-integrity. Other families (vertical pull / horizontal pull /
 * transition pull / etc.) are not auto-corrected — they are typically
 * already covered when their selected goal is present, and replacing a
 * tail row with more pull volume would risk worsening tendon saturation.
 */
const FAMILY_PREFERRED_CANDIDATE_IDS: Partial<Record<GoalFamily, string[]>> = {
  // straight-arm push / planche dynamic progression
  // [AB17.2.1] Removed elevated_pppu — it's deprecated and should never be selected
  straight_arm_push: [
    'pppu',          // pseudo planche push-up (only valid planche dynamic press)
  ],
  // horizontal push when planche is selected but no dynamic push exists
  // [AB17.2.1] Removed elevated_pppu — it's deprecated
  push_horizontal: [
    'pppu',
  ],
  // vertical push / HSPU progression
  push_vertical: [
    'pike_pushup_elevated', // strongest direct progression that still scales
    'pike_pushup',
    'wall_hspu_negative',
    'wall_hspu_partial',
    'wall_hspu_full',
    'wall_hspu',
  ],
  // compression core / dragon flag progression
  compression_core: [
    'dragon_flag_neg',
    'dragon_flag_assisted',
    'dragon_flag_tuck',
    'hanging_leg_raise',
    'hanging_knee_raise',
    'hollow_body_rock',
    'hollow_body',
    'compression_work',
  ],
  // mobility / integrity rebalance under high tendon saturation
  mobility_integrity: [
    'face_pull',
    'band_pull_apart',
    'scap_pull_up',
    'scap_pushup',
    'scapular_retraction_hold',
  ],
}

/**
 * [V2] Resolve a single DB-truth candidate for a weak goal family.
 *
 * Strategy:
 *   1. Walk the per-family preferred id list in order.
 *   2. For each id, look it up in `getAllExercises()` (canonical pool).
 *   3. Return the first id that resolves to a real `Exercise`.
 *   4. If none resolve, return null (caller records
 *      `protected_db_truth_pool_unavailable`).
 *
 * Returns `{ candidate, poolExercise, considered }` so callers can record
 * how many candidates were examined.
 */
function pickDbTruthCandidateForFamily(
  family: GoalFamily,
):
  | { candidate: GoalFamilySwapCandidate; poolExercise: PoolExercise; considered: number }
  | { candidate: null; poolExercise: null; considered: number } {
  const ids = FAMILY_PREFERRED_CANDIDATE_IDS[family]
  if (!ids || ids.length === 0) {
    return { candidate: null, poolExercise: null, considered: 0 }
  }
  const all = getAllExercises()
  const byId: Map<string, PoolExercise> = new Map(all.map((e) => [e.id, e]))
  let considered = 0
  for (const id of ids) {
    considered += 1
    const ex = byId.get(id)
    if (!ex) continue
    return {
      candidate: {
        exerciseId: ex.id,
        exerciseName: ex.name,
        family,
        reason: `DB-truth pool match for ${humanizeFamily(family)} (${ex.name}).`,
        source: 'exercise_pool',
      },
      poolExercise: ex,
      considered,
    }
  }
  return { candidate: null, poolExercise: null, considered }
}

/**
 * [V2] Walk a session's exercises looking for a low-priority accessory tail
 * row that is safe to replace. ALL of the following must be true:
 *
 *   - day is NOT completed
 *   - row is NOT in a grouped block (no `blockId`)
 *   - row is NOT a cluster set (`setExecutionMethod !== 'cluster'`)
 *   - row is NOT the primary skill of the day (NOT the first working slot,
 *     and NOT a `category === 'skill'` row)
 *   - row sits in the LAST 2 working slots of the session (the "accessory
 *     tail")
 *   - row is NOT the only direct exposure for ANOTHER selected goal family
 *     (we never strip a selected-goal-required family in order to insert
 *     a different one)
 *
 * Returns null when no safe slot exists. The caller records
 * `protected_no_low_priority_swap_target` in that case.
 */
function findReplaceableSlot(
  session: AdaptiveSession,
  perDay: {
    dayNumber: number
    completed: boolean
    counts: Record<GoalFamily, number>
    classifiedRows: Array<{
      exerciseName: string
      families: GoalFamily[]
      grouped: boolean
    }>
  },
  weakFamily: GoalFamily,
  protectedFamilies: ReadonlySet<GoalFamily>,
): { rowIndex: number; row: AdaptiveExercise } | null {
  if (perDay.completed) return null
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  if (exercises.length === 0) return null

  // Build the list of working-row indices in original order. Warmups and
  // cooldowns are excluded so the "tail" reflects training stress order,
  // not file order.
  const workingIndices: number[] = []
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    if (ex && isWorkingExercise(ex)) workingIndices.push(i)
  }
  if (workingIndices.length < 2) return null // no tail to replace

  // Walk the last 2 working rows from the back forward.
  const tailWindow = workingIndices.slice(-2)
  for (let t = tailWindow.length - 1; t >= 0; t--) {
    const idx = tailWindow[t]
    const ex = exercises[idx]
    if (!ex) continue
    // Never replace the first working row (primary work).
    if (idx === workingIndices[0]) continue
    // Never replace a skill row.
    if (lower(ex.category) === 'skill') continue
    // Never touch grouped/cluster rows.
    if (isGroupedOrClusterRow(ex)) continue
    // Never replace a row that is the only direct exposure for a
    // different selected-goal family.
    const exFamilies = classifyExerciseFamilies(ex).families
    let blocksProtected = false
    for (const f of exFamilies) {
      if (f === weakFamily) continue // overlap with target — fine to swap
      if (protectedFamilies.has(f) && perDay.counts[f] <= 1) {
        // This row is the only exposure for a protected family this day.
        // Skip it — we cannot rob Peter to pay Paul.
        blocksProtected = true
        break
      }
    }
    if (blocksProtected) continue
    return { rowIndex: idx, row: ex }
  }
  return null
}

/**
 * [V2] Build a typed `AdaptiveExercise` from a DB-truth `PoolExercise`,
 * preserving every required AdaptiveExercise field. Optional fields
 * (`method`, `blockId`, `setExecutionMethod`, `prescribedLoad`,
 * `executionTruth`, `coachingMeta`, `progressionDecision`, `targetRPE`,
 * `restSeconds`) are intentionally OMITTED — the live workout runner
 * already null-guards each of them, and producing them here would
 * require running Phase L/M/O/P heuristics again, which is out of scope
 * for a bounded correction layer.
 *
 * `source: 'database'` is stamped so the AB10 live-runtime DB-truth
 * parity check (`source === 'database'`) treats the row identically to
 * a builder-emitted row.
 */
function buildAdaptiveExerciseFromPool(
  pool: PoolExercise,
  family: GoalFamily,
  reasonCode: GoalFamilyBalanceReasonCode,
): AdaptiveExercise {
  return {
    id: pool.id,
    name: pool.name,
    category: pool.category,
    sets: typeof pool.defaultSets === 'number' ? pool.defaultSets : 3,
    repsOrTime: typeof pool.defaultRepsOrTime === 'string' ? pool.defaultRepsOrTime : '8-10',
    note: typeof pool.notes === 'string' && pool.notes.length > 0 ? pool.notes : undefined,
    isOverrideable: true,
    selectionReason: `goal_family_balance_guard:${family}:${reasonCode}`,
    source: 'database',
  }
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

/**
 * Run the Goal-Family Balance + Tissue-Load Saturation Guard on a
 * finalized program (post-Phase-P). Returns the same program reference
 * with `goalFamilyBalanceAudit` stamped on it, plus a structured audit
 * result. V2 may apply at most one bounded `replace` per weak exposure,
 * mutating only low-priority accessory tail rows in non-completed,
 * non-grouped, non-cluster sessions. Failure must be absorbed by the
 * caller; this function never throws on its own happy path but defensive
 * input is checked.
 */
export function runGoalFamilyBalanceGuard<T extends AdaptiveProgram>(
  program: T,
  options: GoalFamilyBalanceOptions = {},
): { program: T; audit: GoalFamilyBalanceAudit } {
  const minDirectPush = Math.max(
    1,
    options.minDirectPushExposurePerSelectedGoal ??
      GOAL_FAMILY_BALANCE_BOUNDS.DEFAULT_MIN_DIRECT_PUSH,
  )
  const minDirectCore = Math.max(
    1,
    options.minDirectCoreExposurePerSelectedGoal ??
      GOAL_FAMILY_BALANCE_BOUNDS.DEFAULT_MIN_DIRECT_CORE,
  )
  const bicepsElbowTendonSaturation = Math.max(
    1,
    options.bicepsElbowTendonSaturationThreshold ??
      GOAL_FAMILY_BALANCE_BOUNDS.DEFAULT_BICEPS_ELBOW_TENDON_SATURATION,
  )
  const completedSet = new Set<number>(
    Array.isArray(options.completedDayNumbers) ? options.completedDayNumbers : [],
  )

  const audit: GoalFamilyBalanceAudit = {
    // [V2] DB-truth swap pool consulted -> bump version stamp.
    version: 'goal-family-balance-v2',
    selectedSkills: [],
    weeklyCounts: emptyCounts(),
    weakExposures: [],
    saturatedExposures: [],
    correctionsApplied: [],
    protectedNoChangeReasons: [],
    visibleSummary: null,
    proof: {
      sessionsAudited: 0,
      workingExercisesClassified: 0,
      classifiedFromRegistry: 0,
      classifiedFromHeuristics: 0,
      completedSessionsSkipped: 0,
      replacementsApplied: 0,
      candidatesConsidered: 0,
    },
    reasonCodes: [],
  }

  if (!program || !Array.isArray(program.sessions) || program.sessions.length === 0) {
    return {
      program,
      audit,
    }
  }

  // ---- selected skills (echoed onto the audit) ----
  const selectedSkills: string[] = Array.isArray(program.selectedSkills)
    ? program.selectedSkills.filter((s): s is string => typeof s === 'string' && s.length > 0)
    : []
  audit.selectedSkills = [...selectedSkills]

  // ---- per-session classification + weekly counts ----
  // We track perDay matrices so the verdict stage can attribute weak
  // exposure to specific days when needed.
  const perDayCounts: Array<{
    dayNumber: number
    completed: boolean
    counts: Record<GoalFamily, number>
    classifiedRows: Array<{
      exerciseName: string
      families: GoalFamily[]
      grouped: boolean
    }>
  }> = []

  for (let i = 0; i < program.sessions.length; i++) {
    const session: AdaptiveSession | undefined = program.sessions[i]
    if (!session) continue
    audit.proof.sessionsAudited += 1

    const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : i + 1
    const completed = completedSet.has(dayNumber)
    if (completed) {
      audit.proof.completedSessionsSkipped += 1
    }

    const dayCounts = emptyCounts()
    const classifiedRows: Array<{
      exerciseName: string
      families: GoalFamily[]
      grouped: boolean
    }> = []

    const exercises = Array.isArray(session.exercises) ? session.exercises : []
    for (const ex of exercises) {
      if (!ex || !isWorkingExercise(ex)) continue
      const { families, source } = classifyExerciseFamilies(ex)
      if (families.length === 0) continue
      audit.proof.workingExercisesClassified += 1
      if (source === 'registry') audit.proof.classifiedFromRegistry += 1
      if (source === 'heuristic') audit.proof.classifiedFromHeuristics += 1
      for (const f of families) {
        dayCounts[f] += 1
        if (!completed) audit.weeklyCounts[f] += 1
      }
      classifiedRows.push({
        exerciseName: typeof ex.name === 'string' ? ex.name : '(unnamed)',
        families,
        grouped: isGroupedOrClusterRow(ex),
      })
    }

    perDayCounts.push({ dayNumber, completed, counts: dayCounts, classifiedRows })
  }

  // ---- weak exposure detection (per selected skill) ----
  for (const skill of selectedSkills) {
    const required = selectedSkillToRequiredFamily(skill)
    if (!required) continue
    const familyCount = audit.weeklyCounts[required.family] ?? 0
    const minRequired = required.family === 'compression_core' ? minDirectCore : minDirectPush
    if (familyCount >= minRequired) continue

    // Check whether the family is at least represented as
    // carryover/static-only (e.g. a planche LEAN counts under
    // straight_arm_push but not under push_horizontal — so a planche
    // selection with only static exposure is still flagged when
    // dynamic push_horizontal coverage is also low).
    let reason: string
    let reasonCode: GoalFamilyBalanceReasonCode
    if (familyCount === 0) {
      reason = `Selected ${humanizeSkill(skill)} requires ${humanizeFamily(required.family)} exposure but none was found this week.`
      reasonCode = 'selected_goal_family_under_exposed'
    } else {
      reason = `Selected ${humanizeSkill(skill)} has only ${familyCount} ${humanizeFamily(required.family)} exposure(s) this week.`
      reasonCode = 'selected_goal_family_static_only'
    }
    audit.weakExposures.push({
      family: required.family,
      selectedSkill: skill,
      reason,
      reasonCode,
    })
    if (!audit.reasonCodes.includes(reasonCode)) audit.reasonCodes.push(reasonCode)
  }

  // ---- saturation detection ----
  const pullSum =
    audit.weeklyCounts.pull_vertical +
    audit.weeklyCounts.pull_horizontal +
    audit.weeklyCounts.straight_arm_pull +
    audit.weeklyCounts.transition_pull
  const straightArmSum =
    audit.weeklyCounts.straight_arm_pull + audit.weeklyCounts.straight_arm_push
  const bicepsElbowSum = audit.weeklyCounts.biceps_elbow_tendon

  if (pullSum >= GOAL_FAMILY_BALANCE_BOUNDS.DEFAULT_PULL_FAMILY_SATURATION) {
    const code: GoalFamilyBalanceReasonCode = 'pull_family_saturated'
    audit.saturatedExposures.push({
      family: 'pull_vertical',
      count: pullSum,
      reason: `Combined pull-family load is high (${pullSum} working exposures across pull patterns this week).`,
      reasonCode: code,
    })
    if (!audit.reasonCodes.includes(code)) audit.reasonCodes.push(code)
  }
  if (straightArmSum >= GOAL_FAMILY_BALANCE_BOUNDS.DEFAULT_STRAIGHT_ARM_SATURATION) {
    const code: GoalFamilyBalanceReasonCode = 'straight_arm_volume_saturated'
    audit.saturatedExposures.push({
      family: 'straight_arm_pull',
      count: straightArmSum,
      reason: `Combined straight-arm load is high (${straightArmSum} working exposures across pull and push lever patterns).`,
      reasonCode: code,
    })
    if (!audit.reasonCodes.includes(code)) audit.reasonCodes.push(code)
  }
  if (bicepsElbowSum >= bicepsElbowTendonSaturation) {
    const code: GoalFamilyBalanceReasonCode = 'biceps_elbow_tendon_saturated'
    audit.saturatedExposures.push({
      family: 'biceps_elbow_tendon',
      count: bicepsElbowSum,
      reason: `Biceps / elbow tendon stress is high (${bicepsElbowSum} contributing rows this week from levers, transitions, and pulling).`,
      reasonCode: code,
    })
    if (!audit.reasonCodes.includes(code)) audit.reasonCodes.push(code)
  }

  // ---- [V2] correction evaluation with REAL DB-truth swaps ----
  //
  // For each weak exposure, the resolver walks the typed bridge:
  //
  //     weak exposure
  //       -> tendon-overload gate (preserve_no_change | continue)
  //       -> DB-truth candidate picker (canonical pool)
  //          -> protected_db_truth_pool_unavailable on miss
  //       -> safe replacement slot finder (non-completed,
  //          non-grouped, non-cluster, non-primary, non-skill,
  //          non-only-exposure-for-protected-family)
  //          -> protected_no_low_priority_swap_target on miss
  //       -> in-place AdaptiveExercise replacement (sets / repsOrTime
  //          inherited from PoolExercise.defaultSets / defaultRepsOrTime;
  //          source = 'database'; isOverrideable = true)
  //       -> increment perDay counts so subsequent weak exposures
  //          are evaluated against the corrected state
  //
  // Bounded to AT MOST one replace action per weak exposure. Programs
  // with N weak exposures get up to N corrections, never more.

  // Build the set of families that ARE protected against being stripped
  // (i.e., the families required by other selected goals). When walking
  // the tail looking for a swap target, we never replace a row that is
  // the only exposure for a protected family on that day.
  const protectedFamilies: Set<GoalFamily> = new Set<GoalFamily>()
  for (const skill of selectedSkills) {
    const required = selectedSkillToRequiredFamily(skill)
    if (required) protectedFamilies.add(required.family)
  }

  for (const weak of audit.weakExposures) {
    // ---- 1. Tendon-overload protection (unchanged from v1) ----
    const tendonRiskCode: GoalFamilyBalanceReasonCode = 'protected_tendon_overload_risk'
    if (
      bicepsElbowSum >= bicepsElbowTendonSaturation &&
      (weak.family === 'straight_arm_push' || weak.family === 'straight_arm_pull')
    ) {
      audit.correctionsApplied.push({
        dayNumber: 0,
        action: 'preserve_no_change',
        family: weak.family,
        reason: `Skipped adding ${humanizeFamily(weak.family)}: biceps/elbow tendon load is already saturated this week.`,
        reasonCode: tendonRiskCode,
      })
      if (!audit.reasonCodes.includes(tendonRiskCode)) {
        audit.reasonCodes.push(tendonRiskCode)
      }
      continue
    }

    // ---- 2. DB-truth candidate picker ----
    const picked = pickDbTruthCandidateForFamily(weak.family)
    audit.proof.candidatesConsidered += picked.considered
    if (!picked.candidate || !picked.poolExercise) {
      audit.correctionsApplied.push({
        dayNumber: 0,
        action: 'preserve_no_change',
        family: weak.family,
        reason: `No DB-truth candidate available for ${humanizeFamily(weak.family)} in the canonical exercise pool.`,
        reasonCode: 'protected_db_truth_pool_unavailable',
      })
      if (!audit.reasonCodes.includes('protected_db_truth_pool_unavailable')) {
        audit.reasonCodes.push('protected_db_truth_pool_unavailable')
      }
      continue
    }

    // ---- 3. Safe replacement slot finder ----
    // Find the first non-completed, non-grouped, non-cluster session
    // whose accessory tail has a swappable row. We attempt sessions in
    // perDay order so day 1 swaps land before day 5 swaps when both
    // are eligible (gives the user the corrected work earlier).
    let appliedThisExposure = false
    for (let i = 0; i < perDayCounts.length; i++) {
      const perDay = perDayCounts[i]
      if (perDay.completed) continue
      if (completedSet.has(perDay.dayNumber)) continue
      // Already covered on this day -> no need to swap here.
      if (perDay.counts[weak.family] > 0) continue

      const session = program.sessions[i]
      if (!session) continue

      const slot = findReplaceableSlot(session, perDay, weak.family, protectedFamilies)
      if (!slot) continue

      // ---- 4. Build the replacement AdaptiveExercise from the pool ----
      // Map the weak family + selectedSkill back to a recommendation
      // reason code so the audit's reason chain is doctrine-true.
      const recommendCode: GoalFamilyBalanceReasonCode =
        weak.family === 'straight_arm_push' || weak.family === 'push_horizontal'
          ? 'recommend_dynamic_push_for_planche'
          : weak.family === 'push_vertical'
            ? 'recommend_vertical_press_for_hspu'
            : weak.family === 'compression_core'
              ? 'recommend_compression_core_for_dragon_flag'
              : weak.family === 'transition_pull'
                ? 'recommend_explosive_pull_for_muscle_up'
                : weak.family === 'mobility_integrity'
                  ? 'recommend_mobility_integrity_for_tendon_load'
                  : 'recommend_horizontal_pull_for_lever'

      const newRow = buildAdaptiveExerciseFromPool(picked.poolExercise, weak.family, recommendCode)

      // Capture identity before mutation (the array is mutated in place
      // so subsequent classifyExerciseFamilies(...) reads see the new
      // row, keeping perDay.counts honest for the next exposure).
      const fromName = typeof slot.row.name === 'string' ? slot.row.name : '(unnamed)'
      const fromId = typeof slot.row.id === 'string' ? slot.row.id : ''

      // ---- 5. In-place replacement on the live session ----
      const exercises = session.exercises
      if (!Array.isArray(exercises)) continue
      exercises[slot.rowIndex] = newRow

      // ---- 6. Update perDay counts so subsequent passes see the swap ----
      // Decrement old families on the day; increment new families.
      const oldFamilies = classifyExerciseFamilies(slot.row).families
      const newFamilies = classifyExerciseFamilies(newRow).families
      for (const f of oldFamilies) {
        perDay.counts[f] = Math.max(0, perDay.counts[f] - 1)
        audit.weeklyCounts[f] = Math.max(0, audit.weeklyCounts[f] - 1)
      }
      for (const f of newFamilies) {
        perDay.counts[f] = (perDay.counts[f] ?? 0) + 1
        audit.weeklyCounts[f] = (audit.weeklyCounts[f] ?? 0) + 1
      }
      // Refresh classifiedRows for diagnostic completeness.
      perDay.classifiedRows.push({
        exerciseName: newRow.name,
        families: newFamilies,
        grouped: false,
      })

      audit.correctionsApplied.push({
        dayNumber: perDay.dayNumber,
        action: 'replace',
        family: weak.family,
        fromExercise: fromName,
        toExercise: newRow.name,
        toExerciseId: newRow.id,
        reason: `Day ${perDay.dayNumber}: replaced low-priority accessory "${fromName}"${
          fromId ? ` (${fromId})` : ''
        } with DB-truth ${humanizeFamily(weak.family)} progression "${newRow.name}" for selected ${humanizeSkill(weak.selectedSkill)}.`,
        reasonCode: recommendCode,
      })
      if (!audit.reasonCodes.includes(recommendCode)) {
        audit.reasonCodes.push(recommendCode)
      }
      audit.proof.replacementsApplied += 1
      appliedThisExposure = true
      break
    }

    if (!appliedThisExposure) {
      // No safe slot found on any non-completed day.
      audit.correctionsApplied.push({
        dayNumber: 0,
        action: 'preserve_no_change',
        family: weak.family,
        reason: `No non-completed day with a safe low-priority accessory tail was eligible for ${humanizeFamily(weak.family)} insertion.`,
        reasonCode: 'protected_no_low_priority_swap_target',
      })
      if (!audit.reasonCodes.includes('protected_no_low_priority_swap_target')) {
        audit.reasonCodes.push('protected_no_low_priority_swap_target')
      }
    }
  }

  // If nothing weak was detected, record the "already balanced" reason
  // so consumers can verify the guard actually ran instead of silently
  // doing nothing.
  if (audit.weakExposures.length === 0 && audit.saturatedExposures.length === 0) {
    audit.protectedNoChangeReasons.push(
      'Selected goal mix already covered across push / pull / core families this week.',
    )
    if (!audit.reasonCodes.includes('protected_already_balanced')) {
      audit.reasonCodes.push('protected_already_balanced')
    }
  }

  // ---- visible summary (only when materially useful) ----
  audit.visibleSummary = computeVisibleSummary(audit)

  // ---- stamp on program (additive, JSON-safe) ----
  // Use a typed structural assignment instead of `as any` / `as unknown`
  // by widening to a typed local that carries the optional field.
  type ProgramWithGuard = T & { goalFamilyBalanceAudit?: GoalFamilyBalanceAudit }
  const stamped: ProgramWithGuard = program as ProgramWithGuard
  stamped.goalFamilyBalanceAudit = audit

  return { program: stamped, audit }
}

// =============================================================================
// CONSUMER HELPERS
// =============================================================================

/**
 * [V2] `findCandidateDayForFamily` (the v1 helper) is no longer used: v2
 * walks `perDayCounts` directly inside the correction loop and applies
 * `findReplaceableSlot` against the live `AdaptiveSession` so it can
 * actually mutate the row. Kept this comment as a marker so anyone
 * grepping the v1 name knows where the logic moved.
 */

/**
 * Compute the single visible summary line. Returns null when nothing is
 * worth surfacing, mirroring the user-facing rule:
 *   "Show only when it materially changed or protected the program."
 *
 * [V2] Priority order:
 *   1. ≥1 actual replacement applied -> "corrected" message (highest signal)
 *   2. Saturation crowding out weak push/core -> "protected" message
 *   3. Weak exposures with NO replacement -> "flagged; protected by ..."
 *   4. Saturation only, no weak -> "load is high"
 *   5. Already balanced -> null
 */
function computeVisibleSummary(audit: GoalFamilyBalanceAudit): string | null {
  const weak = audit.weakExposures
  const saturated = audit.saturatedExposures
  const replacementsApplied = audit.proof.replacementsApplied ?? 0
  const recovered = audit.protectedNoChangeReasons.length > 0 && weak.length === 0 && saturated.length === 0

  if (recovered) {
    // Don't surface a chip when nothing happened — keep the UI clean.
    return null
  }

  // ---- 1. [V2] real replacement applied ----
  if (replacementsApplied > 0) {
    return 'Balance Guard: corrected push/core exposure for selected goals.'
  }

  // ---- 2. saturation crowding out weak push/core ----
  const pullSaturated = saturated.some((s) => s.reasonCode === 'pull_family_saturated')
  const tendonSaturated = saturated.some((s) => s.reasonCode === 'biceps_elbow_tendon_saturated')
  const pushOrCoreWeak = weak.some(
    (w) =>
      w.family === 'push_vertical' ||
      w.family === 'push_horizontal' ||
      w.family === 'straight_arm_push' ||
      w.family === 'compression_core',
  )

  if (pullSaturated && pushOrCoreWeak) {
    return 'Balance Guard: push/core exposure protected against pull-family crowding.'
  }
  if (tendonSaturated && pushOrCoreWeak) {
    return 'Balance Guard: biceps/elbow tendon load saturated; push/core exposure flagged for next cycle.'
  }

  // ---- 3. [V2] meaningful protection without a swap ----
  // When a weak exposure existed but was held back by tendon / pool /
  // no-slot reasons, surface the honest "protected" sentence instead of
  // the bare "flagged" sentence v1 used.
  const protectedReasonHit = audit.correctionsApplied.some(
    (c) =>
      c.action === 'preserve_no_change' &&
      (c.reasonCode === 'protected_tendon_overload_risk' ||
        c.reasonCode === 'protected_db_truth_pool_unavailable' ||
        c.reasonCode === 'protected_no_low_priority_swap_target'),
  )
  if (weak.length > 0 && protectedReasonHit) {
    return 'Balance Guard: push/core exposure flagged; protected by recovery / tendon / session constraints.'
  }

  // ---- 4. weak exposures only, no protection (rare path) ----
  if (weak.length > 0) {
    const top = weak[0]
    return `Balance Guard: ${humanizeFamily(top.family)} exposure flagged for selected ${humanizeSkill(top.selectedSkill)}.`
  }

  // ---- 5. saturation only ----
  if (saturated.length > 0) {
    const top = saturated[0]
    return `Balance Guard: ${humanizeFamily(top.family)} load is high this week (${top.count} contributing rows).`
  }
  return null
}

function humanizeFamily(family: GoalFamily): string {
  switch (family) {
    case 'pull_vertical':
      return 'vertical pull'
    case 'pull_horizontal':
      return 'horizontal pull'
    case 'straight_arm_pull':
      return 'straight-arm pull'
    case 'transition_pull':
      return 'transition / explosive pull'
    case 'biceps_elbow_tendon':
      return 'biceps / elbow tendon'
    case 'push_vertical':
      return 'vertical push'
    case 'push_horizontal':
      return 'horizontal push'
    case 'straight_arm_push':
      return 'straight-arm push'
    case 'dip_pattern':
      return 'dip pattern'
    case 'compression_core':
      return 'compression core'
    case 'mobility_integrity':
      return 'mobility / integrity'
  }
}

function humanizeSkill(skill: string): string {
  if (!skill) return 'this goal'
  return skill.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}
