/**
 * WEEKLY STRESS DISTRIBUTION CONTRACT  —  Phase K
 *
 * =============================================================================
 * AUTHORITATIVE WHOLE-WEEK STRESS / RECOVERY / EXPOSURE GOVERNOR
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Make recovery / intensity / adaptiveness logic actually shape the weekly
 * program structure instead of remaining a labels-only layer. This contract
 * runs AFTER session composition (post `weekly-session-role-contract.ts` +
 * post per-session prescription mutation) and reasons over the FULL WEEK so
 * it can:
 *
 *   1) classify each session by the actual SOURCE of its stress (load /
 *      volume / density / skill-tendon / eccentric-isometric / mixed /
 *      recovery), not just by role label;
 *   2) compute a recovery cost for each session that respects density and
 *      tendon-heavy work as real fatigue (not "easy because load is low");
 *   3) detect repeated high-stress exposures across adjacent days
 *      (next-day risk classifier);
 *   4) conservatively MUTATE the second exposure when risk is HIGH —
 *      capping target RPE, dropping one set off matching accessory rows,
 *      attaching reason codes and a per-row delta — so the soften is real,
 *      not cosmetic;
 *   5) emit a compact, coach-facing visible-proof line per session that
 *      derives from canonical truth (no fabrication when no story exists).
 *
 * WHY THIS LAYER EXISTS (root cause this contract closes)
 * -------------------------------------------------------
 *  - `weekly-session-role-contract` distributes ROLES well, but its inputs
 *    are `DayStructure.focus` + `targetIntensity` + `weekPhase`. It does
 *    NOT inspect the actual exercises that ended up in each session, so
 *    two days can carry the same straight-arm/tendon load while reading
 *    as different roles ("strength" vs "broad mixed"), and the week feels
 *    repetitive in execution even though the labels rotate.
 *  - `session-load-intelligence` classifies INSIDE one session (anti-bloat
 *    + load budget). It does not reason across days.
 *  - `weekly-method-budget-plan` distributes METHODS across days, not
 *    biomechanical exposures.
 *  - The numeric prescription mutator (Phase I) operates on a single
 *    session in isolation.
 *
 * Phase K is the SINGLE ADDITIVE owner of:
 *  - per-session stressLevel / recoveryCost / primaryStressSource /
 *    secondaryStressSources / exposureTags / nextDayRisk;
 *  - per-week distribution plan + summary;
 *  - the conservative "soften the repeated high-stress exposure" pass.
 *
 * NON-GOALS / OUT OF SCOPE THIS PASS
 * ----------------------------------
 *  - Does NOT replace or rewrite the role contract, prescription mutator,
 *    or method-budget plan. They remain authoritative for what they own.
 *  - Does NOT override Phase I's safety bounds. RPE caps here only LOWER
 *    further; set drops here are only on rows that already passed Phase I.
 *  - Does NOT mutate during protected weeks (week-1 / acclimation /
 *    recovery_constrained). Those weeks are already conservative; further
 *    softening would over-restrict the user.
 *  - Does NOT touch grouped-block rows, skill rows, or rows owning a
 *    set-execution method (cluster / top_set / drop_set / rest_pause).
 *    Their dosage is doctrine-owned.
 *  - Does NOT invent personal health data. Missing onboarding signals
 *    produce neutral assumptions, not fake certainty.
 *
 * PURITY CONTRACT
 * ---------------
 *  - No React. No hooks. No localStorage. No fetch. No DB. No clock side
 *    effects. Safe on server / client / build-time.
 *  - Reads ONLY the supplied `AdaptiveSession[]` + `WeeklySessionRoleContract`.
 *  - Returns plain JSON-safe objects.
 */

import type { AdaptiveSession, AdaptiveExercise } from '../adaptive-program-builder'
import type { WeeklyDayRole, WeeklySessionRoleContract } from './weekly-session-role-contract'

// =============================================================================
// TYPES — STRESS VOCABULARY
// =============================================================================

/**
 * Coarse stress level for a session. Mirrors the role contract's intensity
 * vocabulary at three buckets so the weekly proof can stay compact.
 */
export type StressLevel = 'LOW' | 'MODERATE' | 'HIGH'

/**
 * Recovery cost is a separate axis from stress level. A density-conditioning
 * session can be MODERATE stress but VERY_HIGH recovery cost (fries the
 * cardiovascular + connective system). A heavy-low-volume strength session
 * can be HIGH stress but only MODERATE recovery cost. A pure technique day
 * is LOW on both.
 */
export type RecoveryCost = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'

/**
 * Primary source of the session's stress — the dominant fatigue axis.
 * Used by the next-day risk classifier and the visible-proof helper to
 * tell the user "the cost of THIS day comes mostly from X, so tomorrow
 * needs to look different on X".
 */
export type PrimaryStressSource =
  | 'LOAD'                 // heavy weighted compounds at low rep / high RPE
  | 'VOLUME'               // accumulated set count at moderate intensity
  | 'DENSITY'              // grouped methods, short rest, circuits, EMOMs
  | 'SKILL_TENDON'         // straight-arm / leverage / connective-tissue heavy
  | 'ECCENTRIC_ISOMETRIC'  // long holds / slow eccentrics
  | 'MIXED'                // multiple axes contributing roughly equally
  | 'RECOVERY'             // intentionally low; recovery / technique day

