/**
 * Prescription Contract Engine
 * 
 * TASK 1: Formalizes prescription types so the engine stops treating all work similarly.
 * This ensures skill holds don't look like generic accessory work, and weighted strength
 * doesn't look like fluff hypertrophy.
 * 
 * Each prescription mode defines:
 * - Sets, reps/hold targets
 * - Rest guidance
 * - Intensity/RPE target
 * - Progression intent
 */

import type { ExperienceLevel } from './program-service'

// =============================================================================
// PRESCRIPTION MODE TYPES
// =============================================================================

export type PrescriptionMode =
  | 'skill_hold'           // Static skill holds (planche, FL, etc.)
  | 'skill_cluster'        // Repeated quality skill exposures
  | 'weighted_strength'    // Heavy compound weighted work (dips, pull-ups)
  | 'bodyweight_strength'  // High-quality bodyweight strength (archer, etc.)
  | 'hypertrophy_support'  // Moderate intensity, higher volume support
  | 'compression_core'     // Compression and anti-extension work
  | 'mobility_prep'        // Mobility and prep work
  | 'density_block'        // Time-based density work
  | 'explosive_power'      // Power/plyo movements
  | 'recovery_accessory'   // Low-fatigue recovery-friendly work

// =============================================================================
// PRESCRIPTION CONTRACT
// =============================================================================

export interface PrescriptionContract {
  mode: PrescriptionMode
  sets: { min: number; max: number; typical: number }
  reps?: { min: number; max: number; typical: number }
  holdSeconds?: { min: number; max: number; typical: number }
  restSeconds: { min: number; max: number; typical: number }
  rpeTarget: { min: number; max: number }
  progressionIntent: string
  coachingNotes: string
  // Level-aware adjustments
  levelAdjustments: {
    beginner: { setsModifier: number; intensityNote: string }
    intermediate: { setsModifier: number; intensityNote: string }
    advanced: { setsModifier: number; intensityNote: string }
  }
}

// =============================================================================
// PRESCRIPTION CONTRACTS BY MODE
// =============================================================================

