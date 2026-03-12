// Warm-Up Engine
// Generates intelligent, session-specific warm-ups based on workout content
// Analyzes planned exercises and creates targeted preparation

import type { 
  Exercise, 
  MovementPattern, 
  EquipmentType,
  ExerciseCategory 
} from './adaptive-exercise-pool'
import type { SessionLength, PrimaryGoal } from './program-service'

// =============================================================================
// TYPES
// =============================================================================

export type WarmUpFocus = 
  | 'pull'
  | 'push'
  | 'compression'
  | 'full_body'
  | 'explosive'
  | 'mobility'
  | 'skill'

export type WarmUpPhase = 
  | 'general'      // Blood flow, joint prep
  | 'specific'     // Movement pattern prep
  | 'activation'   // Neural priming

export interface WarmUpExercise {
  id: string
  name: string
  phase: WarmUpPhase
  targetPattern: MovementPattern[]
  targetMuscles: string[]
  equipment: EquipmentType[]
  reps: string
  duration?: number // in seconds if time-based
  notes?: string
  priority: number // 1-3, higher = more important
  intensity: 'low' | 'moderate' // Never high for warmup
}

export interface WarmUpBlock {
  focus: WarmUpFocus
  exercises: WarmUpExercise[]
  durationMinutes: number
  rationale: string
}

export interface WarmUpGenerationContext {
  mainExercises: Array<{
    id: string
    name: string
    category: ExerciseCategory
    movementPattern: MovementPattern
    primaryMuscles: string[]
    neuralDemand: number
  }>
  primaryGoal: PrimaryGoal
  sessionLength: SessionLength
  equipment: EquipmentType[]
}

export interface GeneratedWarmUp {
  block: WarmUpBlock
  exercises: Array<{
    name: string
    prescription: string
    note?: string
  }>
  totalMinutes: number
  focusLabel: string
}

// =============================================================================
// WARM-UP EXERCISE POOL
// =============================================================================

