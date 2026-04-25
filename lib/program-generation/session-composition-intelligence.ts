/**
 * SESSION COMPOSITION INTELLIGENCE ENGINE
 * 
 * =============================================================================
 * AUTHORITATIVE SESSION STRUCTURE DECISIONS
 * =============================================================================
 * 
 * This engine is responsible for:
 * - Session role composition (what blocks are included)
 * - Block ordering (what comes first, second, etc.)
 * - Workload distribution (how much of each type)
 * - Method eligibility (when supersets/circuits/density are earned)
 * - Support exercise placement (where support work belongs)
 * - Session density and complexity boundaries
 * 
 * PHILOSOPHY:
 * A well-composed session should feel like intentional coaching, not template assembly.
 * Every block inclusion/exclusion must be justified by canonical athlete truth.
 */

import type { DayStructure, DayFocus } from '../program-structure-engine'
import type { ExperienceLevel, SessionLength, PrimaryGoal } from '../program-service'
import type { EquipmentType } from '../equipment'
import type { SessionArchitectureTruthContract } from '../session-architecture-truth'
import type { DoctrineRuntimeContract } from '../doctrine-runtime-contract'
// [WEEKLY-SESSION-ROLE-CONTRACT] Authoritative per-day weekly role.
// This is the single owner of "what role does THIS day play in the week" —
// it differentiates breadth target, intensity class, progression character,
// and method allowance ACROSS the week so days are not flat copies.
import type { WeeklyDayRole } from '../program/weekly-session-role-contract'
import { isMethodPermittedByRole } from '../program/weekly-session-role-contract'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Session block role - what function a block serves
 */
export type SessionBlockRole =
  | 'warmup_general'          // General warm-up (always first)
  | 'warmup_specific'         // Skill-specific preparation
  | 'primary_skill'           // Main skill work for the day
  | 'primary_strength'        // Main strength work for the day
  | 'secondary_skill'         // Secondary skill expression
  | 'secondary_strength'      // Secondary strength work
  | 'support_carryover'       // Support work that transfers to primary
  | 'accessory_targeted'      // Targeted accessory work
  | 'prehab_joint_care'       // Joint protection / prehab
  | 'method_density'          // Density block (EMOM, circuits)
  | 'method_superset'         // Superset pairing
  | 'finisher_conditioning'   // End-of-session conditioning
  | 'flexibility_dedicated'   // Dedicated flexibility work
  | 'cooldown'                // Session cooldown

/**
 * Block priority level - determines if a block is required, recommended, or optional
 */
export type BlockPriority = 'required' | 'recommended' | 'optional' | 'omit'

/**
 * Method eligibility status
 */
export type MethodEligibility = 'earned' | 'allowed' | 'discouraged' | 'blocked'

/**
 * Session composition blueprint - the authoritative structure for a session
 */
export interface SessionCompositionBlueprint {
  // Session identity
  sessionIntent: string
  sessionComplexity: 'minimal' | 'standard' | 'comprehensive'
  estimatedDurationMinutes: number
  
  // Block composition
  blocks: SessionBlockPlan[]
  blockCount: number
  
  // Method decisions
  methodEligibility: {
    supersets: MethodEligibility
    circuits: MethodEligibility
    density: MethodEligibility
    finisher: MethodEligibility
  }
  
  // Workload distribution
  workloadDistribution: {
    primaryWorkPercent: number
    secondaryWorkPercent: number
    supportWorkPercent: number
    conditioningPercent: number
  }
  
  // Composition reasons (for explainability)
  compositionReasons: SessionCompositionReason[]
  
  // Audit trail
  audit: {
    primaryGoalDominated: boolean
    secondaryGoalContained: boolean
    progressionRespected: boolean
    equipmentUtilized: boolean
    jointProtectionApplied: boolean
    methodsEarned: boolean
    templateEscaped: boolean
  }

  // ==========================================================================
  // [WEEKLY-SESSION-ROLE-CONTRACT] Compact summary of the day role this
  // blueprint was generated against. Surfaced to the program-display
  // contract / session card so the visible Program page can differentiate
  // days by role without re-deriving truth.
  // ==========================================================================
  weeklyRoleSummary?: {
    roleId: string
    roleLabel: string
    intensityClass: string
    progressionCharacter: string
    breadthTarget: { min: number; target: number; max: number }
    weeklyRationale: string
    methodAllowance: {
      density: string
      supersets: string
      circuits: string
      finisher: string
      cluster: string
    }
  } | null
}

/**
 * Individual block plan within the session
 */
export interface SessionBlockPlan {
  role: SessionBlockRole
  priority: BlockPriority
  orderPosition: number
  estimatedMinutes: number
  exerciseSlots: number
  intensityLevel: 'high' | 'moderate' | 'low'
  fatigueContribution: 'high' | 'medium' | 'low' | 'minimal'
  placementReason: string
  
  // Constraints
  constraints: {
    mustPrecedeBlocks: SessionBlockRole[]
    mustFollowBlocks: SessionBlockRole[]
    cannotCoexistWith: SessionBlockRole[]
  }
}

/**
 * Composition reason for audit trail
 */
export interface SessionCompositionReason {
  code: SessionCompositionReasonCode
  description: string
  affectedBlocks: SessionBlockRole[]
  sourceField: string
}

export type SessionCompositionReasonCode =
  | 'primary_goal_anchor'
  | 'secondary_goal_support'
  | 'current_progression_fit'
  | 'recovery_limited_structure'
  | 'high_frequency_distribution'
  | 'joint_protection_simplification'
  | 'skill_quality_first_ordering'
  | 'equipment_fit_structure'
  | 'support_carryover_placement'
  | 'method_earned_by_context'
  | 'method_blocked_by_context'
  | 'finisher_omitted_for_quality'
  | 'density_allowed_by_profile'
  | 'superset_allowed_by_profile'
  | 'template_escape_achieved'
  | 'neural_demand_ordering'
  | 'fatigue_cascade_prevention'

// =============================================================================
// SESSION COMPOSITION CONTEXT
// =============================================================================

/**
 * [WEEKLY-COMPOSITION-UPGRADE] Week-level load strategy from WeekAdaptationDecision
 * This drives session-level volume/intensity/density/finisher decisions
 */
export interface WeeklyLoadStrategy {
  volumeBias: 'reduced' | 'normal' | 'elevated'
  intensityBias: 'reduced' | 'normal' | 'elevated'
  densityBias: 'reduced' | 'normal' | 'elevated'
  finisherBias: 'limited' | 'normal' | 'expanded'
  straightArmExposureBias: 'protected' | 'normal' | 'expanded'
  connectiveTissueBias: 'protected' | 'normal'
  restSpacingBias: 'increased' | 'normal'
}

/**
 * [WEEKLY-COMPOSITION-UPGRADE] First-week protection settings
 */
export interface FirstWeekProtection {
  active: boolean
  reduceSets: boolean
  reduceRPE: boolean
  suppressFinishers: boolean
  protectHighStressPatterns: boolean
  reasons: string[]
}

export interface SessionCompositionContext {
  // Day structure
  day: DayStructure
  sessionIndex: number
  totalSessions: number
  
  // Goals
  primaryGoal: PrimaryGoal
  secondaryGoal: string | null
  selectedSkills: string[]
  
  // Athlete profile
  experienceLevel: ExperienceLevel
  equipment: EquipmentType[]
  jointCautions: string[]
  
  // Session constraints
  sessionLength: SessionLength
  sessionMinutes: number
  
  // Training style
  trainingStyle: 'pure_skill' | 'hybrid' | 'weighted_integrated' | 'minimalist'
  
  // Recovery/fatigue
  fatigueState: 'fresh' | 'moderate' | 'accumulated' | 'needs_deload'
  recoveryCapacity: 'high' | 'moderate' | 'limited'
  
  // Progression truth
  currentWorkingProgressions: Record<string, {
    currentWorkingProgression: string | null
    historicalCeiling: string | null
  }> | null
  
  // Architecture contracts
  sessionArchitectureTruth: SessionArchitectureTruthContract | null
  doctrineRuntimeContract: DoctrineRuntimeContract | null
  
  // Recent history
  recentSessionShapes?: string[]
  
  // ==========================================================================
  // [WEEKLY-COMPOSITION-UPGRADE] Week-level adaptation decisions
  // These drive session-level dosage/complexity decisions
  // ==========================================================================
  weeklyLoadStrategy?: WeeklyLoadStrategy | null
  firstWeekProtection?: FirstWeekProtection | null
  
