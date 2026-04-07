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
 * Build the canonical session composition context from available inputs
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
  recentSessionShapes?: string[]
): SessionCompositionContext {
  // Determine training style from equipment and profile
  const hasWeightedEquipment = equipment.some(eq => 
    ['barbell', 'dumbbells', 'kettlebell', 'weight_plates', 'cable_machine'].includes(eq)
  )
  
  const trainingStyle: 'pure_skill' | 'hybrid' | 'weighted_integrated' | 'minimalist' = 
    !hasWeightedEquipment && equipment.length <= 2 ? 'minimalist' :
    !hasWeightedEquipment ? 'pure_skill' :
    equipment.length <= 4 ? 'hybrid' : 'weighted_integrated'
  
  // Determine recovery capacity from experience and fatigue
  const recoveryCapacity: 'high' | 'moderate' | 'limited' = 
    fatigueState === 'needs_deload' ? 'limited' :
    fatigueState === 'accumulated' ? 'limited' :
    experienceLevel === 'beginner' ? 'limited' :
    experienceLevel === 'advanced' ? 'high' : 'moderate'
  
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
  }
}

/**
 * Determine session complexity level based on context
 */
export function determineSessionComplexity(
  ctx: SessionCompositionContext
): 'minimal' | 'standard' | 'comprehensive' {
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
 * Determine method eligibility based on context
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
  
  // Check doctrine contract for method permissions
  const doctrineMethods = ctx.doctrineRuntimeContract?.methodDoctrine
  if (doctrineMethods) {
    if (doctrineMethods.supersetsAllowed) supersets = 'allowed'
    if (doctrineMethods.circuitsAllowed) circuits = 'allowed'
    if (doctrineMethods.densityAllowed) density = 'allowed'
  }
  
  // Upgrade to "earned" based on context
  
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
  if (density !== 'blocked' && 
      (ctx.trainingStyle === 'hybrid' || ctx.trainingStyle === 'weighted_integrated') &&
      ctx.recoveryCapacity !== 'limited' && ctx.sessionMinutes >= 45) {
    density = 'earned'
    reasons.push({ method: 'density', status: 'earned', reason: 'training_style_allows' })
  }
  
  // Finisher: earned if standard+ complexity, fresh/moderate fatigue, 60+ min
  if (finisher !== 'blocked' && ctx.fatigueState !== 'needs_deload' && 
      ctx.fatigueState !== 'accumulated' && ctx.sessionMinutes >= 60) {
    finisher = ctx.experienceLevel !== 'beginner' ? 'earned' : 'allowed'
    reasons.push({ method: 'finisher', status: finisher, reason: 'recovery_allows_finisher' })
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
  const complexity = determineSessionComplexity(ctx)
  
  // Determine method eligibility
  const methodEligibility = determineMethodEligibility(ctx)
  
  // Build block plan
  const blocks = buildSessionBlockPlan(ctx, complexity, methodEligibility)
  
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
  
  // Build audit
  const audit = {
    primaryGoalDominated: primaryPercent >= 25,
    secondaryGoalContained: secondaryMinutes <= totalMinutes * 0.2,
    progressionRespected: !!ctx.currentWorkingProgressions,
    equipmentUtilized: ctx.equipment.length > 0,
    jointProtectionApplied: ctx.jointCautions.length > 0 && blocks.some(b => b.role === 'prehab_joint_care'),
    methodsEarned: methodEligibility.supersets === 'earned' || methodEligibility.density === 'earned',
    templateEscaped: compositionReasons.length >= 3,
  }
  
  // Build session intent string
  const sessionIntent = buildSessionIntentString(ctx, blocks)
  
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
 */
function buildSessionIntentString(
  ctx: SessionCompositionContext,
  blocks: SessionBlockPlan[]
): string {
  const parts: string[] = []
  
  // Primary focus
  const hasPrimarySkill = blocks.some(b => b.role === 'primary_skill')
  const hasPrimaryStrength = blocks.some(b => b.role === 'primary_strength')
  
  if (hasPrimarySkill) {
    parts.push(`${ctx.primaryGoal} skill focus`)
  } else if (hasPrimaryStrength) {
    parts.push(`${ctx.primaryGoal} strength focus`)
  }
  
  // Secondary if present
  if (ctx.secondaryGoal && blocks.some(b => b.role === 'secondary_skill' || b.role === 'secondary_strength')) {
    parts.push(`${ctx.secondaryGoal} support`)
  }
  
  // Method qualifier
  if (blocks.some(b => b.role === 'method_density')) {
    parts.push('density work')
  }
  
  // Recovery qualifier
  if (ctx.fatigueState === 'accumulated' || ctx.fatigueState === 'needs_deload') {
    parts.push('recovery-mindful')
  }
  
  return parts.join(' + ') || 'general training'
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
