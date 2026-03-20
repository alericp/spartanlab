/**
 * PRESCRIPTION CONTRACT
 * 
 * Defines explicit prescription categories for different exercise types
 * so the engine stops treating all work similarly.
 * 
 * TASK 1: Formalize prescription types for high-quality calisthenics programming.
 * 
 * Prescription modes:
 * 1. skill_hold - Static skill holds (planche, front lever)
 * 2. skill_cluster - Repeated skill attempts with full recovery
 * 3. weighted_strength - Heavy loaded work (weighted pulls, dips)
 * 4. bodyweight_strength - Unloaded compound movements
 * 5. hypertrophy_support - Moderate volume accessory work
 * 6. compression_core - Core/compression training
 * 7. mobility_prep - Warmup and prep movements
 * 8. density_block - Circuit/EMOM style conditioning
 */

import type { ExperienceLevel } from './program-service'

// =============================================================================
// PRESCRIPTION MODES
// =============================================================================

export type PrescriptionMode =
  | 'skill_hold'
  | 'skill_cluster'
  | 'weighted_strength'
  | 'bodyweight_strength'
  | 'hypertrophy_support'
  | 'compression_core'
  | 'mobility_prep'
  | 'density_block'

/**
 * Prescription contract defining sets, reps/time, rest, and intensity
 */
export interface PrescriptionContract {
  mode: PrescriptionMode
  sets: { min: number; max: number; typical: number }
  repsOrHold: {
    type: 'reps' | 'hold_seconds' | 'time_under_tension' | 'amrap'
    min: number
    max: number
    typical: number
  }
  restSeconds: { min: number; max: number; typical: number }
  intensity: {
    rpeTarget: number | null        // null if not tracked
    percentMaxHold?: number         // For skill holds
    percentOneRM?: number           // For weighted work
    qualityFocus?: 'maximal' | 'submaximal' | 'technical' | 'fatigue_tolerant'
  }
  progression: {
    primaryDriver: 'hold_time' | 'sets' | 'reps' | 'load' | 'density' | 'difficulty'
    secondaryDriver?: 'hold_time' | 'sets' | 'reps' | 'load' | 'density'
    notes: string
  }
  label: string
  shortLabel: string
}

// =============================================================================
// CANONICAL PRESCRIPTION CONTRACTS
// =============================================================================

