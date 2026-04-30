/**
 * Prescription Contract - TASK 1
 * 
 * Formalizes prescription types for advanced calisthenics programming.
 * This ensures skill holds, weighted strength, and accessory work
 * are prescribed appropriately for the athlete's level.
 * 
 * ENGINE PIPELINE STAGE: Exercise Prescription
 * 
 * This contract is used AFTER exercise selection to determine
 * the appropriate sets, reps/holds, rest, and intensity for each exercise.
 */

// [prescription] ISSUE B: Use shared 1RM math from canonical source
import { estimateOneRepMax } from './strength/one-rep-max'

// =============================================================================
// PRESCRIPTION MODE TYPES
// =============================================================================

/**
 * Canonical prescription modes for different exercise types.
 * Each mode has distinct programming rules and progression logic.
 */
export type PrescriptionMode =
  | 'skill_hold'           // Static skill isometrics (planche, front lever holds)
  | 'skill_cluster'        // Cluster-style skill exposure (multiple short holds with rest)
  | 'weighted_strength'    // Heavy compound strength (weighted pull-ups, weighted dips)
  | 'bodyweight_strength'  // High-rep bodyweight strength (pull-ups, dips, push-ups)
  | 'hypertrophy_support'  // Accessory hypertrophy work (rows, curls, tricep work)
  | 'compression_core'     // Compression and core work (hollow holds, V-sit prep)
  | 'mobility_prep'        // Mobility and prep work (stretches, activation)
  | 'density_block'        // Time-based density/circuit work

/**
 * Intensity model for prescriptions
 */
export type IntensityModel =
  | 'rpe'                  // Rate of Perceived Exertion (1-10)
  | 'percentage_1rm'       // Percentage of 1RM
  | 'rir'                  // Reps in Reserve
  | 'hold_quality'         // Quality-based for isometrics (maintain position)
  | 'time_density'         // Work done in fixed time

// =============================================================================
// PRESCRIPTION CONTRACT
// =============================================================================

/**
 * Full prescription contract for an exercise
 */
export interface PrescriptionContract {
  mode: PrescriptionMode
  sets: {
    min: number
    max: number
    recommended: number
  }
  volume: {
    type: 'reps' | 'hold_seconds' | 'time_block'
    min: number
    max: number
    recommended: number
    unit: string
  }
  rest: {
    min: number
    max: number
    recommended: number
    unit: 'seconds' | 'minutes'
  }
  intensity: {
    model: IntensityModel
    target: number
    range: [number, number]
  }
  progression: {
    primary: 'add_reps' | 'add_hold_time' | 'add_weight' | 'reduce_assistance' | 'progress_variation' | 'increase_density'
    secondary?: 'add_sets' | 'reduce_rest' | 'add_accessory'
    thresholdToProgress: string // Human-readable
  }
  coachingNotes: string[]
}

// =============================================================================
// PRESCRIPTION TEMPLATES BY MODE
// =============================================================================

/**
 * Canonical prescription templates for each mode.
 * These are the baseline contracts adjusted by athlete level and context.
 */
export const PRESCRIPTION_TEMPLATES: Record<PrescriptionMode, PrescriptionContract> = {
  skill_hold: {
    mode: 'skill_hold',
    sets: { min: 3, max: 6, recommended: 4 },
    volume: {
      type: 'hold_seconds',
      min: 5,
      max: 15,
      recommended: 8,
      unit: 's hold',
    },
    rest: { min: 90, max: 180, recommended: 120, unit: 'seconds' },
    intensity: {
      model: 'hold_quality',
      target: 8,
      range: [7, 9],
    },
    progression: {
      primary: 'add_hold_time',
      secondary: 'add_sets',
      thresholdToProgress: 'Hold 10s+ for 3 sets with good form',
    },
    coachingNotes: [
      'Quality over quantity - stop when form breaks',
      'Full rest between sets for neural recovery',
      'Focus on body tension and position',
    ],
  },
  
  skill_cluster: {
    mode: 'skill_cluster',
    sets: { min: 4, max: 8, recommended: 5 },
    volume: {
      type: 'hold_seconds',
      min: 3,
      max: 8,
      recommended: 5,
      unit: 's hold',
    },
    rest: { min: 45, max: 90, recommended: 60, unit: 'seconds' },
    intensity: {
      model: 'hold_quality',
      target: 7,
      range: [6, 8],
    },
    progression: {
      primary: 'add_hold_time',
      secondary: 'reduce_rest',
      thresholdToProgress: 'Complete all cluster sets with consistent form',
    },
    coachingNotes: [
      'Multiple short exposures build neurological patterns',
      'Keep each hold high-quality rather than grinding',
      'Total volume matters more than individual hold length',
    ],
  },
  
  weighted_strength: {
    mode: 'weighted_strength',
    sets: { min: 3, max: 5, recommended: 4 },
    volume: {
      type: 'reps',
      min: 3,
      max: 8,
      recommended: 5,
      unit: 'reps',
    },
    rest: { min: 120, max: 240, recommended: 180, unit: 'seconds' },
    intensity: {
      model: 'rpe',
      target: 8,
      range: [7, 9],
    },
    progression: {
      primary: 'add_weight',
      secondary: 'add_reps',
      thresholdToProgress: 'Complete top of rep range at RPE 7-8',
    },
    coachingNotes: [
      'Focus on strength-building rep ranges',
      'Full recovery between sets for quality',
      'Progress load when all sets complete cleanly',
    ],
  },
  
  bodyweight_strength: {
    mode: 'bodyweight_strength',
    sets: { min: 3, max: 4, recommended: 3 },
    volume: {
      type: 'reps',
      min: 6,
      max: 15,
      recommended: 10,
      unit: 'reps',
    },
    rest: { min: 60, max: 120, recommended: 90, unit: 'seconds' },
    intensity: {
      model: 'rpe',
      target: 7,
      range: [6, 8],
    },
    progression: {
      primary: 'add_reps',
      secondary: 'add_sets',
      thresholdToProgress: 'Hit top of rep range for all sets',
    },
    coachingNotes: [
      'Build work capacity and muscle endurance',
      'Control the tempo on each rep',
      'Progress to harder variations when reps exceed 15',
    ],
  },
  
  hypertrophy_support: {
    mode: 'hypertrophy_support',
    sets: { min: 2, max: 4, recommended: 3 },
    volume: {
      type: 'reps',
      min: 8,
      max: 15,
      recommended: 12,
      unit: 'reps',
    },
    rest: { min: 45, max: 90, recommended: 60, unit: 'seconds' },
    intensity: {
      model: 'rpe',
      target: 7,
      range: [6, 8],
    },
    progression: {
      primary: 'add_reps',
      secondary: 'add_sets',
      thresholdToProgress: 'Complete 15 reps with good form',
    },
    coachingNotes: [
      'Support muscle development for skill work',
      'Focus on mind-muscle connection',
      'Moderate rest keeps metabolic stress up',
    ],
  },
  
  compression_core: {
    mode: 'compression_core',
    sets: { min: 2, max: 4, recommended: 3 },
    volume: {
      type: 'hold_seconds',
      min: 15,
      max: 45,
      recommended: 30,
      unit: 's hold',
    },
    rest: { min: 30, max: 60, recommended: 45, unit: 'seconds' },
    intensity: {
      model: 'hold_quality',
      target: 7,
      range: [6, 8],
    },
    progression: {
      primary: 'add_hold_time',
      secondary: 'progress_variation',
      thresholdToProgress: 'Hold 45s+ with solid compression',
    },
    coachingNotes: [
      'Core compression is foundational for all skills',
      'Maintain posterior pelvic tilt throughout',
      'Progress to harder positions when time exceeds 45s',
    ],
  },
  
  mobility_prep: {
    mode: 'mobility_prep',
    sets: { min: 1, max: 3, recommended: 2 },
    volume: {
      type: 'hold_seconds',
      min: 20,
      max: 60,
      recommended: 30,
      unit: 's hold',
    },
    rest: { min: 0, max: 30, recommended: 15, unit: 'seconds' },
    intensity: {
      model: 'hold_quality',
      target: 5,
      range: [4, 6],
    },
    progression: {
      primary: 'add_hold_time',
      secondary: 'progress_variation',
      thresholdToProgress: 'Comfortable at position for 60s',
    },
    coachingNotes: [
      'Prep work should not be fatiguing',
      'Focus on position and activation',
      'Move slowly and with control',
    ],
  },
  
  density_block: {
    mode: 'density_block',
    sets: { min: 1, max: 3, recommended: 2 },
    volume: {
      type: 'time_block',
      min: 3,
      max: 8,
      recommended: 5,
      unit: 'min block',
    },
    rest: { min: 60, max: 120, recommended: 90, unit: 'seconds' },
    intensity: {
      model: 'time_density',
      target: 7,
      range: [6, 8],
    },
    progression: {
      primary: 'increase_density',
      secondary: 'add_sets',
      thresholdToProgress: 'Complete more reps in same time',
    },
    coachingNotes: [
      'Focus on work density within the block',
      'Manage fatigue to maintain quality',
      'Good for conditioning and work capacity',
    ],
  },
}

// =============================================================================
// PRESCRIPTION MODE DETECTION
// =============================================================================

/**
 * Detect the appropriate prescription mode for an exercise.
 */
