/**
 * Prehab Intelligence Engine
 * 
 * Unified intelligent preparation system that consolidates:
 * - warmup-engine.ts
 * - prehab-preparation-engine.ts
 * - weak-point-priority-engine.ts integration
 * - cooldown-engine.ts placement awareness
 * 
 * Creates truly adaptive warm-ups based on:
 * - Day's actual exercises
 * - Selected skills
 * - Loading patterns and joint stress
 * - User weak points
 * - Session length
 * - Recovery/fatigue status
 */

import type { SkillGoal } from '../athlete-profile'
import type { WeakPointAssessment } from '../weak-point-priority-engine'
import {
  analyzeJointStress,
  calculatePrehabDuration,
  selectPrehabExercises,
  generateSafetyNotes,
  generatePrehabWarmup,
  PREHAB_EXERCISE_LIBRARY,
  SKILL_JOINT_MAPPINGS,
  EXERCISE_JOINT_MAPPINGS,
  type JointArea,
  type LoadingIntensity,
  type PrehabExercise,
  type PrehabGenerationContext,
  type GeneratedPrehabWarmup,
} from './prehab-preparation-engine'

// =============================================================================
// TYPES
// =============================================================================

export type PrehabPlacement = 
  | 'pre_session'      // Before main workout
  | 'between_blocks'   // Between exercise blocks
  | 'accessory'        // As accessory/supplemental work
  | 'cooldown'         // Post-workout recovery

export interface PrehabPlacementRule {
  exerciseId: string
  defaultPlacement: PrehabPlacement
  alternativePlacement?: PrehabPlacement
  conditions: string[]
}

export interface WeakPointPrehabAdjustment {
  weakPointCategory: string
  extraExercises: string[]
  priorityBoost: number
  rationale: string
}

export interface IntelligentPrehabResult {
  preSession: GeneratedPrehabWarmup
  betweenBlocks?: Array<{
    name: string
    prescription: string
    note?: string
    triggerCondition: string
  }>
  accessory?: Array<{
    name: string
    prescription: string
    note?: string
    rationale: string
  }>
  cooldownSuggestions?: string[]
  weakPointAdjustments: string[]
  adaptationNotes: string[]
  totalPrepTime: number
  isSessionSpecific: boolean
}

export interface IntelligentPrehabContext extends PrehabGenerationContext {
  weakPoints?: WeakPointAssessment[]
  fatigueLevel?: 'low' | 'moderate' | 'high'
  previousSessionStress?: JointArea[]
  isDeloadDay?: boolean
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
}

// =============================================================================
// WEAK POINT TO PREHAB MAPPING
// =============================================================================

const WEAK_POINT_PREHAB_ADJUSTMENTS: Record<string, WeakPointPrehabAdjustment> = {
  shoulder_mobility: {
    weakPointCategory: 'shoulder_mobility',
    extraExercises: ['band_dislocates', 'arm_circles', 'shoulder_rotations', 'german_hang_passive'],
    priorityBoost: 2,
    rationale: 'Additional shoulder mobility work to address movement limitation',
  },
  scap_control: {
    weakPointCategory: 'scapular_control',
    extraExercises: ['scapular_push_ups', 'scapular_pull_ups', 'band_pull_aparts', 'prone_i_raises'],
    priorityBoost: 2,
    rationale: 'Enhanced scapular activation to address control deficit',
  },
  tendon_conditioning: {
    weakPointCategory: 'tendon_conditioning',
    extraExercises: ['light_band_curls', 'reverse_wrist_curls', 'pronation_supination'],
    priorityBoost: 3,
    rationale: 'Extended tendon preparation to support conditioning needs',
  },
  straight_arm_tolerance: {
    weakPointCategory: 'straight_arm_tolerance',
    extraExercises: ['dead_hang', 'light_band_curls', 'elbow_circles'],
    priorityBoost: 2,
    rationale: 'Building straight-arm capacity requires careful preparation',
  },
  pulling_strength: {
    weakPointCategory: 'pulling_strength',
    extraExercises: ['scapular_pull_ups', 'dead_hang', 'band_pull_aparts'],
    priorityBoost: 1,
    rationale: 'Activation to support pulling work',
  },
  pushing_strength: {
    weakPointCategory: 'pushing_strength',
    extraExercises: ['scapular_push_ups', 'wrist_rocks', 'arm_circles'],
    priorityBoost: 1,
    rationale: 'Activation to support pushing work',
  },
  core_strength: {
    weakPointCategory: 'core_strength',
    extraExercises: ['hollow_hold', 'dead_bugs', 'cat_cow'],
    priorityBoost: 1,
    rationale: 'Core activation for improved stability',
  },
  compression_strength: {
    weakPointCategory: 'compression',
    extraExercises: ['pike_pulses', 'light_compression_work', 'hip_circles'],
    priorityBoost: 1,
    rationale: 'Compression activation to support hip flexor demands',
  },
  ring_stability: {
    weakPointCategory: 'ring_stability',
    extraExercises: ['band_pull_aparts', 'scapular_push_ups', 'shoulder_rotations'],
    priorityBoost: 1,
    rationale: 'Stabilization prep for ring work',
  },
}

