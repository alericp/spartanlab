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
 * 
 * INTELLIGENCE INTEGRATION:
 * - Uses strength-intelligence-engine for fatigue management
 * - Applies method profiles for set/rep schemes
 * - Coordinates streetlifting movements intelligently
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
  planIntelligentHybridSession,
  checkProgressionStatus,
  DEADLIFT_CONFLICT_MAP,
  // Re-exported from strength-intelligence-engine
  type IntensityZone,
  type FatigueState,
  type StrengthMethodId,
  STRENGTH_METHOD_PROFILES,
  classifyIntensity,
  getFrequencyRecommendation,
  getFatigueBasedVolumeReduction,
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
 * Now uses intelligent fatigue-aware planning
 */
export function getHybridSessionDecision(
  dayIndex: number,
  weeklyPlan: HybridWeeklyPlan,
  plannedExercises: string[],
  hybridContext: HybridProgrammingContext,
  targetSets: number = 5
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
  
  // Select deadlift variant based on experience and modality
  const variant = selectDeadliftVariant(hybridContext)
  
  // Add deadlift to planned exercises for intelligent planning
  const exercisesWithDeadlift = [...plannedExercises, variant]
  
  // Use intelligent session planning if method is available
  if (hybridContext.strengthMethodId) {
    const intensityZone: IntensityZone = hybridContext.modality === 'streetlifting_biased' ? 'heavy' : 'moderate'
    
    const intelligentPlan = planIntelligentHybridSession(
      hybridContext,
      exercisesWithDeadlift,
      intensityZone,
      targetSets
    )
    
    // Build exclusions from intelligent plan
    const excludedByFatigue = plannedExercises.filter(
      e => !intelligentPlan.approvedExercises.includes(e)
    )
    
    // Build reductions from intelligent plan
    const reductionExercises = Object.keys(intelligentPlan.volumeReductions)
    
    // Generate intelligent explanation
    let explanation = `Deadlift day: ${variant.replace(/_/g, ' ')}.`
    if (intelligentPlan.fatigueWarnings.length > 0) {
      explanation += ` ${intelligentPlan.fatigueWarnings[0]}`
    } else {
      explanation += ` ${intelligentPlan.sessionExplanation}`
    }
    
    return {
      includeDeadlift: true,
      deadliftVariant: variant,
      excludeExercises: excludedByFatigue,
      reduceVolumeExercises: reductionExercises,
      explanation,
    }
  }
  
  // Fallback to basic conflict detection
  const exclusions = getDeadliftDayExclusions()
  const reductions = getDeadliftDayReductions()
  
  const conflictingExclusions = plannedExercises.filter(e => exclusions.includes(e))
  const conflictingReductions = plannedExercises.filter(e => reductions.includes(e))
  
  return {
    includeDeadlift: true,
    deadliftVariant: variant,
    excludeExercises: conflictingExclusions,
    reduceVolumeExercises: conflictingReductions,
    explanation: `Deadlift day: ${variant.replace(/_/g, ' ')}. ${conflictingExclusions.length} exercises excluded, ${conflictingReductions.length} exercises reduced.`,
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
 * Now includes intelligent method-aware explanations
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
  
  // Method-specific explanation if using intelligence engine
  if (context.strengthMethodId) {
    const method = STRENGTH_METHOD_PROFILES[context.strengthMethodId]
    explanations.push({
      section: 'hybrid_strength',
      title: 'Training Method',
      body: method.description,
      bulletPoints: [
        `Heavy work: ${method.repRangeDistribution.heavy}% of sets`,
        `Moderate work: ${method.repRangeDistribution.moderate}% of sets`,
        `Volume work: ${method.repRangeDistribution.volume}% of sets`,
        `Deload every ${method.deloadFrequency} weeks`,
      ],
      icon: 'target',
    })
  }
  
  // Progression explanation if available
  if (context.progressionModel) {
    const progressionDescriptions: Record<string, string> = {
      linear: 'Adding weight each session when target reps are hit.',
      wave: 'Three-week waves cycling light, medium, and heavy intensities.',
      top_set_backoff: 'One heavy top set drives adaptation, backoffs build volume.',
      double_progression: 'Building reps before adding weight for sustainable progress.',
      dip_wave: 'Streetlifting-specific wave for weighted dips.',
    }
    explanations.push({
      section: 'hybrid_strength',
      title: 'Progression Style',
      body: progressionDescriptions[context.progressionModel] || 'Progressive overload applied.',
      bulletPoints: [],
      icon: 'target',
    })
  }
  
  // Strength bias explanation if detected
  if (context.strengthBias && context.strengthBias.recommendations.length > 0) {
    explanations.push({
      section: 'hybrid_strength',
      title: 'Strength Balance',
      body: `Detected bias: ${context.strengthBias.overallBias.replace(/_/g, ' ')}.`,
      bulletPoints: context.strengthBias.recommendations,
      icon: 'shield',
    })
  }
  
  // Conflict management explanation
  if (weeklyPlan.conflictManagedDays.length > 0) {
    explanations.push({
      section: 'hybrid_strength',
      title: 'Neural Fatigue Management',
      body: 'Heavy lifts separated to preserve pulling and skill performance.',
      bulletPoints: [
        'Deadlift intensity managed to protect CNS',
        'Heavy weighted pulls and deadlift on separate days',
        'Volume adjusted to support progression without overreaching',
      ],
      icon: 'shield',
    })
  }
  
  // Add intelligent explanations if available
  if (context.intelligentExplanations && context.intelligentExplanations.length > 0) {
    for (const exp of context.intelligentExplanations.slice(0, 2)) {
      explanations.push({
        section: 'hybrid_strength',
        title: 'Programming Intelligence',
        body: exp,
        bulletPoints: [],
        icon: 'target',
      })
    }
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
  
  // ISSUE A FIX: Preserve adaptive schedule semantics with explicit null checks
  // 'flexible' mode uses 4 as working default for computation, but this is not stored
  // Only fallback to 3 when canonical value is truly absent (null/undefined)
  const resolvedDays = profile.trainingDaysPerWeek === 'flexible' 
    ? 4  // Working default for flexible, not stored as fixed
    : profile.trainingDaysPerWeek !== null && profile.trainingDaysPerWeek !== undefined
      ? profile.trainingDaysPerWeek
      : 3  // Only for truly new users
  
  // REGRESSION GUARD: primaryGoal fallback uses 'general' not 'front_lever' to avoid goal pollution
  const resolvedGoal = profile.primaryGoal || 'general'
  
  return buildHybridProgrammingContext(
    profile.hybridStrengthProfile,
    profile.equipment,
    profile.jointCautions,
    resolvedDays,
    resolvedGoal
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
  planIntelligentHybridSession,
  checkProgressionStatus,
}

// Re-export intelligence engine functions for convenience
export {
  type IntensityZone,
  type FatigueState,
  type StrengthMethodId,
  STRENGTH_METHOD_PROFILES,
  classifyIntensity,
  getFrequencyRecommendation,
  getFatigueBasedVolumeReduction,
}