export function detectPrescriptionMode(
  category: string,
  isIsometric: boolean,
  neuralDemand: number,
  fatigueCost: number,
  isWeighted: boolean,
  exerciseId?: string
): PrescriptionMode {
  // Skill isometrics (planche, front lever, etc.)
  if (category === 'skill' && isIsometric && neuralDemand >= 4) {
    // Use cluster style for very demanding skills or when building exposure
    if (neuralDemand >= 5) {
      return 'skill_cluster'
    }
    return 'skill_hold'
  }
  
  // Weighted strength work
  if (isWeighted || (category === 'strength' && neuralDemand >= 4)) {
    return 'weighted_strength'
  }
  
  // High-rep bodyweight strength
  if (category === 'strength' && !isWeighted) {
    return 'bodyweight_strength'
  }
  
  // Core and compression work
  if (category === 'core' || exerciseId?.includes('compression') || exerciseId?.includes('hollow')) {
    return 'compression_core'
  }
  
  // Mobility and prep
  if (category === 'mobility' || category === 'warmup' || category === 'cooldown') {
    return 'mobility_prep'
  }
  
  // Default to hypertrophy support for accessories
  return 'hypertrophy_support'
}

// =============================================================================
// PRESCRIPTION RESOLUTION
// =============================================================================

export interface AthleteContext {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  currentProgression?: string
  recentPerformance?: {
    avgRPE?: number
    completionRate?: number
    improving?: boolean
  }
  jointCautions?: string[]
  fatigueState?: 'fresh' | 'moderate' | 'fatigued'
}

/**
 * Resolve a prescription for an exercise based on athlete context.
 * Adjusts the base template for the athlete's level and current state.
 */
export function resolvePrescription(
  mode: PrescriptionMode,
  athleteContext: AthleteContext
): PrescriptionContract {
  const template = { ...PRESCRIPTION_TEMPLATES[mode] }
  
  // Deep clone to avoid mutating the template
  const prescription: PrescriptionContract = {
    ...template,
    sets: { ...template.sets },
    volume: { ...template.volume },
    rest: { ...template.rest },
    intensity: { ...template.intensity },
    progression: { ...template.progression },
    coachingNotes: [...template.coachingNotes],
  }
  
  // Adjust for experience level
  switch (athleteContext.experienceLevel) {
    case 'beginner':
      prescription.sets.recommended = Math.max(prescription.sets.min, prescription.sets.recommended - 1)
      prescription.volume.recommended = Math.max(prescription.volume.min, Math.floor(prescription.volume.recommended * 0.7))
      prescription.rest.recommended = Math.min(prescription.rest.max, Math.floor(prescription.rest.recommended * 1.2))
      prescription.intensity.target = Math.max(prescription.intensity.range[0], prescription.intensity.target - 1)
      break
      
    case 'advanced':
    case 'elite':
      prescription.sets.recommended = Math.min(prescription.sets.max, prescription.sets.recommended + 1)
      prescription.volume.recommended = Math.min(prescription.volume.max, Math.ceil(prescription.volume.recommended * 1.15))
      prescription.rest.recommended = Math.max(prescription.rest.min, Math.floor(prescription.rest.recommended * 0.9))
      break
  }
  
  // Adjust for fatigue state
  if (athleteContext.fatigueState === 'fatigued') {
    prescription.sets.recommended = Math.max(prescription.sets.min, prescription.sets.recommended - 1)
    prescription.intensity.target = Math.max(prescription.intensity.range[0], prescription.intensity.target - 1)
    prescription.rest.recommended = Math.min(prescription.rest.max, Math.floor(prescription.rest.recommended * 1.3))
    prescription.coachingNotes.push('Reduced volume due to accumulated fatigue')
  }
  
  // Adjust for joint cautions
  if (athleteContext.jointCautions?.length) {
    prescription.rest.recommended = Math.min(prescription.rest.max, Math.floor(prescription.rest.recommended * 1.15))
    prescription.coachingNotes.push('Extended rest for joint recovery')
  }
  
  // Adjust based on recent performance
  if (athleteContext.recentPerformance) {
    const { avgRPE, completionRate, improving } = athleteContext.recentPerformance
    
    // If performing well, push slightly
    if (avgRPE && avgRPE <= 6 && completionRate && completionRate >= 95 && improving) {
      prescription.volume.recommended = Math.min(
        prescription.volume.max,
        prescription.volume.recommended + 1
      )
      prescription.coachingNotes.push('Volume slightly increased based on recent performance')
    }
    
    // If struggling, back off
    if (avgRPE && avgRPE >= 9 || (completionRate && completionRate < 70)) {
      prescription.sets.recommended = Math.max(prescription.sets.min, prescription.sets.recommended - 1)
      prescription.volume.recommended = Math.max(
        prescription.volume.min,
        prescription.volume.recommended - 1
      )
      prescription.coachingNotes.push('Volume adjusted based on recent difficulty')
    }
  }
  
  return prescription
}

// =============================================================================
// PRESCRIPTION FORMATTING
// =============================================================================

/**
 * Format a prescription into the repsOrTime string format used by the UI.
 */
export function formatPrescription(prescription: PrescriptionContract): {
  sets: number
  repsOrTime: string
  note?: string
} {
  const { sets, volume, intensity, rest } = prescription
  
  let repsOrTime: string
  
  switch (volume.type) {
    case 'hold_seconds':
      repsOrTime = `${volume.recommended}s hold`
      break
    case 'time_block':
      repsOrTime = `${volume.recommended} min block`
      break
    case 'reps':
    default:
      // For reps, show a range if there's meaningful difference
      if (volume.max - volume.min > 2) {
        repsOrTime = `${volume.min}-${volume.max} reps`
      } else {
        repsOrTime = `${volume.recommended} reps`
      }
      break
  }
  
  // Add intensity context for skill work
  let note: string | undefined
  if (intensity.model === 'rpe') {
    note = `RPE ${intensity.target}`
  } else if (intensity.model === 'hold_quality') {
    note = 'Focus on position quality'
  }
  
  // Add rest note for high-rest prescriptions
  if (rest.recommended >= 120) {
    note = note ? `${note}, ${Math.floor(rest.recommended / 60)}+ min rest` : `${Math.floor(rest.recommended / 60)}+ min rest`
  }
  
  return {
    sets: sets.recommended,
    repsOrTime,
    note,
  }
}

// =============================================================================
// [PRESCRIPTION-INTELLIGENCE] EXERCISE ROLE-AWARE PRESCRIPTION RESOLUTION
// This is the authoritative owner for prescription decisions from canonical truth
// =============================================================================

/**
 * Exercise role for prescription differentiation
 */
export type ExerciseRoleForPrescription = 
  | 'primary_skill_direct'      // Direct skill exposure (planche holds, etc.)
  | 'primary_skill_support'     // Direct support for primary skill
  | 'secondary_skill_exposure'  // Secondary skill work
  | 'strength_foundation'       // Foundational strength building
  | 'carryover_support'         // Carryover strength for skills
  | 'accessory_hypertrophy'     // Accessory/hypertrophy work
  | 'core_compression'          // Core and compression work
  | 'prehab_tissue'             // Prehab/tissue resilience
  | 'density_conditioning'      // Density/conditioning work

/**
 * Canonical truth context for prescription resolution
 * [PRESCRIPTION-INTELLIGENCE] This ensures prescriptions reflect athlete reality
 */
export interface PrescriptionTruthContext extends AthleteContext {
  exerciseRole: ExerciseRoleForPrescription
  sessionArchitecture?: {
    sessionIntent: string
    sessionComplexity: 'minimal' | 'standard' | 'comprehensive'
    dayRole?: string
  }
  currentProgressionContext?: {
    currentProgression: string | null
    historicalCeiling: string | null
    isAtPlateau: boolean
  }
  weeklyContext?: {
    weekNumber: number
    isDeloadWeek: boolean
    volumeAccumulation: 'low' | 'moderate' | 'high'
  }
}

/**
 * [PRESCRIPTION-INTELLIGENCE] Authoritative prescription resolver from canonical truth
 * This function is the single owner for determining sets/reps/holds/rest/intensity
 */
