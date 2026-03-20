/**
 * CANONICAL PROFILE SERVICE
 * 
 * This is the SINGLE SOURCE OF TRUTH for athlete programming profile.
 * All generation, regeneration, settings, and metric updates MUST use this.
 * 
 * DO NOT import getAthleteProfile/saveAthleteProfile from data-service directly.
 * DO NOT import getOnboardingProfile/saveOnboardingProfile from athlete-profile directly.
 * 
 * USE THIS SERVICE INSTEAD.
 */

import { getAthleteProfile, saveAthleteProfile, type AthleteProfile } from './data-service'
import { getOnboardingProfile, saveOnboardingProfile, type OnboardingProfile } from './athlete-profile'

// =============================================================================
// CANONICAL PROGRAMMING PROFILE TYPE
// =============================================================================

/**
 * The canonical profile contract for all fields that influence program generation.
 * This is the SINGLE authoritative type used by generation, settings, and metrics.
 */
export interface CanonicalProgrammingProfile {
  // Identity & Meta
  userId: string
  onboardingComplete: boolean
  
  // Goals
  primaryGoal: string | null
  secondaryGoal: string | null
  selectedSkills: string[]
  selectedFlexibility: string[]
  selectedStrength: string[]
  goalCategory: string | null
  
  // Training Preferences
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingDaysPerWeek: number | null  // null = flexible
  scheduleMode: 'static' | 'flexible'
  sessionLengthMinutes: number
  equipmentAvailable: string[]
  trainingStyle: string | null
  
  // Athlete Diagnostics
  jointCautions: string[]
  weakestArea: string | null
  primaryLimitation: string | null
  
  // Strength Benchmarks
  pullUpMax: string | null
  dipMax: string | null
  pushUpMax: string | null
  wallHSPUReps: string | null
  weightedPullUp: { addedWeight: number; reps: number } | null
  weightedDip: { addedWeight: number; reps: number } | null
  
  // Skill Benchmarks
  frontLeverProgression: string | null
  frontLeverHoldSeconds: number | null
  plancheProgression: string | null
  plancheHoldSeconds: number | null
  muscleUpReadiness: string | null
  hspuProgression: string | null
  lSitHoldSeconds: string | null
  vSitHoldSeconds: string | null
  
  // Flexibility Benchmarks
  pancakeLevel: string | null
  toeTouchLevel: string | null
  frontSplitsLevel: string | null
  sideSplitsLevel: string | null
  
  // Physical Stats (optional, for context)
  bodyweight: number | null
  height: number | null
}

// =============================================================================
// RECONCILIATION LAYER
// =============================================================================

/**
 * ONE-TIME RECONCILIATION - Merges existing user data from all known sources.
 * 
 * PRIORITY ORDER (higher = more trusted):
 * 1. Onboarding profile (most complete benchmark data)
 * 2. Athlete profile (local fallback)
 * 3. Defaults only if field is missing everywhere
 * 
 * RULES:
 * - Prefer real user-entered values over defaults
 * - NEVER overwrite existing valid values with null/default
 * - DO NOT fabricate fields
 */
