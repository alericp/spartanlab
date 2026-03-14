/**
 * SpartanLab Coaching Intelligence Engine
 * 
 * Central orchestration layer that combines all training principles, progression systems,
 * and adaptive logic into a unified coaching intelligence.
 * 
 * ARCHITECTURE:
 * - Externally: Users see clean, simple workouts
 * - Internally: Elite coaching principles guide every decision
 * - No branded methods, coach names, or athlete names exposed
 * 
 * This engine absorbs proven principles from:
 * - Calisthenics skill coaching
 * - Weighted calisthenics / streetlifting
 * - Straight-arm strength development
 * - Density / endurance training
 * - High-frequency skill practice
 * - Tendon adaptation protocols
 * - Military fitness preparation
 */

import type { PrimaryTrainingOutcome } from './athlete-profile'
import type { PrimaryGoal, ExperienceLevel, SessionLength } from './program-service'

// =============================================================================
// CORE PRINCIPLE TYPES
// =============================================================================

export type PrincipleId =
  | 'skill_first_sequencing'
  | 'straight_arm_development'
  | 'weighted_strength_progression'
  | 'endurance_density_training'
  | 'tendon_adaptation_protocol'
  | 'neural_output_strength'
  | 'progressive_overload_cycles'
  | 'fatigue_budgeting'
  | 'skill_frequency_training'
  | 'ring_progression_systems'
  | 'streetlifting_blocks'
  | 'mixed_goal_balancing'
  | 'quality_set_priority'
  | 'long_rest_strength'
  | 'recovery_aware_programming'

export type PrincipleCategory =
  | 'sequencing'
  | 'skill_development'
  | 'strength'
  | 'endurance'
  | 'safety'
  | 'recovery'
  | 'periodization'

export interface TrainingPrinciple {
  id: PrincipleId
  category: PrincipleCategory
  internalName: string
  effect: string
  // When this principle applies
  applicability: {
    outcomes?: PrimaryTrainingOutcome[]
    goals?: PrimaryGoal[]
    experienceLevels?: ExperienceLevel[]
    sessionLengths?: ('short' | 'medium' | 'long' | 'extended')[]
  }
  // Priority weighting (1-10, higher = more important)
  priorityWeight: number
  // Required readiness conditions
  readinessConditions?: string[]
  // Contraindications / safety limits
  contraindications?: string[]
  // How this affects exercise selection
  exerciseBias?: {
    preferTags?: string[]
    avoidTags?: string[]
    repRangeModifier?: 'lower' | 'higher' | 'neutral'
    restTimeModifier?: 'shorter' | 'longer' | 'neutral'
  }
  // Set/rep recommendations
  setRepGuidelines?: {
    minSets?: number
    maxSets?: number
    minReps?: number
    maxReps?: number
    restSeconds?: [number, number]
  }
  // Session placement rules
  sessionPlacement?: {
    preferEarly?: boolean
    preferLate?: boolean
    afterWarmup?: boolean
    beforeStrength?: boolean
    afterStrength?: boolean
  }
  // Fatigue interaction
  fatigueInteraction?: {
    highNeuralDemand?: boolean
    accumulates?: boolean
    requiresFreshCNS?: boolean
    canStackWith?: PrincipleId[]
    conflictsWith?: PrincipleId[]
  }
}

// =============================================================================
// CORE TRAINING PRINCIPLES
// =============================================================================