export function resolveCanonicalPrescription(
  mode: PrescriptionMode,
  truthContext: PrescriptionTruthContext
): PrescriptionContract {
  // Start with base resolution
  const prescription = resolvePrescription(mode, truthContext)
  
  // ==========================================================================
  // [PRESCRIPTION-INTELLIGENCE] Apply exercise-role-based adjustments
  // ==========================================================================
  
  switch (truthContext.exerciseRole) {
    case 'primary_skill_direct':
      // Primary skill work gets maximum quality focus
      prescription.sets.recommended = Math.min(prescription.sets.max, prescription.sets.recommended + 1)
      prescription.rest.recommended = Math.max(prescription.rest.recommended, 120) // Ensure adequate rest
      prescription.intensity.target = Math.min(prescription.intensity.range[1], prescription.intensity.target + 1)
      prescription.coachingNotes.push('Primary skill - prioritize quality and full neural recovery')
      break
      
    case 'primary_skill_support':
      // Support for primary skill - moderate intensity, build capacity
      prescription.volume.recommended = Math.min(
        prescription.volume.max,
        Math.ceil(prescription.volume.recommended * 1.1)
      )
      prescription.intensity.target = Math.max(prescription.intensity.range[0], prescription.intensity.target - 1)
      prescription.coachingNotes.push('Supporting primary skill development')
      break
      
    case 'secondary_skill_exposure':
      // Secondary skills get maintenance-level dosage
      prescription.sets.recommended = Math.max(prescription.sets.min, prescription.sets.recommended - 1)
      prescription.rest.recommended = Math.max(prescription.rest.min, Math.floor(prescription.rest.recommended * 0.85))
      prescription.coachingNotes.push('Secondary skill maintenance - quality over volume')
      break
      
    case 'strength_foundation':
      // Foundational strength - moderate-high intensity, controlled volume
      prescription.intensity.target = Math.min(prescription.intensity.range[1], prescription.intensity.target)
      prescription.rest.recommended = Math.max(prescription.rest.recommended, 90)
      prescription.coachingNotes.push('Building strength foundation')
      break
      
    case 'carryover_support':
      // Carryover strength - purposeful, not grinding
      prescription.volume.recommended = Math.min(
        prescription.volume.max - 1,
        prescription.volume.recommended
      )
      prescription.intensity.target = Math.max(prescription.intensity.range[0] + 1, prescription.intensity.target - 1)
      prescription.coachingNotes.push('Strength carryover for skill support')
      break
      
    case 'accessory_hypertrophy':
      // Accessories - higher reps, shorter rest, moderate intensity
      prescription.volume.recommended = Math.min(prescription.volume.max, prescription.volume.recommended + 2)
      prescription.rest.recommended = Math.max(prescription.rest.min, Math.floor(prescription.rest.recommended * 0.7))
      prescription.intensity.target = Math.max(prescription.intensity.range[0], prescription.intensity.target - 1)
      prescription.coachingNotes.push('Accessory work - controlled tempo, mind-muscle connection')
      break
      
    case 'core_compression':
      // Core work - quality holds, not grinding
      prescription.sets.recommended = Math.max(prescription.sets.min, prescription.sets.recommended)
      prescription.intensity.target = Math.min(prescription.intensity.range[1] - 1, prescription.intensity.target)
      prescription.coachingNotes.push('Core compression - maintain position quality')
      break
      
    case 'prehab_tissue':
      // Prehab - low intensity, consistent execution
      prescription.sets.recommended = Math.max(prescription.sets.min, prescription.sets.recommended - 1)
      prescription.intensity.target = Math.max(prescription.intensity.range[0], prescription.intensity.target - 2)
      prescription.rest.recommended = Math.max(prescription.rest.min, Math.floor(prescription.rest.recommended * 0.5))
      prescription.coachingNotes.push('Prehab - consistency over intensity')
      break
      
    case 'density_conditioning':
      // Density work - maintain output, manage fatigue
      prescription.volume.recommended = Math.min(prescription.volume.max, prescription.volume.recommended + 1)
      prescription.rest.recommended = Math.max(prescription.rest.min, Math.floor(prescription.rest.recommended * 0.6))
      prescription.intensity.target = Math.max(prescription.intensity.range[0], prescription.intensity.target - 1)
      prescription.coachingNotes.push('Density conditioning - maintain quality as fatigue builds')
      break
  }
  
  // ==========================================================================
  // [PRESCRIPTION-INTELLIGENCE] Apply session architecture adjustments
  // ==========================================================================
  
  if (truthContext.sessionArchitecture) {
    const { sessionComplexity, dayRole } = truthContext.sessionArchitecture
    
    // Minimal sessions need conservative volume
    if (sessionComplexity === 'minimal') {
      prescription.sets.recommended = Math.max(prescription.sets.min, prescription.sets.recommended - 1)
      prescription.coachingNotes.push('Adjusted for time-efficient session')
    }
    
    // Comprehensive sessions can handle fuller volume
    if (sessionComplexity === 'comprehensive') {
      prescription.sets.recommended = Math.min(prescription.sets.max, prescription.sets.recommended)
    }
    
    // Recovery-focused days get reduced intensity
    if (dayRole?.includes('recovery') || dayRole?.includes('technique')) {
      prescription.intensity.target = Math.max(prescription.intensity.range[0], prescription.intensity.target - 1)
      prescription.coachingNotes.push('Recovery-mindful session')
    }
  }
  
  // ==========================================================================
  // [PRESCRIPTION-INTELLIGENCE] Apply progression context adjustments
  // ==========================================================================
  
  if (truthContext.currentProgressionContext) {
    const { isAtPlateau, currentProgression } = truthContext.currentProgressionContext
    
    // At plateau - slightly reduced volume, maintain intensity
    if (isAtPlateau) {
      prescription.sets.recommended = Math.max(prescription.sets.min, prescription.sets.recommended - 1)
      prescription.coachingNotes.push('At progression plateau - quality over volume')
    }
    
    // Early progression - build volume foundation
    if (currentProgression?.includes('tuck') || currentProgression?.includes('band')) {
      prescription.volume.recommended = Math.min(
        prescription.volume.max,
        Math.ceil(prescription.volume.recommended * 1.1)
      )
    }
  }
  
  // ==========================================================================
  // [PRESCRIPTION-INTELLIGENCE] Apply weekly context adjustments
  // ==========================================================================
  
  if (truthContext.weeklyContext) {
    const { isDeloadWeek, volumeAccumulation } = truthContext.weeklyContext
    
    if (isDeloadWeek) {
      prescription.sets.recommended = Math.max(prescription.sets.min, prescription.sets.recommended - 1)
      prescription.intensity.target = Math.max(prescription.intensity.range[0], prescription.intensity.target - 1)
      prescription.coachingNotes.push('Deload week - reduced volume and intensity')
    }
    
    if (volumeAccumulation === 'high') {
      prescription.rest.recommended = Math.min(
        prescription.rest.max,
        Math.floor(prescription.rest.recommended * 1.15)
      )
    }
  }
  
  return prescription
}

/**
 * [PRESCRIPTION-INTELLIGENCE] Infer exercise role from selection context
 */
export function inferExerciseRole(
  exerciseCategory: string,
  selectionReason: string,
  sessionRole?: string,
  isPrimaryGoalRelated?: boolean
): ExerciseRoleForPrescription {
  const reason = selectionReason.toLowerCase()
  const role = sessionRole?.toLowerCase() || ''
  
  // Direct skill work
  if (exerciseCategory === 'skill' && (reason.includes('primary') || reason.includes('direct'))) {
    return 'primary_skill_direct'
  }
  
  // Secondary skill
  if (exerciseCategory === 'skill' && reason.includes('secondary')) {
    return 'secondary_skill_exposure'
  }
  
  // Primary skill support
  if (isPrimaryGoalRelated && (reason.includes('support') || reason.includes('carryover'))) {
    return 'primary_skill_support'
  }
  
  // Strength foundation
  if (role.includes('strength_primary') || role.includes('strength_foundation')) {
    return 'strength_foundation'
  }
  
  // Carryover support
  if (reason.includes('carryover') || role.includes('strength_support')) {
    return 'carryover_support'
  }
  
  // Core/compression
  if (exerciseCategory === 'core' || reason.includes('compression') || reason.includes('trunk')) {
    return 'core_compression'
  }
  
  // Prehab
  if (exerciseCategory === 'prehab' || reason.includes('prehab') || reason.includes('joint')) {
    return 'prehab_tissue'
  }
  
  // Density/conditioning
  if (reason.includes('density') || reason.includes('conditioning') || reason.includes('finisher')) {
    return 'density_conditioning'
  }
  
  // Default to accessory
  return 'accessory_hypertrophy'
}

// =============================================================================
// WEIGHTED STRENGTH CARRYOVER LOGIC - TASK 3
// =============================================================================

export interface WeightedStrengthContext {
  currentLoad: number        // Current working weight
  prLoad?: number            // Historical PR
  bodyweight?: number        // For BW percentage calculations
  primarySkill: string       // What skill this supports
  strengthType: 'push' | 'pull'
  currentSkillLevel?: string // e.g., 'tuck', 'adv_tuck', 'straddle'
}

/**
 * Calculate appropriate weighted strength prescription based on skill carryover.
 * 
 * TASK 3: Weighted pull-ups/dips should meaningfully support skill development.
 */
