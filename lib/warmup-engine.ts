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
import { generateIntelligentPrehab } from './prehab'
import type { IntelligentPrehabContext } from './prehab'
import type { JointCaution } from './athlete-profile'
import { 
  recommendProtocolsForSession, 
  generateProtocolExplanation,
  type ProtocolRecommendation,
  type JointIntegrityProtocol 
} from './protocols/joint-integrity-protocol'

// Re-export for external use
export type { ProtocolRecommendation, JointIntegrityProtocol } from './protocols/joint-integrity-protocol'

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
  jointCautions?: JointCaution[]
  // TASK 4: First main skill progression for warm-up ramping
  firstSkillProgression?: {
    skillType: 'planche' | 'front_lever' | 'hspu' | 'muscle_up' | 'handstand' | 'back_lever' | 'l_sit' | 'v_sit' | 'other'
    progressionLevel: string  // e.g., 'tuck_planche', 'straddle_fl', 'wall_hspu'
    isAdvanced: boolean  // true if straddle/full or similar advanced level
  }
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
  // Joint Integrity Protocol integration
  protocols?: ProtocolRecommendation[]
  protocolExplanations?: string[]
}

// =============================================================================
// WARM-UP EXERCISE POOL
// =============================================================================

export const WARMUP_EXERCISE_POOL: WarmUpExercise[] = [
  // GENERAL PHASE - Joint prep and blood flow
  // TASK 4: Added user-preferred general warmup drills
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
    reps: '10-15 each direction',
    notes: 'Forward and backward',
    priority: 3,  // TASK 4: Elevated priority for user preference
    intensity: 'low',
  },
  {
    id: 'arm_swings_crosses',
    name: 'Arm Swings / Crosses',
    phase: 'general',
    targetPattern: ['horizontal_push', 'horizontal_pull'],
    targetMuscles: ['chest', 'rear_deltoid', 'rotator_cuff'],
    equipment: ['floor'],
    reps: '10-15',
    notes: 'Alternate crossing in front of chest',
    priority: 3,  // TASK 4: User preferred drill
    intensity: 'low',
  },
  {
    id: 'trunk_rotations',
    name: 'Trunk Rotations',
    phase: 'general',
    targetPattern: ['core'],
    targetMuscles: ['obliques', 'spine'],
    equipment: ['floor'],
    reps: '10 each direction',
    notes: 'Waist-level rotation, controlled tempo',
    priority: 2,  // TASK 4: User preferred drill
    intensity: 'low',
  },
  {
    id: 'toe_touch_pulses',
    name: 'Toe Touch Pulses',
    phase: 'general',
    targetPattern: ['core', 'compression'],
    targetMuscles: ['hamstrings', 'lower_back'],
    equipment: ['floor'],
    reps: '10-15 pulses',
    notes: 'Gentle bouncing reach',
    priority: 2,  // TASK 4: User preferred drill
    intensity: 'low',
  },
  {
    id: 'leg_swings_front',
    name: 'Leg Swings (Front)',
    phase: 'general',
    targetPattern: ['compression'],
    targetMuscles: ['hip_flexors', 'hamstrings'],
    equipment: ['floor'],
    reps: '10 each leg',
    notes: 'Hold wall for balance',
    priority: 2,  // TASK 4: User preferred drill
    intensity: 'low',
  },
  {
    id: 'kneeling_lunge_pulses',
    name: 'Kneeling Lunge Pulses',
    phase: 'general',
    targetPattern: ['compression', 'core'],
    targetMuscles: ['hip_flexors', 'quads', 'glutes'],
    equipment: ['floor'],
    reps: '10 each side',
    notes: 'Open hip flexors',
    priority: 2,  // TASK 4: User preferred drill
    intensity: 'low',
  },
  {
    id: 'lat_stretch_warmup',
    name: 'Lat Stretch',
    phase: 'general',
    targetPattern: ['vertical_pull', 'horizontal_pull'],
    targetMuscles: ['lats', 'teres'],
    equipment: ['floor', 'pull_bar'],
    reps: '20-30s each side',
    notes: 'Essential before pulling work',
    priority: 3,  // TASK 4: User preferred before pull
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
  const { mainExercises, primaryGoal, sessionLength, equipment, firstSkillProgression } = context

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

  // TASK 4: PROGRESSION-AWARE WARM-UP SELECTION
  // If first skill is advanced, include prerequisite pattern prep
  const progressionRampExercises = getProgressionRampExercises(
    firstSkillProgression,
    availableExercises,
    equipment
  )
  
  // GENERAL PHASE - Always include wrist prep for calisthenics
  // TASK 4: Increased general phase for longer sessions
  const generalCount = duration.totalMinutes >= 7 ? 3 : 2
  const generalExercises = selectPhaseExercises(
    availableExercises.filter(e => e.phase === 'general'),
    focus,
    targetPatterns,
    targetMuscles,
    generalCount
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
  
  // TASK 4: Insert progression ramp exercises before activation
  // These create a safe ladder toward the first main skill demand
  if (progressionRampExercises.length > 0) {
    // Add ramp exercises not already selected
    const existingIds = new Set(selectedExercises.map(e => e.id))
    progressionRampExercises.forEach(ex => {
      if (!existingIds.has(ex.id)) {
        selectedExercises.push(ex)
        existingIds.add(ex.id)
      }
    })
  }

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

  // TASK 4: Update rationale to reflect progression-aware logic
  const rationale = generateProgressionAwareRationale(
    focus, 
    mainExercises, 
    targetPatterns,
    firstSkillProgression
  )

  // Format exercises for output
  const formattedExercises = selectedExercises.map(ex => ({
    name: ex.name,
    prescription: ex.reps,
    note: ex.notes,
  }))

  // ===================
  // JOINT INTEGRITY PROTOCOL INTEGRATION
  // ===================
  // Recommend protocols based on primary goal and joint cautions
  // Limited to max 2 protocols to prevent warm-up overload
  const protocols = recommendProtocolsForSession(primaryGoal, context.jointCautions)
  const protocolExplanations = protocols.map(p => generateProtocolExplanation(p))
  
  // Add protocol time to total (max 2 protocols = max 8 min additional)
  const protocolMinutes = protocols.reduce((sum, p) => sum + p.protocol.durationMinutes, 0)

  return {
    block: {
      focus,
      exercises: selectedExercises,
      durationMinutes: duration.totalMinutes,
      rationale,
    },
    exercises: formattedExercises,
    totalMinutes: duration.totalMinutes + protocolMinutes,
    focusLabel,
    protocols,
    protocolExplanations,
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
// TASK 4: PROGRESSION-AWARE WARM-UP HELPERS
// =============================================================================

/**
 * Get exercises that ramp up toward the first main skill's progression level
 * TASK 4: Creates a safe ladder to prepare for advanced skill demands
 */
function getProgressionRampExercises(
  firstSkillProgression: WarmUpGenerationContext['firstSkillProgression'],
  availableExercises: WarmUpExercise[],
  equipment: EquipmentType[]
): WarmUpExercise[] {
  if (!firstSkillProgression) return []
  
  const rampExercises: WarmUpExercise[] = []
  const { skillType, isAdvanced } = firstSkillProgression
  
  // PLANCHE progression ramp
  if (skillType === 'planche') {
    // Always include wrist prep and scap protraction for planche
    const wristPrep = availableExercises.find(e => e.id === 'wrist_prep')
    if (wristPrep) rampExercises.push(wristPrep)
    
    const scapPushup = availableExercises.find(e => e.id === 'scap_pushup_specific')
    if (scapPushup) rampExercises.push(scapPushup)
    
    // For advanced planche (tuck+), add planche lean as prerequisite
    if (isAdvanced) {
      const plancheLean = availableExercises.find(e => e.id === 'planche_lean_activation')
      if (plancheLean) rampExercises.push(plancheLean)
    }
    
    // Support hold for shoulder prep
    if (equipment.includes('dip_bars') || equipment.includes('parallettes')) {
      const supportHold = availableExercises.find(e => e.id === 'support_hold_warmup')
      if (supportHold) rampExercises.push(supportHold)
    }
  }
  
  // FRONT LEVER progression ramp
  if (skillType === 'front_lever') {
    // Lat stretch essential before front lever
    const latStretch = availableExercises.find(e => e.id === 'lat_stretch_warmup')
    if (latStretch) rampExercises.push(latStretch)
    
    // Scap pull-ups for scapular depression
    const scapPull = availableExercises.find(e => e.id === 'scap_pullup_warmup')
    if (scapPull) rampExercises.push(scapPull)
    
    // Dead hang for decompression
    const deadHang = availableExercises.find(e => e.id === 'dead_hang_warmup')
    if (deadHang) rampExercises.push(deadHang)
    
    // For advanced front lever (straddle+), add tuck FL raises as primer
    if (isAdvanced) {
      const tuckFL = availableExercises.find(e => e.id === 'tuck_fl_activation')
      if (tuckFL) rampExercises.push(tuckFL)
    }
    
    // Arch body for posterior chain activation
    const archBody = availableExercises.find(e => e.id === 'arch_body_activation')
    if (archBody) rampExercises.push(archBody)
  }
  
  // HSPU progression ramp
  if (skillType === 'hspu') {
    // Wrist prep crucial for HSPU
    const wristPrep = availableExercises.find(e => e.id === 'wrist_prep')
    if (wristPrep) rampExercises.push(wristPrep)
    
    // Shoulder dislocates for shoulder opening
    const shoulderDislocates = availableExercises.find(e => e.id === 'shoulder_dislocates')
    if (shoulderDislocates && equipment.includes('bands')) rampExercises.push(shoulderDislocates)
    
    // Scap push-ups for elevation/protraction control
    const scapPushup = availableExercises.find(e => e.id === 'scap_pushup_specific')
    if (scapPushup) rampExercises.push(scapPushup)
    
    // Support hold for pressing prep
    if (equipment.includes('dip_bars') || equipment.includes('parallettes')) {
      const supportHold = availableExercises.find(e => e.id === 'support_hold_warmup')
      if (supportHold) rampExercises.push(supportHold)
    }
  }
  
  // MUSCLE UP progression ramp
  if (skillType === 'muscle_up') {
    // Lat stretch for full ROM
    const latStretch = availableExercises.find(e => e.id === 'lat_stretch_warmup')
    if (latStretch) rampExercises.push(latStretch)
    
    // Scap pull-ups
    const scapPull = availableExercises.find(e => e.id === 'scap_pullup_warmup')
    if (scapPull) rampExercises.push(scapPull)
    
    // Explosive pull primer for transition prep
    const explosivePrimer = availableExercises.find(e => e.id === 'explosive_pullup_primer')
    if (explosivePrimer) rampExercises.push(explosivePrimer)
  }
  
  // L-SIT / V-SIT progression ramp
  if (skillType === 'l_sit' || skillType === 'v_sit') {
    // Pike pulses for hip flexor activation
    const pikePulses = availableExercises.find(e => e.id === 'pike_pulses')
    if (pikePulses) rampExercises.push(pikePulses)
    
    // Compression lifts
    const compressionLifts = availableExercises.find(e => e.id === 'compression_lifts_warmup')
    if (compressionLifts) rampExercises.push(compressionLifts)
    
    // Hollow body for core tension
    const hollowBody = availableExercises.find(e => e.id === 'hollow_body_activation')
    if (hollowBody) rampExercises.push(hollowBody)
  }
  
  // HANDSTAND progression ramp
  if (skillType === 'handstand') {
    // Wrist prep essential
    const wristPrep = availableExercises.find(e => e.id === 'wrist_prep')
    if (wristPrep) rampExercises.push(wristPrep)
    
    // Shoulder dislocates
    const shoulderDislocates = availableExercises.find(e => e.id === 'shoulder_dislocates')
    if (shoulderDislocates && equipment.includes('bands')) rampExercises.push(shoulderDislocates)
    
    // Hollow body for line
    const hollowBody = availableExercises.find(e => e.id === 'hollow_body_activation')
    if (hollowBody) rampExercises.push(hollowBody)
  }
  
  return rampExercises
}

/**
 * Generate progression-aware rationale
 * TASK 4: Explains warm-up in context of first skill demand
 */
function generateProgressionAwareRationale(
  focus: WarmUpFocus,
  exercises: WarmUpGenerationContext['mainExercises'],
  patterns: Set<MovementPattern>,
  firstSkillProgression?: WarmUpGenerationContext['firstSkillProgression']
): string {
  const hasSkillWork = exercises.some(e => e.category === 'skill' || e.neuralDemand >= 4)
  const hasExplosive = exercises.some(e => e.name.toLowerCase().includes('explosive'))
  
  // TASK 4: Progression-specific rationale
  if (firstSkillProgression) {
    const { skillType, isAdvanced } = firstSkillProgression
    
    if (skillType === 'planche' && isAdvanced) {
      return 'Progressive prep for advanced planche: wrist/scap activation → lean exposure → skill work'
    }
    if (skillType === 'planche') {
      return 'Planche preparation: wrist prep, scapular protraction, and shoulder engagement'
    }
    if (skillType === 'front_lever' && isAdvanced) {
      return 'Front lever ramp: lat decompression → scap depression → easier FL variant → main work'
    }
    if (skillType === 'front_lever') {
      return 'Front lever prep: lat activation, scapular depression, and straight-arm pull patterns'
    }
    if (skillType === 'hspu') {
      return 'HSPU preparation: shoulder opening, scapular elevation, and vertical press patterns'
    }
    if (skillType === 'muscle_up') {
      return 'Muscle up prep: lat activation, explosive pull priming, and transition rehearsal'
    }
  }

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

// =============================================================================
// INTELLIGENT PREHAB INTEGRATION
// =============================================================================

/**
 * Generate intelligent prehab warm-up using the unified prehab intelligence engine
 * This integrates with joint stress mapping, weak point data, and skill demands
 * 
 * Use this for better session-specific preparation vs generic templates
 */
export async function generateIntelligentWarmup(
  context: WarmUpGenerationContext,
  athleteWeakPoints?: Record<string, number>,
  sessionFocus?: 'skill' | 'strength' | 'hypertrophy' | 'endurance'
): Promise<GeneratedWarmUp> {
  try {
    // Build prehab context from warmup context
    const prehabContext: IntelligentPrehabContext = {
      mainExercises: context.mainExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        movementPattern: ex.movementPattern,
        primaryMuscles: ex.primaryMuscles,
      })),
      sessionLength: context.sessionLength,
      athleteWeakPoints,
      sessionFocus: sessionFocus || 'skill',
    }
    
    // Get intelligent prehab recommendation
    const prehabResult = generateIntelligentPrehab(prehabContext)
    
    // Convert to warmup format for compatibility
    return {
      block: {
        focus: 'skill' as const,
        exercises: prehabResult.prehabExercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          phase: 'general' as const,
          targetPattern: ex.targetJoints as MovementPattern[],
          targetMuscles: [],
          equipment: ex.equipment as EquipmentType[],
          reps: ex.prescription,
          notes: ex.rationale,
          priority: 2,
          intensity: 'low' as const,
        })),
        durationMinutes: prehabResult.estimatedDuration,
        rationale: `Intelligent preparation targeting ${prehabResult.primaryJointsFocused.join(', ')}. ${prehabResult.weakPointAdaptations.join(' ')}`,
      },
      exercises: prehabResult.prehabExercises.map(ex => ({
        name: ex.name,
        prescription: ex.prescription,
        note: ex.rationale,
      })),
      totalMinutes: prehabResult.estimatedDuration,
      focusLabel: 'Session-Specific Preparation',
    }
  } catch (error) {
    // Fallback to standard warmup if prehab fails
    console.warn('[warmup-engine] Falling back to standard warmup:', error)
    return generateStandardWarmup(context)
  }
}

/**
 * Re-export prehab functions for convenience
 */
export { generateIntelligentPrehab } from './prehab'
export type { IntelligentPrehabContext, IntelligentPrehabResult } from './prehab'
