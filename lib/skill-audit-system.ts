/**
 * SpartanLab Skill Audit System
 * 
 * Validates that every skill in the platform:
 * - Maps to correct training principles
 * - Has valid exercise pools at all difficulty levels
 * - Integrates with the program builder
 * - Works with fatigue/recovery logic
 * - Supports flexibility vs mobility distinction
 */

import { SKILL_EXERCISES, STRENGTH_EXERCISES, FLEXIBILITY_EXERCISES, ACCESSORY_EXERCISES, type Exercise, type DifficultyLevel } from './adaptive-exercise-pool'
import { SKILL_METHOD_MATRIX, METHOD_PROFILES, type SkillType, type MethodProfileId } from './training-principles-engine'
import { FLEXIBILITY_SEQUENCES, type FlexibilitySequence } from './flexibility-sequences'
import { MOBILITY_EXERCISES, type RangeSkill } from './range-training-system'

// =============================================================================
// COMPLETE SKILL PRINCIPLE MATRIX (Extended)
// =============================================================================

export interface ExtendedSkillMatrix {
  skill: SkillType
  category: 'strength' | 'static_skill' | 'dynamic_skill' | 'flexibility' | 'mobility' | 'compression'
  primary: MethodProfileId[]
  secondary: MethodProfileId[]
  support: MethodProfileId[]
  avoid: MethodProfileId[]
  exercisePoolStatus: 'complete' | 'partial' | 'missing'
  progressionLevels: {
    beginner: number
    intermediate: number
    advanced: number
    elite: number
  }
  flexibilitySystemIntegrated: boolean
  mobilitySystemIntegrated: boolean
  programBuilderConnected: boolean
  fatigueLogicConnected: boolean
  validationNotes: string[]
}