  // Week-level complexity context
  weeklyComplexity?: 'low' | 'moderate' | 'high'
  adaptationPhase?: 'initial_acclimation' | 'normal_progression' | 'recovery_constrained' | 'rebuild_after_disruption'

  // ==========================================================================
  // [WEEKLY-SESSION-ROLE-CONTRACT] Authoritative day role for THIS session.
  // When present, this controls:
  //   - complexity tier biasing (skill_quality / recovery_supportive narrow it,
  //     broad_mixed / density_capacity widen it)
  //   - method eligibility gating (a recovery_supportive day cannot earn
  //     density even if everything else qualifies)
  //   - primary block exerciseSlots (nudged toward role.breadthTarget.target)
  //
  // If absent, composition falls back to its prior heuristics so the contract
  // is a strict ENHANCEMENT, never a regression for any caller that hasn't
  // adopted weekly roles yet.
  // ==========================================================================
  weeklyRole?: WeeklyDayRole | null
}

// =============================================================================
// BLOCK ORDERING RULES
// =============================================================================

/**
 * Canonical block ordering by fatigue cost and neural demand
 * Lower number = earlier in session
 */
const BLOCK_ORDER_PRIORITY: Record<SessionBlockRole, number> = {
  warmup_general: 1,
  warmup_specific: 2,
  primary_skill: 3,       // Skills first when CNS is fresh
  primary_strength: 4,    // Heavy strength before fatigue accumulates
  secondary_skill: 5,     // Secondary skill while still fresh
  secondary_strength: 6,
  support_carryover: 7,   // Support after main work
  accessory_targeted: 8,  // Accessories can tolerate fatigue
  prehab_joint_care: 9,   // Joint care can be done somewhat fatigued
  method_superset: 10,    // Supersets in middle of session
  method_density: 11,     // Density work tolerates accumulated fatigue
  finisher_conditioning: 12, // Finishers at end
  flexibility_dedicated: 13, // Flexibility after everything
  cooldown: 14,           // Always last
}

/**
 * Block constraints - what blocks cannot coexist or must follow others
 */
const BLOCK_CONSTRAINTS: Partial<Record<SessionBlockRole, {
  mustPrecedeBlocks: SessionBlockRole[]
  mustFollowBlocks: SessionBlockRole[]
  cannotCoexistWith: SessionBlockRole[]
}>> = {
  primary_skill: {
    mustPrecedeBlocks: ['secondary_strength', 'accessory_targeted', 'method_density', 'finisher_conditioning'],
    mustFollowBlocks: ['warmup_general', 'warmup_specific'],
    cannotCoexistWith: [],
  },
  primary_strength: {
    mustPrecedeBlocks: ['accessory_targeted', 'method_density', 'finisher_conditioning'],
    mustFollowBlocks: ['warmup_general', 'warmup_specific'],
    cannotCoexistWith: [],
  },
  method_density: {
    mustPrecedeBlocks: ['finisher_conditioning', 'flexibility_dedicated', 'cooldown'],
    mustFollowBlocks: ['primary_skill', 'primary_strength', 'secondary_skill', 'secondary_strength'],
    cannotCoexistWith: ['method_superset'], // Don't mix density and supersets
  },
  finisher_conditioning: {
    mustPrecedeBlocks: ['flexibility_dedicated', 'cooldown'],
    mustFollowBlocks: ['primary_skill', 'primary_strength', 'support_carryover'],
    cannotCoexistWith: [],
  },
}

// =============================================================================
// SESSION COMPLEXITY BUDGETS
// =============================================================================

interface SessionComplexityBudget {
  maxBlocks: number
  maxPrimaryBlocks: number
  maxSecondaryBlocks: number
  maxSupportBlocks: number
  maxMethodBlocks: number
  minPrimaryPercent: number
  maxConditioningPercent: number
}

const COMPLEXITY_BUDGETS: Record<'minimal' | 'standard' | 'comprehensive', SessionComplexityBudget> = {
  minimal: {
    maxBlocks: 5,
    maxPrimaryBlocks: 1,
    maxSecondaryBlocks: 0,
    maxSupportBlocks: 1,
    maxMethodBlocks: 0,
    minPrimaryPercent: 50,
    maxConditioningPercent: 10,
  },
  standard: {
    maxBlocks: 7,
    maxPrimaryBlocks: 2,
    maxSecondaryBlocks: 1,
    maxSupportBlocks: 2,
    maxMethodBlocks: 1,
    minPrimaryPercent: 40,
    maxConditioningPercent: 20,
  },
  comprehensive: {
    maxBlocks: 9,
    maxPrimaryBlocks: 2,
    maxSecondaryBlocks: 2,
    maxSupportBlocks: 3,
    maxMethodBlocks: 2,
    minPrimaryPercent: 35,
    maxConditioningPercent: 25,
  },
}

// =============================================================================
// MAIN COMPOSITION FUNCTIONS
// =============================================================================

/**
 * [WEEKLY-COMPOSITION-UPGRADE] Week-level adaptation input for session composition
 * This connects the WeekAdaptationDecision to session-level decisions
 */
export interface WeekAdaptationInput {
  loadStrategy?: WeeklyLoadStrategy | null
  firstWeekProtection?: FirstWeekProtection | null
  weeklyComplexity?: 'low' | 'moderate' | 'high'
  adaptationPhase?: 'initial_acclimation' | 'normal_progression' | 'recovery_constrained' | 'rebuild_after_disruption'
}

/**
 * Build the canonical session composition context from available inputs
 * 
 * [WEEKLY-COMPOSITION-UPGRADE] Now accepts weekAdaptation parameter to connect
 * week-level decisions to session composition
 */
export function buildSessionCompositionContext(
  day: DayStructure,
  sessionIndex: number,
  totalSessions: number,
  primaryGoal: PrimaryGoal,
  secondaryGoal: string | null,
  selectedSkills: string[],
  experienceLevel: ExperienceLevel,
  equipment: EquipmentType[],
  jointCautions: string[],
  sessionLength: SessionLength,
  sessionMinutes: number,
  currentWorkingProgressions: Record<string, { currentWorkingProgression: string | null; historicalCeiling: string | null }> | null,
  sessionArchitectureTruth: SessionArchitectureTruthContract | null,
  doctrineRuntimeContract: DoctrineRuntimeContract | null,
  fatigueState?: 'fresh' | 'moderate' | 'accumulated' | 'needs_deload',
  recentSessionShapes?: string[],
  weekAdaptation?: WeekAdaptationInput | null,
  // [WEEKLY-SESSION-ROLE-CONTRACT] Optional authoritative day role.
  // Caller (adaptive-program-builder) builds the contract once for the week
  // and passes dayRoles[index] here. When provided, it is the strongest
  // upstream signal for breadth / method gating / complexity tier.
  weeklyRole?: WeeklyDayRole | null
): SessionCompositionContext {
  // Determine training style from equipment and profile
  const hasWeightedEquipment = equipment.some(eq => 
    ['barbell', 'dumbbells', 'kettlebell', 'weight_plates', 'cable_machine'].includes(eq)
  )
  
  const trainingStyle: 'pure_skill' | 'hybrid' | 'weighted_integrated' | 'minimalist' = 
    !hasWeightedEquipment && equipment.length <= 2 ? 'minimalist' :
    !hasWeightedEquipment ? 'pure_skill' :
    equipment.length <= 4 ? 'hybrid' : 'weighted_integrated'
  
  // [WEEKLY-COMPOSITION-UPGRADE] Recovery capacity now also considers week-level protection
  const isFirstWeekProtected = weekAdaptation?.firstWeekProtection?.active === true
  const isRecoveryConstrained = weekAdaptation?.adaptationPhase === 'recovery_constrained'
  
  let recoveryCapacity: 'high' | 'moderate' | 'limited' = 
    fatigueState === 'needs_deload' ? 'limited' :
    fatigueState === 'accumulated' ? 'limited' :
    experienceLevel === 'beginner' ? 'limited' :
    experienceLevel === 'advanced' ? 'high' : 'moderate'
  
  // Apply week-level constraints to recovery capacity
  if (isFirstWeekProtected || isRecoveryConstrained) {
    recoveryCapacity = 'limited'
  }
  
  // [WEEKLY-COMPOSITION-UPGRADE] Log week adaptation wiring
  if (weekAdaptation) {
    console.log('[session-composition-week-adaptation-wired]', {
      sessionIndex,
      dayFocus: day.focus,
      hasLoadStrategy: !!weekAdaptation.loadStrategy,
      hasFirstWeekProtection: !!weekAdaptation.firstWeekProtection,
      firstWeekActive: weekAdaptation.firstWeekProtection?.active,
      adaptationPhase: weekAdaptation.adaptationPhase,
      weeklyComplexity: weekAdaptation.weeklyComplexity,
      volumeBias: weekAdaptation.loadStrategy?.volumeBias,
      finisherBias: weekAdaptation.loadStrategy?.finisherBias,
      recoveryCapacityResult: recoveryCapacity,
    })
  }
  
  return {
    day,
    sessionIndex,
    totalSessions,
    primaryGoal,
    secondaryGoal,
    selectedSkills,
    experienceLevel,
    equipment,
    jointCautions,
    sessionLength,
    sessionMinutes,
    trainingStyle,
    fatigueState: fatigueState || 'fresh',
    recoveryCapacity,
    currentWorkingProgressions,
    sessionArchitectureTruth,
    doctrineRuntimeContract,
    recentSessionShapes,
    // [WEEKLY-COMPOSITION-UPGRADE] Pass through week-level decisions
    weeklyLoadStrategy: weekAdaptation?.loadStrategy || null,
    firstWeekProtection: weekAdaptation?.firstWeekProtection || null,
    weeklyComplexity: weekAdaptation?.weeklyComplexity,
    adaptationPhase: weekAdaptation?.adaptationPhase,
    // [WEEKLY-SESSION-ROLE-CONTRACT] Pass through authoritative day role
    weeklyRole: weeklyRole ?? null,
  }
}