export const TRAINING_PRINCIPLES: Record<PrincipleId, TrainingPrinciple> = {
  // -------------------------------------------------------------------------
  // 1. SKILL-FIRST SEQUENCING
  // -------------------------------------------------------------------------
  skill_first_sequencing: {
    id: 'skill_first_sequencing',
    category: 'sequencing',
    internalName: 'Skill-First Sequencing',
    effect: 'Skill work placed before strength work when skill acquisition is the goal. Highest neural-demand movement appears earliest. Skill quality prioritized over volume when fatigue risk is high.',
    applicability: {
      outcomes: ['skills'],
      goals: ['planche', 'front_lever', 'muscle_up', 'handstand_pushup'],
    },
    priorityWeight: 9,
    sessionPlacement: {
      preferEarly: true,
      afterWarmup: true,
      beforeStrength: true,
    },
    fatigueInteraction: {
      highNeuralDemand: true,
      requiresFreshCNS: true,
    },
    exerciseBias: {
      preferTags: ['skill', 'isometric', 'neural'],
      repRangeModifier: 'lower',
      restTimeModifier: 'longer',
    },
  },

  // -------------------------------------------------------------------------
  // 2. STRAIGHT-ARM STRENGTH DEVELOPMENT
  // -------------------------------------------------------------------------
  straight_arm_development: {
    id: 'straight_arm_development',
    category: 'skill_development',
    internalName: 'Straight-Arm Strength Development',
    effect: 'Special progression logic for planche, front lever, iron cross. Slow progression requirements. Support exercises selected for scapular strength, tendon prep, lever control.',
    applicability: {
      goals: ['planche', 'front_lever'],
      experienceLevels: ['intermediate', 'advanced'],
    },
    priorityWeight: 8,
    readinessConditions: [
      'scapular_strength_baseline',
      'connective_tissue_conditioning',
      'shoulder_mobility_adequate',
    ],
    contraindications: [
      'shoulder_injury',
      'elbow_tendinitis',
      'insufficient_foundation',
    ],
    exerciseBias: {
      preferTags: ['straight_arm', 'scapular', 'isometric'],
      avoidTags: ['explosive', 'high_volume'],
      repRangeModifier: 'lower',
      restTimeModifier: 'longer',
    },
    setRepGuidelines: {
      minSets: 3,
      maxSets: 6,
      minReps: 1,
      maxReps: 5,
      restSeconds: [180, 300],
    },
    fatigueInteraction: {
      highNeuralDemand: true,
      requiresFreshCNS: true,
      conflictsWith: ['endurance_density_training'],
    },
  },

  // -------------------------------------------------------------------------
  // 3. WEIGHTED STRENGTH PROGRESSION
  // -------------------------------------------------------------------------
  weighted_strength_progression: {
    id: 'weighted_strength_progression',
    category: 'strength',
    internalName: 'Weighted Strength Progression',
    effect: 'Prioritize lower reps, longer rest, progressive overload. Neural output favored over fatigue when strength is primary. Allows longer session lengths when appropriate.',
    applicability: {
      outcomes: ['strength'],
      goals: ['weighted_strength'],
      experienceLevels: ['intermediate', 'advanced'],
    },
    priorityWeight: 9,
    exerciseBias: {
      preferTags: ['weighted', 'compound', 'strength'],
      avoidTags: ['high_rep', 'density'],
      repRangeModifier: 'lower',
      restTimeModifier: 'longer',
    },
    setRepGuidelines: {
      minSets: 3,
      maxSets: 5,
      minReps: 3,
      maxReps: 6,
      restSeconds: [180, 300],
    },
    fatigueInteraction: {
      highNeuralDemand: true,
      accumulates: true,
      conflictsWith: ['endurance_density_training'],
    },
  },

  // -------------------------------------------------------------------------
  // 4. ENDURANCE/DENSITY TRAINING
  // -------------------------------------------------------------------------
  endurance_density_training: {
    id: 'endurance_density_training',
    category: 'endurance',
    internalName: 'Endurance Density Training',
    effect: 'Density circuits, repeat-effort blocks, interval conditioning. Useful for endurance, military, and mixed conditioning goals. Does not destroy performance for high-skill users unless requested.',
    applicability: {
      outcomes: ['endurance', 'military', 'max_reps'],
    },
    priorityWeight: 7,
    exerciseBias: {
      preferTags: ['bodyweight', 'compound', 'conditioning'],
      avoidTags: ['max_strength', 'heavy'],
      repRangeModifier: 'higher',
      restTimeModifier: 'shorter',
    },
    setRepGuidelines: {
      minSets: 2,
      maxSets: 5,
      minReps: 10,
      maxReps: 25,
      restSeconds: [30, 90],
    },
    sessionPlacement: {
      preferLate: true,
      afterStrength: true,
    },
    fatigueInteraction: {
      accumulates: true,
      conflictsWith: ['straight_arm_development', 'neural_output_strength'],
    },
  },

  // -------------------------------------------------------------------------
  // 5. TENDON ADAPTATION PROTOCOL
  // -------------------------------------------------------------------------
  tendon_adaptation_protocol: {
    id: 'tendon_adaptation_protocol',
    category: 'safety',
    internalName: 'Tendon Adaptation Protocol',
    effect: 'Required gating system for high-risk movements. Controls exposure rate to straight-arm intensity and ring stress. Critical for iron cross, advanced planche, advanced front lever.',
    applicability: {
      goals: ['planche', 'front_lever'],
      experienceLevels: ['intermediate', 'advanced'],
    },
    priorityWeight: 10, // Highest - safety first
    readinessConditions: [
      'minimum_3_months_straight_arm_work',
      'no_current_tendon_issues',
      'gradual_intensity_progression',
    ],
    contraindications: [
      'bicep_tendon_pain',
      'elbow_discomfort',
      'recent_tendon_injury',
    ],
    exerciseBias: {
      avoidTags: ['explosive_straight_arm', 'high_intensity_hold'],
    },
    fatigueInteraction: {
      requiresFreshCNS: true,
    },
  },

  // -------------------------------------------------------------------------
  // 6. NEURAL OUTPUT STRENGTH
  // -------------------------------------------------------------------------
  neural_output_strength: {
    id: 'neural_output_strength',
    category: 'strength',
    internalName: 'Neural Output Strength Training',
    effect: 'When goal is max strength, power, or high-output skill support: lower reps, longer rests, cleaner sequencing, lower junk volume, higher movement quality standards.',
    applicability: {
      outcomes: ['strength', 'skills'],
      experienceLevels: ['intermediate', 'advanced'],
    },
    priorityWeight: 8,
    exerciseBias: {
      preferTags: ['compound', 'neural', 'strength'],
      avoidTags: ['high_rep', 'fatigue'],
      repRangeModifier: 'lower',
      restTimeModifier: 'longer',
    },
    setRepGuidelines: {
      minSets: 3,
      maxSets: 5,
      minReps: 1,
      maxReps: 5,
      restSeconds: [180, 300],
    },
    sessionPlacement: {
      preferEarly: true,
      afterWarmup: true,
    },
    fatigueInteraction: {
      highNeuralDemand: true,
      requiresFreshCNS: true,
    },
  },

  // -------------------------------------------------------------------------
  // 7. PROGRESSIVE OVERLOAD CYCLES
  // -------------------------------------------------------------------------
  progressive_overload_cycles: {
    id: 'progressive_overload_cycles',
    category: 'periodization',
    internalName: 'Progressive Overload Cycles',
    effect: 'Progression includes advancement logic over time. Not just exercise selection but progression direction. Wave loading, deload timing, intensity cycling.',
    applicability: {
      experienceLevels: ['intermediate', 'advanced'],
    },
    priorityWeight: 7,
    fatigueInteraction: {
      accumulates: true,
    },
  },

  // -------------------------------------------------------------------------
  // 8. FATIGUE BUDGETING
  // -------------------------------------------------------------------------
  fatigue_budgeting: {
    id: 'fatigue_budgeting',
    category: 'recovery',
    internalName: 'Fatigue Budget Management',
    effect: 'Total session stress must fit session length, frequency, and goal. Prevent overstuffed sessions. Prevent combining too many high-neural movements in one day.',
    applicability: {},
    priorityWeight: 9,
    fatigueInteraction: {
      accumulates: true,
    },
  },

  // -------------------------------------------------------------------------
  // 9. SKILL FREQUENCY TRAINING
  // -------------------------------------------------------------------------
  skill_frequency_training: {
    id: 'skill_frequency_training',
    category: 'skill_development',
    internalName: 'Skill Frequency Training',
    effect: 'High-frequency low-fatigue exposure for skill patterning. Especially effective for handstand and foundational skill work. Quality over quantity approach.',
    applicability: {
      outcomes: ['skills'],
      goals: ['handstand_pushup'],
    },
    priorityWeight: 7,
    exerciseBias: {
      preferTags: ['skill', 'balance', 'technique'],
      repRangeModifier: 'lower',
    },
    setRepGuidelines: {
      maxSets: 5,
      restSeconds: [60, 120],
    },
    sessionPlacement: {
      preferEarly: true,
      afterWarmup: true,
    },
    fatigueInteraction: {
      highNeuralDemand: true,
      requiresFreshCNS: true,
    },
  },

  // -------------------------------------------------------------------------
  // 10. RING PROGRESSION SYSTEMS
  // -------------------------------------------------------------------------
  ring_progression_systems: {
    id: 'ring_progression_systems',
    category: 'safety',
    internalName: 'Ring Progression Systems',
    effect: 'Special care for instability and connective tissue demand. Emphasis on ring support, transitions, muscle-up prep, iron cross foundation. Conservative progression pace.',
    applicability: {
      goals: ['muscle_up'],
      experienceLevels: ['intermediate', 'advanced'],
    },
    priorityWeight: 8,
    readinessConditions: [
      'ring_support_mastery',
      'shoulder_stability',
      'grip_strength_adequate',
    ],
    contraindications: [
      'shoulder_instability',
      'grip_weakness',
    ],
    exerciseBias: {
      preferTags: ['rings', 'stability', 'support'],
    },
  },

  // -------------------------------------------------------------------------
  // 11. STREETLIFTING STRENGTH BLOCKS
  // -------------------------------------------------------------------------
  streetlifting_blocks: {
    id: 'streetlifting_blocks',
    category: 'strength',
    internalName: 'Streetlifting Strength Blocks',
    effect: 'Weighted dip/pull-up logic for bodyweight-strength athletes. Prioritize measurable overload, recovery windows, and performance repeatability.',
    applicability: {
      outcomes: ['strength'],
      goals: ['weighted_strength'],
      experienceLevels: ['intermediate', 'advanced'],
    },
    priorityWeight: 8,
    exerciseBias: {
      preferTags: ['weighted', 'pull', 'push', 'compound'],
      repRangeModifier: 'lower',
      restTimeModifier: 'longer',
    },
    setRepGuidelines: {
      minSets: 3,
      maxSets: 5,
      minReps: 3,
      maxReps: 8,
      restSeconds: [180, 300],
    },
    fatigueInteraction: {
      highNeuralDemand: true,
      accumulates: true,
    },
  },

  // -------------------------------------------------------------------------
  // 12. MIXED GOAL BALANCING
  // -------------------------------------------------------------------------
  mixed_goal_balancing: {
    id: 'mixed_goal_balancing',
    category: 'periodization',
    internalName: 'Mixed Goal Balancing',
    effect: 'When user has primary + secondary goal, engine intelligently biases volume rather than splitting evenly and diluting progress.',
    applicability: {},
    priorityWeight: 6,
  },

  // -------------------------------------------------------------------------
  // 13. QUALITY SET PRIORITY
  // -------------------------------------------------------------------------
  quality_set_priority: {
    id: 'quality_set_priority',
    category: 'strength',
    internalName: 'Quality Set Priority',
    effect: 'Fewer high-quality sets rather than junk volume. Each set has purpose and appropriate intensity.',
    applicability: {
      outcomes: ['strength', 'skills'],
      experienceLevels: ['intermediate', 'advanced'],
    },
    priorityWeight: 8,
    exerciseBias: {
      avoidTags: ['high_volume', 'burnout'],
      repRangeModifier: 'lower',
    },
    fatigueInteraction: {
      highNeuralDemand: true,
    },
  },

  // -------------------------------------------------------------------------
  // 14. LONG REST STRENGTH
  // -------------------------------------------------------------------------
  long_rest_strength: {
    id: 'long_rest_strength',
    category: 'strength',
    internalName: 'Long Rest Strength Protocol',
    effect: '3-5 minute rest periods for maximum strength output. Full CNS recovery between sets.',
    applicability: {
      outcomes: ['strength'],
      goals: ['weighted_strength'],
    },
    priorityWeight: 7,
    setRepGuidelines: {
      restSeconds: [180, 300],
    },
    fatigueInteraction: {
      requiresFreshCNS: true,
    },
  },

  // -------------------------------------------------------------------------
  // 15. RECOVERY-AWARE PROGRAMMING
  // -------------------------------------------------------------------------
  recovery_aware_programming: {
    id: 'recovery_aware_programming',
    category: 'recovery',
    internalName: 'Recovery-Aware Programming',
    effect: 'Adjust volume and intensity based on recovery signals. Autoregulation within program structure.',
    applicability: {},
    priorityWeight: 8,
    fatigueInteraction: {
      accumulates: true,
    },
  },
}

