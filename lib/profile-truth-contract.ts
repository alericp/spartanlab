/**
 * PROFILE TRUTH CONTRACT
 * 
 * =============================================================================
 * CANONICAL FIELD MAPPING DOCUMENTATION
 * =============================================================================
 * 
 * This file documents the SINGLE SOURCE OF TRUTH for all athlete profile data.
 * All code paths (onboarding, settings, metrics, generation) MUST use these 
 * canonical field names and flow through the canonical-profile-service.
 * 
 * RULE: selectedDurationPreference = what user chose (canonical preference)
 *       estimatedSessionDuration = computed from actual program content
 * 
 * RULE: DO NOT fabricate values. If a field is null/undefined, it means
 *       the user has not provided it yet. Use explicit defaults ONLY at
 *       the point of generation, not during persistence.
 * 
 * =============================================================================
 * FIELD MAPPING: CANONICAL NAME → OLD ALIASES / LEGACY SOURCES
 * =============================================================================
 * 
 * IDENTITY & META
 * ----------------
 * userId                    → userId, clerkId, user_id
 * onboardingComplete        → onboardingComplete, onboarding_complete
 * 
 * GOALS
 * -----
 * primaryGoal               → primaryGoal, primary_goal, primaryFocus, goal
 * secondaryGoal             → secondaryGoal, secondary_goal, secondaryFocus
 * selectedSkills            → selectedSkills, skillsToPursue, skills_to_pursue, selectedSkillGoals
 * selectedFlexibility       → selectedFlexibility, flexibilityGoals, flexibility_goals
 * selectedStrength          → selectedStrength, strengthGoals (rarely used)
 * goalCategory              → goalCategory, goal_category, trainingOutcome
 * trainingPathType          → trainingPathType, training_path_type
 * 
 * TRAINING PREFERENCES
 * --------------------
 * experienceLevel           → experienceLevel, experience_level, trainingExperience (mapped: new/some→beginner)
 * trainingDaysPerWeek       → trainingDaysPerWeek, training_days_per_week, weeklyTraining (null = flexible)
 * scheduleMode              → scheduleMode, schedule_mode ('static' | 'flexible')
 * sessionLengthMinutes      → sessionLengthMinutes, session_length_minutes, sessionLength, sessionDuration
 * sessionStylePreference    → sessionStyle, sessionStylePreference
 * equipmentAvailable        → equipmentAvailable, equipment_available, equipment
 * trainingStyle             → trainingStyle, training_style, styleMode
 * 
 * ATHLETE DIAGNOSTICS
 * -------------------
 * jointCautions             → jointCautions, joint_cautions, injuries
 * weakestArea               → weakestArea, weakest_area
 * primaryLimitation         → primaryLimitation, primary_limitation
 * 
 * STRENGTH BENCHMARKS (current)
 * -----------------------------
 * pullUpMax                 → pullUpMax, pull_up_max, pullUpCapacity
 * dipMax                    → dipMax, dip_max, dipCapacity
 * pushUpMax                 → pushUpMax, push_up_max, pushUpCapacity
 * wallHSPUReps              → wallHSPUReps, wall_hspu_reps
 * weightedPullUp            → weightedPullUp, weighted_pull_up, { addedWeight, reps, unit }
 * weightedDip               → weightedDip, weighted_dip, { addedWeight, reps, unit }
 * 
 * STRENGTH BENCHMARKS (all-time PR)
 * ---------------------------------
 * allTimePRPullUp           → allTimePRPullUp, all_time_pr_pull_up, { load, reps, timeframe, unit }
 * allTimePRDip              → allTimePRDip, all_time_pr_dip, { load, reps, timeframe, unit }
 * 
 * SKILL BENCHMARKS
 * ----------------
 * frontLeverProgression     → frontLever.progression, front_lever_progression
 * frontLeverHoldSeconds     → frontLever.holdSeconds, front_lever_hold_seconds
 * frontLeverBandLevel       → frontLever.bandLevel, front_lever_band_level (if isAssisted)
 * plancheProgression        → planche.progression, planche_progression
 * plancheHoldSeconds        → planche.holdSeconds, planche_hold_seconds
 * plancheBandLevel          → planche.bandLevel, planche_band_level (if isAssisted)
 * muscleUpReadiness         → muscleUp, muscle_up, muscleUpReadiness
 * hspuProgression           → hspu.progression, hspu_progression
 * lSitHoldSeconds           → lSitHold, l_sit_hold, lSitHoldCapacity
 * vSitHoldSeconds           → vSitHold, v_sit_hold, vSitHoldCapacity
 * 
 * SKILL TRAINING HISTORY
 * ----------------------
 * skillHistory              → skillHistory, skill_history
 *   - front_lever: { trainingHistory, lastTrained, tendonAdaptationScore, highestLevelEverReached }
 *   - planche: { trainingHistory, lastTrained, tendonAdaptationScore, highestLevelEverReached }
 *   - muscle_up: { trainingHistory, lastTrained, tendonAdaptationScore }
 *   etc.
 * 
 * FLEXIBILITY BENCHMARKS
 * ----------------------
 * pancakeLevel              → pancake.level, pancake_level
 * pancakeRangeIntent        → pancake.rangeIntent ('flexibility' | 'mobility' | 'hybrid')
 * toeTouchLevel             → toeTouch.level, toe_touch_level
 * frontSplitsLevel          → frontSplits.level, front_splits_level
 * frontSplitsRangeIntent    → frontSplits.rangeIntent
 * sideSplitsLevel           → sideSplits.level, side_splits_level
 * sideSplitsRangeIntent     → sideSplits.rangeIntent
 * 
 * PHYSICAL STATS
 * --------------
 * sex                       → sex ('male' | 'female')
 * heightRange               → heightRange, height_range (bucket like '5_7_to_5_10')
 * weightRange               → weightRange, weight_range (bucket like '160_180')
 * bodyweight                → bodyweight, body_weight (exact number if known)
 * height                    → height (exact cm if known)
 * bodyFatPercent            → bodyFatPercent, body_fat_percent
 * bodyFatRange              → bodyFatRange, body_fat_range
 * 
 * RECOVERY
 * --------
 * recoveryQuality           → recovery.quality, recovery_quality
 * sleepQuality              → recovery.sleepQuality
 * stressLevel               → recovery.stressLevel
 * 
 * READINESS CALIBRATION
 * ---------------------
 * readinessCalibration      → readinessCalibration, readiness_calibration
 *   - trainingConsistency
 *   - recoveryTolerance
 *   - strengthPerception
 *   - skillFamiliarity
 *   - bodyType
 * 
 * =============================================================================
 * DATA FLOW RULES
 * =============================================================================
 * 
 * 1. ONBOARDING SAVE:
 *    - Writes to localStorage via saveOnboardingProfile()
 *    - Writes to DB via POST /api/onboarding/profile
 *    - MUST include ALL fields entered, not a shallow subset
 * 
 * 2. SETTINGS HYDRATION:
 *    - Reads from API first: GET /api/settings
 *    - Falls back to localStorage: getAthleteProfile()
 *    - Syncs to canonical profile service
 *    - MUST NOT silently drop fields
 * 
 * 3. METRICS UPDATE:
 *    - Reads current: getCurrentMetrics() → getOnboardingProfile()
 *    - Writes via: saveMetricUpdates() → saveOnboardingProfile() + saveCanonicalProfile()
 *    - MUST write to BOTH stores for consistency
 * 
 * 4. PROGRAM GENERATION:
 *    - Reads from: getCanonicalProfile() → reconcileCanonicalProfile()
 *    - MUST NOT inject seed/default values if real values exist
 *    - Uses getValidatedCanonicalProfile() to fail-fast on missing data
 * 
 * 5. REGENERATION:
 *    - Reads from: loadAthleteContext() → getCanonicalProfile()
 *    - MUST use CURRENT profile truth, not stale program metadata
 *    - Program metadata (program.sessionLength) is historical, not preference
 * 
 * =============================================================================
 */

