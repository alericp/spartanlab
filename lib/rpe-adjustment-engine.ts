// RPE Adjustment Engine
// Provides real-time per-set adjustments for key strength exercises

// =============================================================================
// TYPES
// =============================================================================

export type RPEValue = 5 | 5.5 | 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10

export interface PrescribedSet {
  setNumber: number
  targetReps: number
  prescribedRPE: RPEValue
  prescribedRestSeconds: number
  load?: string // e.g., "+20lbs" or "bodyweight"
}

export interface CompletedSet {
  setNumber: number
  actualReps: number
  actualRPE: RPEValue
  prescribedRPE: RPEValue
  prescribedRestSeconds: number
}

export interface LoadAdjustment {
  suggestChange: boolean
  changeType: 'increase' | 'decrease' | 'maintain'
  percentChange: number // e.g., 2.5 or 5
  suggestion: string // e.g., "+2.5 lbs" or "maintain load"
  reasoning: string
}

export interface RepAdjustment {
  suggestChange: boolean
  targetReps: number
  repRange: string // e.g., "4-5" or "5"
  reasoning: string
}

export interface FatigueSignal {
  isAccumulating: boolean
  level: 'none' | 'mild' | 'moderate' | 'high'
  consecutiveHighRPE: number
  averageRPEDelta: number
  warning: string | null
}

export interface SetAdjustment {
  adjustedRestSeconds: number
  restChange: number // positive = more rest, negative = less rest
  guidance: string
  guidanceType: 'increase_rest' | 'maintain' | 'decrease_rest' | 'caution'
  explanation: string
  // New in Prompt 2/2
  loadAdjustment: LoadAdjustment | null
  repAdjustment: RepAdjustment | null
  fatigueSignal: FatigueSignal
}

export interface ExerciseRPEConfig {
  exerciseId: string
  exerciseName: string
  category: 'strength' | 'skill'
  sets: PrescribedSet[]
  supportsRPE: boolean
}

// =============================================================================
// RPE-SUPPORTED EXERCISES
// Only high-value strength movements support RPE tracking initially
// =============================================================================

const RPE_SUPPORTED_EXERCISES = new Set([
  // Weighted movements
  'weighted_pull_up',
  'weighted_dip',
  'weighted_muscle_up',
  'weighted_chin_up',
  // Key strength movements
  'pull_up',
  'chin_up',
  'dip',
  'pike_push_up',
  'pseudo_planche_push_up',
  'wall_hspu',
  // Commonly named versions
  'weighted pull-ups',
  'weighted dips',
  'weighted pull-up',
  'weighted dip',
  'pull-ups',
  'dips',
  'chin-ups',
  'pike push-ups',
  'wall hspu',
])

export function exerciseSupportsRPE(exerciseName: string): boolean {
  const normalized = exerciseName.toLowerCase().replace(/[_\s-]+/g, ' ').trim()
  
  // Check exact matches first
  if (RPE_SUPPORTED_EXERCISES.has(normalized)) return true
  if (RPE_SUPPORTED_EXERCISES.has(exerciseName.toLowerCase())) return true
  
  // Check for weighted movements
  if (normalized.includes('weighted')) return true
  
  // Check for specific key movements
  const keyMovements = ['pull-up', 'pull up', 'dip', 'chin-up', 'chin up', 'hspu', 'pike push']
  return keyMovements.some(key => normalized.includes(key))
}

// =============================================================================
// DEFAULT PRESCRIBED RPE
// Based on exercise category and set position
// =============================================================================

export function getDefaultPrescribedRPE(
  exerciseCategory: string,
  setNumber: number,
  totalSets: number
): RPEValue {
  // Strength work typically targets RPE 7-8.5
  // First sets slightly easier to accumulate quality volume
  // Final sets can approach RPE 9
  
  if (exerciseCategory === 'strength' || exerciseCategory === 'skill') {
    if (setNumber === 1) return 7
    if (setNumber === totalSets) return 8.5
    return 8
  }
  
  // Accessory work: lower RPE
  return 7
}