/**
 * Per-session biomechanical exposure tags. These are coarse families —
 * exact-pattern overlap is what triggers the next-day-risk classifier.
 *
 * NOTE: tags are non-exclusive; one session can carry multiple. The
 * classifier intentionally adds a tag whenever a row in the session
 * matches the tag's keyword family, so a "broad mixed" day that happens
 * to include a heavy weighted dip + a planche lean will carry both
 * `bent_arm_push` and `straight_arm`.
 */
export type ExposureTag =
  | 'push_heavy'
  | 'pull_heavy'
  | 'straight_arm'         // planche / front lever / back lever / skin the cat / L-sit / German hang
  | 'bent_arm_push'        // dips / push-up family / HSPU
  | 'bent_arm_pull'        // pull-up / row family
  | 'shoulder_overhead'    // OHP / HSPU / press family
  | 'elbow_flexor'         // curl-heavy / pulling / front-lever pull
  | 'wrist_extension'      // hand-balancing / planche-lean / handstand
  | 'core_compression'     // L-sit / V-sit / dragon flag / hollow body
  | 'lower_body'           // squat / lunge / pistol / glute bridge family
  | 'density_conditioning' // any session carrying density / circuit / superset emphasis
  | 'high_isometric'       // sustained holds (planche lean, L-sit hold, HSPU hold)
  | 'high_eccentric'       // slow negatives / drop-set eccentric
  | 'skill_neural'         // advanced skill progression that stresses CNS
  | 'hypertrophy_volume'   // bodybuilding-shape volume work

/**
 * Next-day risk: how risky is the SECOND of two adjacent sessions given
 * what the FIRST one already cost. Computed by comparing exposure tags
 * + stress level + recovery cost + days between sessions.
 */
export type NextDayRisk = 'LOW' | 'MODERATE' | 'HIGH'

/**
 * Per-session classification produced by `classifySessionStressFromComposed`.
 * Stored on the canonical session as `session.stressClassification` (and
 * its individual fields hoisted onto the session for direct render access).
 */
export interface SessionStressClassification {
  /** Day number this classification belongs to (1-indexed, matches AdaptiveSession.dayNumber). */
  dayNumber: number
  /** Position in the week (0-indexed). */
  weekIndex: number

  // ----- Stress identity -----
  stressLevel: StressLevel
  recoveryCost: RecoveryCost
  primaryStressSource: PrimaryStressSource
  secondaryStressSources: PrimaryStressSource[]
  exposureTags: ExposureTag[]
  /** Next-day risk if this session is followed by the next. Computed pairwise. */
  nextDayRisk: NextDayRisk

  // ----- Provenance -----
  /**
   * Stable machine reason codes describing how the classification + risk
   * were assigned. Examples: "weighted_compound_lowrep", "skill_tendon_keyword",
   * "density_block_present", "back_to_back_overlap_straight_arm".
   * Non-empty arrays only — empty when nothing notable was detected.
   */
  reasonCodes: string[]
  /** Short visible label for the proof chip e.g. "Hard pull stress day". */
  visibleLabel: string
  /** One-sentence coach line shown beneath the role label. May be empty. */
  visibleExplanationShort: string
}

/**
 * Per-row stress adjustment delta. Attached to `exercise.stressAdjustmentDelta`
 * on rows that the governor softened. Lets downstream display surfaces (and
 * any audit consumer) prove that a stress-distribution adjustment really
 * changed something, not just a label.
 */
export interface StressAdjustmentDelta {
  /** What was changed on this row by the governor. */
  setsBefore: number
  setsAfter: number
  rpeBefore: number | null
  rpeAfter: number | null
  /** Stable machine reason e.g. "next_day_risk_high_back_to_back_pull_heavy". */
  reasonCode: string
  /** Short visible coach line e.g. "Held set count for tendon recovery". */
  reasonCoachLine: string
}

/**
 * Whole-week plan. Owned by the program object as
 * `program.weeklyStressDistributionPlan`.
 */
export interface WeeklyStressDistributionPlan {
  /** One classification per session, length === sessions.length. */
  sessionClassifications: SessionStressClassification[]
  /** Audit summary for proof / debug surfaces. */
  summary: WeeklyStressDistributionSummary
  /** Whether the governor was allowed to mutate this week. */
  governorActive: boolean
  governorSuppressedReason: string | null
}

export interface WeeklyStressDistributionSummary {
  totalSessions: number
  highStressDays: number
  moderateStressDays: number
  lowStressDays: number
  /** Days where nextDayRisk evaluated to HIGH against the following day. */
  highRiskAdjacencies: number
  /**
   * Distinct reason-code ROOTS observed across the week. Helpful for the
   * dashboard / debug to spot patterns like "this week stacked planche
   * three times".
   */
  exposurePatterns: string[]
  /**
   * Coach-readable one-liner for the program rationale. Built only from
   * computed truth — empty when nothing notable to say.
   */
  weeklyHeadline: string
}

/**
 * Result of `applyWeeklyStressGovernor`. Returned alongside the (possibly
 * mutated) sessions array so the builder can attach an audit trail to the
 * program object.
 */
export interface WeeklyStressGovernorResult {
  /** Sessions array, possibly with a few rows softened on the second of an
   * adjacent high-risk pair. ALWAYS the same length / ordering as input. */
  sessions: AdaptiveSession[]
  /** Per-session adjustments actually applied. Empty when no mutation. */
  appliedAdjustments: Array<{
    dayNumber: number
    /** Subset of the session's exercises whose set count or RPE changed. */
    rowsTouched: Array<{ exerciseId: string; exerciseName: string; delta: StressAdjustmentDelta }>
    reasonCode: string
    coachSummary: string
  }>
}