export const PRESCRIPTION_CONTRACTS: Record<PrescriptionMode, PrescriptionContract> = {
  skill_hold: {
    mode: 'skill_hold',
    sets: { min: 3, max: 6, typical: 4 },
    repsOrHold: {
      type: 'hold_seconds',
      min: 5,
      max: 15,
      typical: 8,
    },
    restSeconds: { min: 120, max: 180, typical: 150 },
    intensity: {
      rpeTarget: 8,
      percentMaxHold: 70,
      qualityFocus: 'technical',
    },
    progression: {
      primaryDriver: 'hold_time',
      secondaryDriver: 'difficulty',
      notes: 'Progress hold time before advancing progression. Quality over quantity.',
    },
    label: 'Skill Hold Work',
    shortLabel: 'Skill Hold',
  },

  skill_cluster: {
    mode: 'skill_cluster',
    sets: { min: 4, max: 8, typical: 5 },
    repsOrHold: {
      type: 'reps',
      min: 1,
      max: 3,
      typical: 2,
    },
    restSeconds: { min: 90, max: 150, typical: 120 },
    intensity: {
      rpeTarget: 7,
      qualityFocus: 'maximal',
    },
    progression: {
      primaryDriver: 'sets',
      secondaryDriver: 'reps',
      notes: 'Cluster sets allow more quality reps. Add sets before reps.',
    },
    label: 'Skill Cluster Sets',
    shortLabel: 'Cluster',
  },

  weighted_strength: {
    mode: 'weighted_strength',
    sets: { min: 3, max: 5, typical: 4 },
    repsOrHold: {
      type: 'reps',
      min: 3,
      max: 6,
      typical: 5,
    },
    restSeconds: { min: 180, max: 300, typical: 210 },
    intensity: {
      rpeTarget: 8,
      percentOneRM: 80,
      qualityFocus: 'maximal',
    },
    progression: {
      primaryDriver: 'load',
      secondaryDriver: 'reps',
      notes: 'Neural strength work. Add weight before reps. Full recovery required.',
    },
    label: 'Weighted Strength',
    shortLabel: 'Weighted',
  },

  bodyweight_strength: {
    mode: 'bodyweight_strength',
    sets: { min: 3, max: 5, typical: 4 },
    repsOrHold: {
      type: 'reps',
      min: 5,
      max: 12,
      typical: 8,
    },
    restSeconds: { min: 90, max: 150, typical: 120 },
    intensity: {
      rpeTarget: 7,
      qualityFocus: 'submaximal',
    },
    progression: {
      primaryDriver: 'reps',
      secondaryDriver: 'difficulty',
      notes: 'Build strength base. Progress reps then difficulty.',
    },
    label: 'Bodyweight Strength',
    shortLabel: 'BW Strength',
  },

  hypertrophy_support: {
    mode: 'hypertrophy_support',
    sets: { min: 2, max: 4, typical: 3 },
    repsOrHold: {
      type: 'reps',
      min: 8,
      max: 15,
      typical: 12,
    },
    restSeconds: { min: 60, max: 90, typical: 75 },
    intensity: {
      rpeTarget: 7,
      qualityFocus: 'fatigue_tolerant',
    },
    progression: {
      primaryDriver: 'reps',
      secondaryDriver: 'sets',
      notes: 'Metabolic stress focus. Moderate rest, higher reps.',
    },
    label: 'Hypertrophy Support',
    shortLabel: 'Hypertrophy',
  },

  compression_core: {
    mode: 'compression_core',
    sets: { min: 2, max: 4, typical: 3 },
    repsOrHold: {
      type: 'time_under_tension',
      min: 15,
      max: 45,
      typical: 30,
    },
    restSeconds: { min: 45, max: 90, typical: 60 },
    intensity: {
      rpeTarget: 7,
      qualityFocus: 'technical',
    },
    progression: {
      primaryDriver: 'hold_time',
      secondaryDriver: 'difficulty',
      notes: 'Core endurance and compression. Progress time then difficulty.',
    },
    label: 'Core & Compression',
    shortLabel: 'Core',
  },

  mobility_prep: {
    mode: 'mobility_prep',
    sets: { min: 1, max: 2, typical: 1 },
    repsOrHold: {
      type: 'reps',
      min: 8,
      max: 15,
      typical: 10,
    },
    restSeconds: { min: 0, max: 30, typical: 15 },
    intensity: {
      rpeTarget: null,
      qualityFocus: 'technical',
    },
    progression: {
      primaryDriver: 'density',
      notes: 'Movement prep. Flow between exercises. Quality over quantity.',
    },
    label: 'Mobility Prep',
    shortLabel: 'Prep',
  },

  density_block: {
    mode: 'density_block',
    sets: { min: 2, max: 4, typical: 3 },
    repsOrHold: {
      type: 'amrap',
      min: 20,
      max: 60,
      typical: 30,
    },
    restSeconds: { min: 30, max: 60, typical: 45 },
    intensity: {
      rpeTarget: 6,
      qualityFocus: 'fatigue_tolerant',
    },
    progression: {
      primaryDriver: 'density',
      secondaryDriver: 'reps',
      notes: 'Work capacity focus. More work in same time.',
    },
    label: 'Density Block',
    shortLabel: 'Density',
  },
}

// =============================================================================
// PRESCRIPTION MODE DETECTION
// =============================================================================

/**
 * Detect prescription mode from exercise characteristics
 */
