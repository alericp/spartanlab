// Cool-Down and Flexibility Engine
// Generates intelligent, session-specific cool-downs and flexibility exposures
// Supports flexibility pathways: pancake, toe touch, front splits, side splits

import type { 
  MovementPattern, 
  EquipmentType,
  ExerciseCategory 
} from './adaptive-exercise-pool'
import type { SessionLength, PrimaryGoal } from './program-service'
import type { FatigueSensitivity } from './athlete-calibration'

// =============================================================================
// TYPES
// =============================================================================

export type CoolDownFocus = 
  | 'pull_recovery'
  | 'push_recovery'
  | 'compression_recovery'
  | 'flexibility_exposure'
  | 'general_recovery'
  | 'skill_recovery'
  | 'endurance_recovery'

export type FlexibilityPathway = 
  | 'pancake'
  | 'toe_touch'
  | 'front_splits'
  | 'side_splits'
  | 'none'

export type CoolDownPhase = 
  | 'active_recovery'    // Light movement, blood flow
  | 'static_stretch'     // Hold stretches for worked muscles
  | 'flexibility_work'   // Targeted flexibility skill work
  | 'breathing_reset'    // Parasympathetic activation

export interface CoolDownExercise {
  id: string
  name: string
  phase: CoolDownPhase
  targetPattern: MovementPattern[]
  targetMuscles: string[]
  equipment: EquipmentType[]
  duration: string // e.g., "30s", "30s each"
  durationSeconds: number
  notes?: string
  priority: number // 1-3, higher = more important
  recoveryFocus: CoolDownFocus[]
  flexibilityFocus?: FlexibilityPathway[]
}

export interface CoolDownBlock {
  focus: CoolDownFocus
  exercises: CoolDownExercise[]
  durationMinutes: number
  rationale: string
}

export interface FlexibilityBlock {
  pathway: FlexibilityPathway
  name: string
  exercises: CoolDownExercise[]
  durationMinutes: number
  rationale: string
  frequencyNote: string
}

export interface CoolDownGenerationContext {
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
  flexibilityGoals?: FlexibilityPathway[]
  fatigueSensitivity?: FatigueSensitivity
  currentFatigueScore?: number
  sessionWasEndurance?: boolean
}

export interface GeneratedCoolDown {
  block: CoolDownBlock
  flexibilityBlock?: FlexibilityBlock
  exercises: Array<{
    name: string
    prescription: string
    note?: string
  }>
  totalMinutes: number
  focusLabel: string
  includesFlexibility: boolean
  condensedMessage?: string
}

// =============================================================================
// COOL-DOWN EXERCISE POOL
// =============================================================================