export function resolveWeightedStrengthForSkill(
  context: WeightedStrengthContext,
  athleteContext: AthleteContext
): PrescriptionContract & { carryoverNote: string } {
  const basePrescription = resolvePrescription('weighted_strength', athleteContext)
  
  // Calculate appropriate intensity based on current vs PR
  let intensityModifier = 1.0
  let carryoverNote = ''
  
  if (context.prLoad && context.currentLoad) {
    const currentToPRRatio = context.currentLoad / context.prLoad
    
    if (currentToPRRatio < 0.6) {
      // Far below PR - room for strength rebuilding
      intensityModifier = 1.1
      carryoverNote = 'Rebuilding toward previous strength levels. Focus on consistent progression.'
    } else if (currentToPRRatio >= 0.9) {
      // Near PR - maintenance/skill-support mode
      intensityModifier = 0.9
      basePrescription.volume.recommended = Math.max(
        basePrescription.volume.min,
        basePrescription.volume.recommended - 1
      )
      carryoverNote = 'Near peak strength. Maintaining for skill support without excessive fatigue.'
    } else {
      carryoverNote = 'Building toward PR while supporting skill development.'
    }
  }
  
  // Adjust for skill support
  switch (context.primarySkill) {
    case 'planche':
      if (context.strengthType === 'push') {
        carryoverNote += ' Weighted dips build the straight-arm pushing foundation for planche.'
        // Slightly higher volume for planche support
        basePrescription.sets.recommended = Math.min(basePrescription.sets.max, basePrescription.sets.recommended + 1)
      }
      break
      
    case 'front_lever':
      if (context.strengthType === 'pull') {
        carryoverNote += ' Weighted pulls develop the pulling base for front lever progression.'
        // Emphasize strength over volume for lever work
        basePrescription.volume.recommended = Math.min(6, basePrescription.volume.recommended)
        basePrescription.rest.recommended = Math.max(basePrescription.rest.recommended, 150)
      }
      break
      
    case 'muscle_up':
      carryoverNote += ' Building explosive strength foundation for muscle-up transition.'
      // Lower reps, higher quality for explosive carryover
      basePrescription.volume.recommended = Math.min(5, basePrescription.volume.recommended)
      break
  }
  
  // Scale by skill level - harder progressions need more strength support
  if (context.currentSkillLevel) {
    const advancedLevels = ['adv_tuck', 'straddle', 'one_leg', 'full']
    if (advancedLevels.includes(context.currentSkillLevel)) {
      basePrescription.sets.recommended = Math.min(
        basePrescription.sets.max,
        basePrescription.sets.recommended + 1
      )
      carryoverNote += ' Advanced skill level benefits from additional strength volume.'
    }
  }
  
  return {
    ...basePrescription,
    carryoverNote: carryoverNote.trim(),
  }
}

// =============================================================================
// WEEKLY LOAD BALANCING - TASK 4
// =============================================================================

export interface DayLoadProfile {
  dayNumber: number
  neuralLoad: 'high' | 'moderate' | 'low'
  straightArmStress: 'high' | 'moderate' | 'low' | 'none'
  muscularFatigue: 'high' | 'moderate' | 'low'
  focus: 'push_skill' | 'pull_skill' | 'push_strength' | 'pull_strength' | 'mixed' | 'recovery'
}

export interface WeekLoadBalance {
  days: DayLoadProfile[]
  totalNeuralLoad: number
  straightArmDays: number
  hasRecoveryDay: boolean
  balanceIssues: string[]
  suggestions: string[]
}

/**
 * Analyze weekly load distribution for balance issues.
 * 
 * TASK 4: Ensure advanced skill users don't get too many similar hard days.
 */
export function analyzeWeekLoadBalance(days: DayLoadProfile[]): WeekLoadBalance {
  const issues: string[] = []
  const suggestions: string[] = []
  
  let totalNeuralLoad = 0
  let straightArmDays = 0
  let hasRecoveryDay = false
  let consecutiveHighNeural = 0
  let maxConsecutiveHighNeural = 0
  
  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    
    // Count neural load
    if (day.neuralLoad === 'high') {
      totalNeuralLoad += 3
      consecutiveHighNeural++
      maxConsecutiveHighNeural = Math.max(maxConsecutiveHighNeural, consecutiveHighNeural)
    } else if (day.neuralLoad === 'moderate') {
      totalNeuralLoad += 2
      consecutiveHighNeural = 0
    } else {
      totalNeuralLoad += 1
      consecutiveHighNeural = 0
    }
    
    // Count straight-arm stress
    if (day.straightArmStress === 'high' || day.straightArmStress === 'moderate') {
      straightArmDays++
    }
    
    // Check for recovery
    if (day.focus === 'recovery' || day.neuralLoad === 'low') {
      hasRecoveryDay = true
    }
  }
  
  // Check for issues
  if (maxConsecutiveHighNeural > 2) {
    issues.push(`${maxConsecutiveHighNeural} consecutive high-neural days risks CNS fatigue`)
    suggestions.push('Insert a moderate or low day between high-neural sessions')
  }
  
  if (straightArmDays > 3) {
    issues.push(`${straightArmDays} days with straight-arm stress may strain tendons`)
    suggestions.push('Reduce straight-arm work or add more bent-arm emphasis days')
  }
  
  if (!hasRecoveryDay && days.length >= 4) {
    issues.push('No clear recovery day in the week')
    suggestions.push('Consider making one day focused on mobility/support work')
  }
  
  // Check for push/pull balance
  const pushDays = days.filter(d => d.focus.includes('push')).length
  const pullDays = days.filter(d => d.focus.includes('pull')).length
  
  if (Math.abs(pushDays - pullDays) > 2) {
    issues.push(`Push/pull imbalance: ${pushDays} push days vs ${pullDays} pull days`)
    suggestions.push('Balance push and pull emphasis across the week')
  }
  
  return {
    days,
    totalNeuralLoad,
    straightArmDays,
    hasRecoveryDay,
    balanceIssues: issues,
    suggestions,
  }
}

/**
 * Suggest optimal day order to improve recovery balance.
 */
export function suggestOptimalDayOrder(days: DayLoadProfile[]): DayLoadProfile[] {
  // Sort to avoid consecutive high-neural days and spread straight-arm stress
  const sorted = [...days].sort((a, b) => {
    // Prioritize spreading high-neural days
    if (a.neuralLoad === 'high' && b.neuralLoad !== 'high') return -1
    if (b.neuralLoad === 'high' && a.neuralLoad !== 'high') return 1
    
    // Then consider straight-arm stress
    if (a.straightArmStress === 'high' && b.straightArmStress !== 'high') return 1
    if (b.straightArmStress === 'high' && a.straightArmStress !== 'high') return -1
    
    return 0
  })
  
  // Interleave high and moderate days
  const highDays = sorted.filter(d => d.neuralLoad === 'high')
  const otherDays = sorted.filter(d => d.neuralLoad !== 'high')
  
  const result: DayLoadProfile[] = []
  let highIndex = 0
  let otherIndex = 0
  
  while (highIndex < highDays.length || otherIndex < otherDays.length) {
    if (highIndex < highDays.length) {
      result.push(highDays[highIndex++])
    }
    if (otherIndex < otherDays.length) {
      result.push(otherDays[otherIndex++])
    }
  }
  
  // Reassign day numbers
  return result.map((day, index) => ({
    ...day,
    dayNumber: index + 1,
  }))
}

// =============================================================================
// DEV DIAGNOSTICS - TASK 10
// =============================================================================

export interface PrescriptionDiagnostics {
  exerciseId: string
  detectedMode: PrescriptionMode
  resolvedPrescription: {
    sets: number
    volume: string
    rest: string
    intensity: string
  }
  athleteAdjustments: string[]
  carryoverRationale?: string
}

/**
 * Generate diagnostic output for prescription resolution.
 * Only logs in development mode.
 */
export function logPrescriptionDiagnostics(
  diagnostics: PrescriptionDiagnostics
): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[PrescriptionContract] Resolved prescription:', {
    exercise: diagnostics.exerciseId,
    mode: diagnostics.detectedMode,
    prescription: diagnostics.resolvedPrescription,
    adjustments: diagnostics.athleteAdjustments,
    ...(diagnostics.carryoverRationale && { carryover: diagnostics.carryoverRationale }),
  })
}

// =============================================================================
// WEEKLY PROGRESSION LOGIC - TASK 4
// =============================================================================

export type ProgressionPhase = 'accumulation' | 'intensification' | 'realization' | 'deload'

export interface WeeklyProgressionContext {
  weekNumber: number
  totalWeeksInCycle: number
  phase: ProgressionPhase
  primaryGoal: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  recentPerformance?: {
    skillHoldTrend: 'improving' | 'stable' | 'declining'
    strengthTrend: 'improving' | 'stable' | 'declining'
    completionRate: number
    avgRPE: number
  }
}

export interface WeeklyProgressionRecommendation {
  skillVolumeModifier: number       // 0.8 - 1.2 multiplier
  strengthVolumeModifier: number    // 0.8 - 1.2 multiplier
  accessoryVolumeModifier: number   // 0.7 - 1.1 multiplier
  intensityModifier: number         // -1 to +1 RPE adjustment
  restModifier: number              // 0.8 - 1.2 multiplier
  progressionGuidance: string[]
  shouldProgressSkill: boolean
  shouldProgressStrength: boolean
  shouldReduceVolume: boolean
  phaseRationale: string
}

/**
 * Calculate weekly progression recommendations.
 * TASK 4: Provides forward movement logic beyond static programming.
 */