export const PRESCRIPTION_CONTRACTS: Record<PrescriptionMode, PrescriptionContract> = {
  skill_hold: {
    mode: 'skill_hold',
    sets: { min: 3, max: 6, typical: 4 },
    holdSeconds: { min: 5, max: 20, typical: 8 },
    restSeconds: { min: 90, max: 180, typical: 120 },
    rpeTarget: { min: 7, max: 9 },
    progressionIntent: 'Build quality time-under-tension. Progress by extending hold or reducing assistance.',
    coachingNotes: 'Focus on position quality, not duration. Stop when form breaks.',
    levelAdjustments: {
      beginner: { setsModifier: 0.75, intensityNote: 'Use band assistance, focus on feeling the position' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Reduce band over time, prioritize clean holds' },
      advanced: { setsModifier: 1.25, intensityNote: 'Cluster sets for volume, chase longer holds or harder progressions' },
    },
  },
  
  skill_cluster: {
    mode: 'skill_cluster',
    sets: { min: 4, max: 8, typical: 5 },
    holdSeconds: { min: 3, max: 8, typical: 5 },
    restSeconds: { min: 45, max: 90, typical: 60 },
    rpeTarget: { min: 6, max: 8 },
    progressionIntent: 'Accumulate high-quality skill exposure with managed fatigue.',
    coachingNotes: 'Short holds, fresh reps. Quality over duration. Great for learning.',
    levelAdjustments: {
      beginner: { setsModifier: 0.8, intensityNote: 'Use easier progression, focus on feeling correct muscles' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Standard cluster approach for skill acquisition' },
      advanced: { setsModifier: 1.2, intensityNote: 'Higher volume clusters or harder progression variants' },
    },
  },
  
  weighted_strength: {
    mode: 'weighted_strength',
    sets: { min: 3, max: 5, typical: 4 },
    reps: { min: 3, max: 8, typical: 5 },
    restSeconds: { min: 120, max: 240, typical: 180 },
    rpeTarget: { min: 7, max: 9 },
    progressionIntent: 'Build absolute strength to support skill goals. Progress by adding weight.',
    coachingNotes: 'Control the eccentric. Full ROM. This builds the strength foundation for skills.',
    levelAdjustments: {
      beginner: { setsModifier: 0.75, intensityNote: 'Lighter loads, master the movement pattern first' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Progressive overload in 5% increments' },
      advanced: { setsModifier: 1.0, intensityNote: 'Heavier loads, longer rest, quality reps only' },
    },
  },
  
  bodyweight_strength: {
    mode: 'bodyweight_strength',
    sets: { min: 3, max: 5, typical: 3 },
    reps: { min: 5, max: 12, typical: 8 },
    restSeconds: { min: 90, max: 150, typical: 120 },
    rpeTarget: { min: 7, max: 8 },
    progressionIntent: 'Build movement-specific strength. Progress by harder variations.',
    coachingNotes: 'Full ROM, controlled tempo. Progress to harder variations when reps feel easy.',
    levelAdjustments: {
      beginner: { setsModifier: 0.8, intensityNote: 'Easier variations, build work capacity' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Challenge variations, moderate volume' },
      advanced: { setsModifier: 1.0, intensityNote: 'Advanced variations, lower reps, higher quality' },
    },
  },
  
  hypertrophy_support: {
    mode: 'hypertrophy_support',
    sets: { min: 2, max: 4, typical: 3 },
    reps: { min: 8, max: 15, typical: 10 },
    restSeconds: { min: 60, max: 120, typical: 90 },
    rpeTarget: { min: 6, max: 8 },
    progressionIntent: 'Build muscle to support skill capacity. Progress by reps then load.',
    coachingNotes: 'Mind-muscle connection. Time under tension matters. Pump is good.',
    levelAdjustments: {
      beginner: { setsModifier: 0.8, intensityNote: 'Learn the movement, build base capacity' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Progressive tension, controlled tempo' },
      advanced: { setsModifier: 1.0, intensityNote: 'Strategic placement to not interfere with skill work' },
    },
  },
  
  compression_core: {
    mode: 'compression_core',
    sets: { min: 2, max: 4, typical: 3 },
    holdSeconds: { min: 15, max: 45, typical: 30 },
    reps: { min: 8, max: 20, typical: 12 },
    restSeconds: { min: 45, max: 90, typical: 60 },
    rpeTarget: { min: 6, max: 8 },
    progressionIntent: 'Build compression strength for V-sit, planche, and lever positions.',
    coachingNotes: 'Hollow body, active compression. Essential for advanced skills.',
    levelAdjustments: {
      beginner: { setsModifier: 0.8, intensityNote: 'Tuck positions, build base compression' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Straddle positions, longer holds' },
      advanced: { setsModifier: 1.0, intensityNote: 'Full positions, add load if needed' },
    },
  },
  
  mobility_prep: {
    mode: 'mobility_prep',
    sets: { min: 1, max: 3, typical: 2 },
    reps: { min: 5, max: 15, typical: 10 },
    holdSeconds: { min: 15, max: 60, typical: 30 },
    restSeconds: { min: 15, max: 45, typical: 30 },
    rpeTarget: { min: 3, max: 6 },
    progressionIntent: 'Prepare tissues and joints for training. Progress by depth.',
    coachingNotes: 'Light effort, prepare the body. Not a workout itself.',
    levelAdjustments: {
      beginner: { setsModifier: 1.0, intensityNote: 'Standard mobility prep' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Standard mobility prep' },
      advanced: { setsModifier: 0.8, intensityNote: 'Efficient prep, knows what body needs' },
    },
  },
  
  density_block: {
    mode: 'density_block',
    sets: { min: 3, max: 5, typical: 4 },
    reps: { min: 5, max: 12, typical: 8 },
    restSeconds: { min: 30, max: 60, typical: 45 },
    rpeTarget: { min: 6, max: 7 },
    progressionIntent: 'Build work capacity and conditioning. Progress by total work done.',
    coachingNotes: 'Keep moving. Manage fatigue across the block. Great for volume accumulation.',
    levelAdjustments: {
      beginner: { setsModifier: 0.7, intensityNote: 'Shorter blocks, easier movements' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Full density blocks' },
      advanced: { setsModifier: 1.0, intensityNote: 'Harder movements in density format' },
    },
  },
  
  explosive_power: {
    mode: 'explosive_power',
    sets: { min: 3, max: 5, typical: 4 },
    reps: { min: 3, max: 6, typical: 4 },
    restSeconds: { min: 120, max: 180, typical: 150 },
    rpeTarget: { min: 7, max: 8 },
    progressionIntent: 'Build explosive power for muscle-ups, transitions. Progress by height/speed.',
    coachingNotes: 'Full recovery between sets. Quality and speed matter, not fatigue.',
    levelAdjustments: {
      beginner: { setsModifier: 0.7, intensityNote: 'Build base, no true plyos yet' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Explosive variations, full rest' },
      advanced: { setsModifier: 1.0, intensityNote: 'High-pull variations, max intent' },
    },
  },
  
  recovery_accessory: {
    mode: 'recovery_accessory',
    sets: { min: 2, max: 3, typical: 2 },
    reps: { min: 10, max: 20, typical: 12 },
    restSeconds: { min: 30, max: 60, typical: 45 },
    rpeTarget: { min: 4, max: 6 },
    progressionIntent: 'Support recovery and blood flow. Not meant to be challenging.',
    coachingNotes: 'Easy effort. Pump and blood flow. Should feel restorative.',
    levelAdjustments: {
      beginner: { setsModifier: 1.0, intensityNote: 'Build movement patterns' },
      intermediate: { setsModifier: 1.0, intensityNote: 'Active recovery, stay loose' },
      advanced: { setsModifier: 0.8, intensityNote: 'Efficient recovery work only' },
    },
  },
}

// =============================================================================
// PRESCRIPTION RESOLVER
// =============================================================================

export interface ResolvedPrescription {
  mode: PrescriptionMode
  sets: number
  repsOrTime: string
  restNote: string
  intensityNote: string
  progressionNote: string
}

/**
 * Resolves a prescription for a given mode and experience level
 */
export function resolvePrescription(
  mode: PrescriptionMode,
  experienceLevel: ExperienceLevel,
  overrides?: {
    sets?: number
    targetHoldSeconds?: number
    targetReps?: number
  }
): ResolvedPrescription {
  const contract = PRESCRIPTION_CONTRACTS[mode]
  const levelAdjustments = contract.levelAdjustments[experienceLevel]
  
  // Calculate sets
  const baseSets = overrides?.sets ?? contract.sets.typical
  const adjustedSets = Math.round(baseSets * levelAdjustments.setsModifier)
  const finalSets = Math.max(contract.sets.min, Math.min(contract.sets.max, adjustedSets))
  
  // Build reps/time string
  let repsOrTime: string
  if (contract.holdSeconds && !contract.reps) {
    // Hold-based
    const hold = overrides?.targetHoldSeconds ?? contract.holdSeconds.typical
    repsOrTime = `${hold}s hold`
  } else if (contract.reps && !contract.holdSeconds) {
    // Rep-based
    const reps = overrides?.targetReps ?? contract.reps.typical
    repsOrTime = `${reps} reps`
  } else if (contract.reps && contract.holdSeconds) {
    // Mixed (e.g., compression can be either)
    if (overrides?.targetHoldSeconds) {
      repsOrTime = `${overrides.targetHoldSeconds}s hold`
    } else {
      const reps = overrides?.targetReps ?? contract.reps.typical
      repsOrTime = `${reps} reps`
    }
  } else {
    repsOrTime = 'as prescribed'
  }
  
  // Build rest note
  const restNote = `${contract.restSeconds.min}-${contract.restSeconds.max}s rest`
  
  return {
    mode,
    sets: finalSets,
    repsOrTime,
    restNote,
    intensityNote: levelAdjustments.intensityNote,
    progressionNote: contract.progressionIntent,
  }
}

// =============================================================================
// EXERCISE TO PRESCRIPTION MODE MAPPING
// =============================================================================

export interface ExercisePrescriptionContext {
  exerciseCategory: string
  isIsometric: boolean
  isSkillWork: boolean
  isWeighted: boolean
  isPrimarySkill: boolean
  isCore: boolean
  isPrehab: boolean
}

/**
 * Determines the appropriate prescription mode for an exercise based on its characteristics
 */
export function determinePrescriptionMode(context: ExercisePrescriptionContext): PrescriptionMode {
  // Skill holds
  if (context.isSkillWork && context.isIsometric && context.isPrimarySkill) {
    return 'skill_hold'
  }
  
  // Skill cluster (dynamic skill work or secondary skill holds)
  if (context.isSkillWork && !context.isIsometric) {
    return 'skill_cluster'
  }
  
  // Weighted strength
  if (context.isWeighted && !context.isSkillWork) {
    return 'weighted_strength'
  }
  
  // Core/compression
  if (context.isCore || context.exerciseCategory === 'core' || context.exerciseCategory === 'compression') {
    return 'compression_core'
  }
  
  // Prehab/mobility
  if (context.isPrehab || context.exerciseCategory === 'mobility' || context.exerciseCategory === 'prehab') {
    return 'mobility_prep'
  }
  
  // Bodyweight strength (default for non-weighted compound work)
  if (!context.isWeighted && ['push', 'pull', 'legs'].includes(context.exerciseCategory)) {
    return 'bodyweight_strength'
  }
  
  // Hypertrophy support (accessories)
  if (context.exerciseCategory === 'accessory') {
    return 'hypertrophy_support'
  }
  
  // Default to bodyweight strength
  return 'bodyweight_strength'
}

// =============================================================================
// SKILL-SPECIFIC PRESCRIPTION PROFILES
// =============================================================================

export interface SkillPrescriptionProfile {
  skillId: string
  defaultMode: PrescriptionMode
  holdTargets: {
    foundational: { min: number; max: number }
    intermediate: { min: number; max: number }
    advanced: { min: number; max: number }
  }
  setsTargets: {
    foundational: number
    intermediate: number
    advanced: number
  }
  clusterApproach: {
    enabled: boolean
    holdSeconds: number
    sets: number
    restSeconds: number
  }
  coachingTip: string
}

/**
 * TASK 2: Skill-specific prescription profiles for advanced calisthenics
 * These ensure planche/FL/HSPU get appropriate prescriptions
 */
export const SKILL_PRESCRIPTION_PROFILES: Record<string, SkillPrescriptionProfile> = {
  planche: {
    skillId: 'planche',
    defaultMode: 'skill_hold',
    holdTargets: {
      foundational: { min: 8, max: 15 },    // Tuck: 8-15s
      intermediate: { min: 6, max: 12 },    // Adv Tuck / Straddle: 6-12s
      advanced: { min: 4, max: 10 },        // Full: 4-10s
    },
    setsTargets: {
      foundational: 4,
      intermediate: 5,
      advanced: 5,
    },
    clusterApproach: {
      enabled: true,
      holdSeconds: 5,
      sets: 6,
      restSeconds: 60,
    },
    coachingTip: 'Quality position over duration. Protract hard, hollow body.',
  },
  
  front_lever: {
    skillId: 'front_lever',
    defaultMode: 'skill_hold',
    holdTargets: {
      foundational: { min: 10, max: 20 },   // Tuck: 10-20s
      intermediate: { min: 6, max: 15 },    // Adv Tuck / Half: 6-15s
      advanced: { min: 4, max: 12 },        // Straddle/Full: 4-12s
    },
    setsTargets: {
      foundational: 4,
      intermediate: 5,
      advanced: 5,
    },
    clusterApproach: {
      enabled: true,
      holdSeconds: 5,
      sets: 6,
      restSeconds: 60,
    },
    coachingTip: 'Depress scaps hard. Straight body line. Feel lats engaged.',
  },
  
  handstand_pushup: {
    skillId: 'handstand_pushup',
    defaultMode: 'skill_cluster',
    holdTargets: {
      foundational: { min: 1, max: 3 },     // Wall HSPU: 1-3 reps
      intermediate: { min: 3, max: 6 },     // Wall HSPU / Deficit: 3-6 reps
      advanced: { min: 3, max: 8 },         // Free HSPU: 3-8 reps
    },
    setsTargets: {
      foundational: 4,
      intermediate: 4,
      advanced: 5,
    },
    clusterApproach: {
      enabled: true,
      holdSeconds: 0, // Rep-based
      sets: 5,
      restSeconds: 90,
    },
    coachingTip: 'Wall HSPU first. Progress depth before going free-standing.',
  },
  
  l_sit: {
    skillId: 'l_sit',
    defaultMode: 'skill_hold',
    holdTargets: {
      foundational: { min: 10, max: 20 },
      intermediate: { min: 15, max: 30 },
      advanced: { min: 20, max: 45 },
    },
    setsTargets: {
      foundational: 3,
      intermediate: 3,
      advanced: 4,
    },
    clusterApproach: {
      enabled: false,
      holdSeconds: 0,
      sets: 0,
      restSeconds: 0,
    },
    coachingTip: 'Push through shoulders. Compress hard. Point toes.',
  },
  
  v_sit: {
    skillId: 'v_sit',
    defaultMode: 'skill_hold',
    holdTargets: {
      foundational: { min: 5, max: 10 },
      intermediate: { min: 8, max: 15 },
      advanced: { min: 10, max: 20 },
    },
    setsTargets: {
      foundational: 3,
      intermediate: 4,
      advanced: 4,
    },
    clusterApproach: {
      enabled: true,
      holdSeconds: 5,
      sets: 5,
      restSeconds: 45,
    },
    coachingTip: 'Build from L-sit. Compression is key. Progress slowly.',
  },
  
  muscle_up: {
    skillId: 'muscle_up',
    defaultMode: 'explosive_power',
    holdTargets: {
      foundational: { min: 1, max: 2 },
      intermediate: { min: 2, max: 4 },
      advanced: { min: 3, max: 6 },
    },
    setsTargets: {
      foundational: 5,
      intermediate: 4,
      advanced: 4,
    },
    clusterApproach: {
      enabled: true,
      holdSeconds: 0, // Rep-based
      sets: 6,
      restSeconds: 90,
    },
    coachingTip: 'Singles until consistent. Full rest between. Power matters.',
  },
  
  back_lever: {
    skillId: 'back_lever',
    defaultMode: 'skill_hold',
    holdTargets: {
      foundational: { min: 10, max: 20 },
      intermediate: { min: 8, max: 15 },
      advanced: { min: 6, max: 12 },
    },
    setsTargets: {
      foundational: 3,
      intermediate: 4,
      advanced: 4,
    },
    clusterApproach: {
      enabled: true,
      holdSeconds: 5,
      sets: 5,
      restSeconds: 60,
    },
    coachingTip: 'Build shoulder extension first. Progress carefully - biceps tendon stress.',
  },
}

/**
 * Get skill-specific prescription based on current progression level
 */
export function getSkillPrescription(
  skillId: string,
  progressionTier: 'foundational' | 'intermediate' | 'advanced',
  useClusterApproach: boolean = false
): ResolvedPrescription {
  const profile = SKILL_PRESCRIPTION_PROFILES[skillId]
  if (!profile) {
    // Default skill hold prescription
    return resolvePrescription('skill_hold', 'intermediate')
  }
  
  const holdTargets = profile.holdTargets[progressionTier]
  const sets = profile.setsTargets[progressionTier]
  
  if (useClusterApproach && profile.clusterApproach.enabled) {
    return {
      mode: 'skill_cluster',
      sets: profile.clusterApproach.sets,
      repsOrTime: profile.clusterApproach.holdSeconds > 0 
        ? `${profile.clusterApproach.holdSeconds}s hold`
        : `${holdTargets.min}-${holdTargets.max} reps`,
      restNote: `${profile.clusterApproach.restSeconds}s rest`,
      intensityNote: profile.coachingTip,
      progressionNote: 'Cluster approach: accumulate quality reps with managed fatigue',
    }
  }
  
  return {
    mode: profile.defaultMode,
    sets,
    repsOrTime: holdTargets.max > 3 
      ? `${holdTargets.min}-${holdTargets.max}s hold`
      : `${holdTargets.min}-${holdTargets.max} reps`,
    restNote: '90-180s rest',
    intensityNote: profile.coachingTip,
    progressionNote: `Build quality at this level before progressing`,
  }
}

// =============================================================================
// WEIGHTED STRENGTH CARRYOVER PROFILES (TASK 3)
// =============================================================================

export interface WeightedStrengthProfile {
  exerciseId: string
  carryoverTo: string[]           // Skills this supports
  prescriptionMode: PrescriptionMode
  loadGuidance: {
    percentOfMax: { min: number; max: number }
    repsAtLoad: { min: number; max: number }
  }
  setGuidance: {
    strength: number              // For strength focus
    support: number               // For skill support
  }
  progressionLogic: string
  coachingNote: string
}

export const WEIGHTED_STRENGTH_PROFILES: Record<string, WeightedStrengthProfile> = {
  weighted_pull_up: {
    exerciseId: 'weighted_pull_up',
    carryoverTo: ['front_lever', 'muscle_up', 'back_lever', 'one_arm_pull_up'],
    prescriptionMode: 'weighted_strength',
    loadGuidance: {
      percentOfMax: { min: 70, max: 85 },
      repsAtLoad: { min: 3, max: 6 },
    },
    setGuidance: {
      strength: 5,
      support: 3,
    },
    progressionLogic: 'Add 2.5-5lbs when all sets hit top of rep range at RPE 7-8',
    coachingNote: 'Full ROM. Control the descent. This is your pulling strength foundation.',
  },
  
  weighted_dip: {
    exerciseId: 'weighted_dip',
    carryoverTo: ['planche', 'handstand_pushup', 'muscle_up'],
    prescriptionMode: 'weighted_strength',
    loadGuidance: {
      percentOfMax: { min: 70, max: 85 },
      repsAtLoad: { min: 4, max: 8 },
    },
    setGuidance: {
      strength: 5,
      support: 3,
    },
    progressionLogic: 'Add 2.5-5lbs when all sets hit top of rep range at RPE 7-8',
    coachingNote: 'Supports planche pressing strength. Full depth if shoulders allow.',
  },
  
  weighted_row: {
    exerciseId: 'weighted_row',
    carryoverTo: ['front_lever', 'back_lever'],
    prescriptionMode: 'weighted_strength',
    loadGuidance: {
      percentOfMax: { min: 65, max: 80 },
      repsAtLoad: { min: 6, max: 10 },
    },
    setGuidance: {
      strength: 4,
      support: 3,
    },
    progressionLogic: 'Progress by increasing ROM (elevation) then load',
    coachingNote: 'Horizontal pulling strength for lever positions.',
  },
  
  weighted_pike_push_up: {
    exerciseId: 'weighted_pike_push_up',
    carryoverTo: ['handstand_pushup', 'planche'],
    prescriptionMode: 'weighted_strength',
    loadGuidance: {
      percentOfMax: { min: 60, max: 75 },
      repsAtLoad: { min: 6, max: 10 },
    },
    setGuidance: {
      strength: 4,
      support: 3,
    },
    progressionLogic: 'Progress elevation before adding weight',
    coachingNote: 'HSPU builder. Shoulders over hands, pike position.',
  },
}

/**
 * TASK 3: Get appropriate weighted strength prescription based on athlete metrics
 */
export function getWeightedStrengthPrescription(
  exerciseId: string,
  currentMaxWeight: number | null,
  targetSkillGoal: string,
  asSupport: boolean = false
): ResolvedPrescription & { loadRecommendation: string } {
  const profile = WEIGHTED_STRENGTH_PROFILES[exerciseId]
  if (!profile) {
    return {
      ...resolvePrescription('weighted_strength', 'intermediate'),
      loadRecommendation: 'Use challenging but manageable weight',
    }
  }
  
  const sets = asSupport ? profile.setGuidance.support : profile.setGuidance.strength
  const { min: minPercent, max: maxPercent } = profile.loadGuidance.percentOfMax
  const { min: minReps, max: maxReps } = profile.loadGuidance.repsAtLoad
  
  let loadRecommendation: string
  if (currentMaxWeight && currentMaxWeight > 0) {
    const minLoad = Math.round(currentMaxWeight * (minPercent / 100))
    const maxLoad = Math.round(currentMaxWeight * (maxPercent / 100))
    loadRecommendation = `${minLoad}-${maxLoad} lbs (${minPercent}-${maxPercent}% of max)`
  } else {
    loadRecommendation = 'Start conservative, build to RPE 7-8'
  }
  
  return {
    mode: profile.prescriptionMode,
    sets,
    repsOrTime: `${minReps}-${maxReps} reps`,
    restNote: '2-4 min rest',
    intensityNote: profile.coachingNote,
    progressionNote: profile.progressionLogic,
    loadRecommendation,
  }
}

// =============================================================================
// DEV DIAGNOSTICS (TASK 10)
// =============================================================================

export function logPrescriptionDiagnostics(
  exerciseId: string,
  mode: PrescriptionMode,
  resolved: ResolvedPrescription
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PrescriptionContract] TASK 10 DIAG:`, {
      exercise: exerciseId,
      mode,
      sets: resolved.sets,
      prescription: resolved.repsOrTime,
      rest: resolved.restNote,
    })
  }
}