export const EXTENDED_SKILL_MATRIX: Record<SkillType, ExtendedSkillMatrix> = {
  // -------------------------------------------------------------------------
  // STATIC PULLING SKILLS
  // -------------------------------------------------------------------------
  front_lever: {
    skill: 'front_lever',
    category: 'static_skill',
    primary: ['static_skill_density'],
    secondary: ['hybrid_skill_strength'],
    support: ['hypertrophy_support', 'weighted_strength'],
    avoid: ['endurance_density', 'flexibility_exposure'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 2, intermediate: 3, advanced: 2, elite: 1 },
    flexibilitySystemIntegrated: false,
    mobilitySystemIntegrated: false,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Tuck → Adv Tuck → One Leg → Straddle → Full progression chain complete',
      'Banded assistance options available',
      'Row variations for dynamic support',
    ],
  },

  // -------------------------------------------------------------------------
  // STATIC PUSHING SKILLS
  // -------------------------------------------------------------------------
  planche: {
    skill: 'planche',
    category: 'static_skill',
    primary: ['static_skill_density'],
    secondary: ['hybrid_skill_strength'],
    support: ['hypertrophy_support', 'recovery_conservative'],
    avoid: ['endurance_density', 'weighted_strength'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 2, intermediate: 3, advanced: 2, elite: 1 },
    flexibilitySystemIntegrated: false,
    mobilitySystemIntegrated: false,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Planche Lean → Tuck → Adv Tuck → Straddle progression chain',
      'Banded variations available',
      'PPPU for dynamic support',
    ],
  },

  // -------------------------------------------------------------------------
  // DYNAMIC EXPLOSIVE SKILLS
  // -------------------------------------------------------------------------
  muscle_up: {
    skill: 'muscle_up',
    category: 'dynamic_skill',
    primary: ['explosive_power', 'weighted_strength'],
    secondary: ['endurance_density', 'hybrid_skill_strength'],
    support: ['hypertrophy_support'],
    avoid: ['flexibility_exposure', 'recovery_conservative'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 2, intermediate: 3, advanced: 2, elite: 1 },
    flexibilitySystemIntegrated: false,
    mobilitySystemIntegrated: false,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Explosive pull-up → Transition work → Full muscle-up chain',
      'Pull and push strength support integrated',
      'Endurance density for rep building',
    ],
  },

  // -------------------------------------------------------------------------
  // OVERHEAD/BALANCE SKILLS
  // -------------------------------------------------------------------------
  handstand: {
    skill: 'handstand',
    category: 'static_skill',
    primary: ['static_skill_density'],
    secondary: ['hybrid_skill_strength', 'recovery_conservative'],
    support: [],
    avoid: ['weighted_strength', 'endurance_density'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 2, intermediate: 2, advanced: 2, elite: 1 },
    flexibilitySystemIntegrated: false,
    mobilitySystemIntegrated: false,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Wall → Freestanding progression',
      'Balance focus, frequent practice model',
      'Low fatigue cost allows high frequency',
    ],
  },

  hspu: {
    skill: 'hspu',
    category: 'strength',
    primary: ['hybrid_skill_strength', 'static_skill_density'],
    secondary: ['weighted_strength', 'hypertrophy_support'],
    support: [],
    avoid: ['endurance_density', 'flexibility_exposure'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 1, intermediate: 2, advanced: 2, elite: 1 },
    flexibilitySystemIntegrated: false,
    mobilitySystemIntegrated: false,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Wall HS hold → Partial HSPU → Full HSPU → Freestanding',
      'Pike push-ups as regression',
      'Overhead pressing support available',
    ],
  },

  // -------------------------------------------------------------------------
  // COMPRESSION SKILLS
  // -------------------------------------------------------------------------
  l_sit: {
    skill: 'l_sit',
    category: 'compression',
    primary: ['static_skill_density', 'flexibility_exposure'],
    secondary: ['mobility_strength', 'hypertrophy_support'],
    support: [],
    avoid: ['weighted_strength', 'explosive_power'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 2, intermediate: 2, advanced: 1, elite: 1 },
    flexibilitySystemIntegrated: true,
    mobilitySystemIntegrated: true,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Tuck → One leg → Full L-sit progression',
      'Requires hamstring flexibility (toe touch integration)',
      'Compression holds build supporting strength',
    ],
  },

  v_sit: {
    skill: 'v_sit',
    category: 'compression',
    primary: ['static_skill_density', 'mobility_strength'],
    secondary: ['flexibility_exposure', 'hypertrophy_support'],
    support: [],
    avoid: ['weighted_strength', 'explosive_power'],
    exercisePoolStatus: 'partial',
    progressionLevels: { beginner: 1, intermediate: 2, advanced: 1, elite: 0 },
    flexibilitySystemIntegrated: true,
    mobilitySystemIntegrated: true,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Requires L-sit mastery as prerequisite',
      'Pancake flexibility essential',
      'Active compression strength focus',
    ],
  },

  i_sit: {
    skill: 'i_sit',
    category: 'compression',
    primary: ['static_skill_density', 'mobility_strength'],
    secondary: ['flexibility_exposure'],
    support: [],
    avoid: ['weighted_strength', 'endurance_density', 'explosive_power'],
    exercisePoolStatus: 'partial',
    progressionLevels: { beginner: 0, intermediate: 1, advanced: 1, elite: 0 },
    flexibilitySystemIntegrated: true,
    mobilitySystemIntegrated: true,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Elite skill requiring V-sit mastery',
      'Full pancake flexibility required',
      'Maximum compression strength',
    ],
  },

  // -------------------------------------------------------------------------
  // FLEXIBILITY SKILLS
  // -------------------------------------------------------------------------
  pancake: {
    skill: 'pancake',
    category: 'flexibility',
    primary: ['flexibility_exposure', 'mobility_strength'],
    secondary: ['static_skill_density'],
    support: [],
    avoid: ['weighted_strength', 'endurance_density', 'explosive_power'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 3, intermediate: 3, advanced: 2, elite: 0 },
    flexibilitySystemIntegrated: true,
    mobilitySystemIntegrated: true,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Full flexibility sequence (15s holds, 3 rounds)',
      'Mobility exercises (loaded pancake, good mornings)',
      'Supports compression skill development',
    ],
  },

  toe_touch: {
    skill: 'toe_touch',
    category: 'flexibility',
    primary: ['flexibility_exposure', 'mobility_strength'],
    secondary: ['static_skill_density'],
    support: [],
    avoid: ['weighted_strength', 'endurance_density', 'explosive_power'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 3, intermediate: 2, advanced: 1, elite: 0 },
    flexibilitySystemIntegrated: true,
    mobilitySystemIntegrated: true,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Full flexibility sequence available',
      'Jefferson curls for mobility work',
      'Foundation for pike compression skills',
    ],
  },

  front_splits: {
    skill: 'front_splits',
    category: 'flexibility',
    primary: ['flexibility_exposure', 'mobility_strength'],
    secondary: [],
    support: [],
    avoid: ['weighted_strength', 'endurance_density', 'explosive_power', 'static_skill_density'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 3, intermediate: 3, advanced: 2, elite: 0 },
    flexibilitySystemIntegrated: true,
    mobilitySystemIntegrated: true,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Full flexibility sequence (hip flexor + hamstring)',
      'Mobility exercises (loaded lunge, split hovers)',
      'PNF contract-relax protocol available',
    ],
  },

  side_splits: {
    skill: 'side_splits',
    category: 'flexibility',
    primary: ['flexibility_exposure', 'mobility_strength'],
    secondary: [],
    support: [],
    avoid: ['weighted_strength', 'endurance_density', 'explosive_power', 'static_skill_density'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 3, intermediate: 3, advanced: 2, elite: 0 },
    flexibilitySystemIntegrated: true,
    mobilitySystemIntegrated: true,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Full flexibility sequence (adductor opening)',
      'Mobility exercises (loaded horse stance, cossacks)',
      'Wall slide progressions available',
    ],
  },

  // -------------------------------------------------------------------------
  // STRENGTH GOALS
  // -------------------------------------------------------------------------
  weighted_pull: {
    skill: 'weighted_pull',
    category: 'strength',
    primary: ['weighted_strength'],
    secondary: ['hybrid_skill_strength', 'hypertrophy_support'],
    support: ['endurance_density'],
    avoid: ['flexibility_exposure', 'recovery_conservative'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 2, intermediate: 3, advanced: 2, elite: 1 },
    flexibilitySystemIntegrated: false,
    mobilitySystemIntegrated: false,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Pull-up → Weighted pull-up progression',
      'Top set + backoff structure supported',
      'RPE-based progressive overload',
    ],
  },

  weighted_dip: {
    skill: 'weighted_dip',
    category: 'strength',
    primary: ['weighted_strength'],
    secondary: ['hybrid_skill_strength', 'hypertrophy_support'],
    support: ['endurance_density'],
    avoid: ['flexibility_exposure', 'recovery_conservative'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 2, intermediate: 3, advanced: 2, elite: 1 },
    flexibilitySystemIntegrated: false,
    mobilitySystemIntegrated: false,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Dip → Weighted dip progression',
      'Top set + backoff structure supported',
      'Ring dip variation available',
    ],
  },

  general_strength: {
    skill: 'general_strength',
    category: 'strength',
    primary: ['weighted_strength', 'hypertrophy_support'],
    secondary: ['endurance_density', 'hybrid_skill_strength'],
    support: [],
    avoid: ['flexibility_exposure', 'static_skill_density'],
    exercisePoolStatus: 'complete',
    progressionLevels: { beginner: 5, intermediate: 6, advanced: 4, elite: 2 },
    flexibilitySystemIntegrated: false,
    mobilitySystemIntegrated: false,
    programBuilderConnected: true,
    fatigueLogicConnected: true,
    validationNotes: [
      'Full compound movement library',
      'Push/pull balance maintained',
      'Accessory support available',
    ],
  },
}

