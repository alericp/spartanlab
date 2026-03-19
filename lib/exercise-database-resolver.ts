// Exercise Database Resolver
// Enforces that all program exercises come from the real training database
// Provides structured resolution with full metadata and source tracking

import {
  type Exercise,
  type ExerciseCategory,
  type MovementPattern,
  type MovementCategory,
  type DifficultyLevel,
  type EquipmentType,
  getAllExercises,
  getExerciseById,
  getExercisesByCategory,
  getExercisesByMovement,
  filterExercises,
  hasRequiredEquipment,
  SKILL_EXERCISES,
  STRENGTH_EXERCISES,
  ACCESSORY_EXERCISES,
  CORE_EXERCISES_POOL,
  WARMUP_EXERCISES,
  COOLDOWN_EXERCISES,
} from './adaptive-exercise-pool'
import type { JointCaution } from './athlete-profile'
import {
  type MovementIntelligentExercise,
  normalizeToMovementIntelligent,
  getMovementIntelligentExercise,
  filterMovementIntelligent,
  analyzeSessionPatterns,
  validateSessionCoherence,
  selectSupportForSkill,
  selectSupportForLimiter,
  type MovementFilterCriteria,
  type SessionPatternAnalysis,
  type CoherenceCheckResult,
} from './movement-intelligence'
import type { MovementFamily, SkillCarryover } from './movement-family-registry'

// =============================================================================
// TYPES
// =============================================================================

export type ExerciseRole = 'skill' | 'strength' | 'accessory' | 'core' | 'warmup' | 'cooldown'
export type IntensityIntent = 'high_neural' | 'moderate_support' | 'low_fatigue_density'
export type Specificity = 'primary_goal_direct' | 'secondary_support' | 'general_support'

export interface SlotRequirements {
  role: ExerciseRole
  pattern?: MovementPattern | MovementPattern[]
  specificity?: Specificity
  equipment?: EquipmentType[]
  excludeJointStress?: JointCaution[]
  maxDifficulty?: DifficultyLevel
  intensityIntent?: IntensityIntent
  skillTags?: string[]
  preferIds?: string[]
  excludeIds?: string[]
}

export interface ResolvedExercise {
  id: string
  slug: string
  displayName: string
  role: ExerciseRole
  primaryPattern: MovementPattern
  secondaryPatterns: MovementPattern[]
  skillTags: string[]
  equipmentRequired: EquipmentType[]
  equipmentOptional: EquipmentType[]
  difficulty: DifficultyLevel
  intensityTag: IntensityIntent
  jointStressTags: string[]
  contraindicationTags: string[]
  coachingReason: string
  source: 'database'
  // Original exercise object for full compatibility
  _original: Exercise
}

export interface ResolutionResult {
  success: boolean
  exercise: ResolvedExercise | null
  fallbackTier: 0 | 1 | 2 | 3 | 4
  candidatesFound: number
  diagnostics: string[]
}

export interface BatchResolutionResult {
  resolved: ResolvedExercise[]
  failures: { slot: SlotRequirements; reason: string }[]
  diagnostics: string[]
}

// =============================================================================
// JOINT STRESS MAPPING
// =============================================================================

const JOINT_STRESS_MAP: Record<string, JointCaution[]> = {
  // Straight-arm exercises stress wrists/elbows/shoulders
  planche_lean: ['wrists', 'shoulders'],
  tuck_planche: ['wrists', 'shoulders', 'elbows'],
  adv_tuck_planche: ['wrists', 'shoulders', 'elbows'],
  straddle_planche: ['wrists', 'shoulders', 'elbows'],
  maltese: ['wrists', 'shoulders', 'elbows'],
  // Front lever stresses shoulders
  tuck_fl: ['shoulders'],
  adv_tuck_fl: ['shoulders'],
  straddle_fl: ['shoulders'],
  full_fl: ['shoulders'],
  // Handstand variations
  wall_handstand: ['wrists', 'shoulders'],
  freestanding_handstand: ['wrists', 'shoulders'],
  hspu: ['wrists', 'shoulders'],
  // Heavy pressing
  weighted_dip: ['shoulders', 'elbows'],
  ring_dip: ['shoulders', 'elbows'],
  // Heavy pulling
  weighted_pull_up: ['elbows', 'shoulders'],
}