import { 
  getCanonicalProfile, 
  saveCanonicalProfile, 
  type CanonicalProgrammingProfile,
  logCanonicalProfileState,
} from './canonical-profile-service'

// Re-export for convenience
export { 
  getCanonicalProfile, 
  saveCanonicalProfile, 
  type CanonicalProgrammingProfile,
  logCanonicalProfileState,
}

/**
 * Log canonical profile state with extended field diagnostics.
 * Use this for debugging metrics/settings/generation alignment.
 */
export function logProfileTruthState(context: string): void {
  if (process.env.NODE_ENV === 'production') return
  
  const profile = getCanonicalProfile()
  
  console.log(`[ProfileTruth] ${context}:`, {
    // Goals
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal,
    selectedSkillsCount: profile.selectedSkills?.length || 0,
    selectedSkills: profile.selectedSkills,
    selectedFlexibility: profile.selectedFlexibility,
    
    // Schedule
    scheduleMode: profile.scheduleMode,
    sessionLengthMinutes: profile.sessionLengthMinutes,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    
    // Strength (current)
    pullUpMax: profile.pullUpMax,
    dipMax: profile.dipMax,
    pushUpMax: profile.pushUpMax,
    wallHSPUReps: profile.wallHSPUReps,
    weightedPullUp: profile.weightedPullUp,
    weightedDip: profile.weightedDip,
    
    // Skills
    frontLever: {
      progression: profile.frontLeverProgression,
      holdSeconds: profile.frontLeverHoldSeconds,
    },
    planche: {
      progression: profile.plancheProgression,
      holdSeconds: profile.plancheHoldSeconds,
    },
    muscleUpReadiness: profile.muscleUpReadiness,
    
    // Flexibility
    pancakeLevel: profile.pancakeLevel,
    frontSplitsLevel: profile.frontSplitsLevel,
    sideSplitsLevel: profile.sideSplitsLevel,
    
    // Diagnostics
    jointCautions: profile.jointCautions,
    weakestArea: profile.weakestArea,
    
    // Status
    onboardingComplete: profile.onboardingComplete,
    experienceLevel: profile.experienceLevel,
  })
}