/**
 * Determine session complexity level based on context
 * 
 * [WEEKLY-COMPOSITION-UPGRADE] Now respects week-level load strategy and first-week protection
 */
export function determineSessionComplexity(
  ctx: SessionCompositionContext
): 'minimal' | 'standard' | 'comprehensive' {
  // ==========================================================================
  // [WEEKLY-COMPOSITION-UPGRADE] First-week protection forces simpler sessions
  // ==========================================================================
  if (ctx.firstWeekProtection?.active) {
    console.log('[session-complexity-first-week-governor]', {
      sessionIndex: ctx.sessionIndex,
      dayFocus: ctx.day.focus,
      firstWeekActive: true,
      reasons: ctx.firstWeekProtection.reasons.slice(0, 2),
      verdict: 'COMPLEXITY_CAPPED_TO_MINIMAL_OR_STANDARD',
    })
    // First week caps at standard complexity, even for long sessions
    if (ctx.sessionMinutes <= 45) return 'minimal'
    return 'standard'
  }
  
  // ==========================================================================
  // [WEEKLY-COMPOSITION-UPGRADE] Volume bias affects complexity ceiling
  // ==========================================================================
  if (ctx.weeklyLoadStrategy?.volumeBias === 'reduced') {
    // Reduced volume bias caps complexity one level down
    if (ctx.sessionMinutes >= 75 && ctx.recoveryCapacity === 'high') {
      return 'standard' // Would have been comprehensive
    }
    if (ctx.sessionMinutes >= 45) {
      return 'minimal' // Would have been standard
    }
    return 'minimal'
  }
  
  // Recovery-limited = minimal complexity
  if (ctx.fatigueState === 'needs_deload' || ctx.recoveryCapacity === 'limited') {
    return 'minimal'
  }
  
  // Short sessions = minimal complexity
  if (ctx.sessionMinutes <= 30) {
    return 'minimal'
  }
  
  // Beginner = standard max
  if (ctx.experienceLevel === 'beginner') {
    return ctx.sessionMinutes >= 60 ? 'standard' : 'minimal'
  }
  
  // ==========================================================================
  // [WEEKLY-COMPOSITION-UPGRADE] Elevated volume bias can unlock comprehensive
  // ==========================================================================
  if (ctx.weeklyLoadStrategy?.volumeBias === 'elevated' && 
      ctx.sessionMinutes >= 60 && ctx.recoveryCapacity !== 'limited') {
    return 'comprehensive'
  }
  
  // Long sessions with good recovery = comprehensive
  if (ctx.sessionMinutes >= 75 && ctx.recoveryCapacity === 'high') {
    return 'comprehensive'
  }
  
  // Standard sessions (45-75 min) = standard complexity
  if (ctx.sessionMinutes >= 45) {
    return 'standard'
  }
  
  return 'minimal'
}

/**
 * [WEEKLY-SESSION-ROLE-CONTRACT] Bias the resolved complexity tier by the
 * weekly role assigned to this day. This is what makes day-to-day
 * differentiation visible: two 60-min sessions in the same week phase will
 * NOT both come out as `standard` if one is a `recovery_supportive` day
 * and the other is a `broad_mixed_volume` day.
 *
 * Bias rules (intentionally conservative — never widens past `comprehensive`):
 *  - `skill_quality_emphasis`     -> at most `standard` (CNS-fresh quality, narrower)
 *  - `recovery_supportive`        -> always `minimal`
 *  - `broad_mixed_volume`         -> bumps `minimal` -> `standard` if duration allows
 *  - `density_capacity`           -> bumps `standard` -> `comprehensive` only when
 *                                    duration + recovery already permitted it
 *  - `primary_strength_emphasis`  -> kept at `standard` even on long sessions to
 *                                    preserve heavy-day quality (no comprehensive)
 *  - `secondary_support`          -> no change
 */
function applyWeeklyRoleComplexityBias(
  base: 'minimal' | 'standard' | 'comprehensive',
  ctx: SessionCompositionContext
): 'minimal' | 'standard' | 'comprehensive' {
  const role = ctx.weeklyRole
  if (!role) return base

  const tierRank = { minimal: 0, standard: 1, comprehensive: 2 }
  const rankToTier = ['minimal', 'standard', 'comprehensive'] as const

  let next = base

  switch (role.roleId) {
    case 'recovery_supportive':
      next = 'minimal'
      break
    case 'skill_quality_emphasis':
      // Cap at standard so the skill-quality day stays clean.
      if (tierRank[next] > tierRank.standard) next = 'standard'
      break
    case 'primary_strength_emphasis':
      // Heavy day must stay clean — never comprehensive.
      if (tierRank[next] > tierRank.standard) next = 'standard'
      break
    case 'broad_mixed_volume':
      // Broader day bumps a notch UP when duration allows.
      if (tierRank[next] < tierRank.standard && ctx.sessionMinutes >= 45) {
        next = 'standard'
      }
      break
    case 'density_capacity':
      // Density home bumps to comprehensive when already at standard and
      // duration / recovery / experience all allow it.
      if (
        tierRank[next] === tierRank.standard &&
        ctx.sessionMinutes >= 60 &&
        ctx.recoveryCapacity !== 'limited' &&
        ctx.experienceLevel !== 'beginner'
      ) {
        next = 'comprehensive'
      }
      break
    case 'secondary_support':
    default:
      break
  }

  if (next !== base) {
    console.log('[weekly-role-complexity-bias]', {
      sessionIndex: ctx.sessionIndex,
      dayFocus: ctx.day.focus,
      role: role.roleId,
      baseTier: base,
      biasedTier: next,
      breadthTarget: role.breadthTarget,
      reason: 'weekly_session_role_contract',
    })
  }

  return next
}

/**
 * [WEEKLY-SESSION-ROLE-CONTRACT] Tighten method eligibility by per-day role.
 *
 * The global `determineMethodEligibility` already accounts for fatigue,
 * recovery, training style, week-phase, etc. This function APPLIES the
 * per-day role on top so methods that the global rules would have allowed
 * are downgraded on days where the weekly role disallows them.
 *
 * Direction is one-way: ROLE CAN ONLY DOWNGRADE, never upgrade. This
 * preserves all the existing safety / acclimation / recovery rules that
 * the global function already enforces — we never bypass them.
 */
function applyWeeklyRoleMethodGating(
  base: ReturnType<typeof determineMethodEligibility>,
  ctx: SessionCompositionContext
): ReturnType<typeof determineMethodEligibility> {
  const role = ctx.weeklyRole
  if (!role) return base

  // Map role gate -> max allowed eligibility. `earned` lets global decide
  // (no change), `allowed` caps at `allowed`, `discouraged` caps at
  // `discouraged`, `blocked` forces `blocked`.
  function downgrade(method: keyof typeof base, gate: 'blocked' | 'discouraged' | 'allowed' | 'earned'): typeof base.density {
    const current = base[method]
    if (gate === 'blocked') return 'blocked'
    if (current === 'blocked') return 'blocked'
    if (gate === 'discouraged' && current === 'earned') return 'discouraged'
    if (gate === 'allowed' && current === 'earned') return 'allowed'
    return current
  }

  const next = {
    supersets: downgrade('supersets', role.methodAllowance.supersets),
    circuits: downgrade('circuits', role.methodAllowance.circuits),
    density: downgrade('density', role.methodAllowance.density),
    finisher: downgrade('finisher', role.methodAllowance.finisher),
  }

  const downgraded =
    next.supersets !== base.supersets ||
    next.circuits !== base.circuits ||
    next.density !== base.density ||
    next.finisher !== base.finisher

  if (downgraded) {
    console.log('[weekly-role-method-gating]', {
      sessionIndex: ctx.sessionIndex,
      dayFocus: ctx.day.focus,
      role: role.roleId,
      base,
      gated: next,
      reason: 'weekly_role_method_allowance_capped_eligibility',
    })
  }

  return next
}

