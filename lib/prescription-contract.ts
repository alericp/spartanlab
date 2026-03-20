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
