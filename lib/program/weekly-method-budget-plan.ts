/**
 * =============================================================================
 * [PHASE 4N] WEEKLY METHOD BUDGET PLAN
 *
 * Reads the `TrainingIntentVector` plus a coarse summary of the week's
 * sessions and decides per-method-family WEEKLY verdicts:
 *
 *   - SHOULD_APPLY     — doctrine earns it AND a safe target exists
 *   - MAY_APPLY        — doctrine earns it AND a safe target may exist
 *   - NOT_NEEDED       — intent for this method is below threshold
 *   - BLOCKED_BY_SAFETY — intent earns it but a safety gate vetoes it
 *   - NO_SAFE_TARGET   — intent earns it but no eligible row exists this week
 *   - NOT_CONNECTED    — the engine that would apply it is missing
 *
 * The plan is consumed by the doctrine application corridor (per-session
 * application) and rendered on the Program page (per-method chip + reason).
 *
 * Budgets are conservative on purpose: at most 1–2 instances per week for
 * the heavy fatigue methods (drop_set, rest_pause). This is doctrine, not
 * cosmetic chip-stuffing.
 * =============================================================================
 */

import type { TrainingIntentVector } from './training-intent-vector'

// ---------------------------------------------------------------------------
// PUBLIC TYPES
// ---------------------------------------------------------------------------

export type WeeklyBudgetMethodFamily =
  | 'top_set_backoff'
  | 'drop_set'
  | 'rest_pause'
  | 'cluster'
  | 'superset'
  | 'circuit'
  | 'density_block'
  | 'endurance_density'
  | 'straight_sets'

export type WeeklyMethodBudgetVerdict =
  | 'SHOULD_APPLY'
  | 'MAY_APPLY'
  | 'NOT_NEEDED'
  | 'BLOCKED_BY_SAFETY'
  | 'NO_SAFE_TARGET'
  | 'NOT_CONNECTED'

export interface WeeklyMethodBudgetEntry {
  family: WeeklyBudgetMethodFamily
  verdict: WeeklyMethodBudgetVerdict
  recommendedWeeklyCount: number
  minWeeklyCount: number
  maxWeeklyCount: number
  preferredExerciseRoles: string[]
  blockedExerciseRoles: string[]
  safetyGates: string[]
  reason: string
  sourceIntentSignals: string[]
  sourceDoctrineFamilies: string[]
  /**
   * [PHASE AA1] Why the verdict landed where it did, in audit-friendly form.
   *
   * - `doctrine_earned`     — derived intent score crossed the threshold on
   *                            its own (multi-token goal match, session
   *                            length, advanced benchmarks, etc.)
   * - `user_preference`     — verdict became eligible only because the user
   *                            explicitly checked this method in onboarding
   *                            / settings (`trainingMethodPreferences`)
   * - `doctrine_and_user`   — both signals were independently sufficient
   * - `safety_gate`         — verdict is BLOCKED_BY_SAFETY (recovery /
   *                            tendon / first-week / etc.)
   * - `no_target`           — verdict is NO_SAFE_TARGET (week shape lacks
   *                            an eligible row)
   * - `not_needed`          — neither doctrine nor user preference earns it
   */
  verdictSource?:
    | 'doctrine_earned'
    | 'user_preference'
    | 'doctrine_and_user'
    | 'safety_gate'
    | 'no_target'
    | 'not_needed'
}

export interface WeeklyMethodBudgetPlan {
  version: 'phase-4n'
  byFamily: Record<WeeklyBudgetMethodFamily, WeeklyMethodBudgetEntry>
  totalShouldApply: number
  totalMayApply: number
  totalBlockedOrNotNeeded: number
  appliesPerSessionLimit: number
  warnings: string[]
}

/**
 * Coarse week-shape summary the budget needs. Every field is optional —
 * the budget downgrades to MAY_APPLY when shape data is absent.
 */