// =============================================================================
// PRINCIPLE APPLICATION ENGINE
// =============================================================================

export interface PrincipleApplicationContext {
  outcome: PrimaryTrainingOutcome
  goal?: PrimaryGoal
  experienceLevel: ExperienceLevel
  sessionLength: SessionLength
  recoveryScore?: number
  fatigueLevel?: 'low' | 'moderate' | 'high'
  skillGoals?: string[]
  equipmentAvailable?: string[]
}

/**
 * Get all principles that should be applied for a given context
 * Returns sorted by priority weight (highest first)
 */
export function getApplicablePrinciples(context: PrincipleApplicationContext): TrainingPrinciple[] {
  const applicable: TrainingPrinciple[] = []
  
  for (const principle of Object.values(TRAINING_PRINCIPLES)) {
    const { outcomes, goals, experienceLevels } = principle.applicability
    
    // Check if principle applies to this context
    let applies = true
    
    if (outcomes && outcomes.length > 0 && !outcomes.includes(context.outcome)) {
      applies = false
    }
    
    if (applies && goals && goals.length > 0 && context.goal && !goals.includes(context.goal)) {
      applies = false
    }
    
    if (applies && experienceLevels && experienceLevels.length > 0 && !experienceLevels.includes(context.experienceLevel)) {
      applies = false
    }
    
    // Universal principles (no applicability constraints) always apply
    if (!outcomes && !goals && !experienceLevels) {
      applies = true
    }
    
    if (applies) {
      applicable.push(principle)
    }
  }
  
  // Sort by priority weight (highest first)
  return applicable.sort((a, b) => b.priorityWeight - a.priorityWeight)
}