export function detectPrescriptionMode(
  exerciseId: string,
  exerciseName: string,
  category: string,
  isWeighted: boolean,
  isSkillHold: boolean,
  isCore: boolean,
  isWarmup: boolean
): PrescriptionMode {
  // Skill holds (planche, front lever, etc.)
  if (isSkillHold || SKILL_HOLD_KEYWORDS.some(kw => exerciseName.toLowerCase().includes(kw))) {
    return 'skill_hold'
  }
  
  // Weighted strength work
  if (isWeighted || WEIGHTED_KEYWORDS.some(kw => exerciseName.toLowerCase().includes(kw))) {
    return 'weighted_strength'
  }
  
  // Core/compression work
  if (isCore || category === 'core' || CORE_KEYWORDS.some(kw => exerciseName.toLowerCase().includes(kw))) {
    return 'compression_core'
  }
  
  // Warmup/prep work
  if (isWarmup || category === 'warmup' || category === 'mobility') {
    return 'mobility_prep'
  }
  
  // Skill cluster for dynamic skill work (muscle-ups, etc.)
  if (SKILL_CLUSTER_KEYWORDS.some(kw => exerciseName.toLowerCase().includes(kw))) {
    return 'skill_cluster'
  }
  
  // Accessory/support work
  if (category === 'accessory' || HYPERTROPHY_KEYWORDS.some(kw => exerciseName.toLowerCase().includes(kw))) {
    return 'hypertrophy_support'
  }
  
  // Default to bodyweight strength for main movements
  return 'bodyweight_strength'
}

const SKILL_HOLD_KEYWORDS = ['hold', 'lever', 'planche', 'l-sit', 'v-sit', 'manna', 'straddle', 'tuck']
const WEIGHTED_KEYWORDS = ['weighted', '+kg', '+lbs', 'added weight']
const CORE_KEYWORDS = ['hollow', 'compression', 'pike', 'dragon flag', 'ab wheel', 'l-sit']
const SKILL_CLUSTER_KEYWORDS = ['muscle-up', 'muscle up', 'hspu', 'handstand push']
const HYPERTROPHY_KEYWORDS = ['curl', 'extension', 'raise', 'fly', 'face pull']

// =============================================================================
// PRESCRIPTION GENERATION
// =============================================================================

/**
 * Generate prescription based on mode and athlete level
 */
export function generatePrescription(
  mode: PrescriptionMode,
  experienceLevel: ExperienceLevel,
  currentProgression?: string,
  fatigueLevel?: 'low' | 'moderate' | 'high'
): {
  sets: number
  repsOrTime: string
  rest: string
  notes: string
  mode: PrescriptionMode
} {
  const contract = PRESCRIPTION_CONTRACTS[mode]
  
  // Adjust for experience level
  let setModifier = 0
  let repModifier = 0
  
  switch (experienceLevel) {
    case 'beginner':
      setModifier = -1
      repModifier = 0
      break
    case 'intermediate':
      setModifier = 0
      repModifier = 0
      break
    case 'advanced':
      setModifier = 0
      repModifier = 1
      break
    case 'elite':
      setModifier = 1
      repModifier = 1
      break
  }
  
  // Adjust for fatigue
  if (fatigueLevel === 'high') {
    setModifier -= 1
    repModifier -= 1
  } else if (fatigueLevel === 'low') {
    setModifier += 0
    repModifier += 0
  }
  
  // Calculate final values
  const sets = Math.max(contract.sets.min, Math.min(contract.sets.max, contract.sets.typical + setModifier))
  const repsMin = Math.max(1, contract.repsOrHold.min + repModifier)
  const repsMax = Math.max(repsMin, contract.repsOrHold.max + repModifier)
  const restSeconds = contract.restSeconds.typical
  
  // Format output
  let repsOrTime: string
  switch (contract.repsOrHold.type) {
    case 'hold_seconds':
      repsOrTime = `${repsMin}-${repsMax}s hold`
      break
    case 'time_under_tension':
      repsOrTime = `${repsMin}-${repsMax}s`
      break
    case 'amrap':
      repsOrTime = `${repsMin}-${repsMax}s AMRAP`
      break
    default:
      repsOrTime = repsMin === repsMax ? `${repsMin}` : `${repsMin}-${repsMax}`
  }
  
  // Format rest
  const restMinutes = Math.floor(restSeconds / 60)
  const restSecs = restSeconds % 60
  const rest = restMinutes > 0 
    ? (restSecs > 0 ? `${restMinutes}:${restSecs.toString().padStart(2, '0')}` : `${restMinutes} min`)
    : `${restSeconds}s`
  
  // Build notes
  let notes = ''
  if (contract.intensity.rpeTarget) {
    notes += `RPE ${contract.intensity.rpeTarget}. `
  }
  if (currentProgression) {
    notes += `${currentProgression} progression. `
  }
  notes += contract.progression.notes
  
  return {
    sets,
    repsOrTime,
    rest,
    notes,
    mode,
  }
}