// =============================================================================
// DIFFICULTY ORDERING
// =============================================================================

const DIFFICULTY_ORDER: Record<DifficultyLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  elite: 4,
}

// =============================================================================
// CORE RESOLVER
// =============================================================================

/**
 * Get all exercises from the database
 * This is the single source of truth for available exercises
 */
export function getExerciseDatabase(): Exercise[] {
  return getAllExercises()
}

/**
 * Normalize an Exercise to ResolvedExercise with full metadata
 */
export function normalizeExercise(
  exercise: Exercise,
  coachingReason: string = 'Selected from exercise database'
): ResolvedExercise {
  // Determine intensity tag based on neural demand
  const intensityTag: IntensityIntent = 
    exercise.neuralDemand >= 4 ? 'high_neural' :
    exercise.neuralDemand >= 2 ? 'moderate_support' : 'low_fatigue_density'
  
  // Get joint stress tags
  const jointStressTags = JOINT_STRESS_MAP[exercise.id] || []
  
  // Determine secondary patterns (based on transferTo and category)
  const secondaryPatterns: MovementPattern[] = []
  if (exercise.movementPattern === 'horizontal_push') secondaryPatterns.push('core')
  if (exercise.movementPattern === 'horizontal_pull') secondaryPatterns.push('core')
  if (exercise.category === 'skill') secondaryPatterns.push('skill')
  
  return {
    id: exercise.id,
    slug: exercise.id, // Use ID as slug
    displayName: exercise.name,
    role: exercise.category as ExerciseRole,
    primaryPattern: exercise.movementPattern,
    secondaryPatterns,
    skillTags: exercise.transferTo || [],
    equipmentRequired: exercise.equipment.filter(e => e !== 'floor'),
    equipmentOptional: exercise.equipment.includes('floor') ? ['floor'] : [],
    difficulty: exercise.difficultyLevel || 'intermediate',
    intensityTag,
    jointStressTags: jointStressTags.map(j => j.toString()),
    contraindicationTags: jointStressTags.map(j => j.toString()),
    coachingReason,
    source: 'database',
    _original: exercise,
  }
}

/**
 * Check if an exercise conflicts with joint cautions
 */
function hasJointConflict(exercise: Exercise, cautions: JointCaution[]): boolean {
  if (!cautions || cautions.length === 0) return false
  
  const exerciseStress = JOINT_STRESS_MAP[exercise.id] || []
  return exerciseStress.some(stress => cautions.includes(stress))
}

/**
 * Check if exercise meets difficulty requirements
 */
function meetsDifficultyRequirement(exercise: Exercise, maxDifficulty?: DifficultyLevel): boolean {
  if (!maxDifficulty) return true
  const exerciseDiff = exercise.difficultyLevel || 'intermediate'
  return DIFFICULTY_ORDER[exerciseDiff] <= DIFFICULTY_ORDER[maxDifficulty]
}

/**
 * Resolve a single exercise slot from the database
 * Uses tiered fallback strategy - all tiers source from database only
 */
