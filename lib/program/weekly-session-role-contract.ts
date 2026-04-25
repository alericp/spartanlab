/**
 * WEEKLY SESSION ROLE CONTRACT
 *
 * =============================================================================
 * AUTHORITATIVE PROGRAM-LEVEL ORCHESTRATION OF WEEKLY DAY ROLES
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Distribute differentiated session roles ACROSS the training week so every
 * day in the week has a distinct stress character, breadth target, and
 * progression intent — not six watered-down copies.
 *
 * WHY THIS EXISTS (root-cause that this contract closes)
 * ------------------------------------------------------
 * Before this contract:
 *  - `DayStructure.focus` describes movement family (push/pull/skill/mixed)
 *    but not weekly stress role.
 *  - `SessionIntent.sessionType` (variety engine) maps to a static distribution
 *    that can repeat the same `sessionType` twice within one week.
 *  - `SessionCompositionBlueprint.sessionComplexity` is decided primarily from
 *    sessionMinutes + recoveryCapacity + weekPhase, so all six 60-min sessions
 *    in a flexible 6-day week can collapse into the same `standard` tier.
 *  - `unifiedDoctrineDecision.maxTotalExercisesPerSession` is global, not
 *    per-day, so days cannot honestly differ in breadth.
 *  - Week-phase truth (acclimation / peak / consolidation) modulates the whole
 *    week without differentiating stress across the days IN that week.
 *
 * This contract is the SINGLE owner of:
 *  1) Each day's WEEKLY role (heavier strength day vs skill quality day vs
 *     broader mixed day vs density-capacity day vs supportive recovery day).
 *  2) Per-day intensity class (high / moderate-high / moderate / moderate-low / low).
 *  3) Per-day breadth target (target exercise-count band).
 *  4) Per-day progression character (direct load / banded support /
 *     conservative skill / mixed breadth / recovery quality).
 *  5) Per-day method allowance (density / supersets / circuits / finisher).
 *
 * PHILOSOPHY
 * ----------
 *  - Differentiation is REAL, not cosmetic. Roles must materially change
 *    `breadthTarget`, `intensityClass`, and `methodAllowance` across days.
 *  - Acclimation / week phase MODULATES intensity classes and method gates,
 *    but does NOT collapse role differentiation. Even week 1, the heavier-
 *    relative day still reads as the heavier day, just with protected dosage.
 *  - Honors saved doctrine: prefer adapting exercise count / progression /
 *    intensity character BEFORE reducing day count.
 *  - Methods are GATED by role. They are not sprayed across the week just
 *    because the user picked styles. A `recovery_supportive` day cannot
 *    earn density; a `density_capacity` day is the natural home for it.
 *
 * NON-GOALS (out of scope this pass)
 * ----------------------------------
 *  - This pass does NOT visibly materialize top sets / drop sets / circuits /
 *    clusters as new flashy features. It establishes the authoritative
 *    weekly role contract those methods can later be gated by safely.
 */

import type { DayStructure } from '../program-structure-engine'
import type { SessionIntent } from '../session-variety-engine'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Weekly session role identity.
 *
 * These are the ONLY roles. A day in the week is exactly one of these.
 * Roles describe weekly STRESS CHARACTER, not movement family. A pull day and
 * a push day can both be `primary_strength_emphasis`.
 */
export type WeeklySessionRoleId =
  | 'primary_strength_emphasis' // The heavier-relative day. Direct load, narrower breadth, top-end RPE-cap permitted.
  | 'skill_quality_emphasis' // CNS-fresh, fewer exercises, banded/assisted support, conservative dosage. The skill-priority day.
  | 'broad_mixed_volume' // The broader mixed day. More exercises, moderate intensity, balanced breadth.
  | 'secondary_support' // Volume-direct moderate intensity. Carryover/secondary skill expression.
  | 'density_capacity' // The natural home for density / supersets / circuits when the week earns them.
  | 'recovery_supportive' // Lower exercise count, low intensity, technical/joint-care emphasis.

export type WeeklyIntensityClass =
  | 'high' // Top end allowed (heavier day in peak).
  | 'moderate_high' // Working but not max (e.g., strength day in ramp-up).
  | 'moderate' // Standard productive intensity.
  | 'moderate_low' // Light productive (volume / density without spike).
  | 'low' // Recovery-bias / technical / joint care.

