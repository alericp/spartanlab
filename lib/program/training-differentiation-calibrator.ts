/**
 * =============================================================================
 * [PHASE Y2 OF 3] TRAINING DIFFERENTIATION + DOCTRINE INFLUENCE CALIBRATION
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Phase Y1 proved which doctrine bundles loaded, fired, and mutated the
 * program. The honest finding from Y1 was: many bundles fire, but the final
 * weekly expression still reads flat — most rows land at RPE 7, density days
 * look like normal supersets with a green label, and high-overlap supersets
 * (e.g. Skin-the-Cat + Chest-to-Bar Pull-Up) survive without mitigation.
 *
 * Phase Y2 calibrates the EXISTING decision layers so doctrine produces more
 * visible, training-real differentiation across the 6-session week WITHOUT:
 *   - rewriting the generator,
 *   - changing the schema,
 *   - adding new dependencies,
 *   - touching the live workout reducer,
 *   - destabilising program rendering / Start / Resume / Full / 45 / 30.
 *
 * It runs ONCE, AFTER all builder mutations have settled (composition,
 * method materialization, prescription shaping, weekly stress governor) and
 * BEFORE the Phase Y1 doctrine execution matrix is built — so the matrix
 * naturally reflects Y2's calibrations.
 *
 * SCOPE — STRICTLY CALIBRATION, NEVER NEW PATHS
 * --------------------------------------------
 *  1. Role-aware RPE lift
 *       The role contract's `rpeCap` is consumed cap-only by the prescription
 *       shaper. That cap correctly LOWERS rows on skill / recovery / density
 *       days, but it never LIFTS rows on the heavier-relative day. Result:
 *       primary_strength_emphasis lands at the same RPE 7 as the support day.
 *       Y2 lifts a small, bounded subset of rows toward the role's intended
 *       FLOOR — only when safety, role, and exercise classification all agree
 *       it is appropriate — and stamps a per-row `rpeDecisionTrace`.
 *
 *  2. Density materialization
 *       The Y1 matrix flags density rows as DISPLAY_ONLY when no time cap,
 *       EMOM/AMRAP, or short rest is present. The builder labels density
 *       blocks with `instruction: "Complete prescribed work within the timed
 *       block"` but writes neither a literal time cap nor a tightened
 *       member rest. Y2 stamps a real time cap on the styledGroup
 *       instruction (e.g. "8-12 min density block, 30-45s between rounds")
 *       AND tightens member `restSeconds` to <= 60s so the matrix detects
 *       MATERIALIZED. When the week is protected (acclimation / first-week
 *       / recovery_constrained), Y2 honestly demotes the wording to
 *       "capacity superset" rather than fabricating density.
 *
 *  3. Pairing fatigue overlap mitigation
 *       The Y1 matrix detects HIGH-overlap supersets but produces a verdict,
 *       not a mutation. Y2 mitigates: it bumps `restSeconds` on both members
 *       to >= 120s, caps the higher-RPE member to 7, and rewrites the
 *       styledGroup instruction/restProtocol to "Rest-separated pair (high
 *       overlap)". Specifically handles Skin-the-Cat + C2B Pull-Up: if
 *       Skin-the-Cat sets > 2 OR maxRPE > 7 OR the day is pull-overloaded,
 *       Y2 demotes the pair to two `straight_*` styledGroups (clears
 *       blockId on both members) so the live runtime treats them as
 *       sequential straight sets.
 *
 *  4. Weekly method budget audit
 *       Walks every session and counts which methods are present
 *       (superset / circuit / density_block / cluster / set-execution).
 *       Compares against the role contract's per-day allowance. Stamps
 *       a `weeklyMethodBudgetCalibration` summary so the proof surface
 *       can explain whether a method was used, blocked, or simply not
 *       earned this week.
 *
 * NON-NEGOTIABLES OBEYED
 * ----------------------
 *   - pure TypeScript; no React, no hooks, no DB, no fetch
 *   - JSON-safe — survives DB save / API roundtrip
 *   - additive — every output is a new field on the program / session / row;
 *     no existing field semantics are changed
 *   - tendon-sensitive rows (planche, lever, skin-the-cat, cross, maltese,
 *     tuck FL, German hang) are NEVER lifted, NEVER mutated for density
 *   - skill-category rows are NEVER lifted, NEVER mutated for density
 *   - rows already owning a setExecutionMethod (cluster, top set, drop set,
 *     rest pause) are NEVER touched — their dosage is method-doctrine-owned
 *   - rows already in a non-straight blockId are only touched by the
 *     pairing-mitigation pass, never by the RPE-lift pass
 *   - protected weeks (week 1 / acclimation / recovery_constrained) get the
 *     conservative path: density honestly demotes, RPE lifts only when the
 *     base RPE is null (so the RPE remains within the role's softened cap),
 *     pairings still mitigate
 * =============================================================================
 */

import type { AdaptiveSession, AdaptiveExercise } from '../adaptive-program-builder'

// =============================================================================
// PUBLIC SHAPES
// =============================================================================

export type CalibrationVerdict =
  | 'CALIBRATED'
  | 'CALIBRATED_PARTIAL'
  | 'CALIBRATED_PROTECTED_WEEK'
  | 'NO_CALIBRATION_NEEDED'
  | 'SKIPPED_NO_INPUT'

export interface RpeDecisionTrace {
  /** Pre-Y2 RPE on the row (post-shape). May be null if the row had none. */
  originalRPE: number | null
  /** Post-Y2 RPE on the row. */
  finalRPE: number | null
  /** Allowed range the calibrator stayed within. */
  allowedBand: { min: number; max: number }
  /** Direction Y2 moved the RPE. `held` = no change. */
  raisedOrLowered: 'raised' | 'lowered' | 'held'
  /** Source of the cap that bounded the lift (role's rpeCap or protection). */
  capSource: string
  /** Role of the session this row belongs to. */
  sessionRole: string
  /** Coarse exercise risk class used by the calibrator's safety guards. */
  exerciseRiskClass: 'tendon_sensitive' | 'skill_neural' | 'bent_arm_compound' | 'accessory' | 'unknown'
  /** Coarse fatigue overlap with the rest of the day. Heuristic, not exact. */
  fatigueOverlap: 'low' | 'moderate' | 'high'
  /** Athlete-readable reason. */
  reason: string
  /** Confidence the calibrator has in this decision. */
  confidence: 'high' | 'moderate' | 'low'
}