// =============================================================================
// AUDIT FUNCTIONS
// =============================================================================

export interface AuditResult {
  skill: SkillType
  status: 'pass' | 'warning' | 'fail'
  checks: {
    hasPrincipleMapping: boolean
    hasExercisePool: boolean
    hasProgressionLadder: boolean
    flexibilityIntegrated: boolean
    mobilityIntegrated: boolean
    programBuilderConnected: boolean
    fatigueLogicConnected: boolean
  }
  issues: string[]
  recommendations: string[]
}

/**
 * Audit a single skill for complete integration
 */
export function auditSkill(skill: SkillType): AuditResult {
  const matrix = EXTENDED_SKILL_MATRIX[skill]
  const skillMatrix = SKILL_METHOD_MATRIX[skill]
  const issues: string[] = []
  const recommendations: string[] = []

  // Check principle mapping
  const hasPrincipleMapping = !!skillMatrix && skillMatrix.primaryMethods.length > 0
  if (!hasPrincipleMapping) {
    issues.push('Missing principle mapping in SKILL_METHOD_MATRIX')
  }

  // Check exercise pool
  const exerciseCount = countExercisesForSkill(skill)
  const hasExercisePool = exerciseCount.total >= 3
  if (!hasExercisePool) {
    issues.push(`Insufficient exercise pool (${exerciseCount.total} exercises)`)
    recommendations.push('Add more exercises at different difficulty levels')
  }

  // Check progression ladder
  const hasProgressionLadder = matrix.progressionLevels.beginner > 0 && 
    matrix.progressionLevels.intermediate > 0
  if (!hasProgressionLadder) {
    issues.push('Missing progression exercises at beginner/intermediate levels')
  }

  // Check flexibility integration (only for relevant skills)
  const flexibilitySkills: SkillType[] = ['pancake', 'toe_touch', 'front_splits', 'side_splits', 'l_sit', 'v_sit', 'i_sit']
  const needsFlexibility = flexibilitySkills.includes(skill)
  const flexibilityIntegrated = needsFlexibility ? matrix.flexibilitySystemIntegrated : true
  if (needsFlexibility && !flexibilityIntegrated) {
    issues.push('Flexibility system not integrated')
  }

  // Check mobility integration (only for relevant skills)
  const mobilityIntegrated = needsFlexibility ? matrix.mobilitySystemIntegrated : true
  if (needsFlexibility && !mobilityIntegrated) {
    issues.push('Mobility system not integrated')
  }

  // Determine status
  const criticalIssues = issues.filter(i => 
    i.includes('Missing principle mapping') || i.includes('Insufficient exercise pool')
  )
  const status: AuditResult['status'] = 
    criticalIssues.length > 0 ? 'fail' :
    issues.length > 0 ? 'warning' : 'pass'

  return {
    skill,
    status,
    checks: {
      hasPrincipleMapping,
      hasExercisePool,
      hasProgressionLadder,
      flexibilityIntegrated,
      mobilityIntegrated,
      programBuilderConnected: matrix.programBuilderConnected,
      fatigueLogicConnected: matrix.fatigueLogicConnected,
    },
    issues,
    recommendations,
  }
}