export type WeeklyProgressionCharacter =
  | 'direct_load' // Push the load / progression directly.
  | 'banded_support' // Use band-supported / assisted variants to manage stress.
  | 'conservative_skill' // Hold progression, prioritize quality reps.
  | 'mixed_breadth' // Multiple progressions across exercises, moderate stress.
  | 'volume_direct' // Push volume rather than peak load.
  | 'recovery_quality' // Range / form / technique only.

/**
 * Method allowance per role.
 *
 * `blocked`     — must NOT appear on this day (e.g., density on a recovery day).
 * `discouraged` — only if explicitly earned by other strong signals.
 * `allowed`     — may appear if doctrine / composition agrees.
 * `earned`      — this role is the natural home; preferred.
 */
export type WeeklyMethodGate = 'blocked' | 'discouraged' | 'allowed' | 'earned'

export interface WeeklyMethodAllowance {
  density: WeeklyMethodGate
  supersets: WeeklyMethodGate
  circuits: WeeklyMethodGate
  finisher: WeeklyMethodGate
  cluster: WeeklyMethodGate
}

/**
 * Per-day role assignment. There is exactly one of these per generated session.
 */
export interface WeeklyDayRole {
  /** 1-indexed day number this role belongs to (matches DayStructure.dayNumber). */
  dayNumber: number
  /** Position in the week (0-indexed). */
  weekIndex: number

  // ----- Identity -----
  roleId: WeeklySessionRoleId
  /** Short visible label e.g. "Heavier strength day". MAX ~28 chars. */
  roleLabel: string
  /** One-sentence purpose suitable for the program-page chip / sub-header. */
  roleDescription: string

  // ----- Stress character -----
  intensityClass: WeeklyIntensityClass
  /**
   * Target exercise-count band for the SESSION BODY (not warmup/cooldown).
   * Composition intelligence uses `target` as a hint and clamps to `min..max`.
   */
  breadthTarget: { min: number; target: number; max: number }

  // ----- Progression / load character -----
  progressionCharacter: WeeklyProgressionCharacter

  // ----- Method gating -----
  methodAllowance: WeeklyMethodAllowance

  // ----- Provenance / explainability -----
  /**
   * Short rationale that ties the role to the actual signals that produced it.
   * Surfaced to the Program-page session card.
   */
  weeklyRationale: string
  sourceSignals: {
    dayFocus: string
    targetIntensity: string
    sessionType?: string
    weekPhase: WeekPhaseTag
    weekAdaptationPhase: string | null
    firstWeekProtected: boolean
    weekIndex: number
    totalDays: number
  }
}

/**
 * Week phase the contract was built against. Intentionally simpler than the
 * full WeekDosageScalingResult.phaseLabel so this module stays decoupled.
 */
export type WeekPhaseTag = 'acclimation' | 'ramp_up' | 'peak' | 'consolidation'

export interface WeeklySessionRoleContract {
  /** One role per day, length === input.totalDays. */
  dayRoles: WeeklyDayRole[]
  /** Distribution of role IDs across the week, for debug / display. */
  distribution: Record<WeeklySessionRoleId, number>
  /**
   * Whether the contract was protected (week 1 / recovery_constrained / etc.).
   * Roles still differentiate, but intensity classes and method gates are
   * capped relative to the unprotected version.
   */
  protectedWeek: boolean
  protectionReason: string | null
  /** Audit summary of how the distribution was chosen. */
  audit: {
    totalDays: number
    weekPhase: WeekPhaseTag
    weekAdaptationPhase: string | null
    firstWeekActive: boolean
    skillDominant: boolean
    strengthDominant: boolean
    complexityScore: number
    rolesAssigned: WeeklySessionRoleId[]
    differentiationScore: number // 0..1 — fraction of unique roles vs days
    notes: string[]
  }
}

export interface WeeklySessionRoleInput {
  days: DayStructure[]
  sessionIntents: SessionIntent[] | null | undefined
  weekPhase: WeekPhaseTag
  weekAdaptationPhase:
    | 'initial_acclimation'
    | 'normal_progression'
    | 'recovery_constrained'
    | 'rebuild_after_disruption'
    | null
  firstWeekActive: boolean
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingStyleMode: 'pure_skill' | 'skill' | 'strength' | 'hybrid' | 'balanced' | 'mixed' | string
  /** Onboarding-derived complexity score (0..10) used by flexible-schedule-engine. */
  complexityScore: number
  /** Whether any joint cautions are declared. Used to soften top-end intensity. */
  hasJointCautions: boolean
  /** Whether this is a weighted-friendly equipment loadout. */
  hasWeightedEquipment: boolean
}