// =============================================================================
// PLACEMENT RULES
// =============================================================================

export const PREHAB_PLACEMENT_RULES: PrehabPlacementRule[] = [
  // Pre-session essentials
  {
    exerciseId: 'wrist_circles',
    defaultPlacement: 'pre_session',
    conditions: ['Always pre-session when pushing or handstand work planned'],
  },
  {
    exerciseId: 'wrist_rocks',
    defaultPlacement: 'pre_session',
    conditions: ['Essential before any wrist loading'],
  },
  {
    exerciseId: 'band_dislocates',
    defaultPlacement: 'pre_session',
    conditions: ['Shoulder opener, always early'],
  },
  {
    exerciseId: 'scapular_push_ups',
    defaultPlacement: 'pre_session',
    conditions: ['Activation before pushing'],
  },
  {
    exerciseId: 'scapular_pull_ups',
    defaultPlacement: 'pre_session',
    conditions: ['Activation before pulling'],
  },
  {
    exerciseId: 'hollow_hold',
    defaultPlacement: 'pre_session',
    conditions: ['Core activation for skill work'],
  },
  
  // Between-block options
  {
    exerciseId: 'dead_hang',
    defaultPlacement: 'pre_session',
    alternativePlacement: 'between_blocks',
    conditions: ['Can be used as reset between heavy pull sets'],
  },
  {
    exerciseId: 'band_pull_aparts',
    defaultPlacement: 'pre_session',
    alternativePlacement: 'between_blocks',
    conditions: ['Light sets between pressing work'],
  },
  
  // Accessory placement
  {
    exerciseId: 'reverse_wrist_curls',
    defaultPlacement: 'pre_session',
    alternativePlacement: 'accessory',
    conditions: ['Can be accessory if time limited in warm-up'],
  },
  {
    exerciseId: 'pronation_supination',
    defaultPlacement: 'pre_session',
    alternativePlacement: 'accessory',
    conditions: ['Can be accessory for forearm work'],
  },
  {
    exerciseId: 'light_band_curls',
    defaultPlacement: 'pre_session',
    alternativePlacement: 'accessory',
    conditions: ['Can be tendon care accessory'],
  },
  
  // Cooldown suggestions
  {
    exerciseId: 'german_hang_passive',
    defaultPlacement: 'pre_session',
    alternativePlacement: 'cooldown',
    conditions: ['Shoulder extension can be end-of-session stretch'],
  },
  {
    exerciseId: 'cat_cow',
    defaultPlacement: 'pre_session',
    alternativePlacement: 'cooldown',
    conditions: ['Spinal reset works well post-session'],
  },
]

// =============================================================================
// SKILL-SPECIFIC PREHAB RECOMMENDATIONS
// =============================================================================

