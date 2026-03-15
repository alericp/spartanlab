/**
 * Prehab Preparation Engine
 * 
 * Intelligent warm-up and joint preparation system that dynamically
 * selects exercises based on the workout's exercises, skills, and loading patterns.
 * 
 * Goals:
 * - Reduce injury risk by preparing stressed joints and tendons
 * - Improve performance readiness
 * - Keep warm-ups efficient (5-10 minutes typically)
 * - Avoid redundant exercises when multiple exercises stress the same joint
 */

import type { SkillGoal } from '../athlete-profile'

// =============================================================================
// TYPES
// =============================================================================

export type JointArea = 
  | 'wrist'
  | 'elbow'
  | 'shoulder_anterior'
  | 'shoulder_posterior'
  | 'shoulder_extension'
  | 'scapula'
  | 'spine'
  | 'hip'
  | 'core'

export type StressType =
  | 'compression'
  | 'extension'
  | 'flexion'
  | 'rotation'
  | 'tendon_loading'
  | 'stability'

export type LoadingIntensity = 'low' | 'moderate' | 'high' | 'extreme'

export interface JointStress {
  joint: JointArea
  stressType: StressType
  intensity: LoadingIntensity
  tendonRisk: boolean
}

export interface ExerciseJointMapping {
  exerciseId: string
  exerciseName: string
  jointStresses: JointStress[]
  requiresSpecificPrep: boolean
  mandatoryPrepAreas: JointArea[]
}

export interface PrehabExercise {
  id: string
  name: string
  targetJoints: JointArea[]
  category: 'mobility' | 'activation' | 'tendon_prep' | 'stability'
  sets: number
  repsOrDuration: string
  notes?: string
  priority: number // 1-5, higher = more important
  equipment: ('floor' | 'bands' | 'pull_bar' | 'rings' | 'parallettes' | 'dip_bars')[]
  contraindications?: string[]
}

export interface PrehabBlock {
  exercises: PrehabExercise[]
  totalDuration: number
  targetAreas: JointArea[]
  rationale: string
}

export interface PrehabGenerationContext {
  plannedExercises: Array<{
    id: string
    name: string
    skillGoal?: SkillGoal
    isSkillWork: boolean
    isWeighted: boolean
    isExplosive: boolean
  }>
  sessionDuration: number // in minutes
  skillGoals: SkillGoal[]
  hasRings: boolean
  hasWeights: boolean
  hasBands: boolean
  userHasShoulderIssues?: boolean
  userHasElbowIssues?: boolean
  userHasWristIssues?: boolean
}

export interface GeneratedPrehabWarmup {
  exercises: Array<{
    name: string
    prescription: string
    note?: string
    targetArea: string
  }>
  totalMinutes: number
  prepFocus: string
  safetyNotes: string[]
}

// =============================================================================
// JOINT STRESS MAPPING - SKILLS
// =============================================================================