// =============================================================================
// TASK 2: SKILL-LEVEL-AWARE PRESCRIPTION
// =============================================================================

/**
 * Skill progression levels for prescription scaling
 */
export type SkillProgressionLevel = 
  | 'none'
  | 'tuck'
  | 'advanced_tuck'
  | 'straddle'
  | 'half_lay'
  | 'full'
  | 'one_leg'

/**
 * Generate skill-appropriate prescription based on current progression level.
 * This makes skill work feel more coach-like and level-aware.
 * 
 * TASK 2: Planche/front lever holds should not feel like random 3x8s forever.
 * HSPU progression should match wall-HSPU reality.
 * Advanced athlete should not receive beginner-style broad rep prescriptions.
 */
export function generateSkillAwarePrescription(
  skillType: 'planche' | 'front_lever' | 'back_lever' | 'hspu' | 'l_sit' | 'v_sit' | 'handstand' | 'muscle_up',
  progressionLevel: SkillProgressionLevel,
  experienceLevel: ExperienceLevel
): {
  sets: number
  repsOrTime: string
  rest: string
  notes: string
  mode: PrescriptionMode
  qualityFocus: string
} {
  // Base mode is skill hold or skill cluster depending on skill type
  const isDynamic = skillType === 'muscle_up' || skillType === 'hspu'
  const baseMode: PrescriptionMode = isDynamic ? 'skill_cluster' : 'skill_hold'
  
  // Determine appropriate hold times based on progression level
  let holdTimeRange: { min: number; max: number }
  let sets: number
  let qualityFocus: string
  let restSeconds: number
  
  switch (progressionLevel) {
    case 'none':
    case 'tuck':
      // Early progression: shorter holds, more sets for exposure
      holdTimeRange = { min: 5, max: 10 }
      sets = 4
      restSeconds = 90
      qualityFocus = 'Position quality over duration. Build time gradually.'
      break
      
    case 'advanced_tuck':
      // Mid progression: building capacity
      holdTimeRange = { min: 8, max: 15 }
      sets = 4
      restSeconds = 120
      qualityFocus = 'Solid 10s holds before progressing difficulty.'
      break
      
    case 'straddle':
      // Advancing: longer quality holds
      holdTimeRange = { min: 10, max: 20 }
      sets = 4
      restSeconds = 150
      qualityFocus = 'Full ROM with control. No dropping out of position.'
      break
      
    case 'half_lay':
    case 'one_leg':
      // Near-full: quality over quantity
      holdTimeRange = { min: 8, max: 15 }
      sets = 5
      restSeconds = 180
      qualityFocus = 'Perfect form only. Stop if form breaks.'
      break
      
    case 'full':
      // Full progression: maintenance or cluster work
      holdTimeRange = { min: 5, max: 10 }
      sets = 5
      restSeconds = 180
      qualityFocus = 'Quality clusters. Work on next challenge.'
      break
      
    default:
      holdTimeRange = { min: 8, max: 15 }
      sets = 4
      restSeconds = 120
      qualityFocus = 'Technical focus.'
  }
  
  // Dynamic skills (muscle-up, HSPU) use reps not holds
  let repsOrTime: string
  if (isDynamic) {
    // Adjust reps based on progression
    const reps = progressionLevel === 'none' || progressionLevel === 'tuck' 
      ? { min: 1, max: 3 }
      : progressionLevel === 'full'
      ? { min: 3, max: 5 }
      : { min: 2, max: 4 }
    
    repsOrTime = `${reps.min}-${reps.max}`
    sets = progressionLevel === 'full' ? 5 : 4
    
    // HSPU special case: wall-HSPU reality check
    if (skillType === 'hspu' && (progressionLevel === 'none' || progressionLevel === 'tuck')) {
      qualityFocus = 'Wall-HSPU work. Focus on depth and control.'
    }
  } else {
    repsOrTime = `${holdTimeRange.min}-${holdTimeRange.max}s hold`
  }
  
  // Advanced/elite athletes get slightly more work
  if (experienceLevel === 'advanced' || experienceLevel === 'elite') {
    sets = Math.min(6, sets + 1)
  }
  
  // Format rest
  const restMinutes = Math.floor(restSeconds / 60)
  const restSecs = restSeconds % 60
  const rest = restMinutes > 0 
    ? (restSecs > 0 ? `${restMinutes}:${restSecs.toString().padStart(2, '0')}` : `${restMinutes} min`)
    : `${restSeconds}s`
  
  // Build notes
  const progressionNote = progressionLevel !== 'none' ? `${progressionLevel.replace(/_/g, ' ')} level. ` : ''
  const notes = `RPE 8. ${progressionNote}${qualityFocus}`
  
  return {
    sets,
    repsOrTime,
    rest,
    notes,
    mode: baseMode,
    qualityFocus,
  }
}