/**
 * [WEEKLY-SESSION-ROLE-CONTRACT] Apply the role's breadth target to the
 * primary block(s) of the plan as a nudge — never breaking the budget for
 * the chosen complexity tier.
 *
 * We use the role's `breadthTarget` as a SOFT TARGET for primary + secondary
 * exercise slots combined. Days with broader role get +1 slot on the primary
 * block when complexity allows it. Days with narrower role get -1 slot. This
 * is what makes the visible exercise count differ across days even when
 * complexity tier is the same.
 */
function applyWeeklyRoleBreadthBias(
  blocks: SessionBlockPlan[],
  ctx: SessionCompositionContext
): SessionBlockPlan[] {
  const role = ctx.weeklyRole
  if (!role) return blocks

  const target = role.breadthTarget.target
  const min = role.breadthTarget.min
  const max = role.breadthTarget.max

  const next = blocks.map((b) => ({ ...b, constraints: b.constraints }))

  // Compute current planned body slot count (warmup / cooldown / prehab excluded).
  const bodyRoles: SessionBlockRole[] = [
    'primary_skill',
    'primary_strength',
    'secondary_skill',
    'secondary_strength',
    'support_carryover',
    'accessory_targeted',
    'method_density',
  ]
  const totalBodySlots = next
    .filter((b) => bodyRoles.includes(b.role))
    .reduce((s, b) => s + b.exerciseSlots, 0)

  let delta = 0
  if (totalBodySlots < min) {
    delta = min - totalBodySlots
  } else if (totalBodySlots > max) {
    delta = max - totalBodySlots // negative
  } else if (totalBodySlots < target) {
    // pull toward target by up to 1 slot
    delta = 1
  } else if (totalBodySlots > target) {
    delta = -1
  }

  if (delta === 0) return blocks

  // Apply delta to the largest body block (prefer primary blocks first).
  const primaryBlock = next.find(
    (b) => b.role === 'primary_skill' || b.role === 'primary_strength'
  )
  const supportBlock = next.find((b) => b.role === 'support_carryover' || b.role === 'accessory_targeted')

  if (delta > 0) {
    // Prefer adding to support (so heavy day stays clean).
    const target = supportBlock || primaryBlock
    if (target) target.exerciseSlots = Math.max(1, target.exerciseSlots + delta)
  } else {
    // Trim from accessory / support first.
    const trimTarget = supportBlock || primaryBlock
    if (trimTarget) trimTarget.exerciseSlots = Math.max(1, trimTarget.exerciseSlots + delta)
  }

  console.log('[weekly-role-breadth-bias]', {
    sessionIndex: ctx.sessionIndex,
    role: role.roleId,
    breadthTarget: role.breadthTarget,
    bodySlotsBefore: totalBodySlots,
    delta,
  })

  return next
}

/**
 * Determine method eligibility based on context
 * 
 * [WEEKLY-COMPOSITION-UPGRADE] Now respects week-level load strategy biases
 */
export function determineMethodEligibility(
  ctx: SessionCompositionContext
): {
  supersets: MethodEligibility
  circuits: MethodEligibility
  density: MethodEligibility
  finisher: MethodEligibility
} {
  const reasons: { method: string; status: MethodEligibility; reason: string }[] = []
  
  // Default to discouraged
  let supersets: MethodEligibility = 'discouraged'
  let circuits: MethodEligibility = 'discouraged'
  let density: MethodEligibility = 'discouraged'
  let finisher: MethodEligibility = 'discouraged'
  
  // ==========================================================================
  // [WEEKLY-COMPOSITION-UPGRADE] First-week protection blocks high-stress methods
  // ==========================================================================
  if (ctx.firstWeekProtection?.active) {
    if (ctx.firstWeekProtection.suppressFinishers) {
      finisher = 'blocked'
      reasons.push({ method: 'finisher', status: 'blocked', reason: 'first_week_suppression' })
    }
    if (ctx.firstWeekProtection.protectHighStressPatterns) {
      circuits = 'blocked'
      density = 'blocked'
      reasons.push({ method: 'circuits', status: 'blocked', reason: 'first_week_high_stress_protection' })
      reasons.push({ method: 'density', status: 'blocked', reason: 'first_week_high_stress_protection' })
    }
  }
  
  // ==========================================================================
  // [WEEKLY-COMPOSITION-UPGRADE] Week-level finisher bias
  // ==========================================================================
  const finisherBias = ctx.weeklyLoadStrategy?.finisherBias
  if (finisherBias === 'limited' && finisher !== 'blocked') {
    finisher = 'blocked'
    reasons.push({ method: 'finisher', status: 'blocked', reason: 'week_finisher_bias_limited' })
  }
  
  // ==========================================================================
  // [WEEKLY-COMPOSITION-UPGRADE] Week-level density bias
  // ==========================================================================
  const densityBias = ctx.weeklyLoadStrategy?.densityBias
  if (densityBias === 'reduced' && density !== 'blocked') {
    density = 'discouraged'
    reasons.push({ method: 'density', status: 'discouraged', reason: 'week_density_bias_reduced' })
  }
  
  // Check doctrine contract for method permissions (if not already blocked)
  const doctrineMethods = ctx.doctrineRuntimeContract?.methodDoctrine
  if (doctrineMethods) {
    if (doctrineMethods.supersetsAllowed && supersets !== 'blocked') supersets = 'allowed'
    if (doctrineMethods.circuitsAllowed && circuits !== 'blocked') circuits = 'allowed'
    if (doctrineMethods.densityAllowed && density !== 'blocked') density = 'allowed'
  }
  
  // Upgrade to "earned" based on context (only if not already blocked)
  
  // Supersets: earned if moderate+ recovery, standard+ complexity, 45+ min session
  if (supersets !== 'blocked' && ctx.recoveryCapacity !== 'limited' && 
      ctx.sessionMinutes >= 45 && ctx.experienceLevel !== 'beginner') {
    supersets = 'earned'
    reasons.push({ method: 'supersets', status: 'earned', reason: 'recovery_and_duration_allow' })
  }
  
  // Circuits: earned only if comprehensive complexity, high recovery, 60+ min
  if (circuits !== 'blocked' && ctx.recoveryCapacity === 'high' && 
      ctx.sessionMinutes >= 60 && ctx.experienceLevel === 'advanced') {
    circuits = 'earned'
    reasons.push({ method: 'circuits', status: 'earned', reason: 'advanced_with_capacity' })
  }
  
  // Density: earned if hybrid/weighted style, moderate+ recovery, 45+ min
  if (density !== 'blocked' && density !== 'discouraged' &&
      (ctx.trainingStyle === 'hybrid' || ctx.trainingStyle === 'weighted_integrated') &&
      ctx.recoveryCapacity !== 'limited' && ctx.sessionMinutes >= 45) {
    density = 'earned'
    reasons.push({ method: 'density', status: 'earned', reason: 'training_style_allows' })
  }
  
  // Finisher: earned if standard+ complexity, fresh/moderate fatigue, 60+ min
  // [WEEKLY-COMPOSITION-UPGRADE] Also check finisher bias allows it
  if (finisher !== 'blocked' && ctx.fatigueState !== 'needs_deload' && 
      ctx.fatigueState !== 'accumulated' && ctx.sessionMinutes >= 60) {
    // Elevated finisher bias makes it easier to earn
    if (finisherBias === 'expanded') {
      finisher = 'earned'
      reasons.push({ method: 'finisher', status: 'earned', reason: 'week_finisher_bias_expanded' })
    } else {
      finisher = ctx.experienceLevel !== 'beginner' ? 'earned' : 'allowed'
      reasons.push({ method: 'finisher', status: finisher, reason: 'recovery_allows_finisher' })
    }
  }
  
  // Downgrade all to blocked if recovery is severely limited
  if (ctx.fatigueState === 'needs_deload') {
    supersets = 'blocked'
    circuits = 'blocked'
    density = 'blocked'
    finisher = 'blocked'
  }
  
  // Downgrade to discouraged if day focus is recovery-oriented
  if (ctx.day.focus === 'support_recovery' || ctx.day.focus === 'flexibility_focus') {
    if (supersets !== 'blocked') supersets = 'discouraged'
    if (circuits !== 'blocked') circuits = 'blocked'
    if (density !== 'blocked') density = 'blocked'
    if (finisher !== 'blocked') finisher = 'blocked'
  }
  
  console.log('[SESSION-COMPOSITION-METHOD-ELIGIBILITY]', {
    sessionIndex: ctx.sessionIndex,
    dayFocus: ctx.day.focus,
    trainingStyle: ctx.trainingStyle,
    recoveryCapacity: ctx.recoveryCapacity,
    fatigueState: ctx.fatigueState,
    sessionMinutes: ctx.sessionMinutes,
    experienceLevel: ctx.experienceLevel,
    // [WEEKLY-COMPOSITION-UPGRADE] Log week-level bias influence
    weeklyFinisherBias: finisherBias,
    weeklyDensityBias: densityBias,
    firstWeekActive: ctx.firstWeekProtection?.active,
    eligibility: { supersets, circuits, density, finisher },
    reasons,
  })
  
  return { supersets, circuits, density, finisher }
}