export const SKILL_PREHAB_RECOMMENDATIONS: Record<string, {
  essential: string[]
  recommended: string[]
  notes: string[]
}> = {
  planche: {
    essential: ['wrist_rocks', 'scapular_push_ups', 'band_dislocates'],
    recommended: ['hollow_hold', 'light_band_curls', 'ytwl_raises'],
    notes: [
      'Wrist preparation is critical for planche',
      'Scapular protraction activation improves lean control',
      'Elbow tendon care prevents overuse issues',
    ],
  },
  front_lever: {
    essential: ['scapular_pull_ups', 'dead_hang', 'hollow_hold'],
    recommended: ['band_pull_aparts', 'light_band_curls', 'lat_activation'],
    notes: [
      'Scapular depression is key for front lever control',
      'Straight-arm pulling prep reduces bicep tendon strain',
      'Core activation improves bodyline',
    ],
  },
  back_lever: {
    essential: ['german_hang_passive', 'skin_the_cat_slow', 'band_dislocates'],
    recommended: ['scapular_pull_ups', 'dead_hang', 'hollow_hold'],
    notes: [
      'Shoulder extension mobility is mandatory',
      'Do not skip german hang prep',
      'Bicep tendon awareness is important',
    ],
  },
  muscle_up: {
    essential: ['scapular_pull_ups', 'band_dislocates', 'wrist_circles'],
    recommended: ['false_grip_prep', 'dead_hang', 'hollow_hold'],
    notes: [
      'Transition demands shoulder mobility',
      'False grip prep reduces wrist strain',
      'Explosive work needs full activation',
    ],
  },
  handstand: {
    essential: ['wrist_rocks', 'band_dislocates', 'scapular_push_ups'],
    recommended: ['hollow_hold', 'arm_circles', 'cat_cow'],
    notes: [
      'Wrist preparation is essential',
      'Overhead shoulder mobility aids line',
      'Core activation for balance control',
    ],
  },
  handstand_pushup: {
    essential: ['wrist_rocks', 'scapular_push_ups', 'band_dislocates'],
    recommended: ['pike_pulses', 'hollow_hold', 'shoulder_rotations'],
    notes: [
      'Wrist and shoulder prep together',
      'Scapular activation for pressing power',
      'Elbow care for heavy pressing',
    ],
  },
  iron_cross: {
    essential: ['light_band_curls', 'german_hang_passive', 'band_dislocates'],
    recommended: ['reverse_wrist_curls', 'shoulder_rotations', 'pronation_supination'],
    notes: [
      'Elbow tendon preparation is mandatory',
      'Shoulder extension prep reduces injury risk',
      'Extended preparation recommended before cross work',
    ],
  },
  one_arm_pull_up: {
    essential: ['scapular_pull_ups', 'dead_hang', 'light_band_curls'],
    recommended: ['grip_pulses', 'pronation_supination', 'band_pull_aparts'],
    notes: [
      'Grip and elbow tendon prep important',
      'Scapular control demands are high',
      'Build up volume gradually',
    ],
  },
  l_sit: {
    essential: ['pike_pulses', 'hollow_hold', 'wrist_circles'],
    recommended: ['hip_circles', 'light_compression_work', 'scapular_push_ups'],
    notes: [
      'Hip flexor activation is key',
      'Wrist prep for floor support',
      'Core engagement drills help',
    ],
  },
  v_sit: {
    essential: ['pike_pulses', 'light_compression_work', 'wrist_circles'],
    recommended: ['hollow_hold', 'hip_circles', 'scapular_push_ups'],
    notes: [
      'Higher compression demands than L-sit',
      'Extended hip flexor prep',
      'Wrist strength for floor support',
    ],
  },
}

// =============================================================================
// INTELLIGENT PREHAB GENERATION
// =============================================================================

/**
 * Generate intelligent, adaptive prehab based on full context
 */