export interface DensityDecisionTrace {
  /** True when Y2 made density a materialized training expression. */
  applied: boolean
  /** Type of density expression Y2 stamped. */
  densityType: 'timed_block' | 'short_rest_block' | 'capacity_superset' | 'none'
  /** Description of how rest was tightened (or 'unchanged'). */
  restChange: string
  /** Time cap stamped on the styledGroup instruction (e.g. "8-12 min"). */
  timeCap: string | null
  /** Names of exercises whose `restSeconds` Y2 tightened. */
  affectedExercises: string[]
  /** True when the week was unprotected and density actually materialized. */
  runtimeSupported: boolean
  /** Athlete-facing rationale. */
  reason: string
  /** Coach-facing one-line cue Y2 wrote into the styledGroup instruction. */
  visibleCue: string
}

export interface PairingDecisionTrace {
  /** What the original styledGroup looked like before Y2. */
  originalGrouping: 'superset' | 'circuit' | 'density_block' | 'cluster' | 'straight'
  /** What the styledGroup looks like after Y2's mutation. */
  finalGrouping: 'superset' | 'circuit' | 'density_block' | 'cluster' | 'straight'
  /** Coarse axis-overlap score Y2 detected. */
  overlapScore: 'LOW' | 'MODERATE' | 'HIGH'
  /** Specific axes that overlap (e.g. ['grip', 'lats', 'scapular_control']). */
  overlapAxes: string[]
  /** What Y2 did. */
  mutation:
    | 'rest_separated'
    | 'rpe_capped'
    | 'demoted_to_straight'
    | 'kept_with_low_volume_cap'
    | 'no_change'
  /** Athlete-facing reason. */
  reason: string
  /** Y2's safety verdict on the final state. */
  safetyVerdict: 'safe' | 'mitigated' | 'still_risky' | 'unknown'
  /** True when this trace is the explicit Skin-the-Cat + C2B audit. */
  isSkinTheCatPlusC2BCheck: boolean
  /** Pre-formatted pair label for UI rows. */
  pairLabel: string
}

export interface WeeklyMethodBudgetCalibration {
  /** Per-method counts. */
  byMethod: Record<
    string,
    {
      sessionsAllowedOrEarned: number
      sessionsBlockedOrDiscouraged: number
      sessionsActuallyUsed: number
      blockedReason: string | null
    }
  >
  /** Stable methods Y2 considered: superset, circuit, density_block, cluster, top_set, drop_set, rest_pause. */
  methodsConsidered: string[]
  /** Methods that ended up unused for the week, with reason (blocked / not_earned / no_runtime). */
  methodsUnused: Array<{ method: string; reason: string }>
  /** Athlete-facing one-line summary. */
  visibleSummary: string
}

export interface TrainingDifferentiationCalibration {
  version: 'phase-y2.training-differentiation-calibrator.v1'
  generatedAt: string
  verdict: CalibrationVerdict
  protectedWeek: boolean
  protectionReason: string | null

  /** Counts of mutations Y2 applied. */
  totals: {
    rpeRowsLifted: number
    rpeRowsHeld: number
    densityBlocksMaterialized: number
    densityBlocksHonestlyDemoted: number
    pairingsMitigated: number
    pairingsDemotedToStraight: number
    skinTheCatPlusC2BHandled: boolean
  }

  /** Per-day role + stress + intended adaptation summary, athlete-facing. */
  weeklyRoleSummary: Array<{
    dayNumber: number
    roleId: string
    roleLabel: string
    intendedStressLevel: 'low' | 'moderate' | 'high'
    intendedRPEBand: string
    primaryAdaptation: string
    secondaryAdaptation: string
    methodBudget: string
    densityAllowed: boolean
    heavyPairingAllowed: boolean
    reason: string
  }>

  /** Per-row RPE decisions Y2 made (only the rows Y2 lifted are stored). */
  rpeDecisions: Array<{
    dayNumber: number
    exerciseId: string
    exerciseName: string
    decision: RpeDecisionTrace
  }>

  /** Per-day density decisions. */
  densityDecisions: Array<{
    dayNumber: number
    blockId: string
    decision: DensityDecisionTrace
  }>

  /** Per-styledGroup pairing decisions. */
  pairingDecisions: Array<{
    dayNumber: number
    blockId: string
    decision: PairingDecisionTrace
  }>

  /** Weekly method budget audit. */
  methodBudget: WeeklyMethodBudgetCalibration
}

// =============================================================================
// CONSTANTS — CONSERVATIVE KEYWORD GUARDS
// =============================================================================

/**
 * Tendon-sensitive / straight-arm rows. NEVER lifted by RPE pass, NEVER
 * tightened-rest by density pass. Their dosage is owned by skill / tendon
 * doctrine.
 */
const TENDON_SENSITIVE_RE =
  /(planche|front lever|back lever|skin[- ]?the[- ]?cat|maltese|cross\b|iron cross|victorian|german hang|tuck (front )?lever|straddle lever|press to handstand)/i

/** Skill-neural rows — calibrator avoids RPE lift on these. */
const SKILL_NEURAL_RE =
  /(planche|lever|cross|maltese|handstand|hspu|one[- ]?arm|press to handstand|muscle[- ]?up|human flag)/i

/** Bent-arm compound rows — eligible for RPE lift on heavier roles. */
const BENT_ARM_PUSH_RE = /(dip|push[- ]?up|bench|hspu|pike push|overhead press|press)/i
const BENT_ARM_PULL_RE = /(pull[- ]?up|chin[- ]?up|chinup|row|inverted row|australian|muscle[- ]?up|chest[- ]?to[- ]?bar|c2b)/i
const LOWER_BODY_RE = /(squat|lunge|pistol|shrimp|hip thrust|glute bridge|deadlift|rdl|split squat|sissy|nordic)/i

/** Skin-the-Cat / C2B specific guards used by the explicit pairing audit. */
const SKIN_THE_CAT_RE = /skin[- ]?the[- ]?cat/i
const C2B_PULLUP_RE = /(chest[- ]?to[- ]?bar|c2b)\b.*(pull[- ]?up|chin[- ]?up)|(pull[- ]?up|chin[- ]?up).*(chest[- ]?to[- ]?bar|c2b)\b/i

// Axis vocabulary — mirrors the Y1 matrix axes but pure-local so this file
// has no dependency on the matrix module.
type OverlapAxis =
  | 'grip'
  | 'scapular_control'
  | 'shoulder_extension'
  | 'straight_arm_tendon'
  | 'elbow_flexor'
  | 'lats'
  | 'core_compression'
  | 'wrist_loading'
  | 'shoulder_loading'
  | 'explosive_pull'
  | 'high_neural'