export const COOLDOWN_EXERCISE_POOL: CoolDownExercise[] = [
  // ACTIVE RECOVERY PHASE
  {
    id: 'deep_breathing_reset',
    name: 'Deep Breathing Reset',
    phase: 'breathing_reset',
    targetPattern: ['core'],
    targetMuscles: ['diaphragm', 'core'],
    equipment: ['floor'],
    duration: '60s',
    durationSeconds: 60,
    notes: '4s inhale, 4s hold, 6s exhale',
    priority: 3,
    recoveryFocus: ['general_recovery', 'endurance_recovery'],
  },
  {
    id: 'cat_cow_cooldown',
    name: 'Cat-Cow',
    phase: 'active_recovery',
    targetPattern: ['core', 'compression'],
    targetMuscles: ['spine', 'core'],
    equipment: ['floor'],
    duration: '45s',
    durationSeconds: 45,
    notes: 'Slow, controlled movement',
    priority: 2,
    recoveryFocus: ['general_recovery', 'compression_recovery'],
  },
  {
    id: 'spinal_twist',
    name: 'Lying Spinal Twist',
    phase: 'active_recovery',
    targetPattern: ['core'],
    targetMuscles: ['spine', 'obliques', 'lower_back'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    priority: 2,
    recoveryFocus: ['general_recovery', 'push_recovery', 'pull_recovery'],
  },

  // STATIC STRETCHES - PULL RECOVERY
  {
    id: 'childs_pose_lat',
    name: "Child's Pose Lat Stretch",
    phase: 'static_stretch',
    targetPattern: ['vertical_pull', 'horizontal_pull'],
    targetMuscles: ['lats', 'teres_major', 'lower_back'],
    equipment: ['floor'],
    duration: '45s',
    durationSeconds: 45,
    notes: 'Walk hands to each side for deeper lat stretch',
    priority: 3,
    recoveryFocus: ['pull_recovery'],
  },
  {
    id: 'biceps_wall_stretch',
    name: 'Biceps Wall Stretch',
    phase: 'static_stretch',
    targetPattern: ['vertical_pull', 'horizontal_pull'],
    targetMuscles: ['biceps', 'forearms'],
    equipment: ['wall'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Fingers pointing down, rotate away',
    priority: 2,
    recoveryFocus: ['pull_recovery'],
  },
  {
    id: 'forearm_stretch',
    name: 'Forearm Stretch',
    phase: 'static_stretch',
    targetPattern: ['vertical_pull', 'horizontal_pull'],
    targetMuscles: ['forearms'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Both flexor and extensor',
    priority: 2,
    recoveryFocus: ['pull_recovery', 'push_recovery'],
  },
  {
    id: 'dead_hang_stretch',
    name: 'Passive Dead Hang',
    phase: 'static_stretch',
    targetPattern: ['vertical_pull'],
    targetMuscles: ['lats', 'shoulders', 'spine'],
    equipment: ['pull_bar'],
    duration: '30-45s',
    durationSeconds: 40,
    notes: 'Relax completely, decompress spine',
    priority: 2,
    recoveryFocus: ['pull_recovery'],
  },

  // STATIC STRETCHES - PUSH RECOVERY
  {
    id: 'doorway_chest_stretch',
    name: 'Doorway Chest Stretch',
    phase: 'static_stretch',
    targetPattern: ['horizontal_push', 'vertical_push'],
    targetMuscles: ['chest', 'anterior_deltoid'],
    equipment: ['wall'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Elbow at 90 degrees, step through',
    priority: 3,
    recoveryFocus: ['push_recovery'],
  },
  {
    id: 'triceps_overhead_stretch',
    name: 'Triceps Overhead Stretch',
    phase: 'static_stretch',
    targetPattern: ['horizontal_push', 'vertical_push'],
    targetMuscles: ['triceps'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Elbow points up, gently press',
    priority: 2,
    recoveryFocus: ['push_recovery'],
  },
  {
    id: 'wrist_extension_stretch',
    name: 'Wrist Extension Stretch',
    phase: 'static_stretch',
    targetPattern: ['horizontal_push', 'skill'],
    targetMuscles: ['forearms', 'wrists'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Fingers forward, lean gently',
    priority: 3,
    recoveryFocus: ['push_recovery', 'skill_recovery'],
  },
  {
    id: 'wrist_flexion_stretch',
    name: 'Wrist Flexion Stretch',
    phase: 'static_stretch',
    targetPattern: ['horizontal_push', 'skill'],
    targetMuscles: ['forearms', 'wrists'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Fingers pointing back',
    priority: 3,
    recoveryFocus: ['push_recovery', 'skill_recovery'],
  },
  {
    id: 'shoulder_cross_body',
    name: 'Cross-Body Shoulder Stretch',
    phase: 'static_stretch',
    targetPattern: ['horizontal_push', 'horizontal_pull'],
    targetMuscles: ['deltoids', 'rotator_cuff'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    priority: 2,
    recoveryFocus: ['push_recovery', 'pull_recovery'],
  },

  // COMPRESSION RECOVERY
  {
    id: 'hip_flexor_stretch',
    name: 'Hip Flexor Stretch',
    phase: 'static_stretch',
    targetPattern: ['compression'],
    targetMuscles: ['hip_flexors', 'psoas'],
    equipment: ['floor'],
    duration: '45s each',
    durationSeconds: 90,
    notes: 'Lunge position, squeeze glute',
    priority: 3,
    recoveryFocus: ['compression_recovery'],
  },
  {
    id: 'quad_stretch',
    name: 'Quad Stretch',
    phase: 'static_stretch',
    targetPattern: ['compression'],
    targetMuscles: ['quadriceps', 'hip_flexors'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Stand or lying position',
    priority: 2,
    recoveryFocus: ['compression_recovery'],
  },
  {
    id: 'seated_pike_fold',
    name: 'Seated Pike Fold',
    phase: 'static_stretch',
    targetPattern: ['compression'],
    targetMuscles: ['hamstrings', 'lower_back'],
    equipment: ['floor'],
    duration: '45s',
    durationSeconds: 45,
    notes: 'Hinge from hips, keep back flat',
    priority: 2,
    recoveryFocus: ['compression_recovery'],
    flexibilityFocus: ['toe_touch'],
  },
  {
    id: 'light_compression_fold',
    name: 'Light Compression Fold',
    phase: 'active_recovery',
    targetPattern: ['compression'],
    targetMuscles: ['hip_flexors', 'core'],
    equipment: ['floor'],
    duration: '30s',
    durationSeconds: 30,
    notes: 'Gentle, not maximal stretch',
    priority: 2,
    recoveryFocus: ['compression_recovery'],
  },

  // FLEXIBILITY PATHWAY - PANCAKE
  {
    id: 'seated_pancake_hold',
    name: 'Seated Pancake Hold',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['adductors', 'hamstrings', 'lower_back'],
    equipment: ['floor'],
    duration: '45s',
    durationSeconds: 45,
    notes: 'Wide legs, hinge forward from hips',
    priority: 3,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['pancake'],
  },
  {
    id: 'active_pancake_pulses',
    name: 'Active Pancake Pulses',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['adductors', 'hip_flexors'],
    equipment: ['floor'],
    duration: 'x10 pulses',
    durationSeconds: 30,
    notes: 'Small controlled forward movements',
    priority: 2,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['pancake'],
  },
  {
    id: 'pancake_side_reaches',
    name: 'Pancake Side Reaches',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['adductors', 'obliques'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Reach toward each foot',
    priority: 2,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['pancake'],
  },
  {
    id: 'frog_pose',
    name: 'Frog Pose',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['adductors', 'groin'],
    equipment: ['floor'],
    duration: '45s',
    durationSeconds: 45,
    notes: 'Knees wide, rock gently',
    priority: 2,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['pancake', 'side_splits'],
  },

  // FLEXIBILITY PATHWAY - TOE TOUCH / FORWARD FOLD
  {
    id: 'standing_toe_touch',
    name: 'Standing Toe Touch',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['hamstrings', 'lower_back'],
    equipment: ['floor'],
    duration: '30s',
    durationSeconds: 30,
    notes: 'Soft knees initially, progress to straight',
    priority: 3,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['toe_touch'],
  },
  {
    id: 'standing_forward_fold',
    name: 'Standing Forward Fold',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['hamstrings', 'calves', 'lower_back'],
    equipment: ['floor'],
    duration: '45s',
    durationSeconds: 45,
    notes: 'Let head hang, relax neck',
    priority: 2,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['toe_touch'],
  },
  {
    id: 'hamstring_fold',
    name: 'Hamstring Fold',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['hamstrings'],
    equipment: ['floor'],
    duration: '45s each',
    durationSeconds: 90,
    notes: 'One leg extended, fold toward it',
    priority: 2,
    recoveryFocus: ['flexibility_exposure', 'compression_recovery'],
    flexibilityFocus: ['toe_touch'],
  },

  // FLEXIBILITY PATHWAY - FRONT SPLITS
  {
    id: 'front_split_prep',
    name: 'Front Split Prep',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['hip_flexors', 'hamstrings', 'glutes'],
    equipment: ['floor'],
    duration: '45s each',
    durationSeconds: 90,
    notes: 'Low lunge position, sink slowly',
    priority: 3,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['front_splits'],
  },
  {
    id: 'pigeon_pose',
    name: 'Pigeon Pose',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['glutes', 'hip_flexors', 'piriformis'],
    equipment: ['floor'],
    duration: '45s each',
    durationSeconds: 90,
    notes: 'Front shin parallel or angled',
    priority: 2,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['front_splits'],
  },
  {
    id: 'runners_lunge',
    name: "Runner's Lunge",
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['hip_flexors', 'hamstrings'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Deep lunge, back knee down',
    priority: 2,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['front_splits'],
  },
  {
    id: 'half_splits',
    name: 'Half Splits',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['hamstrings'],
    equipment: ['floor'],
    duration: '45s each',
    durationSeconds: 90,
    notes: 'From lunge, straighten front leg',
    priority: 3,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['front_splits', 'toe_touch'],
  },

  // FLEXIBILITY PATHWAY - SIDE SPLITS
  {
    id: 'side_split_prep',
    name: 'Side Split Prep',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['adductors', 'hamstrings'],
    equipment: ['floor'],
    duration: '45s',
    durationSeconds: 45,
    notes: 'Wide stance, slide out slowly',
    priority: 3,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['side_splits'],
  },
  {
    id: 'cossack_hold',
    name: 'Cossack Squat Hold',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['adductors', 'hamstrings', 'glutes'],
    equipment: ['floor'],
    duration: '30s each',
    durationSeconds: 60,
    notes: 'Deep side lunge, straight leg pointed up',
    priority: 2,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['side_splits'],
  },
  {
    id: 'butterfly_stretch',
    name: 'Butterfly Groin Stretch',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['adductors', 'groin'],
    equipment: ['floor'],
    duration: '45s',
    durationSeconds: 45,
    notes: 'Soles together, gentle press',
    priority: 2,
    recoveryFocus: ['flexibility_exposure', 'compression_recovery'],
    flexibilityFocus: ['side_splits', 'pancake'],
  },
  {
    id: 'horse_stance_hold',
    name: 'Horse Stance Hold',
    phase: 'flexibility_work',
    targetPattern: ['compression'],
    targetMuscles: ['adductors', 'quads', 'glutes'],
    equipment: ['floor'],
    duration: '30s',
    durationSeconds: 30,
    notes: 'Wide stance, sink low',
    priority: 1,
    recoveryFocus: ['flexibility_exposure'],
    flexibilityFocus: ['side_splits'],
  },
]

// =============================================================================
// SESSION FOCUS DETECTION
// =============================================================================

/**
 * Analyze session exercises to determine cool-down focus
 */
export function detectSessionFocus(
  exercises: CoolDownGenerationContext['mainExercises']
): CoolDownFocus {
  if (exercises.length === 0) return 'general_recovery'

  // Count movement patterns
  const patternCounts: Record<string, number> = {}
  const categoryCounts: Record<string, number> = {}
  
  exercises.forEach(ex => {
    patternCounts[ex.movementPattern] = (patternCounts[ex.movementPattern] || 0) + 1
    categoryCounts[ex.category] = (categoryCounts[ex.category] || 0) + 1
  })

  // Check for compression dominance
  if ((patternCounts['compression'] || 0) >= exercises.length * 0.4) {
    return 'compression_recovery'
  }

  // Check for skill work
  if ((categoryCounts['skill'] || 0) >= exercises.length * 0.5) {
    return 'skill_recovery'
  }

  // Check for pull dominance
  const pullCount = (patternCounts['vertical_pull'] || 0) + (patternCounts['horizontal_pull'] || 0)
  const pushCount = (patternCounts['vertical_push'] || 0) + (patternCounts['horizontal_push'] || 0)

  if (pullCount > pushCount && pullCount >= exercises.length * 0.4) {
    return 'pull_recovery'
  }

  if (pushCount > pullCount && pushCount >= exercises.length * 0.4) {
    return 'push_recovery'
  }

  return 'general_recovery'
}

// =============================================================================
// TIME ALLOCATION
// =============================================================================

interface CoolDownTimeAllocation {
  cooldownMinutes: number
  flexibilityMinutes: number
  canIncludeFlexibility: boolean
}

/**
 * Calculate time allocation based on session length
 */
export function calculateCoolDownTime(
  sessionLength: SessionLength,
  hasFlexibilityGoal: boolean
): CoolDownTimeAllocation {
  // Convert session length to minutes
  const sessionMinutes = typeof sessionLength === 'number' 
    ? sessionLength
    : sessionLength === '10-20' ? 15
    : sessionLength === '20-30' ? 25
    : sessionLength === '30-45' ? 37
    : sessionLength === '45-60' ? 52
    : 70 // 60+

  // 20-minute session: 2-4 min cooldown max
  if (sessionMinutes <= 25) {
    return {
      cooldownMinutes: Math.min(4, Math.max(2, Math.floor(sessionMinutes * 0.12))),
      flexibilityMinutes: 0,
      canIncludeFlexibility: false,
    }
  }

  // 30-minute session: 3-5 min cooldown, optional short flexibility
  if (sessionMinutes <= 37) {
    return {
      cooldownMinutes: Math.min(5, Math.max(3, Math.floor(sessionMinutes * 0.12))),
      flexibilityMinutes: hasFlexibilityGoal ? 4 : 0,
      canIncludeFlexibility: hasFlexibilityGoal,
    }
  }

  // 45-60 minute session: 4-8 min cooldown, optional 5-10 min flexibility
  if (sessionMinutes <= 60) {
    return {
      cooldownMinutes: Math.min(8, Math.max(4, Math.floor(sessionMinutes * 0.1))),
      flexibilityMinutes: hasFlexibilityGoal ? Math.min(8, Math.max(5, Math.floor(sessionMinutes * 0.12))) : 0,
      canIncludeFlexibility: hasFlexibilityGoal,
    }
  }

  // 60+ minute session: 5-10 min cooldown, 6-10 min flexibility
  return {
    cooldownMinutes: Math.min(10, Math.max(5, Math.floor(sessionMinutes * 0.1))),
    flexibilityMinutes: hasFlexibilityGoal ? Math.min(10, Math.max(6, Math.floor(sessionMinutes * 0.12))) : 0,
    canIncludeFlexibility: hasFlexibilityGoal,
  }
}

// =============================================================================
// EXERCISE SELECTION
// =============================================================================

function selectCoolDownExercises(
  focus: CoolDownFocus,
  targetMinutes: number,
  equipment: EquipmentType[]
): CoolDownExercise[] {
  const selected: CoolDownExercise[] = []
  let totalSeconds = 0
  const targetSeconds = targetMinutes * 60

  // Filter by recovery focus and equipment
  const available = COOLDOWN_EXERCISE_POOL.filter(ex => {
    const matchesFocus = ex.recoveryFocus.includes(focus) || ex.recoveryFocus.includes('general_recovery')
    const hasEquipment = ex.equipment.some(eq => 
      eq === 'floor' || eq === 'wall' || equipment.includes(eq)
    )
    // Exclude flexibility work from basic cooldown
    const isNotFlexibilityWork = ex.phase !== 'flexibility_work'
    return matchesFocus && hasEquipment && isNotFlexibilityWork
  })

  // Sort by priority (higher first)
  available.sort((a, b) => b.priority - a.priority)

  // Select exercises until we hit target time
  for (const exercise of available) {
    if (totalSeconds >= targetSeconds) break
    if (totalSeconds + exercise.durationSeconds <= targetSeconds + 30) {
      selected.push(exercise)
      totalSeconds += exercise.durationSeconds
    }
  }

  // Always try to include breathing reset at the end if we have time
  const breathingReset = COOLDOWN_EXERCISE_POOL.find(e => e.id === 'deep_breathing_reset')
  if (breathingReset && !selected.includes(breathingReset) && totalSeconds < targetSeconds) {
    selected.push(breathingReset)
  }

  return selected
}

function selectFlexibilityExercises(
  pathway: FlexibilityPathway,
  targetMinutes: number,
  equipment: EquipmentType[]
): CoolDownExercise[] {
  if (pathway === 'none') return []

  const selected: CoolDownExercise[] = []
  let totalSeconds = 0
  const targetSeconds = targetMinutes * 60

  // Filter by flexibility pathway and equipment
  const available = COOLDOWN_EXERCISE_POOL.filter(ex => {
    const matchesPathway = ex.flexibilityFocus?.includes(pathway)
    const hasEquipment = ex.equipment.some(eq => 
      eq === 'floor' || eq === 'wall' || equipment.includes(eq)
    )
    return matchesPathway && hasEquipment
  })

  // Sort by priority (higher first)
  available.sort((a, b) => b.priority - a.priority)

  // Select exercises until we hit target time
  for (const exercise of available) {
    if (totalSeconds >= targetSeconds) break
    if (totalSeconds + exercise.durationSeconds <= targetSeconds + 30) {
      selected.push(exercise)
      totalSeconds += exercise.durationSeconds
    }
  }

  return selected
}

// =============================================================================
// FATIGUE-AWARE ADJUSTMENTS
// =============================================================================

function adjustForFatigue(
  cooldownMinutes: number,
  flexibilityMinutes: number,
  fatigueSensitivity?: FatigueSensitivity,
  currentFatigueScore?: number,
  sessionWasEndurance?: boolean
): { cooldownMinutes: number; flexibilityMinutes: number; skipFlexibility: boolean } {
  let adjustedCooldown = cooldownMinutes
  let adjustedFlexibility = flexibilityMinutes
  let skipFlexibility = false

  // High fatigue after dense/endurance session = shorter cooldown, lighter exposure
  if (sessionWasEndurance) {
    adjustedCooldown = Math.max(3, cooldownMinutes - 1)
    adjustedFlexibility = Math.max(0, flexibilityMinutes - 2)
  }

  // High fatigue score = reduce intensity
  if (currentFatigueScore && currentFatigueScore > 70) {
    adjustedCooldown = Math.max(2, cooldownMinutes - 1)
    skipFlexibility = true // Just do recovery, no additional stretch demand
  } else if (currentFatigueScore && currentFatigueScore > 50) {
    adjustedFlexibility = Math.max(0, flexibilityMinutes - 2)
  }

  // High fatigue sensitivity = prioritize recovery
  if (fatigueSensitivity === 'high') {
    adjustedFlexibility = Math.min(adjustedFlexibility, 5) // Cap flexibility work
  }

  return {
    cooldownMinutes: adjustedCooldown,
    flexibilityMinutes: adjustedFlexibility,
    skipFlexibility,
  }
}

// =============================================================================
// MAIN GENERATION FUNCTIONS
// =============================================================================

/**
 * Generate a complete cool-down with optional flexibility work
 */
export function generateCoolDown(context: CoolDownGenerationContext): GeneratedCoolDown {
  const {
    mainExercises,
    primaryGoal,
    sessionLength,
    equipment,
    flexibilityGoals = [],
    fatigueSensitivity,
    currentFatigueScore,
    sessionWasEndurance,
  } = context

  // Detect session focus
  const focus = detectSessionFocus(mainExercises)

  // Check for flexibility goals
  const primaryFlexibilityGoal = flexibilityGoals[0] || 'none'
  const hasFlexibilityGoal = flexibilityGoals.length > 0 && primaryFlexibilityGoal !== 'none'

  // Calculate time allocation
  const timeAlloc = calculateCoolDownTime(sessionLength, hasFlexibilityGoal)

  // Adjust for fatigue
  const fatigueAdjusted = adjustForFatigue(
    timeAlloc.cooldownMinutes,
    timeAlloc.flexibilityMinutes,
    fatigueSensitivity,
    currentFatigueScore,
    sessionWasEndurance
  )

  // Select cool-down exercises
  const cooldownExercises = selectCoolDownExercises(focus, fatigueAdjusted.cooldownMinutes, equipment)

  // Build cool-down block
  const cooldownBlock: CoolDownBlock = {
    focus,
    exercises: cooldownExercises,
    durationMinutes: fatigueAdjusted.cooldownMinutes,
    rationale: getCoolDownRationale(focus, mainExercises),
  }

  // Select flexibility exercises if applicable
  let flexibilityBlock: FlexibilityBlock | undefined
  if (!fatigueAdjusted.skipFlexibility && timeAlloc.canIncludeFlexibility && primaryFlexibilityGoal !== 'none') {
    const flexExercises = selectFlexibilityExercises(
      primaryFlexibilityGoal,
      fatigueAdjusted.flexibilityMinutes,
      equipment
    )
    
    if (flexExercises.length > 0) {
      flexibilityBlock = {
        pathway: primaryFlexibilityGoal,
        name: getFlexibilityBlockName(primaryFlexibilityGoal, fatigueAdjusted.flexibilityMinutes),
        exercises: flexExercises,
        durationMinutes: fatigueAdjusted.flexibilityMinutes,
        rationale: `Short ${primaryFlexibilityGoal.replace('_', ' ')} exposure to support your flexibility goals.`,
        frequencyNote: 'Frequent exposure builds flexibility faster than long occasional sessions.',
      }
    }
  }

  // Build exercise list for output
  const exercises = [
    ...cooldownExercises.map(ex => ({
      name: ex.name,
      prescription: ex.duration,
      note: ex.notes,
    })),
    ...(flexibilityBlock?.exercises || []).map(ex => ({
      name: ex.name,
      prescription: ex.duration,
      note: ex.notes,
    })),
  ]

  // Calculate total time
  const totalMinutes = fatigueAdjusted.cooldownMinutes + (flexibilityBlock?.durationMinutes || 0)

  // Build condensed message if applicable
  let condensedMessage: string | undefined
  if (fatigueAdjusted.skipFlexibility && hasFlexibilityGoal) {
    condensedMessage = 'Flexibility exposure skipped this session to prioritize recovery.'
  } else if (fatigueAdjusted.flexibilityMinutes < timeAlloc.flexibilityMinutes) {
    condensedMessage = 'This session includes a short flexibility exposure to support your goals within your available time.'
  }

  return {
    block: cooldownBlock,
    flexibilityBlock,
    exercises,
    totalMinutes,
    focusLabel: getCoolDownLabel(focus),
    includesFlexibility: !!flexibilityBlock,
    condensedMessage,
  }
}

/**
 * Generate a dedicated flexibility session block
 */
export function generateFlexibilitySession(
  pathway: FlexibilityPathway,
  durationMinutes: number,
  equipment: EquipmentType[]
): FlexibilityBlock | null {
  if (pathway === 'none') return null

  // Cap duration at 15 minutes max
  const cappedDuration = Math.min(15, Math.max(6, durationMinutes))

  const exercises = selectFlexibilityExercises(pathway, cappedDuration, equipment)
  
  if (exercises.length === 0) return null

  return {
    pathway,
    name: getFlexibilityBlockName(pathway, cappedDuration),
    exercises,
    durationMinutes: cappedDuration,
    rationale: `Dedicated ${pathway.replace('_', ' ')} training for progressive flexibility development.`,
    frequencyNote: 'Aim for 3-5 short exposures per week rather than one long session.',
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getCoolDownRationale(
  focus: CoolDownFocus,
  exercises: CoolDownGenerationContext['mainExercises']
): string {
  const workedMuscles = [...new Set(exercises.flatMap(e => e.primaryMuscles))].slice(0, 3)
  
  switch (focus) {
    case 'pull_recovery':
      return `Recovery stretches targeting lats, biceps, and forearms used in pulling work.`
    case 'push_recovery':
      return `Recovery stretches for chest, triceps, and shoulders from pushing movements.`
    case 'compression_recovery':
      return `Hip flexor and hamstring recovery from compression training.`
    case 'skill_recovery':
      return `Wrist care and shoulder mobility to support skill work recovery.`
    case 'endurance_recovery':
      return `Breathing reset and light mobility after conditioning work.`
    default:
      return `General recovery targeting ${workedMuscles.join(', ') || 'worked muscles'}.`
  }
}

function getCoolDownLabel(focus: CoolDownFocus): string {
  switch (focus) {
    case 'pull_recovery': return 'Pull Recovery'
    case 'push_recovery': return 'Push Recovery'
    case 'compression_recovery': return 'Compression Recovery'
    case 'skill_recovery': return 'Skill Recovery'
    case 'endurance_recovery': return 'Conditioning Recovery'
    default: return 'Cool-Down'
  }
}

function getFlexibilityBlockName(pathway: FlexibilityPathway, minutes: number): string {
  const pathwayNames: Record<FlexibilityPathway, string> = {
    pancake: 'Pancake Block',
    toe_touch: 'Forward Fold Exposure',
    front_splits: 'Front Split Prep',
    side_splits: 'Side Split Prep',
    none: '',
  }
  return `${pathwayNames[pathway]} — ${minutes} min`
}

// =============================================================================
// FLEXIBILITY PATHWAY DEFINITIONS (for future guide support)
// =============================================================================

export const FLEXIBILITY_PATHWAYS: Record<FlexibilityPathway, {
  name: string
  description: string
  targetMuscles: string[]
  keyExercises: string[]
  frequencyRecommendation: string
  typicalDuration: string
}> = {
  pancake: {
    name: 'Pancake Flexibility',
    description: 'Wide-legged forward fold for middle split and compression skills',
    targetMuscles: ['adductors', 'hamstrings', 'lower_back'],
    keyExercises: ['seated_pancake_hold', 'active_pancake_pulses', 'frog_pose', 'butterfly_stretch'],
    frequencyRecommendation: '4-6 times per week, short sessions',
    typicalDuration: '5-10 minutes',
  },
  toe_touch: {
    name: 'Toe Touch / Forward Fold',
    description: 'Standing and seated forward fold flexibility',
    targetMuscles: ['hamstrings', 'calves', 'lower_back'],
    keyExercises: ['standing_toe_touch', 'standing_forward_fold', 'seated_pike_fold', 'half_splits'],
    frequencyRecommendation: '5-7 times per week, even daily',
    typicalDuration: '3-8 minutes',
  },
  front_splits: {
    name: 'Front Splits',
    description: 'One leg forward, one leg back full split',
    targetMuscles: ['hip_flexors', 'hamstrings', 'glutes', 'psoas'],
    keyExercises: ['front_split_prep', 'pigeon_pose', 'half_splits', 'runners_lunge'],
    frequencyRecommendation: '4-5 times per week',
    typicalDuration: '8-12 minutes',
  },
  side_splits: {
    name: 'Side Splits / Straddle',
    description: 'Both legs out to the side full split',
    targetMuscles: ['adductors', 'hamstrings', 'groin'],
    keyExercises: ['side_split_prep', 'cossack_hold', 'frog_pose', 'horse_stance_hold'],
    frequencyRecommendation: '4-5 times per week',
    typicalDuration: '8-12 minutes',
  },
  none: {
    name: 'No Flexibility Focus',
    description: 'Standard recovery without dedicated flexibility work',
    targetMuscles: [],
    keyExercises: [],
    frequencyRecommendation: 'N/A',
    typicalDuration: 'N/A',
  },
}