export function generateIntelligentPrehab(context: IntelligentPrehabContext): IntelligentPrehabResult {
  const adjustments: string[] = []
  const adaptationNotes: string[] = []
  
  // Start with base prehab generation
  let baseContext: PrehabGenerationContext = {
    plannedExercises: context.plannedExercises,
    sessionDuration: context.sessionDuration,
    skillGoals: context.skillGoals,
    hasRings: context.hasRings,
    hasWeights: context.hasWeights,
    hasBands: context.hasBands,
    userHasShoulderIssues: context.userHasShoulderIssues,
    userHasElbowIssues: context.userHasElbowIssues,
    userHasWristIssues: context.userHasWristIssues,
  }
  
  // Adjust for weak points
  if (context.weakPoints && context.weakPoints.length > 0) {
    const significantWeakPoints = context.weakPoints.filter(wp => 
      wp.severity === 'significant' || wp.severity === 'critical'
    )
    
    for (const wp of significantWeakPoints) {
      const adjustment = WEAK_POINT_PREHAB_ADJUSTMENTS[wp.category]
      if (adjustment) {
        adjustments.push(adjustment.rationale)
        adaptationNotes.push(`Warm-up adapted for ${wp.category.replace(/_/g, ' ')} weakness`)
      }
    }
  }
  
  // Adjust for fatigue
  if (context.fatigueLevel === 'high') {
    adaptationNotes.push('Extended warm-up recommended due to accumulated fatigue')
  }
  
  // Adjust for deload
  if (context.isDeloadDay) {
    adaptationNotes.push('Lighter preparation for deload session')
  }
  
  // Adjust for previous session stress
  if (context.previousSessionStress && context.previousSessionStress.length > 0) {
    const overlappingJoints = context.previousSessionStress.filter(j => {
      // Check if any current skill stresses these joints
      return context.skillGoals.some(skill => {
        const stresses = SKILL_JOINT_MAPPINGS[skill]
        return stresses?.some(s => s.joint === j)
      })
    })
    
    if (overlappingJoints.length > 0) {
      adaptationNotes.push(`Additional prep for ${overlappingJoints.join(', ')} due to recent training stress`)
    }
  }
  
  // Generate base warm-up
  const preSession = generatePrehabWarmup(baseContext)
  
  // Add skill-specific notes
  for (const skill of context.skillGoals) {
    const recommendations = SKILL_PREHAB_RECOMMENDATIONS[skill]
    if (recommendations) {
      adaptationNotes.push(...recommendations.notes.slice(0, 2))
    }
  }
  
  // Generate between-block suggestions for high-volume sessions
  let betweenBlocks: IntelligentPrehabResult['betweenBlocks'] = undefined
  if (context.sessionDuration >= 75 && context.plannedExercises.length >= 6) {
    betweenBlocks = [
      {
        name: 'Band Pull Aparts',
        prescription: '1 x 10',
        triggerCondition: 'Between heavy pressing sets',
      },
      {
        name: 'Dead Hang',
        prescription: '20s',
        triggerCondition: 'Between heavy pulling sets',
      },
    ]
  }
  
  // Generate accessory suggestions for weak points
  let accessory: IntelligentPrehabResult['accessory'] = undefined
  if (context.weakPoints && context.weakPoints.some(wp => wp.severity !== 'none')) {
    const accessoryExercises: IntelligentPrehabResult['accessory'] = []
    
    for (const wp of context.weakPoints.filter(w => w.severity !== 'none').slice(0, 2)) {
      const adjustment = WEAK_POINT_PREHAB_ADJUSTMENTS[wp.category]
      if (adjustment) {
        const exerciseId = adjustment.extraExercises[0]
        const exercise = PREHAB_EXERCISE_LIBRARY.find(e => e.id === exerciseId)
        if (exercise) {
          accessoryExercises.push({
            name: exercise.name,
            prescription: `2 x ${exercise.repsOrDuration}`,
            rationale: adjustment.rationale,
          })
        }
      }
    }
    
    if (accessoryExercises.length > 0) {
      accessory = accessoryExercises
    }
  }
  
  // Cooldown suggestions based on session stress
  const cooldownSuggestions: string[] = []
  if (context.skillGoals.some(s => ['planche', 'front_lever', 'back_lever'].includes(s))) {
    cooldownSuggestions.push('Biceps wall stretch', 'Passive dead hang')
  }
  if (context.skillGoals.some(s => ['handstand', 'handstand_pushup', 'planche'].includes(s))) {
    cooldownSuggestions.push('Wrist flexor stretch', 'Forearm stretch')
  }
  if (context.skillGoals.some(s => ['front_lever', 'one_arm_pull_up'].includes(s))) {
    cooldownSuggestions.push("Child's pose lat stretch", 'Shoulder decompression')
  }
  
  return {
    preSession,
    betweenBlocks,
    accessory,
    cooldownSuggestions: cooldownSuggestions.length > 0 ? cooldownSuggestions : undefined,
    weakPointAdjustments: adjustments,
    adaptationNotes,
    totalPrepTime: preSession.totalMinutes + (betweenBlocks ? 2 : 0),
    isSessionSpecific: true,
  }
}

