/**
 * UNIFIED DOCTRINE DECISION MODEL
 * 
 * PURPOSE:
 * Single authoritative model that translates doctrine stack + athlete truth
 * into concrete program-shaping decisions. This is NOT another parallel engine.
 * This is THE unified decision layer that the generator must obey.
 * 
 * KEY CONCEPT: DOMINANT SPINE + PURPOSEFUL INTEGRATION
 * - Every week has ONE dominant training spine based on goals + doctrine
 * - Secondary methods are only integrated when they add real carryover value
 * - Generic filler is actively blocked
 * - The output should feel like ONE cohesive coaching system
 * 
 * OWNERSHIP:
 * - Consumes: DoctrineInfluenceContract, CanonicalProfile, TrainingDoctrine
 * - Produces: UnifiedDoctrineDecision (the authoritative shape for generation)
 * - Consumed by: WeeklyBuilder, SessionBuilder, ExerciseSelector, DosageLogic
 * 
 * RULES:
 * - One owner, one model, one decision
 * - No competing style fragments
 * - No flattening of doctrine into generic output
 * - Current-stage realism overrides doctrine fantasy
 */

import type { DoctrineInfluenceContract, MergedInfluence } from './doctrine-influence-contract'
import type { TrainingDoctrine } from '../training-doctrine-registry/doctrineTypes'
import { DOCTRINE_REGISTRY } from '../training-doctrine-registry/doctrineRegistry'

// =============================================================================
// TYPES - DOMINANT SPINE
// =============================================================================

/**
 * The dominant training spine defines the week's primary character.
 * Only ONE spine is dominant. Others are subordinate.
 */
export type DominantSpineType =
  | 'static_skill_mastery'     // FL, Planche, HS focused
  | 'weighted_strength'         // Weighted calisthenics focused
  | 'dynamic_skill'            // Muscle-ups, explosive movements
  | 'hybrid_balanced'          // Intentionally balanced (rare)
  | 'endurance_density'        // Work capacity / conditioning
  | 'foundation_building'      // Beginner base work

/**
 * Integration mode defines how secondary elements are added.
 */
export type IntegrationMode =
  | 'carryover_only'           // Only add support that directly transfers
  | 'complementary'            // Add complementary but non-competing work
  | 'minimal'                  // Absolute minimum secondary work
  | 'none'                     // Pure spine focus (advanced/peaking)

// =============================================================================
// TYPES - UNIFIED DECISION
// =============================================================================

/**
 * The authoritative unified doctrine decision.
 * This is what the generator must obey.
 */
export interface UnifiedDoctrineDecision {
  // Identity
  decisionId: string
  builtAt: string
  
  // DOMINANT SPINE - The week's primary character
  dominantSpine: {
    type: DominantSpineType
    rationale: string
    primarySkillFocus: string[]
    primaryMethodEmphasis: string[]
    expectedSessionCharacter: string
  }
  
  // INTEGRATION CONSTRAINTS - How secondary work enters
  integrationConstraints: {
    mode: IntegrationMode
    allowedSecondaryMethods: string[]
    blockedMethods: string[]
    maxSecondaryExercisesPerSession: number
    secondaryMustCarryover: boolean
    rationale: string
  }
  
  // SESSION STRUCTURE RULES - How sessions should be built
  sessionStructureRules: {
    preferredStructures: string[]
    blockedStructures: string[]
    skillBlockMandatory: boolean
    strengthBlockMandatory: boolean
    accessoryBlockAllowed: boolean
    maxTotalExercisesPerSession: number
    rationale: string
  }
  
  // EXERCISE SELECTION RULES - What exercises are allowed
  exerciseSelectionRules: {
    primaryExercisePool: string[]      // Exercises that MUST be considered
    carryoverExercisePool: string[]    // Exercises for carryover support
    genericFillerBlocked: string[]     // Generic exercises to avoid
    preferWeightedVariants: boolean
    preferStaticVariants: boolean
    preferDynamicVariants: boolean
    rationale: string
  }
  
  // DOSAGE RULES - How volume/intensity is distributed
  dosageRules: {
    intensityBias: 'conservative' | 'moderate' | 'aggressive'
    volumeBias: 'low' | 'moderate' | 'high'
    skillQualityOverQuantity: boolean
    holdTimeEmphasis: boolean
    recoveryConstrainedDosage: boolean
    rationale: string
  }
  