export const SKILL_JOINT_MAPPINGS: Record<string, JointStress[]> = {
  // Push-based skills
  planche: [
    { joint: 'wrist', stressType: 'extension', intensity: 'extreme', tendonRisk: true },
    { joint: 'elbow', stressType: 'extension', intensity: 'high', tendonRisk: true },
    { joint: 'shoulder_anterior', stressType: 'compression', intensity: 'extreme', tendonRisk: true },
    { joint: 'scapula', stressType: 'stability', intensity: 'high', tendonRisk: false },
    { joint: 'core', stressType: 'compression', intensity: 'high', tendonRisk: false },
  ],
  
  handstand: [
    { joint: 'wrist', stressType: 'extension', intensity: 'high', tendonRisk: false },
    { joint: 'shoulder_anterior', stressType: 'flexion', intensity: 'moderate', tendonRisk: false },
    { joint: 'scapula', stressType: 'stability', intensity: 'moderate', tendonRisk: false },
    { joint: 'core', stressType: 'stability', intensity: 'low', tendonRisk: false },
  ],
  
  handstand_pushup: [
    { joint: 'wrist', stressType: 'extension', intensity: 'high', tendonRisk: true },
    { joint: 'shoulder_anterior', stressType: 'compression', intensity: 'high', tendonRisk: true },
    { joint: 'elbow', stressType: 'extension', intensity: 'moderate', tendonRisk: false },
    { joint: 'scapula', stressType: 'stability', intensity: 'high', tendonRisk: false },
  ],
  
  // Pull-based skills
  front_lever: [
    { joint: 'elbow', stressType: 'extension', intensity: 'extreme', tendonRisk: true },
    { joint: 'shoulder_posterior', stressType: 'compression', intensity: 'high', tendonRisk: true },
    { joint: 'scapula', stressType: 'stability', intensity: 'high', tendonRisk: false },
    { joint: 'core', stressType: 'compression', intensity: 'high', tendonRisk: false },
  ],
  
  back_lever: [
    { joint: 'shoulder_extension', stressType: 'extension', intensity: 'extreme', tendonRisk: true },
    { joint: 'elbow', stressType: 'extension', intensity: 'high', tendonRisk: true },
    { joint: 'scapula', stressType: 'stability', intensity: 'high', tendonRisk: false },
    { joint: 'core', stressType: 'compression', intensity: 'moderate', tendonRisk: false },
  ],
  
  muscle_up: [
    { joint: 'shoulder_anterior', stressType: 'rotation', intensity: 'high', tendonRisk: true },
    { joint: 'shoulder_posterior', stressType: 'compression', intensity: 'moderate', tendonRisk: false },
    { joint: 'elbow', stressType: 'flexion', intensity: 'high', tendonRisk: true },
    { joint: 'wrist', stressType: 'flexion', intensity: 'moderate', tendonRisk: false },
    { joint: 'scapula', stressType: 'stability', intensity: 'high', tendonRisk: false },
  ],
  
  one_arm_pull_up: [
    { joint: 'elbow', stressType: 'flexion', intensity: 'extreme', tendonRisk: true },
    { joint: 'shoulder_posterior', stressType: 'compression', intensity: 'high', tendonRisk: true },
    { joint: 'scapula', stressType: 'stability', intensity: 'extreme', tendonRisk: false },
    { joint: 'wrist', stressType: 'compression', intensity: 'high', tendonRisk: false },
  ],
  
  iron_cross: [
    { joint: 'elbow', stressType: 'extension', intensity: 'extreme', tendonRisk: true },
    { joint: 'shoulder_anterior', stressType: 'compression', intensity: 'extreme', tendonRisk: true },
    { joint: 'shoulder_extension', stressType: 'extension', intensity: 'extreme', tendonRisk: true },
    { joint: 'scapula', stressType: 'stability', intensity: 'extreme', tendonRisk: false },
  ],
  
  // Compression skills
  l_sit: [
    { joint: 'hip', stressType: 'compression', intensity: 'moderate', tendonRisk: false },
    { joint: 'core', stressType: 'compression', intensity: 'moderate', tendonRisk: false },
    { joint: 'shoulder_anterior', stressType: 'compression', intensity: 'low', tendonRisk: false },
  ],
  
  v_sit: [
    { joint: 'hip', stressType: 'compression', intensity: 'high', tendonRisk: false },
    { joint: 'core', stressType: 'compression', intensity: 'high', tendonRisk: false },
    { joint: 'shoulder_anterior', stressType: 'compression', intensity: 'moderate', tendonRisk: false },
  ],
}

// =============================================================================
// JOINT STRESS MAPPING - EXERCISES
// =============================================================================