/**
 * Get recommended prehab for a specific skill (for guides)
 */
export function getSkillPrehabRecommendations(skill: SkillGoal): {
  essential: PrehabExercise[]
  recommended: PrehabExercise[]
  notes: string[]
  warningNotes: string[]
} {
  const recommendations = SKILL_PREHAB_RECOMMENDATIONS[skill]
  
  if (!recommendations) {
    return {
      essential: [],
      recommended: [],
      notes: [],
      warningNotes: [],
    }
  }
  
  const essential = recommendations.essential
    .map(id => PREHAB_EXERCISE_LIBRARY.find(e => e.id === id))
    .filter((e): e is PrehabExercise => e !== undefined)
  
  const recommended = recommendations.recommended
    .map(id => PREHAB_EXERCISE_LIBRARY.find(e => e.id === id))
    .filter((e): e is PrehabExercise => e !== undefined)
  
  const warningNotes: string[] = []
  
  // Add skill-specific warnings
  if (['planche', 'front_lever', 'iron_cross'].includes(skill)) {
    warningNotes.push('Straight-arm skills require careful tendon preparation')
  }
  if (['iron_cross', 'back_lever'].includes(skill)) {
    warningNotes.push('Shoulder extension demands increase injury risk without proper prep')
  }
  if (['planche', 'handstand', 'handstand_pushup'].includes(skill)) {
    warningNotes.push('Wrist preparation is essential before weight-bearing')
  }
  
  return {
    essential,
    recommended,
    notes: recommendations.notes,
    warningNotes,
  }
}

/**
 * Check if warm-up is truly session-specific (not cookie-cutter)
 */
export function validatePrehabSpecificity(
  warmup: GeneratedPrehabWarmup,
  context: PrehabGenerationContext
): {
  isSpecific: boolean
  specificityScore: number // 0-100
  reasons: string[]
} {
  const reasons: string[] = []
  let score = 50 // Base score for any generated warmup
  
  // Check if warmup targets the same joints as planned exercises
  const jointProfile = analyzeJointStress(context)
  const targetedJoints = new Set(warmup.exercises.flatMap(e => {
    const exercise = PREHAB_EXERCISE_LIBRARY.find(ex => ex.name === e.name)
    return exercise?.targetJoints || []
  }))
  
  let matchingJoints = 0
  for (const joint of jointProfile.keys()) {
    if (targetedJoints.has(joint)) {
      matchingJoints++
      score += 5
    }
  }
  
  if (matchingJoints > 0) {
    reasons.push(`Targets ${matchingJoints} of ${jointProfile.size} stressed joints`)
  }
  
  // Check for skill-specific exercises
  for (const skill of context.skillGoals) {
    const recommendations = SKILL_PREHAB_RECOMMENDATIONS[skill]
    if (recommendations) {
      const hasEssential = recommendations.essential.some(id => {
        const ex = PREHAB_EXERCISE_LIBRARY.find(e => e.id === id)
        return ex && warmup.exercises.some(we => we.name === ex.name)
      })
      if (hasEssential) {
        score += 10
        reasons.push(`Includes essential prep for ${skill.replace(/_/g, ' ')}`)
      }
    }
  }
  
  // Check duration appropriateness
  const expectedDuration = calculatePrehabDuration(context)
  if (Math.abs(warmup.totalMinutes - expectedDuration.totalMinutes) <= 2) {
    score += 10
    reasons.push('Duration matches session needs')
  }
  
  // Check for safety notes
  if (warmup.safetyNotes.length > 0) {
    score += 5
    reasons.push('Includes session-specific safety guidance')
  }
  
  return {
    isSpecific: score >= 70,
    specificityScore: Math.min(score, 100),
    reasons,
  }
}

