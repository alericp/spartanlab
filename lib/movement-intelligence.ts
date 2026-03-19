/**
 * SpartanLab Movement Intelligence Layer
 * 
 * Central canonical layer for movement-intelligent exercise selection.
 * Combines data from:
 * - movement-family-registry.ts (types and relationships)
 * - exercise-classification-registry.ts (exercise metadata)
 * - adaptive-exercise-pool.ts (exercise database)
 * 
 * This module provides:
 * - Normalized movement-intelligent exercise objects
 * - Movement pattern awareness for session/week composition
 * - Joint stress management for safer programming
 * - Arm type (straight/bent) stress distribution
 * - Skill transfer logic for support selection
 * - Weekly balance enforcement
 */

import type {
  MovementFamily,
  TrainingIntent,
  SkillCarryover,
  EquipmentTag,
  DifficultyBand,
  ArmType,
  TrunkDemand,
  ScapularDemand,
  JointStressProfile,
  StressLevel,
  JointRegion,
} from './movement-family-registry'
import { EXERCISE_CLASSIFICATIONS } from './exercise-classification-registry'
import type { Exercise, MovementPattern } from './adaptive-exercise-pool'
import { getAllExercises } from './adaptive-exercise-pool'
import type { JointCaution } from './athlete-profile'

// =============================================================================
// CANONICAL MOVEMENT-INTELLIGENT EXERCISE INTERFACE
// =============================================================================

export interface MovementIntelligentExercise {
  // Identity
  id: string
  slug: string
  displayName: string
  source: 'database' | 'classification_registry' | 'inferred'
  
  // Movement intelligence
  primaryPattern: MovementFamily
  secondaryPatterns: MovementFamily[]
  
  // Arm/limb type
  armType: ArmType
  
  // Stress profile
  neuralDemand: 1 | 2 | 3 | 4 | 5
  localFatigueProfile: 'low' | 'medium' | 'high'
  tendonLoadProfile: 'low' | 'medium' | 'high'
  skillComplexity: 'low' | 'medium' | 'high'
  
  // Joint stress
  jointStress: {
    shoulder: StressLevel
    elbow: StressLevel
    wrist: StressLevel
    lowerBack: StressLevel
    knee: StressLevel
  }
  
  // Trunk/positional demands
  trunkDemand: TrunkDemand
  scapularDemand: ScapularDemand
  
  // Transfer/skill tags
  skillTransferTags: SkillCarryover[]
  roleCompatibility: ('skill' | 'strength' | 'accessory' | 'core' | 'prep' | 'mobility')[]
  
  // Training intent
  intents: TrainingIntent[]
  primaryIntent: TrainingIntent
  
  // Equipment
  requiredEquipment: EquipmentTag[]
  optionalEquipment: EquipmentTag[]
  
  // Difficulty
  difficulty: DifficultyBand
  progressionStage?: number
  
  // Substitution
  substitutionPool: string[]
  
  // Original data reference
  _original: Exercise | null
  _classification: typeof EXERCISE_CLASSIFICATIONS[string] | null
}

// =============================================================================
// ARM TYPE INFERENCE BY MOVEMENT FAMILY
// =============================================================================

const ARM_TYPE_BY_FAMILY: Partial<Record<MovementFamily, ArmType>> = {
  straight_arm_pull: 'straight_arm',
  straight_arm_push: 'straight_arm',
  vertical_pull: 'bent_arm',
  horizontal_pull: 'bent_arm',
  vertical_push: 'bent_arm',
  horizontal_push: 'mixed',  // Push-ups are bent, planche is straight
  dip_pattern: 'bent_arm',
  compression_core: 'none',
  anti_extension_core: 'none',
  anti_rotation_core: 'none',
  scapular_control: 'mixed',
  rings_stability: 'straight_arm',
  rings_strength: 'straight_arm',
  mobility: 'none',
  joint_integrity: 'none',
}

// =============================================================================
// TRUNK DEMAND INFERENCE BY MOVEMENT FAMILY
// =============================================================================

const TRUNK_DEMAND_BY_FAMILY: Partial<Record<MovementFamily, TrunkDemand>> = {
  compression_core: 'compression',
  anti_extension_core: 'anti_extension',
  straight_arm_pull: 'hollow',
  straight_arm_push: 'hollow',
  vertical_push: 'neutral',
  horizontal_push: 'anti_extension',
  vertical_pull: 'neutral',
  horizontal_pull: 'neutral',
  dip_pattern: 'neutral',
  squat_pattern: 'neutral',
  hinge_pattern: 'arch',
  barbell_hinge: 'arch',
}

// =============================================================================
// SCAPULAR DEMAND INFERENCE BY MOVEMENT FAMILY
// =============================================================================

const SCAPULAR_DEMAND_BY_FAMILY: Partial<Record<MovementFamily, ScapularDemand>> = {
  vertical_pull: 'depression',
  horizontal_pull: 'retraction',
  straight_arm_pull: 'depression',
  vertical_push: 'upward_rotation',
  horizontal_push: 'protraction',
  straight_arm_push: 'protraction',
  dip_pattern: 'depression',
  scapular_control: 'mixed',
  rings_stability: 'depression',
}

// =============================================================================
// PATTERN MAPPING: MovementPattern -> MovementFamily
// =============================================================================

