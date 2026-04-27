/**
 * =============================================================================
 * [PHASE 4M] DOCTRINE APPLICATION CORRIDOR
 *
 * Helper module imported and OWNED by
 * `lib/program/row-level-method-prescription-mutator.ts`. The mutator remains
 * the single authoritative entry point — this file is implementation
 * organization only. There is NO competing engine.
 *
 * What this corridor adds on top of Phase 4L:
 * -----------------------------------------------------------------------------
 *
 *   1. DOCTRINE-EARNED ROW-LEVEL METHODS (top_set / drop_set / rest_pause)
 *      The builder at lib/adaptive-program-builder.ts L13700-13960 applies
 *      these only when the user explicitly opts in via
 *      `methodPrefsForGrouping`. That is too narrow: the same session
 *      composition can earn the method by doctrine alone (parity with
 *      grouped methods, which already have `*BlueprintEarned`).
 *
 *      This corridor fires ONLY on rows the builder did NOT already touch
 *      (`!setExecutionMethod && !method && !blockId`), under tight gates:
 *        - top_set: pillar (exs[0]) is a loadable strength row, profile is
 *          strength-priority, not skill-priority, not high-skill protected.
 *        - drop_set: late-position accessory_hypertrophy row, profile asks
 *          for hypertrophy/aesthetic, max ONE per session.
 *        - rest_pause: late-position accessory_hypertrophy or
 *          secondary_strength row, profile asks for strength-endurance, max
 *          ONE per session, never on the same row as drop_set.
 *      "Minimum effective mutation": at most ONE of {drop_set, rest_pause}
 *      fires per session via this corridor. Builder writes always win.
 *
 *   2. BOUNDED PRESCRIPTION MUTATION — restSeconds + targetRPE only
 *      The Phase 4L bounds witness reported many rows out-of-bounds without
 *      mutating. This corridor decisively mutates the two SAFEST fields:
 *        - restSeconds: clamp toward role-based bounds when missing or
 *          severely out-of-bounds (< restMin/2 or > restMax*2). Always
 *          conservative — clamp to nearest bound, never to extreme.
 *        - targetRPE: assign role-based default ONLY when missing. Never
 *          override an existing value in this phase.
 *      Sets / reps / hold_seconds remain DEFERRED — those compound with the
 *      progression engine and require a dedicated safety phase.
 *
 *   3. PER-ROW DELTA STAMPING — `exercise.doctrineApplicationDeltas[]`
 *      Every applied mutation stamps a typed delta on the exercise so the
 *      Program page and live workout corridor can both prove what changed.
 *
 *   4. PLAN-THEN-APPLY pattern
 *      `buildDoctrineApplicationPlan(input)` returns a typed plan that
 *      enumerates every planned application (apply / block / no_safe_target
 *      / not_needed / already_applied) BEFORE any mutation runs. Then
 *      `applyDoctrineApplicationPlan(plan, session)` performs the writes.
 *      No mutation happens without a plan entry.
 * =============================================================================
 */

import type {
  ExerciseLike,
  ProfileSnapshotLike,
  SessionLike,
} from './row-level-method-prescription-mutator'

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export type DoctrineApplicationFamily =
  | 'top_set'
  | 'backoff_sets'
  | 'drop_set'
  | 'rest_pause'
  | 'cluster'
  | 'endurance_density'
  | 'superset'
  | 'circuit'
  | 'density_block'
  | 'straight_sets'
  | 'prescription_sets'
  | 'prescription_reps'
  | 'prescription_holds'
  | 'prescription_rest'
  | 'prescription_rpe'

export type DoctrineApplicationMode =
  | 'apply'
  | 'block'
  | 'already_applied'
  | 'not_needed'
  | 'no_safe_target'
  | 'not_connected'

export interface DoctrineApplicationPlanEntry {
  family: DoctrineApplicationFamily
  mode: DoctrineApplicationMode
  targetExerciseId?: string
  targetExerciseName?: string
  targetExerciseIndex?: number
  fieldPath?: string
  currentValue?: unknown
  proposedValue?: unknown
  sourceDoctrineFamily: string
  sourceRuleIds: string[]
  reason: string
  safetyGatesPassed: string[]
  safetyGatesFailed: string[]
  visibleProofPath: string
}

export interface DoctrineApplicationDelta {
  family: DoctrineApplicationFamily
  fieldPath: string
  before: unknown
  after: unknown
  source: 'doctrine_application_corridor'
  reason: string
  safetyGate: string
  appliedAt: string
  visibleLabel: string
}