/**
 * Build the session block plan based on context and complexity
 */
export function buildSessionBlockPlan(
  ctx: SessionCompositionContext,
  complexity: 'minimal' | 'standard' | 'comprehensive',
  methodEligibility: ReturnType<typeof determineMethodEligibility>
): SessionBlockPlan[] {
  const budget = COMPLEXITY_BUDGETS[complexity]
  const blocks: SessionBlockPlan[] = []
  const reasons: SessionCompositionReason[] = []
  
  // Always include warmup_general
  blocks.push({
    role: 'warmup_general',
    priority: 'required',
    orderPosition: BLOCK_ORDER_PRIORITY.warmup_general,
    estimatedMinutes: Math.min(5, ctx.sessionMinutes * 0.08),
    exerciseSlots: 3,
    intensityLevel: 'low',
    fatigueContribution: 'minimal',
    placementReason: 'Always start with general warm-up',
    constraints: { mustPrecedeBlocks: [], mustFollowBlocks: [], cannotCoexistWith: [] },
  })
  
  // Add warmup_specific if not minimal complexity
  if (complexity !== 'minimal') {
    blocks.push({
      role: 'warmup_specific',
      priority: 'recommended',
      orderPosition: BLOCK_ORDER_PRIORITY.warmup_specific,
      estimatedMinutes: Math.min(5, ctx.sessionMinutes * 0.08),
      exerciseSlots: 2,
      intensityLevel: 'low',
      fatigueContribution: 'minimal',
      placementReason: 'Skill-specific preparation for quality work',
      constraints: { mustPrecedeBlocks: ['primary_skill', 'primary_strength'], mustFollowBlocks: ['warmup_general'], cannotCoexistWith: [] },
    })
  }
  
  // Primary block - skill or strength based on day focus
  const isPrimarySkillDay = ctx.day.focus.includes('skill') || 
    ['planche', 'front_lever', 'handstand_pushup', 'muscle_up'].includes(ctx.primaryGoal)
  
  if (isPrimarySkillDay) {
    blocks.push({
      role: 'primary_skill',
      priority: 'required',
      orderPosition: BLOCK_ORDER_PRIORITY.primary_skill,
      estimatedMinutes: ctx.sessionMinutes * (complexity === 'minimal' ? 0.35 : 0.25),
      exerciseSlots: complexity === 'minimal' ? 1 : 2,
      intensityLevel: 'high',
      fatigueContribution: 'high',
      placementReason: `Primary ${ctx.primaryGoal} skill work - CNS-fresh positioning`,
      constraints: BLOCK_CONSTRAINTS.primary_skill || { mustPrecedeBlocks: [], mustFollowBlocks: [], cannotCoexistWith: [] },
    })
    reasons.push({
      code: 'primary_goal_anchor',
      description: `Session anchored by ${ctx.primaryGoal} skill work`,
      affectedBlocks: ['primary_skill'],
      sourceField: 'primaryGoal',
    })
  } else {
    blocks.push({
      role: 'primary_strength',
      priority: 'required',
      orderPosition: BLOCK_ORDER_PRIORITY.primary_strength,
      estimatedMinutes: ctx.sessionMinutes * (complexity === 'minimal' ? 0.35 : 0.25),
      exerciseSlots: complexity === 'minimal' ? 1 : 2,
      intensityLevel: 'high',
      fatigueContribution: 'high',
      placementReason: `Primary strength work for ${ctx.primaryGoal}`,
      constraints: BLOCK_CONSTRAINTS.primary_strength || { mustPrecedeBlocks: [], mustFollowBlocks: [], cannotCoexistWith: [] },
    })
    reasons.push({
      code: 'primary_goal_anchor',
      description: `Session anchored by ${ctx.primaryGoal} strength work`,
      affectedBlocks: ['primary_strength'],
      sourceField: 'primaryGoal',
    })
  }
  
  // Secondary block if complexity allows and secondary goal exists
  if (complexity !== 'minimal' && ctx.secondaryGoal && budget.maxSecondaryBlocks > 0) {
    const isSecondarySkill = ['planche', 'front_lever', 'handstand_pushup', 'muscle_up'].includes(ctx.secondaryGoal)
    
    if (isSecondarySkill) {
      blocks.push({
        role: 'secondary_skill',
        priority: 'recommended',
        orderPosition: BLOCK_ORDER_PRIORITY.secondary_skill,
        estimatedMinutes: ctx.sessionMinutes * 0.15,
        exerciseSlots: 1,
        intensityLevel: 'moderate',
        fatigueContribution: 'medium',
        placementReason: `Secondary ${ctx.secondaryGoal} expression - contained portion`,
        constraints: { mustPrecedeBlocks: ['accessory_targeted', 'method_density'], mustFollowBlocks: ['primary_skill', 'primary_strength'], cannotCoexistWith: [] },
      })
    } else {
      blocks.push({
        role: 'secondary_strength',
        priority: 'recommended',
        orderPosition: BLOCK_ORDER_PRIORITY.secondary_strength,
        estimatedMinutes: ctx.sessionMinutes * 0.15,
        exerciseSlots: 1,
        intensityLevel: 'moderate',
        fatigueContribution: 'medium',
        placementReason: `Secondary ${ctx.secondaryGoal} support`,
        constraints: { mustPrecedeBlocks: ['accessory_targeted', 'method_density'], mustFollowBlocks: ['primary_skill', 'primary_strength'], cannotCoexistWith: [] },
      })
    }
    
    reasons.push({
      code: 'secondary_goal_support',
      description: `Secondary goal ${ctx.secondaryGoal} expressed in contained block`,
      affectedBlocks: [isSecondarySkill ? 'secondary_skill' : 'secondary_strength'],
      sourceField: 'secondaryGoal',
    })
  }
  
  // Support/carryover block if standard+ complexity
  if (complexity !== 'minimal' && budget.maxSupportBlocks > 0) {
    blocks.push({
      role: 'support_carryover',
      priority: 'recommended',
      orderPosition: BLOCK_ORDER_PRIORITY.support_carryover,
      estimatedMinutes: ctx.sessionMinutes * 0.15,
      exerciseSlots: complexity === 'comprehensive' ? 2 : 1,
      intensityLevel: 'moderate',
      fatigueContribution: 'medium',
      placementReason: `Support work transferring to ${ctx.primaryGoal}`,
      constraints: { mustPrecedeBlocks: ['method_density', 'finisher_conditioning'], mustFollowBlocks: ['primary_skill', 'primary_strength'], cannotCoexistWith: [] },
    })
    
    reasons.push({
      code: 'support_carryover_placement',
      description: 'Support work positioned after primary to reinforce skill demands',
      affectedBlocks: ['support_carryover'],
      sourceField: 'selectedSkills',
    })
  }
  
  // Accessory block if comprehensive complexity
  if (complexity === 'comprehensive' && budget.maxSupportBlocks > 1) {
    blocks.push({
      role: 'accessory_targeted',
      priority: 'optional',
      orderPosition: BLOCK_ORDER_PRIORITY.accessory_targeted,
      estimatedMinutes: ctx.sessionMinutes * 0.10,
      exerciseSlots: 2,
      intensityLevel: 'moderate',
      fatigueContribution: 'low',
      placementReason: 'Targeted accessory work for weak points',
      constraints: { mustPrecedeBlocks: ['finisher_conditioning', 'cooldown'], mustFollowBlocks: ['support_carryover'], cannotCoexistWith: [] },
    })
  }
  
  // Joint care block if joint cautions present
  if (ctx.jointCautions.length > 0) {
    blocks.push({
      role: 'prehab_joint_care',
      priority: 'recommended',
      orderPosition: BLOCK_ORDER_PRIORITY.prehab_joint_care,
      estimatedMinutes: Math.min(5, ctx.sessionMinutes * 0.08),
      exerciseSlots: 2,
      intensityLevel: 'low',
      fatigueContribution: 'minimal',
      placementReason: `Joint protection for ${ctx.jointCautions.join(', ')}`,
      constraints: { mustPrecedeBlocks: ['cooldown'], mustFollowBlocks: [], cannotCoexistWith: [] },
    })
    
    reasons.push({
      code: 'joint_protection_simplification',
      description: `Joint care added for declared cautions: ${ctx.jointCautions.join(', ')}`,
      affectedBlocks: ['prehab_joint_care'],
      sourceField: 'jointCautions',
    })
  }
  
  // Method blocks if earned
  if (methodEligibility.supersets === 'earned' && budget.maxMethodBlocks > 0 && complexity !== 'minimal') {
    // Don't add separate superset block - supersets are applied to existing blocks
    reasons.push({
      code: 'superset_allowed_by_profile',
      description: 'Supersets earned by recovery capacity and session duration',
      affectedBlocks: ['support_carryover', 'accessory_targeted'],
      sourceField: 'methodEligibility',
    })
  }
  
  if (methodEligibility.density === 'earned' && budget.maxMethodBlocks > 0 && complexity !== 'minimal') {
    blocks.push({
      role: 'method_density',
      priority: 'optional',
      orderPosition: BLOCK_ORDER_PRIORITY.method_density,
      estimatedMinutes: ctx.sessionMinutes * 0.12,
      exerciseSlots: 3,
      intensityLevel: 'moderate',
      fatigueContribution: 'medium',
      placementReason: 'Density block earned by training style and recovery',
      constraints: BLOCK_CONSTRAINTS.method_density || { mustPrecedeBlocks: [], mustFollowBlocks: [], cannotCoexistWith: [] },
    })
    
    reasons.push({
      code: 'density_allowed_by_profile',
      description: 'Density work earned by hybrid/weighted training style',
      affectedBlocks: ['method_density'],
      sourceField: 'trainingStyle',
    })
  }
  
  // Finisher if earned and comprehensive
  if (methodEligibility.finisher === 'earned' && complexity === 'comprehensive') {
    blocks.push({
      role: 'finisher_conditioning',
      priority: 'optional',
      orderPosition: BLOCK_ORDER_PRIORITY.finisher_conditioning,
      estimatedMinutes: ctx.sessionMinutes * 0.08,
      exerciseSlots: 1,
      intensityLevel: 'moderate',
      fatigueContribution: 'medium',
      placementReason: 'Conditioning finisher earned by recovery state',
      constraints: BLOCK_CONSTRAINTS.finisher_conditioning || { mustPrecedeBlocks: [], mustFollowBlocks: [], cannotCoexistWith: [] },
    })
    
    reasons.push({
      code: 'method_earned_by_context',
      description: 'Finisher earned by fresh recovery state and session length',
      affectedBlocks: ['finisher_conditioning'],
      sourceField: 'fatigueState',
    })
  } else if (methodEligibility.finisher === 'blocked' || methodEligibility.finisher === 'discouraged') {
    reasons.push({
      code: 'finisher_omitted_for_quality',
      description: 'Finisher omitted to preserve skill quality or respect recovery',
      affectedBlocks: [],
      sourceField: 'fatigueState',
    })
  }
  
  // Always include cooldown
  blocks.push({
    role: 'cooldown',
    priority: 'required',
    orderPosition: BLOCK_ORDER_PRIORITY.cooldown,
    estimatedMinutes: Math.min(5, ctx.sessionMinutes * 0.08),
    exerciseSlots: 2,
    intensityLevel: 'low',
    fatigueContribution: 'minimal',
    placementReason: 'Session cooldown for recovery',
    constraints: { mustPrecedeBlocks: [], mustFollowBlocks: [], cannotCoexistWith: [] },
  })
  
  // Sort blocks by order position
  blocks.sort((a, b) => a.orderPosition - b.orderPosition)
  
  // Re-assign sequential positions
  blocks.forEach((block, idx) => {
    block.orderPosition = idx + 1
  })
  
  console.log('[SESSION-COMPOSITION-BLOCK-PLAN]', {
    sessionIndex: ctx.sessionIndex,
    dayFocus: ctx.day.focus,
    complexity,
    blockCount: blocks.length,
    blocks: blocks.map(b => ({ role: b.role, priority: b.priority, minutes: b.estimatedMinutes })),
    compositionReasons: reasons.map(r => r.code),
  })
  
  return blocks
}