export const WARMUP_EXERCISE_POOL: WarmUpExercise[] = [
  // GENERAL PHASE - Joint prep and blood flow
  {
    id: 'wrist_prep',
    name: 'Wrist Preparation',
    phase: 'general',
    targetPattern: ['horizontal_push', 'vertical_push', 'skill'],
    targetMuscles: ['forearms'],
    equipment: ['floor'],
    reps: '10 each direction',
    notes: 'Circles, flexion, extension',
    priority: 3,
    intensity: 'low',
  },
  {
    id: 'arm_circles_warmup',
    name: 'Arm Circles',
    phase: 'general',
    targetPattern: ['horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull'],
    targetMuscles: ['deltoids', 'rotator_cuff'],
    equipment: ['floor'],
    reps: '10 each direction',
    priority: 2,
    intensity: 'low',
  },
  {
    id: 'shoulder_dislocates',
    name: 'Shoulder Dislocates',
    phase: 'general',
    targetPattern: ['horizontal_push', 'vertical_push', 'skill'],
    targetMuscles: ['deltoids', 'chest', 'lats'],
    equipment: ['bands'],
    reps: '10',
    notes: 'Use wide grip, control tempo',
    priority: 2,
    intensity: 'low',
  },
  {
    id: 'cat_cow',
    name: 'Cat-Cow',
    phase: 'general',
    targetPattern: ['core', 'compression'],
    targetMuscles: ['spine', 'core'],
    equipment: ['floor'],
    reps: '10',
    priority: 1,
    intensity: 'low',
  },
  {
    id: 'hip_circles',
    name: 'Hip Circles',
    phase: 'general',
    targetPattern: ['core', 'compression'],
    targetMuscles: ['hip_flexors', 'glutes'],
    equipment: ['floor'],
    reps: '10 each direction',
    priority: 2,
    intensity: 'low',
  },
  
  // SPECIFIC PHASE - Movement pattern preparation
  {
    id: 'scap_pullup_warmup',
    name: 'Scap Pull-Ups',
    phase: 'specific',
    targetPattern: ['vertical_pull'],
    targetMuscles: ['lats', 'lower_traps', 'rhomboids'],
    equipment: ['pull_bar'],
    reps: '8-10',
    notes: 'Full scap depression',
    priority: 3,
    intensity: 'low',
  },
  {
    id: 'scap_pushup_specific',
    name: 'Scap Push-Ups',
    phase: 'specific',
    targetPattern: ['horizontal_push'],
    targetMuscles: ['serratus', 'chest'],
    equipment: ['floor'],
    reps: '10',
    notes: 'Protraction focus',
    priority: 3,
    intensity: 'low',
  },
  {
    id: 'band_pull_aparts_warmup',
    name: 'Band Pull Aparts',
    phase: 'specific',
    targetPattern: ['horizontal_pull', 'vertical_pull'],
    targetMuscles: ['rear_deltoid', 'rhomboids', 'lower_traps'],
    equipment: ['bands'],
    reps: '15',
    priority: 2,
    intensity: 'low',
  },
  {
    id: 'light_rows',
    name: 'Light Bodyweight Rows',
    phase: 'specific',
    targetPattern: ['horizontal_pull'],
    targetMuscles: ['lats', 'rear_deltoid', 'biceps'],
    equipment: ['pull_bar', 'rings'],
    reps: '8',
    notes: 'High angle, easy reps',
    priority: 2,
    intensity: 'moderate',
  },
  {
    id: 'light_pushups',
    name: 'Light Push-Ups',
    phase: 'specific',
    targetPattern: ['horizontal_push'],
    targetMuscles: ['chest', 'triceps', 'anterior_deltoid'],
    equipment: ['floor'],
    reps: '8-10',
    notes: 'Controlled tempo',
    priority: 2,
    intensity: 'moderate',
  },
  {
    id: 'support_hold_warmup',
    name: 'Support Hold',
    phase: 'specific',
    targetPattern: ['vertical_push', 'skill'],
    targetMuscles: ['triceps', 'deltoids', 'core'],
    equipment: ['dip_bars', 'parallettes'],
    reps: '15-20s',
    notes: 'Active shoulders',
    priority: 3,
    intensity: 'low',
  },
  {
    id: 'dead_hang_warmup',
    name: 'Dead Hang',
    phase: 'specific',
    targetPattern: ['vertical_pull', 'horizontal_pull'],
    targetMuscles: ['forearms', 'lats'],
    equipment: ['pull_bar'],
    reps: '20-30s',
    notes: 'Relax shoulders',
    priority: 2,
    intensity: 'low',
  },
  {
    id: 'pike_pulses',
    name: 'Pike Pulses',
    phase: 'specific',
    targetPattern: ['compression'],
    targetMuscles: ['hip_flexors', 'core'],
    equipment: ['floor'],
    reps: '15',
    notes: 'Keep legs straight',
    priority: 3,
    intensity: 'low',
  },
  {
    id: 'compression_lifts_warmup',
    name: 'Seated Compression Lifts',
    phase: 'specific',
    targetPattern: ['compression'],
    targetMuscles: ['hip_flexors', 'core'],
    equipment: ['floor'],
    reps: '10',
    notes: 'Lift legs off ground',
    priority: 3,
    intensity: 'moderate',
  },
  {
    id: 'glute_bridges',
    name: 'Glute Bridges',
    phase: 'specific',
    targetPattern: ['core'],
    targetMuscles: ['glutes', 'hamstrings'],
    equipment: ['floor'],
    reps: '10',
    priority: 1,
    intensity: 'low',
  },
  
  // ACTIVATION PHASE - Neural priming
  {
    id: 'hollow_body_activation',
    name: 'Hollow Body Hold',
    phase: 'activation',
    targetPattern: ['core', 'compression', 'skill'],
    targetMuscles: ['core', 'hip_flexors'],
    equipment: ['floor'],
    reps: '20s',
    notes: 'Lower back pressed down',
    priority: 3,
    intensity: 'moderate',
  },
  {
    id: 'arch_body_activation',
    name: 'Arch Body Hold',
    phase: 'activation',
    targetPattern: ['core', 'horizontal_pull'],
    targetMuscles: ['lower_back', 'glutes'],
    equipment: ['floor'],
    reps: '15s',
    priority: 2,
    intensity: 'moderate',
  },
  {
    id: 'planche_lean_activation',
    name: 'Light Planche Leans',
    phase: 'activation',
    targetPattern: ['horizontal_push', 'skill'],
    targetMuscles: ['anterior_deltoid', 'chest', 'core'],
    equipment: ['floor', 'parallettes'],
    reps: '3 x 5s',
    notes: 'Light lean, prime shoulders',
    priority: 3,
    intensity: 'moderate',
  },
  {
    id: 'tuck_fl_activation',
    name: 'Light Tuck FL Raises',
    phase: 'activation',
    targetPattern: ['horizontal_pull', 'skill'],
    targetMuscles: ['lats', 'core'],
    equipment: ['pull_bar', 'rings'],
    reps: '5',
    notes: 'Easy reps, feel the lats',
    priority: 3,
    intensity: 'moderate',
  },
  {
    id: 'explosive_pullup_primer',
    name: 'Explosive Pull-Up Primer',
    phase: 'activation',
    targetPattern: ['vertical_pull', 'transition'],
    targetMuscles: ['lats', 'biceps'],
    equipment: ['pull_bar'],
    reps: '3',
    notes: 'Medium effort, prime CNS',
    priority: 3,
    intensity: 'moderate',
  },
  {
    id: 'ring_support_activation',
    name: 'Ring Support Activation',
    phase: 'activation',
    targetPattern: ['skill', 'transition'],
    targetMuscles: ['triceps', 'deltoids', 'core'],
    equipment: ['rings'],
    reps: '15s',
    notes: 'Turn rings out',
    priority: 3,
    intensity: 'moderate',
  },
  {
    id: 'l_sit_activation',
    name: 'Light L-Sit Hold',
    phase: 'activation',
    targetPattern: ['compression'],
    targetMuscles: ['hip_flexors', 'core', 'triceps'],
    equipment: ['parallettes', 'dip_bars'],
    reps: '10s',
    notes: 'Or tuck variation',
    priority: 3,
    intensity: 'moderate',
  },
]