// =============================================================================
// LABELS
// =============================================================================

const ROLE_LABELS: Record<WeeklySessionRoleId, { label: string; description: string }> = {
  primary_strength_emphasis: {
    label: 'Heavier strength day',
    description: 'Direct load priority. Narrower breadth so the heavy work stays clean.',
  },
  skill_quality_emphasis: {
    label: 'Skill quality day',
    description: 'CNS-fresh skill exposure. Fewer exercises, banded or assisted support where appropriate.',
  },
  broad_mixed_volume: {
    label: 'Broader mixed day',
    description: 'More exercises across patterns at moderate intensity. Coverage over peak.',
  },
  secondary_support: {
    label: 'Secondary / support day',
    description: 'Carryover and secondary skill expression at moderate stress.',
  },
  density_capacity: {
    label: 'Density / capacity day',
    description: 'Earned home for density or supersets when the week supports it.',
  },
  recovery_supportive: {
    label: 'Supportive recovery day',
    description: 'Lower exercise count, technical and joint-care work, low stress.',
  },
}

// =============================================================================
// PROTECTION POLICIES
// =============================================================================

/**
 * Apply week-phase / first-week / recovery-constrained protection to a role
 * WITHOUT collapsing role differentiation. Each role still reads as itself,
 * just with reduced intensity caps and tightened method gates.
 */
function applyWeekPhaseProtection(
  role: WeeklyDayRole,
  weekPhase: WeekPhaseTag,
  firstWeekActive: boolean,
  weekAdaptationPhase: WeeklySessionRoleInput['weekAdaptationPhase']
): WeeklyDayRole {
  const intensityCapByPhase: Record<WeekPhaseTag, WeeklyIntensityClass> = {
    acclimation: 'moderate_high',
    ramp_up: 'high',
    peak: 'high',
    consolidation: 'moderate_high',
  }

  const intensityRank: Record<WeeklyIntensityClass, number> = {
    low: 0,
    moderate_low: 1,
    moderate: 2,
    moderate_high: 3,
    high: 4,
  }

  let cappedIntensity = role.intensityClass
  const phaseCap = intensityCapByPhase[weekPhase]
  if (intensityRank[cappedIntensity] > intensityRank[phaseCap]) {
    cappedIntensity = phaseCap
  }

  // Recovery-constrained adaptation is one notch stricter than acclimation.
  if (weekAdaptationPhase === 'recovery_constrained') {
    if (intensityRank[cappedIntensity] > intensityRank.moderate) {
      cappedIntensity = 'moderate'
    }
  }

  // Method gating: in acclimation / first-week, density and finisher
  // are generally blocked for everyone EXCEPT the day whose ROLE is the
  // density home; even there they downgrade to `discouraged` rather than
  // `earned` so the user sees a protected entry into capacity work.
  let gates = { ...role.methodAllowance }
  if (firstWeekActive || weekPhase === 'acclimation') {
    if (role.roleId !== 'density_capacity') {
      if (gates.density !== 'blocked') gates.density = 'blocked'
      if (gates.circuits !== 'blocked') gates.circuits = 'blocked'
    } else {
      if (gates.density === 'earned') gates.density = 'discouraged'
      if (gates.circuits === 'earned') gates.circuits = 'discouraged'
    }
    if (gates.finisher !== 'blocked') gates.finisher = 'blocked'
    if (gates.cluster === 'earned') gates.cluster = 'allowed'
  }

  if (weekAdaptationPhase === 'recovery_constrained') {
    gates.density = 'blocked'
    gates.circuits = 'blocked'
    gates.finisher = 'blocked'
    if (gates.supersets === 'earned') gates.supersets = 'allowed'
  }

  return {
    ...role,
    intensityClass: cappedIntensity,
    methodAllowance: gates,
  }
}

// =============================================================================
// DEFAULT ROLE TEMPLATES
// =============================================================================

/** Build a clean default for a given role; protection is applied separately. */
function templateForRole(
  roleId: WeeklySessionRoleId,
  ctx: { experienceLevel: WeeklySessionRoleInput['experienceLevel']; complexityScore: number; hasWeightedEquipment: boolean }
): Pick<
  WeeklyDayRole,
  'roleId' | 'roleLabel' | 'roleDescription' | 'intensityClass' | 'breadthTarget' | 'progressionCharacter' | 'methodAllowance'