export const EXERCISE_JOINT_MAPPINGS: Record<string, JointStress[]> = {
  // Pulling exercises
  weighted_pull_up: [
    { joint: 'elbow', stressType: 'flexion', intensity: 'high', tendonRisk: true },
    { joint: 'shoulder_posterior', stressType: 'compression', intensity: 'high', tendonRisk: false },
    { joint: 'scapula', stressType: 'stability', intensity: 'high', tendonRisk: false },
  ],
  
  pull_up: [
    { joint: 'elbow', stressType: 'flexion', intensity: 'moderate', tendonRisk: false },
    { joint: 'shoulder_posterior', stressType: 'compression', intensity: 'moderate', tendonRisk: false },
    { joint: 'scapula', stressType: 'stability', intensity: 'moderate', tendonRisk: false },
  ],
  
  chin_up: [
    { joint: 'elbow', stressType: 'flexion', intensity: 'moderate', tendonRisk: true },
    { joint: 'shoulder_posterior', stressType: 'compression', intensity: 'moderate', tendonRisk: false },
  ],
  
  rows: [
    { joint: 'shoulder_posterior', stressType: 'compression', intensity: 'moderate', tendonRisk: false },
    { joint: 'scapula', stressType: 'stability', intensity: 'moderate', tendonRisk: false },
  ],
  
  // Pushing exercises
  weighted_dip: [
    { joint: 'shoulder_anterior', stressType: 'extension', intensity: 'high', tendonRisk: true },
    { joint: 'elbow', stressType: 'extension', intensity: 'high', tendonRisk: true },
  ],
  
  dip: [
    { joint: 'shoulder_anterior', stressType: 'extension', intensity: 'moderate', tendonRisk: false },
    { joint: 'elbow', stressType: 'extension', intensity: 'moderate', tendonRisk: false },
  ],
  
  push_up: [
    { joint: 'wrist', stressType: 'extension', intensity: 'low', tendonRisk: false },
    { joint: 'shoulder_anterior', stressType: 'compression', intensity: 'low', tendonRisk: false },
    { joint: 'elbow', stressType: 'extension', intensity: 'low', tendonRisk: false },
  ],
  
  pike_push_up: [
    { joint: 'wrist', stressType: 'extension', intensity: 'moderate', tendonRisk: false },
    { joint: 'shoulder_anterior', stressType: 'compression', intensity: 'moderate', tendonRisk: false },
  ],
}

// =============================================================================
// PREHAB EXERCISE LIBRARY
// =============================================================================