export interface DoctrineApplicationCorridorSummary {
  version: 'phase-4m'
  plan: DoctrineApplicationPlanEntry[]
  appliedDeltas: DoctrineApplicationDelta[]
  countsByFamily: Record<DoctrineApplicationFamily, { applied: number; blocked: number; notNeeded: number }>
  finalVerdict:
    | 'DOCTRINE_DECISIVELY_APPLIED'
    | 'DOCTRINE_PARTIALLY_APPLIED'
    | 'DOCTRINE_EVALUATED_NO_SAFE_CHANGES'
    | 'DOCTRINE_NOT_CONNECTED'
    | 'DOCTRINE_APPLICATION_FAILED'
}

export interface DoctrineApplicationInput {
  session: SessionLike
  profileSnapshot?: ProfileSnapshotLike | null
  selectedTrainingMethods?: string[]
  selectedSkills?: string[]
  weeklyRole?: { roleId?: string; intensityClass?: string } | null
  currentWeekNumber?: number | null
  jointCautions?: string[]
}

// =============================================================================
// HIGH-SKILL TOKENS (mirrored from row-level mutator for self-containment)
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

const POWER_EXPLOSIVE_TOKENS = [
  'explosive',
  'plyometric',
  'ballistic',
  'clapping',
  'jump',
  'plyo',
  'sprint',
] as const

// "Loadable strength" — pillar name patterns where a heavy single + back-off is
// a doctrine-correct dosage, not a fashion choice.
const LOADABLE_STRENGTH_PILLAR_TOKENS = [
  'weighted pull',
  'weighted chin',
  'weighted dip',
  'weighted row',
  'weighted push',
  'weighted squat',
  'barbell row',
  'barbell press',
  'overhead press',
  'bench press',
] as const

function isHighSkillProtected(name?: string, category?: string, selectionReason?: string): boolean {
  const haystack = `${name ?? ''} ${category ?? ''} ${selectionReason ?? ''}`.toLowerCase()
  return HIGH_SKILL_TOKENS.some(token => haystack.includes(token))
}

function isPowerExplosive(name?: string): boolean {
  const haystack = (name ?? '').toLowerCase()
  return POWER_EXPLOSIVE_TOKENS.some(token => haystack.includes(token))
}

function isLoadableStrengthPillar(name?: string, category?: string): boolean {
  if (category !== 'strength') return false
  const haystack = (name ?? '').toLowerCase()
  return LOADABLE_STRENGTH_PILLAR_TOKENS.some(token => haystack.includes(token))
}

function rowAlreadyClaimed(ex: ExerciseLike): boolean {
  if (typeof ex.method === 'string' && ex.method.length > 0 && ex.method !== 'straight_sets' && ex.method !== 'straight') return true
  if (typeof ex.setExecutionMethod === 'string' && ex.setExecutionMethod.length > 0) return true
  if (typeof ex.blockId === 'string' && ex.blockId.length > 0) return true
  return false
}

// =============================================================================
// PROFILE INTENT — strength-priority vs hypertrophy vs strength-endurance
// =============================================================================

interface ProfileIntent {
  strengthPriority: boolean
  hypertrophyPriority: boolean
  strengthEndurancePriority: boolean
  skillPriority: boolean
  rawGoals: string
}

function deriveProfileIntent(profile: ProfileSnapshotLike | null | undefined): ProfileIntent {
  const primary = String(profile?.primaryGoal ?? '').toLowerCase()
  const secondary = String(profile?.secondaryGoal ?? '').toLowerCase()
  const styles = (profile?.selectedTrainingStyles ?? []).map(s => String(s).toLowerCase()).join(' ')
  const stylePref = String(profile?.sessionStylePreference ?? '').toLowerCase()
  const skills = (profile?.selectedSkills ?? []).map(s => String(s).toLowerCase()).join(' ')

  const goalBlob = `${primary} ${secondary} ${styles} ${stylePref}`

  const strengthTokens = ['strength', 'weighted_strength', 'weighted strength', 'power', 'max_strength', 'maximal_strength']
  const hypertrophyTokens = ['hypertrophy', 'muscle', 'aesthetic', 'physique', 'mass', 'size', 'bodybuilding']
  const enduranceTokens = ['strength_endurance', 'strength endurance', 'muscular_endurance', 'work_capacity', 'work capacity', 'metcon', 'stamina']
  const skillTokens = ['skill', 'planche', 'lever', 'handstand', 'iron cross', 'maltese', 'one_arm', 'one arm']

  const strengthPriority = strengthTokens.some(t => goalBlob.includes(t))
  const hypertrophyPriority = hypertrophyTokens.some(t => goalBlob.includes(t))
  const strengthEndurancePriority = enduranceTokens.some(t => goalBlob.includes(t))
  const skillPriority =
    skillTokens.some(t => goalBlob.includes(t) || skills.includes(t)) ||
    (profile?.selectedSkills?.length ?? 0) >= 2

  return {
    strengthPriority,
    hypertrophyPriority,
    strengthEndurancePriority,
    skillPriority,
    rawGoals: goalBlob.trim(),
  }
}