export interface WeeklyShapeSummary {
  sessionCount?: number
  hasLoadableStrengthPillar?: boolean
  hasLateAccessoryHypertrophyRow?: boolean
  hasSecondaryStrengthRow?: boolean
  hasConditioningOrCoreRow?: boolean
  hasSafePairableAccessories?: boolean
  alreadyHasGroupedDensityBlock?: boolean
  alreadyHasGroupedSuperset?: boolean
  alreadyHasGroupedCircuit?: boolean
}

// ---------------------------------------------------------------------------
// PUBLIC ENTRY
// ---------------------------------------------------------------------------

export function buildWeeklyMethodBudgetPlan(
  vector: TrainingIntentVector,
  weekShape?: WeeklyShapeSummary
): WeeklyMethodBudgetPlan {
  const shape: WeeklyShapeSummary = weekShape ?? {}
  const sessionCount = shape.sessionCount ?? 4
  const warnings: string[] = []

  const byFamily: Record<WeeklyBudgetMethodFamily, WeeklyMethodBudgetEntry> = {
    top_set_backoff: planTopSetBackoff(vector, shape),
    drop_set: planDropSet(vector, shape, sessionCount),
    rest_pause: planRestPause(vector, shape, sessionCount),
    cluster: planCluster(vector, shape),
    superset: planSuperset(vector, shape),
    circuit: planCircuit(vector, shape),
    density_block: planDensityBlock(vector, shape),
    endurance_density: planEnduranceDensity(vector, shape),
    straight_sets: planStraightSets(vector),
  }

  // [PHASE AA1 OF 3] Classify the SOURCE of each verdict — was it doctrine
  // intent, user explicit preference, both, or a safety/no-target/not-needed
  // path? This is purely additive trace data; the verdict itself is already
  // fixed by the per-family planners. The classifier reads
  // `vector.explicitMethodPreferences` (added in the same phase) so it can
  // distinguish "the user picked this" from "doctrine alone earned this".
  // Used by the weekly materialization plan and the trust accordion to render
  // honest "user preference applied" vs "doctrine-earned" copy without
  // collapsing them into one undifferentiated badge.
  const explicitPrefs = (vector as TrainingIntentVector & {
    explicitMethodPreferences?: string[]
  }).explicitMethodPreferences ?? []
  const familyToCanonicalPref: Record<WeeklyBudgetMethodFamily, string | null> = {
    top_set_backoff: 'top_sets',
    drop_set: 'drop_sets',
    rest_pause: 'rest_pause',
    cluster: 'cluster_sets',
    superset: 'supersets',
    circuit: 'circuits',
    density_block: 'density_blocks',
    endurance_density: 'circuits', // closest user-facing analogue
    straight_sets: 'straight_sets',
  }
  for (const entry of Object.values(byFamily)) {
    const canonicalPref = familyToCanonicalPref[entry.family]
    const userPicked = canonicalPref !== null && explicitPrefs.includes(canonicalPref)
    if (entry.verdict === 'BLOCKED_BY_SAFETY') {
      entry.verdictSource = 'safety_gate'
    } else if (entry.verdict === 'NO_SAFE_TARGET') {
      entry.verdictSource = 'no_target'
    } else if (entry.verdict === 'NOT_NEEDED' || entry.verdict === 'NOT_CONNECTED') {
      // If the user EXPLICITLY picked this method but doctrine still says
      // not-needed, the verdict stays not_needed (we don't override here —
      // the intent vector already lifted the score; if it's still below
      // threshold, the per-family planner has a structural reason). But we
      // record the source as `user_preference` so downstream surfaces can
      // render "you picked this; doctrine did not earn it for this profile"
      // honestly instead of pretending it was never asked for.
      entry.verdictSource = userPicked ? 'user_preference' : 'not_needed'
    } else {
      // SHOULD_APPLY or MAY_APPLY — distinguish doctrine vs user-preference.
      entry.verdictSource = userPicked ? 'doctrine_and_user' : 'doctrine_earned'
    }
  }

  let totalShouldApply = 0
  let totalMayApply = 0
  let totalBlockedOrNotNeeded = 0
  for (const entry of Object.values(byFamily)) {
    if (entry.verdict === 'SHOULD_APPLY') totalShouldApply += 1
    else if (entry.verdict === 'MAY_APPLY') totalMayApply += 1
    else totalBlockedOrNotNeeded += 1
  }

  // Conservative cap on simultaneous fatigue methods per session.
  const appliesPerSessionLimit = vector.recoveryProtectionIntent >= 0.75 ? 1 : 2

  if (vector.skillIntent >= 0.75 && byFamily.top_set_backoff.verdict === 'NO_SAFE_TARGET') {
    warnings.push(
      'Profile carries skill intent but no loadable strength pillar was identified — top set + back-off has no safe target this week.'
    )
  }
  if (vector.confidence === 'low') {
    warnings.push('Vector confidence is low — every verdict should be treated as a soft hint, not a guarantee.')
  }

  return {
    version: 'phase-4n',
    byFamily,
    totalShouldApply,
    totalMayApply,
    totalBlockedOrNotNeeded,
    appliesPerSessionLimit,
    warnings,
  }
}