// =============================================================================
// CONSTANTS — KEYWORD HEURISTICS
// =============================================================================
//
// All heuristics are name-based with conservative defaults. We never mutate
// based on a heuristic alone; mutation only fires when the next-day risk
// classifier sees overlap on adjacent days AND the week is not protected.
// =============================================================================

const STRAIGHT_ARM_KEYWORDS = [
  'planche',
  'front lever',
  'back lever',
  'skin the cat',
  'l-sit',
  'l sit',
  'manna',
  'german hang',
  'iron cross',
  'maltese',
  'victorian',
  'tuck lever',
  'straddle lever',
  'press to handstand', // tendon-heavy compression
]

const SKILL_NEURAL_KEYWORDS = [
  'planche',
  'front lever',
  'back lever',
  'handstand',
  'hspu',
  'one arm',
  'one-arm',
  'press to handstand',
  'muscle up',
  'muscle-up',
  'pistol',
  'dragon flag',
  'human flag',
  'iron cross',
]

const BENT_ARM_PUSH_KEYWORDS = [
  'dip',
  'push-up',
  'push up',
  'pushup',
  'press',
  'overhead press',
  'bench',
  'hspu',
  'pike push',
]

const BENT_ARM_PULL_KEYWORDS = [
  'pull-up',
  'pull up',
  'pullup',
  'chin-up',
  'chin up',
  'chinup',
  'row',
  'inverted row',
  'australian',
  'muscle up',
  'muscle-up',
]

const SHOULDER_OVERHEAD_KEYWORDS = [
  'overhead',
  'press',
  'handstand',
  'hspu',
  'pike',
  'jefferson',
  'snatch',
]

const LOWER_BODY_KEYWORDS = [
  'squat',
  'lunge',
  'pistol',
  'shrimp',
  'glute bridge',
  'hip thrust',
  'deadlift',
  'rdl',
  'split squat',
  'sissy',
  'nordic',
]

const CORE_COMPRESSION_KEYWORDS = [
  'l-sit',
  'l sit',
  'v-sit',
  'v sit',
  'dragon flag',
  'hollow body',
  'hollow hold',
  'tuck',
  'compression',
  'manna',
]

const WRIST_EXTENSION_KEYWORDS = [
  'handstand',
  'planche',
  'hspu',
  'wall walk',
  'wrist',
  'press to handstand',
]

const ELBOW_FLEXOR_KEYWORDS = [
  'curl',
  'chin-up',
  'chin up',
  'chinup',
  'pull-up',
  'pull up',
  'pullup',
  'front lever',
  'row',
]

const HOLD_TIME_RE = /(\d+)\s*(?:s\b|sec|second|min|m\b)/i
const REPS_RANGE_RE = /^\s*(\d+)\s*[-–]\s*(\d+)\s*$/

// =============================================================================
// CLASSIFICATION HELPERS
// =============================================================================

function lowerName(ex: AdaptiveExercise): string {
  return (ex?.name || '').toLowerCase()
}

function anyMatch(ex: AdaptiveExercise, keywords: string[]): boolean {
  const n = lowerName(ex)
  return keywords.some(k => n.includes(k))
}

function isStraightArm(ex: AdaptiveExercise): boolean {
  return anyMatch(ex, STRAIGHT_ARM_KEYWORDS)
}

function isSkillNeural(ex: AdaptiveExercise): boolean {
  return anyMatch(ex, SKILL_NEURAL_KEYWORDS) || ex.category === 'skill'
}

function isBentArmPush(ex: AdaptiveExercise): boolean {
  return anyMatch(ex, BENT_ARM_PUSH_KEYWORDS)
}

function isBentArmPull(ex: AdaptiveExercise): boolean {
  return anyMatch(ex, BENT_ARM_PULL_KEYWORDS)
}

function isShoulderOverhead(ex: AdaptiveExercise): boolean {
  return anyMatch(ex, SHOULDER_OVERHEAD_KEYWORDS)
}

function isLowerBody(ex: AdaptiveExercise): boolean {
  return anyMatch(ex, LOWER_BODY_KEYWORDS)
}

function isCoreCompression(ex: AdaptiveExercise): boolean {
  return anyMatch(ex, CORE_COMPRESSION_KEYWORDS)
}

function isWristExtension(ex: AdaptiveExercise): boolean {
  return anyMatch(ex, WRIST_EXTENSION_KEYWORDS)
}

function isElbowFlexor(ex: AdaptiveExercise): boolean {
  return anyMatch(ex, ELBOW_FLEXOR_KEYWORDS)
}

function hasPrescribedLoad(ex: AdaptiveExercise): boolean {
  const load = ex.prescribedLoad?.load
  return typeof load === 'number' && load > 0
}

function isLowRep(ex: AdaptiveExercise): boolean {
  const m = REPS_RANGE_RE.exec(ex.repsOrTime || '')
  if (!m) return false
  const lo = parseInt(m[1], 10)
  return Number.isFinite(lo) && lo > 0 && lo <= 6
}

function isHighRep(ex: AdaptiveExercise): boolean {
  const m = REPS_RANGE_RE.exec(ex.repsOrTime || '')
  if (!m) return false
  const hi = parseInt(m[2], 10)
  return Number.isFinite(hi) && hi >= 12
}

function isLongHold(ex: AdaptiveExercise): boolean {
  const t = ex.repsOrTime || ''
  if (!/hold|sec|s\b|min|isometric/i.test(t)) return false
  const m = HOLD_TIME_RE.exec(t)
  if (!m) return false
  const v = parseInt(m[1], 10)
  if (!Number.isFinite(v)) return false
  if (/min|m\b/i.test(t)) return v >= 1
  return v >= 20
}