/**
 * Build the complete session composition blueprint
 */
export function buildSessionCompositionBlueprint(
  ctx: SessionCompositionContext
): SessionCompositionBlueprint {
  // Determine complexity
  const baseComplexity = determineSessionComplexity(ctx)
  // [WEEKLY-SESSION-ROLE-CONTRACT] Bias complexity by weekly role so days
  // in the SAME week phase / sessionMinutes can still diverge structurally.
  const complexity = applyWeeklyRoleComplexityBias(baseComplexity, ctx)
  
  // Determine method eligibility
  let methodEligibility = determineMethodEligibility(ctx)
  // [WEEKLY-SESSION-ROLE-CONTRACT] Apply role gating AFTER global rules.
  // The role can BLOCK methods (e.g. a recovery_supportive day cannot earn
  // density even if the global gates allowed it) but cannot upgrade past
  // what the global rules already permitted — global is the floor, role is
  // the per-day ceiling.
  methodEligibility = applyWeeklyRoleMethodGating(methodEligibility, ctx)
  
  // Build block plan
  const baseBlocks = buildSessionBlockPlan(ctx, complexity, methodEligibility)
  // [WEEKLY-SESSION-ROLE-CONTRACT] Nudge block exerciseSlots toward the
  // weekly role's breadth target so visible exercise count differs across
  // days even when complexity tier matches.
  const blocks = applyWeeklyRoleBreadthBias(baseBlocks, ctx)
  
  // Calculate workload distribution
  const totalMinutes = blocks.reduce((sum, b) => sum + b.estimatedMinutes, 0)
  const primaryMinutes = blocks
    .filter(b => b.role === 'primary_skill' || b.role === 'primary_strength')
    .reduce((sum, b) => sum + b.estimatedMinutes, 0)
  const secondaryMinutes = blocks
    .filter(b => b.role === 'secondary_skill' || b.role === 'secondary_strength')
    .reduce((sum, b) => sum + b.estimatedMinutes, 0)
  const supportMinutes = blocks
    .filter(b => b.role === 'support_carryover' || b.role === 'accessory_targeted' || b.role === 'prehab_joint_care')
    .reduce((sum, b) => sum + b.estimatedMinutes, 0)
  const conditioningMinutes = blocks
    .filter(b => b.role === 'method_density' || b.role === 'finisher_conditioning')
    .reduce((sum, b) => sum + b.estimatedMinutes, 0)
  
  // Build composition reasons
  const compositionReasons: SessionCompositionReason[] = []
  
  // Primary goal dominance
  const primaryPercent = totalMinutes > 0 ? (primaryMinutes / totalMinutes) * 100 : 0
  if (primaryPercent >= 25) {
    compositionReasons.push({
      code: 'primary_goal_anchor',
      description: `Session dominated by ${ctx.primaryGoal} work (${Math.round(primaryPercent)}%)`,
      affectedBlocks: ['primary_skill', 'primary_strength'],
      sourceField: 'primaryGoal',
    })
  }
  
  // Neural demand ordering
  compositionReasons.push({
    code: 'neural_demand_ordering',
    description: 'High-demand work positioned early when CNS is fresh',
    affectedBlocks: ['primary_skill', 'primary_strength', 'secondary_skill'],
    sourceField: 'blockOrdering',
  })
  
  // ==========================================================================
  // [SESSION-ARCHITECTURE-OWNERSHIP] Add canonical truth-derived reasons
  // ==========================================================================
  
  // Current working progression reason
  if (ctx.currentWorkingProgressions && Object.keys(ctx.currentWorkingProgressions).length > 0) {
    const progressionSkills = Object.keys(ctx.currentWorkingProgressions)
    const hasActiveProgression = progressionSkills.some(skill => 
      ctx.currentWorkingProgressions![skill].currentWorkingProgression !== null
    )
    if (hasActiveProgression) {
      compositionReasons.push({
        code: 'current_progression_fit',
        description: `Session structure shaped by active progressions: ${progressionSkills.slice(0, 2).join(', ')}`,
        affectedBlocks: ['primary_skill', 'support_carryover'],
        sourceField: 'currentWorkingProgressions',
      })
    }
  }
  
  // Session architecture truth reason
  const archTruth = ctx.sessionArchitectureTruth
  if (archTruth) {
    const sessionRoleBias = archTruth.doctrineArchitectureBias?.sessionRoleBias
    if (sessionRoleBias && sessionRoleBias !== 'balanced_multi_skill') {
      compositionReasons.push({
        code: sessionRoleBias === 'primary_dominant' ? 'primary_goal_anchor' : 'support_carryover_placement',
        description: `Session role bias: ${sessionRoleBias.replace(/_/g, ' ')}`,
        affectedBlocks: sessionRoleBias === 'primary_dominant' ? ['primary_skill', 'primary_strength'] : ['support_carryover', 'accessory_targeted'],
        sourceField: 'sessionArchitectureTruth.doctrineArchitectureBias',
      })
    }
    
    // Template escape achieved if we have strong canonical signals
    if (archTruth.primarySpineSkills.length > 0 && archTruth.sourceVerdict === 'FULL_TRUTH_AVAILABLE') {
      compositionReasons.push({
        code: 'template_escape_achieved',
        description: `Session driven by canonical athlete truth, not generic template`,
        affectedBlocks: ['primary_skill', 'primary_strength', 'support_carryover'],
        sourceField: 'sessionArchitectureTruth.sourceVerdict',
      })
    }
  }
  
  // Method eligibility reason
  const methodsEarned = methodEligibility.supersets === 'earned' || methodEligibility.density === 'earned'
  if (methodsEarned) {
    const earnedMethods = []
    if (methodEligibility.supersets === 'earned') earnedMethods.push('supersets')
    if (methodEligibility.density === 'earned') earnedMethods.push('density')
    if (methodEligibility.circuits === 'earned') earnedMethods.push('circuits')
    
    compositionReasons.push({
      code: 'method_earned_by_context',
      description: `Methods earned by athlete profile: ${earnedMethods.join(', ')}`,
      affectedBlocks: ['method_density', 'method_superset'],
      sourceField: 'methodEligibility',
    })
  }
  
  // Joint caution reason
  if (ctx.jointCautions.length > 0) {
    compositionReasons.push({
      code: 'joint_protection_simplification',
      description: `Session structure respects joint cautions: ${ctx.jointCautions.slice(0, 2).join(', ')}`,
      affectedBlocks: ['prehab_joint_care', 'accessory_targeted'],
      sourceField: 'jointCautions',
    })
  }
  
  // ==========================================================================
  // [WEEKLY-COMPOSITION-UPGRADE] Week-level adaptation reasons
  // ==========================================================================
  if (ctx.firstWeekProtection?.active) {
    compositionReasons.push({
      code: 'recovery_limited_structure',
      description: `First-week acclimation: ${ctx.firstWeekProtection.reasons.slice(0, 2).join(', ')}`,
      affectedBlocks: ['method_density', 'finisher_conditioning', 'accessory_targeted'],
      sourceField: 'firstWeekProtection',
    })
  }
  
  if (ctx.weeklyLoadStrategy?.volumeBias === 'reduced') {
    compositionReasons.push({
      code: 'recovery_limited_structure',
      description: 'Reduced volume bias for recovery or acclimation',
      affectedBlocks: ['accessory_targeted', 'method_density', 'finisher_conditioning'],
      sourceField: 'weeklyLoadStrategy.volumeBias',
    })
  }
  
  if (ctx.weeklyLoadStrategy?.finisherBias === 'limited') {
    compositionReasons.push({
      code: 'finisher_omitted_for_quality',
      description: 'Finishers suppressed for week-level recovery/quality',
      affectedBlocks: ['finisher_conditioning', 'method_density'],
      sourceField: 'weeklyLoadStrategy.finisherBias',
    })
  }
  
  if (ctx.adaptationPhase === 'initial_acclimation') {
    compositionReasons.push({
      code: 'recovery_limited_structure',
      description: 'Session complexity capped for initial program acclimation',
      affectedBlocks: ['method_density', 'method_superset', 'finisher_conditioning'],
      sourceField: 'adaptationPhase',
    })
  }
  
  // Build audit - template escaped when we have canonical truth-derived reasons
  const hasCanonicalTruthReasons = compositionReasons.some(r => 
    r.code === 'current_progression_fit' || 
    r.code === 'template_escape_achieved' ||
    r.sourceField.includes('sessionArchitectureTruth')
  )
  
  const audit = {
    primaryGoalDominated: primaryPercent >= 25,
    secondaryGoalContained: secondaryMinutes <= totalMinutes * 0.2,
    progressionRespected: !!ctx.currentWorkingProgressions && Object.keys(ctx.currentWorkingProgressions).length > 0,
    equipmentUtilized: ctx.equipment.length > 0,
    jointProtectionApplied: ctx.jointCautions.length > 0 && blocks.some(b => b.role === 'prehab_joint_care'),
    methodsEarned: methodEligibility.supersets === 'earned' || methodEligibility.density === 'earned',
    // [SESSION-ARCHITECTURE-OWNERSHIP] Template escape requires canonical truth reasons
    templateEscaped: hasCanonicalTruthReasons || compositionReasons.length >= 4,
  }
  
  // Build session intent string
  const sessionIntent = buildSessionIntentString(ctx, blocks)
  
  // [WEEKLY-SESSION-ROLE-CONTRACT] Build compact role summary for downstream
  // display + session-card differentiation. `null` when the caller did not
  // pass a weekly role (legacy / partial builders).
  const weeklyRoleSummary: SessionCompositionBlueprint['weeklyRoleSummary'] = ctx.weeklyRole
    ? {
        roleId: ctx.weeklyRole.roleId,
        roleLabel: ctx.weeklyRole.roleLabel,
        intensityClass: ctx.weeklyRole.intensityClass,
        progressionCharacter: ctx.weeklyRole.progressionCharacter,
        breadthTarget: ctx.weeklyRole.breadthTarget,
        weeklyRationale: ctx.weeklyRole.weeklyRationale,
        methodAllowance: {
          density: ctx.weeklyRole.methodAllowance.density,
          supersets: ctx.weeklyRole.methodAllowance.supersets,
          circuits: ctx.weeklyRole.methodAllowance.circuits,
          finisher: ctx.weeklyRole.methodAllowance.finisher,
          cluster: ctx.weeklyRole.methodAllowance.cluster,
        },
      }
    : null

  const blueprint: SessionCompositionBlueprint = {
    sessionIntent,
    sessionComplexity: complexity,
    estimatedDurationMinutes: ctx.sessionMinutes,
    blocks,
    blockCount: blocks.length,
    methodEligibility,
    workloadDistribution: {
      primaryWorkPercent: Math.round(primaryPercent),
      secondaryWorkPercent: Math.round((secondaryMinutes / totalMinutes) * 100),
      supportWorkPercent: Math.round((supportMinutes / totalMinutes) * 100),
      conditioningPercent: Math.round((conditioningMinutes / totalMinutes) * 100),
    },
    compositionReasons,
    audit,
    weeklyRoleSummary,
  }
  
  console.log('[SESSION-COMPOSITION-BLUEPRINT]', {
    sessionIndex: ctx.sessionIndex,
    dayFocus: ctx.day.focus,
    sessionIntent: blueprint.sessionIntent,
    complexity: blueprint.sessionComplexity,
    blockCount: blueprint.blockCount,
    workloadDistribution: blueprint.workloadDistribution,
    methodEligibility: blueprint.methodEligibility,
    auditPassed: Object.values(audit).filter(Boolean).length,
    auditTotal: Object.values(audit).length,
  })
  
  return blueprint
}