// ---------------------------------------------------------------------------
// PER-FAMILY PLANNERS
// ---------------------------------------------------------------------------

function planTopSetBackoff(v: TrainingIntentVector, shape: WeeklyShapeSummary): WeeklyMethodBudgetEntry {
  const wantsStrength = v.strengthIntent >= 0.5
  const advanced = v.advancedAthleteSignal >= 0.5
  const hasPillar = shape.hasLoadableStrengthPillar !== false // unknown counts as "maybe"

  if (!wantsStrength) {
    return {
      family: 'top_set_backoff',
      verdict: 'NOT_NEEDED',
      recommendedWeeklyCount: 0,
      minWeeklyCount: 0,
      maxWeeklyCount: 0,
      preferredExerciseRoles: ['primary_strength'],
      blockedExerciseRoles: ['skill_isometric', 'mobility_prehab', 'cooldown_flexibility'],
      safetyGates: ['not_skill_primary_row', 'not_high_skill_protected', 'loadable_strength_pillar'],
      reason: 'Strength intent is below threshold — top set + back-off is not doctrine-needed.',
      sourceIntentSignals: ['strengthIntent'],
      sourceDoctrineFamilies: ['training_method_decision_governor'],
    }
  }
  if (!hasPillar) {
    return {
      family: 'top_set_backoff',
      verdict: 'NO_SAFE_TARGET',
      recommendedWeeklyCount: 0,
      minWeeklyCount: 0,
      maxWeeklyCount: 1,
      preferredExerciseRoles: ['primary_strength'],
      blockedExerciseRoles: ['skill_isometric'],
      safetyGates: ['loadable_strength_pillar_required'],
      reason: 'Strength intent earns it, but no loadable strength pillar exists this week (no weighted pull/dip/row/press identified).',
      sourceIntentSignals: ['strengthIntent', 'advancedAthleteSignal'],
      sourceDoctrineFamilies: ['training_method_decision_governor'],
    }
  }

  const recommended = advanced ? 2 : 1
  return {
    family: 'top_set_backoff',
    verdict: 'SHOULD_APPLY',
    recommendedWeeklyCount: recommended,
    minWeeklyCount: 1,
    maxWeeklyCount: Math.min(sessionCountSafe(shape), 3),
    preferredExerciseRoles: ['primary_strength'],
    blockedExerciseRoles: ['skill_isometric', 'mobility_prehab', 'cooldown_flexibility', 'conditioning'],
    safetyGates: ['not_skill_primary_row', 'not_high_skill_protected', 'loadable_strength_pillar'],
    reason: `Strength intent ${v.strengthIntent.toFixed(2)} earns top set + back-off${advanced ? ' (advanced-athlete signal supports two pillars/week)' : ''}.`,
    sourceIntentSignals: ['strengthIntent', 'advancedAthleteSignal'],
    sourceDoctrineFamilies: ['training_method_decision_governor', 'unified_doctrine_decision_model'],
  }
}