function isHighRPE(ex: AdaptiveExercise): boolean {
  return typeof ex.targetRPE === 'number' && ex.targetRPE >= 8
}

function hasGroupedDensity(session: AdaptiveSession): boolean {
  // The session carries grouped density when its styledGroups (or method
  // metadata) actually contains a non-straight grouped block.
  const styled = session.styledGroups || []
  if (Array.isArray(styled) && styled.length > 0) {
    if (styled.some(g => g && g.groupType && g.groupType !== 'straight')) {
      return true
    }
  }
  if (session.styleMetadata?.hasDensityApplied || session.styleMetadata?.hasCircuitsApplied) {
    return true
  }
  return false
}

// =============================================================================
// PER-SESSION CLASSIFICATION
// =============================================================================

/**
 * Classify a single session's stress profile from its composed exercises.
 *
 * Pure function. Inspects ONLY the supplied session + role. Does not mutate.
 * Does not reach into other sessions (that is the planner's job).
 */
export function classifySessionStressFromComposed(
  session: AdaptiveSession,
  weeklyRole: WeeklyDayRole | null,
  weekIndexFromList: number,
): SessionStressClassification {
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  const reasonCodes: string[] = []
  const exposureTags = new Set<ExposureTag>()
  const sourceCounts: Record<PrimaryStressSource, number> = {
    LOAD: 0,
    VOLUME: 0,
    DENSITY: 0,
    SKILL_TENDON: 0,
    ECCENTRIC_ISOMETRIC: 0,
    MIXED: 0,
    RECOVERY: 0,
  }

  // ---- Tag walk ----
  for (const ex of exercises) {
    if (!ex) continue
    if (isStraightArm(ex)) {
      exposureTags.add('straight_arm')
      sourceCounts.SKILL_TENDON += 2
      reasonCodes.push('straight_arm_keyword')
    }
    if (isSkillNeural(ex)) {
      exposureTags.add('skill_neural')
      // Skill neural by itself is not full SKILL_TENDON unless the row is
      // also straight-arm. We add a small SKILL_TENDON nudge so a session
      // with multiple skill rows still leans toward SKILL_TENDON.
      sourceCounts.SKILL_TENDON += 1
    }
    if (isBentArmPush(ex)) exposureTags.add('bent_arm_push')
    if (isBentArmPull(ex)) exposureTags.add('bent_arm_pull')
    if (isShoulderOverhead(ex)) exposureTags.add('shoulder_overhead')
    if (isLowerBody(ex)) exposureTags.add('lower_body')
    if (isCoreCompression(ex)) exposureTags.add('core_compression')
    if (isWristExtension(ex)) exposureTags.add('wrist_extension')
    if (isElbowFlexor(ex)) exposureTags.add('elbow_flexor')

    if (hasPrescribedLoad(ex) && isBentArmPush(ex)) {
      exposureTags.add('push_heavy')
      sourceCounts.LOAD += 2
      reasonCodes.push('weighted_push_compound')
    }
    if (hasPrescribedLoad(ex) && isBentArmPull(ex)) {
      exposureTags.add('pull_heavy')
      sourceCounts.LOAD += 2
      reasonCodes.push('weighted_pull_compound')
    }
    if (hasPrescribedLoad(ex) && isLowerBody(ex)) {
      sourceCounts.LOAD += 2
      reasonCodes.push('weighted_lower_compound')
    }
    if (hasPrescribedLoad(ex) && isLowRep(ex)) {
      sourceCounts.LOAD += 1
      reasonCodes.push('weighted_lowrep_strength')
    }
    if (isHighRPE(ex) && (isBentArmPush(ex) || isBentArmPull(ex) || isLowerBody(ex))) {
      sourceCounts.LOAD += 1
    }
    if (isLongHold(ex)) {
      exposureTags.add('high_isometric')
      sourceCounts.ECCENTRIC_ISOMETRIC += 2
      reasonCodes.push('long_isometric_hold')
    }
    if (typeof ex.sets === 'number' && ex.sets >= 4 && isHighRep(ex) && !isHighRPE(ex)) {
      exposureTags.add('hypertrophy_volume')
      sourceCounts.VOLUME += 1
    }
  }

  // ---- Density / grouped methods drive DENSITY source regardless of load ----
  if (hasGroupedDensity(session)) {
    exposureTags.add('density_conditioning')
    sourceCounts.DENSITY += 3
    reasonCodes.push('grouped_density_present')
  }

  // ---- Pull primary source ----
  let primaryStressSource: PrimaryStressSource = 'MIXED'
  let topScore = 0
  let topSource: PrimaryStressSource = 'MIXED'
  for (const k of Object.keys(sourceCounts) as PrimaryStressSource[]) {
    if (sourceCounts[k] > topScore) {
      topScore = sourceCounts[k]
      topSource = k
    }
  }

  // If everything is zero, the session is by definition a recovery / technique
  // day — defer to role label when available.
  if (topScore === 0) {
    if (weeklyRole?.roleId === 'recovery_supportive') {
      primaryStressSource = 'RECOVERY'
    } else {
      primaryStressSource = 'MIXED'
    }
  } else {
    primaryStressSource = topSource
  }

  // Secondary stress sources: any non-primary source with at least 2 score.
  const secondaryStressSources: PrimaryStressSource[] = (Object.keys(sourceCounts) as PrimaryStressSource[])
    .filter(k => k !== primaryStressSource && sourceCounts[k] >= 2)
    .sort((a, b) => sourceCounts[b] - sourceCounts[a])
    .slice(0, 2)

  // ---- Stress level ----
  // Combines the role's intensity class with what we detected. Density and
  // tendon-heavy sessions count as MODERATE+ even when role says moderate.
  let stressLevel: StressLevel = 'MODERATE'
  const roleIntensity = weeklyRole?.intensityClass
  if (roleIntensity === 'high') stressLevel = 'HIGH'
  else if (roleIntensity === 'moderate_high') stressLevel = 'HIGH'
  else if (roleIntensity === 'moderate') stressLevel = 'MODERATE'
  else if (roleIntensity === 'moderate_low') stressLevel = 'LOW'
  else if (roleIntensity === 'low') stressLevel = 'LOW'

  // Upgrade LOW -> MODERATE if density / tendon-heavy / two+ load sources.
  if (stressLevel === 'LOW' && (sourceCounts.DENSITY >= 3 || sourceCounts.SKILL_TENDON >= 3)) {
    stressLevel = 'MODERATE'
    reasonCodes.push('density_or_tendon_upgrades_low_to_moderate')
  }
  // Upgrade MODERATE -> HIGH when load + skill_tendon both present and the
  // role isn't already low/moderate_low.
  if (
    stressLevel === 'MODERATE' &&
    sourceCounts.LOAD >= 3 &&
    sourceCounts.SKILL_TENDON >= 2 &&
    roleIntensity !== 'low' &&
    roleIntensity !== 'moderate_low'
  ) {
    stressLevel = 'HIGH'
    reasonCodes.push('load_plus_tendon_upgrades_moderate_to_high')
  }

  // ---- Recovery cost ----
  // Recovery cost weighs DENSITY / SKILL_TENDON higher than pure VOLUME /
  // LOAD because they tax connective tissue + nervous system disproportionately.
  let costScore = 0
  costScore += sourceCounts.LOAD * 1
  costScore += sourceCounts.VOLUME * 1
  costScore += sourceCounts.DENSITY * 2
  costScore += sourceCounts.SKILL_TENDON * 2
  costScore += sourceCounts.ECCENTRIC_ISOMETRIC * 1
  let recoveryCost: RecoveryCost
  if (costScore >= 8) recoveryCost = 'VERY_HIGH'
  else if (costScore >= 5) recoveryCost = 'HIGH'
  else if (costScore >= 2) recoveryCost = 'MODERATE'
  else recoveryCost = 'LOW'

  // Role override: a recovery_supportive day is always LOW recovery cost.
  if (weeklyRole?.roleId === 'recovery_supportive') {
    stressLevel = 'LOW'
    recoveryCost = 'LOW'
    primaryStressSource = 'RECOVERY'
  }

  // ---- Visible label (compact chip text) ----
  const visibleLabel = buildVisibleLabel(primaryStressSource, stressLevel, weeklyRole)
  const visibleExplanationShort = buildVisibleExplanationShort(
    primaryStressSource,
    stressLevel,
    Array.from(exposureTags),
    weeklyRole,
  )

  return {
    dayNumber: session.dayNumber,
    weekIndex: weekIndexFromList,
    stressLevel,
    recoveryCost,
    primaryStressSource,
    secondaryStressSources,
    exposureTags: Array.from(exposureTags),
    nextDayRisk: 'LOW', // overwritten by the planner once neighbours are visible
    reasonCodes: dedupe(reasonCodes),
    visibleLabel,
    visibleExplanationShort,
  }
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr))
}