  // WEEKLY DISTRIBUTION - How stress spreads across the week
  weeklyDistribution: {
    primarySkillDays: number
    secondarySkillDays: number
    recoveryDaysMandatory: number
    maxConsecutiveHardDays: number
    stressDistributionPattern: 'front_loaded' | 'even' | 'back_loaded' | 'undulating'
    rationale: string
  }
  
  // ANTI-FLATTENING RULES - What to prevent
  antiFlatteningRules: {
    preventGenericSplits: boolean
    preventEqualWeightBlending: boolean
    preventFillerAccessories: boolean
    preventOverdiversification: boolean
    minimumSpineVisibility: number  // 0-1, how much the spine should dominate
    rationale: string
  }
  
  // SOURCE ATTRIBUTION
  sourceAttribution: {
    athleteTruthUsed: boolean
    doctrineDbUsed: boolean
    codeRegistryUsed: boolean
    primaryDoctrineId: string | null
    secondaryDoctrineId: string | null
  }
  
  // AUDIT
  audit: {
    decisionsExplained: string[]
    inputsConsidered: string[]
    flatteningPrevented: string[]
  }
}

// =============================================================================
// BUILDER FUNCTION
// =============================================================================

/**
 * Build the Unified Doctrine Decision Model.
 * 
 * This is THE authoritative decision for how doctrine shapes the program.
 * The generator must obey this decision, not override it.
 */