const PATTERN_TO_FAMILY: Record<MovementPattern, MovementFamily> = {
  horizontal_push: 'horizontal_push',
  vertical_push: 'vertical_push',
  horizontal_pull: 'horizontal_pull',
  vertical_pull: 'vertical_pull',
  core: 'compression_core',
  compression: 'compression_core',
  transition: 'transition',
  skill: 'straight_arm_push', // Default skill to straight-arm for calisthenics
  mobility: 'mobility',
}

// =============================================================================
// CANONICAL NORMALIZATION FUNCTION
// =============================================================================

/**
 * Normalize any exercise into a movement-intelligent object.
 * This is the canonical entry point for movement intelligence.
 */
export function normalizeToMovementIntelligent(
  exercise: Exercise,
  coachingReason?: string
): MovementIntelligentExercise {
  // Check if we have classification registry data for this exercise
  const classification = EXERCISE_CLASSIFICATIONS[exercise.id] || null
  
  // Determine primary pattern
  let primaryPattern: MovementFamily
  if (classification?.primaryFamily) {
    primaryPattern = classification.primaryFamily
  } else {
    primaryPattern = PATTERN_TO_FAMILY[exercise.movementPattern] || 'hypertrophy_accessory'
  }
  
  // Determine secondary patterns
  const secondaryPatterns: MovementFamily[] = classification?.secondaryFamilies || []
  
  // Determine arm type
  let armType: ArmType = 'none'
  if (classification?.armType) {
    armType = classification.armType
  } else {
    // Infer from pattern and exercise characteristics
    armType = inferArmType(exercise, primaryPattern)
  }
  
  // Determine trunk demand
  let trunkDemand: TrunkDemand = 'neutral'
  if (classification?.trunkDemand) {
    trunkDemand = classification.trunkDemand
  } else {
    trunkDemand = TRUNK_DEMAND_BY_FAMILY[primaryPattern] || 'neutral'
  }
  
  // Determine scapular demand
  let scapularDemand: ScapularDemand = 'neutral'
  if (classification?.scapularDemand) {
    scapularDemand = classification.scapularDemand
  } else {
    scapularDemand = SCAPULAR_DEMAND_BY_FAMILY[primaryPattern] || 'neutral'
  }
  
  // Build joint stress profile
  const jointStress = buildJointStressProfile(exercise, classification)
  
  // Determine stress profiles
  const neuralDemand = exercise.neuralDemand || classification?.neuralDemand || 2
  const fatigueCost = exercise.fatigueCost || classification?.fatigueCost || 2
  const localFatigueProfile: 'low' | 'medium' | 'high' = 
    fatigueCost <= 2 ? 'low' : fatigueCost <= 3 ? 'medium' : 'high'
  
  // Tendon load is high for straight-arm work
  const tendonLoadProfile: 'low' | 'medium' | 'high' = 
    armType === 'straight_arm' ? 'high' : 
    (classification?.jointStress || 2) >= 3 ? 'medium' : 'low'
  
  // Skill complexity
  const skillComplexity: 'low' | 'medium' | 'high' = 
    neuralDemand >= 4 ? 'high' : neuralDemand >= 3 ? 'medium' : 'low'
  
  // Skill transfer tags
  const skillTransferTags: SkillCarryover[] = (
    classification?.skillCarryover || 
    (exercise.transferTo || []).filter(t => isValidSkillCarryover(t)) as SkillCarryover[]
  )
  
  // Role compatibility
  const roleCompatibility = determineRoleCompatibility(exercise, classification)
  
  // Intents
  const intents: TrainingIntent[] = classification?.intents || ['strength']
  const primaryIntent: TrainingIntent = classification?.primaryIntent || 'strength'
  
  // Equipment
  const requiredEquipment: EquipmentTag[] = 
    classification?.requiredEquipment || 
    mapEquipmentToTags(exercise.equipment)
  const optionalEquipment: EquipmentTag[] = classification?.optionalEquipment || []
  
  // Difficulty
  const difficulty: DifficultyBand = exercise.difficultyLevel || classification?.difficulty || 'intermediate'
  const progressionStage = classification?.progressionStage
  
  // Substitution pool
  const substitutionPool = classification?.substitutionPool || exercise.substitutionOptions || []
  
  return {
    id: exercise.id,
    slug: exercise.id,
    displayName: exercise.name,
    source: classification ? 'classification_registry' : 'inferred',
    
    primaryPattern,
    secondaryPatterns,
    armType,
    
    neuralDemand: neuralDemand as 1 | 2 | 3 | 4 | 5,
    localFatigueProfile,
    tendonLoadProfile,
    skillComplexity,
    
    jointStress,
    trunkDemand,
    scapularDemand,
    
    skillTransferTags,
    roleCompatibility,
    intents,
    primaryIntent,
    
    requiredEquipment,
    optionalEquipment,
    difficulty,
    progressionStage,
    substitutionPool,
    
    _original: exercise,
    _classification: classification,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function inferArmType(exercise: Exercise, pattern: MovementFamily): ArmType {
  // Check exercise name for straight-arm indicators
  const nameLower = exercise.name.toLowerCase()
  if (
    nameLower.includes('planche') ||
    nameLower.includes('front lever') ||
    nameLower.includes('back lever') ||
    nameLower.includes('maltese') ||
    nameLower.includes('iron cross') ||
    nameLower.includes('rto') ||
    nameLower.includes('rings turned out')
  ) {
    return 'straight_arm'
  }
  
  // Check exercise ID
  const idLower = exercise.id.toLowerCase()
  if (
    idLower.includes('planche') ||
    idLower.includes('fl_') ||
    idLower.includes('front_lever') ||
    idLower.includes('back_lever') ||
    idLower.includes('maltese')
  ) {
    return 'straight_arm'
  }
  
  // Fall back to family inference
  return ARM_TYPE_BY_FAMILY[pattern] || 'none'
}

function buildJointStressProfile(
  exercise: Exercise,
  classification: typeof EXERCISE_CLASSIFICATIONS[string] | null
): MovementIntelligentExercise['jointStress'] {
  // Default safe profile
  const defaultProfile: MovementIntelligentExercise['jointStress'] = {
    shoulder: 'low',
    elbow: 'low',
    wrist: 'low',
    lowerBack: 'low',
    knee: 'low',
  }
  
  // Use classification joint stress profile if available
  if (classification?.jointStressProfile) {
    const profile = classification.jointStressProfile
    for (const stressor of profile.primaryStressors) {
      if (stressor.region === 'shoulder') defaultProfile.shoulder = stressor.level
      if (stressor.region === 'elbow') defaultProfile.elbow = stressor.level
      if (stressor.region === 'wrist') defaultProfile.wrist = stressor.level
      if (stressor.region === 'spine') defaultProfile.lowerBack = stressor.level
      if (stressor.region === 'knee') defaultProfile.knee = stressor.level
    }
    return defaultProfile
  }
  
  // Infer from exercise characteristics
  const nameLower = exercise.name.toLowerCase()
  const idLower = exercise.id.toLowerCase()
  
  // Wrist stress inference
  if (
    nameLower.includes('planche') ||
    nameLower.includes('handstand') ||
    nameLower.includes('hspu') ||
    nameLower.includes('push-up') ||
    nameLower.includes('push up')
  ) {
    defaultProfile.wrist = 'moderate'
    if (nameLower.includes('planche') || nameLower.includes('handstand')) {
      defaultProfile.wrist = 'high'
    }
  }
  
  // Shoulder stress inference
  if (
    nameLower.includes('planche') ||
    nameLower.includes('lever') ||
    nameLower.includes('dip') ||
    nameLower.includes('hspu') ||
    idLower.includes('fl_') ||
    idLower.includes('bl_')
  ) {
    defaultProfile.shoulder = 'moderate'
    if (nameLower.includes('straddle') || nameLower.includes('full')) {
      defaultProfile.shoulder = 'high'
    }
  }
  
  // Elbow stress inference
  if (
    nameLower.includes('planche') ||
    nameLower.includes('lever') ||
    nameLower.includes('maltese') ||
    nameLower.includes('iron cross')
  ) {
    defaultProfile.elbow = 'moderate'
  }
  
  // Lower back stress inference
  if (
    nameLower.includes('deadlift') ||
    nameLower.includes('dragon flag') ||
    nameLower.includes('back extension') ||
    nameLower.includes('good morning')
  ) {
    defaultProfile.lowerBack = 'moderate'
  }
  
  return defaultProfile
}

function isValidSkillCarryover(tag: string): tag is SkillCarryover {
  const validTags: SkillCarryover[] = [
    'front_lever', 'back_lever', 'planche', 'hspu', 'muscle_up',
    'l_sit', 'v_sit', 'handstand', 'iron_cross', 'human_flag',
    'one_arm_pull_up', 'one_arm_push_up'
  ]
  return validTags.includes(tag as SkillCarryover)
}

function determineRoleCompatibility(
  exercise: Exercise,
  classification: typeof EXERCISE_CLASSIFICATIONS[string] | null
): MovementIntelligentExercise['roleCompatibility'] {
  const roles: MovementIntelligentExercise['roleCompatibility'] = []
  
  // From exercise category
  if (exercise.category === 'skill') roles.push('skill')
  if (exercise.category === 'strength') roles.push('strength')
  if (exercise.category === 'accessory') roles.push('accessory')
  if (exercise.category === 'core') roles.push('core')
  if (exercise.category === 'warmup') roles.push('prep')
  if (exercise.category === 'flexibility') roles.push('mobility')
  
  // From classification intents
  if (classification) {
    if (classification.intents.includes('skill')) roles.push('skill')
    if (classification.intents.includes('strength')) roles.push('strength')
    if (classification.intents.includes('accessory')) roles.push('accessory')
    if (classification.intents.includes('mobility')) roles.push('mobility')
    if (classification.intents.includes('activation')) roles.push('prep')
  }
  
  // Deduplicate
  return [...new Set(roles)]
}

function mapEquipmentToTags(equipment: string[]): EquipmentTag[] {
  const mapping: Record<string, EquipmentTag> = {
    'pull_bar': 'pullup_bar',
    'pullup_bar': 'pullup_bar',
    'dip_bars': 'dip_bars',
    'rings': 'rings',
    'parallettes': 'parallettes',
    'bands': 'resistance_bands',
    'floor': 'floor',
    'wall': 'wall',
    'barbell': 'barbell',
    'dumbbells': 'dumbbells',
  }
  return equipment.map(e => mapping[e] || 'floor' as EquipmentTag).filter(Boolean)
}

// =============================================================================
// MOVEMENT-INTELLIGENT EXERCISE POOL
// =============================================================================

let _movementIntelligentPool: MovementIntelligentExercise[] | null = null

/**
 * Get all exercises normalized to movement-intelligent format.
 * Cached for performance.
 */
export function getMovementIntelligentPool(): MovementIntelligentExercise[] {
  if (_movementIntelligentPool) return _movementIntelligentPool
  
  const allExercises = getAllExercises()
  _movementIntelligentPool = allExercises.map(ex => normalizeToMovementIntelligent(ex))
  
  console.log('[movement-intel] Pool initialized:', _movementIntelligentPool.length, 'exercises')
  return _movementIntelligentPool
}

/**
 * Get a movement-intelligent exercise by ID
 */
export function getMovementIntelligentExercise(id: string): MovementIntelligentExercise | null {
  const pool = getMovementIntelligentPool()
  return pool.find(ex => ex.id === id) || null
}

// =============================================================================
// MOVEMENT-INTELLIGENT FILTERING
// =============================================================================

export interface MovementFilterCriteria {
  patterns?: MovementFamily[]
  armType?: ArmType[]
  maxJointStress?: {
    shoulder?: StressLevel
    elbow?: StressLevel
    wrist?: StressLevel
    lowerBack?: StressLevel
  }
  skillTransferTo?: SkillCarryover[]
  roles?: MovementIntelligentExercise['roleCompatibility'][number][]
  maxDifficulty?: DifficultyBand
  excludeIds?: string[]
}

/**
 * Filter movement-intelligent exercises by criteria.
 * Used for support selection, pattern balance, and joint-stress management.
 */
export function filterMovementIntelligent(
  criteria: MovementFilterCriteria
): MovementIntelligentExercise[] {
  const pool = getMovementIntelligentPool()
  
  return pool.filter(ex => {
    // Pattern filter
    if (criteria.patterns && criteria.patterns.length > 0) {
      if (!criteria.patterns.includes(ex.primaryPattern) &&
          !criteria.patterns.some(p => ex.secondaryPatterns.includes(p))) {
        return false
      }
    }
    
    // Arm type filter
    if (criteria.armType && criteria.armType.length > 0) {
      if (!criteria.armType.includes(ex.armType)) return false
    }
    
    // Joint stress filter
    if (criteria.maxJointStress) {
      const stressOrder: StressLevel[] = ['low', 'moderate', 'high', 'very_high']
      
      if (criteria.maxJointStress.shoulder) {
        const maxIdx = stressOrder.indexOf(criteria.maxJointStress.shoulder)
        const exIdx = stressOrder.indexOf(ex.jointStress.shoulder)
        if (exIdx > maxIdx) return false
      }
      
      if (criteria.maxJointStress.elbow) {
        const maxIdx = stressOrder.indexOf(criteria.maxJointStress.elbow)
        const exIdx = stressOrder.indexOf(ex.jointStress.elbow)
        if (exIdx > maxIdx) return false
      }
      
      if (criteria.maxJointStress.wrist) {
        const maxIdx = stressOrder.indexOf(criteria.maxJointStress.wrist)
        const exIdx = stressOrder.indexOf(ex.jointStress.wrist)
        if (exIdx > maxIdx) return false
      }
      
      if (criteria.maxJointStress.lowerBack) {
        const maxIdx = stressOrder.indexOf(criteria.maxJointStress.lowerBack)
        const exIdx = stressOrder.indexOf(ex.jointStress.lowerBack)
        if (exIdx > maxIdx) return false
      }
    }
    
    // Skill transfer filter
    if (criteria.skillTransferTo && criteria.skillTransferTo.length > 0) {
      const hasRelevantTransfer = criteria.skillTransferTo.some(skill =>
        ex.skillTransferTags.includes(skill)
      )
      if (!hasRelevantTransfer) return false
    }
    
    // Role filter
    if (criteria.roles && criteria.roles.length > 0) {
      const hasRelevantRole = criteria.roles.some(role =>
        ex.roleCompatibility.includes(role)
      )
      if (!hasRelevantRole) return false
    }
    
    // Difficulty filter
    if (criteria.maxDifficulty) {
      const difficultyOrder: DifficultyBand[] = ['beginner', 'intermediate', 'advanced', 'elite']
      const maxIdx = difficultyOrder.indexOf(criteria.maxDifficulty)
      const exIdx = difficultyOrder.indexOf(ex.difficulty)
      if (exIdx > maxIdx) return false
    }
    
    // Exclude IDs
    if (criteria.excludeIds && criteria.excludeIds.includes(ex.id)) {
      return false
    }
    
    return true
  })
}

// =============================================================================
// SESSION PATTERN BALANCE ANALYSIS
// =============================================================================

export interface SessionPatternAnalysis {
  straightArmCount: number
  bentArmCount: number
  pushCount: number
  pullCount: number
  coreCount: number
  compressionCount: number
  antiExtensionCount: number
  verticalPushCount: number
  horizontalPushCount: number
  verticalPullCount: number
  horizontalPullCount: number
  straightArmPullCount: number
  straightArmPushCount: number
  totalJointStress: {
    shoulder: number
    elbow: number
    wrist: number
    lowerBack: number
  }
  patternDistribution: Record<MovementFamily, number>
  warnings: string[]
}

/**
 * Analyze pattern balance for a session's exercises.
 * Returns structured analysis for validation and adjustment.
 */
export function analyzeSessionPatterns(
  exercises: MovementIntelligentExercise[]
): SessionPatternAnalysis {
  const analysis: SessionPatternAnalysis = {
    straightArmCount: 0,
    bentArmCount: 0,
    pushCount: 0,
    pullCount: 0,
    coreCount: 0,
    compressionCount: 0,
    antiExtensionCount: 0,
    verticalPushCount: 0,
    horizontalPushCount: 0,
    verticalPullCount: 0,
    horizontalPullCount: 0,
    straightArmPullCount: 0,
    straightArmPushCount: 0,
    totalJointStress: { shoulder: 0, elbow: 0, wrist: 0, lowerBack: 0 },
    patternDistribution: {} as Record<MovementFamily, number>,
    warnings: [],
  }
  
  const stressToNumber = (s: StressLevel): number => {
    return s === 'low' ? 1 : s === 'moderate' ? 2 : s === 'high' ? 3 : 4
  }
  
  for (const ex of exercises) {
    // Arm type counting
    if (ex.armType === 'straight_arm') analysis.straightArmCount++
    if (ex.armType === 'bent_arm') analysis.bentArmCount++
    
    // Pattern counting
    const pattern = ex.primaryPattern
    analysis.patternDistribution[pattern] = (analysis.patternDistribution[pattern] || 0) + 1
    
    // Push/pull counting
    if (pattern.includes('push') || pattern === 'dip_pattern') analysis.pushCount++
    if (pattern.includes('pull')) analysis.pullCount++
    
    // Core type counting
    if (pattern === 'compression_core') {
      analysis.coreCount++
      analysis.compressionCount++
    }
    if (pattern === 'anti_extension_core') {
      analysis.coreCount++
      analysis.antiExtensionCount++
    }
    
    // Specific pattern counting
    if (pattern === 'vertical_push') analysis.verticalPushCount++
    if (pattern === 'horizontal_push') analysis.horizontalPushCount++
    if (pattern === 'vertical_pull') analysis.verticalPullCount++
    if (pattern === 'horizontal_pull') analysis.horizontalPullCount++
    if (pattern === 'straight_arm_pull') analysis.straightArmPullCount++
    if (pattern === 'straight_arm_push') analysis.straightArmPushCount++
    
    // Joint stress accumulation
    analysis.totalJointStress.shoulder += stressToNumber(ex.jointStress.shoulder)
    analysis.totalJointStress.elbow += stressToNumber(ex.jointStress.elbow)
    analysis.totalJointStress.wrist += stressToNumber(ex.jointStress.wrist)
    analysis.totalJointStress.lowerBack += stressToNumber(ex.jointStress.lowerBack)
  }
  
  // Generate warnings
  if (analysis.straightArmCount >= 3) {
    analysis.warnings.push('High straight-arm stress: 3+ straight-arm exercises in one session')
  }
  if (analysis.totalJointStress.wrist >= 8) {
    analysis.warnings.push('High wrist stress accumulation')
  }
  if (analysis.totalJointStress.shoulder >= 10) {
    analysis.warnings.push('High shoulder stress accumulation')
  }
  if (analysis.pushCount >= 4 && analysis.pullCount <= 1) {
    analysis.warnings.push('Push/pull imbalance: excessive pushing')
  }
  if (analysis.pullCount >= 4 && analysis.pushCount <= 1) {
    analysis.warnings.push('Push/pull imbalance: excessive pulling')
  }
  
  return analysis
}

// =============================================================================
// WEEKLY PATTERN BALANCE ANALYSIS
// =============================================================================

export interface WeeklyPatternAnalysis {
  totalStraightArmSessions: number
  straightArmDays: number[]
  pushPullRatio: number
  compressionDays: number
  antiExtensionDays: number
  patternDayDistribution: Record<MovementFamily, number[]>
  jointStressByDay: { shoulder: number; elbow: number; wrist: number }[]
  warnings: string[]
  recommendations: string[]
}

/**
 * Analyze weekly pattern distribution across sessions.
 */
export function analyzeWeeklyPatterns(
  sessionsByDay: MovementIntelligentExercise[][]
): WeeklyPatternAnalysis {
  const analysis: WeeklyPatternAnalysis = {
    totalStraightArmSessions: 0,
    straightArmDays: [],
    pushPullRatio: 0,
    compressionDays: 0,
    antiExtensionDays: 0,
    patternDayDistribution: {} as Record<MovementFamily, number[]>,
    jointStressByDay: [],
    warnings: [],
    recommendations: [],
  }
  
  let totalPush = 0
  let totalPull = 0
  
  sessionsByDay.forEach((exercises, dayIndex) => {
    const dayAnalysis = analyzeSessionPatterns(exercises)
    
    // Track straight-arm days
    if (dayAnalysis.straightArmCount >= 2) {
      analysis.totalStraightArmSessions++
      analysis.straightArmDays.push(dayIndex)
    }
    
    // Track core variety
    if (dayAnalysis.compressionCount > 0) analysis.compressionDays++
    if (dayAnalysis.antiExtensionCount > 0) analysis.antiExtensionDays++
    
    // Accumulate push/pull
    totalPush += dayAnalysis.pushCount
    totalPull += dayAnalysis.pullCount
    
    // Track patterns by day
    for (const [pattern, count] of Object.entries(dayAnalysis.patternDistribution)) {
      if (!analysis.patternDayDistribution[pattern as MovementFamily]) {
        analysis.patternDayDistribution[pattern as MovementFamily] = []
      }
      if (count > 0) {
        analysis.patternDayDistribution[pattern as MovementFamily].push(dayIndex)
      }
    }
    
    // Track joint stress by day
    analysis.jointStressByDay.push({
      shoulder: dayAnalysis.totalJointStress.shoulder,
      elbow: dayAnalysis.totalJointStress.elbow,
      wrist: dayAnalysis.totalJointStress.wrist,
    })
  })
  
  // Calculate push/pull ratio
  analysis.pushPullRatio = totalPull > 0 ? totalPush / totalPull : totalPush
  
  // Generate warnings
  if (analysis.totalStraightArmSessions >= 4) {
    analysis.warnings.push('Excessive straight-arm frequency: consider spreading across weeks')
  }
  
  // Check for consecutive straight-arm days
  for (let i = 0; i < analysis.straightArmDays.length - 1; i++) {
    if (analysis.straightArmDays[i + 1] - analysis.straightArmDays[i] === 1) {
      analysis.warnings.push('Consecutive straight-arm heavy days detected')
      break
    }
  }
  
  // Push/pull balance warnings
  if (analysis.pushPullRatio > 1.5) {
    analysis.warnings.push('Weekly push/pull imbalance: more push than pull')
  } else if (analysis.pushPullRatio < 0.67) {
    analysis.warnings.push('Weekly push/pull imbalance: more pull than push')
  }
  
  // Core variety recommendations
  if (analysis.compressionDays === 0 && sessionsByDay.length >= 3) {
    analysis.recommendations.push('Consider adding compression core work (L-sit, dragon flag)')
  }
  if (analysis.antiExtensionDays === 0 && sessionsByDay.length >= 3) {
    analysis.recommendations.push('Consider adding anti-extension core work (hollow body, ab wheel)')
  }
  
  return analysis
}

// =============================================================================
// SUPPORT SELECTION BASED ON SKILL TRANSFER
// =============================================================================

export interface SupportSelectionCriteria {
  targetSkill: SkillCarryover
  jointCautions?: JointCaution[]
  maxDifficulty?: DifficultyBand
  excludeIds?: string[]
  preferLowFatigue?: boolean
  preferStraightArm?: boolean
  limit?: number
}

/**
 * Select support exercises for a target skill using movement intelligence.
 */
export function selectSupportForSkill(
  criteria: SupportSelectionCriteria
): MovementIntelligentExercise[] {
  const pool = getMovementIntelligentPool()
  
  // First, find exercises that transfer to the target skill
  let candidates = pool.filter(ex => 
    ex.skillTransferTags.includes(criteria.targetSkill)
  )
  
  // Apply joint caution filters
  if (criteria.jointCautions && criteria.jointCautions.length > 0) {
    candidates = candidates.filter(ex => {
      for (const caution of criteria.jointCautions!) {
        if (caution === 'shoulders' && ex.jointStress.shoulder === 'high') return false
        if (caution === 'elbows' && ex.jointStress.elbow === 'high') return false
        if (caution === 'wrists' && ex.jointStress.wrist === 'high') return false
        if (caution === 'lower_back' && ex.jointStress.lowerBack === 'high') return false
        if (caution === 'knees' && ex.jointStress.knee === 'high') return false
      }
      return true
    })
  }
  
  // Apply difficulty filter
  if (criteria.maxDifficulty) {
    const difficultyOrder: DifficultyBand[] = ['beginner', 'intermediate', 'advanced', 'elite']
    const maxIdx = difficultyOrder.indexOf(criteria.maxDifficulty)
    candidates = candidates.filter(ex => difficultyOrder.indexOf(ex.difficulty) <= maxIdx)
  }
  
  // Exclude specific IDs
  if (criteria.excludeIds) {
    candidates = candidates.filter(ex => !criteria.excludeIds!.includes(ex.id))
  }
  
  // Sort by preference
  candidates.sort((a, b) => {
    // Prefer lower fatigue if requested
    if (criteria.preferLowFatigue) {
      const aFatigue = a.localFatigueProfile === 'low' ? 0 : a.localFatigueProfile === 'medium' ? 1 : 2
      const bFatigue = b.localFatigueProfile === 'low' ? 0 : b.localFatigueProfile === 'medium' ? 1 : 2
      if (aFatigue !== bFatigue) return aFatigue - bFatigue
    }
    
    // Prefer straight-arm if requested
    if (criteria.preferStraightArm) {
      const aArm = a.armType === 'straight_arm' ? 0 : 1
      const bArm = b.armType === 'straight_arm' ? 0 : 1
      if (aArm !== bArm) return aArm - bArm
    }
    
    // Otherwise prefer by neural demand (higher is better for skill transfer)
    return b.neuralDemand - a.neuralDemand
  })
  
  const limit = criteria.limit || 5
  return candidates.slice(0, limit)
}

// =============================================================================
// LIMITER-BASED SUPPORT MAPPING
// =============================================================================

/**
 * Movement requirements for specific weak points / limiters
 */
export const LIMITER_MOVEMENT_REQUIREMENTS: Record<string, {
  primaryPatterns: MovementFamily[]
  armType?: ArmType
  trunkDemand?: TrunkDemand
  scapularDemand?: ScapularDemand
  description: string
}> = {
  // Front lever limiters
  front_lever_straight_arm_strength: {
    primaryPatterns: ['straight_arm_pull'],
    armType: 'straight_arm',
    trunkDemand: 'hollow',
    scapularDemand: 'depression',
    description: 'Straight-arm pulling strength for front lever',
  },
  front_lever_core: {
    primaryPatterns: ['anti_extension_core', 'compression_core'],
    trunkDemand: 'anti_extension',
    description: 'Anti-extension core strength for front lever body position',
  },
  
  // Planche limiters
  planche_straight_arm_strength: {
    primaryPatterns: ['straight_arm_push'],
    armType: 'straight_arm',
    trunkDemand: 'hollow',
    scapularDemand: 'protraction',
    description: 'Straight-arm pushing strength for planche',
  },
  planche_protraction: {
    primaryPatterns: ['scapular_control', 'horizontal_push'],
    scapularDemand: 'protraction',
    description: 'Scapular protraction strength for planche',
  },
  
  // HSPU limiters
  hspu_pressing_strength: {
    primaryPatterns: ['vertical_push'],
    scapularDemand: 'upward_rotation',
    description: 'Vertical pressing strength for HSPU',
  },
  hspu_stability: {
    primaryPatterns: ['scapular_control', 'joint_integrity'],
    description: 'Shoulder stability for overhead pressing',
  },
  
  // Dragon flag / compression limiters
  dragon_flag_anti_extension: {
    primaryPatterns: ['anti_extension_core'],
    trunkDemand: 'anti_extension',
    description: 'Anti-extension strength for dragon flag',
  },
  compression_strength: {
    primaryPatterns: ['compression_core'],
    trunkDemand: 'compression',
    description: 'Hip flexor and core compression strength',
  },
  
  // L-sit / V-sit limiters
  l_sit_compression: {
    primaryPatterns: ['compression_core'],
    trunkDemand: 'compression',
    description: 'Compression strength for L-sit',
  },
  l_sit_support: {
    primaryPatterns: ['dip_pattern', 'scapular_control'],
    scapularDemand: 'depression',
    description: 'Shoulder depression and support strength for L-sit',
  },
  
  // Muscle-up limiters
  muscle_up_pull: {
    primaryPatterns: ['vertical_pull', 'explosive_pull'],
    description: 'Explosive pulling strength for muscle-up transition',
  },
  muscle_up_transition: {
    primaryPatterns: ['transition', 'dip_pattern'],
    description: 'Transition strength from pull to dip',
  },
}

/**
 * Select support exercises based on limiter requirements.
 */
export function selectSupportForLimiter(
  limiterId: string,
  options: {
    jointCautions?: JointCaution[]
    maxDifficulty?: DifficultyBand
    excludeIds?: string[]
    limit?: number
  } = {}
): MovementIntelligentExercise[] {
  const requirements = LIMITER_MOVEMENT_REQUIREMENTS[limiterId]
  if (!requirements) {
    console.warn('[movement-intel] Unknown limiter:', limiterId)
    return []
  }
  
  console.log('[movement-intel] Selecting support for limiter:', limiterId, requirements.description)
  
  const candidates = filterMovementIntelligent({
    patterns: requirements.primaryPatterns,
    armType: requirements.armType ? [requirements.armType] : undefined,
    maxDifficulty: options.maxDifficulty,
    excludeIds: options.excludeIds,
  })
  
  // Apply joint caution filtering
  let filtered = candidates
  if (options.jointCautions && options.jointCautions.length > 0) {
    filtered = candidates.filter(ex => {
      for (const caution of options.jointCautions!) {
        if (caution === 'shoulders' && ex.jointStress.shoulder === 'high') return false
        if (caution === 'elbows' && ex.jointStress.elbow === 'high') return false
        if (caution === 'wrists' && ex.jointStress.wrist === 'high') return false
        if (caution === 'lower_back' && ex.jointStress.lowerBack === 'high') return false
      }
      return true
    })
  }
  
  // Further filter by trunk/scapular demand if specified
  if (requirements.trunkDemand) {
    filtered = filtered.filter(ex => ex.trunkDemand === requirements.trunkDemand || ex.trunkDemand === 'mixed')
  }
  if (requirements.scapularDemand) {
    filtered = filtered.filter(ex => ex.scapularDemand === requirements.scapularDemand || ex.scapularDemand === 'mixed')
  }
  
  // Sort by relevance (neural demand + fatigue cost balance)
  filtered.sort((a, b) => {
    const aScore = a.neuralDemand * 2 - a.localFatigueProfile.length
    const bScore = b.neuralDemand * 2 - b.localFatigueProfile.length
    return bScore - aScore
  })
  
  const limit = options.limit || 5
  return filtered.slice(0, limit)
}

// =============================================================================
// VERTICAL PRESS (HSPU) BIOMECHANICS CLASSIFICATION
// =============================================================================

/**
 * Classification for vertical pressing exercises
 * Used to correctly categorize HSPU and overhead press for shoulder work
 */
export const VERTICAL_PRESS_CLASSIFICATION = {
  primaryMuscleContribution: {
    anterior_deltoid: 0.65,  // ~65% - Primary mover
    medial_deltoid: 0.20,   // ~20% - Secondary/stabilizer
    triceps: 0.10,          // ~10% - Lockout
    upper_chest: 0.05,      // ~5% - Minor contribution
  },
  trainingImplications: {
    // HSPU is excellent for anterior delt, meaningful for medial
    // but NOT the primary choice for direct medial-delt hypertrophy
    canBuildAnteriorDelt: true,
    canBuildMedialDelt: true,  // Yes, but not optimally
    isPrimaryMedialDeltChoice: false,  // Lateral raises are better
    providesOverheadStrength: true,
  },
  supportWorkRecommendations: {
    forShoulderWidth: ['lateral_raise', 'upright_row', 'face_pull'],
    forOverheadStrength: ['pike_push_up', 'elevated_pike', 'z_press'],
    forStability: ['handstand_hold', 'wall_slides', 'shoulder_circles'],
  },
}

/**
 * Check if an exercise is a vertical press and get its classification
 */
export function getVerticalPressClassification(exerciseId: string): typeof VERTICAL_PRESS_CLASSIFICATION | null {
  const verticalPressIds = [
    'hspu', 'wall_hspu', 'pike_push_up', 'elevated_pike_push_up',
    'deficit_hspu', 'freestanding_hspu', 'overhead_press', 'z_press'
  ]
  
  if (verticalPressIds.includes(exerciseId)) {
    return VERTICAL_PRESS_CLASSIFICATION
  }
  return null
}

// =============================================================================
// VALIDATION: BIOMECHANICAL COHERENCE CHECK
// =============================================================================

export interface CoherenceCheckResult {
  passed: boolean
  warnings: string[]
  errors: string[]
  suggestions: string[]
}

/**
 * Validate biomechanical coherence of a session's exercises.
 * Returns warnings if session contains problematic combinations.
 */
export function validateSessionCoherence(
  exercises: MovementIntelligentExercise[]
): CoherenceCheckResult {
  const result: CoherenceCheckResult = {
    passed: true,
    warnings: [],
    errors: [],
    suggestions: [],
  }
  
  const analysis = analyzeSessionPatterns(exercises)
  
  // Check for duplicate pattern stacking
  for (const [pattern, count] of Object.entries(analysis.patternDistribution)) {
    if (count >= 4) {
      result.warnings.push(`Pattern stacking: ${count} exercises of type ${pattern}`)
    }
  }
  
  // Check for excessive straight-arm work
  if (analysis.straightArmCount >= 4) {
    result.warnings.push('Excessive straight-arm work in single session')
    result.suggestions.push('Consider spreading straight-arm exercises across multiple days')
  }
  
  // Check for high joint stress accumulation
  if (analysis.totalJointStress.shoulder >= 12) {
    result.warnings.push('Very high shoulder stress accumulation')
    result.suggestions.push('Consider removing one high-shoulder-stress exercise')
  }
  if (analysis.totalJointStress.wrist >= 10) {
    result.warnings.push('Very high wrist stress accumulation')
    result.suggestions.push('Consider removing one high-wrist-stress exercise')
  }
  
  // Check for nonsensical combinations
  const hasCompression = analysis.compressionCount > 0
  const hasAntiExtension = analysis.antiExtensionCount > 0
  if (hasCompression && hasAntiExtension && analysis.coreCount >= 4) {
    result.warnings.push('Heavy core volume with both compression and anti-extension')
  }
  
  // Check push/pull balance within session
  const ratio = analysis.pullCount > 0 ? analysis.pushCount / analysis.pullCount : analysis.pushCount
  if (ratio > 3 || ratio < 0.33) {
    result.warnings.push('Significant push/pull imbalance within session')
  }
  
  // Mark as not passed if there are errors
  if (result.errors.length > 0) {
    result.passed = false
  }
  
  // Also fail if too many warnings
  if (result.warnings.length >= 3) {
    result.passed = false
    result.suggestions.push('Session has multiple warnings - consider restructuring')
  }
  
  console.log('[movement-intel] Session coherence check:', {
    passed: result.passed,
    warnings: result.warnings.length,
    errors: result.errors.length,
  })
  
  return result
}

/**
 * Validate weekly program coherence
 */
export function validateWeeklyCoherence(
  sessionsByDay: MovementIntelligentExercise[][]
): CoherenceCheckResult {
  const result: CoherenceCheckResult = {
    passed: true,
    warnings: [],
    errors: [],
    suggestions: [],
  }
  
  const weeklyAnalysis = analyzeWeeklyPatterns(sessionsByDay)
  
  // Add weekly warnings
  result.warnings.push(...weeklyAnalysis.warnings)
  result.suggestions.push(...weeklyAnalysis.recommendations)
  
  // Validate each session
  sessionsByDay.forEach((exercises, dayIndex) => {
    const sessionResult = validateSessionCoherence(exercises)
    if (!sessionResult.passed) {
      result.warnings.push(`Day ${dayIndex + 1} has coherence issues`)
    }
  })
  
  // Mark as not passed if too many issues
  if (result.warnings.length >= 4 || result.errors.length > 0) {
    result.passed = false
  }
  
  return result
}