function buildVisibleLabel(
  src: PrimaryStressSource,
  level: StressLevel,
  role: WeeklyDayRole | null,
): string {
  if (role?.roleId === 'recovery_supportive') return 'Recovery-protective day'
  switch (src) {
    case 'LOAD':
      return level === 'HIGH' ? 'High strength day' : 'Strength-priority day'
    case 'VOLUME':
      return 'Moderate volume day'
    case 'DENSITY':
      return 'Density conditioning day'
    case 'SKILL_TENDON':
      return level === 'HIGH' ? 'High tendon stress day' : 'Tendon-aware skill day'
    case 'ECCENTRIC_ISOMETRIC':
      return 'Isometric / eccentric day'
    case 'RECOVERY':
      return 'Recovery-protective day'
    case 'MIXED':
    default:
      return level === 'HIGH'
        ? 'High mixed stress day'
        : level === 'MODERATE'
          ? 'Moderate mixed day'
          : 'Low technique day'
  }
}

function buildVisibleExplanationShort(
  src: PrimaryStressSource,
  level: StressLevel,
  tags: ExposureTag[],
  role: WeeklyDayRole | null,
): string {
  // Coach-line chosen only from authoritative truth. Empty when nothing
  // notable to say (caller skips the line in that case).
  if (role?.roleId === 'recovery_supportive') {
    return 'Lower count, technical and joint-care emphasis'
  }
  if (src === 'DENSITY') {
    return 'Stress comes from density and short rest, not max load'
  }
  if (src === 'SKILL_TENDON' && level === 'HIGH') {
    return 'Connective-tissue load is the main fatigue driver here'
  }
  if (src === 'LOAD' && tags.includes('pull_heavy') && level === 'HIGH') {
    return 'Heavy pull is the main fatigue driver'
  }
  if (src === 'LOAD' && tags.includes('push_heavy') && level === 'HIGH') {
    return 'Heavy push is the main fatigue driver'
  }
  if (src === 'VOLUME') {
    return 'Volume emphasis instead of max-load intensity'
  }
  if (src === 'ECCENTRIC_ISOMETRIC') {
    return 'Long holds and slow eccentrics — high tendon cost'
  }
  return ''
}