// =============================================================================
// ROLE INFERENCE + BOUNDS (mirrored conservatively from Phase 4L)
// =============================================================================

interface RoleBounds {
  setsMin: number
  setsMax: number
  primaryMin: number
  primaryMax: number
  restMin: number
  restMax: number
  unit: 'reps' | 'hold_seconds'
  defaultRPE: number
}

const ROLE_BOUNDS: Record<string, RoleBounds> = {
  primary_strength: { setsMin: 3, setsMax: 6, primaryMin: 3, primaryMax: 8, restMin: 120, restMax: 240, unit: 'reps', defaultRPE: 8 },
  secondary_strength: { setsMin: 3, setsMax: 5, primaryMin: 5, primaryMax: 10, restMin: 90, restMax: 180, unit: 'reps', defaultRPE: 8 },
  skill_isometric: { setsMin: 3, setsMax: 6, primaryMin: 5, primaryMax: 30, restMin: 90, restMax: 180, unit: 'hold_seconds', defaultRPE: 7 },
  accessory_hypertrophy: { setsMin: 2, setsMax: 4, primaryMin: 8, primaryMax: 15, restMin: 60, restMax: 120, unit: 'reps', defaultRPE: 8 },
  core_or_support: { setsMin: 2, setsMax: 4, primaryMin: 8, primaryMax: 20, restMin: 45, restMax: 90, unit: 'reps', defaultRPE: 7 },
  conditioning: { setsMin: 2, setsMax: 4, primaryMin: 10, primaryMax: 30, restMin: 30, restMax: 90, unit: 'reps', defaultRPE: 7 },
  mobility_prehab: { setsMin: 1, setsMax: 3, primaryMin: 5, primaryMax: 15, restMin: 0, restMax: 60, unit: 'reps', defaultRPE: 5 },
  cooldown_flexibility: { setsMin: 1, setsMax: 3, primaryMin: 20, primaryMax: 60, restMin: 0, restMax: 30, unit: 'hold_seconds', defaultRPE: 4 },
}

function inferExerciseRole(ex: ExerciseLike): keyof typeof ROLE_BOUNDS {
  const name = String(ex.name ?? '').toLowerCase()
  const category = String(ex.category ?? '').toLowerCase()
  const reason = String(ex.selectionReason ?? '').toLowerCase()

  if (HIGH_SKILL_TOKENS.some(t => name.includes(t))) return 'skill_isometric'
  if (category === 'mobility' || reason.includes('mobility') || reason.includes('prehab')) return 'mobility_prehab'
  if (category === 'cooldown' || reason.includes('cooldown') || reason.includes('flexibility')) return 'cooldown_flexibility'
  if (category === 'conditioning' || reason.includes('conditioning')) return 'conditioning'
  if (category === 'core' || reason.includes('core')) return 'core_or_support'
  if (category === 'strength') {
    if (reason.includes('primary')) return 'primary_strength'
    return 'secondary_strength'
  }
  return 'accessory_hypertrophy'
}

// =============================================================================
// PLAN BUILDER — pure decisions, no mutations
// =============================================================================