function axesForExercise(name: string): Set<OverlapAxis> {
  const n = (name || '').toLowerCase()
  const axes = new Set<OverlapAxis>()
  if (/(pull[- ]?up|chin[- ]?up|row|hang|deadhang|deadlift|cleans|farmer)/.test(n)) axes.add('grip')
  if (/(skin[- ]?the[- ]?cat|dip|support hold|german hang|inverted hang|scapular)/.test(n))
    axes.add('scapular_control')
  if (/(skin[- ]?the[- ]?cat|german hang|back lever|reverse fly)/.test(n))
    axes.add('shoulder_extension')
  if (/(planche|lever|skin[- ]?the[- ]?cat|tuck fl|tuck front lever|cross|maltese)/.test(n))
    axes.add('straight_arm_tendon')
  if (/(pull[- ]?up|chin[- ]?up|curl|row|muscle[- ]?up)/.test(n)) axes.add('elbow_flexor')
  if (/(pull[- ]?up|chin[- ]?up|row|lat|pull[- ]?down)/.test(n)) axes.add('lats')
  if (/(l[- ]?sit|skin[- ]?the[- ]?cat|tuck|compression|v[- ]?sit|hollow|toes[- ]?to[- ]?bar)/.test(n))
    axes.add('core_compression')
  if (/(planche|handstand|push[- ]?up|press|hspu|dip)/.test(n)) axes.add('wrist_loading')
  if (/(hspu|handstand|dip|planche|press|push[- ]?up|overhead)/.test(n)) axes.add('shoulder_loading')
  if (/(muscle[- ]?up|c2b|chest[- ]?to[- ]?bar|kipping|explosive pull)/.test(n))
    axes.add('explosive_pull')
  if (/(planche|lever|cross|maltese|c2b|chest[- ]?to[- ]?bar|muscle[- ]?up|one[- ]?arm)/.test(n))
    axes.add('high_neural')
  return axes
}

function intersectAxes(a: Set<OverlapAxis>, b: Set<OverlapAxis>): OverlapAxis[] {
  const out: OverlapAxis[] = []
  a.forEach(ax => {
    if (b.has(ax)) out.push(ax)
  })
  return out
}

// =============================================================================
// ROLE -> RPE FLOOR / RPE CAP INTENT
// =============================================================================

/**
 * Per-role intended RPE floor. The calibrator only LIFTS toward this floor
 * when the row's current RPE is below it AND every safety guard agrees.
 *
 * primary_strength_emphasis  -> 8.0 (heavier day, allow strength work)
 * secondary_support          -> 7.5 (support strength / hypertrophy)
 * broad_mixed_volume         -> 7.5 (balanced day, accessory volume)
 * skill_quality_emphasis     -> 7.0 (CNS-fresh quality, no lift)
 * density_capacity           -> 7.0 (capacity, density does the work)
 * recovery_supportive        -> 6.0 (recovery, no lift)
 * MIXED_CONSOLIDATION (alias for broad_mixed_volume) -> 7.5
 *
 * The calibrator NEVER exceeds the role's `rpeCap` (stamped by the role
 * contract's prescriptionShape). Protected weeks subtract 0.5 from the
 * floor.
 */
const ROLE_RPE_FLOOR: Record<string, number> = {
  primary_strength_emphasis: 8.0,
  secondary_support: 7.5,
  broad_mixed_volume: 7.5,
  skill_quality_emphasis: 7.0,
  density_capacity: 7.0,
  recovery_supportive: 6.0,
}

/** Per-role rpe ceiling used as a defensive bound when the role's actual cap is missing. */
const ROLE_RPE_CEILING: Record<string, number> = {
  primary_strength_emphasis: 9.0,
  secondary_support: 8.0,
  broad_mixed_volume: 8.0,
  skill_quality_emphasis: 7.0,
  density_capacity: 7.0,
  recovery_supportive: 6.0,
}

const ROLE_LABELS: Record<string, string> = {
  primary_strength_emphasis: 'Heavier strength day',
  secondary_support: 'Secondary / support day',
  broad_mixed_volume: 'Balanced expression day',
  skill_quality_emphasis: 'Skill quality day',
  density_capacity: 'Density / capacity day',
  recovery_supportive: 'Supportive recovery day',
}

const ROLE_INTENDED_STRESS: Record<string, 'low' | 'moderate' | 'high'> = {
  primary_strength_emphasis: 'high',
  secondary_support: 'moderate',
  broad_mixed_volume: 'moderate',
  skill_quality_emphasis: 'moderate',
  density_capacity: 'moderate',
  recovery_supportive: 'low',
}

const ROLE_PRIMARY_ADAPTATION: Record<string, string> = {
  primary_strength_emphasis: 'Skill-strength expression with heavier loading',
  secondary_support: 'Support-strength carryover and accessory volume',
  broad_mixed_volume: 'Balanced expression across selected skills',
  skill_quality_emphasis: 'Skill quality and CNS-fresh technique',
  density_capacity: 'Capacity / work-density',
  recovery_supportive: 'Recovery and joint care',
}

const ROLE_SECONDARY_ADAPTATION: Record<string, string> = {
  primary_strength_emphasis: 'Hypertrophy carryover on accessories',
  secondary_support: 'Foundational pull / push volume',
  broad_mixed_volume: 'Foundational support work for both planche and front lever',
  skill_quality_emphasis: 'Banded or assisted progression support',
  density_capacity: 'Aerobic-strength carryover',
  recovery_supportive: 'Mobility and tendon health',
}

// =============================================================================
// HELPERS
// =============================================================================

function classifyExerciseRisk(name: string): RpeDecisionTrace['exerciseRiskClass'] {
  if (TENDON_SENSITIVE_RE.test(name)) return 'tendon_sensitive'
  if (SKILL_NEURAL_RE.test(name)) return 'skill_neural'
  if (BENT_ARM_PUSH_RE.test(name) || BENT_ARM_PULL_RE.test(name) || LOWER_BODY_RE.test(name))
    return 'bent_arm_compound'
  return 'accessory'
}

function isSkillCategory(ex: AdaptiveExercise): boolean {
  return ex.category === 'skill'
}

function isMethodOwnedRow(ex: AdaptiveExercise): boolean {
  return !!ex.setExecutionMethod
}

function isInGroupedBlock(ex: AdaptiveExercise): boolean {
  // A row is "in a grouped block" when blockId is set AND its method is not
  // the legacy 'straight' fallback. We treat any blockId as grouped here for
  // safety — the RPE-lift pass leaves grouped rows alone regardless.
  return !!ex.blockId
}