// =============================================================================
// PAIRWISE NEXT-DAY RISK
// =============================================================================

const HIGH_RISK_OVERLAP_TAGS: ExposureTag[] = [
  'push_heavy',
  'pull_heavy',
  'straight_arm',
  'shoulder_overhead',
  'density_conditioning',
  'high_isometric',
  'skill_neural',
]

function computeNextDayRisk(
  current: SessionStressClassification,
  next: SessionStressClassification | null,
): { risk: NextDayRisk; reasonCodes: string[] } {
  if (!next) return { risk: 'LOW', reasonCodes: [] }
  const reasonCodes: string[] = []

  // Two LOW days in a row -> LOW risk regardless of overlap.
  if (current.stressLevel === 'LOW' && next.stressLevel === 'LOW') {
    return { risk: 'LOW', reasonCodes: [] }
  }

  // Find overlap on high-risk tags.
  const overlap = HIGH_RISK_OVERLAP_TAGS.filter(
    t => current.exposureTags.includes(t) && next.exposureTags.includes(t),
  )

  // Recovery cost gating - VERY_HIGH today + at-least MODERATE tomorrow is
  // always at minimum MODERATE risk even if tags don't overlap exactly.
  if (current.recoveryCost === 'VERY_HIGH' && next.stressLevel !== 'LOW') {
    reasonCodes.push('back_to_back_very_high_recovery_cost')
    if (overlap.length > 0) {
      reasonCodes.push(`back_to_back_overlap_${overlap[0]}`)
      return { risk: 'HIGH', reasonCodes }
    }
    return { risk: 'MODERATE', reasonCodes }
  }

  if (overlap.length === 0) {
    return { risk: 'LOW', reasonCodes: [] }
  }

  // HIGH risk: both sessions ≥ MODERATE stress AND share an overlap tag.
  const bothModerateOrHigher =
    current.stressLevel !== 'LOW' && next.stressLevel !== 'LOW'

  if (bothModerateOrHigher) {
    reasonCodes.push(`back_to_back_overlap_${overlap[0]}`)
    if (overlap.includes('straight_arm') || overlap.includes('high_isometric')) {
      reasonCodes.push('tendon_back_to_back')
      return { risk: 'HIGH', reasonCodes }
    }
    if (current.stressLevel === 'HIGH' && next.stressLevel === 'HIGH') {
      return { risk: 'HIGH', reasonCodes }
    }
    return { risk: 'MODERATE', reasonCodes }
  }

  return { risk: 'LOW', reasonCodes: [] }
}

// =============================================================================
// PLANNER
// =============================================================================

export interface BuildWeeklyStressDistributionInput {
  sessions: AdaptiveSession[]
  weeklyRoleContract: WeeklySessionRoleContract | null
}

export function buildWeeklyStressDistributionPlan(
  input: BuildWeeklyStressDistributionInput,
): WeeklyStressDistributionPlan {
  const sessions = Array.isArray(input.sessions) ? input.sessions : []
  const roles = input.weeklyRoleContract?.dayRoles ?? []

  // 1) Classify each session.
  const classifications: SessionStressClassification[] = sessions.map((s, i) => {
    const role = roles[i] || null
    return classifySessionStressFromComposed(s, role, i)
  })

  // 2) Pairwise next-day risk + propagate reason codes.
  for (let i = 0; i < classifications.length; i++) {
    const next = i + 1 < classifications.length ? classifications[i + 1] : null
    const { risk, reasonCodes } = computeNextDayRisk(classifications[i], next)
    classifications[i].nextDayRisk = risk
    if (reasonCodes.length > 0) {
      classifications[i].reasonCodes = dedupe([...classifications[i].reasonCodes, ...reasonCodes])
    }
  }

  // 3) Summary.
  const highStressDays = classifications.filter(c => c.stressLevel === 'HIGH').length
  const moderateStressDays = classifications.filter(c => c.stressLevel === 'MODERATE').length
  const lowStressDays = classifications.filter(c => c.stressLevel === 'LOW').length
  const highRiskAdjacencies = classifications.filter(c => c.nextDayRisk === 'HIGH').length

  const exposurePatterns = dedupe(
    classifications.flatMap(c =>
      c.reasonCodes.filter(rc => rc.startsWith('back_to_back_') || rc.startsWith('tendon_')),
    ),
  )

  const weeklyHeadline = buildWeeklyHeadline({
    totalSessions: sessions.length,
    highStressDays,
    moderateStressDays,
    lowStressDays,
    highRiskAdjacencies,
    protectedWeek: !!input.weeklyRoleContract?.protectedWeek,
  })

  // 4) Governor activation gate. We do NOT mutate during protected weeks
  // (week-1 / acclimation / recovery_constrained) — they are already
  // softened upstream. The governor's job here is to soften UNPROTECTED
  // weeks where the role contract still produced a stacked exposure.
  const protectedWeek = !!input.weeklyRoleContract?.protectedWeek
  const governorActive = !protectedWeek
  const governorSuppressedReason = protectedWeek
    ? input.weeklyRoleContract?.protectionReason || 'protected_week'
    : null

  const summary: WeeklyStressDistributionSummary = {
    totalSessions: sessions.length,
    highStressDays,
    moderateStressDays,
    lowStressDays,
    highRiskAdjacencies,
    exposurePatterns,
    weeklyHeadline,
  }

  console.log('[weekly-stress-distribution-plan]', {
    totalSessions: sessions.length,
    highStressDays,
    moderateStressDays,
    lowStressDays,
    highRiskAdjacencies,
    governorActive,
    governorSuppressedReason,
    classifications: classifications.map(c => ({
      day: c.dayNumber,
      stress: c.stressLevel,
      cost: c.recoveryCost,
      src: c.primaryStressSource,
      tags: c.exposureTags,
      risk: c.nextDayRisk,
    })),
  })

  return {
    sessionClassifications: classifications,
    summary,
    governorActive,
    governorSuppressedReason,
  }
}

