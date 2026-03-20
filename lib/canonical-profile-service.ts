/**
 * CANONICAL PROFILE SERVICE
 * 
 * =============================================================================
 * REGRESSION GUARD: CANONICAL PROFILE IS THE ONLY SOURCE OF PROGRAMMING TRUTH
 * =============================================================================
 * 
 * This is the SINGLE SOURCE OF TRUTH for athlete programming profile.
 * All generation, regeneration, settings, and metric updates MUST use this.
 * 
 * REGRESSION PREVENTION RULES:
 * 1. DO NOT import getAthleteProfile/saveAthleteProfile from data-service directly for generation
 * 2. DO NOT import getOnboardingProfile/saveOnboardingProfile from athlete-profile directly for generation
 * 3. DO NOT add fallback logic that uses shallow/default/seed data when canonical exists
 * 4. DO NOT bypass validateProfileForGeneration() before program generation
 * 5. DO NOT modify reconcileCanonicalProfile() without understanding the priority order
 * 
 * ALLOWED COMPATIBILITY PATHS:
 * - data-service.ts may be read as a fallback layer for users who haven't completed onboarding
 * - athlete-profile.ts may be read for backward compatibility reconciliation
 * - Both are written to for consistency but are NOT the source of truth for generation
 * 
 * USE THIS SERVICE FOR ALL PROGRAMMING-RELATED READS AND WRITES.
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
  
  // Athlete Demographics
  sex: 'male' | 'female' | null
  heightRange: string | null  // e.g., '5_7_to_5_10'
  weightRange: string | null  // e.g., '160_180'
  trainingExperience: string | null  // raw onboarding value: 'new' | 'some' | 'intermediate' | 'advanced'
  
  // Goals
  primaryGoal: string | null
  secondaryGoal: string | null
  selectedSkills: string[]
  selectedFlexibility: string[]
  selectedStrength: string[]
  goalCategory: string | null
  goalCategories: string[]  // Multiple goal categories from onboarding
  trainingPathType: string | null  // 'skill_progression' | 'strength_endurance' | 'hybrid'
  primaryTrainingOutcome: string | null  // 'strength' | 'max_reps' | 'military' | 'skills' | 'endurance' | 'general_fitness'
  
  // Training Preferences
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingDaysPerWeek: number | null  // null = flexible
  scheduleMode: 'static' | 'flexible'
  sessionDurationMode: 'static' | 'adaptive'  // TASK 1A: Distinguishes fixed vs adaptive time preference
  sessionLengthMinutes: number  // Target duration bucket (30/45/60/90) even for adaptive mode
  sessionStylePreference: string | null  // 'longer_complete' | 'shorter_focused' | etc.
  equipmentAvailable: string[]
  trainingStyle: string | null
  
  // Athlete Diagnostics
  jointCautions: string[]
  weakestArea: string | null
  primaryLimitation: string | null
  
  // Strength Benchmarks (current)
  pullUpMax: string | null
  dipMax: string | null
  pushUpMax: string | null
  wallHSPUReps: string | null
  weightedPullUp: { addedWeight: number; reps: number; unit?: 'lbs' | 'kg' } | null
  weightedDip: { addedWeight: number; reps: number; unit?: 'lbs' | 'kg' } | null
  
  // Strength Benchmarks (all-time PR for rebound potential)
  allTimePRPullUp: { load: number; reps: number; timeframe: string; unit: 'lbs' | 'kg' } | null
  allTimePRDip: { load: number; reps: number; timeframe: string; unit: 'lbs' | 'kg' } | null
  
  // Skill Benchmarks (with band/history context)
  frontLeverProgression: string | null
  frontLeverHoldSeconds: number | null
  frontLeverIsAssisted: boolean
  frontLeverBandLevel: string | null  // 'yellow' | 'red' | 'black' | 'purple' | 'green'
  frontLeverHighestEver: string | null  // Historical peak for reacquisition
  
  plancheProgression: string | null
  plancheHoldSeconds: number | null
  plancheIsAssisted: boolean
  plancheBandLevel: string | null
  plancheHighestEver: string | null
  
  muscleUpReadiness: string | null
  hspuProgression: string | null
  lSitHoldSeconds: string | null
  vSitHoldSeconds: string | null
  
  // Skill Training History (for tendon adaptation)
  skillHistory: {
    front_lever?: { trainingHistory: string; lastTrained: string | null; tendonAdaptationScore: string }
    planche?: { trainingHistory: string; lastTrained: string | null; tendonAdaptationScore: string }
    muscle_up?: { trainingHistory: string; lastTrained: string | null; tendonAdaptationScore: string }
    handstand_pushup?: { trainingHistory: string; lastTrained: string | null; tendonAdaptationScore: string }
  }
  
  // Flexibility Benchmarks (with range intent)
  pancakeLevel: string | null
  pancakeRangeIntent: string | null  // 'flexibility' | 'mobility' | 'hybrid'
  toeTouchLevel: string | null
  toeTouchRangeIntent: string | null
  frontSplitsLevel: string | null
  frontSplitsRangeIntent: string | null
  sideSplitsLevel: string | null
  sideSplitsRangeIntent: string | null
  
  // Physical Stats (optional, for context)
  bodyweight: number | null
  height: number | null
  
  // Recovery context
  recoveryQuality: string | null
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
    
    // Athlete Demographics - CRITICAL: preserve from onboarding
    sex: onboardingProfile?.sex ?? null,
    heightRange: onboardingProfile?.heightRange ?? null,
    weightRange: onboardingProfile?.weightRange ?? null,
    trainingExperience: onboardingProfile?.trainingExperience ?? null,
    
    // Goals - prefer onboarding (more detailed)
    primaryGoal: pick(onboardingProfile?.primaryGoal, athleteProfile?.primaryGoal, null),
    secondaryGoal: pick(onboardingProfile?.secondaryGoal, (athleteProfile as unknown as { secondaryGoal?: string })?.secondaryGoal, null),
    selectedSkills: pickArray(onboardingProfile?.selectedSkills, (athleteProfile as unknown as { selectedSkills?: string[] })?.selectedSkills),
    selectedFlexibility: pickArray(onboardingProfile?.selectedFlexibility, null),
    selectedStrength: pickArray(onboardingProfile?.selectedStrength, null),
    goalCategory: pick(onboardingProfile?.goalCategory, null, null),
    goalCategories: pickArray(onboardingProfile?.goalCategories, null),
    trainingPathType: onboardingProfile?.trainingPathType ?? null,
    primaryTrainingOutcome: onboardingProfile?.primaryTrainingOutcome ?? null,
    
    // Training Preferences
    // TASK 1B: NO FALLBACKS - use null if missing (validation catches this)
    experienceLevel: pick(
      onboardingProfile?.trainingExperience === 'new' ? 'beginner' : 
        onboardingProfile?.trainingExperience === 'some' ? 'intermediate' : 
        onboardingProfile?.trainingExperience as 'intermediate' | 'advanced' | undefined,
      athleteProfile?.experienceLevel,
      'beginner'  // Safe default only for new users, not override
    ),
    trainingDaysPerWeek: pick(
      onboardingProfile?.scheduleMode === 'flexible' ? null : 
        typeof onboardingProfile?.trainingDaysPerWeek === 'number' ? onboardingProfile.trainingDaysPerWeek : null,
      athleteProfile?.scheduleMode === 'flexible' ? null : athleteProfile?.trainingDaysPerWeek,
      null  // TASK 1B: null = no fallback, validation catches
    ),
    scheduleMode: pick(onboardingProfile?.scheduleMode, athleteProfile?.scheduleMode, 'flexible'),  // Default flexible for new users
    // TASK 1A: Session duration mode - 'static' = fixed duration, 'adaptive' = engine adapts based on recovery
    // Currently defaults to 'static' for backward compatibility
    sessionDurationMode: pick(
      (onboardingProfile as unknown as { sessionDurationMode?: 'static' | 'adaptive' })?.sessionDurationMode,
      (athleteProfile as unknown as { sessionDurationMode?: 'static' | 'adaptive' })?.sessionDurationMode,
      'static'  // Default to static for backward compatibility
    ),
    sessionLengthMinutes: pick(
      onboardingProfile?.sessionLengthMinutes,
      athleteProfile?.sessionLengthMinutes,
      45  // Reasonable default for new users
    ),
    sessionStylePreference: onboardingProfile?.sessionStyle ?? null,
    equipmentAvailable: pickArray(
      onboardingProfile?.equipment,
      athleteProfile?.equipmentAvailable
    ),
    trainingStyle: pick(onboardingProfile?.trainingStyle, athleteProfile?.trainingStyle, null),
    
    // Athlete Diagnostics
    jointCautions: pickArray(onboardingProfile?.jointCautions, athleteProfile?.jointCautions),
    weakestArea: pick(onboardingProfile?.weakestArea, athleteProfile?.weakestArea, null),
    primaryLimitation: pick(onboardingProfile?.primaryLimitation, null, null),
    
    // Strength Benchmarks (current) - CRITICAL: prefer onboarding (where metrics are saved)
    pullUpMax: pick(onboardingProfile?.pullUpMax, athleteProfile?.pullUpMax?.toString(), null),
    dipMax: pick(onboardingProfile?.dipMax, athleteProfile?.dipMax?.toString(), null),
    pushUpMax: pick(onboardingProfile?.pushUpMax, null, null),
    wallHSPUReps: pick(onboardingProfile?.wallHSPUReps, null, null),
    weightedPullUp: onboardingProfile?.weightedPullUp ? {
      addedWeight: onboardingProfile.weightedPullUp.load ?? onboardingProfile.weightedPullUp.addedWeight ?? 0,
      reps: onboardingProfile.weightedPullUp.reps ?? 1,
      unit: onboardingProfile.weightedPullUp.unit ?? 'lbs',
    } : null,
    weightedDip: onboardingProfile?.weightedDip ? {
      addedWeight: onboardingProfile.weightedDip.load ?? onboardingProfile.weightedDip.addedWeight ?? 0,
      reps: onboardingProfile.weightedDip.reps ?? 1,
      unit: onboardingProfile.weightedDip.unit ?? 'lbs',
    } : null,
    
    // Strength Benchmarks (all-time PR) - for rebound potential
    allTimePRPullUp: onboardingProfile?.allTimePRPullUp ? {
      load: onboardingProfile.allTimePRPullUp.load ?? 0,
      reps: onboardingProfile.allTimePRPullUp.reps ?? 1,
      timeframe: onboardingProfile.allTimePRPullUp.timeframe ?? 'over_2_years',
      unit: onboardingProfile.allTimePRPullUp.unit ?? 'lbs',
    } : null,
    allTimePRDip: onboardingProfile?.allTimePRDip ? {
      load: onboardingProfile.allTimePRDip.load ?? 0,
      reps: onboardingProfile.allTimePRDip.reps ?? 1,
      timeframe: onboardingProfile.allTimePRDip.timeframe ?? 'over_2_years',
      unit: onboardingProfile.allTimePRDip.unit ?? 'lbs',
    } : null,
    
    // Skill Benchmarks - ONLY in onboarding profile (with band/history context)
    frontLeverProgression: onboardingProfile?.frontLever?.progression ?? null,
    frontLeverHoldSeconds: onboardingProfile?.frontLever?.holdSeconds ?? null,
    frontLeverIsAssisted: onboardingProfile?.frontLever?.isAssisted ?? false,
    frontLeverBandLevel: onboardingProfile?.frontLever?.bandLevel ?? null,
    frontLeverHighestEver: onboardingProfile?.frontLever?.highestLevelEverReached ?? null,
    
    plancheProgression: onboardingProfile?.planche?.progression ?? null,
    plancheHoldSeconds: onboardingProfile?.planche?.holdSeconds ?? null,
    plancheIsAssisted: onboardingProfile?.planche?.isAssisted ?? false,
    plancheBandLevel: onboardingProfile?.planche?.bandLevel ?? null,
    plancheHighestEver: onboardingProfile?.planche?.highestLevelEverReached ?? null,
    
    muscleUpReadiness: onboardingProfile?.muscleUp ?? null,
    hspuProgression: onboardingProfile?.hspu?.progression ?? null,
    lSitHoldSeconds: onboardingProfile?.lSitHold ?? null,
    vSitHoldSeconds: onboardingProfile?.vSitHold ?? null,
    
    // Skill Training History - for tendon adaptation
    skillHistory: {
      front_lever: onboardingProfile?.skillHistory?.front_lever ? {
        trainingHistory: onboardingProfile.skillHistory.front_lever.trainingHistory,
        lastTrained: onboardingProfile.skillHistory.front_lever.lastTrained,
        tendonAdaptationScore: onboardingProfile.skillHistory.front_lever.tendonAdaptationScore,
      } : undefined,
      planche: onboardingProfile?.skillHistory?.planche ? {
        trainingHistory: onboardingProfile.skillHistory.planche.trainingHistory,
        lastTrained: onboardingProfile.skillHistory.planche.lastTrained,
        tendonAdaptationScore: onboardingProfile.skillHistory.planche.tendonAdaptationScore,
      } : undefined,
      muscle_up: onboardingProfile?.skillHistory?.muscle_up ? {
        trainingHistory: onboardingProfile.skillHistory.muscle_up.trainingHistory,
        lastTrained: onboardingProfile.skillHistory.muscle_up.lastTrained,
        tendonAdaptationScore: onboardingProfile.skillHistory.muscle_up.tendonAdaptationScore,
      } : undefined,
      handstand_pushup: onboardingProfile?.skillHistory?.handstand_pushup ? {
        trainingHistory: onboardingProfile.skillHistory.handstand_pushup.trainingHistory,
        lastTrained: onboardingProfile.skillHistory.handstand_pushup.lastTrained,
        tendonAdaptationScore: onboardingProfile.skillHistory.handstand_pushup.tendonAdaptationScore,
      } : undefined,
    },
    
    // Flexibility Benchmarks - with range intent
    pancakeLevel: onboardingProfile?.pancake?.level ?? null,
    pancakeRangeIntent: onboardingProfile?.pancake?.rangeIntent ?? null,
    toeTouchLevel: onboardingProfile?.toeTouch?.level ?? null,
    toeTouchRangeIntent: onboardingProfile?.toeTouch?.rangeIntent ?? null,
    frontSplitsLevel: onboardingProfile?.frontSplits?.level ?? null,
    frontSplitsRangeIntent: onboardingProfile?.frontSplits?.rangeIntent ?? null,
    sideSplitsLevel: onboardingProfile?.sideSplits?.level ?? null,
    sideSplitsRangeIntent: onboardingProfile?.sideSplits?.rangeIntent ?? null,
    
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
    
    // Recovery context
    recoveryQuality: onboardingProfile?.recovery?.quality ?? null,
  }
  
  // DEV LOGGING: Log key fields to verify reconciliation
  if (process.env.NODE_ENV !== 'production') {
    console.log('[CanonicalProfile] Reconciled profile summary:', {
      primaryGoal: canonical.primaryGoal,
      secondaryGoal: canonical.secondaryGoal,
      selectedSkills: canonical.selectedSkills,
      selectedFlexibility: canonical.selectedFlexibility,
      scheduleMode: canonical.scheduleMode,
      sessionLengthMinutes: canonical.sessionLengthMinutes,
      experienceLevel: canonical.experienceLevel,
      weightedPullUp: canonical.weightedPullUp,
      weightedDip: canonical.weightedDip,
      allTimePRPullUp: canonical.allTimePRPullUp,
      allTimePRDip: canonical.allTimePRDip,
      frontLeverProgression: canonical.frontLeverProgression,
      frontLeverBandLevel: canonical.frontLeverBandLevel,
      plancheProgression: canonical.plancheProgression,
      plancheBandLevel: canonical.plancheBandLevel,
      frontSplitsLevel: canonical.frontSplitsLevel,
      sideSplitsLevel: canonical.sideSplitsLevel,
      jointCautions: canonical.jointCautions,
    })
  }
  
  return canonical
}

// =============================================================================
// PROFILE VALIDATION (TASK 3 & 9)
// =============================================================================

export interface ProfileValidationResult {
  isValid: boolean
  hasRequiredData: boolean
  missingFields: string[]
  warnings: string[]
}

/**
 * Validate that profile has required data for program generation.
 * TASK 3: Fail explicitly if data missing, NOT silently fallback.
 */