// =============================================================================
// SESSION TYPE DETECTION
// =============================================================================

export function detectSessionFocus(exercises: WarmUpGenerationContext['mainExercises']): WarmUpFocus {
  // Count movement patterns
  const patternCounts: Record<string, number> = {}
  const categoryCounts: Record<string, number> = {}
  
  exercises.forEach(ex => {
    patternCounts[ex.movementPattern] = (patternCounts[ex.movementPattern] || 0) + 1
    categoryCounts[ex.category] = (categoryCounts[ex.category] || 0) + 1
  })

  // Check for skill-heavy session
  if (categoryCounts['skill'] >= 2 || exercises.some(e => e.neuralDemand >= 4)) {
    // Determine skill type
    if (patternCounts['horizontal_push'] >= 2) return 'push'
    if (patternCounts['vertical_pull'] >= 2 || patternCounts['horizontal_pull'] >= 2) return 'pull'
    return 'skill'
  }

  // Check for compression focus
  if (patternCounts['compression'] >= 2) return 'compression'

  // Check for explosive work (muscle-up training, etc.)
  if (patternCounts['transition'] >= 1 || exercises.some(e => e.name.toLowerCase().includes('explosive'))) {
    return 'explosive'
  }

  // Check push vs pull dominance
  const pullCount = (patternCounts['vertical_pull'] || 0) + (patternCounts['horizontal_pull'] || 0)
  const pushCount = (patternCounts['vertical_push'] || 0) + (patternCounts['horizontal_push'] || 0)

  if (pullCount >= pushCount + 2) return 'pull'
  if (pushCount >= pullCount + 2) return 'push'

  // Default to full body
  return 'full_body'
}

// =============================================================================
// WARM-UP DURATION CALCULATION
// =============================================================================

export function calculateWarmUpDuration(sessionLength: SessionLength): {
  totalMinutes: number
  generalMinutes: number
  specificMinutes: number
  activationMinutes: number
} {
  // Convert session length to minutes
  const sessionMinutes = typeof sessionLength === 'number' 
    ? sessionLength 
    : parseInt(sessionLength.split('-')[0]) || 45

  // Scale warm-up to session length
  if (sessionMinutes <= 20) {
    return { totalMinutes: 3, generalMinutes: 1, specificMinutes: 1.5, activationMinutes: 0.5 }
  }
  if (sessionMinutes <= 30) {
    return { totalMinutes: 4, generalMinutes: 1.5, specificMinutes: 2, activationMinutes: 0.5 }
  }
  if (sessionMinutes <= 45) {
    return { totalMinutes: 5, generalMinutes: 2, specificMinutes: 2, activationMinutes: 1 }
  }
  if (sessionMinutes <= 60) {
    return { totalMinutes: 6, generalMinutes: 2, specificMinutes: 2.5, activationMinutes: 1.5 }
  }
  // 60+ minutes
  return { totalMinutes: 8, generalMinutes: 2.5, specificMinutes: 3, activationMinutes: 2.5 }
}