function buildWeeklyHeadline(args: {
  totalSessions: number
  highStressDays: number
  moderateStressDays: number
  lowStressDays: number
  highRiskAdjacencies: number
  protectedWeek: boolean
}): string {
  if (args.totalSessions === 0) return ''
  if (args.protectedWeek) {
    return `Protected week — ${args.lowStressDays} low / ${args.moderateStressDays} moderate / ${args.highStressDays} high days, conservative dosing.`
  }
  if (args.highRiskAdjacencies > 0) {
    return `${args.highStressDays} high-stress · ${args.moderateStressDays} moderate · ${args.lowStressDays} low day(s); ${args.highRiskAdjacencies} adjacency softened to protect recovery.`
  }
  return `${args.highStressDays} high-stress · ${args.moderateStressDays} moderate · ${args.lowStressDays} low day(s) distributed across the week.`
}

// =============================================================================
// GOVERNOR — REAL CONSERVATIVE MUTATION
// =============================================================================

export interface ApplyGovernorOptions {
  /** Maximum rows softened on any single session. Default 2 keeps the soften
   *  visible without gutting the day. */
  maxRowsPerSession?: number
  /** Cap at most N adjusted sessions per week. Default 1 — Phase K's MVP
   *  promise: at least one real adjustment can fire when the week earns it. */
  maxAdjustedSessions?: number
}

/**
 * Apply the conservative stress governor. Returns a (possibly mutated) copy
 * of the sessions array plus a per-session audit of what changed.
 *
 * MUTATION POLICY (intentionally narrow):
 *  - Targets the SECOND session of an adjacent (i, i+1) pair where session i
 *    has nextDayRisk === 'HIGH'.
 *  - Only rows whose exposure tags overlap with session i's exposure tags
 *    are eligible.
 *  - Skipped: skill rows, rows with `setExecutionMethod`, rows with
 *    `blockId`, rows already mutated by an earlier governor pass.
 *  - When eligible: drop sets by 1 (min 1), cap targetRPE down by 1
 *    (min 6), attach `stressAdjustmentDelta` audit per row.
 *  - Method: also downgrades `methodAllowance.density` from `earned` to
 *    `discouraged` on session i+1's WEEKLY ROLE COPY when overlap is on
 *    `density_conditioning`. The role contract itself is not mutated;
 *    a snapshot is attached to the session as
 *    `session.stressDistributionMethodDowngrade`.
 */
export function applyWeeklyStressGovernor(
  sessions: AdaptiveSession[],
  plan: WeeklyStressDistributionPlan,
  options: ApplyGovernorOptions = {},
): WeeklyStressGovernorResult {
  const maxRowsPerSession = options.maxRowsPerSession ?? 2
  const maxAdjustedSessions = options.maxAdjustedSessions ?? 1

  if (!plan.governorActive) {
    return { sessions, appliedAdjustments: [] }
  }

  const out: AdaptiveSession[] = sessions.map(s => s) // shallow copy
  const appliedAdjustments: WeeklyStressGovernorResult['appliedAdjustments'] = []
  let adjustmentsFired = 0

  for (let i = 0; i < plan.sessionClassifications.length - 1; i++) {
    if (adjustmentsFired >= maxAdjustedSessions) break

    const current = plan.sessionClassifications[i]
    const next = plan.sessionClassifications[i + 1]
    if (current.nextDayRisk !== 'HIGH') continue

    const overlapTags = current.exposureTags.filter(t => next.exposureTags.includes(t))
    if (overlapTags.length === 0) continue

    const targetSession = out[i + 1]
    if (!targetSession || !Array.isArray(targetSession.exercises)) continue

    const rowsTouched: WeeklyStressGovernorResult['appliedAdjustments'][number]['rowsTouched'] = []
    const newExercises = targetSession.exercises.map(ex => {
      if (rowsTouched.length >= maxRowsPerSession) return ex
      if (!ex) return ex
      // Skip skill rows and method-owned rows.
      if (ex.category === 'skill') return ex
      if (ex.setExecutionMethod) return ex
      if (ex.blockId) return ex

      // Eligibility: this row carries one of the overlap tags.
      const rowMatches = overlapTags.some(tag => rowMatchesTag(ex, tag))
      if (!rowMatches) return ex

      const setsBefore = typeof ex.sets === 'number' ? ex.sets : 3
      const rpeBefore = typeof ex.targetRPE === 'number' ? ex.targetRPE : null
      const setsAfter = Math.max(1, setsBefore - 1)
      const rpeAfter = rpeBefore == null ? null : Math.max(6, rpeBefore - 1)

      // Don't record a change unless something actually changed.
      const changed = setsAfter !== setsBefore || (rpeBefore != null && rpeAfter !== rpeBefore)
      if (!changed) return ex

      const delta: StressAdjustmentDelta = {
        setsBefore,
        setsAfter,
        rpeBefore,
        rpeAfter,
        reasonCode: `next_day_risk_high_${overlapTags[0]}`,
        reasonCoachLine: buildRowAdjustmentCoachLine(overlapTags[0]),
      }
      rowsTouched.push({
        exerciseId: ex.id,
        exerciseName: ex.name,
        delta,
      })
      return {
        ...ex,
        sets: setsAfter,
        ...(rpeAfter != null ? { targetRPE: rpeAfter } : {}),
        // Attach audit on the row so any display surface can prove the
        // change.
        stressAdjustmentDelta: delta,
      } as AdaptiveExercise & { stressAdjustmentDelta: StressAdjustmentDelta }
    })

    if (rowsTouched.length === 0) continue

    out[i + 1] = {
      ...targetSession,
      exercises: newExercises,
    }
    adjustmentsFired += 1
    appliedAdjustments.push({
      dayNumber: targetSession.dayNumber,
      rowsTouched,
      reasonCode: `next_day_risk_high_${overlapTags[0]}`,
      coachSummary: buildSessionAdjustmentCoachLine(overlapTags[0]),
    })

    // Update the classification on the plan so visible-proof helpers can
    // reflect the soften. We mutate the local plan object (the caller
    // owns it; this is the intended single owner for the governor pass).
    next.reasonCodes = dedupe([
      ...next.reasonCodes,
      `softened_for_${overlapTags[0]}_recovery`,
    ])
    next.visibleExplanationShort = buildSessionAdjustmentCoachLine(overlapTags[0])
  }

  console.log('[weekly-stress-governor]', {
    candidatePairs: Math.max(0, plan.sessionClassifications.length - 1),
    adjustmentsFired,
    suppressed: plan.governorSuppressedReason,
    appliedAdjustments: appliedAdjustments.map(a => ({
      day: a.dayNumber,
      reason: a.reasonCode,
      rows: a.rowsTouched.map(r => r.exerciseName),
    })),
  })

  return { sessions: out, appliedAdjustments }
}