/**
 * Check for principle conflicts and return compatible set
 */
export function resolvePrincipleConflicts(principles: TrainingPrinciple[]): TrainingPrinciple[] {
  const resolved: TrainingPrinciple[] = []
  const excludedIds = new Set<PrincipleId>()
  
  for (const principle of principles) {
    if (excludedIds.has(principle.id)) continue
    
    resolved.push(principle)
    
    // Mark conflicting principles as excluded
    const conflicts = principle.fatigueInteraction?.conflictsWith || []
    for (const conflictId of conflicts) {
      excludedIds.add(conflictId)
    }
  }
  
  return resolved
}

// =============================================================================
// SESSION STRUCTURE INTELLIGENCE
// =============================================================================

export type SessionBlockType =
  | 'warmup'
  | 'mobility_activation'
  | 'skill_balance'
  | 'skill_strength'
  | 'primary_strength'
  | 'secondary_strength'
  | 'accessory'
  | 'conditioning'
  | 'flexibility'
  | 'cooldown'

export interface SessionStructure {
  blockOrder: SessionBlockType[]
  blockDurations: Record<SessionBlockType, number> // minutes
  totalDuration: number
  emphasis: string
  principlesApplied: PrincipleId[]
}

/**
 * Determine optimal session structure based on applied principles
 */