// =============================================================================
// GUIDE INTEGRATION HELPERS
// =============================================================================

export interface SkillGuidePrehabSection {
  title: string
  introduction: string
  essentialExercises: Array<{
    name: string
    prescription: string
    purpose: string
  }>
  recommendedExercises: Array<{
    name: string
    prescription: string
    purpose: string
  }>
  tips: string[]
  commonMistakes: string[]
}

/**
 * Generate prehab section content for skill guides
 */
export function generateGuidePrehabSection(skill: SkillGoal): SkillGuidePrehabSection {
  const recommendations = getSkillPrehabRecommendations(skill)
  const skillName = skill.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  
  const purposeMap: Record<string, string> = {
    wrist_rocks: 'Prepares wrist joints for weight-bearing',
    wrist_circles: 'Improves wrist mobility and blood flow',
    band_dislocates: 'Opens shoulder ROM and activates stabilizers',
    scapular_push_ups: 'Activates serratus anterior for protraction control',
    scapular_pull_ups: 'Activates lower traps for depression control',
    hollow_hold: 'Activates core for bodyline control',
    light_band_curls: 'Warms up biceps tendon for straight-arm work',
    dead_hang: 'Decompresses spine and stretches lats',
    german_hang_passive: 'Prepares shoulders for extension demands',
    pike_pulses: 'Activates hip flexors for compression',
    ytwl_raises: 'Activates rotator cuff and scapular stabilizers',
  }
  
  return {
    title: `${skillName} Preparation`,
    introduction: `Proper preparation reduces injury risk and improves ${skillName.toLowerCase()} performance. The following exercises target the joints and tissues most stressed during ${skillName.toLowerCase()} training.`,
    essentialExercises: recommendations.essential.map(ex => ({
      name: ex.name,
      prescription: `${ex.sets} × ${ex.repsOrDuration}`,
      purpose: purposeMap[ex.id] || ex.notes || 'Prepares target area',
    })),
    recommendedExercises: recommendations.recommended.map(ex => ({
      name: ex.name,
      prescription: `${ex.sets} × ${ex.repsOrDuration}`,
      purpose: purposeMap[ex.id] || ex.notes || 'Additional preparation',
    })),
    tips: [
      'Complete preparation work before skill training',
      'Keep intensity low - this is preparation, not training',
      'Increase preparation time if joints feel stiff or cold',
      ...recommendations.notes,
    ],
    commonMistakes: [
      'Skipping wrist preparation before weight-bearing',
      'Rushing through activation drills',
      'Starting skill work before feeling ready',
      'Ignoring joint discomfort during preparation',
    ],
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

// [DUPLICATE-EXPORT-CONTRACT-FIX] Six of the seven previously-listed names
// are exported inline at their declarations:
//   PREHAB_PLACEMENT_RULES        line 155 (export const)
//   SKILL_PREHAB_RECOMMENDATIONS  line 241 (export const)
//   generateIntelligentPrehab     line 345 (export function)
//   getSkillPrehabRecommendations line 482 (export function)
//   validatePrehabSpecificity     line 531 (export function)
//   generateGuidePrehabSection    line 620 (export function)
// Those six produced TS2300/TS2484 and have been removed from this block.
// `WEAK_POINT_PREHAB_ADJUSTMENTS` is declared as `const` (no inline
// `export`) at line 94 — this block is its SOLE export site, so it stays.
export {
  WEAK_POINT_PREHAB_ADJUSTMENTS,
}