export function reconcileCanonicalProfile(): CanonicalProgrammingProfile {
  const onboardingProfile = getOnboardingProfile()
  const athleteProfile = getAthleteProfile()
  
  // Log reconciliation sources for debugging
  console.log('[CanonicalProfile] Reconciling from sources:', {
    hasOnboarding: !!onboardingProfile,
    hasAthlete: !!athleteProfile,
    onboardingComplete: onboardingProfile?.onboardingComplete ?? athleteProfile?.onboardingComplete,
  })
  
  // Helper: pick first non-null/non-empty value from sources
  function pick<T>(onboardingVal: T | null | undefined, athleteVal: T | null | undefined, fallback: T): T {
    if (onboardingVal !== null && onboardingVal !== undefined) return onboardingVal
    if (athleteVal !== null && athleteVal !== undefined) return athleteVal
    return fallback
  }
  
  // Helper: pick first non-empty array
  function pickArray(onboardingVal: unknown[] | null | undefined, athleteVal: unknown[] | null | undefined): string[] {
    if (onboardingVal && Array.isArray(onboardingVal) && onboardingVal.length > 0) return onboardingVal as string[]
    if (athleteVal && Array.isArray(athleteVal) && athleteVal.length > 0) return athleteVal as string[]
    return []
  }
  
  // Build canonical profile from reconciled sources
  const canonical: CanonicalProgrammingProfile = {
    // Identity
    userId: athleteProfile?.userId || onboardingProfile?.userId || 'unknown',
    onboardingComplete: pick(onboardingProfile?.onboardingComplete, athleteProfile?.onboardingComplete, false),
    
    // Goals - prefer onboarding (more detailed)
    primaryGoal: pick(onboardingProfile?.primaryGoal, athleteProfile?.primaryGoal, null),
    secondaryGoal: pick(onboardingProfile?.secondaryGoal, (athleteProfile as unknown as { secondaryGoal?: string })?.secondaryGoal, null),
    selectedSkills: pickArray(onboardingProfile?.selectedSkills, (athleteProfile as unknown as { selectedSkills?: string[] })?.selectedSkills),
    selectedFlexibility: pickArray(onboardingProfile?.selectedFlexibility, null),
    selectedStrength: pickArray(onboardingProfile?.selectedStrength, null),
    goalCategory: pick(onboardingProfile?.goalCategory, null, null),
    
    // Training Preferences
    experienceLevel: pick(
      onboardingProfile?.trainingExperience === 'new' ? 'beginner' : 
        onboardingProfile?.trainingExperience === 'some' ? 'intermediate' : 
        onboardingProfile?.trainingExperience as 'intermediate' | 'advanced' | undefined,
      athleteProfile?.experienceLevel,
      'intermediate'
    ),
    trainingDaysPerWeek: pick(
      onboardingProfile?.scheduleMode === 'flexible' ? null : 
        typeof onboardingProfile?.trainingDaysPerWeek === 'number' ? onboardingProfile.trainingDaysPerWeek : null,
      athleteProfile?.scheduleMode === 'flexible' ? null : athleteProfile?.trainingDaysPerWeek,
      4
    ),
    scheduleMode: pick(onboardingProfile?.scheduleMode, athleteProfile?.scheduleMode, 'static'),
    sessionLengthMinutes: pick(
      onboardingProfile?.sessionLengthMinutes,
      athleteProfile?.sessionLengthMinutes,
      60
    ),
    equipmentAvailable: pickArray(
      onboardingProfile?.equipmentAvailable,
      athleteProfile?.equipmentAvailable
    ),
    trainingStyle: pick(onboardingProfile?.trainingStyle, athleteProfile?.trainingStyle, null),
    
    // Athlete Diagnostics
    jointCautions: pickArray(onboardingProfile?.jointCautions, athleteProfile?.jointCautions),
    weakestArea: pick(onboardingProfile?.weakestArea, athleteProfile?.weakestArea, null),
    primaryLimitation: pick(onboardingProfile?.primaryLimitation, null, null),
    
    // Strength Benchmarks - CRITICAL: prefer onboarding (where metrics are saved)
    pullUpMax: pick(onboardingProfile?.pullUpMax, athleteProfile?.pullUpMax?.toString(), null),
    dipMax: pick(onboardingProfile?.dipMax, athleteProfile?.dipMax?.toString(), null),
    pushUpMax: pick(onboardingProfile?.pushUpMax, null, null),
    wallHSPUReps: pick(onboardingProfile?.wallHSPUReps, null, null),
    weightedPullUp: onboardingProfile?.weightedPullUp ?? null,
    weightedDip: onboardingProfile?.weightedDip ?? null,
    
    // Skill Benchmarks - ONLY in onboarding profile
    frontLeverProgression: onboardingProfile?.frontLever?.progression ?? null,
    frontLeverHoldSeconds: onboardingProfile?.frontLever?.holdSeconds ?? null,
    plancheProgression: onboardingProfile?.planche?.progression ?? null,
    plancheHoldSeconds: onboardingProfile?.planche?.holdSeconds ?? null,
    muscleUpReadiness: onboardingProfile?.muscleUp ?? null,
    hspuProgression: onboardingProfile?.hspu?.progression ?? null,
    lSitHoldSeconds: onboardingProfile?.lSitHold ?? null,
    vSitHoldSeconds: onboardingProfile?.vSitHold ?? null,
    
    // Flexibility Benchmarks - ONLY in onboarding profile
    pancakeLevel: onboardingProfile?.pancake?.level ?? null,
    toeTouchLevel: onboardingProfile?.toeTouch?.level ?? null,
    frontSplitsLevel: onboardingProfile?.frontSplits?.level ?? null,
    sideSplitsLevel: onboardingProfile?.sideSplits?.level ?? null,
    
    // Physical Stats
    bodyweight: pick(
      typeof onboardingProfile?.bodyweight === 'number' ? onboardingProfile.bodyweight : null,
      athleteProfile?.bodyweight,
      null
    ),
    height: pick(
      typeof onboardingProfile?.height === 'number' ? onboardingProfile.height : null,
      athleteProfile?.height,
      null
    ),
  }
  
  return canonical
}