function planDropSet(v: TrainingIntentVector, shape: WeeklyShapeSummary, sessionCount: number): WeeklyMethodBudgetEntry {
  const wantsHypertrophy = v.hypertrophyIntent >= 0.5
  const hasLateAccessory = shape.hasLateAccessoryHypertrophyRow !== false

  if (!wantsHypertrophy) {
    return {
      family: 'drop_set',
      verdict: 'NOT_NEEDED',
      recommendedWeeklyCount: 0,
      minWeeklyCount: 0,
      maxWeeklyCount: 0,
      preferredExerciseRoles: ['accessory_hypertrophy'],
      blockedExerciseRoles: ['skill_isometric', 'primary_strength', 'mobility_prehab'],
      safetyGates: ['late_session_only', 'not_skill_primary_row', 'not_power_explosive'],
      reason: 'Hypertrophy intent is below threshold — drop sets are not doctrine-needed.',
      sourceIntentSignals: ['hypertrophyIntent'],
      sourceDoctrineFamilies: ['training_method_decision_governor'],
    }
  }
  if (!hasLateAccessory) {
    return {
      family: 'drop_set',
      verdict: 'NO_SAFE_TARGET',
      recommendedWeeklyCount: 0,
      minWeeklyCount: 0,
      maxWeeklyCount: 1,
      preferredExerciseRoles: ['accessory_hypertrophy'],
      blockedExerciseRoles: ['skill_isometric', 'primary_strength'],
      safetyGates: ['late_session_only', 'accessory_hypertrophy_role_required'],
      reason: 'Hypertrophy intent earns it, but no late-position accessory_hypertrophy row passes the safety gates this week.',
      sourceIntentSignals: ['hypertrophyIntent'],
      sourceDoctrineFamilies: ['training_method_decision_governor'],
    }
  }
  if (v.tendonProtectionIntent >= 0.75 && v.recoveryProtectionIntent >= 0.75) {
    return {
      family: 'drop_set',
      verdict: 'BLOCKED_BY_SAFETY',
      recommendedWeeklyCount: 0,
      minWeeklyCount: 0,
      maxWeeklyCount: 0,
      preferredExerciseRoles: ['accessory_hypertrophy'],
      blockedExerciseRoles: ['skill_isometric', 'primary_strength'],
      safetyGates: ['recovery_protection', 'tendon_protection'],
      reason: 'Recovery + tendon protection both elevated — drop set fatigue is unsafe this week.',
      sourceIntentSignals: ['recoveryProtectionIntent', 'tendonProtectionIntent'],
      sourceDoctrineFamilies: ['training_method_decision_governor'],
    }
  }

  // Conservative: 1 per week if weekly volume is small, up to 2 only if the
  // user is genuinely hypertrophy-priority AND advanced.
  const recommended = v.hypertrophyIntent >= 0.75 && v.advancedAthleteSignal >= 0.5 && sessionCount >= 4 ? 2 : 1
  return {
    family: 'drop_set',
    verdict: 'SHOULD_APPLY',
    recommendedWeeklyCount: recommended,
    minWeeklyCount: 1,
    maxWeeklyCount: 2,
    preferredExerciseRoles: ['accessory_hypertrophy'],
    blockedExerciseRoles: ['skill_isometric', 'primary_strength', 'mobility_prehab', 'cooldown_flexibility'],
    safetyGates: ['late_session_only', 'not_skill_primary_row', 'not_power_explosive', 'max_one_per_session'],
    reason: `Hypertrophy intent ${v.hypertrophyIntent.toFixed(2)} earns drop set on ${recommended} late accessory row(s) per week.`,
    sourceIntentSignals: ['hypertrophyIntent', 'advancedAthleteSignal'],
    sourceDoctrineFamilies: ['training_method_decision_governor'],
  }
}