> {
  const labels = ROLE_LABELS[roleId]

  // Breadth bands — driven by role first, modulated by complexity and experience.
  // These are TARGETS, not caps. Composition can clamp inside [min..max].
  const breadthBaseByRole: Record<WeeklySessionRoleId, { min: number; target: number; max: number }> = {
    primary_strength_emphasis: { min: 3, target: 4, max: 5 }, // intentionally narrow so heavy work stays clean
    skill_quality_emphasis: { min: 3, target: 4, max: 5 }, // narrow for CNS-fresh quality
    broad_mixed_volume: { min: 5, target: 6, max: 7 }, // broader coverage day
    secondary_support: { min: 4, target: 5, max: 6 },
    density_capacity: { min: 4, target: 5, max: 6 }, // moderate breadth, density adds work-density not exercise-count
    recovery_supportive: { min: 2, target: 3, max: 4 }, // deliberately fewer exercises
  }

  const base = breadthBaseByRole[roleId]
  // Complexity nudge: high complexity (broader athlete) opens band by +1 on
  // broad_mixed and secondary_support; never on the focused roles.
  let breadthTarget = { ...base }
  if (ctx.complexityScore >= 5 && (roleId === 'broad_mixed_volume' || roleId === 'secondary_support' || roleId === 'density_capacity')) {
    breadthTarget = { min: base.min, target: Math.min(base.max, base.target + 1), max: base.max }
  }
  if (ctx.experienceLevel === 'beginner') {
    breadthTarget = {
      min: Math.max(2, base.min - 1),
      target: Math.max(2, base.target - 1),
      max: Math.max(3, base.max - 1),
    }
  }

  const intensityByRole: Record<WeeklySessionRoleId, WeeklyIntensityClass> = {
    primary_strength_emphasis: 'high',
    skill_quality_emphasis: 'moderate_high',
    broad_mixed_volume: 'moderate',
    secondary_support: 'moderate',
    density_capacity: 'moderate',
    recovery_supportive: 'low',
  }

  const progressionByRole: Record<WeeklySessionRoleId, WeeklyProgressionCharacter> = {
    primary_strength_emphasis: ctx.hasWeightedEquipment ? 'direct_load' : 'direct_load',
    skill_quality_emphasis: 'banded_support',
    broad_mixed_volume: 'mixed_breadth',
    secondary_support: 'volume_direct',
    density_capacity: 'volume_direct',
    recovery_supportive: 'recovery_quality',
  }

  const methodByRole: Record<WeeklySessionRoleId, WeeklyMethodAllowance> = {
    primary_strength_emphasis: {
      density: 'discouraged', // heavy day stays clean
      supersets: 'allowed',
      circuits: 'discouraged',
      finisher: 'allowed',
      cluster: 'earned', // cluster is the natural method on the heavy day for quality reps
    },
    skill_quality_emphasis: {
      density: 'blocked', // skill quality day cannot carry density
      supersets: 'discouraged',
      circuits: 'blocked',
      finisher: 'blocked',
      cluster: 'allowed', // cluster on a skill hold is OK
    },
    broad_mixed_volume: {
      density: 'allowed',
      supersets: 'allowed',
      circuits: 'discouraged',
      finisher: 'allowed',
      cluster: 'discouraged',
    },
    secondary_support: {
      density: 'allowed',
      supersets: 'earned',
      circuits: 'allowed',
      finisher: 'allowed',
      cluster: 'discouraged',
    },
    density_capacity: {
      density: 'earned',
      supersets: 'earned',
      circuits: 'earned',
      finisher: 'allowed',
      cluster: 'discouraged',
    },
    recovery_supportive: {
      density: 'blocked',
      supersets: 'discouraged',
      circuits: 'blocked',
      finisher: 'blocked',
      cluster: 'blocked',
    },
  }

  return {
    roleId,
    roleLabel: labels.label,
    roleDescription: labels.description,
    intensityClass: intensityByRole[roleId],
    breadthTarget,
    progressionCharacter: progressionByRole[roleId],
    methodAllowance: methodByRole[roleId],
  }
}

// =============================================================================
// DISTRIBUTION
// =============================================================================