export function resolveExerciseSlot(
  requirements: SlotRequirements,
  context: {
    primaryGoal?: string
    availableEquipment?: EquipmentType[]
    jointCautions?: JointCaution[]
    usedIds?: Set<string>
  } = {}
): ResolutionResult {
  const diagnostics: string[] = []
  const usedIds = context.usedIds || new Set()
  
  console.log('[exercise-resolver] Resolving slot:', requirements.role, requirements.pattern)
  
  // Get the appropriate pool based on role
  let pool: Exercise[] = []
  switch (requirements.role) {
    case 'skill':
      pool = [...SKILL_EXERCISES]
      break
    case 'strength':
      pool = [...STRENGTH_EXERCISES]
      break
    case 'accessory':
      pool = [...ACCESSORY_EXERCISES]
      break
    case 'core':
      pool = [...CORE_EXERCISES_POOL]
      break
    case 'warmup':
      pool = [...WARMUP_EXERCISES]
      break
    case 'cooldown':
      pool = [...COOLDOWN_EXERCISES]
      break
    default:
      pool = getAllExercises()
  }
  
  diagnostics.push(`[Tier 0] Pool size for ${requirements.role}: ${pool.length}`)
  
  // TIER 1: Exact match with all requirements
  let candidates = pool.filter(ex => {
    // Exclude already used
    if (usedIds.has(ex.id)) return false
    
    // Exclude by ID
    if (requirements.excludeIds?.includes(ex.id)) return false
    
    // Pattern match
    if (requirements.pattern) {
      const patterns = Array.isArray(requirements.pattern) 
        ? requirements.pattern 
        : [requirements.pattern]
      if (!patterns.includes(ex.movementPattern)) return false
    }
    
    // Equipment check
    if (context.availableEquipment && context.availableEquipment.length > 0) {
      if (!hasRequiredEquipment(ex, context.availableEquipment)) return false
    }
    
    // Joint caution check
    const cautions = context.jointCautions || requirements.excludeJointStress || []
    if (hasJointConflict(ex, cautions)) return false
    
    // Difficulty check
    if (!meetsDifficultyRequirement(ex, requirements.maxDifficulty)) return false
    
    // Skill tags
    if (requirements.skillTags && requirements.skillTags.length > 0) {
      const hasRelevantTransfer = requirements.skillTags.some(tag => 
        ex.transferTo.includes(tag)
      )
      if (!hasRelevantTransfer) return false
    }
    
    return true
  })
  
  // Prefer specific IDs if requested
  if (requirements.preferIds && requirements.preferIds.length > 0) {
    const preferred = candidates.filter(ex => requirements.preferIds!.includes(ex.id))
    if (preferred.length > 0) {
      candidates = preferred
    }
  }
  
  if (candidates.length > 0) {
    const selected = candidates[0]
    diagnostics.push(`[Tier 1] Exact match found: ${selected.id}`)
    return {
      success: true,
      exercise: normalizeExercise(selected, `Exact match for ${requirements.role} slot`),
      fallbackTier: 1,
      candidatesFound: candidates.length,
      diagnostics,
    }
  }
  
  // TIER 2: Same role + same main pattern (relax equipment)
  candidates = pool.filter(ex => {
    if (usedIds.has(ex.id)) return false
    if (requirements.excludeIds?.includes(ex.id)) return false
    
    if (requirements.pattern) {
      const patterns = Array.isArray(requirements.pattern) 
        ? requirements.pattern 
        : [requirements.pattern]
      if (!patterns.includes(ex.movementPattern)) return false
    }
    
    // Skip equipment check at this tier
    
    const cautions = context.jointCautions || requirements.excludeJointStress || []
    if (hasJointConflict(ex, cautions)) return false
    
    return true
  })
  
  if (candidates.length > 0) {
    const selected = candidates[0]
    diagnostics.push(`[Tier 2] Pattern match found (equipment relaxed): ${selected.id}`)
    return {
      success: true,
      exercise: normalizeExercise(selected, `Pattern match for ${requirements.role} (equipment flexibility)`),
      fallbackTier: 2,
      candidatesFound: candidates.length,
      diagnostics,
    }
  }
  
  // TIER 3: Same role + same skill family (relax pattern)
  if (requirements.skillTags && requirements.skillTags.length > 0) {
    candidates = pool.filter(ex => {
      if (usedIds.has(ex.id)) return false
      if (requirements.excludeIds?.includes(ex.id)) return false
      
      // Check skill family
      const hasSkillFamily = requirements.skillTags!.some(tag => 
        ex.transferTo.includes(tag)
      )
      if (!hasSkillFamily) return false
      
      const cautions = context.jointCautions || requirements.excludeJointStress || []
      if (hasJointConflict(ex, cautions)) return false
      
      return true
    })
    
    if (candidates.length > 0) {
      const selected = candidates[0]
      diagnostics.push(`[Tier 3] Skill family match found: ${selected.id}`)
      return {
        success: true,
        exercise: normalizeExercise(selected, `Skill family match for ${context.primaryGoal || 'goal'}`),
        fallbackTier: 3,
        candidatesFound: candidates.length,
        diagnostics,
      }
    }
  }
  
  // TIER 4: Any safe exercise from the role pool
  candidates = pool.filter(ex => {
    if (usedIds.has(ex.id)) return false
    if (requirements.excludeIds?.includes(ex.id)) return false
    
    const cautions = context.jointCautions || requirements.excludeJointStress || []
    if (hasJointConflict(ex, cautions)) return false
    
    return true
  })
  
  if (candidates.length > 0) {
    const selected = candidates[0]
    diagnostics.push(`[Tier 4] Safe fallback found: ${selected.id}`)
    return {
      success: true,
      exercise: normalizeExercise(selected, `Safe ${requirements.role} exercise (doctrine-approved)`),
      fallbackTier: 4,
      candidatesFound: candidates.length,
      diagnostics,
    }
  }
  
  // No resolution possible
  diagnostics.push(`[FAILED] No database exercise found for slot`)
  console.warn('[exercise-resolver] Failed to resolve slot:', requirements, diagnostics)
  
  return {
    success: false,
    exercise: null,
    fallbackTier: 0,
    candidatesFound: 0,
    diagnostics,
  }
}