function planRestPause(v: TrainingIntentVector, shape: WeeklyShapeSummary, sessionCount: number): WeeklyMethodBudgetEntry {
  // Rest-pause earns on hypertrophy OR strength-endurance AND a safe row.
  const wants = v.hypertrophyIntent >= 0.5 || v.enduranceIntent >= 0.5 || v.strengthIntent >= 0.75
  const hasTarget = (shape.hasLateAccessoryHypertrophyRow !== false) || (shape.hasSecondaryStrengthRow !== false)

  if (!wants) {
    return {
      family: 'rest_pause',
      verdict: 'NOT_NEEDED',
      recommendedWeeklyCount: 0,
      minWeeklyCount: 0,
      maxWeeklyCount: 0,
      preferredExerciseRoles: ['accessory_hypertrophy', 'secondary_strength'],
      blockedExerciseRoles: ['skill_isometric', 'primary_strength', 'mobility_prehab'],
      safetyGates: ['late_session_only', 'not_skill_primary_row'],
      reason: 'Hypertrophy / strength-endurance / strength intents are all below threshold — rest-pause is not doctrine-needed.',
      sourceIntentSignals: ['hypertrophyIntent', 'enduranceIntent', 'strengthIntent'],
      sourceDoctrineFamilies: ['training_method_decision_governor'],
    }
  }
  if (!hasTarget) {
    return {
      family: 'rest_pause',
      verdict: 'NO_SAFE_TARGET',
      recommendedWeeklyCount: 0,
      minWeeklyCount: 0,
      maxWeeklyCount: 1,
      preferredExerciseRoles: ['accessory_hypertrophy', 'secondary_strength'],
      blockedExerciseRoles: ['skill_isometric', 'primary_strength'],
      safetyGates: ['accessory_or_secondary_strength_required'],
      reason: 'Intent earns rest-pause but no late accessory or secondary-strength row exists this week.',
      sourceIntentSignals: ['hypertrophyIntent', 'enduranceIntent', 'strengthIntent'],
      sourceDoctrineFamilies: ['training_method_decision_governor'],
    }
  }
  if (v.recoveryProtectionIntent >= 0.75) {
    return {
      family: 'rest_pause',
      verdict: 'BLOCKED_BY_SAFETY',
      recommendedWeeklyCount: 0,
      minWeeklyCount: 0,
      maxWeeklyCount: 0,
      preferredExerciseRoles: ['accessory_hypertrophy', 'secondary_strength'],
      blockedExerciseRoles: ['skill_isometric'],
      safetyGates: ['recovery_protection'],
      reason: 'Recovery protection elevated — rest-pause fatigue is unsafe this week.',
      sourceIntentSignals: ['recoveryProtectionIntent'],
      sourceDoctrineFamilies: ['training_method_decision_governor'],
    }
  }

  const recommended = sessionCount >= 4 ? 1 : 1
  return {
    family: 'rest_pause',
    verdict: 'SHOULD_APPLY',
    recommendedWeeklyCount: recommended,
    minWeeklyCount: 1,
    maxWeeklyCount: 1,
    preferredExerciseRoles: ['accessory_hypertrophy', 'secondary_strength'],
    blockedExerciseRoles: ['skill_isometric', 'primary_strength', 'mobility_prehab', 'cooldown_flexibility'],
    safetyGates: ['late_session_only', 'not_same_row_as_drop_set', 'max_one_per_session', 'not_skill_primary_row'],
    reason: `Hypertrophy/strength-endurance intent earns rest-pause on ${recommended} late accessory or secondary-strength row this week.`,
    sourceIntentSignals: ['hypertrophyIntent', 'enduranceIntent', 'strengthIntent'],
    sourceDoctrineFamilies: ['training_method_decision_governor'],
  }
}