export function validateProfileForGeneration(profile: CanonicalProgrammingProfile): ProfileValidationResult {
  const missingFields: string[] = []
  const warnings: string[] = []
  
  // CRITICAL: Primary goal is absolutely required
  if (!profile.primaryGoal) {
    missingFields.push('primaryGoal')
  }
  
  // CRITICAL: Must have onboarding complete
  if (!profile.onboardingComplete) {
    missingFields.push('onboardingComplete')
  }
  
  // Required: At least some skills or goals selected
  if (!profile.selectedSkills?.length && !profile.selectedFlexibility?.length && !profile.selectedStrength?.length) {
    missingFields.push('selectedSkills/selectedFlexibility/selectedStrength')
  }
  
  // Required: Equipment available
  if (!profile.equipmentAvailable?.length) {
    missingFields.push('equipmentAvailable')
  }
  
  // Warnings (not fatal but should be addressed)
  if (!profile.pullUpMax && !profile.dipMax && !profile.pushUpMax) {
    warnings.push('No strength benchmarks set - using estimation mode')
  }
  
  if (!profile.frontLeverProgression && !profile.plancheProgression && !profile.hspuProgression) {
    warnings.push('No skill progressions set - using default progressions')
  }
  
  const hasRequiredData = missingFields.length === 0
  
  console.log('[CanonicalProfile] Validation result:', {
    isValid: hasRequiredData,
    missingFields,
    warnings,
  })
  
  return {
    isValid: hasRequiredData,
    hasRequiredData,
    missingFields,
    warnings,
  }
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
 * Get canonical profile with validation.
 * TASK 3: Returns null if profile data is incomplete.
 * Use this for program generation to prevent seed/default pollution.
 */
export function getValidatedCanonicalProfile(): CanonicalProgrammingProfile | null {
  const profile = reconcileCanonicalProfile()
  const validation = validateProfileForGeneration(profile)
  
  if (!validation.isValid) {
    console.error('[CanonicalProfile] Profile validation failed:', validation.missingFields)
    return null
  }
  
  return profile
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
  // TASK 1A: sessionDurationMode - store in athlete profile for downstream consumption
  if (updates.sessionDurationMode !== undefined) {
    (athleteUpdates as any).sessionDurationMode = updates.sessionDurationMode
  }
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
    // TASK 1A: sessionDurationMode - sync to onboarding profile
    if (updates.sessionDurationMode !== undefined) {
      (onboardingUpdates as any).sessionDurationMode = updates.sessionDurationMode
    }
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
    
    // All-time PR benchmarks
    if (updates.allTimePRPullUp !== undefined) {
      onboardingUpdates.allTimePRPullUp = updates.allTimePRPullUp as OnboardingProfile['allTimePRPullUp']
    }
    if (updates.allTimePRDip !== undefined) {
      onboardingUpdates.allTimePRDip = updates.allTimePRDip as OnboardingProfile['allTimePRDip']
    }
    
    // Skill benchmarks (with band/history context)
    if (updates.frontLeverProgression !== undefined || updates.frontLeverHoldSeconds !== undefined || 
        updates.frontLeverIsAssisted !== undefined || updates.frontLeverBandLevel !== undefined ||
        updates.frontLeverHighestEver !== undefined) {
      onboardingUpdates.frontLever = {
        progression: (updates.frontLeverProgression ?? currentOnboarding.frontLever?.progression ?? 'none') as OnboardingProfile['frontLever']['progression'],
        holdSeconds: updates.frontLeverHoldSeconds ?? currentOnboarding.frontLever?.holdSeconds,
        isAssisted: updates.frontLeverIsAssisted ?? currentOnboarding.frontLever?.isAssisted,
        bandLevel: (updates.frontLeverBandLevel ?? currentOnboarding.frontLever?.bandLevel) as OnboardingProfile['frontLever']['bandLevel'],
        highestLevelEverReached: updates.frontLeverHighestEver ?? currentOnboarding.frontLever?.highestLevelEverReached,
      }
    }
    if (updates.plancheProgression !== undefined || updates.plancheHoldSeconds !== undefined ||
        updates.plancheIsAssisted !== undefined || updates.plancheBandLevel !== undefined ||
        updates.plancheHighestEver !== undefined) {
      onboardingUpdates.planche = {
        progression: (updates.plancheProgression ?? currentOnboarding.planche?.progression ?? 'none') as OnboardingProfile['planche']['progression'],
        holdSeconds: updates.plancheHoldSeconds ?? currentOnboarding.planche?.holdSeconds,
        isAssisted: updates.plancheIsAssisted ?? currentOnboarding.planche?.isAssisted,
        bandLevel: (updates.plancheBandLevel ?? currentOnboarding.planche?.bandLevel) as OnboardingProfile['planche']['bandLevel'],
        highestLevelEverReached: updates.plancheHighestEver ?? currentOnboarding.planche?.highestLevelEverReached,
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
    
    // Flexibility benchmarks (with range intent)
    if (updates.pancakeLevel !== undefined || updates.pancakeRangeIntent !== undefined) {
      onboardingUpdates.pancake = { 
        level: (updates.pancakeLevel ?? currentOnboarding.pancake?.level ?? 'unknown') as OnboardingProfile['pancake']['level'], 
        rangeIntent: (updates.pancakeRangeIntent ?? currentOnboarding.pancake?.rangeIntent ?? null) as OnboardingProfile['pancake']['rangeIntent'],
      }
    }
    if (updates.toeTouchLevel !== undefined || updates.toeTouchRangeIntent !== undefined) {
      onboardingUpdates.toeTouch = { 
        level: (updates.toeTouchLevel ?? currentOnboarding.toeTouch?.level ?? 'unknown') as OnboardingProfile['toeTouch']['level'], 
        rangeIntent: (updates.toeTouchRangeIntent ?? currentOnboarding.toeTouch?.rangeIntent ?? null) as OnboardingProfile['toeTouch']['rangeIntent'],
      }
    }
    if (updates.frontSplitsLevel !== undefined || updates.frontSplitsRangeIntent !== undefined) {
      onboardingUpdates.frontSplits = { 
        level: (updates.frontSplitsLevel ?? currentOnboarding.frontSplits?.level ?? 'unknown') as OnboardingProfile['frontSplits']['level'], 
        rangeIntent: (updates.frontSplitsRangeIntent ?? currentOnboarding.frontSplits?.rangeIntent ?? null) as OnboardingProfile['frontSplits']['rangeIntent'],
      }
    }
    if (updates.sideSplitsLevel !== undefined || updates.sideSplitsRangeIntent !== undefined) {
      onboardingUpdates.sideSplits = { 
        level: (updates.sideSplitsLevel ?? currentOnboarding.sideSplits?.level ?? 'unknown') as OnboardingProfile['sideSplits']['level'], 
        rangeIntent: (updates.sideSplitsRangeIntent ?? currentOnboarding.sideSplits?.rangeIntent ?? null) as OnboardingProfile['sideSplits']['rangeIntent'],
      }
    }
    
    // Goal categories and training path
    if (updates.goalCategories !== undefined) onboardingUpdates.goalCategories = updates.goalCategories as OnboardingProfile['goalCategories']
    if (updates.trainingPathType !== undefined) onboardingUpdates.trainingPathType = updates.trainingPathType as OnboardingProfile['trainingPathType']
    if (updates.primaryTrainingOutcome !== undefined) onboardingUpdates.primaryTrainingOutcome = updates.primaryTrainingOutcome as OnboardingProfile['primaryTrainingOutcome']
    
    // Demographics
    if (updates.sex !== undefined) onboardingUpdates.sex = updates.sex
    if (updates.heightRange !== undefined) onboardingUpdates.heightRange = updates.heightRange as OnboardingProfile['heightRange']
    if (updates.weightRange !== undefined) onboardingUpdates.weightRange = updates.weightRange as OnboardingProfile['weightRange']
    if (updates.trainingExperience !== undefined) onboardingUpdates.trainingExperience = updates.trainingExperience as OnboardingProfile['trainingExperience']
    
    // Session style
    if (updates.sessionStylePreference !== undefined) onboardingUpdates.sessionStyle = updates.sessionStylePreference as OnboardingProfile['sessionStyle']
    
    saveOnboardingProfile(onboardingUpdates as OnboardingProfile)
    
    // DEV LOGGING: Confirm save
    if (process.env.NODE_ENV !== 'production') {
      console.log('[CanonicalProfile] Saved updates to onboarding profile:', Object.keys(updates).length, 'fields')
    }
  }
}

// =============================================================================
// PROGRAM STALENESS DETECTION (TASK 6)
// =============================================================================

/**
 * Profile snapshot type - matches the structure saved in program.profileSnapshot
 */
export interface ProfileSnapshot {
  snapshotId: string
  createdAt: string
  primaryGoal: string | null
  secondaryGoal: string | null
  experienceLevel: string
  trainingDaysPerWeek: number | null
  sessionLengthMinutes: number
  scheduleMode: 'static' | 'flexible'
  equipmentAvailable: string[]
  jointCautions: string[]
  selectedSkills: string[]
}

/**
 * Staleness check result
 */
export interface StalenessCheckResult {
  isStale: boolean
  staleDegree: 'none' | 'minor' | 'significant'
  changedFields: string[]
  recommendation: 'continue' | 'suggest_regenerate' | 'recommend_regenerate'
}

/**
 * GENERATION-CRITICAL FIELDS - changes to these make program stale
 * Minor changes: suggest regenerate but don't force it
 * Significant changes: recommend regenerate
 */
const CRITICAL_FIELDS_SIGNIFICANT = [
  'primaryGoal',
  'secondaryGoal',  // TASK 3: Secondary goal changes should trigger staleness
  'selectedSkills',
  'scheduleMode',
  'trainingDaysPerWeek',
] as const

const CRITICAL_FIELDS_MINOR = [
  'secondaryGoal',
  'sessionLengthMinutes',
  'experienceLevel',
  'equipmentAvailable',
  'jointCautions',
] as const

/**
 * Check if the active program is stale relative to current canonical profile.
 * 
 * TASK 6: Detects when profile truth has drifted from the profile snapshot
 * that was used to generate the active program.
 * 
 * @param programSnapshot - The profileSnapshot from the active program
 * @returns Staleness check result with recommendation
 */
export function checkProgramStaleness(programSnapshot: ProfileSnapshot | undefined | null): StalenessCheckResult {
  // If no snapshot, we can't determine staleness - treat as not stale
  if (!programSnapshot) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[CanonicalProfile] No program snapshot - cannot check staleness')
    }
    return {
      isStale: false,
      staleDegree: 'none',
      changedFields: [],
      recommendation: 'continue',
    }
  }
  
  const currentProfile = getCanonicalProfile()
  const changedFields: string[] = []
  let hasSignificantChange = false
  let hasMinorChange = false
  
  // Check significant fields
  if (currentProfile.primaryGoal !== programSnapshot.primaryGoal) {
    changedFields.push('primaryGoal')
    hasSignificantChange = true
  }
  
  // Compare selectedSkills arrays
  const currentSkills = currentProfile.selectedSkills || []
  const snapshotSkills = programSnapshot.selectedSkills || []
  if (currentSkills.length !== snapshotSkills.length || 
      !currentSkills.every(s => snapshotSkills.includes(s))) {
    changedFields.push('selectedSkills')
    hasSignificantChange = true
  }
  
  if (currentProfile.scheduleMode !== programSnapshot.scheduleMode) {
    changedFields.push('scheduleMode')
    hasSignificantChange = true
  }
  
  // For static schedule users, check trainingDaysPerWeek
  if (currentProfile.scheduleMode === 'static' && 
      currentProfile.trainingDaysPerWeek !== programSnapshot.trainingDaysPerWeek) {
    changedFields.push('trainingDaysPerWeek')
    hasSignificantChange = true
  }
  
  // Check minor fields
  if (currentProfile.secondaryGoal !== programSnapshot.secondaryGoal) {
    changedFields.push('secondaryGoal')
    hasMinorChange = true
  }
  
  if (currentProfile.sessionLengthMinutes !== programSnapshot.sessionLengthMinutes) {
    changedFields.push('sessionLengthMinutes')
    hasMinorChange = true
  }
  
  if (currentProfile.experienceLevel !== programSnapshot.experienceLevel) {
    changedFields.push('experienceLevel')
    hasMinorChange = true
  }
  
  // Compare equipment arrays
  const currentEquipment = currentProfile.equipmentAvailable || []
  const snapshotEquipment = programSnapshot.equipmentAvailable || []
  if (currentEquipment.length !== snapshotEquipment.length || 
      !currentEquipment.every(e => snapshotEquipment.includes(e))) {
    changedFields.push('equipmentAvailable')
    hasMinorChange = true
  }
  
  // Compare joint cautions arrays
  const currentCautions = currentProfile.jointCautions || []
  const snapshotCautions = programSnapshot.jointCautions || []
  if (currentCautions.length !== snapshotCautions.length || 
      !currentCautions.every(c => snapshotCautions.includes(c))) {
    changedFields.push('jointCautions')
    hasMinorChange = true
  }
  
  // Determine staleness level
  const isStale = hasSignificantChange || hasMinorChange
  const staleDegree = hasSignificantChange ? 'significant' : hasMinorChange ? 'minor' : 'none'
  const recommendation = hasSignificantChange 
    ? 'recommend_regenerate' 
    : hasMinorChange 
      ? 'suggest_regenerate' 
      : 'continue'
  
  if (process.env.NODE_ENV !== 'production' && isStale) {
    console.log('[CanonicalProfile] Program staleness detected:', {
      staleDegree,
      changedFields,
      recommendation,
    })
  }
  
  return {
    isStale,
    staleDegree,
    changedFields,
    recommendation,
  }
}