// =============================================================================
// WEIGHTED STRENGTH CARRYOVER LOGIC (TASK 3)
// =============================================================================

/**
 * Skill prerequisites that benefit from weighted work
 */
export const WEIGHTED_CARRYOVER_MAP: Record<string, {
  primaryWeightedSupport: string[]
  secondaryWeightedSupport: string[]
  carryoverDescription: string
}> = {
  planche: {
    primaryWeightedSupport: ['weighted_dip', 'weighted_push_up'],
    secondaryWeightedSupport: ['weighted_ring_dip', 'bench_press'],
    carryoverDescription: 'Weighted pressing develops straight-arm planche pressing strength',
  },
  front_lever: {
    primaryWeightedSupport: ['weighted_pull_up', 'weighted_row'],
    secondaryWeightedSupport: ['lat_pulldown', 'cable_row'],
    carryoverDescription: 'Weighted pulling develops straight-arm pulling strength foundation',
  },
  back_lever: {
    primaryWeightedSupport: ['weighted_pull_up', 'weighted_row'],
    secondaryWeightedSupport: ['face_pull', 'rear_delt_row'],
    carryoverDescription: 'Weighted pulling with emphasis on shoulder extension control',
  },
  muscle_up: {
    primaryWeightedSupport: ['weighted_pull_up', 'weighted_dip'],
    secondaryWeightedSupport: ['high_pull', 'straight_bar_dip'],
    carryoverDescription: 'Explosive pulling and dip strength for transition',
  },
  hspu: {
    primaryWeightedSupport: ['weighted_pike_push_up', 'db_shoulder_press'],
    secondaryWeightedSupport: ['handstand_push_up_negatives', 'z_press'],
    carryoverDescription: 'Vertical pushing strength for handstand pressing',
  },
  one_arm_pull_up: {
    primaryWeightedSupport: ['weighted_pull_up', 'archer_pull_up'],
    secondaryWeightedSupport: ['one_arm_row', 'typewriter_pull_up'],
    carryoverDescription: 'Heavy unilateral pulling strength development',
  },
}

/**
 * Calculate appropriate weighted support prescription based on athlete metrics
 */