/**
 * Count exercises available for a skill
 */
export function countExercisesForSkill(skill: SkillType): {
  total: number
  beginner: number
  intermediate: number
  advanced: number
  elite: number
} {
  const allExercises = [
    ...SKILL_EXERCISES,
    ...STRENGTH_EXERCISES,
    ...FLEXIBILITY_EXERCISES,
    ...ACCESSORY_EXERCISES,
  ]

  const skillExercises = allExercises.filter(e => 
    e.transferTo.includes(skill) || e.progressionLadder === skill
  )

  return {
    total: skillExercises.length,
    beginner: skillExercises.filter(e => e.difficultyLevel === 'beginner').length,
    intermediate: skillExercises.filter(e => e.difficultyLevel === 'intermediate').length,
    advanced: skillExercises.filter(e => e.difficultyLevel === 'advanced').length,
    elite: skillExercises.filter(e => e.difficultyLevel === 'elite').length,
  }
}

/**
 * Run full system audit
 */
export function runFullAudit(): {
  summary: {
    total: number
    passed: number
    warnings: number
    failed: number
  }
  results: AuditResult[]
  systemStatus: 'healthy' | 'issues_found' | 'critical'
} {
  const skills = Object.keys(EXTENDED_SKILL_MATRIX) as SkillType[]
  const results = skills.map(skill => auditSkill(skill))

  const passed = results.filter(r => r.status === 'pass').length
  const warnings = results.filter(r => r.status === 'warning').length
  const failed = results.filter(r => r.status === 'fail').length

  const systemStatus = failed > 0 ? 'critical' :
    warnings > 2 ? 'issues_found' : 'healthy'

  return {
    summary: {
      total: skills.length,
      passed,
      warnings,
      failed,
    },
    results,
    systemStatus,
  }
}

/**
 * Get exercises for a skill grouped by difficulty
 */
export function getSkillExercisesByDifficulty(skill: SkillType): Record<DifficultyLevel, Exercise[]> {
  const allExercises = [
    ...SKILL_EXERCISES,
    ...STRENGTH_EXERCISES,
    ...FLEXIBILITY_EXERCISES,
    ...ACCESSORY_EXERCISES,
  ]

  const skillExercises = allExercises.filter(e => 
    e.transferTo.includes(skill) || e.progressionLadder === skill
  )

  return {
    beginner: skillExercises.filter(e => e.difficultyLevel === 'beginner'),
    intermediate: skillExercises.filter(e => e.difficultyLevel === 'intermediate'),
    advanced: skillExercises.filter(e => e.difficultyLevel === 'advanced'),
    elite: skillExercises.filter(e => e.difficultyLevel === 'elite'),
  }
}

/**
 * Verify flexibility system integration for a skill
 */