/**
 * Build a human-readable session intent string
 * [SESSION-ARCHITECTURE-OWNERSHIP] Enhanced to derive distinct day purposes from canonical truth
 */
function buildSessionIntentString(
  ctx: SessionCompositionContext,
  blocks: SessionBlockPlan[]
): string {
  // ==========================================================================
  // [SESSION-ARCHITECTURE-OWNERSHIP] Determine canonical day role from truth
  // ==========================================================================
  
  // Check session architecture truth for spine/secondary classification
  const archTruth = ctx.sessionArchitectureTruth
  const primarySpineSkills = archTruth?.primarySpineSkills || []
  const supportRotationSkills = archTruth?.supportRotationSkills || []
  const currentWorkingProgressions = ctx.currentWorkingProgressions || {}
  
  // Determine if this is a primary-spine-dominant session
  const dayFocus = ctx.day.focus
  const isPrimarySkillDay = dayFocus.includes('skill') || dayFocus.includes('vertical_push_skill')
  const isPushDay = dayFocus.includes('push')
  const isPullDay = dayFocus.includes('pull')
  const isMixedDay = dayFocus.includes('mixed')
  const isLowIntensityDay = ctx.day.targetIntensity === 'low'
  
  // Build session role from canonical signals
  let sessionRole: string
  
  if (isLowIntensityDay || ctx.fatigueState === 'needs_deload') {
    // Low intensity days get recovery-focused role
    sessionRole = 'recovery_technique'
  } else if (primarySpineSkills.includes(ctx.primaryGoal) && isPrimarySkillDay) {
    // Direct primary spine skill expression
    sessionRole = 'primary_skill_exposure'
  } else if (isPushDay && !isPullDay) {
    // Determine push emphasis from primary goal
    const isPlanches = ctx.primaryGoal === 'planche'
    const isHSPU = ctx.primaryGoal === 'handstand_pushup'
    const isWeightedPush = ctx.primaryGoal === 'weighted_strength'
    
    if (isPlanches) {
      sessionRole = 'planche_strength_biased'
    } else if (isHSPU) {
      sessionRole = 'vertical_push_dominant'
    } else if (isWeightedPush) {
      sessionRole = 'weighted_push_capacity'
    } else {
      sessionRole = 'push_strength_carryover'
    }
  } else if (isPullDay && !isPushDay) {
    // Determine pull emphasis from primary goal
    const isFrontLever = ctx.primaryGoal === 'front_lever'
    const isMuscleUp = ctx.primaryGoal === 'muscle_up'
    
    if (isFrontLever) {
      sessionRole = 'front_lever_strength_biased'
    } else if (isMuscleUp) {
      sessionRole = 'muscle_up_technical'
    } else {
      sessionRole = 'pull_strength_carryover'
    }
  } else if (isMixedDay) {
    // Mixed days serve as support/structure reinforcement
    const hasCurrentProgression = Object.keys(currentWorkingProgressions).length > 0
    if (hasCurrentProgression) {
      sessionRole = 'multi_skill_structure_day'
    } else {
      sessionRole = 'balanced_skill_exposure'
    }
  } else {
    // Fallback for undefined focus
    sessionRole = 'general_strength_support'
  }
  
  // Build the final intent string with more specific language
  const parts: string[] = []

  // [WEEKLY-SESSION-ROLE-CONTRACT] When a weekly role is present, lead with
  // the role label so each day in the week reads as a distinct purpose
  // rather than echoing only the structural focus.
  if (ctx.weeklyRole) {
    parts.push(ctx.weeklyRole.roleLabel)
  } else {
    // Fall back to legacy session-role mapping when no weekly contract.
    const roleLabel = SESSION_ROLE_LABELS[sessionRole] || sessionRole.replace(/_/g, ' ')
    parts.push(roleLabel)
  }
  
  // Add secondary goal if present and contained
  if (ctx.secondaryGoal && blocks.some(b => b.role === 'secondary_skill' || b.role === 'secondary_strength')) {
    parts.push(`${formatGoalLabel(ctx.secondaryGoal)} maintenance`)
  }
  
  // Add method qualifier for density/circuit sessions
  const hasDensityBlock = blocks.some(b => b.role === 'method_density')
  const hasFinisher = blocks.some(b => b.role === 'finisher_conditioning')
  
  if (hasDensityBlock) {
    parts.push('with density work')
  } else if (hasFinisher) {
    parts.push('with conditioning finish')
  }
  
  // Add recovery qualifier if fatigued
  if (ctx.fatigueState === 'accumulated') {
    parts.push('(managed volume)')
  }
  
  return parts.join(' + ') || `${ctx.primaryGoal} training`
}