/**
 * Clear canonical profile data (for Clear All functionality).
 * 
 * TASK 2: This clears onboarding/profile selections but:
 * - DOES NOT clear workout history
 * - DOES NOT clear completed sessions
 * - DOES NOT clear archived programs
 * 
 * If an active program exists, it becomes stale but is NOT deleted.
 */
export function clearCanonicalProfileData(): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[CanonicalProfile] Clearing canonical profile data (Clear All)')
  }
  
  // Clear onboarding profile
  if (typeof window !== 'undefined') {
    localStorage.removeItem('spartanlab_onboarding_profile')
  }
  
  // Clear athlete profile (data-service)
  const emptyAthlete: Partial<AthleteProfile> = {
    onboardingComplete: false,
    primaryGoal: null,
    experienceLevel: 'beginner',
    trainingDaysPerWeek: 4,
    sessionLengthMinutes: 60,
    scheduleMode: 'flexible',
    equipmentAvailable: [],
    jointCautions: [],
    weakestArea: null,
    trainingStyle: null,
    pullUpMax: null,
    dipMax: null,
    bodyweight: null,
  }
  saveAthleteProfile(emptyAthlete)
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('[CanonicalProfile] Clear All completed - profile data cleared, workout history preserved')
  }
}

// =============================================================================
// DEV DIAGNOSTIC LOGGING
// =============================================================================