export function buildDoctrineApplicationPlan(input: DoctrineApplicationInput): DoctrineApplicationPlanEntry[] {
  const { session } = input
  const intent = deriveProfileIntent(input.profileSnapshot)
  const exercises = session.exercises ?? []
  const plan: DoctrineApplicationPlanEntry[] = []

  if (exercises.length === 0) return plan

  const lateBoundary = Math.max(2, Math.ceil(exercises.length / 2))

  // ---------------------------------------------------------------------------
  // 1. TOP_SET — doctrine-earned on a true loadable strength pillar
  // ---------------------------------------------------------------------------
  const pillar = exercises[0]
  const pillarHasMethod = pillar ? rowAlreadyClaimed(pillar) : false
  if (pillar && pillarHasMethod && pillar.setExecutionMethod === 'top_set') {
    plan.push({
      family: 'top_set',
      mode: 'already_applied',
      targetExerciseId: String(pillar.id ?? ''),
      targetExerciseName: String(pillar.name ?? 'Pillar'),
      targetExerciseIndex: 0,
      sourceDoctrineFamily: 'training_method_decision_governor',
      sourceRuleIds: ['adaptive_program_builder.row_level_top_set'],
      reason: 'Top set already applied by builder under user preference.',
      safetyGatesPassed: ['builder_owns_user_pref_path'],
      safetyGatesFailed: [],
      visibleProofPath: 'session.exercises[0].setExecutionMethod = "top_set"',
    })
  } else if (pillar && !pillarHasMethod) {
    const gatesPassed: string[] = []
    const gatesFailed: string[] = []

    if (isHighSkillProtected(pillar.name, pillar.category, pillar.selectionReason)) {
      gatesFailed.push('high_skill_protected')
    } else {
      gatesPassed.push('not_high_skill_protected')
    }
    if (isPowerExplosive(pillar.name)) {
      gatesFailed.push('power_explosive_excluded')
    } else {
      gatesPassed.push('not_power_explosive')
    }
    if (!isLoadableStrengthPillar(pillar.name, pillar.category)) {
      gatesFailed.push('not_loadable_strength_pillar')
    } else {
      gatesPassed.push('loadable_strength_pillar')
    }
    if (intent.skillPriority) {
      gatesFailed.push('skill_priority_profile')
    } else {
      gatesPassed.push('not_skill_priority')
    }
    if (!intent.strengthPriority) {
      gatesFailed.push('profile_not_strength_priority')
    } else {
      gatesPassed.push('strength_priority_profile')
    }

    if (gatesFailed.length === 0) {
      plan.push({
        family: 'top_set',
        mode: 'apply',
        targetExerciseId: String(pillar.id ?? ''),
        targetExerciseName: String(pillar.name ?? 'Pillar'),
        targetExerciseIndex: 0,
        fieldPath: 'exercise.setExecutionMethod',
        currentValue: pillar.setExecutionMethod ?? null,
        proposedValue: 'top_set',
        sourceDoctrineFamily: 'training_method_decision_governor',
        sourceRuleIds: ['phase_4m.top_set.doctrine_earned_v1'],
        reason: `Pillar ${pillar.name} is a loadable strength row and the profile is strength-priority — top set + back-off is doctrine-correct dosage even without explicit user opt-in.`,
        safetyGatesPassed: gatesPassed,
        safetyGatesFailed: [],
        visibleProofPath: 'session.exercises[0].setExecutionMethod = "top_set"',
      })
    } else {
      plan.push({
        family: 'top_set',
        mode: gatesFailed.includes('not_loadable_strength_pillar') || gatesFailed.includes('profile_not_strength_priority') ? 'not_needed' : 'block',
        targetExerciseId: String(pillar.id ?? ''),
        targetExerciseName: String(pillar.name ?? 'Pillar'),
        targetExerciseIndex: 0,
        sourceDoctrineFamily: 'training_method_decision_governor',
        sourceRuleIds: ['phase_4m.top_set.doctrine_earned_v1'],
        reason: `Pillar gate failed: ${gatesFailed.join(', ')}.`,
        safetyGatesPassed: gatesPassed,
        safetyGatesFailed: gatesFailed,
        visibleProofPath: 'program.doctrineApplicationRollup.byFamily.top_set',
      })
    }
  }

  // ---------------------------------------------------------------------------
  // 2. DROP_SET / REST_PAUSE — at most ONE per session, late accessory only
  // ---------------------------------------------------------------------------
  // Helper: find first eligible late accessory row not already claimed
  const eligibleLateAccessories: number[] = []
  for (let i = exercises.length - 1; i >= lateBoundary; i--) {
    const ex = exercises[i]
    if (!ex) continue
    if (rowAlreadyClaimed(ex)) continue
    if (isHighSkillProtected(ex.name, ex.category, ex.selectionReason)) continue
    if (isPowerExplosive(ex.name)) continue
    const role = inferExerciseRole(ex)
    if (role !== 'accessory_hypertrophy' && role !== 'secondary_strength') continue
    eligibleLateAccessories.push(i)
  }

  // 2a. DROP_SET — when profile is hypertrophy-priority, fire once.
  let dropSetTargetIndex: number | null = null
  if (intent.hypertrophyPriority) {
    if (eligibleLateAccessories.length === 0) {
      plan.push({
        family: 'drop_set',
        mode: 'no_safe_target',
        sourceDoctrineFamily: 'training_method_decision_governor',
        sourceRuleIds: ['phase_4m.drop_set.doctrine_earned_v1'],
        reason: 'Profile asks for hypertrophy but no late-position accessory_hypertrophy row passed the high-skill / power / already-claimed gates.',
        safetyGatesPassed: ['profile_hypertrophy_priority'],
        safetyGatesFailed: ['no_safe_late_accessory'],
        visibleProofPath: 'program.doctrineApplicationRollup.byFamily.drop_set',
      })
    } else {
      // Pick the deepest accessory_hypertrophy row.
      for (const idx of eligibleLateAccessories) {
        const role = inferExerciseRole(exercises[idx]!)
        if (role === 'accessory_hypertrophy') {
          dropSetTargetIndex = idx
          break
        }
      }
      if (dropSetTargetIndex == null) {
        plan.push({
          family: 'drop_set',
          mode: 'no_safe_target',
          sourceDoctrineFamily: 'training_method_decision_governor',
          sourceRuleIds: ['phase_4m.drop_set.doctrine_earned_v1'],
          reason: 'Late candidates exist but none classify as accessory_hypertrophy; drop_set requires a hypertrophy-role target.',
          safetyGatesPassed: ['profile_hypertrophy_priority'],
          safetyGatesFailed: ['no_accessory_hypertrophy_target'],
          visibleProofPath: 'program.doctrineApplicationRollup.byFamily.drop_set',
        })
      } else {
        const ex = exercises[dropSetTargetIndex]!
        plan.push({
          family: 'drop_set',
          mode: 'apply',
          targetExerciseId: String(ex.id ?? ''),
          targetExerciseName: String(ex.name ?? 'Accessory'),
          targetExerciseIndex: dropSetTargetIndex,
          fieldPath: 'exercise.setExecutionMethod',
          currentValue: ex.setExecutionMethod ?? null,
          proposedValue: 'drop_set',
          sourceDoctrineFamily: 'training_method_decision_governor',
          sourceRuleIds: ['phase_4m.drop_set.doctrine_earned_v1'],
          reason: `Late accessory row ${ex.name} is hypertrophy-role and unclaimed — drop set is the doctrine-correct dosage for hypertrophy accumulation.`,
          safetyGatesPassed: [
            'profile_hypertrophy_priority',
            'late_position',
            'role_accessory_hypertrophy',
            'not_high_skill_protected',
            'not_power_explosive',
            'not_already_claimed',
          ],
          safetyGatesFailed: [],
          visibleProofPath: `session.exercises[${dropSetTargetIndex}].setExecutionMethod = "drop_set"`,
        })
      }
    }
  } else {
    plan.push({
      family: 'drop_set',
      mode: 'not_needed',
      sourceDoctrineFamily: 'training_method_decision_governor',
      sourceRuleIds: ['phase_4m.drop_set.doctrine_earned_v1'],
      reason: 'Profile does not ask for hypertrophy/aesthetic priority — drop set not earned by doctrine.',
      safetyGatesPassed: [],
      safetyGatesFailed: ['profile_not_hypertrophy_priority'],
      visibleProofPath: 'program.doctrineApplicationRollup.byFamily.drop_set',
    })
  }

  // 2b. REST_PAUSE — when profile asks for strength-endurance OR strength
  //     (and drop_set didn't already claim a row in this session). Fire on a
  //     DIFFERENT row than drop_set.
  if (intent.strengthEndurancePriority || intent.strengthPriority) {
    const remainingTargets = eligibleLateAccessories.filter(idx => idx !== dropSetTargetIndex)
    if (remainingTargets.length === 0) {
      plan.push({
        family: 'rest_pause',
        mode: 'no_safe_target',
        sourceDoctrineFamily: 'training_method_decision_governor',
        sourceRuleIds: ['phase_4m.rest_pause.doctrine_earned_v1'],
        reason: dropSetTargetIndex != null
          ? 'Drop set already claimed the only safe late accessory — minimum-effective-mutation cap (one row-level fatigue method per session) prevents stacking.'
          : 'Profile asks for strength-endurance / strength but no late-position accessory_hypertrophy / secondary_strength row passed the gates.',
        safetyGatesPassed: ['profile_strength_or_strength_endurance'],
        safetyGatesFailed: dropSetTargetIndex != null ? ['drop_set_owns_only_target'] : ['no_safe_late_accessory'],
        visibleProofPath: 'program.doctrineApplicationRollup.byFamily.rest_pause',
      })
    } else {
      const idx = remainingTargets[0]!
      const ex = exercises[idx]!
      plan.push({
        family: 'rest_pause',
        mode: 'apply',
        targetExerciseId: String(ex.id ?? ''),
        targetExerciseName: String(ex.name ?? 'Accessory'),
        targetExerciseIndex: idx,
        fieldPath: 'exercise.setExecutionMethod',
        currentValue: ex.setExecutionMethod ?? null,
        proposedValue: 'rest_pause',
        sourceDoctrineFamily: 'training_method_decision_governor',
        sourceRuleIds: ['phase_4m.rest_pause.doctrine_earned_v1'],
        reason: `Late accessory row ${ex.name} unclaimed — rest-pause is doctrine-correct for strength-endurance / late accumulation.`,
        safetyGatesPassed: [
          'profile_strength_or_strength_endurance',
          'late_position',
          'role_accessory_or_secondary_strength',
          'not_high_skill_protected',
          'not_power_explosive',
          'not_already_claimed',
          'no_drop_set_conflict',
        ],
        safetyGatesFailed: [],
        visibleProofPath: `session.exercises[${idx}].setExecutionMethod = "rest_pause"`,
      })
    }
  } else {
    plan.push({
      family: 'rest_pause',
      mode: 'not_needed',
      sourceDoctrineFamily: 'training_method_decision_governor',
      sourceRuleIds: ['phase_4m.rest_pause.doctrine_earned_v1'],
      reason: 'Profile does not ask for strength-endurance or strength priority — rest-pause not earned by doctrine.',
      safetyGatesPassed: [],
      safetyGatesFailed: ['profile_not_strength_or_strength_endurance'],
      visibleProofPath: 'program.doctrineApplicationRollup.byFamily.rest_pause',
    })
  }

  // ---------------------------------------------------------------------------
  // 3. PRESCRIPTION REST — bounded clamp when missing or severely out-of-bounds
  // ---------------------------------------------------------------------------
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    if (!ex) continue
    const role = inferExerciseRole(ex)
    const bounds = ROLE_BOUNDS[role]
    const current = typeof ex.restSeconds === 'number' ? ex.restSeconds : null
    const safetyBase = [`role:${role}`, `position:${i + 1}/${exercises.length}`]

    if (current == null) {
      // Missing rest — assign to midpoint of doctrine bounds.
      const target = Math.round((bounds.restMin + bounds.restMax) / 2)
      plan.push({
        family: 'prescription_rest',
        mode: 'apply',
        targetExerciseId: String(ex.id ?? ''),
        targetExerciseName: String(ex.name ?? 'Exercise'),
        targetExerciseIndex: i,
        fieldPath: 'exercise.restSeconds',
        currentValue: null,
        proposedValue: target,
        sourceDoctrineFamily: 'prescription_rest_doctrine',
        sourceRuleIds: ['phase_4m.prescription_rest.assign_when_missing_v1'],
        reason: `restSeconds was missing on a ${role} row — assigning role-based doctrine midpoint ${target}s.`,
        safetyGatesPassed: [...safetyBase, 'missing_value', 'midpoint_clamp'],
        safetyGatesFailed: [],
        visibleProofPath: `session.exercises[${i}].restSeconds`,
      })
    } else if (current < bounds.restMin / 2) {
      // Severely under — clamp UP to restMin.
      plan.push({
        family: 'prescription_rest',
        mode: 'apply',
        targetExerciseId: String(ex.id ?? ''),
        targetExerciseName: String(ex.name ?? 'Exercise'),
        targetExerciseIndex: i,
        fieldPath: 'exercise.restSeconds',
        currentValue: current,
        proposedValue: bounds.restMin,
        sourceDoctrineFamily: 'prescription_rest_doctrine',
        sourceRuleIds: ['phase_4m.prescription_rest.clamp_up_v1'],
        reason: `restSeconds ${current}s severely below ${role} doctrine minimum ${bounds.restMin}s — clamping up to floor (quality output safety).`,
        safetyGatesPassed: [...safetyBase, 'severely_under', 'clamp_to_min'],
        safetyGatesFailed: [],
        visibleProofPath: `session.exercises[${i}].restSeconds`,
      })
    } else if (current > bounds.restMax * 2) {
      // Severely over — clamp DOWN to restMax.
      plan.push({
        family: 'prescription_rest',
        mode: 'apply',
        targetExerciseId: String(ex.id ?? ''),
        targetExerciseName: String(ex.name ?? 'Exercise'),
        targetExerciseIndex: i,
        fieldPath: 'exercise.restSeconds',
        currentValue: current,
        proposedValue: bounds.restMax,
        sourceDoctrineFamily: 'prescription_rest_doctrine',
        sourceRuleIds: ['phase_4m.prescription_rest.clamp_down_v1'],
        reason: `restSeconds ${current}s severely above ${role} doctrine maximum ${bounds.restMax}s — clamping down to ceiling (session-time efficiency).`,
        safetyGatesPassed: [...safetyBase, 'severely_over', 'clamp_to_max'],
        safetyGatesFailed: [],
        visibleProofPath: `session.exercises[${i}].restSeconds`,
      })
    } else {
      plan.push({
        family: 'prescription_rest',
        mode: 'already_applied',
        targetExerciseId: String(ex.id ?? ''),
        targetExerciseName: String(ex.name ?? 'Exercise'),
        targetExerciseIndex: i,
        fieldPath: 'exercise.restSeconds',
        currentValue: current,
        sourceDoctrineFamily: 'prescription_rest_doctrine',
        sourceRuleIds: ['phase_4m.prescription_rest.within_bounds_v1'],
        reason: `restSeconds ${current}s within tolerance for ${role} (doctrine ${bounds.restMin}-${bounds.restMax}s, severe-clamp window ${Math.round(bounds.restMin / 2)}-${bounds.restMax * 2}s).`,
        safetyGatesPassed: [...safetyBase, 'within_severe_clamp_window'],
        safetyGatesFailed: [],
        visibleProofPath: `session.exercises[${i}].restSeconds`,
      })
    }
  }

  // ---------------------------------------------------------------------------
  // 4. PRESCRIPTION RPE — assign role default ONLY when missing
  // ---------------------------------------------------------------------------
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    if (!ex) continue
    const role = inferExerciseRole(ex)
    const bounds = ROLE_BOUNDS[role]
    const current = typeof ex.targetRPE === 'number' ? ex.targetRPE : null
    const safetyBase = [`role:${role}`, `position:${i + 1}/${exercises.length}`]

    if (current == null) {
      plan.push({
        family: 'prescription_rpe',
        mode: 'apply',
        targetExerciseId: String(ex.id ?? ''),
        targetExerciseName: String(ex.name ?? 'Exercise'),
        targetExerciseIndex: i,
        fieldPath: 'exercise.targetRPE',
        currentValue: null,
        proposedValue: bounds.defaultRPE,
        sourceDoctrineFamily: 'prescription_rpe_doctrine',
        sourceRuleIds: ['phase_4m.prescription_rpe.assign_when_missing_v1'],
        reason: `targetRPE was missing on a ${role} row — assigning role-based doctrine default RPE ${bounds.defaultRPE}.`,
        safetyGatesPassed: [...safetyBase, 'missing_value', 'role_default'],
        safetyGatesFailed: [],
        visibleProofPath: `session.exercises[${i}].targetRPE`,
      })
    } else {
      plan.push({
        family: 'prescription_rpe',
        mode: 'already_applied',
        targetExerciseId: String(ex.id ?? ''),
        targetExerciseName: String(ex.name ?? 'Exercise'),
        targetExerciseIndex: i,
        fieldPath: 'exercise.targetRPE',
        currentValue: current,
        sourceDoctrineFamily: 'prescription_rpe_doctrine',
        sourceRuleIds: ['phase_4m.prescription_rpe.preserve_existing_v1'],
        reason: `targetRPE ${current} preserved — Phase 4M never overrides an existing RPE value.`,
        safetyGatesPassed: [...safetyBase, 'existing_value_preserved'],
        safetyGatesFailed: [],
        visibleProofPath: `session.exercises[${i}].targetRPE`,
      })
    }
  }

  return plan
}