function planCluster(v: TrainingIntentVector, _shape: WeeklyShapeSummary): WeeklyMethodBudgetEntry {
  // Cluster is a quality-preservation tool. Earns it when strength intent is
  // high AND advanced-athlete signal is moderate+ — otherwise it adds
  // complexity without payoff.
  const earns = v.strengthIntent >= 0.75 && v.advancedAthleteSignal >= 0.5
  if (!earns) {
    return {
      family: 'cluster',
      verdict: 'NOT_NEEDED',
      recommendedWeeklyCount: 0,
      minWeeklyCount: 0,
      maxWeeklyCount: 0,
      preferredExerciseRoles: ['primary_strength', 'secondary_strength'],
      blockedExerciseRoles: ['mobility_prehab', 'cooldown_flexibility'],
      safetyGates: ['quality_preservation_intent', 'not_used_as_fatigue_gimmick'],
      reason: 'Cluster is a quality-preservation tool — strength intent + advanced-athlete signal not high enough to earn it this week.',
      sourceIntentSignals: ['strengthIntent', 'advancedAthleteSignal'],
      sourceDoctrineFamilies: ['training_method_decision_governor'],
    }
  }
  return {
    family: 'cluster',
    verdict: 'MAY_APPLY',
    recommendedWeeklyCount: 1,
    minWeeklyCount: 0,
    maxWeeklyCount: 1,
    preferredExerciseRoles: ['primary_strength', 'secondary_strength'],
    blockedExerciseRoles: ['skill_isometric', 'mobility_prehab', 'cooldown_flexibility'],
    safetyGates: ['quality_preservation_intent', 'safe_accumulation_row'],
    reason: 'Strength + advanced-athlete signals earn cluster as a quality-preservation tool on a high-neural row.',
    sourceIntentSignals: ['strengthIntent', 'advancedAthleteSignal'],
    sourceDoctrineFamilies: ['training_method_decision_governor'],
  }
}

function planSuperset(v: TrainingIntentVector, shape: WeeklyShapeSummary): WeeklyMethodBudgetEntry {
  const wants = v.densityIntent >= 0.5 || v.hypertrophyIntent >= 0.5 || (v.sessionDurationSignal !== null && v.sessionDurationSignal <= 45)
  const hasPair = shape.hasSafePairableAccessories !== false
  if (!wants) {
    return baseEntry('superset', 'NOT_NEEDED', ['accessory_hypertrophy', 'core_or_support'], 'Density / hypertrophy / time-efficiency intent below threshold.', ['densityIntent', 'hypertrophyIntent'])
  }
  if (!hasPair) {
    return baseEntry('superset', 'NO_SAFE_TARGET', ['accessory_hypertrophy', 'core_or_support'], 'Intent earns superset but no safe non-competing accessory pair exists this week.', ['densityIntent', 'hypertrophyIntent'])
  }
  if (shape.alreadyHasGroupedSuperset) {
    return baseEntry('superset', 'SHOULD_APPLY', ['accessory_hypertrophy', 'core_or_support'], 'Builder already grouped a superset; weekly budget confirms doctrine intent.', ['densityIntent', 'hypertrophyIntent'])
  }
  return baseEntry('superset', 'SHOULD_APPLY', ['accessory_hypertrophy', 'core_or_support'], 'Density / hypertrophy intent earns superset on a non-competing pair.', ['densityIntent', 'hypertrophyIntent'])
}

function planCircuit(v: TrainingIntentVector, shape: WeeklyShapeSummary): WeeklyMethodBudgetEntry {
  const wants = v.enduranceIntent >= 0.5 || v.densityIntent >= 0.75
  if (!wants) {
    return baseEntry('circuit', 'NOT_NEEDED', ['conditioning', 'core_or_support'], 'Endurance / density intent below threshold.', ['enduranceIntent', 'densityIntent'])
  }
  if (shape.hasConditioningOrCoreRow === false) {
    return baseEntry('circuit', 'NO_SAFE_TARGET', ['conditioning', 'core_or_support'], 'Endurance intent earns circuit but no safe conditioning / core row exists this week.', ['enduranceIntent'])
  }
  return baseEntry('circuit', 'SHOULD_APPLY', ['conditioning', 'core_or_support'], 'Endurance intent earns circuit on a safe conditioning / core block.', ['enduranceIntent', 'densityIntent'])
}

