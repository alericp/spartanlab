/**
 * SpartanLab Hybrid Strength Integration Layer
 * 
 * Connects the hybrid strength engine to the program generation pipeline.
 * This is the integration point for session assembly and exercise selection.
 * 
 * INTEGRATION PHILOSOPHY:
 * - Does NOT modify core calisthenics programming
 * - Adds deadlift/hybrid exercises as SUPPLEMENTARY content
 * - Respects existing recovery and fatigue systems
 * - Provides explanation hooks for coach messaging
 */

import {
  type HybridProgrammingContext,
  type FatigueConflict,
  type DeadliftPlacement,
  type HybridExplanation,
  buildHybridProgrammingContext,
  checkDeadliftConflict,
  getDeadliftDayExclusions,
  getDeadliftDayReductions,
  recommendDeadliftPlacement,
  checkStreetliftingConflicts,
  generateDeadliftExplanation,
  DEADLIFT_CONFLICT_MAP,
} from './hybrid-strength-engine'

import {
  type HybridStrengthProfile,
  type HybridStrengthModality,
  type JointCaution,
  type EquipmentType,
  type OnboardingProfile,
  isHybridStrengthEnabled,
  getDefaultHybridStrengthProfile,
} from './athlete-profile'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Session-level hybrid decision for program assembly
 */
export interface HybridSessionDecision {
  includeDeadlift: boolean
  deadliftVariant: string | null  // 'conventional_deadlift', 'sumo_deadlift', etc.
  excludeExercises: string[]      // Exercise IDs to skip due to conflicts
  reduceVolumeExercises: string[] // Exercise IDs to reduce sets on
  explanation: string
}

/**
 * Weekly hybrid plan for multi-session coordination
 */
export interface HybridWeeklyPlan {
  deadliftDay: number | null           // Day index (0-6) where deadlift goes
  totalDeadliftSessions: number        // 0, 1, or 2
  conflictManagedDays: number[]        // Days with reduced posterior work
  weeklyExplanation: string
}

/**
 * Hybrid explanation entry for program explanation layer
 */
export interface HybridProgramExplanation {
  section: 'hybrid_strength'
  title: string
  body: string
  bulletPoints: string[]
  icon: 'dumbbell' | 'target' | 'shield'
}

// =============================================================================
// SESSION-LEVEL INTEGRATION
// =============================================================================

/**
 * Get hybrid decision for a specific session
 * Called by program builder during session assembly
 */
export function getHybridSessionDecision(
  dayIndex: number,
  weeklyPlan: HybridWeeklyPlan,
  plannedExercises: string[],
  hybridContext: HybridProgrammingContext
): HybridSessionDecision {
  // Check if this is a deadlift day
  const isDeadliftDay = weeklyPlan.deadliftDay === dayIndex
  
  if (!isDeadliftDay || !hybridContext.deadliftEligible) {
    return {
      includeDeadlift: false,
      deadliftVariant: null,
      excludeExercises: [],
      reduceVolumeExercises: [],
      explanation: 'Calisthenics-first session without barbell work.',
    }
  }
  
  // Get conflicts for planned exercises
  const exclusions = getDeadliftDayExclusions()
  const reductions = getDeadliftDayReductions()
  
  const conflictingExclusions = plannedExercises.filter(e => exclusions.includes(e))
  const conflictingReductions = plannedExercises.filter(e => reductions.includes(e))
  
  // Select deadlift variant based on experience and modality
  const variant = selectDeadliftVariant(hybridContext)
  
  return {
    includeDeadlift: true,
    deadliftVariant: variant,
    excludeExercises: conflictingExclusions,
    reduceVolumeExercises: conflictingReductions,
    explanation: `Deadlift day: ${variant.replace('_', ' ')}. ${conflictingExclusions.length} exercises excluded, ${conflictingReductions.length} exercises reduced.`,
  }
}

/**
 * Select appropriate deadlift variant based on context
 */
function selectDeadliftVariant(context: HybridProgrammingContext): string {
  // Beginners start with trap bar (more quad-dominant, easier form)
  if (context.modality === 'hybrid_light') {
    return 'trap_bar_deadlift'
  }
  
  // Streetlifting-biased users get conventional by default
  if (context.modality === 'streetlifting_biased') {
    return 'conventional_deadlift'
  }
  
  return 'conventional_deadlift'
}

// =============================================================================
// WEEKLY PLANNING
// =============================================================================

/**
 * Plan hybrid elements across the training week
 * Called once during program generation
 */
export function planHybridWeek(
  trainingDaysPerWeek: number,
  sessionTypes: string[],
  hybridContext: HybridProgrammingContext
): HybridWeeklyPlan {
  if (!hybridContext.deadliftEligible || hybridContext.weeklyDeadliftBudget === 0) {
    return {
      deadliftDay: null,
      totalDeadliftSessions: 0,
      conflictManagedDays: [],
      weeklyExplanation: 'Calisthenics-only programming this week.',
    }
  }
  
  // Get optimal placement
  const placement = recommendDeadliftPlacement(
    trainingDaysPerWeek,
    sessionTypes,
    []
  )
  
  if (!placement.recommended || placement.dayOfWeek === null) {
    return {
      deadliftDay: null,
      totalDeadliftSessions: 0,
      conflictManagedDays: [],
      weeklyExplanation: 'Could not find suitable deadlift placement this week.',
    }
  }
  
  // Day index is 0-based, placement.dayOfWeek is 1-based
  const deadliftDayIndex = placement.dayOfWeek - 1
  
  // Mark days before/after for conflict management
  const conflictManagedDays: number[] = []
  if (deadliftDayIndex > 0) conflictManagedDays.push(deadliftDayIndex - 1)
  if (deadliftDayIndex < trainingDaysPerWeek - 1) conflictManagedDays.push(deadliftDayIndex + 1)
  
  return {
    deadliftDay: deadliftDayIndex,
    totalDeadliftSessions: 1,
    conflictManagedDays,
    weeklyExplanation: `Deadlift scheduled for day ${placement.dayOfWeek}. Adjacent days have reduced posterior chain volume.`,
  }
}