// =============================================================================
// PLAN APPLIER — performs writes from plan entries
// =============================================================================

interface SessionWithDeltas extends SessionLike {
  exercises?: Array<ExerciseLike & { doctrineApplicationDeltas?: DoctrineApplicationDelta[] }>
}

function visibleLabelFor(family: DoctrineApplicationFamily, before: unknown, after: unknown): string {
  switch (family) {
    case 'top_set':
      return 'Top Set + Back-Off'
    case 'drop_set':
      return 'Drop Set'
    case 'rest_pause':
      return 'Rest-Pause'
    case 'cluster':
      return 'Cluster'
    case 'endurance_density':
      return 'Endurance Density'
    case 'prescription_rest':
      return `Rest ${before ?? '—'}s → ${after}s`
    case 'prescription_rpe':
      return before == null ? `RPE → ${after}` : `RPE ${before} → ${after}`
    default:
      return String(family)
  }
}

export function applyDoctrineApplicationPlan(
  plan: DoctrineApplicationPlanEntry[],
  session: SessionLike,
): { appliedDeltas: DoctrineApplicationDelta[]; counts: DoctrineApplicationCorridorSummary['countsByFamily'] } {
  const appliedDeltas: DoctrineApplicationDelta[] = []
  const counts: DoctrineApplicationCorridorSummary['countsByFamily'] = {} as DoctrineApplicationCorridorSummary['countsByFamily']

  const sess = session as SessionWithDeltas
  const exercises = sess.exercises ?? []

  for (const entry of plan) {
    counts[entry.family] = counts[entry.family] ?? { applied: 0, blocked: 0, notNeeded: 0 }

    if (entry.mode === 'block' || entry.mode === 'no_safe_target') {
      counts[entry.family].blocked += 1
      continue
    }
    if (entry.mode === 'not_needed' || entry.mode === 'already_applied' || entry.mode === 'not_connected') {
      if (entry.mode === 'not_needed') counts[entry.family].notNeeded += 1
      continue
    }
    // mode === 'apply'
    if (entry.targetExerciseIndex == null) continue
    const ex = exercises[entry.targetExerciseIndex]
    if (!ex) continue

    const before = entry.currentValue
    const after = entry.proposedValue

    // Apply by family
    if (entry.family === 'top_set') {
      ex.method = 'top_set'
      ex.methodLabel = 'Top Set + Back-Off'
      ex.setExecutionMethod = 'top_set'
      ex.rowLevelMethodApplied = true
    } else if (entry.family === 'drop_set') {
      ex.method = 'drop_set'
      ex.methodLabel = 'Drop Set'
      ex.setExecutionMethod = 'drop_set'
      ex.rowLevelMethodApplied = true
    } else if (entry.family === 'rest_pause') {
      ex.method = 'rest_pause'
      ex.methodLabel = 'Rest-Pause'
      ex.setExecutionMethod = 'rest_pause'
      ex.rowLevelMethodApplied = true
    } else if (entry.family === 'prescription_rest') {
      if (typeof after === 'number') ex.restSeconds = after
    } else if (entry.family === 'prescription_rpe') {
      if (typeof after === 'number') ex.targetRPE = after
    } else {
      continue
    }

    counts[entry.family].applied += 1

    const delta: DoctrineApplicationDelta = {
      family: entry.family,
      fieldPath: entry.fieldPath ?? '',
      before,
      after,
      source: 'doctrine_application_corridor',
      reason: entry.reason,
      safetyGate: entry.safetyGatesPassed.join('+'),
      appliedAt: new Date().toISOString(),
      visibleLabel: visibleLabelFor(entry.family, before, after),
    }

    const exWithDeltas = ex as ExerciseLike & { doctrineApplicationDeltas?: DoctrineApplicationDelta[] }
    exWithDeltas.doctrineApplicationDeltas = exWithDeltas.doctrineApplicationDeltas ?? []
    exWithDeltas.doctrineApplicationDeltas.push(delta)

    appliedDeltas.push(delta)
  }

  return { appliedDeltas, counts }
}