export function verifyFlexibilityIntegration(skill: RangeSkill): {
  hasSequence: boolean
  hasMovements: boolean
  follows15sRule: boolean
  has3Rounds: boolean
  sequenceDetails?: FlexibilitySequence
} {
  const sequence = Object.values(FLEXIBILITY_SEQUENCES).find(s => s.skill === skill)
  
  if (!sequence) {
    return {
      hasSequence: false,
      hasMovements: false,
      follows15sRule: false,
      has3Rounds: false,
    }
  }

  const follows15sRule = sequence.movements.every(m => m.holdTime === 15)
  const has3Rounds = sequence.rounds === 3

  return {
    hasSequence: true,
    hasMovements: sequence.movements.length >= 3,
    follows15sRule,
    has3Rounds,
    sequenceDetails: sequence,
  }
}

/**
 * Verify mobility system integration for a skill
 */
export function verifyMobilityIntegration(skill: RangeSkill): {
  hasMobilityExercises: boolean
  exerciseCount: number
  hasLoadedWork: boolean
  hasActiveRange: boolean
  hasEndRangeStrength: boolean
} {
  const mobilityExs = MOBILITY_EXERCISES[skill] || []
  
  const hasLoaded = mobilityExs.some(e => e.type === 'loaded_stretch')
  const hasActive = mobilityExs.some(e => e.type === 'active_range')
  const hasEndRange = mobilityExs.some(e => e.type === 'end_range_strength')

  return {
    hasMobilityExercises: mobilityExs.length > 0,
    exerciseCount: mobilityExs.length,
    hasLoadedWork: hasLoaded,
    hasActiveRange: hasActive,
    hasEndRangeStrength: hasEndRange,
  }
}

/**
 * Get principle rules for a skill (for program builder)
 */
export function getSkillPrincipleRules(skill: SkillType, selectedMethod: MethodProfileId): {
  repRange: { min: number; max: number }
  setRange: { min: number; max: number }
  holdDuration?: { min: number; max: number }
  restTime: { min: number; max: number }
  targetRPE: [number, number]
  failurePolicy: 'never' | 'avoid' | 'occasional' | 'allowed'
  skillFirst: boolean
  densityAllowed: boolean
} {
  const profile = METHOD_PROFILES[selectedMethod]
  const rules = profile.rules

  return {
    repRange: { min: rules.repRangeMin, max: rules.repRangeMax },
    setRange: { min: rules.setRangeMin, max: rules.setRangeMax },
    holdDuration: rules.holdDurationMin !== undefined ? {
      min: rules.holdDurationMin,
      max: rules.holdDurationMax || rules.holdDurationMin,
    } : undefined,
    restTime: { min: rules.restTimeMin, max: rules.restTimeMax },
    targetRPE: rules.targetRPE,
    failurePolicy: rules.failurePolicy,
    skillFirst: rules.skillFirst,
    densityAllowed: rules.densityAllowed,
  }
}

// =============================================================================
// DASHBOARD INTEGRATION HELPERS
// =============================================================================

/**
 * Get short training emphasis message for dashboard
 */
export function getTrainingEmphasisMessage(
  primaryMethod: MethodProfileId,
  skill: SkillType
): string {
  const profile = METHOD_PROFILES[primaryMethod]
  const matrix = EXTENDED_SKILL_MATRIX[skill]

  // Skill-specific messaging
  if (matrix.category === 'flexibility') {
    if (primaryMethod === 'flexibility_exposure') {
      return 'This phase focuses on range development with low soreness.'
    }
    if (primaryMethod === 'mobility_strength') {
      return 'This phase builds strength in deep positions.'
    }
  }

  if (matrix.category === 'static_skill') {
    return 'This phase emphasizes static skill quality and technical freshness.'
  }

  if (matrix.category === 'dynamic_skill') {
    return 'This phase focuses on explosive power and transition technique.'
  }

  if (matrix.category === 'compression') {
    return 'This phase develops compression strength and active flexibility.'
  }

  // Default to method's public label
  return `Your plan is ${profile.publicLabel.toLowerCase()}.`
}

/**
 * Get recovery advice based on principle
 */
export function getRecoveryAdvice(method: MethodProfileId): string {
  const profile = METHOD_PROFILES[method]
  
  if (profile.fatigueCost <= 2) {
    return 'Low fatigue work. Can train frequently.'
  }
  if (profile.fatigueCost === 3) {
    return 'Moderate fatigue. Standard recovery needed.'
  }
  if (profile.fatigueCost >= 4) {
    return 'High neural demand. Ensure adequate rest between sessions.'
  }
  return 'Standard recovery protocols apply.'
}