// =============================================================================
// EXERCISE FILTERING
// =============================================================================

/**
 * Filter exercises to avoid conflicts on deadlift days
 */
export function filterExercisesForHybridSession(
  exercises: string[],
  decision: HybridSessionDecision
): string[] {
  return exercises.filter(e => !decision.excludeExercises.includes(e))
}

/**
 * Get volume reduction factor for exercises on hybrid days
 * Returns 1.0 for no reduction, 0.8 for 20% reduction, etc.
 */
export function getHybridVolumeReduction(
  exerciseId: string,
  decision: HybridSessionDecision
): number {
  if (decision.reduceVolumeExercises.includes(exerciseId)) {
    return 0.8 // 20% reduction
  }
  return 1.0
}

// =============================================================================
// EXPLANATION GENERATION
// =============================================================================

/**
 * Generate explanation entries for program explanation layer
 */
export function generateHybridExplanations(
  context: HybridProgrammingContext,
  weeklyPlan: HybridWeeklyPlan
): HybridProgramExplanation[] {
  const explanations: HybridProgramExplanation[] = []
  
  if (!context.isHybridEnabled) {
    return explanations
  }
  
  // Main hybrid explanation
  const deadliftExplanation = generateDeadliftExplanation(context)
  explanations.push({
    section: 'hybrid_strength',
    title: deadliftExplanation.title,
    body: deadliftExplanation.body,
    bulletPoints: deadliftExplanation.bulletPoints,
    icon: 'dumbbell',
  })
  
  // Conflict management explanation
  if (weeklyPlan.conflictManagedDays.length > 0) {
    explanations.push({
      section: 'hybrid_strength',
      title: 'Recovery Management',
      body: 'Posterior chain and neural loading managed across the week to prevent interference.',
      bulletPoints: [
        'Front lever volume reduced on adjacent days',
        'Weighted pull-up intensity moderated near deadlift',
        'Recovery windows preserved for skill work',
      ],
      icon: 'shield',
    })
  }
  
  return explanations
}

// =============================================================================
// PROFILE HELPERS
// =============================================================================

/**
 * Get hybrid context from onboarding profile
 * Safe accessor that handles missing data gracefully
 */
export function getHybridContextFromProfile(
  profile: OnboardingProfile | null
): HybridProgrammingContext {
  if (!profile) {
    return buildHybridProgrammingContext(
      null,
      [],
      [],
      3,
      'front_lever'
    )
  }
  
  return buildHybridProgrammingContext(
    profile.hybridStrengthProfile,
    profile.equipment,
    profile.jointCautions,
    profile.trainingDaysPerWeek === 'flexible' ? 4 : profile.trainingDaysPerWeek || 3,
    profile.primaryGoal || 'front_lever'
  )
}

/**
 * Check if profile has hybrid features enabled
 * Quick boolean check for UI gating
 */
export function hasHybridFeatures(profile: OnboardingProfile | null): boolean {
  if (!profile?.hybridStrengthProfile) return false
  return isHybridStrengthEnabled(profile.hybridStrengthProfile, profile.equipment)
}

// =============================================================================
// CALISTHENICS-FIRST PRESERVATION
// =============================================================================

/**
 * Ensure calisthenics skill work is never compromised by hybrid additions
 * Returns true if the skill session should be protected from hybrid interference
 */
export function shouldProtectSkillSession(
  sessionType: string,
  primaryGoal: string,
  hybridContext: HybridProgrammingContext
): boolean {
  // Always protect skill-focused sessions for skill-based goals
  const skillGoals = ['front_lever', 'planche', 'muscle_up', 'handstand_pushup', 'handstand']
  const isSkillGoal = skillGoals.includes(primaryGoal)
  const isSkillSession = sessionType.toLowerCase().includes('skill')
  
  if (isSkillGoal && isSkillSession) {
    return true
  }
  
  // Protect sessions that are explicitly skill-focused regardless of goal
  if (sessionType === 'skill' || sessionType === 'neural') {
    return true
  }
  
  return false
}

/**
 * Get maximum hybrid exercise count to preserve calisthenics emphasis
 * Returns number of barbell exercises allowed in a session
 */
export function getMaxHybridExercisesForSession(
  sessionDurationMinutes: number,
  isProtectedSkillSession: boolean
): number {
  if (isProtectedSkillSession) {
    return 0 // No hybrid exercises in protected skill sessions
  }
  
  // Short sessions: max 1 hybrid exercise
  if (sessionDurationMinutes <= 45) {
    return 1
  }
  
  // Medium sessions: max 2 hybrid exercises
  if (sessionDurationMinutes <= 75) {
    return 2
  }
  
  // Long sessions: max 2 hybrid exercises (still calisthenics-first)
  return 2
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  buildHybridProgrammingContext,
  checkDeadliftConflict,
  isHybridStrengthEnabled,
  getDefaultHybridStrengthProfile,
}