/**
 * Resolve multiple slots in sequence
 */
export function resolveExerciseSlots(
  slots: SlotRequirements[],
  context: {
    primaryGoal?: string
    availableEquipment?: EquipmentType[]
    jointCautions?: JointCaution[]
  } = {}
): BatchResolutionResult {
  const resolved: ResolvedExercise[] = []
  const failures: { slot: SlotRequirements; reason: string }[] = []
  const diagnostics: string[] = []
  const usedIds = new Set<string>()
  
  console.log('[exercise-resolver] Resolving', slots.length, 'slots')
  
  for (const slot of slots) {
    const result = resolveExerciseSlot(slot, {
      ...context,
      usedIds,
    })
    
    diagnostics.push(...result.diagnostics)
    
    if (result.success && result.exercise) {
      resolved.push(result.exercise)
      usedIds.add(result.exercise.id)
    } else {
      failures.push({
        slot,
        reason: result.diagnostics.join('; '),
      })
    }
  }
  
  console.log('[exercise-resolver] Resolution complete:', {
    resolved: resolved.length,
    failed: failures.length,
  })
  
  return { resolved, failures, diagnostics }
}

/**
 * Verify an exercise exists in the database
 */
export function verifyExerciseInDatabase(exerciseId: string): boolean {
  const exercise = getExerciseById(exerciseId)
  return exercise !== undefined
}

/**
 * Get an exercise by ID with full normalized metadata
 */