export function determineSessionStructure(
  principles: TrainingPrinciple[],
  sessionLength: SessionLength,
  outcome: PrimaryTrainingOutcome
): SessionStructure {
  const principleIds = principles.map(p => p.id)
  
  // Convert session length to minutes
  const totalMinutes = typeof sessionLength === 'number' 
    ? sessionLength 
    : parseInt(sessionLength.split('-')[0], 10) || 45
  
  // Base structure
  let blockOrder: SessionBlockType[] = ['warmup']
  const blockDurations: Record<SessionBlockType, number> = {
    warmup: 5,
    mobility_activation: 0,
    skill_balance: 0,
    skill_strength: 0,
    primary_strength: 0,
    secondary_strength: 0,
    accessory: 0,
    conditioning: 0,
    flexibility: 0,
    cooldown: 3,
  }
  
  // Apply skill-first sequencing
  if (principleIds.includes('skill_first_sequencing') || principleIds.includes('skill_frequency_training')) {
    if (outcome === 'skills') {
      blockOrder.push('skill_balance', 'skill_strength')
      blockDurations.skill_balance = Math.min(10, totalMinutes * 0.15)
      blockDurations.skill_strength = Math.min(15, totalMinutes * 0.25)
    }
  }
  
  // Apply strength blocks
  if (principleIds.includes('weighted_strength_progression') || principleIds.includes('neural_output_strength')) {
    blockOrder.push('primary_strength')
    blockDurations.primary_strength = Math.min(25, totalMinutes * 0.35)
    
    if (totalMinutes >= 60) {
      blockOrder.push('secondary_strength')
      blockDurations.secondary_strength = Math.min(15, totalMinutes * 0.2)
    }
  } else if (!blockOrder.includes('skill_strength')) {
    blockOrder.push('primary_strength')
    blockDurations.primary_strength = Math.min(20, totalMinutes * 0.3)
  }
  
  // Apply conditioning for endurance/military
  if (principleIds.includes('endurance_density_training')) {
    blockOrder.push('conditioning')
    blockDurations.conditioning = Math.min(15, totalMinutes * 0.25)
  }
  
  // Add accessories if time permits
  const usedTime = Object.values(blockDurations).reduce((a, b) => a + b, 0)
  if (usedTime + 10 <= totalMinutes) {
    blockOrder.push('accessory')
    blockDurations.accessory = Math.min(10, totalMinutes - usedTime - 5)
  }
  
  // Always end with cooldown
  if (!blockOrder.includes('cooldown')) {
    blockOrder.push('cooldown')
  }
  
  // Calculate emphasis based on dominant principles
  let emphasis = 'Balanced training'
  if (principleIds.includes('straight_arm_development')) {
    emphasis = 'Straight-arm skill development'
  } else if (principleIds.includes('weighted_strength_progression')) {
    emphasis = 'Strength-focused'
  } else if (principleIds.includes('endurance_density_training')) {
    emphasis = 'Conditioning and work capacity'
  } else if (principleIds.includes('skill_frequency_training')) {
    emphasis = 'Skill practice and refinement'
  }
  
  return {
    blockOrder,
    blockDurations,
    totalDuration: totalMinutes,
    emphasis,
    principlesApplied: principleIds,
  }
}