export const PREHAB_EXERCISE_LIBRARY: PrehabExercise[] = [
  // WRIST PREPARATION
  {
    id: 'wrist_circles',
    name: 'Wrist Circles',
    targetJoints: ['wrist'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '10 each direction',
    priority: 4,
    equipment: ['floor'],
  },
  {
    id: 'palm_pulses',
    name: 'Palm Pulses',
    targetJoints: ['wrist'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '20 pulses',
    notes: 'Fingers forward, backward, outward',
    priority: 4,
    equipment: ['floor'],
  },
  {
    id: 'finger_extensions',
    name: 'Finger Extensions',
    targetJoints: ['wrist'],
    category: 'tendon_prep',
    sets: 1,
    repsOrDuration: '15',
    notes: 'Open hand fully against resistance',
    priority: 3,
    equipment: ['bands'],
  },
  {
    id: 'wrist_rocks',
    name: 'Wrist Rocks',
    targetJoints: ['wrist'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '10 each direction',
    notes: 'On hands and knees, rock forward/back',
    priority: 5,
    equipment: ['floor'],
  },
  
  // ELBOW TENDON PREPARATION
  {
    id: 'light_band_curls',
    name: 'Light Band Curls',
    targetJoints: ['elbow'],
    category: 'tendon_prep',
    sets: 1,
    repsOrDuration: '15',
    notes: 'Very light resistance, blood flow focus',
    priority: 4,
    equipment: ['bands'],
  },
  {
    id: 'reverse_wrist_curls',
    name: 'Reverse Wrist Curls',
    targetJoints: ['elbow', 'wrist'],
    category: 'tendon_prep',
    sets: 1,
    repsOrDuration: '15',
    notes: 'Forearm extensors',
    priority: 4,
    equipment: ['bands'],
  },
  {
    id: 'pronation_supination',
    name: 'Pronation/Supination Drills',
    targetJoints: ['elbow'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '10 each',
    notes: 'Rotate forearm fully',
    priority: 3,
    equipment: ['floor'],
  },
  {
    id: 'elbow_circles',
    name: 'Elbow Circles',
    targetJoints: ['elbow'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '10 each direction',
    priority: 3,
    equipment: ['floor'],
  },
  
  // SHOULDER PREPARATION
  {
    id: 'band_dislocates',
    name: 'Band Dislocates',
    targetJoints: ['shoulder_anterior', 'shoulder_posterior', 'shoulder_extension'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '10',
    notes: 'Wide grip, control tempo',
    priority: 5,
    equipment: ['bands'],
  },
  {
    id: 'scapular_push_ups',
    name: 'Scapular Push-Ups',
    targetJoints: ['scapula', 'shoulder_anterior'],
    category: 'activation',
    sets: 2,
    repsOrDuration: '10',
    notes: 'Protraction and retraction focus',
    priority: 5,
    equipment: ['floor'],
  },
  {
    id: 'scapular_pull_ups',
    name: 'Scapular Pull-Ups',
    targetJoints: ['scapula', 'shoulder_posterior'],
    category: 'activation',
    sets: 2,
    repsOrDuration: '8',
    notes: 'Depression and elevation focus',
    priority: 5,
    equipment: ['pull_bar'],
  },
  {
    id: 'ytwl_raises',
    name: 'YTWL Raises',
    targetJoints: ['shoulder_anterior', 'shoulder_posterior', 'scapula'],
    category: 'activation',
    sets: 1,
    repsOrDuration: '5 each position',
    notes: 'Low intensity, activation focus',
    priority: 4,
    equipment: ['floor'],
  },
  {
    id: 'arm_circles',
    name: 'Arm Circles',
    targetJoints: ['shoulder_anterior', 'shoulder_posterior'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '10 each direction',
    priority: 3,
    equipment: ['floor'],
  },
  {
    id: 'shoulder_rotations',
    name: 'Internal/External Rotations',
    targetJoints: ['shoulder_anterior', 'shoulder_posterior'],
    category: 'activation',
    sets: 1,
    repsOrDuration: '10 each',
    priority: 4,
    equipment: ['bands'],
  },
  
  // SHOULDER EXTENSION (for back lever, iron cross)
  {
    id: 'german_hang_passive',
    name: 'Passive German Hang',
    targetJoints: ['shoulder_extension'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '15-30s',
    notes: 'Gentle stretch, no forcing',
    priority: 5,
    equipment: ['rings', 'pull_bar'],
    contraindications: ['shoulder_issues'],
  },
  {
    id: 'skin_the_cat_slow',
    name: 'Slow Skin The Cat',
    targetJoints: ['shoulder_extension', 'scapula'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '3-5',
    notes: 'Control throughout full ROM',
    priority: 5,
    equipment: ['rings', 'pull_bar'],
    contraindications: ['shoulder_issues', 'elbow_issues'],
  },
  
  // FOREARM CONDITIONING
  {
    id: 'grip_pulses',
    name: 'Grip Pulses',
    targetJoints: ['wrist'],
    category: 'activation',
    sets: 1,
    repsOrDuration: '20',
    notes: 'Squeeze and release',
    priority: 3,
    equipment: ['floor'],
  },
  {
    id: 'dead_hang',
    name: 'Passive Dead Hang',
    targetJoints: ['shoulder_posterior', 'wrist', 'elbow'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '20-30s',
    notes: 'Relax shoulders, decompress',
    priority: 4,
    equipment: ['pull_bar'],
  },
  
  // SCAPULAR ACTIVATION
  {
    id: 'band_pull_aparts',
    name: 'Band Pull Aparts',
    targetJoints: ['scapula', 'shoulder_posterior'],
    category: 'activation',
    sets: 2,
    repsOrDuration: '15',
    notes: 'Squeeze shoulder blades',
    priority: 4,
    equipment: ['bands'],
  },
  {
    id: 'prone_i_raises',
    name: 'Prone I-Raises',
    targetJoints: ['scapula', 'shoulder_posterior'],
    category: 'activation',
    sets: 1,
    repsOrDuration: '10',
    notes: 'Thumbs up, squeeze back',
    priority: 3,
    equipment: ['floor'],
  },
  
  // CORE ACTIVATION
  {
    id: 'hollow_hold',
    name: 'Hollow Hold',
    targetJoints: ['core', 'hip'],
    category: 'activation',
    sets: 1,
    repsOrDuration: '20s',
    notes: 'Lower back pressed down',
    priority: 5,
    equipment: ['floor'],
  },
  {
    id: 'dead_bugs',
    name: 'Dead Bugs',
    targetJoints: ['core', 'hip'],
    category: 'activation',
    sets: 1,
    repsOrDuration: '10 each side',
    notes: 'Maintain neutral spine',
    priority: 4,
    equipment: ['floor'],
  },
  {
    id: 'light_compression_work',
    name: 'Seated Compression Lifts',
    targetJoints: ['core', 'hip'],
    category: 'activation',
    sets: 1,
    repsOrDuration: '10',
    notes: 'Light effort, activation focus',
    priority: 4,
    equipment: ['floor'],
  },
  {
    id: 'cat_cow',
    name: 'Cat-Cow',
    targetJoints: ['spine', 'core'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '10',
    notes: 'Full spinal flexion/extension',
    priority: 3,
    equipment: ['floor'],
  },
  
  // HIP PREPARATION
  {
    id: 'hip_circles',
    name: 'Hip Circles',
    targetJoints: ['hip'],
    category: 'mobility',
    sets: 1,
    repsOrDuration: '10 each direction',
    priority: 3,
    equipment: ['floor'],
  },
  {
    id: 'glute_bridges',
    name: 'Glute Bridges',
    targetJoints: ['hip', 'core'],
    category: 'activation',
    sets: 1,
    repsOrDuration: '10',
    priority: 3,
    equipment: ['floor'],
  },
  {
    id: 'pike_pulses',
    name: 'Pike Pulses',
    targetJoints: ['hip', 'core'],
    category: 'activation',
    sets: 1,
    repsOrDuration: '15',
    notes: 'Keep legs straight',
    priority: 4,
    equipment: ['floor'],
  },
]

// =============================================================================
// PREHAB GENERATION ENGINE
// =============================================================================

/**
 * Analyze planned exercises and determine joint stress profile
 */
export function analyzeJointStress(context: PrehabGenerationContext): Map<JointArea, {
  maxIntensity: LoadingIntensity
  hasTendonRisk: boolean
  stressCount: number
}> {
  const jointProfile = new Map<JointArea, {
    maxIntensity: LoadingIntensity
    hasTendonRisk: boolean
    stressCount: number
  }>()
  
  const intensityOrder: LoadingIntensity[] = ['low', 'moderate', 'high', 'extreme']
  
  // Analyze skill goals
  for (const skill of context.skillGoals) {
    const stresses = SKILL_JOINT_MAPPINGS[skill]
    if (stresses) {
      for (const stress of stresses) {
        const current = jointProfile.get(stress.joint) || {
          maxIntensity: 'low' as LoadingIntensity,
          hasTendonRisk: false,
          stressCount: 0,
        }
        
        // Update max intensity
        if (intensityOrder.indexOf(stress.intensity) > intensityOrder.indexOf(current.maxIntensity)) {
          current.maxIntensity = stress.intensity
        }
        
        // Update tendon risk
        if (stress.tendonRisk) {
          current.hasTendonRisk = true
        }
        
        current.stressCount++
        jointProfile.set(stress.joint, current)
      }
    }
  }
  
  // Analyze planned exercises
  for (const exercise of context.plannedExercises) {
    // Check if exercise matches known patterns
    const exerciseKey = exercise.name.toLowerCase().replace(/[^a-z]/g, '_')
    
    // Try to match exercise to known mappings
    for (const [key, stresses] of Object.entries(EXERCISE_JOINT_MAPPINGS)) {
      if (exerciseKey.includes(key) || key.includes(exerciseKey.split('_')[0])) {
        for (const stress of stresses) {
          const current = jointProfile.get(stress.joint) || {
            maxIntensity: 'low' as LoadingIntensity,
            hasTendonRisk: false,
            stressCount: 0,
          }
          
          // Boost intensity if weighted
          let intensity = stress.intensity
          if (exercise.isWeighted) {
            const idx = Math.min(intensityOrder.indexOf(intensity) + 1, intensityOrder.length - 1)
            intensity = intensityOrder[idx]
          }
          
          // Update max intensity
          if (intensityOrder.indexOf(intensity) > intensityOrder.indexOf(current.maxIntensity)) {
            current.maxIntensity = intensity
          }
          
          // Update tendon risk
          if (stress.tendonRisk || exercise.isWeighted) {
            current.hasTendonRisk = true
          }
          
          current.stressCount++
          jointProfile.set(stress.joint, current)
        }
        break
      }
    }
    
    // If skill goal exercise, use skill mapping
    if (exercise.skillGoal && SKILL_JOINT_MAPPINGS[exercise.skillGoal]) {
      const stresses = SKILL_JOINT_MAPPINGS[exercise.skillGoal]
      for (const stress of stresses) {
        const current = jointProfile.get(stress.joint) || {
          maxIntensity: 'low' as LoadingIntensity,
          hasTendonRisk: false,
          stressCount: 0,
        }
        
        if (intensityOrder.indexOf(stress.intensity) > intensityOrder.indexOf(current.maxIntensity)) {
          current.maxIntensity = stress.intensity
        }
        
        if (stress.tendonRisk) {
          current.hasTendonRisk = true
        }
        
        current.stressCount++
        jointProfile.set(stress.joint, current)
      }
    }
  }
  
  return jointProfile
}

/**
 * Determine target warm-up duration based on session characteristics
 */
export function calculatePrehabDuration(context: PrehabGenerationContext): {
  totalMinutes: number
  isExtended: boolean
} {
  const { sessionDuration, plannedExercises, skillGoals } = context
  
  // Base duration scaled to session length
  let baseDuration = Math.min(Math.max(Math.round(sessionDuration * 0.1), 5), 10)
  
  // Extend for high-risk sessions
  const hasAdvancedSkills = skillGoals.some(s => 
    ['planche', 'front_lever', 'back_lever', 'iron_cross', 'one_arm_pull_up'].includes(s)
  )
  
  const hasWeightedWork = plannedExercises.some(e => e.isWeighted)
  const hasExplosiveWork = plannedExercises.some(e => e.isExplosive)
  
  if (hasAdvancedSkills || context.skillGoals.includes('iron_cross')) {
    baseDuration = Math.max(baseDuration, 8)
  }
  
  if (hasWeightedWork) {
    baseDuration = Math.max(baseDuration, 6)
  }
  
  // Cap at 10 minutes unless very long session
  if (sessionDuration >= 90 && (hasAdvancedSkills || hasWeightedWork)) {
    baseDuration = Math.min(baseDuration + 2, 12)
  }
  
  return {
    totalMinutes: baseDuration,
    isExtended: baseDuration > 8,
  }
}

/**
 * Select prehab exercises based on joint stress profile
 */
export function selectPrehabExercises(
  jointProfile: Map<JointArea, { maxIntensity: LoadingIntensity; hasTendonRisk: boolean; stressCount: number }>,
  context: PrehabGenerationContext,
  maxExercises: number
): PrehabExercise[] {
  const selected: PrehabExercise[] = []
  const usedJoints = new Set<JointArea>()
  
  // Build equipment list
  const availableEquipment: PrehabExercise['equipment'][number][] = ['floor']
  if (context.hasBands) availableEquipment.push('bands')
  if (context.hasRings) availableEquipment.push('rings')
  // Assume pull bar is available for calisthenics
  availableEquipment.push('pull_bar', 'parallettes', 'dip_bars')
  
  // Filter exercises by equipment and contraindications
  const availableExercises = PREHAB_EXERCISE_LIBRARY.filter(ex => {
    // Check equipment
    if (!ex.equipment.some(eq => availableEquipment.includes(eq))) {
      return false
    }
    
    // Check contraindications
    if (ex.contraindications) {
      if (context.userHasShoulderIssues && ex.contraindications.includes('shoulder_issues')) {
        return false
      }
      if (context.userHasElbowIssues && ex.contraindications.includes('elbow_issues')) {
        return false
      }
      if (context.userHasWristIssues && ex.contraindications.includes('wrist_issues')) {
        return false
      }
    }
    
    return true
  })
  
  // Prioritize joints by stress level
  const jointPriorities = Array.from(jointProfile.entries())
    .map(([joint, data]) => ({
      joint,
      ...data,
      priority: (data.hasTendonRisk ? 3 : 0) + 
                (['extreme', 'high', 'moderate', 'low'].indexOf(data.maxIntensity) >= 2 ? 2 : 1) +
                Math.min(data.stressCount, 3),
    }))
    .sort((a, b) => b.priority - a.priority)
  
  // Select exercises for highest-priority joints first
  for (const { joint, hasTendonRisk, maxIntensity } of jointPriorities) {
    if (selected.length >= maxExercises) break
    
    // Skip if joint already covered
    if (usedJoints.has(joint)) continue
    
    // Find best exercise for this joint
    const candidates = availableExercises
      .filter(ex => ex.targetJoints.includes(joint) && !selected.includes(ex))
      .map(ex => {
        let score = ex.priority
        
        // Boost tendon prep exercises for high-risk joints
        if (hasTendonRisk && ex.category === 'tendon_prep') {
          score += 2
        }
        
        // Boost activation for high-intensity joints
        if (['high', 'extreme'].includes(maxIntensity) && ex.category === 'activation') {
          score += 1
        }
        
        // Bonus if exercise covers multiple stressed joints
        const additionalJointsCovered = ex.targetJoints.filter(j => 
          jointProfile.has(j) && !usedJoints.has(j) && j !== joint
        ).length
        score += additionalJointsCovered
        
        return { exercise: ex, score }
      })
      .sort((a, b) => b.score - a.score)
    
    if (candidates.length > 0) {
      const bestExercise = candidates[0].exercise
      selected.push(bestExercise)
      
      // Mark all target joints as covered
      bestExercise.targetJoints.forEach(j => usedJoints.add(j))
    }
  }
  
  // Sort by category order: mobility -> activation -> tendon_prep
  const categoryOrder = ['mobility', 'activation', 'tendon_prep', 'stability']
  selected.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))
  
  return selected
}

/**
 * Generate safety notes based on session characteristics
 */
export function generateSafetyNotes(
  jointProfile: Map<JointArea, { maxIntensity: LoadingIntensity; hasTendonRisk: boolean; stressCount: number }>,
  context: PrehabGenerationContext
): string[] {
  const notes: string[] = []
  
  // Check for extreme-intensity joints
  for (const [joint, data] of jointProfile.entries()) {
    if (data.maxIntensity === 'extreme' && data.hasTendonRisk) {
      const jointLabels: Record<JointArea, string> = {
        wrist: 'wrist',
        elbow: 'elbow',
        shoulder_anterior: 'front shoulder',
        shoulder_posterior: 'rear shoulder',
        shoulder_extension: 'shoulder extension',
        scapula: 'shoulder blades',
        spine: 'spine',
        hip: 'hips',
        core: 'core',
      }
      notes.push(`Extended ${jointLabels[joint]} preparation recommended for today's session`)
    }
  }
  
  // Iron cross specific warning
  if (context.skillGoals.includes('iron_cross')) {
    notes.push('Elbow tendon preparation is mandatory before iron cross training')
  }
  
  // Advanced planche warning
  if (context.skillGoals.includes('planche')) {
    notes.push('Ensure wrists and elbows are fully warm before planche work')
  }
  
  // Back lever warning
  if (context.skillGoals.includes('back_lever')) {
    notes.push('Shoulder extension mobility required before back lever')
  }
  
  return notes
}

/**
 * Generate a complete prehab warm-up block
 */
export function generatePrehabWarmup(context: PrehabGenerationContext): GeneratedPrehabWarmup {
  // Analyze joint stress
  const jointProfile = analyzeJointStress(context)
  
  // Calculate duration
  const duration = calculatePrehabDuration(context)
  
  // Determine max exercises based on duration
  const maxExercises = duration.totalMinutes <= 5 ? 4 
    : duration.totalMinutes <= 8 ? 6 
    : 8
  
  // Select exercises
  const exercises = selectPrehabExercises(jointProfile, context, maxExercises)
  
  // Generate safety notes
  const safetyNotes = generateSafetyNotes(jointProfile, context)
  
  // Determine prep focus label
  const highestStressJoints = Array.from(jointProfile.entries())
    .filter(([_, data]) => ['high', 'extreme'].includes(data.maxIntensity))
    .map(([joint]) => joint)
  
  let prepFocus = 'General Preparation'
  if (highestStressJoints.includes('wrist') && highestStressJoints.includes('shoulder_anterior')) {
    prepFocus = 'Push Skill Preparation'
  } else if (highestStressJoints.includes('elbow') && highestStressJoints.includes('shoulder_posterior')) {
    prepFocus = 'Pull Skill Preparation'
  } else if (highestStressJoints.includes('shoulder_extension')) {
    prepFocus = 'Shoulder Extension Prep'
  } else if (highestStressJoints.length > 0) {
    prepFocus = 'Targeted Joint Preparation'
  }
  
  // Format exercises for output
  const jointLabels: Record<JointArea, string> = {
    wrist: 'Wrist',
    elbow: 'Elbow',
    shoulder_anterior: 'Shoulder',
    shoulder_posterior: 'Shoulder',
    shoulder_extension: 'Shoulder Extension',
    scapula: 'Scapula',
    spine: 'Spine',
    hip: 'Hip',
    core: 'Core',
  }
  
  const formattedExercises = exercises.map(ex => ({
    name: ex.name,
    prescription: ex.sets > 1 ? `${ex.sets} sets x ${ex.repsOrDuration}` : ex.repsOrDuration,
    note: ex.notes,
    targetArea: ex.targetJoints.map(j => jointLabels[j]).filter((v, i, a) => a.indexOf(v) === i).join(', '),
  }))
  
  return {
    exercises: formattedExercises,
    totalMinutes: duration.totalMinutes,
    prepFocus,
    safetyNotes,
  }
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Convert prehab exercises to format compatible with program builder
 */
export function prehabToExerciseBlock(warmup: GeneratedPrehabWarmup): Array<{
  id: string
  name: string
  category: string
  sets: number
  repsOrTime: string
  note?: string
  isOverrideable: boolean
  selectionReason: string
}> {
  return warmup.exercises.map((ex, index) => ({
    id: `prehab_${index}`,
    name: ex.name,
    category: 'warmup',
    sets: 1,
    repsOrTime: ex.prescription,
    note: ex.note,
    isOverrideable: true,
    selectionReason: `Preparing ${ex.targetArea.toLowerCase()} for today's session`,
  }))
}

/**
 * Quick prehab generation for specific skill focus
 */
export function generateSkillFocusedPrehab(
  skill: SkillGoal,
  sessionMinutes: number = 60
): GeneratedPrehabWarmup {
  return generatePrehabWarmup({
    plannedExercises: [],
    sessionDuration: sessionMinutes,
    skillGoals: [skill],
    hasRings: true,
    hasWeights: false,
    hasBands: true,
  })
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  analyzeJointStress,
  calculatePrehabDuration,
  selectPrehabExercises,
  generateSafetyNotes,
  generatePrehabWarmup,
  prehabToExerciseBlock,
  generateSkillFocusedPrehab,
}