export function getDefaultRestSeconds(
  exerciseCategory: string,
  exerciseName: string
): number {
  const normalized = exerciseName.toLowerCase()
  
  // Heavy weighted movements need more rest
  if (normalized.includes('weighted')) return 180 // 3 minutes
  
  // Strength category
  if (exerciseCategory === 'strength') return 150 // 2.5 minutes
  
  // Skill work
  if (exerciseCategory === 'skill') return 120 // 2 minutes
  
  // Accessory
  return 90 // 1.5 minutes
}

// =============================================================================
// RPE COMPARISON LOGIC
// =============================================================================

export type ExertionDelta = 'much_higher' | 'slightly_higher' | 'on_target' | 'lower'

export function compareRPE(actual: RPEValue, prescribed: RPEValue): ExertionDelta {
  const delta = actual - prescribed
  
  if (delta >= 1.5) return 'much_higher'
  if (delta >= 0.5) return 'slightly_higher'
  if (delta >= -0.5) return 'on_target'
  return 'lower'
}

// =============================================================================
// REST TIME ADJUSTMENT
// =============================================================================

interface RestAdjustmentConfig {
  minRestSeconds: number
  maxRestSeconds: number
  increaseAmount: number
  decreaseAmount: number
}

const DEFAULT_REST_CONFIG: RestAdjustmentConfig = {
  minRestSeconds: 60,   // Never go below 1 minute
  maxRestSeconds: 300,  // Never exceed 5 minutes
  increaseAmount: 30,   // Add 30 seconds when needed
  decreaseAmount: 15,   // Remove 15 seconds max when easy
}

export function calculateAdjustedRest(
  prescribedRestSeconds: number,
  exertionDelta: ExertionDelta,
  config: RestAdjustmentConfig = DEFAULT_REST_CONFIG
): { adjustedRest: number; change: number } {
  let adjustedRest = prescribedRestSeconds
  let change = 0
  
  switch (exertionDelta) {
    case 'much_higher':
      // Significant rest increase
      change = 60
      break
    case 'slightly_higher':
      // Moderate rest increase
      change = config.increaseAmount
      break
    case 'on_target':
      // No change
      change = 0
      break
    case 'lower':
      // Small rest decrease
      change = -config.decreaseAmount
      break
  }
  
  adjustedRest = prescribedRestSeconds + change
  
  // Clamp to reasonable bounds
  adjustedRest = Math.max(config.minRestSeconds, Math.min(config.maxRestSeconds, adjustedRest))
  change = adjustedRest - prescribedRestSeconds
  
  return { adjustedRest, change }
}

// =============================================================================
// GUIDANCE GENERATION
// =============================================================================

export function generateNextSetGuidance(
  exertionDelta: ExertionDelta,
  restChange: number,
  prescribedReps: number
): { guidance: string; guidanceType: SetAdjustment['guidanceType'] } {
  switch (exertionDelta) {
    case 'much_higher':
      return {
        guidance: 'Rest increased to preserve strength quality',
        guidanceType: 'caution',
      }
    case 'slightly_higher':
      return {
        guidance: restChange > 0 ? 'Slightly longer rest recommended' : 'Stay on plan',
        guidanceType: restChange > 0 ? 'increase_rest' : 'maintain',
      }
    case 'on_target':
      return {
        guidance: 'Stay on plan',
        guidanceType: 'maintain',
      }
    case 'lower':
      return {
        guidance: restChange < 0 ? 'Slightly shorter rest is acceptable' : 'Maintain current pace',
        guidanceType: restChange < 0 ? 'decrease_rest' : 'maintain',
      }
  }
}

export function generateExplanation(
  exertionDelta: ExertionDelta,
  actualRPE: RPEValue,
  prescribedRPE: RPEValue
): string {
  const rpeDiff = actualRPE - prescribedRPE
  
  switch (exertionDelta) {
    case 'much_higher':
      return `Set was harder than intended (RPE ${actualRPE} vs ${prescribedRPE}). More rest preserves strength quality for remaining sets.`
    case 'slightly_higher':
      return `Effort was slightly above target. Minor adjustment ensures consistent performance.`
    case 'on_target':
      return `Effort matched the plan. Continue as prescribed.`
    case 'lower':
      return `Set felt easier than intended. You may be ready for slightly more challenge or shorter rest.`
  }
}