// =============================================================================
// READINESS & WEAK POINT ENGINE
// =============================================================================

export interface ReadinessProfile {
  overallReadiness: number // 0-100
  strengthFactors: {
    pullStrength: number
    pushStrength: number
    coreStrength: number
    gripStrength: number
  }
  skillFactors: {
    straightArmExperience: boolean
    ringStability: number
    balanceControl: number
    compressionAbility: number
  }
  recoveryFactors: {
    sleepQuality: number
    muscleRecovery: number
    tendonHealth: number
    mentalReadiness: number
  }
  weakPoints: string[]
  recommendations: string[]
}

/**
 * Analyze user profile and determine readiness for various training approaches
 */
export function analyzeReadinessProfile(profile: {
  experienceLevel: ExperienceLevel
  primaryOutcome: PrimaryTrainingOutcome
  skillGoals?: string[]
  recentWorkouts?: number
  reportedFatigue?: 'low' | 'moderate' | 'high'
  benchmarks?: Record<string, number>
}): ReadinessProfile {
  const weakPoints: string[] = []
  const recommendations: string[] = []
  
  // Base readiness from experience level
  const baseReadiness = {
    beginner: 60,
    intermediate: 75,
    advanced: 85,
  }[profile.experienceLevel] || 70
  
  // Adjust for reported fatigue
  let fatigueAdjustment = 0
  if (profile.reportedFatigue === 'high') {
    fatigueAdjustment = -15
    recommendations.push('Consider a deload or recovery-focused session')
  } else if (profile.reportedFatigue === 'moderate') {
    fatigueAdjustment = -5
  }
  
  // Identify weak points based on goals and benchmarks
  if (profile.skillGoals?.includes('planche') && profile.experienceLevel === 'beginner') {
    weakPoints.push('Scapular protraction strength for planche')
    recommendations.push('Focus on planche lean and pseudo planche push-ups before holds')
  }
  
  if (profile.skillGoals?.includes('front_lever') && profile.experienceLevel === 'beginner') {
    weakPoints.push('Pulling foundation for front lever')
    recommendations.push('Build pull-up strength and lat engagement before lever holds')
  }
  
  if (profile.skillGoals?.includes('iron_cross')) {
    weakPoints.push('Connective tissue conditioning for iron cross')
    recommendations.push('Extensive ring support and straight-arm conditioning required')
  }
  
  return {
    overallReadiness: Math.max(30, Math.min(100, baseReadiness + fatigueAdjustment)),
    strengthFactors: {
      pullStrength: profile.benchmarks?.pullUps ? Math.min(100, profile.benchmarks.pullUps * 5) : 50,
      pushStrength: profile.benchmarks?.pushUps ? Math.min(100, profile.benchmarks.pushUps * 2) : 50,
      coreStrength: profile.benchmarks?.plankSeconds ? Math.min(100, profile.benchmarks.plankSeconds / 1.2) : 50,
      gripStrength: 60, // Default
    },
    skillFactors: {
      straightArmExperience: profile.experienceLevel === 'advanced',
      ringStability: profile.experienceLevel === 'advanced' ? 80 : profile.experienceLevel === 'intermediate' ? 60 : 40,
      balanceControl: 60,
      compressionAbility: profile.benchmarks?.lSitSeconds ? Math.min(100, profile.benchmarks.lSitSeconds * 3) : 40,
    },
    recoveryFactors: {
      sleepQuality: 70,
      muscleRecovery: profile.reportedFatigue === 'low' ? 85 : profile.reportedFatigue === 'high' ? 45 : 65,
      tendonHealth: 75,
      mentalReadiness: 75,
    },
    weakPoints,
    recommendations,
  }
}