function planDensityBlock(v: TrainingIntentVector, shape: WeeklyShapeSummary): WeeklyMethodBudgetEntry {
  const wants = v.densityIntent >= 0.5
  if (!wants) {
    return baseEntry('density_block', 'NOT_NEEDED', ['accessory_hypertrophy', 'conditioning'], 'Density intent below threshold.', ['densityIntent'])
  }
  if (shape.hasConditioningOrCoreRow === false && shape.hasLateAccessoryHypertrophyRow === false) {
    return baseEntry('density_block', 'NO_SAFE_TARGET', ['accessory_hypertrophy', 'conditioning'], 'Density intent earns it but no safe accessory / conditioning row exists.', ['densityIntent'])
  }
  return baseEntry('density_block', shape.alreadyHasGroupedDensityBlock ? 'SHOULD_APPLY' : 'MAY_APPLY', ['accessory_hypertrophy', 'conditioning'], 'Density intent earns density block on a safe late accessory / conditioning section.', ['densityIntent'])
}

function planEnduranceDensity(v: TrainingIntentVector, shape: WeeklyShapeSummary): WeeklyMethodBudgetEntry {
  const wants = v.enduranceIntent >= 0.5 || v.densityIntent >= 0.5
  if (!wants) {
    return baseEntry('endurance_density', 'NOT_NEEDED', ['accessory_hypertrophy', 'core_or_support', 'conditioning'], 'Endurance / density intent below threshold.', ['enduranceIntent', 'densityIntent'])
  }
  if (shape.alreadyHasGroupedDensityBlock) {
    return baseEntry('endurance_density', 'NOT_NEEDED', ['accessory_hypertrophy', 'core_or_support', 'conditioning'], 'A grouped density block already represents this intent for the week.', ['densityIntent'])
  }
  return baseEntry('endurance_density', 'SHOULD_APPLY', ['accessory_hypertrophy', 'core_or_support', 'conditioning'], 'Endurance / density intent earns a row-level endurance density application.', ['enduranceIntent', 'densityIntent'])
}

function planStraightSets(_v: TrainingIntentVector): WeeklyMethodBudgetEntry {
  // Straight sets are always the safe baseline; we never block them.
  return {
    family: 'straight_sets',
    verdict: 'SHOULD_APPLY',
    recommendedWeeklyCount: 999,
    minWeeklyCount: 0,
    maxWeeklyCount: 999,
    preferredExerciseRoles: ['skill_isometric', 'primary_strength', 'mobility_prehab', 'cooldown_flexibility'],
    blockedExerciseRoles: [],
    safetyGates: [],
    reason: 'Straight sets are the doctrine-safe default for any row not earning a method.',
    sourceIntentSignals: [],
    sourceDoctrineFamilies: ['training_method_decision_governor'],
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function baseEntry(
  family: WeeklyBudgetMethodFamily,
  verdict: WeeklyMethodBudgetVerdict,
  preferredExerciseRoles: string[],
  reason: string,
  sourceIntentSignals: string[]
): WeeklyMethodBudgetEntry {
  const recommended = verdict === 'SHOULD_APPLY' ? 1 : verdict === 'MAY_APPLY' ? 1 : 0
  return {
    family,
    verdict,
    recommendedWeeklyCount: recommended,
    minWeeklyCount: 0,
    maxWeeklyCount: verdict === 'SHOULD_APPLY' || verdict === 'MAY_APPLY' ? 2 : 0,
    preferredExerciseRoles,
    blockedExerciseRoles: ['skill_isometric'],
    safetyGates: ['not_skill_primary_row'],
    reason,
    sourceIntentSignals,
    sourceDoctrineFamilies: ['training_method_decision_governor'],
  }
}

function sessionCountSafe(shape: WeeklyShapeSummary): number {
  return shape.sessionCount ?? 4
}