export function calculateWeightedSupportPrescription(
  targetSkill: string,
  currentWeighted: number | null,
  prWeighted: number | null,
  bodyweight: number | null,
  experienceLevel: ExperienceLevel
): {
  shouldIncludeWeighted: boolean
  suggestedLoad: string
  prescription: ReturnType<typeof generatePrescription>
  rationale: string
} {
  const carryover = WEIGHTED_CARRYOVER_MAP[targetSkill]
  
  if (!carryover) {
    return {
      shouldIncludeWeighted: false,
      suggestedLoad: 'bodyweight',
      prescription: generatePrescription('bodyweight_strength', experienceLevel),
      rationale: 'No weighted carryover defined for this skill',
    }
  }
  
  // Determine if weighted work is appropriate
  let shouldInclude = false
  let suggestedLoad = 'bodyweight'
  let rationale = ''
  
  if (currentWeighted && currentWeighted > 0) {
    shouldInclude = true
    
    // Calculate suggested load based on current and PR
    if (prWeighted && prWeighted > currentWeighted * 1.2) {
      // PR significantly higher - athlete is detrained, use conservative load
      suggestedLoad = `+${Math.round(currentWeighted * 0.85)}kg`
      rationale = `Current weighted capacity (${currentWeighted}kg) below PR (${prWeighted}kg). Using conservative load for rebuilding.`
    } else if (currentWeighted > 30) {
      // Strong weighted base - use training load
      suggestedLoad = `+${Math.round(currentWeighted * 0.9)}kg`
      rationale = `Strong weighted base at ${currentWeighted}kg. Using training load for skill transfer.`
    } else {
      // Moderate weighted - use as-is
      suggestedLoad = `+${currentWeighted}kg`
      rationale = `Moderate weighted capacity at ${currentWeighted}kg. Direct carryover to ${targetSkill}.`
    }
  } else if (experienceLevel === 'advanced' || experienceLevel === 'elite') {
    // Advanced athlete without weighted data - suggest starting light
    shouldInclude = true
    suggestedLoad = '+10-15kg'
    rationale = `Advanced athlete - weighted support recommended for ${targetSkill} progression.`
  } else {
    rationale = 'Bodyweight strength focus appropriate for current level.'
  }
  
  const prescription = generatePrescription(
    shouldInclude ? 'weighted_strength' : 'bodyweight_strength',
    experienceLevel
  )
  
  return {
    shouldIncludeWeighted: shouldInclude,
    suggestedLoad,
    prescription,
    rationale,
  }
}

// =============================================================================
// WEEKLY LOAD DISTRIBUTION (TASK 4)
// =============================================================================

export type DayStressProfile = 'high_neural' | 'moderate' | 'low_recovery' | 'mixed'

export interface WeeklyLoadBalance {
  day: number
  stressProfile: DayStressProfile
  primaryStressType: 'straight_arm' | 'bent_arm' | 'weighted' | 'mixed' | 'recovery'
  suggestedFocus: string
  recoveryNotes: string
}

/**
 * Generate balanced weekly load distribution
 */