// =============================================================================
// PROGRESSION SELECTION ENGINE
// =============================================================================

export interface ProgressionDecision {
  selectedLevel: number
  exerciseRecommendations: string[]
  supportExercises: string[]
  frequencyRecommendation: number // sessions per week
  volumeRecommendation: 'minimal' | 'low' | 'moderate' | 'high'
  intensityRecommendation: 'conservative' | 'moderate' | 'aggressive'
  rationale: string
}

/**
 * Select appropriate progression level based on readiness profile
 */
export function selectProgressionLevel(
  skillKey: string,
  readinessProfile: ReadinessProfile,
  currentLevel?: number
): ProgressionDecision {
  const { overallReadiness, weakPoints, recommendations } = readinessProfile
  
  // Conservative approach for lower readiness
  let intensityRecommendation: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  let volumeRecommendation: 'minimal' | 'low' | 'moderate' | 'high' = 'moderate'
  
  if (overallReadiness < 50) {
    intensityRecommendation = 'conservative'
    volumeRecommendation = 'minimal'
  } else if (overallReadiness < 70) {
    intensityRecommendation = 'conservative'
    volumeRecommendation = 'low'
  } else if (overallReadiness >= 85) {
    intensityRecommendation = 'moderate'
    volumeRecommendation = 'moderate'
  }
  
  // Determine frequency based on skill type
  let frequencyRecommendation = 3
  if (skillKey === 'handstand') {
    frequencyRecommendation = 4 // High frequency for balance skills
  } else if (skillKey === 'iron_cross') {
    frequencyRecommendation = 2 // Low frequency for high-stress skills
  }
  
  // Adjust for recovery
  if (readinessProfile.recoveryFactors.muscleRecovery < 50) {
    frequencyRecommendation = Math.max(2, frequencyRecommendation - 1)
  }
  
  const selectedLevel = currentLevel !== undefined ? currentLevel : 0
  
  return {
    selectedLevel,
    exerciseRecommendations: recommendations,
    supportExercises: weakPoints.length > 0 ? ['Foundation work', 'Mobility prep'] : [],
    frequencyRecommendation,
    volumeRecommendation,
    intensityRecommendation,
    rationale: weakPoints.length > 0 
      ? `Building foundation: ${weakPoints[0]}` 
      : 'Ready for standard progression',
  }
}