/**
 * Log canonical profile state for debugging.
 * DEV ONLY - comprehensive output for benchmark truth verification.
 * TASK 8: Enhanced to log ALL key fields driving program generation
 */
export function logCanonicalProfileState(context: string): void {
  if (process.env.NODE_ENV === 'production') return
  
  const profile = getCanonicalProfile()
  
  console.log(`[CanonicalProfile] ${context}:`, {
    // Goals
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal,
    selectedSkills: profile.selectedSkills || [],
    selectedFlexibility: profile.selectedFlexibility || [],
    goalCategories: profile.goalCategories || [],
    trainingPathType: profile.trainingPathType,
    
    // Schedule
    scheduleMode: profile.scheduleMode,
    sessionLengthMinutes: profile.sessionLengthMinutes,
    sessionDurationMode: profile.sessionDurationMode,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    experienceLevel: profile.experienceLevel,
    
    // STRENGTH BENCHMARKS - current
    strengthBenchmarks: {
      pullUpMax: profile.pullUpMax || 'not set',
      dipMax: profile.dipMax || 'not set',
      pushUpMax: profile.pushUpMax || 'not set',
      wallHSPUReps: profile.wallHSPUReps || 'not set',
      weightedPullUp: profile.weightedPullUp 
        ? `${profile.weightedPullUp.addedWeight}${profile.weightedPullUp.unit || 'lbs'} x ${profile.weightedPullUp.reps}`
        : 'not set',
      weightedDip: profile.weightedDip 
        ? `${profile.weightedDip.addedWeight}${profile.weightedDip.unit || 'lbs'} x ${profile.weightedDip.reps}`
        : 'not set',
    },
    
    // STRENGTH BENCHMARKS - all-time PR (for rebound potential)
    allTimePR: {
      pullUp: profile.allTimePRPullUp 
        ? `${profile.allTimePRPullUp.load}${profile.allTimePRPullUp.unit} x ${profile.allTimePRPullUp.reps} (${profile.allTimePRPullUp.timeframe})`
        : 'not set',
      dip: profile.allTimePRDip 
        ? `${profile.allTimePRDip.load}${profile.allTimePRDip.unit} x ${profile.allTimePRDip.reps} (${profile.allTimePRDip.timeframe})`
        : 'not set',
    },
    
    // SKILL BENCHMARKS - with band/history context
    skillBenchmarks: {
      frontLever: {
        progression: profile.frontLeverProgression || 'not set',
        holdSeconds: profile.frontLeverHoldSeconds || 'not set',
        isAssisted: profile.frontLeverIsAssisted,
        bandLevel: profile.frontLeverBandLevel || 'not set',
        highestEver: profile.frontLeverHighestEver || 'not set',
      },
      planche: {
        progression: profile.plancheProgression || 'not set',
        holdSeconds: profile.plancheHoldSeconds || 'not set',
        isAssisted: profile.plancheIsAssisted,
        bandLevel: profile.plancheBandLevel || 'not set',
        highestEver: profile.plancheHighestEver || 'not set',
      },
      hspu: profile.hspuProgression || 'not set',
      muscleUp: profile.muscleUpReadiness || 'not set',
      lSit: profile.lSitHoldSeconds || 'not set',
      vSit: profile.vSitHoldSeconds || 'not set',
    },
    
    // FLEXIBILITY BENCHMARKS - with range intent
    flexibilityBenchmarks: {
      pancake: profile.pancakeLevel 
        ? { level: profile.pancakeLevel, rangeIntent: profile.pancakeRangeIntent }
        : 'not set',
      toeTouch: profile.toeTouchLevel 
        ? { level: profile.toeTouchLevel, rangeIntent: profile.toeTouchRangeIntent }
        : 'not set',
      frontSplits: profile.frontSplitsLevel 
        ? { level: profile.frontSplitsLevel, rangeIntent: profile.frontSplitsRangeIntent }
        : 'not set',
      sideSplits: profile.sideSplitsLevel 
        ? { level: profile.sideSplitsLevel, rangeIntent: profile.sideSplitsRangeIntent }
        : 'not set',
    },
    
    // Diagnostics
    jointCautions: profile.jointCautions || [],
    weakestArea: profile.weakestArea,
    primaryLimitation: profile.primaryLimitation,
    
    // Equipment
    equipmentAvailable: profile.equipmentAvailable || [],
  })
}