export function generateWeeklyLoadBalance(
  trainingDays: number,
  primaryGoal: string,
  secondaryGoal: string | null,
  hasWeightedSupport: boolean
): WeeklyLoadBalance[] {
  const balance: WeeklyLoadBalance[] = []
  
  // Determine stress patterns based on goals
  const isPrimarySkill = ['planche', 'front_lever', 'back_lever', 'muscle_up', 'hspu'].includes(primaryGoal)
  const isSecondarySkill = secondaryGoal && ['planche', 'front_lever', 'back_lever', 'muscle_up', 'hspu'].includes(secondaryGoal)
  
  switch (trainingDays) {
    case 3:
      balance.push(
        { day: 1, stressProfile: 'high_neural', primaryStressType: isPrimarySkill ? 'straight_arm' : 'weighted', suggestedFocus: `Primary ${primaryGoal} skill work`, recoveryNotes: '48+ hours before next similar stress' },
        { day: 2, stressProfile: 'moderate', primaryStressType: isSecondarySkill ? 'straight_arm' : 'bent_arm', suggestedFocus: 'Secondary + strength support', recoveryNotes: 'Lower neural demand allows faster recovery' },
        { day: 3, stressProfile: 'mixed', primaryStressType: 'mixed', suggestedFocus: 'Mixed skill + conditioning', recoveryNotes: 'Varied stress before rest days' }
      )
      break
      
    case 4:
      balance.push(
        { day: 1, stressProfile: 'high_neural', primaryStressType: 'straight_arm', suggestedFocus: `Primary ${primaryGoal} skill focus`, recoveryNotes: 'Peak neural day - full recovery after' },
        { day: 2, stressProfile: 'moderate', primaryStressType: hasWeightedSupport ? 'weighted' : 'bent_arm', suggestedFocus: 'Weighted/strength support', recoveryNotes: 'Different stress type allows recovery' },
        { day: 3, stressProfile: isSecondarySkill ? 'high_neural' : 'moderate', primaryStressType: isSecondarySkill ? 'straight_arm' : 'bent_arm', suggestedFocus: `Secondary ${secondaryGoal || 'strength'} work`, recoveryNotes: 'Secondary emphasis day' },
        { day: 4, stressProfile: 'low_recovery', primaryStressType: 'mixed', suggestedFocus: 'Active recovery / density', recoveryNotes: 'Lower intensity before rest' }
      )
      break
      
    case 5:
      balance.push(
        { day: 1, stressProfile: 'high_neural', primaryStressType: 'straight_arm', suggestedFocus: `Primary ${primaryGoal} skill`, recoveryNotes: 'Peak skill day' },
        { day: 2, stressProfile: 'moderate', primaryStressType: 'bent_arm', suggestedFocus: 'Pulling strength', recoveryNotes: 'Complement push stress' },
        { day: 3, stressProfile: 'low_recovery', primaryStressType: 'recovery', suggestedFocus: 'Light technique / mobility', recoveryNotes: 'Active recovery' },
        { day: 4, stressProfile: isSecondarySkill ? 'high_neural' : 'moderate', primaryStressType: isSecondarySkill ? 'straight_arm' : 'weighted', suggestedFocus: `${secondaryGoal || 'Weighted'} focus`, recoveryNotes: 'Secondary peak day' },
        { day: 5, stressProfile: 'mixed', primaryStressType: 'mixed', suggestedFocus: 'Mixed / conditioning', recoveryNotes: 'Varied work before weekend' }
      )
      break
      
    default:
      // Generic fallback
      for (let i = 1; i <= trainingDays; i++) {
        const isHigh = i === 1 || (i === Math.ceil(trainingDays / 2) + 1)
        balance.push({
          day: i,
          stressProfile: isHigh ? 'high_neural' : 'moderate',
          primaryStressType: 'mixed',
          suggestedFocus: `Day ${i} training`,
          recoveryNotes: 'Standard recovery',
        })
      }
  }
  
  return balance
}

// =============================================================================
// DEV DIAGNOSTICS (TASK 10)
// =============================================================================

export function logPrescriptionDiagnostics(
  mode: PrescriptionMode,
  exerciseName: string,
  prescription: ReturnType<typeof generatePrescription>,
  context: {
    experienceLevel: ExperienceLevel
    fatigueLevel?: string
    isWeightedSupport?: boolean
  }
): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[PrescriptionDiagnostics]', {
    exercise: exerciseName,
    mode,
    sets: prescription.sets,
    repsOrTime: prescription.repsOrTime,
    rest: prescription.rest,
    ...context,
  })
}

export function logWeeklyLoadDiagnostics(
  balance: WeeklyLoadBalance[],
  goals: { primary: string; secondary: string | null }
): void {
  if (process.env.NODE_ENV === 'production') return
  
  console.log('[WeeklyLoadDiagnostics]', {
    goals,
    dayCount: balance.length,
    highNeuralDays: balance.filter(d => d.stressProfile === 'high_neural').length,
    recoveryDays: balance.filter(d => d.stressProfile === 'low_recovery').length,
    structure: balance.map(d => ({ day: d.day, profile: d.stressProfile, focus: d.suggestedFocus })),
  })
}