// =============================================================================
// MAIN ADJUSTMENT FUNCTION
// =============================================================================

export function calculateSetAdjustment(
  completedSet: CompletedSet,
  setHistory: SetHistory[] = []
): SetAdjustment {
  const exertionDelta = compareRPE(completedSet.actualRPE, completedSet.prescribedRPE)
  const { adjustedRest, change } = calculateAdjustedRest(
    completedSet.prescribedRestSeconds,
    exertionDelta
  )
  
  // Build set history for fatigue detection
  const fullHistory: SetHistory[] = [
    ...setHistory,
    {
      setNumber: completedSet.setNumber,
      actualRPE: completedSet.actualRPE,
      prescribedRPE: completedSet.prescribedRPE,
      rpeDelta: completedSet.actualRPE - completedSet.prescribedRPE,
    },
  ]
  
  // Detect fatigue accumulation
  const fatigueSignal = detectFatigueSignal(fullHistory)
  
  // Calculate load adjustment suggestion
  const loadAdjustment = calculateLoadAdjustment(exertionDelta, fatigueSignal.level)
  
  // Calculate rep adjustment suggestion
  const repAdjustment = calculateRepAdjustment(
    exertionDelta,
    fatigueSignal,
    completedSet.actualReps,
    completedSet.actualRPE
  )
  
  // Generate enhanced guidance
  const guidance = generateEnhancedGuidance(
    exertionDelta,
    change,
    loadAdjustment,
    repAdjustment,
    fatigueSignal
  )
  
  // Determine guidance type
  let guidanceType: SetAdjustment['guidanceType'] = 'maintain'
  if (fatigueSignal.level === 'high' || fatigueSignal.level === 'moderate') {
    guidanceType = 'caution'
  } else if (exertionDelta === 'much_higher') {
    guidanceType = 'caution'
  } else if (change > 0) {
    guidanceType = 'increase_rest'
  } else if (change < 0) {
    guidanceType = 'decrease_rest'
  }
  
  const explanation = generateExplanation(
    exertionDelta,
    completedSet.actualRPE,
    completedSet.prescribedRPE
  )
  
  return {
    adjustedRestSeconds: adjustedRest,
    restChange: change,
    guidance,
    guidanceType,
    explanation,
    loadAdjustment,
    repAdjustment,
    fatigueSignal,
  }
}

// =============================================================================
// EXERCISE CONFIG GENERATOR
// =============================================================================

export function generateExerciseRPEConfig(
  exerciseId: string,
  exerciseName: string,
  exerciseCategory: string,
  totalSets: number,
  repsOrTime: string,
  load?: string
): ExerciseRPEConfig | null {
  if (!exerciseSupportsRPE(exerciseName)) {
    return null
  }
  
  // Parse reps from repsOrTime string (e.g., "5", "6-8", "5 reps")
  const repsMatch = repsOrTime.match(/(\d+)/)
  const targetReps = repsMatch ? parseInt(repsMatch[1], 10) : 5
  
  const baseRestSeconds = getDefaultRestSeconds(exerciseCategory, exerciseName)
  
  const sets: PrescribedSet[] = []
  for (let i = 1; i <= totalSets; i++) {
    sets.push({
      setNumber: i,
      targetReps,
      prescribedRPE: getDefaultPrescribedRPE(exerciseCategory, i, totalSets),
      prescribedRestSeconds: baseRestSeconds,
      load,
    })
  }
  
  return {
    exerciseId,
    exerciseName,
    category: exerciseCategory as 'strength' | 'skill',
    sets,
    supportsRPE: true,
  }
}

// =============================================================================
// RPE INPUT OPTIONS
// =============================================================================