export function getResolvedExerciseById(
  exerciseId: string,
  coachingReason?: string
): ResolvedExercise | null {
  const exercise = getExerciseById(exerciseId)
  if (!exercise) return null
  return normalizeExercise(exercise, coachingReason)
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ExerciseValidationResult {
  isValid: boolean
  hasDbSource: boolean
  hasRequiredFields: boolean
  issues: string[]
}

/**
 * Validate that an exercise object is properly DB-backed
 */
export function validateExerciseSource(exercise: unknown): ExerciseValidationResult {
  const issues: string[] = []
  
  if (!exercise || typeof exercise !== 'object') {
    return {
      isValid: false,
      hasDbSource: false,
      hasRequiredFields: false,
      issues: ['Exercise is null or not an object'],
    }
  }
  
  const ex = exercise as Record<string, unknown>
  
  // Check for required fields
  const requiredFields = ['id', 'name', 'category']
  const missingFields = requiredFields.filter(f => !ex[f])
  const hasRequiredFields = missingFields.length === 0
  
  if (!hasRequiredFields) {
    issues.push(`Missing required fields: ${missingFields.join(', ')}`)
  }
  
  // Check if exercise exists in database
  const hasDbSource = typeof ex.id === 'string' && verifyExerciseInDatabase(ex.id)
  
  if (!hasDbSource && typeof ex.id === 'string') {
    issues.push(`Exercise ID "${ex.id}" not found in database`)
  }
  
  // Check for source marker on resolved exercises
  if ('source' in ex && ex.source !== 'database') {
    issues.push(`Exercise source is "${ex.source}", expected "database"`)
  }
  
  return {
    isValid: hasRequiredFields && hasDbSource,
    hasDbSource,
    hasRequiredFields,
    issues,
  }
}

// =============================================================================
// MOVEMENT-INTELLIGENT RESOLUTION
// =============================================================================

export interface MovementIntelligentResolutionResult {
  success: boolean
  exercise: MovementIntelligentExercise | null
  fallbackTier: 0 | 1 | 2 | 3 | 4
  candidatesFound: number
  diagnostics: string[]
  patternInfo?: {
    primaryPattern: MovementFamily
    armType: string
    jointStressLevel: string
  }
}

/**
 * Resolve an exercise slot and return a movement-intelligent exercise.
 * This is the canonical resolution function for movement-aware programming.
 */
export function resolveMovementIntelligentSlot(
  requirements: SlotRequirements,
  context: {
    primaryGoal?: string
    availableEquipment?: EquipmentType[]
    jointCautions?: JointCaution[]
    usedIds?: Set<string>
    preferLowJointStress?: boolean
  } = {}
): MovementIntelligentResolutionResult {
  console.log('[exercise-resolver] Resolving movement-intelligent slot:', requirements.role, requirements.pattern)
  
  // First, use standard resolution
  const standardResult = resolveExerciseSlot(requirements, context)
  
  if (!standardResult.success || !standardResult.exercise) {
    return {
      success: false,
      exercise: null,
      fallbackTier: 0,
      candidatesFound: 0,
      diagnostics: standardResult.diagnostics,
    }
  }
  
  // Get the original exercise for full normalization
  const originalExercise = standardResult.exercise._original
  if (!originalExercise) {
    console.warn('[exercise-resolver] Resolved exercise missing _original reference')
    return {
      success: false,
      exercise: null,
      fallbackTier: 0,
      candidatesFound: 0,
      diagnostics: ['Missing original exercise reference'],
    }
  }
  
  // Normalize to movement-intelligent format
  const movementIntelligent = normalizeToMovementIntelligent(
    originalExercise,
    standardResult.exercise.coachingReason
  )
  
  console.log('[movement-intel] Resolved:', {
    id: movementIntelligent.id,
    pattern: movementIntelligent.primaryPattern,
    armType: movementIntelligent.armType,
    jointStress: movementIntelligent.jointStress,
  })
  
  return {
    success: true,
    exercise: movementIntelligent,
    fallbackTier: standardResult.fallbackTier,
    candidatesFound: standardResult.candidatesFound,
    diagnostics: standardResult.diagnostics,
    patternInfo: {
      primaryPattern: movementIntelligent.primaryPattern,
      armType: movementIntelligent.armType,
      jointStressLevel: calculateOverallJointStress(movementIntelligent),
    },
  }
}

/**
 * Resolve multiple slots with movement intelligence
 */
export function resolveMovementIntelligentSlots(
  slots: SlotRequirements[],
  context: {
    primaryGoal?: string
    availableEquipment?: EquipmentType[]
    jointCautions?: JointCaution[]
  } = {}
): {
  resolved: MovementIntelligentExercise[]
  failures: { slot: SlotRequirements; reason: string }[]
  diagnostics: string[]
  sessionAnalysis: SessionPatternAnalysis
  coherenceCheck: CoherenceCheckResult
} {
  const resolved: MovementIntelligentExercise[] = []
  const failures: { slot: SlotRequirements; reason: string }[] = []
  const diagnostics: string[] = []
  const usedIds = new Set<string>()
  
  console.log('[exercise-resolver] Resolving', slots.length, 'movement-intelligent slots')
  
  for (const slot of slots) {
    const result = resolveMovementIntelligentSlot(slot, {
      ...context,
      usedIds,
    })
    
    diagnostics.push(...result.diagnostics)
    
    if (result.success && result.exercise) {
      resolved.push(result.exercise)
      usedIds.add(result.exercise.id)
    } else {
      failures.push({
        slot,
        reason: result.diagnostics.join('; '),
      })
    }
  }
  
  // Analyze pattern balance
  const sessionAnalysis = analyzeSessionPatterns(resolved)
  
  // Validate coherence
  const coherenceCheck = validateSessionCoherence(resolved)
  
  console.log('[exercise-resolver] Movement-intelligent resolution complete:', {
    resolved: resolved.length,
    failed: failures.length,
    coherent: coherenceCheck.passed,
    warnings: coherenceCheck.warnings.length,
  })
  
  return { resolved, failures, diagnostics, sessionAnalysis, coherenceCheck }
}

function calculateOverallJointStress(ex: MovementIntelligentExercise): string {
  const stressLevels = [
    ex.jointStress.shoulder,
    ex.jointStress.elbow,
    ex.jointStress.wrist,
    ex.jointStress.lowerBack,
  ]
  
  if (stressLevels.includes('high') || stressLevels.includes('very_high')) return 'high'
  if (stressLevels.filter(s => s === 'moderate').length >= 2) return 'moderate'
  return 'low'
}

// =============================================================================
// SKILL-TRANSFER AWARE SUPPORT SELECTION
// =============================================================================

/**
 * Select support exercises based on skill transfer requirements.
 * Uses movement intelligence for intelligent selection.
 */
export function selectSupportExercises(
  targetSkill: SkillCarryover,
  options: {
    jointCautions?: JointCaution[]
    maxDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    excludeIds?: string[]
    preferLowFatigue?: boolean
    preferStraightArm?: boolean
    limit?: number
  } = {}
): MovementIntelligentExercise[] {
  console.log('[exercise-resolver] Selecting support for skill:', targetSkill)
  
  return selectSupportForSkill({
    targetSkill,
    jointCautions: options.jointCautions,
    maxDifficulty: options.maxDifficulty,
    excludeIds: options.excludeIds,
    preferLowFatigue: options.preferLowFatigue,
    preferStraightArm: options.preferStraightArm,
    limit: options.limit,
  })
}

/**
 * Select support exercises based on limiter/weak point.
 * Uses movement intelligence limiter mapping.
 */
export function selectLimiterSupport(
  limiterId: string,
  options: {
    jointCautions?: JointCaution[]
    maxDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    excludeIds?: string[]
    limit?: number
  } = {}
): MovementIntelligentExercise[] {
  console.log('[exercise-resolver] Selecting limiter support:', limiterId)
  
  return selectSupportForLimiter(limiterId, options)
}

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

export {
  type MovementIntelligentExercise,
  type MovementFilterCriteria,
  type SessionPatternAnalysis,
  type CoherenceCheckResult,
  analyzeSessionPatterns,
  validateSessionCoherence,
  filterMovementIntelligent,
  getMovementIntelligentExercise,
}