export function buildUnifiedDoctrineDecision(
  doctrineContract: DoctrineInfluenceContract | null,
  primaryGoal: string | null,
  secondaryGoal: string | null,
  selectedSkills: string[],
  experienceLevel: string | null,
  targetFrequency: number | null,
  recoveryQuality: string | null,
  jointCautions: string[]
): UnifiedDoctrineDecision {
  const decisionId = `unified-doctrine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const builtAt = new Date().toISOString()
  
  // ==========================================================================
  // STEP 1: RESOLVE DOMINANT SPINE
  // ==========================================================================
  const dominantSpine = resolveDominantSpine(
    primaryGoal,
    selectedSkills,
    experienceLevel,
    doctrineContract
  )
  
  // ==========================================================================
  // STEP 2: RESOLVE INTEGRATION CONSTRAINTS
  // ==========================================================================
  const integrationConstraints = resolveIntegrationConstraints(
    dominantSpine.type,
    secondaryGoal,
    selectedSkills,
    experienceLevel,
    doctrineContract
  )
  
  // ==========================================================================
  // STEP 3: RESOLVE SESSION STRUCTURE RULES
  // ==========================================================================
  const sessionStructureRules = resolveSessionStructureRules(
    dominantSpine.type,
    integrationConstraints.mode,
    targetFrequency,
    experienceLevel,
    doctrineContract
  )
  
  // ==========================================================================
  // STEP 4: RESOLVE EXERCISE SELECTION RULES
  // ==========================================================================
  const exerciseSelectionRules = resolveExerciseSelectionRules(
    dominantSpine,
    selectedSkills,
    integrationConstraints,
    doctrineContract
  )
  
  // ==========================================================================
  // STEP 5: RESOLVE DOSAGE RULES
  // ==========================================================================
  const dosageRules = resolveDosageRules(
    dominantSpine.type,
    experienceLevel,
    recoveryQuality,
    jointCautions,
    doctrineContract
  )
  
  // ==========================================================================
  // STEP 6: RESOLVE WEEKLY DISTRIBUTION
  // ==========================================================================
  const weeklyDistribution = resolveWeeklyDistribution(
    dominantSpine.type,
    targetFrequency,
    recoveryQuality,
    experienceLevel,
    doctrineContract
  )
  
  // ==========================================================================
  // STEP 7: RESOLVE ANTI-FLATTENING RULES
  // ==========================================================================
  const antiFlatteningRules = resolveAntiFlatteningRules(
    dominantSpine.type,
    integrationConstraints.mode,
    selectedSkills.length
  )
  
  // ==========================================================================
  // STEP 8: BUILD SOURCE ATTRIBUTION
  // ==========================================================================
  const sourceAttribution = {
    athleteTruthUsed: true,
    doctrineDbUsed: doctrineContract?.safetyFlags.dbAvailable ?? false,
    codeRegistryUsed: doctrineContract?.safetyFlags.fallbackActive ?? true,
    primaryDoctrineId: resolvePrimaryDoctrineId(primaryGoal, selectedSkills),
    secondaryDoctrineId: secondaryGoal ? resolveSecondaryDoctrineId(secondaryGoal) : null,
  }
  
  // ==========================================================================
  // STEP 9: BUILD AUDIT
  // ==========================================================================
  const audit = {
    decisionsExplained: [
      `Dominant spine: ${dominantSpine.type} - ${dominantSpine.rationale}`,
      `Integration mode: ${integrationConstraints.mode} - ${integrationConstraints.rationale}`,
      `Intensity bias: ${dosageRules.intensityBias} - ${dosageRules.rationale}`,
    ],
    inputsConsidered: [
      `Primary goal: ${primaryGoal || 'none'}`,
      `Selected skills: ${selectedSkills.join(', ') || 'none'}`,
      `Experience: ${experienceLevel || 'unknown'}`,
      `Frequency: ${targetFrequency || 'unknown'}`,
      `Recovery: ${recoveryQuality || 'unknown'}`,
      `Joint cautions: ${jointCautions.length > 0 ? jointCautions.join(', ') : 'none'}`,
    ],
    flatteningPrevented: antiFlatteningRules.preventGenericSplits 
      ? ['Generic splits blocked', 'Equal-weight blending prevented', 'Filler accessories blocked']
      : [],
  }
  
  const decision: UnifiedDoctrineDecision = {
    decisionId,
    builtAt,
    dominantSpine,
    integrationConstraints,
    sessionStructureRules,
    exerciseSelectionRules,
    dosageRules,
    weeklyDistribution,
    antiFlatteningRules,
    sourceAttribution,
    audit,
  }
  
  console.log('[UNIFIED-DOCTRINE-DECISION-BUILT]', {
    decisionId,
    dominantSpine: dominantSpine.type,
    integrationMode: integrationConstraints.mode,
    primaryDoctrineId: sourceAttribution.primaryDoctrineId,
    antiFlatteningEnabled: antiFlatteningRules.preventGenericSplits,
  })
  
  return decision
}

// =============================================================================
// RESOLVER FUNCTIONS
// =============================================================================

function resolveDominantSpine(
  primaryGoal: string | null,
  selectedSkills: string[],
  experienceLevel: string | null,
  doctrineContract: DoctrineInfluenceContract | null
): UnifiedDoctrineDecision['dominantSpine'] {
  // Static skill goals get static_skill_mastery spine
  const staticSkills = ['front_lever', 'planche', 'handstand', 'l_sit', 'v_sit', 'manna']
  const dynamicSkills = ['muscle_up', 'bar_muscle_up', 'ring_muscle_up']
  const weightedGoals = ['weighted_pull_up', 'weighted_dip', 'weighted_calisthenics']
  
  const hasStaticPrimary = primaryGoal && staticSkills.some(s => primaryGoal.toLowerCase().includes(s.replace('_', ' ')) || primaryGoal.toLowerCase().includes(s))
  const hasStaticSkills = selectedSkills.some(s => staticSkills.includes(s.toLowerCase().replace(/\s+/g, '_')))
  const hasDynamicPrimary = primaryGoal && dynamicSkills.some(s => primaryGoal.toLowerCase().includes(s.replace('_', ' ')))
  const hasWeightedPrimary = primaryGoal && weightedGoals.some(s => primaryGoal.toLowerCase().includes(s.replace('_', ' ')))
  
  // Beginners get foundation_building
  if (experienceLevel === 'beginner') {
    return {
      type: 'foundation_building',
      rationale: 'Beginner level requires foundational work before specialization',
      primarySkillFocus: selectedSkills.slice(0, 2),
      primaryMethodEmphasis: ['basic_progressions', 'form_mastery', 'volume_tolerance'],
      expectedSessionCharacter: 'Foundation-focused with emphasis on movement quality',
    }
  }
  
  // Static skill focus
  if (hasStaticPrimary || (hasStaticSkills && selectedSkills.length <= 3)) {
    return {
      type: 'static_skill_mastery',
      rationale: `Static skill (${primaryGoal || selectedSkills[0]}) is primary focus - requires dedicated static work`,
      primarySkillFocus: selectedSkills.filter(s => staticSkills.includes(s.toLowerCase().replace(/\s+/g, '_'))),
      primaryMethodEmphasis: ['static_holds', 'isometric_strength', 'position_specific_prep'],
      expectedSessionCharacter: 'Static skill-dominated with supporting strength work',
    }
  }
  
  // Dynamic skill focus
  if (hasDynamicPrimary) {
    return {
      type: 'dynamic_skill',
      rationale: `Dynamic skill (${primaryGoal}) is primary focus - requires explosive/technique work`,
      primarySkillFocus: selectedSkills.filter(s => dynamicSkills.includes(s.toLowerCase().replace(/\s+/g, '_'))),
      primaryMethodEmphasis: ['explosive_power', 'technique_drilling', 'transition_strength'],
      expectedSessionCharacter: 'Dynamic skill-focused with power development',
    }
  }
  
  // Weighted focus
  if (hasWeightedPrimary) {
    return {
      type: 'weighted_strength',
      rationale: `Weighted calisthenics is primary focus - requires progressive overload emphasis`,
      primarySkillFocus: ['weighted_pull_up', 'weighted_dip'],
      primaryMethodEmphasis: ['progressive_overload', 'strength_sets', 'load_management'],
      expectedSessionCharacter: 'Strength-focused with weighted progressions',
    }
  }
  
  // Default to hybrid for multi-skill without clear dominance
  return {
    type: 'hybrid_balanced',
    rationale: 'Multiple skills without clear dominance - balanced approach with intentional structure',
    primarySkillFocus: selectedSkills.slice(0, 3),
    primaryMethodEmphasis: ['balanced_development', 'skill_rotation', 'intelligent_pairing'],
    expectedSessionCharacter: 'Balanced hybrid with clear session differentiation',
  }
}

function resolveIntegrationConstraints(
  spineType: DominantSpineType,
  secondaryGoal: string | null,
  selectedSkills: string[],
  experienceLevel: string | null,
  doctrineContract: DoctrineInfluenceContract | null
): UnifiedDoctrineDecision['integrationConstraints'] {
  // Static skill mastery = minimal secondary, only carryover
  if (spineType === 'static_skill_mastery') {
    return {
      mode: 'carryover_only',
      allowedSecondaryMethods: ['straight_arm_prep', 'shoulder_stability', 'core_compression'],
      blockedMethods: ['high_volume_bodybuilding', 'density_circuits', 'endurance_sets'],
      maxSecondaryExercisesPerSession: 2,
      secondaryMustCarryover: true,
      rationale: 'Static skill mastery requires focused work - secondary exercises must directly support static positions',
    }
  }
  
  // Weighted strength = complementary pulling/pushing balance
  if (spineType === 'weighted_strength') {
    return {
      mode: 'complementary',
      allowedSecondaryMethods: ['antagonist_pairing', 'accessory_strength', 'mobility_work'],
      blockedMethods: ['high_rep_endurance', 'circuit_training', 'static_hold_emphasis'],
      maxSecondaryExercisesPerSession: 3,
      secondaryMustCarryover: false,
      rationale: 'Weighted strength benefits from complementary antagonist work and accessory strength',
    }
  }
  
  // Foundation building = broader integration for learning
  if (spineType === 'foundation_building') {
    return {
      mode: 'complementary',
      allowedSecondaryMethods: ['movement_variety', 'mobility_work', 'conditioning'],
      blockedMethods: ['advanced_statics', 'heavy_loading', 'high_intensity'],
      maxSecondaryExercisesPerSession: 4,
      secondaryMustCarryover: false,
      rationale: 'Foundation phase benefits from broader exposure to build movement literacy',
    }
  }
  
  // Default: carryover-focused
  return {
    mode: 'carryover_only',
    allowedSecondaryMethods: ['support_work', 'mobility', 'prehab'],
    blockedMethods: ['random_accessories', 'unrelated_conditioning'],
    maxSecondaryExercisesPerSession: 2,
    secondaryMustCarryover: true,
    rationale: 'Default integration prioritizes carryover to primary skills',
  }
}

function resolveSessionStructureRules(
  spineType: DominantSpineType,
  integrationMode: IntegrationMode,
  targetFrequency: number | null,
  experienceLevel: string | null,
  doctrineContract: DoctrineInfluenceContract | null
): UnifiedDoctrineDecision['sessionStructureRules'] {
  const freq = targetFrequency || 3
  
  // Static skill mastery prefers skill-first structure
  if (spineType === 'static_skill_mastery') {
    return {
      preferredStructures: ['skill_first', 'static_hold_blocks', 'superset_pairings'],
      blockedStructures: ['circuit_training', 'density_blocks', 'endurance_ladders'],
      skillBlockMandatory: true,
      strengthBlockMandatory: true,
      accessoryBlockAllowed: freq >= 4,
      maxTotalExercisesPerSession: freq >= 4 ? 7 : 5,
      rationale: 'Static skill mastery requires skill-first session structure with adequate rest',
    }
  }
  
  // Weighted strength prefers strength-first
  if (spineType === 'weighted_strength') {
    return {
      preferredStructures: ['strength_first', 'wave_loading', 'bent_arm_blocks'],
      blockedStructures: ['static_hold_emphasis', 'skill_drilling', 'circuit_training'],
      skillBlockMandatory: false,
      strengthBlockMandatory: true,
      accessoryBlockAllowed: true,
      maxTotalExercisesPerSession: 6,
      rationale: 'Weighted strength requires strength-first structure with progressive loading',
    }
  }
  
  // Default structure
  return {
    preferredStructures: ['balanced', 'skill_strength_hybrid'],
    blockedStructures: [],
    skillBlockMandatory: true,
    strengthBlockMandatory: true,
    accessoryBlockAllowed: true,
    maxTotalExercisesPerSession: 6,
    rationale: 'Default structure balances skill and strength work',
  }
}

function resolveExerciseSelectionRules(
  dominantSpine: UnifiedDoctrineDecision['dominantSpine'],
  selectedSkills: string[],
  integrationConstraints: UnifiedDoctrineDecision['integrationConstraints'],
  doctrineContract: DoctrineInfluenceContract | null
): UnifiedDoctrineDecision['exerciseSelectionRules'] {
  // Static skill mastery = prefer static variants, block generic
  if (dominantSpine.type === 'static_skill_mastery') {
    return {
      primaryExercisePool: [
        ...selectedSkills.map(s => `${s}_progression`),
        'scapular_pulls',
        'hollow_body',
        'compression_work',
      ],
      carryoverExercisePool: [
        'straight_arm_pulldown',
        'planche_lean',
        'front_lever_raises',
        'tucked_ice_cream_makers',
        'pseudo_planche_pushups',
      ],
      genericFillerBlocked: [
        'bicep_curls',
        'tricep_extensions',
        'lat_pulldowns',
        'random_ab_work',
      ],
      preferWeightedVariants: false,
      preferStaticVariants: true,
      preferDynamicVariants: false,
      rationale: 'Static skill mastery prioritizes position-specific progressions and straight-arm carryover',
    }
  }
  
  // Weighted strength = prefer weighted, support with accessories
  if (dominantSpine.type === 'weighted_strength') {
    return {
      primaryExercisePool: [
        'weighted_pull_up',
        'weighted_dip',
        'weighted_row',
        'weighted_pushup',
      ],
      carryoverExercisePool: [
        'rows',
        'face_pulls',
        'tricep_work',
        'core_stability',
      ],
      genericFillerBlocked: [
        'high_rep_isolation',
        'machine_exercises',
        'cable_flyes',
      ],
      preferWeightedVariants: true,
      preferStaticVariants: false,
      preferDynamicVariants: false,
      rationale: 'Weighted strength prioritizes loaded compounds with supporting accessory work',
    }
  }
  
  // Default
  return {
    primaryExercisePool: selectedSkills.map(s => `${s}_progression`),
    carryoverExercisePool: [],
    genericFillerBlocked: ['random_accessories'],
    preferWeightedVariants: false,
    preferStaticVariants: false,
    preferDynamicVariants: false,
    rationale: 'Default selection based on selected skills',
  }
}

function resolveDosageRules(
  spineType: DominantSpineType,
  experienceLevel: string | null,
  recoveryQuality: string | null,
  jointCautions: string[],
  doctrineContract: DoctrineInfluenceContract | null
): UnifiedDoctrineDecision['dosageRules'] {
  // Conservative for beginners, poor recovery, or joint issues
  const isConservative = 
    experienceLevel === 'beginner' ||
    recoveryQuality === 'poor' ||
    jointCautions.length > 0
  
  // Static skill mastery = skill quality over quantity
  if (spineType === 'static_skill_mastery') {
    return {
      intensityBias: isConservative ? 'conservative' : 'moderate',
      volumeBias: 'moderate',
      skillQualityOverQuantity: true,
      holdTimeEmphasis: true,
      recoveryConstrainedDosage: isConservative,
      rationale: 'Static skills require quality holds over high volume - recovery-aware dosing',
    }
  }
  
  // Weighted strength = can push intensity more
  if (spineType === 'weighted_strength') {
    return {
      intensityBias: isConservative ? 'moderate' : 'aggressive',
      volumeBias: 'low',
      skillQualityOverQuantity: false,
      holdTimeEmphasis: false,
      recoveryConstrainedDosage: isConservative,
      rationale: 'Weighted strength benefits from higher intensity, lower volume approach',
    }
  }
  
  // Foundation = moderate everything
  if (spineType === 'foundation_building') {
    return {
      intensityBias: 'conservative',
      volumeBias: 'moderate',
      skillQualityOverQuantity: true,
      holdTimeEmphasis: false,
      recoveryConstrainedDosage: true,
      rationale: 'Foundation phase prioritizes movement quality and sustainable volume',
    }
  }
  
  return {
    intensityBias: 'moderate',
    volumeBias: 'moderate',
    skillQualityOverQuantity: false,
    holdTimeEmphasis: false,
    recoveryConstrainedDosage: isConservative,
    rationale: 'Default moderate dosing based on athlete context',
  }
}

function resolveWeeklyDistribution(
  spineType: DominantSpineType,
  targetFrequency: number | null,
  recoveryQuality: string | null,
  experienceLevel: string | null,
  doctrineContract: DoctrineInfluenceContract | null
): UnifiedDoctrineDecision['weeklyDistribution'] {
  const freq = targetFrequency || 3
  const poorRecovery = recoveryQuality === 'poor'
  
  // Static skill mastery benefits from frequency
  if (spineType === 'static_skill_mastery') {
    return {
      primarySkillDays: Math.min(freq, poorRecovery ? 2 : 3),
      secondarySkillDays: freq >= 4 ? 1 : 0,
      recoveryDaysMandatory: poorRecovery ? 2 : 1,
      maxConsecutiveHardDays: poorRecovery ? 1 : 2,
      stressDistributionPattern: 'undulating',
      rationale: 'Static skills benefit from frequency with adequate recovery spacing',
    }
  }
  
  // Weighted strength needs recovery between heavy days
  if (spineType === 'weighted_strength') {
    return {
      primarySkillDays: Math.min(freq, 2),
      secondarySkillDays: freq >= 3 ? 1 : 0,
      recoveryDaysMandatory: poorRecovery ? 2 : 1,
      maxConsecutiveHardDays: 1,
      stressDistributionPattern: 'even',
      rationale: 'Weighted strength requires recovery between heavy loading sessions',
    }
  }
  
  // Default
  return {
    primarySkillDays: Math.floor(freq * 0.6),
    secondarySkillDays: Math.floor(freq * 0.4),
    recoveryDaysMandatory: 1,
    maxConsecutiveHardDays: 2,
    stressDistributionPattern: 'even',
    rationale: 'Default distribution based on frequency',
  }
}

function resolveAntiFlatteningRules(
  spineType: DominantSpineType,
  integrationMode: IntegrationMode,
  skillCount: number
): UnifiedDoctrineDecision['antiFlatteningRules'] {
  // Strong anti-flattening for focused spines
  const focusedSpine = spineType !== 'hybrid_balanced' && spineType !== 'foundation_building'
  
  return {
    preventGenericSplits: focusedSpine,
    preventEqualWeightBlending: focusedSpine,
    preventFillerAccessories: true,
    preventOverdiversification: skillCount > 4,
    minimumSpineVisibility: focusedSpine ? 0.7 : 0.5,
    rationale: focusedSpine 
      ? 'Focused spine requires dominant visibility - prevent generic flattening'
      : 'Balanced approach still prevents filler but allows more variety',
  }
}

function resolvePrimaryDoctrineId(
  primaryGoal: string | null,
  selectedSkills: string[]
): string | null {
  if (!primaryGoal) return null
  
  const goal = primaryGoal.toLowerCase()
  
  // Match to doctrine registry
  if (goal.includes('front lever') || goal.includes('planche') || goal.includes('handstand')) {
    return 'static_skill_frequency'
  }
  if (goal.includes('weighted') || goal.includes('strength')) {
    return 'weighted_strength_conversion'
  }
  if (goal.includes('muscle up') || goal.includes('dynamic')) {
    return 'dynamic_skill_development'
  }
  if (goal.includes('endurance') || goal.includes('conditioning')) {
    return 'endurance_density'
  }
  
  return null
}

function resolveSecondaryDoctrineId(secondaryGoal: string): string | null {
  const goal = secondaryGoal.toLowerCase()
  
  if (goal.includes('strength')) return 'weighted_strength_conversion'
  if (goal.includes('endurance')) return 'endurance_density'
  if (goal.includes('skill')) return 'static_skill_frequency'
  
  return null
}

// =============================================================================
// CONSUMER HELPER
// =============================================================================

/**
 * Check if an exercise is allowed by the doctrine decision.
 */
export function isExerciseAllowedByDoctrine(
  exerciseId: string,
  exerciseName: string,
  decision: UnifiedDoctrineDecision
): { allowed: boolean; reason: string } {
  const rules = decision.exerciseSelectionRules
  const nameLower = exerciseName.toLowerCase()
  
  // Check blocked filler
  for (const blocked of rules.genericFillerBlocked) {
    if (nameLower.includes(blocked.toLowerCase().replace(/_/g, ' '))) {
      return {
        allowed: false,
        reason: `Blocked by doctrine: ${blocked} is generic filler for ${decision.dominantSpine.type} spine`,
      }
    }
  }
  
  // Check if in primary or carryover pool (preferred)
  const inPrimaryPool = rules.primaryExercisePool.some(p => 
    nameLower.includes(p.toLowerCase().replace(/_/g, ' '))
  )
  const inCarryoverPool = rules.carryoverExercisePool.some(p =>
    nameLower.includes(p.toLowerCase().replace(/_/g, ' '))
  )
  
  if (inPrimaryPool) {
    return { allowed: true, reason: 'Primary exercise for current doctrine' }
  }
  if (inCarryoverPool) {
    return { allowed: true, reason: 'Carryover exercise supporting primary skills' }
  }
  
  // Default allow but note it's not doctrine-preferred
  return { allowed: true, reason: 'Allowed but not doctrine-preferred' }
}

/**
 * Get the maximum exercises for a session based on doctrine.
 */
export function getDoctrineMaxExercises(decision: UnifiedDoctrineDecision): number {
  return decision.sessionStructureRules.maxTotalExercisesPerSession
}

/**
 * Get dosage modifier based on doctrine.
 */
export function getDoctrineDosageModifier(decision: UnifiedDoctrineDecision): number {
  const bias = decision.dosageRules.intensityBias
  if (bias === 'conservative') return 0.85
  if (bias === 'aggressive') return 1.15
  return 1.0
}

/**
 * Check if session structure is doctrine-compliant.
 */
export function isSessionStructureDoctrineCompliant(
  hasSkillBlock: boolean,
  hasStrengthBlock: boolean,
  hasAccessoryBlock: boolean,
  decision: UnifiedDoctrineDecision
): { compliant: boolean; violations: string[] } {
  const rules = decision.sessionStructureRules
  const violations: string[] = []
  
  if (rules.skillBlockMandatory && !hasSkillBlock) {
    violations.push('Missing mandatory skill block')
  }
  if (rules.strengthBlockMandatory && !hasStrengthBlock) {
    violations.push('Missing mandatory strength block')
  }
  if (!rules.accessoryBlockAllowed && hasAccessoryBlock) {
    violations.push('Accessory block not allowed for this doctrine')
  }
  
  return {
    compliant: violations.length === 0,
    violations,
  }
}