/** Coarse "is this day already pull-heavy / push-heavy" signal. */
function dayIsOverloaded(session: AdaptiveSession, axis: 'pull' | 'push'): boolean {
  const exercises = session.exercises || []
  const re = axis === 'pull' ? BENT_ARM_PULL_RE : BENT_ARM_PUSH_RE
  let count = 0
  for (const ex of exercises) {
    if (re.test(ex.name || '')) count++
  }
  return count >= 3
}

/** Approximate fatigue overlap of a row with the rest of the session by axis. */
function fatigueOverlapForRow(session: AdaptiveSession, ex: AdaptiveExercise): 'low' | 'moderate' | 'high' {
  const myAxes = axesForExercise(ex.name || '')
  if (myAxes.size === 0) return 'low'
  let totalOverlap = 0
  for (const other of session.exercises || []) {
    if (!other || other.id === ex.id) continue
    totalOverlap += intersectAxes(myAxes, axesForExercise(other.name || '')).length
  }
  if (totalOverlap >= 8) return 'high'
  if (totalOverlap >= 4) return 'moderate'
  return 'low'
}

// =============================================================================
// WEEKLY ROLE READER (defensive — works even if compositionMetadata is absent)
// =============================================================================

interface SessionRoleView {
  roleId: string
  roleLabel: string
  rpeFloor: number
  rpeCeiling: number
  intendedStress: 'low' | 'moderate' | 'high'
  primaryAdaptation: string
  secondaryAdaptation: string
  densityAllowed: boolean
  heavyPairingAllowed: boolean
  reason: string
}

function readSessionRole(session: AdaptiveSession): SessionRoleView {
  const composition = (session as { compositionMetadata?: { weeklyRole?: { roleId?: string; roleLabel?: string; methodAllowance?: { density?: string; supersets?: string }; weeklyRationale?: string } } })
    .compositionMetadata
  const weeklyRole = composition?.weeklyRole
  // stressRole is hoisted at top-level for direct read access.
  const roleId = weeklyRole?.roleId || (session as { stressRole?: string }).stressRole || 'broad_mixed_volume'
  const roleLabel = ROLE_LABELS[roleId] || weeklyRole?.roleLabel || 'Balanced expression day'
  const densityGate = weeklyRole?.methodAllowance?.density || 'allowed'
  const supersetGate = weeklyRole?.methodAllowance?.supersets || 'allowed'

  return {
    roleId,
    roleLabel,
    rpeFloor: ROLE_RPE_FLOOR[roleId] ?? 7.0,
    rpeCeiling: ROLE_RPE_CEILING[roleId] ?? 8.0,
    intendedStress: ROLE_INTENDED_STRESS[roleId] ?? 'moderate',
    primaryAdaptation: ROLE_PRIMARY_ADAPTATION[roleId] ?? 'Balanced training expression',
    secondaryAdaptation: ROLE_SECONDARY_ADAPTATION[roleId] ?? 'Support work',
    densityAllowed: densityGate === 'earned' || densityGate === 'allowed',
    heavyPairingAllowed: supersetGate === 'earned' || supersetGate === 'allowed',
    reason: weeklyRole?.weeklyRationale || `${roleLabel}: role-driven calibration`,
  }
}

// =============================================================================
// CALIBRATOR — INPUT & ENTRY
// =============================================================================

export interface CalibratorInput {
  sessions: AdaptiveSession[]
  /**
   * Whether the week is "protected" — week 1 / acclimation / recovery_constrained.
   * Read from `program.weeklySessionRoleContract.protectedWeek` when available.
   */
  protectedWeek: boolean
  protectionReason: string | null
  /** Injectable for tests. */
  now?: () => string
}

const DEFAULT_NOW = (): string => new Date().toISOString()

/**
 * Apply Phase Y2 calibrations IN PLACE to the supplied sessions, and return
 * a structured calibration report.
 *
 * The function:
 *   - never throws (all internal ops are wrapped in defensive checks),
 *   - never adds rows, never deletes rows,
 *   - never invents methods or grouped blocks,
 *   - leaves protected rows untouched.
 *
 * Callers should invoke this AFTER:
 *   - composition,
 *   - method materialization (styledGroups final),
 *   - prescription shaping,
 *   - weekly stress governor,
 * and BEFORE the Phase Y1 doctrine execution matrix is built.
 */