export function getWeeklyProgressionRecommendation(
  context: WeeklyProgressionContext
): WeeklyProgressionRecommendation {
  const { weekNumber, totalWeeksInCycle, phase, experienceLevel, recentPerformance } = context
  
  // Calculate position in cycle (0-1)
  const cycleProgress = Math.min(1, weekNumber / Math.max(1, totalWeeksInCycle))
  
  // Base recommendations by phase
  let skillVolMod = 1.0
  let strengthVolMod = 1.0
  let accessoryVolMod = 1.0
  let intensityMod = 0
  let restMod = 1.0
  const guidance: string[] = []
  let shouldProgressSkill = false
  let shouldProgressStrength = false
  let shouldReduceVolume = false
  let phaseRationale = ''
  
  switch (phase) {
    case 'accumulation':
      // Build volume, moderate intensity
      skillVolMod = 0.9 + (cycleProgress * 0.2) // 0.9 -> 1.1
      strengthVolMod = 1.0 + (cycleProgress * 0.1) // 1.0 -> 1.1
      accessoryVolMod = 1.0
      intensityMod = -1 // Lower intensity, higher volume
      restMod = 0.9 // Shorter rest, higher density
      guidance.push('Build work capacity with controlled intensity')
      guidance.push('Focus on volume accumulation, RPE 6-7')
      shouldProgressSkill = false
      shouldProgressStrength = cycleProgress > 0.5
      phaseRationale = 'Accumulation phase: Building work capacity and skill exposure'
      break
      
    case 'intensification':
      // Reduce volume, increase intensity
      skillVolMod = 1.0
      strengthVolMod = 0.85 // Reduced volume
      accessoryVolMod = 0.8
      intensityMod = 1 // Higher intensity
      restMod = 1.15 // Longer rest for quality
      guidance.push('Increase intensity on primary exercises')
      guidance.push('Quality over quantity - RPE 8-9')
      shouldProgressSkill = cycleProgress > 0.3 && recentPerformance?.skillHoldTrend === 'improving'
      shouldProgressStrength = true
      phaseRationale = 'Intensification phase: Converting volume to strength'
      break
      
    case 'realization':
      // Peak performance window
      skillVolMod = 0.85
      strengthVolMod = 0.75
      accessoryVolMod = 0.6
      intensityMod = 1
      restMod = 1.3 // Full rest for max output
      guidance.push('Peak week - test max holds and heavy singles/doubles')
      guidance.push('Minimal accessory work, focus on primary skills')
      shouldProgressSkill = true
      shouldProgressStrength = true
      phaseRationale = 'Realization phase: Peak performance testing'
      break
      
    case 'deload':
      // Recovery week
      skillVolMod = 0.6
      strengthVolMod = 0.5
      accessoryVolMod = 0.5
      intensityMod = -2
      restMod = 1.0
      shouldReduceVolume = true
      guidance.push('Recovery week - maintain movement patterns at low intensity')
      guidance.push('Focus on mobility and technique refinement')
      phaseRationale = 'Deload phase: Allowing adaptation and recovery'
      break
  }
  
  // Adjust based on recent performance
  if (recentPerformance) {
    // If struggling (high RPE, low completion), back off
    if (recentPerformance.avgRPE > 8.5 || recentPerformance.completionRate < 75) {
      skillVolMod *= 0.9
      strengthVolMod *= 0.9
      intensityMod -= 1
      guidance.push('Reduced volume based on recent difficulty')
      shouldProgressSkill = false
      shouldProgressStrength = false
    }
    
    // If crushing it, push slightly
    if (recentPerformance.avgRPE < 6.5 && recentPerformance.completionRate > 95) {
      skillVolMod = Math.min(1.15, skillVolMod * 1.05)
      strengthVolMod = Math.min(1.15, strengthVolMod * 1.05)
      guidance.push('Slight volume increase based on strong performance')
    }
    
    // Skill-specific adjustments
    if (recentPerformance.skillHoldTrend === 'declining') {
      skillVolMod *= 0.85
      guidance.push('Reducing skill volume to allow recovery')
    }
  }
  
  // Experience level adjustments
  if (experienceLevel === 'beginner') {
    // Beginners: more conservative progression
    skillVolMod = Math.min(1.0, skillVolMod)
    strengthVolMod = Math.min(1.05, strengthVolMod)
    intensityMod = Math.min(0, intensityMod)
    shouldProgressSkill = shouldProgressSkill && recentPerformance?.completionRate !== undefined && recentPerformance.completionRate > 90
  } else if (experienceLevel === 'elite') {
    // Elite: can handle more aggressive loading
    restMod *= 1.1 // More rest for harder work
  }
  
  return {
    skillVolumeModifier: Math.round(skillVolMod * 100) / 100,
    strengthVolumeModifier: Math.round(strengthVolMod * 100) / 100,
    accessoryVolumeModifier: Math.round(accessoryVolMod * 100) / 100,
    intensityModifier: Math.round(intensityMod),
    restModifier: Math.round(restMod * 100) / 100,
    progressionGuidance: guidance,
    shouldProgressSkill,
    shouldProgressStrength,
    shouldReduceVolume,
    phaseRationale,
  }
}

/**
 * Determine current progression phase based on week and performance.
 */
export function determineProgressionPhase(
  weekNumber: number,
  totalWeeksInCycle: number,
  forceDeload: boolean = false
): ProgressionPhase {
  if (forceDeload) return 'deload'
  
  // Standard 4-week mesocycle: accumulate, intensify, realize, deload
  const cycleWeek = ((weekNumber - 1) % totalWeeksInCycle) + 1
  
  if (totalWeeksInCycle <= 4) {
    // 4-week cycle
    if (cycleWeek === 4) return 'deload'
    if (cycleWeek === 3) return 'realization'
    if (cycleWeek === 2) return 'intensification'
    return 'accumulation'
  }
  
  // 6-week cycle
  if (totalWeeksInCycle <= 6) {
    if (cycleWeek === 6) return 'deload'
    if (cycleWeek === 5) return 'realization'
    if (cycleWeek >= 3) return 'intensification'
    return 'accumulation'
  }
  
  // 8-week cycle
  const normalized = cycleWeek / totalWeeksInCycle
  if (normalized > 0.875) return 'deload'
  if (normalized > 0.75) return 'realization'
  if (normalized > 0.4) return 'intensification'
  return 'accumulation'
}

// =============================================================================
// ADVANCED SKILL PRESCRIPTION - TASK 2
// =============================================================================

export interface AdvancedSkillPrescription {
  mode: 'quality_singles' | 'cluster_exposure' | 'max_holds' | 'volume_accumulation'
  setsRange: [number, number]
  holdSecondsRange: [number, number]
  restSeconds: number
  rpe: number
  clusterConfig?: {
    holdsPerCluster: number
    restWithinCluster: number
    restBetweenClusters: number
  }
  coachingNotes: string[]
  progressionThreshold: string
}

/**
 * Get advanced skill prescription based on skill type, level, and progression.
 * TASK 2: Makes skill work feel intentional and appropriately challenging.
 */
export function getAdvancedSkillPrescription(
  skillType: 'planche' | 'front_lever' | 'back_lever' | 'muscle_up' | 'hspu' | 'handstand' | 'l_sit' | 'v_sit',
  progressionLevel: 'beginner' | 'tuck' | 'adv_tuck' | 'straddle' | 'one_leg' | 'half_lay' | 'full',
  athleteLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite',
  weeklyPhase?: ProgressionPhase
): AdvancedSkillPrescription {
  // Base prescription by skill type
  const isStaticHold = ['planche', 'front_lever', 'back_lever', 'l_sit', 'v_sit'].includes(skillType)
  const isDynamic = ['muscle_up', 'hspu'].includes(skillType)
  const isBalance = skillType === 'handstand'
  
  // Determine prescription mode
  let mode: AdvancedSkillPrescription['mode'] = 'cluster_exposure'
  
  // Advanced/elite athletes at harder progressions use quality-focused work
  if ((athleteLevel === 'advanced' || athleteLevel === 'elite') && 
      ['straddle', 'one_leg', 'half_lay', 'full'].includes(progressionLevel)) {
    mode = weeklyPhase === 'realization' ? 'max_holds' : 'quality_singles'
  }
  
  // Accumulation phase always uses cluster for exposure
  if (weeklyPhase === 'accumulation') {
    mode = 'cluster_exposure'
  }
  
  // Beginners always use cluster exposure
  if (athleteLevel === 'beginner' || progressionLevel === 'beginner') {
    mode = 'cluster_exposure'
  }
  
  // Calculate parameters based on mode and skill
  let setsRange: [number, number]
  let holdSecondsRange: [number, number]
  let restSeconds: number
  let rpe: number
  let clusterConfig: AdvancedSkillPrescription['clusterConfig'] | undefined
  const coachingNotes: string[] = []
  let progressionThreshold: string
  
  switch (mode) {
    case 'quality_singles':
      // High quality, moderate volume
      setsRange = [4, 6]
      holdSecondsRange = isStaticHold ? [6, 12] : [1, 3]
      restSeconds = isStaticHold ? 150 : 180
      rpe = 8
      coachingNotes.push('Quality over quantity - stop when position degrades')
      coachingNotes.push('Full neural recovery between sets')
      progressionThreshold = 'Consistent 10s+ holds with clean form for 4+ sets'
      break
      
    case 'max_holds':
      // Peak performance testing
      setsRange = [3, 5]
      holdSecondsRange = isStaticHold ? [8, 20] : [1, 5]
      restSeconds = 180
      rpe = 9
      coachingNotes.push('Max effort - test your limits')
      coachingNotes.push('Full 3+ minute rest between attempts')
      progressionThreshold = 'Hit target time for 3 sets to confirm readiness'
      break
      
    case 'volume_accumulation':
      // Build total time under tension
      setsRange = [5, 8]
      holdSecondsRange = isStaticHold ? [5, 10] : [2, 4]
      restSeconds = 90
      rpe = 7
      coachingNotes.push('Accumulate total hold time')
      coachingNotes.push('Maintain consistent quality across all sets')
      progressionThreshold = 'Total time > 60s across all sets'
      break
      
    case 'cluster_exposure':
    default:
      // Multiple short exposures
      setsRange = [5, 10]
      holdSecondsRange = isStaticHold ? [3, 6] : [1, 2]
      restSeconds = 60
      rpe = 6
      clusterConfig = {
        holdsPerCluster: 3,
        restWithinCluster: 20,
        restBetweenClusters: 90,
      }
      coachingNotes.push('Short, frequent exposures build neural patterns')
      coachingNotes.push('Each hold should feel controlled, not desperate')
      progressionThreshold = 'Complete 8+ quality exposures per session'
      break
  }
  
  // Adjust for skill-specific characteristics
  if (skillType === 'planche') {
    restSeconds = Math.max(restSeconds, 120) // Planche needs more rest
    coachingNotes.push('Maintain protraction and lean angle throughout')
  } else if (skillType === 'front_lever') {
    coachingNotes.push('Scapular depression and full body tension')
  } else if (skillType === 'handstand') {
    // Handstand uses many short attempts
    setsRange = [6, 15]
    holdSecondsRange = [5, 30]
    restSeconds = 30
    coachingNotes.push('Focus on quality of entry and balance corrections')
  } else if (isDynamic) {
    // Dynamic skills count reps, not holds
    holdSecondsRange = [1, 5] // Reps, not seconds
    coachingNotes.push('Control the full movement - no momentum cheating')
  }
  
  // Phase adjustments
  if (weeklyPhase === 'deload') {
    setsRange = [Math.max(2, setsRange[0] - 2), setsRange[1] - 2]
    rpe = Math.max(5, rpe - 2)
    coachingNotes.push('Deload week - maintain pattern, reduce intensity')
  }
  
  return {
    mode,
    setsRange,
    holdSecondsRange,
    restSeconds,
    rpe,
    clusterConfig,
    coachingNotes,
    progressionThreshold,
  }
}