/**
 * Check if the canonical profile has meaningful data (not just defaults).
 * Returns detailed diagnostics for debugging.
 */
export interface ProfileDataDiagnostics {
  hasCanonicalProfile: boolean
  hasStrengthBenchmarks: boolean
  hasSkillBenchmarks: boolean
  hasFlexibilityBenchmarks: boolean
  hasGoals: boolean
  hasSchedule: boolean
  hasEquipment: boolean
  missingCriticalFields: string[]
  populatedFieldCount: number
}

export function diagnoseProfileData(): ProfileDataDiagnostics {
  const profile = getCanonicalProfile()
  const missing: string[] = []
  let populated = 0
  
  // Check critical fields
  if (!profile.onboardingComplete) missing.push('onboardingComplete')
  if (!profile.primaryGoal) missing.push('primaryGoal')
  if (!profile.equipmentAvailable?.length) missing.push('equipmentAvailable')
  
  // Count populated fields
  if (profile.primaryGoal) populated++
  if (profile.secondaryGoal) populated++
  if (profile.selectedSkills?.length) populated++
  if (profile.selectedFlexibility?.length) populated++
  if (profile.pullUpMax) populated++
  if (profile.dipMax) populated++
  if (profile.pushUpMax) populated++
  if (profile.weightedPullUp) populated++
  if (profile.weightedDip) populated++
  if (profile.frontLeverProgression) populated++
  if (profile.plancheProgression) populated++
  if (profile.pancakeLevel) populated++
  if (profile.frontSplitsLevel) populated++
  if (profile.sideSplitsLevel) populated++
  if (profile.jointCautions?.length) populated++
  if (profile.weakestArea) populated++
  if (profile.equipmentAvailable?.length) populated++
  
  return {
    hasCanonicalProfile: profile.onboardingComplete,
    hasStrengthBenchmarks: !!(profile.pullUpMax || profile.dipMax || profile.weightedPullUp || profile.weightedDip),
    hasSkillBenchmarks: !!(profile.frontLeverProgression || profile.plancheProgression || profile.muscleUpReadiness),
    hasFlexibilityBenchmarks: !!(profile.pancakeLevel || profile.frontSplitsLevel || profile.sideSplitsLevel),
    hasGoals: !!(profile.primaryGoal || profile.selectedSkills?.length),
    hasSchedule: !!(profile.scheduleMode && profile.sessionLengthMinutes),
    hasEquipment: !!(profile.equipmentAvailable?.length),
    missingCriticalFields: missing,
    populatedFieldCount: populated,
  }
}