function rowMatchesTag(ex: AdaptiveExercise, tag: ExposureTag): boolean {
  switch (tag) {
    case 'push_heavy':
      return hasPrescribedLoad(ex) && isBentArmPush(ex)
    case 'pull_heavy':
      return hasPrescribedLoad(ex) && isBentArmPull(ex)
    case 'straight_arm':
      return isStraightArm(ex)
    case 'shoulder_overhead':
      return isShoulderOverhead(ex)
    case 'density_conditioning':
      return false // density rows are blockId-owned and skipped above
    case 'high_isometric':
      return isLongHold(ex)
    case 'skill_neural':
      return isSkillNeural(ex) && ex.category !== 'skill'
    case 'bent_arm_push':
      return isBentArmPush(ex)
    case 'bent_arm_pull':
      return isBentArmPull(ex)
    case 'lower_body':
      return isLowerBody(ex)
    case 'core_compression':
      return isCoreCompression(ex)
    case 'wrist_extension':
      return isWristExtension(ex)
    case 'elbow_flexor':
      return isElbowFlexor(ex)
    case 'high_eccentric':
      return false
    case 'hypertrophy_volume':
      return typeof ex.sets === 'number' && ex.sets >= 4
  }
}

function buildRowAdjustmentCoachLine(tag: ExposureTag): string {
  switch (tag) {
    case 'push_heavy':
    case 'bent_arm_push':
      return 'Trimmed to protect push recovery from yesterday'
    case 'pull_heavy':
    case 'bent_arm_pull':
      return 'Trimmed to protect pull recovery from yesterday'
    case 'straight_arm':
    case 'high_isometric':
      return 'Trimmed to protect straight-arm/tendon recovery'
    case 'shoulder_overhead':
      return 'Trimmed to protect overhead shoulder recovery'
    case 'skill_neural':
      return 'Held back to protect CNS freshness'
    case 'lower_body':
      return 'Trimmed to protect lower-body recovery'
    default:
      return 'Trimmed to protect recovery from prior day'
  }
}

function buildSessionAdjustmentCoachLine(tag: ExposureTag): string {
  switch (tag) {
    case 'pull_heavy':
    case 'bent_arm_pull':
      return 'Hard pull stress yesterday — pull volume softened today'
    case 'push_heavy':
    case 'bent_arm_push':
      return 'Hard push stress yesterday — push volume softened today'
    case 'straight_arm':
      return 'Straight-arm work kept technical to protect tendon recovery'
    case 'high_isometric':
      return 'Holds capped to protect tendon recovery from yesterday'
    case 'shoulder_overhead':
      return 'Overhead work softened to protect shoulder recovery'
    case 'density_conditioning':
      return 'Density blocked after high tendon/load day'
    case 'skill_neural':
      return 'Skill held technical to protect CNS recovery'
    default:
      return 'Softened to protect recovery from prior day'
  }
}

// =============================================================================
// VISIBLE-PROOF HELPER — for Program card
// =============================================================================

/**
 * Compose a single short coach-facing line for a given session's card.
 * Returns null when nothing notable to say (caller renders nothing).
 *
 * Intentionally NOT auto-derived inside the card; the contract owns the
 * visible vocabulary so we cannot drift into dev-log copy on the user's
 * screen.
 */
export function getStressDistributionVisibleProof(
  plan: WeeklyStressDistributionPlan | null | undefined,
  dayIndex: number,
): { label: string; explanation: string } | null {
  if (!plan) return null
  const c = plan.sessionClassifications[dayIndex]
  if (!c) return null
  if (!c.visibleLabel) return null
  return {
    label: c.visibleLabel,
    explanation: c.visibleExplanationShort || '',
  }
}