// =============================================================================
// SUPPORT WORK MAPPING - TASK 7
// =============================================================================

export interface SupportWorkMapping {
  exercise: string
  category: 'weighted_strength' | 'bodyweight_strength' | 'hypertrophy' | 'compression' | 'mobility'
  supportsGoals: string[]
  addressesLimiters: string[]
  carryoverRationale: string
  priority: 'essential' | 'recommended' | 'optional'
}

/**
 * Map support work to goals and limiters.
 * TASK 7: Makes support work feel purposeful rather than random.
 */
export function mapSupportToGoalsAndLimiters(
  primaryGoal: string,
  secondaryGoal: string | null,
  limiters: string[],
  hasWeights: boolean
): SupportWorkMapping[] {
  const mappings: SupportWorkMapping[] = []
  
  // Core support mappings by goal
  const goalMappings: Record<string, SupportWorkMapping[]> = {
    planche: [
      {
        exercise: 'weighted_dip',
        category: 'weighted_strength',
        supportsGoals: ['planche'],
        addressesLimiters: ['push_strength', 'straight_arm_push_strength'],
        carryoverRationale: 'Builds pressing foundation for planche lean and support position',
        priority: hasWeights ? 'essential' : 'optional',
      },
      {
        exercise: 'pseudo_planche_pushup',
        category: 'bodyweight_strength',
        supportsGoals: ['planche'],
        addressesLimiters: ['straight_arm_push_strength'],
        carryoverRationale: 'Develops lean angle tolerance and straight-arm pushing',
        priority: 'essential',
      },
      {
        exercise: 'hollow_hold',
        category: 'compression',
        supportsGoals: ['planche', 'front_lever', 'l_sit'],
        addressesLimiters: ['compression'],
        carryoverRationale: 'Core compression is foundational for maintaining planche position',
        priority: 'essential',
      },
    ],
    front_lever: [
      {
        exercise: 'weighted_pull_up',
        category: 'weighted_strength',
        supportsGoals: ['front_lever'],
        addressesLimiters: ['pull_strength', 'straight_arm_pull_strength'],
        carryoverRationale: 'Lat and grip strength transfers to horizontal pulling demands',
        priority: hasWeights ? 'essential' : 'optional',
      },
      {
        exercise: 'front_lever_raise',
        category: 'bodyweight_strength',
        supportsGoals: ['front_lever'],
        addressesLimiters: ['straight_arm_pull_strength'],
        carryoverRationale: 'Builds specific pulling pattern through full range',
        priority: 'essential',
      },
      {
        exercise: 'active_hang',
        category: 'mobility',
        supportsGoals: ['front_lever', 'back_lever'],
        addressesLimiters: ['pull_strength'],
        carryoverRationale: 'Scapular engagement pattern required for lever hold',
        priority: 'recommended',
      },
    ],
    muscle_up: [
      {
        exercise: 'high_pull_up',
        category: 'bodyweight_strength',
        supportsGoals: ['muscle_up'],
        addressesLimiters: ['pull_strength', 'explosive_power'],
        carryoverRationale: 'Explosive pull height enables transition',
        priority: 'essential',
      },
      {
        exercise: 'weighted_pull_up',
        category: 'weighted_strength',
        supportsGoals: ['muscle_up'],
        addressesLimiters: ['pull_strength'],
        carryoverRationale: 'Raw pulling strength creates transition margin',
        priority: hasWeights ? 'essential' : 'optional',
      },
      {
        exercise: 'straight_bar_dip',
        category: 'bodyweight_strength',
        supportsGoals: ['muscle_up'],
        addressesLimiters: ['push_strength'],
        carryoverRationale: 'Develops push-out strength for lockout phase',
        priority: 'essential',
      },
    ],
    l_sit: [
      {
        exercise: 'compression_raises',
        category: 'compression',
        supportsGoals: ['l_sit', 'v_sit'],
        addressesLimiters: ['compression'],
        carryoverRationale: 'Direct compression strength development',
        priority: 'essential',
      },
      {
        exercise: 'pike_stretch',
        category: 'mobility',
        supportsGoals: ['l_sit', 'v_sit', 'pancake'],
        addressesLimiters: ['hamstring_flexibility'],
        carryoverRationale: 'Hamstring flexibility enables higher leg position',
        priority: 'recommended',
      },
    ],
  }
  
  // Add primary goal mappings
  if (goalMappings[primaryGoal]) {
    mappings.push(...goalMappings[primaryGoal])
  }
  
  // Add secondary goal mappings (lower priority)
  if (secondaryGoal && goalMappings[secondaryGoal]) {
    goalMappings[secondaryGoal].forEach(mapping => {
      // Don't duplicate and reduce priority
      if (!mappings.find(m => m.exercise === mapping.exercise)) {
        mappings.push({
          ...mapping,
          priority: mapping.priority === 'essential' ? 'recommended' : 'optional',
        })
      }
    })
  }
  
  // Add limiter-specific support
  if (limiters.includes('compression') && !mappings.find(m => m.exercise === 'hollow_hold')) {
    mappings.push({
      exercise: 'hollow_hold',
      category: 'compression',
      supportsGoals: [],
      addressesLimiters: ['compression'],
      carryoverRationale: 'Addresses identified compression limiter',
      priority: 'essential',
    })
  }
  
  if (limiters.includes('pull_strength') && !mappings.find(m => m.exercise === 'weighted_pull_up')) {
    mappings.push({
      exercise: hasWeights ? 'weighted_pull_up' : 'pull_up',
      category: hasWeights ? 'weighted_strength' : 'bodyweight_strength',
      supportsGoals: [],
      addressesLimiters: ['pull_strength'],
      carryoverRationale: 'Addresses identified pulling strength limiter',
      priority: 'essential',
    })
  }
  
  return mappings
}

/**
 * Log support work mapping decisions.
 */
export function logSupportWorkMapping(
  mappings: SupportWorkMapping[],
  primaryGoal: string,
  limiters: string[]
): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[SupportWorkMapping] Mapping decisions:', {
    primaryGoal,
    topLimiters: limiters.slice(0, 3),
    essentialSupport: mappings.filter(m => m.priority === 'essential').map(m => m.exercise),
    recommendedSupport: mappings.filter(m => m.priority === 'recommended').map(m => m.exercise),
  })
}

// =============================================================================
// DEV LOGGING UTILITIES - TASK 9
// =============================================================================

/**
 * Log weekly progression decision.
 * TASK 9: Dev-safe logging for progression logic.
 */
export function logWeeklyProgressionDecision(
  context: WeeklyProgressionContext,
  recommendation: WeeklyProgressionRecommendation
): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[WeeklyProgression] Decision made:', {
    week: context.weekNumber,
    phase: context.phase,
    primaryGoal: context.primaryGoal,
    skillVolumeModifier: recommendation.skillVolumeModifier,
    strengthVolumeModifier: recommendation.strengthVolumeModifier,
    intensityModifier: recommendation.intensityModifier,
    shouldProgressSkill: recommendation.shouldProgressSkill,
    shouldProgressStrength: recommendation.shouldProgressStrength,
    phaseRationale: recommendation.phaseRationale,
  })
}

/**
 * Log weekly load balance analysis.
 * TASK 9: Dev-safe logging for fatigue distribution.
 */
export function logWeeklyLoadBalance(balance: WeekLoadBalance): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[WeeklyLoadBalance] Analysis:', {
    totalNeuralLoad: balance.totalNeuralLoad,
    straightArmDays: balance.straightArmDays,
    hasRecoveryDay: balance.hasRecoveryDay,
    issueCount: balance.balanceIssues.length,
    issues: balance.balanceIssues,
    suggestions: balance.suggestions,
  })
}

/**
 * Log advanced skill prescription resolution.
 * TASK 9: Dev-safe logging for skill prescription quality.
 */