export function applyTrainingDifferentiationCalibration(
  input: CalibratorInput,
): TrainingDifferentiationCalibration {
  const now = input.now ?? DEFAULT_NOW
  const generatedAt = now()
  const sessions = Array.isArray(input.sessions) ? input.sessions : []

  if (sessions.length === 0) {
    return {
      version: 'phase-y2.training-differentiation-calibrator.v1',
      generatedAt,
      verdict: 'SKIPPED_NO_INPUT',
      protectedWeek: !!input.protectedWeek,
      protectionReason: input.protectionReason,
      totals: {
        rpeRowsLifted: 0,
        rpeRowsHeld: 0,
        densityBlocksMaterialized: 0,
        densityBlocksHonestlyDemoted: 0,
        pairingsMitigated: 0,
        pairingsDemotedToStraight: 0,
        skinTheCatPlusC2BHandled: false,
      },
      weeklyRoleSummary: [],
      rpeDecisions: [],
      densityDecisions: [],
      pairingDecisions: [],
      methodBudget: emptyMethodBudget(),
    }
  }

  // ---------------------------------------------------------------------------
  // Pass 0: weekly role summary — built first so every later pass can read.
  // ---------------------------------------------------------------------------
  const weeklyRoleSummary = sessions.map((s) => {
    const rv = readSessionRole(s)
    const intendedRPEBand =
      rv.roleId === 'recovery_supportive'
        ? 'RPE 5-6'
        : rv.roleId === 'skill_quality_emphasis' || rv.roleId === 'density_capacity'
          ? 'RPE 6.5-7'
          : rv.roleId === 'primary_strength_emphasis'
            ? 'RPE 7.5-8.5 where safe'
            : 'RPE 7-8'
    const methodBudget =
      rv.roleId === 'density_capacity'
        ? 'density / circuit / superset earned'
        : rv.roleId === 'primary_strength_emphasis'
          ? 'cluster earned, supersets allowed, density discouraged'
          : rv.roleId === 'skill_quality_emphasis'
            ? 'cluster allowed, density blocked'
            : rv.roleId === 'recovery_supportive'
              ? 'straight sets only, methods blocked'
              : 'supersets allowed, density allowed when earned'
    return {
      dayNumber: s.dayNumber,
      roleId: rv.roleId,
      roleLabel: rv.roleLabel,
      intendedStressLevel: rv.intendedStress,
      intendedRPEBand,
      primaryAdaptation: rv.primaryAdaptation,
      secondaryAdaptation: rv.secondaryAdaptation,
      methodBudget,
      densityAllowed: rv.densityAllowed,
      heavyPairingAllowed: rv.heavyPairingAllowed,
      reason: rv.reason,
    }
  })

  // ---------------------------------------------------------------------------
  // [PHASE Y3 OF 3] PER-SESSION DAY PURPOSE STAMP
  // ---------------------------------------------------------------------------
  // Y2 already produces a rich per-day role summary. Y3's day card needs one
  // extra hop: a tiny `weeklyDayPurpose` object stamped directly on each
  // session, so `AdaptiveSessionCard` can render a per-day "why this day
  // exists" line without having to reach back into program-level data.
  //
  // Strictly additive — we attach via cast and never remove or rename fields
  // on the session. Legacy programs without Y2 keep their existing card.
  // ---------------------------------------------------------------------------
  for (const s of sessions) {
    const row = weeklyRoleSummary.find((r) => r.dayNumber === s.dayNumber)
    if (!row) continue
    ;(s as unknown as { weeklyDayPurpose?: unknown }).weeklyDayPurpose = {
      roleId: row.roleId,
      roleLabel: row.roleLabel,
      intendedStressLevel: row.intendedStressLevel,
      intendedRPEBand: row.intendedRPEBand,
      reason: row.reason,
      primaryAdaptation: row.primaryAdaptation,
      densityAllowed: row.densityAllowed,
      heavyPairingAllowed: row.heavyPairingAllowed,
    }
  }

  // ---------------------------------------------------------------------------
  // Pass 1: RPE differentiation — bounded lift toward role's intended floor.
  // ---------------------------------------------------------------------------
  const rpeDecisions: TrainingDifferentiationCalibration['rpeDecisions'] = []
  let rpeRowsLifted = 0
  let rpeRowsHeld = 0

  for (const session of sessions) {
    const rv = readSessionRole(session)
    // Skill / recovery / density days: never lift; floor matches the cap.
    const canLift =
      rv.roleId === 'primary_strength_emphasis' ||
      rv.roleId === 'secondary_support' ||
      rv.roleId === 'broad_mixed_volume'
    if (!canLift) continue

    // Protected week: lift only when current RPE is missing (write a
    // softened floor) — never lift an existing RPE upward in protected weeks.
    const protectedFloorAdjust = input.protectedWeek ? -0.5 : 0
    const targetFloor = Math.max(6.0, rv.rpeFloor + protectedFloorAdjust)
    const targetCeiling = Math.max(targetFloor, rv.rpeCeiling + (input.protectedWeek ? -0.5 : 0))

    for (const ex of session.exercises || []) {
      if (!ex) continue

      // Doctrine guard 1: skill rows owned by skill doctrine.
      if (isSkillCategory(ex)) continue
      // Doctrine guard 2: tendon-sensitive rows.
      const riskClass = classifyExerciseRisk(ex.name || '')
      if (riskClass === 'tendon_sensitive' || riskClass === 'skill_neural') continue
      // Doctrine guard 3: rows owning a set-execution method.
      if (isMethodOwnedRow(ex)) continue
      // Doctrine guard 4: rows already in a grouped block.
      if (isInGroupedBlock(ex)) continue

      const before = typeof ex.targetRPE === 'number' ? ex.targetRPE : null
      const fatigue = fatigueOverlapForRow(session, ex)

      // High overlap rows on heavy day get a smaller lift to preserve safety.
      const overlapPenalty = fatigue === 'high' ? 0.5 : 0
      const adjustedFloor = Math.max(6.5, targetFloor - overlapPenalty)

      // Decide direction.
      let after: number = before ?? adjustedFloor
      let raisedOrLowered: 'raised' | 'lowered' | 'held' = 'held'
      let reason = ''
      let confidence: 'high' | 'moderate' | 'low' = 'moderate'

      if (input.protectedWeek) {
        // Protected: only fill missing RPE; never raise existing.
        if (before === null) {
          after = Math.min(targetCeiling, adjustedFloor)
          raisedOrLowered = 'raised'
          reason = `Protected week — wrote softened ${rv.roleLabel.toLowerCase()} floor RPE so the row reads honestly.`
          confidence = 'moderate'
        } else {
          rpeRowsHeld++
          continue
        }
      } else if (before === null) {
        after = Math.min(targetCeiling, adjustedFloor)
        raisedOrLowered = 'raised'
        reason = `${rv.roleLabel}: wrote intended floor RPE for ${riskClass.replace('_', ' ')} row.`
        confidence = 'high'
      } else if (before < adjustedFloor) {
        after = Math.min(targetCeiling, adjustedFloor)
        raisedOrLowered = 'raised'
        if (fatigue === 'high') {
          reason = `${rv.roleLabel}: lifted toward role floor, capped lower because of high overlap with the rest of the day.`
        } else {
          reason = `${rv.roleLabel}: lifted from default RPE to the role's intended floor for productive ${riskClass.replace('_', ' ')} work.`
        }
        confidence = 'high'
      } else {
        // Already at or above floor — no lift needed.
        rpeRowsHeld++
        continue
      }

      ex.targetRPE = after
      rpeRowsLifted++

      const decision: RpeDecisionTrace = {
        originalRPE: before,
        finalRPE: after,
        allowedBand: { min: adjustedFloor, max: targetCeiling },
        raisedOrLowered,
        capSource: input.protectedWeek
          ? 'role.rpeCap minus 0.5 for protected week'
          : `role.${rv.roleId}.rpeFloor`,
        sessionRole: rv.roleId,
        exerciseRiskClass: riskClass,
        fatigueOverlap: fatigue,
        reason,
        confidence,
      }
      ;(ex as { rpeDecisionTrace?: RpeDecisionTrace }).rpeDecisionTrace = decision

      rpeDecisions.push({
        dayNumber: session.dayNumber,
        exerciseId: ex.id,
        exerciseName: ex.name,
        decision,
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Pass 2: Density materialization or honest demotion.
  // ---------------------------------------------------------------------------
  const densityDecisions: TrainingDifferentiationCalibration['densityDecisions'] = []
  let densityBlocksMaterialized = 0
  let densityBlocksHonestlyDemoted = 0

  for (const session of sessions) {
    const groups = session.styleMetadata?.styledGroups
    if (!Array.isArray(groups)) continue
    const rv = readSessionRole(session)

    for (const g of groups) {
      if (g.groupType !== 'density_block') continue

      const memberIds = new Set((g.exercises || []).map((m) => m.id))
      const memberRows = (session.exercises || []).filter((e) => memberIds.has(e.id))
      const memberNames = memberRows.map((e) => e.name || '')

      // Tendon-sensitive members disqualify the block from density mutation.
      const hasTendonMember = memberRows.some((e) => TENDON_SENSITIVE_RE.test(e.name || ''))

      const runtimeSupported = !input.protectedWeek && rv.densityAllowed && !hasTendonMember

      if (runtimeSupported) {
        // Materialize. Tighten member rest to <= 45s and stamp a literal
        // time cap on the styledGroup instruction so the Y1 matrix detects
        // both shortRest + timeCap.
        const affectedExercises: string[] = []
        for (const e of memberRows) {
          const currentRest = typeof e.restSeconds === 'number' ? e.restSeconds : null
          if (currentRest === null || currentRest > 45) {
            e.restSeconds = 45
            affectedExercises.push(e.name || '')
          }
        }
        g.instruction = 'Density block: 8-12 minute time cap, 30-45s rest between rounds'
        g.restProtocol = '30-45s between rounds, 8-12 min total cap'

        const decision: DensityDecisionTrace = {
          applied: true,
          densityType: 'timed_block',
          restChange: affectedExercises.length > 0 ? `tightened to 45s on ${affectedExercises.length} member(s)` : 'rest already short',
          timeCap: '8-12 min',
          affectedExercises,
          runtimeSupported: true,
          reason: 'Density / capacity day: density block materialized with literal time cap and tightened rest so it reads as real density training, not a labelled superset.',
          visibleCue: 'Density block: 8-12 min cap, 30-45s rest',
        }
        ;(g as { densityDecision?: DensityDecisionTrace }).densityDecision = decision
        densityBlocksMaterialized++
        densityDecisions.push({
          dayNumber: session.dayNumber,
          blockId: g.id,
          decision,
        })
      } else {
        // Honest demotion. Do NOT change groupType (avoid surprising live
        // runtime). Update wording so the user reads "capacity superset"
        // instead of pretending density.
        const reasonText = input.protectedWeek
          ? 'Protected week (acclimation / first week / recovery-constrained) — density honestly translated to capacity support so the user is not pushed into max-effort grouped work too early.'
          : hasTendonMember
            ? 'A tendon-sensitive movement is present in this block — density rest tightening is unsafe; expressed as capacity-supportive pairing instead.'
            : 'Role does not earn density this week — block expressed as capacity-supportive grouping rather than fabricated density.'
        g.instruction = 'Capacity-supportive pairing: shorter rest target, not max effort'
        g.restProtocol = '60-90s between rounds (capacity-supportive, not density)'

        const decision: DensityDecisionTrace = {
          applied: false,
          densityType: 'capacity_superset',
          restChange: 'unchanged (capacity wording only)',
          timeCap: null,
          affectedExercises: [],
          runtimeSupported: false,
          reason: reasonText,
          visibleCue: 'Capacity pairing — not density',
        }
        ;(g as { densityDecision?: DensityDecisionTrace }).densityDecision = decision
        densityBlocksHonestlyDemoted++
        densityDecisions.push({
          dayNumber: session.dayNumber,
          blockId: g.id,
          decision,
        })
      }

      // Use memberNames for proof — keep memberNames referenced so
      // bundlers do not strip it during DCE. (Cheap, no-op runtime.)
      void memberNames
    }
  }

  // ---------------------------------------------------------------------------
  // Pass 3: Pairing fatigue overlap mitigation — supersets and circuits.
  //         Specifically audits Skin-the-Cat + C2B Pull-Up.
  // ---------------------------------------------------------------------------
  const pairingDecisions: TrainingDifferentiationCalibration['pairingDecisions'] = []
  let pairingsMitigated = 0
  let pairingsDemotedToStraight = 0
  let skinTheCatPlusC2BHandled = false

  for (const session of sessions) {
    const groups = session.styleMetadata?.styledGroups
    if (!Array.isArray(groups)) continue

    for (const g of groups) {
      if (g.groupType !== 'superset' && g.groupType !== 'circuit') continue
      const members = (g.exercises || []).filter((m) => !!m && !!m.name)
      if (members.length < 2) continue

      // Aggregate axes across members (pair-level overlap).
      const allAxesByMember = members.map((m) => axesForExercise(m.name))
      let maxOverlap = 0
      const axisUnion = new Set<OverlapAxis>()
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const ov = intersectAxes(allAxesByMember[i], allAxesByMember[j])
          ov.forEach((ax) => axisUnion.add(ax))
          if (ov.length > maxOverlap) maxOverlap = ov.length
        }
      }
      const overlapScore: 'LOW' | 'MODERATE' | 'HIGH' =
        maxOverlap >= 4 ? 'HIGH' : maxOverlap >= 2 ? 'MODERATE' : 'LOW'

      // Detect Skin-the-Cat + C2B Pull-Up pair.
      const memberNames = members.map((m) => m.name || '')
      const hasSkinTheCat = memberNames.some((n) => SKIN_THE_CAT_RE.test(n))
      const hasC2B = memberNames.some((n) => C2B_PULLUP_RE.test(n) || (/c2b|chest[- ]?to[- ]?bar/i.test(n) && /pull[- ]?up|chin[- ]?up/i.test(n)))
      const isStcC2B = hasSkinTheCat && hasC2B

      if (isStcC2B) skinTheCatPlusC2BHandled = true

      // Only mutate HIGH overlap or the explicit STC+C2B pair.
      if (overlapScore !== 'HIGH' && !isStcC2B) {
        // No mutation — but stamp a "no_change" decision when it's a clear
        // moderate-overlap superset so the matrix proof has a row.
        if (overlapScore === 'MODERATE') {
          const decision: PairingDecisionTrace = {
            originalGrouping: g.groupType,
            finalGrouping: g.groupType,
            overlapScore,
            overlapAxes: Array.from(axisUnion),
            mutation: 'no_change',
            reason: 'Moderate overlap — within acceptable supersetting range with normal rest.',
            safetyVerdict: 'safe',
            isSkinTheCatPlusC2BCheck: false,
            pairLabel: memberNames.slice(0, 2).join(' + '),
          }
          ;(g as { pairingDecision?: PairingDecisionTrace }).pairingDecision = decision
          pairingDecisions.push({
            dayNumber: session.dayNumber,
            blockId: g.id,
            decision,
          })
        }
        continue
      }

      // Build per-member runtime view.
      const memberRows = members
        .map((m) => (session.exercises || []).find((e) => e.id === m.id))
        .filter((e): e is AdaptiveExercise => !!e)
      if (memberRows.length < 2) continue

      const sets = memberRows.map((e) => (typeof e.sets === 'number' ? e.sets : 99))
      const rpes = memberRows.map((e) => (typeof e.targetRPE === 'number' ? e.targetRPE : 0))
      const minSets = Math.min(...sets)
      const maxRpe = Math.max(...rpes)
      const pullOverloaded = dayIsOverloaded(session, 'pull')

      let mutation: PairingDecisionTrace['mutation'] = 'no_change'
      let safetyVerdict: PairingDecisionTrace['safetyVerdict'] = 'unknown'
      let reason = ''
      let finalGrouping: PairingDecisionTrace['finalGrouping'] = g.groupType
      const originalGrouping: PairingDecisionTrace['originalGrouping'] = g.groupType

      if (isStcC2B) {
        // Specific STC + C2B handling.
        const stcRow = memberRows.find((e) => SKIN_THE_CAT_RE.test(e.name))
        const c2bRow = memberRows.find((e) => /chest[- ]?to[- ]?bar|c2b/i.test(e.name) && /pull[- ]?up|chin[- ]?up/i.test(e.name))
        const stcLowVolume = stcRow && (stcRow.sets ?? 99) <= 2
        const acceptableRpe = maxRpe <= 7
        const dayPullOk = !pullOverloaded

        if (stcLowVolume && acceptableRpe && dayPullOk && !input.protectedWeek) {
          // Keep paired but add explicit low-volume cap doctrine.
          for (const e of memberRows) {
            if (typeof e.restSeconds !== 'number' || e.restSeconds < 90) {
              e.restSeconds = 90
            }
          }
          g.instruction = 'Skin-the-Cat is low-volume controlled prep; pair with C2B at controlled RPE'
          g.restProtocol = '90s+ between exercises (overlap mitigation)'
          mutation = 'kept_with_low_volume_cap'
          safetyVerdict = 'safe'
          reason = 'Skin-the-Cat sets <= 2 and RPE <= 7 — pair retained as low-volume prep with 90s+ rest.'
        } else {
          // Demote to straight: clear blockId and rebuild as separate rows.
          for (const e of memberRows) {
            // [PHASE Z1 GROUPED-METHOD-CONTIGUITY-LOCK] When demoting a
            // superset to straight sets, clear EVERY method-ownership field
            // on the row -- not just `blockId`. Previously this loop only
            // cleared `blockId`, leaving `e.method='superset'` (and any
            // `methodLabel='A1'/'A2'` plus `setExecutionMethod`) stale on the
            // row. Downstream, `resolveRowMethodTruth` in AdaptiveSessionCard
            // reads `e.method`, sees `'superset'`, and -- because the row no
            // longer has a `blockId` to flag it as a grouped member -- the
            // row-level fallback chip paints a "Superset" label on a bare
            // flat row whose paired member has been moved into its own
            // straight set. That is the user-visible "SUPSET chip on
            // separated exercises" symptom Phase Z1 closes. The builder's
            // pre-materialization scrub at adaptive-program-builder.ts:13062
            // -13067 already clears all four fields together; the demotion
            // here now matches that contract so a row cannot survive with
            // grouped-method metadata after its group has been dissolved.
            const eAny = e as unknown as {
              method?: string
              methodLabel?: string
              setExecutionMethod?: string
              blockId?: string
            }
            eAny.blockId = undefined
            eAny.method = undefined
            eAny.methodLabel = undefined
            eAny.setExecutionMethod = undefined
            // Cap STC sets to 2 and STC RPE to 7 for safety.
            if (SKIN_THE_CAT_RE.test(e.name)) {
              if (typeof e.sets === 'number' && e.sets > 2) e.sets = 2
              if (typeof e.targetRPE !== 'number' || e.targetRPE > 7) e.targetRPE = 7
            }
            // C2B RPE capped to 8 when the day is pull-overloaded, else stays.
            if (/chest[- ]?to[- ]?bar|c2b/i.test(e.name) && pullOverloaded) {
              if (typeof e.targetRPE !== 'number' || e.targetRPE > 8) e.targetRPE = 8
            }
            // Restore reasonable rest.
            if (typeof e.restSeconds !== 'number' || e.restSeconds < 120) {
              e.restSeconds = 120
            }
          }
          // Convert this styledGroup to straight to disable supersetting.
          g.groupType = 'straight'
          g.instruction = 'Rest-separated: complete each exercise fully before moving to the next (overlap demotion)'
          g.restProtocol = '120s+ between exercises'
          finalGrouping = 'straight'
          mutation = 'demoted_to_straight'
          safetyVerdict = 'safe'
          pairingsDemotedToStraight++
          reason = pullOverloaded
            ? 'Pull-heavy day with Skin-the-Cat + C2B Pull-Up — demoted to straight sets, STC sets <= 2, RPE caps applied.'
            : input.protectedWeek
              ? 'Protected week — Skin-the-Cat + C2B Pull-Up demoted to straight sets for safety during acclimation.'
              : 'Skin-the-Cat + C2B Pull-Up overlap on grip, lats, scapular control, shoulder extension — demoted to straight sets to prevent shared-axis fatigue stacking.'
        }
      } else {
        // Generic HIGH-overlap pair.
        if (maxRpe >= 8 || input.protectedWeek) {
          // Demote to straight.
          for (const e of memberRows) {
            // [PHASE Z1 GROUPED-METHOD-CONTIGUITY-LOCK] Match the STC+C2B
            // demotion above: clear every method-ownership field, not just
            // `blockId`. Leaving `method='superset'` / `methodLabel='A1'` /
            // `setExecutionMethod` stale produced the "Superset chip on
            // separated rows" leak in AdaptiveSessionCard's row-level
            // fallback chip. After demotion the row IS straight; nothing
            // about its method identity should still claim grouped truth.
            const eAny = e as unknown as {
              method?: string
              methodLabel?: string
              setExecutionMethod?: string
              blockId?: string
            }
            eAny.blockId = undefined
            eAny.method = undefined
            eAny.methodLabel = undefined
            eAny.setExecutionMethod = undefined
            if (typeof e.targetRPE === 'number' && e.targetRPE > 7.5) e.targetRPE = 7.5
            if (typeof e.restSeconds !== 'number' || e.restSeconds < 120) e.restSeconds = 120
          }
          g.groupType = 'straight'
          g.instruction = 'Rest-separated: high overlap detected — complete each exercise fully before moving on'
          g.restProtocol = '120s+ between exercises'
          finalGrouping = 'straight'
          mutation = 'demoted_to_straight'
          safetyVerdict = 'safe'
          pairingsDemotedToStraight++
          reason = `High fatigue overlap on ${Array.from(axisUnion).slice(0, 4).join(', ')} with RPE >= 8 — demoted to straight sets.`
        } else {
          // Mitigate: bump rest, cap RPE.
          for (const e of memberRows) {
            if (typeof e.targetRPE === 'number' && e.targetRPE > 7) e.targetRPE = 7
            if (typeof e.restSeconds !== 'number' || e.restSeconds < 120) e.restSeconds = 120
          }
          g.instruction = 'Rest-separated pair: high overlap — extend rest, cap RPE'
          g.restProtocol = '120s+ between exercises'
          mutation = 'rest_separated'
          safetyVerdict = 'mitigated'
          pairingsMitigated++
          reason = `High overlap on ${Array.from(axisUnion).slice(0, 4).join(', ')} — kept paired but rest extended to 120s and RPE capped at 7.`
        }
      }

      const decision: PairingDecisionTrace = {
        originalGrouping,
        finalGrouping,
        overlapScore,
        overlapAxes: Array.from(axisUnion),
        mutation,
        reason,
        safetyVerdict,
        isSkinTheCatPlusC2BCheck: isStcC2B,
        pairLabel: memberNames.slice(0, 2).join(' + '),
      }
      ;(g as { pairingDecision?: PairingDecisionTrace }).pairingDecision = decision
      pairingDecisions.push({
        dayNumber: session.dayNumber,
        blockId: g.id,
        decision,
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Pass 4: Weekly method budget audit (descriptive only).
  // ---------------------------------------------------------------------------
  const methodBudget = computeMethodBudget(sessions, weeklyRoleSummary)

  // ---------------------------------------------------------------------------
  // Verdict
  // ---------------------------------------------------------------------------
  const totalMutations =
    rpeRowsLifted +
    densityBlocksMaterialized +
    densityBlocksHonestlyDemoted +
    pairingsMitigated +
    pairingsDemotedToStraight
  const verdict: CalibrationVerdict =
    totalMutations === 0
      ? 'NO_CALIBRATION_NEEDED'
      : input.protectedWeek
        ? 'CALIBRATED_PROTECTED_WEEK'
        : rpeRowsLifted > 0 && densityBlocksMaterialized > 0
          ? 'CALIBRATED'
          : 'CALIBRATED_PARTIAL'

  return {
    version: 'phase-y2.training-differentiation-calibrator.v1',
    generatedAt,
    verdict,
    protectedWeek: !!input.protectedWeek,
    protectionReason: input.protectionReason,
    totals: {
      rpeRowsLifted,
      rpeRowsHeld,
      densityBlocksMaterialized,
      densityBlocksHonestlyDemoted,
      pairingsMitigated,
      pairingsDemotedToStraight,
      skinTheCatPlusC2BHandled,
    },
    weeklyRoleSummary,
    rpeDecisions,
    densityDecisions,
    pairingDecisions,
    methodBudget,
  }
}

// =============================================================================
// METHOD BUDGET HELPERS
// =============================================================================

function emptyMethodBudget(): WeeklyMethodBudgetCalibration {
  return {
    byMethod: {},
    methodsConsidered: [],
    methodsUnused: [],
    visibleSummary: 'No sessions to evaluate.',
  }
}

function computeMethodBudget(
  sessions: AdaptiveSession[],
  weeklyRoleSummary: TrainingDifferentiationCalibration['weeklyRoleSummary'],
): WeeklyMethodBudgetCalibration {
  const methodsConsidered = ['superset', 'circuit', 'density_block', 'cluster', 'top_set', 'drop_set', 'rest_pause']
  const byMethod: WeeklyMethodBudgetCalibration['byMethod'] = {}

  for (const m of methodsConsidered) {
    byMethod[m] = {
      sessionsAllowedOrEarned: 0,
      sessionsBlockedOrDiscouraged: 0,
      sessionsActuallyUsed: 0,
      blockedReason: null,
    }
  }

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    const role = weeklyRoleSummary[i]
    const composition = (s as { compositionMetadata?: { weeklyRole?: { methodAllowance?: Record<string, string> } } }).compositionMetadata
    const allowance = composition?.weeklyRole?.methodAllowance || {}

    const allowanceMap: Record<string, string> = {
      supersets: 'superset',
      circuits: 'circuit',
      density: 'density_block',
      cluster: 'cluster',
    }

    for (const [allowanceKey, method] of Object.entries(allowanceMap)) {
      const gate = allowance[allowanceKey] || (role?.densityAllowed && method === 'density_block' ? 'allowed' : 'allowed')
      if (gate === 'earned' || gate === 'allowed') {
        byMethod[method].sessionsAllowedOrEarned++
      } else {
        byMethod[method].sessionsBlockedOrDiscouraged++
      }
    }

    const groups = s.styleMetadata?.styledGroups || []
    const usedTypes = new Set<string>()
    for (const g of groups) {
      if (g.groupType === 'superset') usedTypes.add('superset')
      if (g.groupType === 'circuit') usedTypes.add('circuit')
      if (g.groupType === 'density_block') usedTypes.add('density_block')
      if (g.groupType === 'cluster') usedTypes.add('cluster')
    }
    for (const ex of s.exercises || []) {
      const m = ex.setExecutionMethod
      if (m === 'cluster') usedTypes.add('cluster')
      if (m === 'top_set') usedTypes.add('top_set')
      if (m === 'drop_set') usedTypes.add('drop_set')
      if (m === 'rest_pause') usedTypes.add('rest_pause')
    }
    usedTypes.forEach((t) => {
      if (byMethod[t]) byMethod[t].sessionsActuallyUsed++
    })
  }

  const methodsUnused: WeeklyMethodBudgetCalibration['methodsUnused'] = []
  for (const m of methodsConsidered) {
    const v = byMethod[m]
    if (v.sessionsActuallyUsed === 0) {
      const reason =
        v.sessionsAllowedOrEarned === 0
          ? `blocked by role allowance on every day`
          : `allowed on ${v.sessionsAllowedOrEarned} day(s) but not earned by composition this week`
      v.blockedReason = reason
      methodsUnused.push({ method: m, reason })
    }
  }

  const usedMethods = methodsConsidered.filter((m) => byMethod[m].sessionsActuallyUsed > 0)
  const visibleSummary =
    usedMethods.length === 0
      ? 'Straight sets only this week — methods either blocked by role allowance or not earned by composition.'
      : `Used: ${usedMethods.join(', ')}. Unused (with reason): ${methodsUnused.map((u) => `${u.method} (${u.reason})`).join('; ') || 'none'}.`

  return {
    byMethod,
    methodsConsidered,
    methodsUnused,
    visibleSummary,
  }
}