// =============================================================================
// MARKETING CAPABILITY PROOF
// =============================================================================

export interface CoachingCapability {
  id: string
  name: string
  description: string
  evidenceInCode: string[]
}

/**
 * Capabilities that the coaching engine actually supports
 * Used to ensure marketing claims match real functionality
 */
export const COACHING_CAPABILITIES: CoachingCapability[] = [
  {
    id: 'adaptive_skill_coaching',
    name: 'Adaptive Skill Coaching',
    description: 'Intelligent skill progression based on readiness assessment',
    evidenceInCode: ['TRAINING_PRINCIPLES', 'analyzeReadinessProfile', 'selectProgressionLevel'],
  },
  {
    id: 'weighted_strength_intelligence',
    name: 'Weighted Strength Intelligence',
    description: 'Smart programming for weighted calisthenics and streetlifting',
    evidenceInCode: ['weighted_strength_progression', 'streetlifting_blocks', 'neural_output_strength'],
  },
  {
    id: 'tendon_safety_system',
    name: 'Tendon Safety System',
    description: 'Conservative progression gates for high-stress movements',
    evidenceInCode: ['tendon_adaptation_protocol', 'IRON_CROSS_READINESS_REQUIREMENTS', 'contraindications'],
  },
  {
    id: 'fatigue_aware_programming',
    name: 'Fatigue-Aware Programming',
    description: 'Automatic volume and intensity adjustment based on recovery',
    evidenceInCode: ['fatigue_budgeting', 'recovery_aware_programming', 'fatigueInteraction'],
  },
  {
    id: 'military_tactical_prep',
    name: 'Military & Tactical Preparation',
    description: 'Branch-specific test preparation with event-targeted programming',
    evidenceInCode: ['military-test-config.ts', 'military-program-builder.ts', 'endurance_density_training'],
  },
  {
    id: 'session_optimization',
    name: 'Session Structure Optimization',
    description: 'Intelligent block ordering based on training principles',
    evidenceInCode: ['determineSessionStructure', 'skill_first_sequencing', 'sessionPlacement'],
  },
]

/**
 * Generate marketing-safe description of engine capabilities
 */
export function generateCapabilityDescription(): string {
  return `SpartanLab's adaptive coaching engine combines modern calisthenics training principles across skill work, strength development, weighted calisthenics, and endurance. Built to adapt like a real coach — not just generate random workouts. Combines skill progression, bodyweight strength, tactical conditioning, and recovery-aware programming in one system.`
}