// =============================================================================
// CANONICAL READ/WRITE FUNCTIONS
// =============================================================================

/**
 * Get the canonical programming profile.
 * This is the ONLY function that should be used to read profile data for generation.
 */
export function getCanonicalProfile(): CanonicalProgrammingProfile {
  return reconcileCanonicalProfile()
}

/**
 * Save updates to the canonical profile.
 * This writes to BOTH profile stores to maintain consistency.
 * 
 * @param updates - Partial profile updates
 */
export function saveCanonicalProfile(updates: Partial<CanonicalProgrammingProfile>): void {
  console.log('[CanonicalProfile] Saving canonical updates:', Object.keys(updates))
  
  // 1. Update athlete profile (data-service)
  const athleteUpdates: Partial<AthleteProfile> = {}
  
  if (updates.primaryGoal !== undefined) athleteUpdates.primaryGoal = updates.primaryGoal
  if (updates.experienceLevel !== undefined) athleteUpdates.experienceLevel = updates.experienceLevel
  if (updates.trainingDaysPerWeek !== undefined) athleteUpdates.trainingDaysPerWeek = updates.trainingDaysPerWeek ?? 4
  if (updates.scheduleMode !== undefined) athleteUpdates.scheduleMode = updates.scheduleMode
  if (updates.sessionLengthMinutes !== undefined) athleteUpdates.sessionLengthMinutes = updates.sessionLengthMinutes as 30 | 45 | 60 | 90
  if (updates.equipmentAvailable !== undefined) athleteUpdates.equipmentAvailable = updates.equipmentAvailable as AthleteProfile['equipmentAvailable']
  if (updates.jointCautions !== undefined) athleteUpdates.jointCautions = updates.jointCautions as AthleteProfile['jointCautions']
  if (updates.weakestArea !== undefined) athleteUpdates.weakestArea = updates.weakestArea as AthleteProfile['weakestArea']
  if (updates.trainingStyle !== undefined) athleteUpdates.trainingStyle = updates.trainingStyle as AthleteProfile['trainingStyle']
  if (updates.onboardingComplete !== undefined) athleteUpdates.onboardingComplete = updates.onboardingComplete
  if (updates.bodyweight !== undefined) athleteUpdates.bodyweight = updates.bodyweight
  
  // Convert string pullUp/dip to number if needed for athlete profile
  if (updates.pullUpMax !== undefined) {
    athleteUpdates.pullUpMax = updates.pullUpMax ? parseInt(updates.pullUpMax.replace(/[^0-9]/g, '') || '0') : null
  }
  if (updates.dipMax !== undefined) {
    athleteUpdates.dipMax = updates.dipMax ? parseInt(updates.dipMax.replace(/[^0-9]/g, '') || '0') : null
  }
  
  if (Object.keys(athleteUpdates).length > 0) {
    saveAthleteProfile(athleteUpdates)
  }
  
  // 2. Update onboarding profile (athlete-profile)
  const currentOnboarding = getOnboardingProfile()
  if (currentOnboarding) {
    const onboardingUpdates: Partial<OnboardingProfile> = { ...currentOnboarding }
    
    if (updates.primaryGoal !== undefined) onboardingUpdates.primaryGoal = updates.primaryGoal
    if (updates.secondaryGoal !== undefined) onboardingUpdates.secondaryGoal = updates.secondaryGoal
    if (updates.selectedSkills !== undefined) onboardingUpdates.selectedSkills = updates.selectedSkills
    if (updates.selectedFlexibility !== undefined) onboardingUpdates.selectedFlexibility = updates.selectedFlexibility
    if (updates.selectedStrength !== undefined) onboardingUpdates.selectedStrength = updates.selectedStrength
    if (updates.goalCategory !== undefined) onboardingUpdates.goalCategory = updates.goalCategory
    if (updates.scheduleMode !== undefined) onboardingUpdates.scheduleMode = updates.scheduleMode
    if (updates.sessionLengthMinutes !== undefined) onboardingUpdates.sessionLengthMinutes = updates.sessionLengthMinutes
    if (updates.equipmentAvailable !== undefined) onboardingUpdates.equipmentAvailable = updates.equipmentAvailable
    if (updates.jointCautions !== undefined) onboardingUpdates.jointCautions = updates.jointCautions as OnboardingProfile['jointCautions']
    if (updates.weakestArea !== undefined) onboardingUpdates.weakestArea = updates.weakestArea as OnboardingProfile['weakestArea']
    if (updates.trainingStyle !== undefined) onboardingUpdates.trainingStyle = updates.trainingStyle as OnboardingProfile['trainingStyle']
    if (updates.onboardingComplete !== undefined) onboardingUpdates.onboardingComplete = updates.onboardingComplete
    
    // Strength benchmarks
    if (updates.pullUpMax !== undefined) onboardingUpdates.pullUpMax = updates.pullUpMax as OnboardingProfile['pullUpMax']
    if (updates.dipMax !== undefined) onboardingUpdates.dipMax = updates.dipMax as OnboardingProfile['dipMax']
    if (updates.pushUpMax !== undefined) onboardingUpdates.pushUpMax = updates.pushUpMax as OnboardingProfile['pushUpMax']
    if (updates.wallHSPUReps !== undefined) onboardingUpdates.wallHSPUReps = updates.wallHSPUReps as OnboardingProfile['wallHSPUReps']
    if (updates.weightedPullUp !== undefined) onboardingUpdates.weightedPullUp = updates.weightedPullUp
    if (updates.weightedDip !== undefined) onboardingUpdates.weightedDip = updates.weightedDip
    
    // Skill benchmarks
    if (updates.frontLeverProgression !== undefined || updates.frontLeverHoldSeconds !== undefined) {
      onboardingUpdates.frontLever = {
        progression: (updates.frontLeverProgression ?? currentOnboarding.frontLever?.progression ?? 'none') as OnboardingProfile['frontLever']['progression'],
        holdSeconds: updates.frontLeverHoldSeconds ?? currentOnboarding.frontLever?.holdSeconds,
      }
    }
    if (updates.plancheProgression !== undefined || updates.plancheHoldSeconds !== undefined) {
      onboardingUpdates.planche = {
        progression: (updates.plancheProgression ?? currentOnboarding.planche?.progression ?? 'none') as OnboardingProfile['planche']['progression'],
        holdSeconds: updates.plancheHoldSeconds ?? currentOnboarding.planche?.holdSeconds,
      }
    }
    if (updates.muscleUpReadiness !== undefined) {
      onboardingUpdates.muscleUp = updates.muscleUpReadiness as OnboardingProfile['muscleUp']
    }
    if (updates.hspuProgression !== undefined) {
      onboardingUpdates.hspu = {
        progression: updates.hspuProgression as OnboardingProfile['hspu']['progression'],
      }
    }
    if (updates.lSitHoldSeconds !== undefined) {
      onboardingUpdates.lSitHold = updates.lSitHoldSeconds as OnboardingProfile['lSitHold']
    }
    if (updates.vSitHoldSeconds !== undefined) {
      onboardingUpdates.vSitHold = updates.vSitHoldSeconds as OnboardingProfile['vSitHold']
    }
    
    // Flexibility benchmarks
    if (updates.pancakeLevel !== undefined) {
      onboardingUpdates.pancake = { level: updates.pancakeLevel as OnboardingProfile['pancake']['level'], rangeIntent: currentOnboarding.pancake?.rangeIntent ?? null }
    }
    if (updates.toeTouchLevel !== undefined) {
      onboardingUpdates.toeTouch = { level: updates.toeTouchLevel as OnboardingProfile['toeTouch']['level'], rangeIntent: currentOnboarding.toeTouch?.rangeIntent ?? null }
    }
    if (updates.frontSplitsLevel !== undefined) {
      onboardingUpdates.frontSplits = { level: updates.frontSplitsLevel as OnboardingProfile['frontSplits']['level'], rangeIntent: currentOnboarding.frontSplits?.rangeIntent ?? null }
    }
    if (updates.sideSplitsLevel !== undefined) {
      onboardingUpdates.sideSplits = { level: updates.sideSplitsLevel as OnboardingProfile['sideSplits']['level'], rangeIntent: currentOnboarding.sideSplits?.rangeIntent ?? null }
    }
    
    saveOnboardingProfile(onboardingUpdates as OnboardingProfile)
  }
}

// =============================================================================
// DEV DIAGNOSTIC LOGGING
// =============================================================================

/**
 * Log canonical profile state for debugging.
 * DEV ONLY - minimal output.
 */
export function logCanonicalProfileState(context: string): void {
  const profile = getCanonicalProfile()
  
  console.log(`[CanonicalProfile] ${context}:`, {
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal,
    selectedSkills: profile.selectedSkills,
    scheduleMode: profile.scheduleMode,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    benchmarksPresent: {
      pullUp: !!profile.pullUpMax,
      dip: !!profile.dipMax,
      frontLever: !!profile.frontLeverProgression,
      planche: !!profile.plancheProgression,
    },
  })
}