export function logAdvancedSkillPrescription(
  skillType: string,
  progressionLevel: string,
  prescription: AdvancedSkillPrescription
): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[AdvancedSkillPrescription] Resolved:', {
    skill: skillType,
    progression: progressionLevel,
    mode: prescription.mode,
    sets: `${prescription.setsRange[0]}-${prescription.setsRange[1]}`,
    hold: `${prescription.holdSecondsRange[0]}-${prescription.holdSecondsRange[1]}s`,
    rest: `${prescription.restSeconds}s`,
    rpe: prescription.rpe,
    hasClusterConfig: !!prescription.clusterConfig,
  })
}

// =============================================================================
// WEIGHTED LOAD ESTIMATION (TASK 1-6 of Weighted Load PR)
// =============================================================================

/**
 * Benchmark data for a weighted exercise (e.g., weighted pull-up, weighted dip)
 */
export interface WeightedBenchmark {
  addedWeight: number      // Weight added beyond bodyweight (lbs or kg)
  reps: number             // Reps performed at that weight
  unit?: 'lbs' | 'kg'      // Weight unit, defaults to 'lbs'
}

/**
 * All-time PR benchmark for weighted exercise
 */
export interface WeightedPRBenchmark {
  load: number             // Weight added
  reps: number             // Reps performed
  timeframe?: string       // When achieved (optional context)
  unit: 'lbs' | 'kg'
}

/**
 * Result of weighted load estimation
 */
export interface WeightedLoadPrescription {
  prescribedLoad: number           // Actual weight to use (added weight)
  loadUnit: 'lbs' | 'kg'           // Unit for the load
  loadBasis: 'current_benchmark' | 'pr_reference' | 'estimated' | 'no_data'
  estimated1RM: number | null      // Estimated 1RM for reference
  targetReps: number               // Target reps for this prescription
  targetPercentage: number | null  // % of 1RM being used (null if estimated)
  intensityBand: 'strength' | 'support_volume' | 'hypertrophy'
  confidenceLevel: 'high' | 'moderate' | 'low' | 'none'
  notes: string[]                  // Coaching/context notes
}

/**
 * Prescription mode for weighted exercises
 */
export type WeightedPrescriptionMode = 
  | 'strength_primary'      // Heavy, lower rep for strength gains (3-5 reps)
  | 'strength_support'      // Moderate-heavy, supporting skill development (5-6 reps)
  | 'volume_support'        // Moderate load, higher rep for work capacity (6-10 reps)
  | 'hypertrophy'           // Lighter, high rep for muscle building (10-15 reps)

/**
 * [prescription] SHARED 1RM WRAPPER (ISSUE B - Single Source of Truth)
 * 
 * Uses the canonical Epley formula from lib/strength/one-rep-max.ts
 * No duplicate formula implementation - all 1RM math comes from one source.
 */
function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  // [prescription] Use shared Epley formula from canonical source
  return estimateOneRepMax({ weight, reps })
}

/**
 * Calculate working weight from 1RM at a target percentage
 * [prescription] Rounds to nearest 2.5 lbs for practical loading
 */
function calculateWorkingWeight(e1RM: number, percentage: number): number {
  const weight = e1RM * (percentage / 100)
  // Round to nearest 2.5 for practicality
  return Math.round(weight / 2.5) * 2.5
}

/**
 * Target percentages for different weighted prescription modes
 * Based on standard strength training principles adapted for calisthenics athletes
 */
const WEIGHTED_INTENSITY_BANDS: Record<WeightedPrescriptionMode, {
  percentage: number
  repRange: [number, number]
  intensityBand: WeightedLoadPrescription['intensityBand']
}> = {
  strength_primary: {
    percentage: 85,       // ~85% 1RM
    repRange: [3, 5],
    intensityBand: 'strength',
  },
  strength_support: {
    percentage: 77.5,     // ~77.5% 1RM
    repRange: [5, 6],
    intensityBand: 'strength',
  },
  volume_support: {
    percentage: 70,       // ~70% 1RM
    repRange: [6, 10],
    intensityBand: 'support_volume',
  },
  hypertrophy: {
    percentage: 60,       // ~60% 1RM
    repRange: [10, 15],
    intensityBand: 'hypertrophy',
  },
}

/**
 * Estimate weighted load prescription from benchmark data.
 * 
 * CORE LOGIC (TASK 1):
 * 1. Use current benchmark preferentially (reflects current ability)
 * 2. Estimate 1RM using Epley formula
 * 3. Apply appropriate percentage based on prescription mode
 * 4. Use PR as ceiling/context signal, not direct prescription source
 * 5. Fail gracefully if no data available
 */
export function estimateWeightedLoadPrescription(
  exerciseType: 'weighted_pull_up' | 'weighted_dip' | 'weighted_push_up' | 'weighted_row',
  mode: WeightedPrescriptionMode,
  currentBenchmark?: WeightedBenchmark | null,
  prBenchmark?: WeightedPRBenchmark | null,
): WeightedLoadPrescription {
  const intensityConfig = WEIGHTED_INTENSITY_BANDS[mode]
  const targetReps = Math.round((intensityConfig.repRange[0] + intensityConfig.repRange[1]) / 2)
  const notes: string[] = []
  
  // [prescription] CASE 1: No benchmark data at all
  if (!currentBenchmark && !prBenchmark) {
    console.log(`[prescription] No benchmark data for ${exerciseType}:`, {
      mode,
      fallbackUsed: true,
      intensityBand: intensityConfig.intensityBand,
    })
    return {
      prescribedLoad: 0,
      loadUnit: 'lbs',
      loadBasis: 'no_data',
      estimated1RM: null,
      targetReps,
      targetPercentage: null,
      intensityBand: intensityConfig.intensityBand,
      confidenceLevel: 'none',
      notes: ['No weighted benchmark data available. Start with bodyweight and add load progressively.'],
    }
  }
  
  // Normalize units (convert kg to lbs for internal calculation, then back)
  const normalizeToLbs = (weight: number, unit: 'lbs' | 'kg' = 'lbs'): number => {
    return unit === 'kg' ? weight * 2.205 : weight
  }
  
  const lbsToUnit = (weight: number, targetUnit: 'lbs' | 'kg'): number => {
    return targetUnit === 'kg' ? weight / 2.205 : weight
  }
  
  // Determine output unit (use current benchmark's unit, or PR unit, or default to lbs)
  const outputUnit = currentBenchmark?.unit || prBenchmark?.unit || 'lbs'
  
  // CASE 2: Have current benchmark (preferred)
  if (currentBenchmark && currentBenchmark.addedWeight > 0 && currentBenchmark.reps > 0) {
    const currentLbs = normalizeToLbs(currentBenchmark.addedWeight, currentBenchmark.unit)
    const e1RM = estimate1RM(currentLbs, currentBenchmark.reps)
    const workingWeightLbs = calculateWorkingWeight(e1RM, intensityConfig.percentage)
    const prescribedLoad = Math.round(lbsToUnit(workingWeightLbs, outputUnit) / 2.5) * 2.5
    
    // Check against PR if available (use as ceiling sanity check)
    if (prBenchmark && prBenchmark.load > 0) {
      const prLbs = normalizeToLbs(prBenchmark.load, prBenchmark.unit)
      const prE1RM = estimate1RM(prLbs, prBenchmark.reps)
      
      // If current is significantly below PR, note the rebuilding opportunity
      if (e1RM < prE1RM * 0.7) {
        notes.push('Building back toward previous strength levels')
      }
    }
    
    notes.push(`Based on current ${currentBenchmark.addedWeight}${currentBenchmark.unit || 'lbs'} × ${currentBenchmark.reps}`)
    
    // [prescription] Log with stable prefix for debugging
    console.log(`[prescription] ${exerciseType} load calculated:`, {
      strengthSource: 'current_benchmark',
      input: `${currentBenchmark.addedWeight}${currentBenchmark.unit || 'lbs'} × ${currentBenchmark.reps}`,
      estimated1RM: Math.round(e1RM),
      intensityBand: intensityConfig.intensityBand,
      targetPercentage: intensityConfig.percentage,
      prescribedLoad: `+${prescribedLoad} ${outputUnit}`,
      mode,
    })
    
    return {
      prescribedLoad: Math.max(0, prescribedLoad),
      loadUnit: outputUnit,
      loadBasis: 'current_benchmark',
      estimated1RM: Math.round(lbsToUnit(e1RM, outputUnit)),
      targetReps,
      targetPercentage: intensityConfig.percentage,
      intensityBand: intensityConfig.intensityBand,
      confidenceLevel: 'high',
      notes,
    }
  }
  
  // CASE 3: Have PR but no current benchmark (use PR as reference with caution)
  if (prBenchmark && prBenchmark.load > 0 && prBenchmark.reps > 0) {
    const prLbs = normalizeToLbs(prBenchmark.load, prBenchmark.unit)
    const prE1RM = estimate1RM(prLbs, prBenchmark.reps)
    
    // Use a conservative percentage (70% of PR-based calculation) since athlete may not be at peak
    const conservativeE1RM = prE1RM * 0.7
    const workingWeightLbs = calculateWorkingWeight(conservativeE1RM, intensityConfig.percentage)
    const prescribedLoad = Math.round(lbsToUnit(workingWeightLbs, outputUnit) / 2.5) * 2.5
    
    notes.push('Based on historical PR (using conservative estimate)')
    notes.push(`PR reference: ${prBenchmark.load}${prBenchmark.unit} × ${prBenchmark.reps}`)
    
    // [prescription] Log PR-based prescription with stable prefix
    console.log(`[prescription] ${exerciseType} load from PR:`, {
      strengthSource: 'pr_reference',
      prInput: `${prBenchmark.load}${prBenchmark.unit} × ${prBenchmark.reps}`,
      prE1RM: Math.round(prE1RM),
      conservativeE1RM: Math.round(conservativeE1RM),
      intensityBand: intensityConfig.intensityBand,
      targetPercentage: intensityConfig.percentage,
      prescribedLoad: `+${prescribedLoad} ${outputUnit}`,
      mode,
      confidenceLevel: 'moderate',
    })
    
    return {
      prescribedLoad: Math.max(0, prescribedLoad),
      loadUnit: outputUnit,
      loadBasis: 'pr_reference',
      estimated1RM: Math.round(lbsToUnit(conservativeE1RM, outputUnit)),
      targetReps,
      targetPercentage: intensityConfig.percentage,
      intensityBand: intensityConfig.intensityBand,
      confidenceLevel: 'moderate',
      notes,
    }
  }
  
  // CASE 4: Benchmark exists but with 0 weight (bodyweight baseline)
  notes.push('Start with bodyweight and add load progressively based on RPE')
  
  return {
    prescribedLoad: 0,
    loadUnit: outputUnit,
    loadBasis: 'estimated',
    estimated1RM: null,
    targetReps,
    targetPercentage: null,
    intensityBand: intensityConfig.intensityBand,
    confidenceLevel: 'low',
    notes,
  }
}