/**
 * Session role labels for human-readable output
 */
const SESSION_ROLE_LABELS: Record<string, string> = {
  'recovery_technique': 'Recovery-focused technique work',
  'primary_skill_exposure': 'Primary skill progression day',
  'planche_strength_biased': 'Planche strength development',
  'vertical_push_dominant': 'HSPU progression focus',
  'weighted_push_capacity': 'Weighted push capacity',
  'push_strength_carryover': 'Push strength carryover',
  'front_lever_strength_biased': 'Front lever strength development',
  'muscle_up_technical': 'Muscle-up technique focus',
  'pull_strength_carryover': 'Pull strength carryover',
  'multi_skill_structure_day': 'Multi-skill structure reinforcement',
  'balanced_skill_exposure': 'Balanced skill expression',
  'general_strength_support': 'General strength support',
}

/**
 * Format goal ID to readable label
 */
function formatGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    'planche': 'Planche',
    'front_lever': 'Front Lever',
    'handstand_pushup': 'HSPU',
    'muscle_up': 'Muscle-Up',
    'weighted_strength': 'Weighted',
    'flexibility': 'Flexibility',
  }
  return labels[goal] || goal.replace(/_/g, ' ')
}

/**
 * Validate a session composition blueprint against constraints
 */
export function validateSessionComposition(
  blueprint: SessionCompositionBlueprint,
  ctx: SessionCompositionContext
): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Check block count
  const budget = COMPLEXITY_BUDGETS[blueprint.sessionComplexity]
  if (blueprint.blockCount > budget.maxBlocks) {
    issues.push(`Block count ${blueprint.blockCount} exceeds budget ${budget.maxBlocks}`)
  }
  
  // Check primary work percent
  if (blueprint.workloadDistribution.primaryWorkPercent < budget.minPrimaryPercent) {
    issues.push(`Primary work ${blueprint.workloadDistribution.primaryWorkPercent}% below minimum ${budget.minPrimaryPercent}%`)
  }
  
  // Check conditioning percent
  if (blueprint.workloadDistribution.conditioningPercent > budget.maxConditioningPercent) {
    issues.push(`Conditioning ${blueprint.workloadDistribution.conditioningPercent}% exceeds max ${budget.maxConditioningPercent}%`)
  }
  
  // Check block ordering
  const blockPositions = blueprint.blocks.map(b => ({ role: b.role, position: b.orderPosition }))
  const warmupPos = blockPositions.find(b => b.role === 'warmup_general')?.position || 0
  const primaryPos = blockPositions.find(b => b.role === 'primary_skill' || b.role === 'primary_strength')?.position || 0
  const cooldownPos = blockPositions.find(b => b.role === 'cooldown')?.position || 0
  
  if (warmupPos > primaryPos) {
    issues.push('Warmup must precede primary work')
  }
  if (primaryPos > cooldownPos) {
    // This is fine - primary should be before cooldown
  } else if (cooldownPos > 0 && cooldownPos < primaryPos) {
    issues.push('Cooldown must follow primary work')
  }
  
  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Log composition audit for debugging
 */
export function logSessionCompositionAudit(
  blueprint: SessionCompositionBlueprint,
  ctx: SessionCompositionContext
): void {
  console.log('[SESSION-COMPOSITION-AUDIT]', {
    sessionIndex: ctx.sessionIndex,
    dayNumber: ctx.day.dayNumber,
    dayFocus: ctx.day.focus,
    
    // Intent
    sessionIntent: blueprint.sessionIntent,
    complexity: blueprint.sessionComplexity,
    
    // Block summary
    blockRoles: blueprint.blocks.map(b => b.role),
    blockPriorities: blueprint.blocks.map(b => b.priority),
    
    // Workload
    workloadDistribution: blueprint.workloadDistribution,
    
    // Methods
    methodsEarned: Object.entries(blueprint.methodEligibility)
      .filter(([, status]) => status === 'earned')
      .map(([method]) => method),
    methodsBlocked: Object.entries(blueprint.methodEligibility)
      .filter(([, status]) => status === 'blocked')
      .map(([method]) => method),
    
    // Reasons
    compositionReasonCodes: blueprint.compositionReasons.map(r => r.code),
    
    // Audit
    audit: blueprint.audit,
    
    // Context influence
    contextInfluence: {
      primaryGoal: ctx.primaryGoal,
      secondaryGoal: ctx.secondaryGoal,
      trainingStyle: ctx.trainingStyle,
      fatigueState: ctx.fatigueState,
      recoveryCapacity: ctx.recoveryCapacity,
      jointCautions: ctx.jointCautions.length,
      equipmentCount: ctx.equipment.length,
    },
  })
}