export const RPE_OPTIONS: { value: RPEValue; label: string; description: string }[] = [
  { value: 5, label: '5', description: 'Very easy' },
  { value: 5.5, label: '5.5', description: '' },
  { value: 6, label: '6', description: 'Easy' },
  { value: 6.5, label: '6.5', description: '' },
  { value: 7, label: '7', description: 'Moderate' },
  { value: 7.5, label: '7.5', description: '' },
  { value: 8, label: '8', description: 'Hard' },
  { value: 8.5, label: '8.5', description: '' },
  { value: 9, label: '9', description: 'Very hard' },
  { value: 9.5, label: '9.5', description: '' },
  { value: 10, label: '10', description: 'Max effort' },
]

// Quick-tap options for mobile
export const RPE_QUICK_OPTIONS: RPEValue[] = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10]

// =============================================================================
// REST TIME FORMATTING
// =============================================================================

export function formatRestTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  
  if (secs === 0) {
    return `${mins}:00`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatRestChange(change: number): string {
  if (change === 0) return 'No change'
  if (change > 0) return `+${change}s`
  return `${change}s`
}

// =============================================================================
// FATIGUE SIGNAL DETECTION
// Tracks accumulated fatigue across sets within an exercise
// =============================================================================

export interface SetHistory {
  setNumber: number
  actualRPE: RPEValue
  prescribedRPE: RPEValue
  rpeDelta: number
}

export function detectFatigueSignal(setHistory: SetHistory[]): FatigueSignal {
  if (setHistory.length === 0) {
    return {
      isAccumulating: false,
      level: 'none',
      consecutiveHighRPE: 0,
      averageRPEDelta: 0,
      warning: null,
    }
  }

  // Count consecutive sets where actual RPE exceeded prescribed by >= 1
  let consecutiveHighRPE = 0
  for (let i = setHistory.length - 1; i >= 0; i--) {
    if (setHistory[i].rpeDelta >= 1) {
      consecutiveHighRPE++
    } else {
      break
    }
  }

  // Calculate average RPE delta across all sets
  const totalDelta = setHistory.reduce((sum, s) => sum + s.rpeDelta, 0)
  const averageRPEDelta = totalDelta / setHistory.length

  // Determine fatigue level
  let level: FatigueSignal['level'] = 'none'
  let warning: string | null = null

  if (consecutiveHighRPE >= 3 || averageRPEDelta >= 1.5) {
    level = 'high'
    warning = 'Fatigue is accumulating significantly. Consider preserving remaining sets with lighter effort.'
  } else if (consecutiveHighRPE >= 2 || averageRPEDelta >= 1.0) {
    level = 'moderate'
    warning = 'Fatigue is accumulating faster than expected. Maintain load and focus on clean reps.'
  } else if (consecutiveHighRPE >= 1 || averageRPEDelta >= 0.5) {
    level = 'mild'
    warning = null
  }

  return {
    isAccumulating: level !== 'none',
    level,
    consecutiveHighRPE,
    averageRPEDelta: Math.round(averageRPEDelta * 10) / 10,
    warning,
  }
}

// =============================================================================
// LOAD ADJUSTMENT LOGIC
// Conservative suggestions only - never forced
// =============================================================================

const LOAD_ADJUSTMENT_LIMITS = {
  maxIncreasePercent: 5,    // Maximum +5% load increase
  minIncreasePercent: 2.5,  // Minimum meaningful increase
  maxDecreasePercent: 10,   // Only suggest decrease when really needed
}

export function calculateLoadAdjustment(
  exertionDelta: ExertionDelta,
  fatigueLevel: FatigueSignal['level'],
  currentLoad?: string
): LoadAdjustment | null {
  // Only suggest load changes for clear cases
  
  // Case: Effort significantly lower than target - may suggest slight increase
  if (exertionDelta === 'lower' && fatigueLevel === 'none') {
    return {
      suggestChange: true,
      changeType: 'increase',
      percentChange: LOAD_ADJUSTMENT_LIMITS.minIncreasePercent,
      suggestion: '+2.5-5 lbs next set (optional)',
      reasoning: 'Load appears lighter than target. You may increase slightly if form remains solid.',
    }
  }

  // Case: Consistent high effort with moderate fatigue - maintain load, don't decrease
  if ((exertionDelta === 'much_higher' || exertionDelta === 'slightly_higher') && 
      (fatigueLevel === 'moderate' || fatigueLevel === 'high')) {
    return {
      suggestChange: false,
      changeType: 'maintain',
      percentChange: 0,
      suggestion: 'Keep load the same',
      reasoning: 'Fatigue is accumulating. Maintain current load and focus on execution quality.',
    }
  }

  // Case: Much higher effort on single set - suggest maintaining
  if (exertionDelta === 'much_higher') {
    return {
      suggestChange: false,
      changeType: 'maintain',
      percentChange: 0,
      suggestion: 'Keep load the same',
      reasoning: 'Set was harder than intended. Keep load and prioritize recovery between sets.',
    }
  }

  // Default: no load suggestion needed
  return null
}

// =============================================================================
// REP ADJUSTMENT LOGIC
// Minimal changes only - max 1 rep reduction
// =============================================================================

const REP_ADJUSTMENT_LIMITS = {
  maxRepReduction: 1,  // Never reduce by more than 1 rep
}

export function calculateRepAdjustment(
  exertionDelta: ExertionDelta,
  fatigueSignal: FatigueSignal,
  prescribedReps: number,
  actualRPE: RPEValue
): RepAdjustment | null {
  // Only suggest rep adjustments for high exertion cases
  
  // Case: Much higher effort + fatigue accumulating - suggest 1 less rep
  if (exertionDelta === 'much_higher' && fatigueSignal.level !== 'none') {
    const adjustedReps = Math.max(1, prescribedReps - REP_ADJUSTMENT_LIMITS.maxRepReduction)
    return {
      suggestChange: true,
      targetReps: adjustedReps,
      repRange: `${adjustedReps}-${prescribedReps}`,
      reasoning: 'Slightly reducing rep target helps maintain strength quality.',
    }
  }

  // Case: Near-max effort (RPE 9.5+) on any set - suggest rep range
  if (actualRPE >= 9.5) {
    const adjustedReps = Math.max(1, prescribedReps - REP_ADJUSTMENT_LIMITS.maxRepReduction)
    return {
      suggestChange: true,
      targetReps: adjustedReps,
      repRange: `${adjustedReps}-${prescribedReps}`,
      reasoning: 'You reached near-max effort. A smaller rep target preserves output quality.',
    }
  }

  // Case: High RPE with moderate+ fatigue
  if (actualRPE >= 9 && fatigueSignal.level === 'moderate') {
    const adjustedReps = Math.max(1, prescribedReps - REP_ADJUSTMENT_LIMITS.maxRepReduction)
    return {
      suggestChange: true,
      targetReps: adjustedReps,
      repRange: `${adjustedReps}-${prescribedReps}`,
      reasoning: 'Fatigue is building. Consider the lower end of your rep range.',
    }
  }

  // Default: no rep adjustment
  return null
}

// =============================================================================
// ENHANCED GUIDANCE GENERATION
// =============================================================================

export function generateEnhancedGuidance(
  exertionDelta: ExertionDelta,
  restChange: number,
  loadAdjustment: LoadAdjustment | null,
  repAdjustment: RepAdjustment | null,
  fatigueSignal: FatigueSignal
): string {
  const parts: string[] = []

  // Rest guidance
  if (restChange > 0) {
    parts.push(`Rest increased by ${restChange}s`)
  } else if (restChange < 0) {
    parts.push(`Rest reduced by ${Math.abs(restChange)}s`)
  }

  // Load guidance
  if (loadAdjustment?.suggestChange) {
    parts.push(loadAdjustment.suggestion)
  } else if (loadAdjustment) {
    parts.push('Maintain load')
  }

  // Rep guidance
  if (repAdjustment?.suggestChange) {
    parts.push(`Aim for ${repAdjustment.repRange} reps`)
  }

  // Fatigue warning takes precedence
  if (fatigueSignal.warning) {
    return fatigueSignal.warning
  }

  if (parts.length === 0) {
    return 'Stay on plan'
  }

  return parts.join(' • ')
}