/**
 * Choose a list of role IDs for the week, ordered to ALIGN with day-focus
 * positions. The ordering rules:
 *   1) The first primary-skill / strength-leaning day in the structure becomes
 *      the `primary_strength_emphasis` (peak) or `skill_quality_emphasis` (skill-leaning style).
 *   2) Recovery / support_recovery / flexibility-focused day-focuses become
 *      `recovery_supportive`.
 *   3) The remaining days are filled with `broad_mixed_volume`,
 *      `secondary_support`, and `density_capacity` such that no two adjacent
 *      days share the same role when avoidable.
 */
function distributeRoles(input: WeeklySessionRoleInput): WeeklySessionRoleId[] {
  const totalDays = input.days.length
  const skillDominant =
    input.trainingStyleMode === 'pure_skill' ||
    input.trainingStyleMode === 'skill' ||
    input.trainingStyleMode.toLowerCase().includes('skill')
  const strengthDominant =
    input.trainingStyleMode === 'strength' || input.trainingStyleMode.toLowerCase().includes('strength')

  // Pre-classify days from their focus / targetIntensity.
  const classifications = input.days.map((d) => {
    const focus = (d.focus || '').toLowerCase()
    const isLow = d.targetIntensity === 'low'
    const isHigh = d.targetIntensity === 'high'
    const isRecovery = focus.includes('support_recovery') || focus.includes('flexibility') || focus.includes('transition')
    const isSkill = focus.includes('skill')
    const isMixed = focus.includes('mixed')
    return { focus, isLow, isHigh, isRecovery, isSkill, isMixed, targetIntensity: d.targetIntensity }
  })

  const roles: (WeeklySessionRoleId | null)[] = new Array(totalDays).fill(null)

  // 1) Recovery-bias for low-intensity / recovery focus days.
  classifications.forEach((c, i) => {
    if (c.isRecovery || c.isLow) {
      roles[i] = 'recovery_supportive'
    }
  })

  // 2) The first non-recovery, primary-flagged, high-intensity day becomes the heavy/skill anchor.
  const primaryAnchorRole: WeeklySessionRoleId = skillDominant && !strengthDominant ? 'skill_quality_emphasis' : 'primary_strength_emphasis'
  const primaryAnchorIdx = classifications.findIndex((c, i) => roles[i] === null && (c.isHigh || input.days[i].isPrimary))
  if (primaryAnchorIdx >= 0) {
    roles[primaryAnchorIdx] = primaryAnchorRole
  }

  // 3) If multi-skill / hybrid, give the second highest-intensity primary day the OPPOSITE anchor.
  const secondAnchor: WeeklySessionRoleId | null = (() => {
    if (totalDays < 4) return null
    if (skillDominant) return 'primary_strength_emphasis'
    if (strengthDominant) return 'skill_quality_emphasis'
    // hybrid / balanced: the opposite of whatever was placed first
    return primaryAnchorRole === 'skill_quality_emphasis' ? 'primary_strength_emphasis' : 'skill_quality_emphasis'
  })()
  if (secondAnchor) {
    const secondAnchorIdx = classifications.findIndex(
      (c, i) => roles[i] === null && (c.isHigh || input.days[i].isPrimary)
    )
    if (secondAnchorIdx >= 0) {
      roles[secondAnchorIdx] = secondAnchor
    }
  }

  // 4) Density home. The week's density_capacity day is preferentially placed
  //    on a day whose focus is mixed and where neighbours are not also density.
  if (totalDays >= 4 && roles.some((r) => r === null)) {
    const candidate = classifications.findIndex((c, i) => roles[i] === null && (c.isMixed || c.targetIntensity === 'moderate'))
    if (candidate >= 0) {
      roles[candidate] = 'density_capacity'
    }
  }

  // 5) Broad mixed volume days for any remaining mid-intensity slots.
  classifications.forEach((c, i) => {
    if (roles[i] === null && (c.isMixed || c.targetIntensity === 'moderate')) {
      roles[i] = 'broad_mixed_volume'
    }
  })

  // 6) Fill the rest with secondary_support, but avoid placing the same role twice in a row when possible.
  for (let i = 0; i < totalDays; i++) {
    if (roles[i] !== null) continue
    const prev = i > 0 ? roles[i - 1] : null
    const next = i < totalDays - 1 ? roles[i + 1] : null
    let candidate: WeeklySessionRoleId = 'secondary_support'
    // Prefer broad_mixed if both neighbours are support-ish, to differentiate.
    if (prev === 'secondary_support' || next === 'secondary_support') {
      candidate = 'broad_mixed_volume'
    }
    roles[i] = candidate
  }

  // 7) Adjacency smoothing: if two adjacent days share the same role and we
  //    have an unused role available in our palette, swap the second to it.
  const swappablePalette: WeeklySessionRoleId[] = ['broad_mixed_volume', 'secondary_support', 'density_capacity']
  for (let i = 1; i < totalDays; i++) {
    if (roles[i] !== null && roles[i] === roles[i - 1]) {
      const used = new Set(roles.filter((r) => r !== null) as WeeklySessionRoleId[])
      const replacement = swappablePalette.find((r) => !used.has(r) || r !== roles[i])
      if (replacement && replacement !== roles[i]) {
        roles[i] = replacement
      }
    }
  }

  // Final guard — should be impossible to be null but don't crash.
  return roles.map((r) => r || 'secondary_support')
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Build the authoritative weekly session-role contract.
 *
 * Call this ONCE per program build, AFTER the weekly structure and session
 * intents have been resolved, and BEFORE the per-day session-assembly loop.
 * Pass `dayRoles[i]` into the session-composition context for index `i` so
 * complexity, breadth, and method gating align with weekly intent.
 */
export function buildWeeklySessionRoleContract(input: WeeklySessionRoleInput): WeeklySessionRoleContract {
  const totalDays = input.days.length
  const skillDominant =
    input.trainingStyleMode === 'pure_skill' ||
    input.trainingStyleMode === 'skill' ||
    input.trainingStyleMode.toLowerCase().includes('skill')
  const strengthDominant =
    input.trainingStyleMode === 'strength' || input.trainingStyleMode.toLowerCase().includes('strength')

  const protectedWeek = input.firstWeekActive || input.weekPhase === 'acclimation' || input.weekAdaptationPhase === 'recovery_constrained'
  const protectionReason = input.firstWeekActive
    ? 'first_week_acclimation_active'
    : input.weekPhase === 'acclimation'
      ? 'week_phase_acclimation'
      : input.weekAdaptationPhase === 'recovery_constrained'
        ? 'recovery_constrained_phase'
        : null

  // 1) Distribute role IDs across the week.
  const roleIds = distributeRoles(input)

  // 2) Build per-day records.
  const dayRoles: WeeklyDayRole[] = roleIds.map((roleId, i) => {
    const day = input.days[i]
    const intent = input.sessionIntents?.[i]
    const template = templateForRole(roleId, {
      experienceLevel: input.experienceLevel,
      complexityScore: input.complexityScore,
      hasWeightedEquipment: input.hasWeightedEquipment,
    })

    // Joint cautions soften top-end intensity by one notch on the heavy anchor.
    let initialIntensity = template.intensityClass
    if (input.hasJointCautions && (roleId === 'primary_strength_emphasis' || roleId === 'skill_quality_emphasis')) {
      const intensityRank: Record<WeeklyIntensityClass, number> = {
        low: 0,
        moderate_low: 1,
        moderate: 2,
        moderate_high: 3,
        high: 4,
      }
      const rankedDown: Record<WeeklyIntensityClass, WeeklyIntensityClass> = {
        high: 'moderate_high',
        moderate_high: 'moderate',
        moderate: 'moderate_low',
        moderate_low: 'low',
        low: 'low',
      }
      if (intensityRank[initialIntensity] > intensityRank.moderate_high) {
        initialIntensity = rankedDown[initialIntensity]
      }
    }

    const baseRole: WeeklyDayRole = {
      dayNumber: day.dayNumber,
      weekIndex: i,
      ...template,
      intensityClass: initialIntensity,
      weeklyRationale: buildRationale(roleId, day, intent, input.weekPhase, protectedWeek),
      sourceSignals: {
        dayFocus: day.focus,
        targetIntensity: day.targetIntensity,
        sessionType: intent?.sessionType,
        weekPhase: input.weekPhase,
        weekAdaptationPhase: input.weekAdaptationPhase,
        firstWeekProtected: input.firstWeekActive,
        weekIndex: i,
        totalDays,
      },
    }

    return applyWeekPhaseProtection(baseRole, input.weekPhase, input.firstWeekActive, input.weekAdaptationPhase)
  })

  // 3) Distribution summary.
  const distribution: Record<WeeklySessionRoleId, number> = {
    primary_strength_emphasis: 0,
    skill_quality_emphasis: 0,
    broad_mixed_volume: 0,
    secondary_support: 0,
    density_capacity: 0,
    recovery_supportive: 0,
  }
  dayRoles.forEach((r) => {
    distribution[r.roleId] += 1
  })

  const uniqueRoles = new Set(dayRoles.map((r) => r.roleId)).size
  const differentiationScore = totalDays > 0 ? uniqueRoles / totalDays : 0

  const audit: WeeklySessionRoleContract['audit'] = {
    totalDays,
    weekPhase: input.weekPhase,
    weekAdaptationPhase: input.weekAdaptationPhase,
    firstWeekActive: input.firstWeekActive,
    skillDominant,
    strengthDominant,
    complexityScore: input.complexityScore,
    rolesAssigned: dayRoles.map((r) => r.roleId),
    differentiationScore,
    notes: [
      `Distributed ${uniqueRoles} unique roles across ${totalDays} days`,
      protectedWeek ? `Protection active: ${protectionReason}` : 'Unprotected: full role expression',
    ],
  }

  console.log('[weekly-session-role-contract]', {
    totalDays,
    weekPhase: input.weekPhase,
    weekAdaptationPhase: input.weekAdaptationPhase,
    firstWeekActive: input.firstWeekActive,
    protectedWeek,
    differentiationScore: Number(differentiationScore.toFixed(2)),
    roles: dayRoles.map((r) => ({
      day: r.dayNumber,
      role: r.roleId,
      intensity: r.intensityClass,
      breadth: r.breadthTarget.target,
      progression: r.progressionCharacter,
      density: r.methodAllowance.density,
    })),
  })

  return {
    dayRoles,
    distribution,
    protectedWeek,
    protectionReason,
    audit,
  }
}

function buildRationale(
  roleId: WeeklySessionRoleId,
  day: DayStructure,
  intent: SessionIntent | undefined,
  weekPhase: WeekPhaseTag,
  protectedWeek: boolean
): string {
  const protectionTag = protectedWeek ? ` (${weekPhase === 'acclimation' ? 'protected acclimation dosage' : 'protected dosage'})` : ''
  const focus = day.focusLabel || day.focus
  switch (roleId) {
    case 'primary_strength_emphasis':
      return `${focus}: heavier-relative day in the week — direct load priority${protectionTag}.`
    case 'skill_quality_emphasis':
      return `${focus}: CNS-fresh skill quality day — fewer exercises, supportive variants${protectionTag}.`
    case 'broad_mixed_volume':
      return `${focus}: broader coverage at moderate intensity — more exercises across patterns${protectionTag}.`
    case 'secondary_support':
      return `${focus}: secondary expression and carryover — moderate stress${protectionTag}.`
    case 'density_capacity':
      return `${focus}: density / capacity day — earned home for grouped methods${protectionTag}.`
    case 'recovery_supportive':
      return `${focus}: supportive day — lower exercise count, technical and joint-care emphasis.`
  }
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/** Compact, capitalised intensity label for a chip. */
export function intensityClassLabel(c: WeeklyIntensityClass): string {
  switch (c) {
    case 'high':
      return 'High intensity'
    case 'moderate_high':
      return 'Moderate-high'
    case 'moderate':
      return 'Moderate'
    case 'moderate_low':
      return 'Lower intensity'
    case 'low':
      return 'Low / recovery'
  }
}

/** Compact, capitalised progression label for a chip. */
export function progressionCharacterLabel(p: WeeklyProgressionCharacter): string {
  switch (p) {
    case 'direct_load':
      return 'Load-direct'
    case 'banded_support':
      return 'Band-supported'
    case 'conservative_skill':
      return 'Skill-conservative'
    case 'mixed_breadth':
      return 'Mixed breadth'
    case 'volume_direct':
      return 'Volume-direct'
    case 'recovery_quality':
      return 'Quality / recovery'
  }
}

/**
 * Translate the role's max breadth target to a soft session-body cap that
 * composition intelligence can clamp into. Caller should already respect any
 * stricter doctrine cap; this is a HINT, not a hard ceiling.
 */
export function softBreadthCap(role: WeeklyDayRole): number {
  return role.breadthTarget.max
}

/**
 * True if a method is permitted (allowed or earned) on this day's role.
 * Composition intelligence can call this to gate method materialization.
 */
export function isMethodPermittedByRole(
  role: WeeklyDayRole,
  method: keyof WeeklyMethodAllowance
): boolean {
  const gate = role.methodAllowance[method]
  return gate === 'allowed' || gate === 'earned'
}