// =============================================================================
// WARM-UP GENERATION
// =============================================================================

export function generateWarmUp(context: WarmUpGenerationContext): GeneratedWarmUp {
  const { mainExercises, primaryGoal, sessionLength, equipment } = context

  // Detect session focus
  const focus = detectSessionFocus(mainExercises)

  // Calculate duration
  const duration = calculateWarmUpDuration(sessionLength)

  // Get target muscles from main exercises
  const targetMuscles = new Set<string>()
  mainExercises.forEach(ex => {
    ex.primaryMuscles.forEach(m => targetMuscles.add(m))
  })

  // Get target patterns
  const targetPatterns = new Set<MovementPattern>()
  mainExercises.forEach(ex => {
    targetPatterns.add(ex.movementPattern)
  })

  // Filter available warm-up exercises by equipment
  const availableExercises = WARMUP_EXERCISE_POOL.filter(ex => 
    ex.equipment.some(eq => equipment.includes(eq) || eq === 'floor')
  )

  // Select exercises by phase
  const selectedExercises: WarmUpExercise[] = []

  // GENERAL PHASE - Always include wrist prep for calisthenics
  const generalExercises = selectPhaseExercises(
    availableExercises.filter(e => e.phase === 'general'),
    focus,
    targetPatterns,
    targetMuscles,
    2 // 2 general exercises
  )
  selectedExercises.push(...generalExercises)

  // SPECIFIC PHASE - Pattern-specific prep
  const specificExercises = selectPhaseExercises(
    availableExercises.filter(e => e.phase === 'specific'),
    focus,
    targetPatterns,
    targetMuscles,
    duration.totalMinutes >= 5 ? 3 : 2
  )
  selectedExercises.push(...specificExercises)

  // ACTIVATION PHASE - Neural priming for skill/strength work
  if (duration.totalMinutes >= 5 && mainExercises.some(e => e.neuralDemand >= 3)) {
    const activationExercises = selectPhaseExercises(
      availableExercises.filter(e => e.phase === 'activation'),
      focus,
      targetPatterns,
      targetMuscles,
      duration.totalMinutes >= 7 ? 2 : 1
    )
    selectedExercises.push(...activationExercises)
  }

  // Generate focus label
  const focusLabel = getFocusLabel(focus, primaryGoal)

  // Generate rationale
  const rationale = generateRationale(focus, mainExercises, targetPatterns)

  // Format exercises for output
  const formattedExercises = selectedExercises.map(ex => ({
    name: ex.name,
    prescription: ex.reps,
    note: ex.notes,
  }))

  return {
    block: {
      focus,
      exercises: selectedExercises,
      durationMinutes: duration.totalMinutes,
      rationale,
    },
    exercises: formattedExercises,
    totalMinutes: duration.totalMinutes,
    focusLabel,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function selectPhaseExercises(
  pool: WarmUpExercise[],
  focus: WarmUpFocus,
  targetPatterns: Set<MovementPattern>,
  targetMuscles: Set<string>,
  count: number
): WarmUpExercise[] {
  // Score exercises by relevance
  const scored = pool.map(ex => {
    let score = ex.priority

    // Boost if targets relevant patterns
    const patternMatch = ex.targetPattern.some(p => targetPatterns.has(p))
    if (patternMatch) score += 3

    // Boost if targets relevant muscles
    const muscleMatch = ex.targetMuscles.some(m => targetMuscles.has(m))
    if (muscleMatch) score += 2

    // Boost based on focus alignment
    if (focus === 'pull' && ex.targetPattern.some(p => p.includes('pull'))) score += 2
    if (focus === 'push' && ex.targetPattern.some(p => p.includes('push'))) score += 2
    if (focus === 'compression' && ex.targetPattern.includes('compression')) score += 3
    if (focus === 'explosive' && ex.phase === 'activation') score += 2
    if (focus === 'skill' && ex.phase === 'activation') score += 2

    return { exercise: ex, score }
  })

  // Sort by score and select top
  scored.sort((a, b) => b.score - a.score)

  // Take unique exercises (no duplicates)
  const selected: WarmUpExercise[] = []
  const usedIds = new Set<string>()

  for (const item of scored) {
    if (selected.length >= count) break
    if (!usedIds.has(item.exercise.id)) {
      selected.push(item.exercise)
      usedIds.add(item.exercise.id)
    }
  }

  return selected
}

function getFocusLabel(focus: WarmUpFocus, goal: PrimaryGoal): string {
  const goalLabels: Record<string, string> = {
    planche: 'Planche',
    front_lever: 'Front Lever',
    muscle_up: 'Muscle Up',
    handstand_pushup: 'HSPU',
    weighted_strength: 'Strength',
  }

  const focusLabels: Record<WarmUpFocus, string> = {
    pull: 'Pull Prep',
    push: 'Push Prep',
    compression: 'Compression Prep',
    full_body: 'Full Body Prep',
    explosive: 'Power Prep',
    mobility: 'Mobility',
    skill: `${goalLabels[goal] || 'Skill'} Prep`,
  }

  return focusLabels[focus]
}

function generateRationale(
  focus: WarmUpFocus,
  exercises: WarmUpGenerationContext['mainExercises'],
  patterns: Set<MovementPattern>
): string {
  const hasSkillWork = exercises.some(e => e.category === 'skill' || e.neuralDemand >= 4)
  const hasCompression = patterns.has('compression')
  const hasExplosive = exercises.some(e => e.name.toLowerCase().includes('explosive'))

  if (hasSkillWork) {
    return 'Preparing joints and neural system for technical skill work'
  }

  if (focus === 'compression') {
    return 'Hip flexor and core activation for compression training'
  }

  if (hasExplosive || focus === 'explosive') {
    return 'Neural priming for explosive power output'
  }

  if (focus === 'pull') {
    return 'Scapular and lat activation for pulling movements'
  }

  if (focus === 'push') {
    return 'Shoulder and chest activation for pressing movements'
  }

  return 'General preparation for calisthenics training'
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Convert warm-up to AdaptiveExercise format for program builder compatibility
 */
export function warmUpToAdaptiveExercises(warmUp: GeneratedWarmUp): Array<{
  id: string
  name: string
  category: string
  sets: number
  repsOrTime: string
  note?: string
  isOverrideable: boolean
  selectionReason: string
}> {
  return warmUp.exercises.map((ex, index) => ({
    id: `warmup_${index}`,
    name: ex.name,
    category: 'warmup',
    sets: 1,
    repsOrTime: ex.prescription,
    note: ex.note,
    isOverrideable: true,
    selectionReason: warmUp.block.rationale,
  }))
}

/**
 * Quick warm-up generation for simple use cases
 */
export function generateQuickWarmUp(
  focus: WarmUpFocus,
  minutes: number,
  equipment: EquipmentType[]
): GeneratedWarmUp {
  // Create minimal context
  const mockExercises: WarmUpGenerationContext['mainExercises'] = []

  // Add mock exercises based on focus
  if (focus === 'pull') {
    mockExercises.push({
      id: 'mock_pull',
      name: 'Pull-Ups',
      category: 'strength',
      movementPattern: 'vertical_pull',
      primaryMuscles: ['lats', 'biceps'],
      neuralDemand: 3,
    })
  } else if (focus === 'push') {
    mockExercises.push({
      id: 'mock_push',
      name: 'Dips',
      category: 'strength',
      movementPattern: 'vertical_push',
      primaryMuscles: ['chest', 'triceps'],
      neuralDemand: 3,
    })
  } else if (focus === 'compression') {
    mockExercises.push({
      id: 'mock_compression',
      name: 'L-Sit',
      category: 'skill',
      movementPattern: 'compression',
      primaryMuscles: ['hip_flexors', 'core'],
      neuralDemand: 4,
    })
  }

  // Determine session length from minutes
  const sessionLength: SessionLength = 
    minutes <= 30 ? '20-30' as SessionLength :
    minutes <= 45 ? '30-45' as SessionLength :
    minutes <= 60 ? '45-60' as SessionLength :
    '60+' as SessionLength

  return generateWarmUp({
    mainExercises: mockExercises,
    primaryGoal: 'general' as PrimaryGoal,
    sessionLength,
    equipment,
  })
}