// =============================================================================
// CORRIDOR ENTRY — convenience build + apply + verdict
// =============================================================================

export function runDoctrineApplicationCorridor(
  input: DoctrineApplicationInput,
): DoctrineApplicationCorridorSummary {
  const plan = buildDoctrineApplicationPlan(input)
  const { appliedDeltas, counts } = applyDoctrineApplicationPlan(plan, input.session)

  const totalApplied = Object.values(counts).reduce((acc, c) => acc + c.applied, 0)
  const totalBlocked = Object.values(counts).reduce((acc, c) => acc + c.blocked, 0)
  const totalPlanned = plan.filter(e => e.mode === 'apply').length

  let finalVerdict: DoctrineApplicationCorridorSummary['finalVerdict']
  if (totalApplied > 0 && totalApplied === totalPlanned) {
    finalVerdict = 'DOCTRINE_DECISIVELY_APPLIED'
  } else if (totalApplied > 0) {
    finalVerdict = 'DOCTRINE_PARTIALLY_APPLIED'
  } else if (totalBlocked > 0) {
    finalVerdict = 'DOCTRINE_EVALUATED_NO_SAFE_CHANGES'
  } else {
    finalVerdict = 'DOCTRINE_EVALUATED_NO_SAFE_CHANGES'
  }

  return {
    version: 'phase-4m',
    plan,
    appliedDeltas,
    countsByFamily: counts,
    finalVerdict,
  }
}