/**
 * Determine appropriate weighted prescription mode based on exercise role and goal.
 * 
 * TASK 2 (ISSUE C): Different weighted work needs different load approaches.
 */
export function determineWeightedPrescriptionMode(
  exerciseRole: 'primary_strength' | 'skill_support' | 'accessory' | 'hypertrophy',
  primaryGoal: string,
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
): WeightedPrescriptionMode {
  // Beginners always use volume support (safer, builds base)
  if (experienceLevel === 'beginner') {
    return 'volume_support'
  }
  
  // Primary strength work gets heavier loading
  if (exerciseRole === 'primary_strength') {
    return 'strength_primary'
  }
  
  // Skill support weighted work - moderate-heavy to build carryover
  if (exerciseRole === 'skill_support') {
    // For skill-focused goals, use strength support (moderate-heavy)
    const skillGoals = ['planche', 'front_lever', 'back_lever', 'muscle_up', 'iron_cross']
    if (skillGoals.some(g => primaryGoal.toLowerCase().includes(g))) {
      return 'strength_support'
    }
    return 'volume_support'
  }
  
  // Hypertrophy work
  if (exerciseRole === 'hypertrophy') {
    return 'hypertrophy'
  }
  
  // Default to volume support for general accessory work
  return 'volume_support'
}

/**
 * Format weighted load prescription into display string.
 * Example outputs: "+20 lbs", "+15 kg", "BW (add load progressively)"
 */
export function formatWeightedLoadDisplay(prescription: WeightedLoadPrescription): string {
  if (prescription.loadBasis === 'no_data' || prescription.prescribedLoad <= 0) {
    return 'BW'
  }
  
  // Round to sensible precision
  const displayLoad = Math.round(prescription.prescribedLoad * 2) / 2 // Round to 0.5
  const sign = displayLoad > 0 ? '+' : ''
  
  return `${sign}${displayLoad} ${prescription.loadUnit}`
}

/**
 * Log weighted load estimation for debugging.
 * [prescription] TASK 7: Dev-safe logging with stable prefix.
 */
export function logWeightedLoadEstimation(
  exerciseType: string,
  mode: WeightedPrescriptionMode,
  prescription: WeightedLoadPrescription
): void {
  // [prescription] Use stable prefix for all prescription-related logs
  console.log('[prescription] Load estimation:', {
  exercise: exerciseType,
  mode,
  prescribedLoad: prescription.prescribedLoad > 0 ? `+${prescription.prescribedLoad} ${prescription.loadUnit}` : 'BW',
  basis: prescription.loadBasis,
  confidence: prescription.confidenceLevel,
  estimated1RM: prescription.estimated1RM,
  targetReps: prescription.targetReps,
  targetPercentage: prescription.targetPercentage,
    intensityBand: prescription.intensityBand,
  })
}

// =============================================================================
// DISPLAY PRESCRIPTION MODE (ISSUE C - Truthful UI Labels)
// =============================================================================

/**
 * [prescription-truth] ISSUE C: User-facing prescription mode for exercise display.
 * This is derived from real engine truth, not hardcoded UI heuristics.
 */
export type DisplayPrescriptionMode = 
  | 'bodyweight'           // Bodyweight exercise by design (skills, bodyweight strength)
  | 'weighted'             // Weighted exercise with load prescription
  | 'bodyweight_for_now'   // Could be weighted but no data/equipment yet
  | 'not_loadable'         // Exercise type that cannot use external loading
  | 'load_unavailable'     // Equipment present but strength data missing

/**
 * Display prescription info for UI rendering
 */
export interface DisplayPrescription {
  mode: DisplayPrescriptionMode
  label: string               // Short label for display (e.g., "Bodyweight", "+25 lbs")
  explanation?: string        // Longer explanation if needed
  targetReps?: string         // e.g., "5-8 reps"
  targetRPE?: number          // Target RPE
  restSeconds?: number        // Rest recommendation
  confidenceLevel?: 'high' | 'moderate' | 'low'
}

/**
 * [prescription-truth] ISSUE C: Determine display prescription mode for an exercise.
 * This provides truthful labeling based on actual engine state.
 * 
 * @param exercise - Exercise data with optional prescribedLoad
 * @param hasWeightsEquipment - Whether user has loading equipment
 * @param hasStrengthData - Whether user has entered strength benchmarks
 */
export function getDisplayPrescription(
  exercise: {
    id?: string
    name?: string
    category?: string
    isIsometric?: boolean
    prescribedLoad?: {
      load: number
      unit: 'lbs' | 'kg'
      basis: string
      confidenceLevel?: 'high' | 'moderate' | 'low'
    }
    sets?: number
    repsOrTime?: string
    targetRPE?: number
    restSeconds?: number
  },
  hasWeightsEquipment: boolean = false,
  hasStrengthData: boolean = false
): DisplayPrescription {
  const exerciseId = exercise.id || ''
  const exerciseName = exercise.name || ''
  const category = exercise.category || ''
  const isIsometric = exercise.isIsometric ?? exerciseName.toLowerCase().includes('hold')
  
  // Check if this is a weighted exercise type
  const isWeightedExerciseType = 
    exerciseId.includes('weighted_pull') ||
    exerciseId.includes('weighted_dip') ||
    exerciseId.includes('weighted_push') ||
    exerciseId.includes('weighted_row') ||
    exerciseName.toLowerCase().includes('weighted')
  
  // Check if this is a skill/isometric that cannot be loaded
  const isSkillHold = 
    category === 'skill' ||
    isIsometric ||
    ['planche', 'front_lever', 'l_sit', 'v_sit', 'handstand'].some(s => exerciseId.includes(s))
  
  // Determine mode and label
  let mode: DisplayPrescriptionMode
  let label: string
  let explanation: string | undefined
  
  if (exercise.prescribedLoad && exercise.prescribedLoad.load > 0) {
    // Has actual weighted prescription
    mode = 'weighted'
    label = `+${exercise.prescribedLoad.load} ${exercise.prescribedLoad.unit}`
    explanation = exercise.prescribedLoad.basis === 'current_benchmark' 
      ? 'Based on your current benchmarks'
      : exercise.prescribedLoad.basis === 'pr_reference'
      ? 'Based on your historical PR'
      : 'Estimated load'
  } else if (isSkillHold) {
    // Skill holds cannot be externally loaded
    mode = 'not_loadable'
    label = 'Skill Work'
    explanation = 'Focus on position quality'
  } else if (isWeightedExerciseType) {
    // This is a weighted exercise type but no load prescribed
    if (!hasWeightsEquipment) {
      mode = 'bodyweight_for_now'
      label = 'Bodyweight'
      explanation = 'Add weights in Settings to enable loading'
    } else if (!hasStrengthData) {
      mode = 'load_unavailable'
      label = 'Bodyweight'
      explanation = 'Enter strength benchmarks to get load prescriptions'
    } else {
      // Has equipment and data but still no load - conservative start
      mode = 'bodyweight_for_now'
      label = 'Bodyweight'
      explanation = 'Building baseline before adding load'
    }
  } else {
    // Standard bodyweight exercise
    mode = 'bodyweight'
    label = 'Bodyweight'
  }
  
  // Log for diagnosis
  console.log('[prescription-truth] Display prescription:', {
    exerciseId,
    mode,
    label,
    hasWeightsEquipment,
    hasStrengthData,
    hasPrescribedLoad: !!(exercise.prescribedLoad && exercise.prescribedLoad.load > 0),
  })
  
  return {
    mode,
    label,
    explanation,
    targetReps: exercise.repsOrTime,
    targetRPE: exercise.targetRPE,
    restSeconds: exercise.restSeconds,
    confidenceLevel: exercise.prescribedLoad?.confidenceLevel,
  }
}
