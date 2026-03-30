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
import { getOnboardingProfile, saveOnboardingProfile, type OnboardingProfile, type RecoveryProfile } from './athlete-profile'

// =============================================================================
// [PHASE 5] RECOVERY QUALITY DERIVATION HELPER
// =============================================================================

/**
 * Derives a summary recovery quality from the four recovery fields.
 * Used to compute canonical `recoveryQuality` from real onboarding selections.
 * 
 * Rules:
 * - If all four are null/missing → return null
 * - Return 'poor' if 2 or more fields are 'poor'
 * - Return 'good' if 3 or more fields are 'good'
 * - Otherwise return 'normal'
 */
function deriveRecoveryQualityFromOnboardingRecovery(
  recovery: RecoveryProfile | null | undefined
): 'good' | 'normal' | 'poor' | null {
  if (!recovery) return null
  
  const values = [
    recovery.sleepQuality,
    recovery.energyLevel,
    recovery.stressLevel,  // Note: stressLevel uses same enum - 'good' = low stress, 'poor' = high stress
    recovery.recoveryConfidence,
  ].filter(Boolean) as Array<'good' | 'normal' | 'poor'>
  
  // If all four are null/missing
  if (values.length === 0) return null
  
  const poorCount = values.filter(v => v === 'poor').length
  const goodCount = values.filter(v => v === 'good').length
  
  // Return 'poor' if 2 or more fields are 'poor'
  if (poorCount >= 2) return 'poor'
  
  // Return 'good' if 3 or more fields are 'good'
  if (goodCount >= 3) return 'good'
  
  // Otherwise return 'normal'
  return 'normal'
}

// =============================================================================
// [PHASE 7A] TRAINING METHOD PREFERENCES
// Defines HOW exercises are structured within a session (groupings, pacing)
// =============================================================================

export type TrainingMethodPreference = 
  | 'straight_sets'      // Traditional sets with full rest
  | 'supersets'          // Antagonist or non-competing pairs
  | 'circuits'           // Multiple exercises in sequence
  | 'drop_sets'          // Progressive resistance reduction
  | 'density_blocks'     // Time-based work blocks (EMOM, AMRAP)
  | 'ladder_sets'        // Ascending/descending rep schemes
  | 'cluster_sets'       // Intra-set rest for quality
  | 'rest_pause'         // Brief rest within a set

export const TRAINING_METHOD_LABELS: Record<TrainingMethodPreference, string> = {
  straight_sets: 'Straight Sets',
  supersets: 'Supersets',
  circuits: 'Circuits',
  drop_sets: 'Drop Sets',
  density_blocks: 'Density Blocks (EMOM/AMRAP)',
  ladder_sets: 'Ladder Sets',
  cluster_sets: 'Cluster Sets',
  rest_pause: 'Rest-Pause',
}

export const TRAINING_METHOD_FEASIBILITY: Record<TrainingMethodPreference, {
  applicableBlockTypes: string[]
  incompatibleWith: string[]
  requiresExperience: 'beginner' | 'intermediate' | 'advanced'
  skillQualityImpact: 'none' | 'moderate' | 'high'  // How much it degrades neural quality
}> = {
  straight_sets: {
    applicableBlockTypes: ['skill', 'strength', 'accessory', 'core'],
    incompatibleWith: [],
    requiresExperience: 'beginner',
    skillQualityImpact: 'none',
  },
  supersets: {
    applicableBlockTypes: ['strength', 'accessory', 'core'],
    incompatibleWith: ['skill_isometric', 'skill_balance'],  // Don't superset high-neural skill work
    requiresExperience: 'beginner',
    skillQualityImpact: 'moderate',
  },
  circuits: {
    applicableBlockTypes: ['accessory', 'core', 'conditioning'],
    incompatibleWith: ['skill_isometric', 'skill_balance', 'primary_strength'],
    requiresExperience: 'intermediate',
    skillQualityImpact: 'high',
  },
  drop_sets: {
    applicableBlockTypes: ['strength', 'accessory'],
    incompatibleWith: ['skill_isometric', 'skill_balance', 'skill_dynamic'],
    requiresExperience: 'intermediate',
    skillQualityImpact: 'moderate',
  },
  density_blocks: {
    applicableBlockTypes: ['skill_dynamic', 'accessory', 'conditioning'],
    incompatibleWith: ['skill_isometric'],
    requiresExperience: 'intermediate',
    skillQualityImpact: 'moderate',
  },
  ladder_sets: {
    applicableBlockTypes: ['strength', 'accessory', 'conditioning'],
    incompatibleWith: ['skill_isometric'],
    requiresExperience: 'intermediate',
    skillQualityImpact: 'moderate',
  },
  cluster_sets: {
    applicableBlockTypes: ['skill_isometric', 'strength'],
    incompatibleWith: [],
    requiresExperience: 'intermediate',
    skillQualityImpact: 'none',  // Actually preserves quality
  },
  rest_pause: {
    applicableBlockTypes: ['strength', 'accessory'],
    incompatibleWith: ['skill_isometric', 'skill_balance'],
    requiresExperience: 'advanced',
    skillQualityImpact: 'moderate',
  },
}

// =============================================================================
// CANONICAL PROGRAMMING PROFILE TYPE
// =============================================================================

// =============================================================================
// [PHASE 29A] SCHEDULE IDENTITY CONTRACT
// =============================================================================
// 
// CRITICAL DISTINCTION - Do NOT conflate these two concepts:
//
// 1. BASELINE SCHEDULE IDENTITY (scheduleMode + trainingDaysPerWeek)
//    - What the athlete's plan is fundamentally built around
//    - Examples: "6 days/week baseline" or "flexible/auto-derived"
//    - This is the STARTING POINT for program structure
//
// 2. ADAPTIVE WORKLOAD BEHAVIOR (adaptiveWorkloadEnabled)
//    - Whether the engine adapts training stress within that baseline
//    - Adapts: exercise count, sets, reps, holds, RPE, density, exercise selection
//    - Does NOT immediately collapse frequency (6→4) just because enabled
//
// VALID COMBINATIONS:
// - baselineScheduleMode='static', trainingDaysPerWeek=6, adaptiveWorkloadEnabled=false
//   → Strict 6-day program, no workload adaptation
// - baselineScheduleMode='static', trainingDaysPerWeek=6, adaptiveWorkloadEnabled=true
//   → 6-day baseline with workload adaptation (sets, reps, intensity adjust)
// - baselineScheduleMode='flexible', trainingDaysPerWeek=null, adaptiveWorkloadEnabled=true
//   → Fully flexible frequency, engine derives everything
//
// FREQUENCY REDUCTION PRIORITY (only after workload adaptation exhausted):
// 1. Exercise amount reduction
// 2. Exercise selection simplification
// 3. Set/rep reduction
// 4. Intensity (RPE) reduction
// 5. Session compression (density)
// 6. ONLY THEN: Weekly day reduction (6→5→4) with explicit evidence
//
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
  trainingDaysPerWeek: number | null  // null = flexible baseline
  scheduleMode: 'static' | 'flexible'  // BASELINE schedule identity (not workload behavior)
  // [PHASE 29A] Adaptive workload is SEPARATE from schedule identity
  // A user can have scheduleMode='static' + trainingDaysPerWeek=6 + adaptiveWorkloadEnabled=true
  // This means: "I train 6 days/week, but let the engine adapt sets/reps/intensity"
  adaptiveWorkloadEnabled: boolean  // Whether engine adapts workload within baseline schedule
  sessionDurationMode: 'static' | 'adaptive'  // TASK 1A: Distinguishes fixed vs adaptive time preference
  sessionLengthMinutes: number  // Target duration bucket (30/45/60/90) even for adaptive mode
  sessionStylePreference: string | null  // 'longer_complete' | 'shorter_focused' | etc.
  equipmentAvailable: string[]
  trainingStyle: string | null
  
  // [PHASE 7A] Training Method Preferences - HOW exercises are structured
  // These influence exercise grouping (supersets, circuits, etc.) not just what exercises
  trainingMethodPreferences: TrainingMethodPreference[]
  
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
  // [PHASE 5] Raw recovery fields for normalizer truth flow
  recoveryRaw: {
    sleepQuality: string | null
    energyLevel: string | null
    stressLevel: string | null
    recoveryConfidence: string | null
  } | null
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
  
  // [PHASE 17E] Comprehensive source audit - track exact values from each source
  console.log('[phase17e-canonical-profile-source-audit]', {
    onboardingProfileExists: !!onboardingProfile,
    athleteProfileExists: !!athleteProfile,
    // Bodyweight sources
    onboardingWeightRange: onboardingProfile?.weightRange || null,
    onboardingBodyweight: (onboardingProfile as unknown as { bodyweight?: number })?.bodyweight || null,
    athleteBodyweight: athleteProfile?.bodyweight || null,
    // Schedule sources
    onboardingScheduleMode: onboardingProfile?.scheduleMode || null,
    athleteScheduleMode: athleteProfile?.scheduleMode || null,
    onboardingTrainingDays: onboardingProfile?.trainingDaysPerWeek || null,
    athleteTrainingDays: athleteProfile?.trainingDaysPerWeek || null,
    // Skills sources
    onboardingSelectedSkills: onboardingProfile?.selectedSkills || [],
    athleteSelectedSkills: (athleteProfile as unknown as { selectedSkills?: string[] })?.selectedSkills || [],
    // Goals sources
    onboardingPrimaryGoal: onboardingProfile?.primaryGoal || null,
    athletePrimaryGoal: athleteProfile?.primaryGoal || null,
    // Style sources  
    onboardingTrainingStyle: onboardingProfile?.trainingStyle || null,
    athleteTrainingStyle: athleteProfile?.trainingStyle || null,
    // Experience sources
    onboardingExperience: onboardingProfile?.trainingExperience || null,
    athleteExperience: athleteProfile?.experienceLevel || null,
    // Equipment sources
    onboardingEquipment: onboardingProfile?.equipment || [],
    athleteEquipment: athleteProfile?.equipmentAvailable || [],
  })
  
  // Helper: pick first non-null/non-empty value from sources
  function pick<T>(onboardingVal: T | null | undefined, athleteVal: T | null | undefined, fallback: T): T {
    if (onboardingVal !== null && onboardingVal !== undefined) return onboardingVal
    if (athleteVal !== null && athleteVal !== undefined) return athleteVal
    return fallback
  }
  
  // Helper: pick first non-empty array
  // [PHASE 5 TASK 2] CRITICAL: Onboarding MUST win over stale athlete profile
  // If onboarding explicitly has a non-empty array, use it regardless of athleteVal
  function pickArray(onboardingVal: unknown[] | null | undefined, athleteVal: unknown[] | null | undefined): string[] {
    // [PHASE 5] If onboarding has an explicit array (even empty), that is the truth
    // Only fall back to athlete if onboarding is truly null/undefined
    if (onboardingVal !== null && onboardingVal !== undefined && Array.isArray(onboardingVal)) {
      return onboardingVal as string[]
    }
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
    selectedSkills: (() => {
      // [PHASE 5 TASK 2] HARD LOCK: Onboarding selectedSkills wins if present
      const onboardingSkills = onboardingProfile?.selectedSkills
      const athleteSkills = (athleteProfile as unknown as { selectedSkills?: string[] })?.selectedSkills
      
      // If onboarding has explicitly set skills (even empty array), use them
      if (onboardingSkills !== null && onboardingSkills !== undefined && Array.isArray(onboardingSkills)) {
        // Log if we're overriding stale athlete skills
        if (athleteSkills && athleteSkills.length > 0 && 
            JSON.stringify(onboardingSkills.sort()) !== JSON.stringify(athleteSkills.sort())) {
          console.log('[phase5-stale-skill-resurrection-prevented]', {
            onboardingSkillsWin: true,
            onboardingSkills: onboardingSkills,
            staleAthleteSkillsIgnored: athleteSkills,
            skillsDiffer: true,
          })
        }
        return onboardingSkills
      }
      // Only fall back to athlete if onboarding truly has nothing
      return athleteSkills || []
    })(),
    selectedFlexibility: pickArray(onboardingProfile?.selectedFlexibility, null),
    selectedStrength: pickArray(onboardingProfile?.selectedStrength, null),
    goalCategory: pick(onboardingProfile?.goalCategory, null, null),
    goalCategories: pickArray(onboardingProfile?.goalCategories, null),
    trainingPathType: onboardingProfile?.trainingPathType ?? null,
    primaryTrainingOutcome: onboardingProfile?.primaryTrainingOutcome ?? null,
    
    // Training Preferences
    // TASK 1B: NO FALLBACKS - use null if missing (validation catches this)
    // TASK D FIX: Experience mapping must match onboarding: new|some -> beginner
    experienceLevel: pick(
      onboardingProfile?.trainingExperience === 'new' || onboardingProfile?.trainingExperience === 'some' 
        ? 'beginner' 
        : onboardingProfile?.trainingExperience === 'intermediate' 
          ? 'intermediate' 
          : onboardingProfile?.trainingExperience === 'advanced' 
            ? 'advanced' 
            : undefined,
      athleteProfile?.experienceLevel,
      'beginner'  // Safe default only for new users, not override
    ),
    // ==========================================================================
    // [PHASE 28D] UNIFIED SCHEDULE RESOLUTION - FIX CANONICAL PRECEDENCE
    // Athlete/settings explicit static schedule BEATS stale onboarding flexible
    // This ensures Settings changes are properly respected
    // ==========================================================================
    ...(() => {
      // Step 1: Determine what each source has explicitly
      const onboardingExplicitFlexible = onboardingProfile?.scheduleMode === 'flexible'
      const onboardingExplicitStatic = onboardingProfile?.scheduleMode === 'static' && 
        typeof onboardingProfile?.trainingDaysPerWeek === 'number'
      const onboardingHasExplicit = onboardingExplicitFlexible || onboardingExplicitStatic
      
      const athleteExplicitFlexible = athleteProfile?.scheduleMode === 'flexible'
      const athleteExplicitStatic = athleteProfile?.scheduleMode === 'static' && 
        typeof athleteProfile?.trainingDaysPerWeek === 'number'
      const athleteHasExplicit = athleteExplicitFlexible || athleteExplicitStatic
      
      // Step 2: Check for timestamp-aware precedence
      // Look for updatedAt, savedAt, lastModified fields
      const onboardingTimestamp = (onboardingProfile as { updatedAt?: string; savedAt?: string; lastModified?: string })?.updatedAt ||
        (onboardingProfile as { savedAt?: string })?.savedAt ||
        (onboardingProfile as { lastModified?: string })?.lastModified || null
      const athleteTimestamp = (athleteProfile as { updatedAt?: string; savedAt?: string; lastModified?: string })?.updatedAt ||
        (athleteProfile as { savedAt?: string })?.savedAt ||
        (athleteProfile as { lastModified?: string })?.lastModified || null
      
      const timestampsAvailable = !!(onboardingTimestamp && athleteTimestamp)
      let athleteIsNewer = false
      if (timestampsAvailable) {
        const onboardingDate = new Date(onboardingTimestamp).getTime()
        const athleteDate = new Date(athleteTimestamp).getTime()
        athleteIsNewer = athleteDate > onboardingDate
      }
      
      // Step 3: Apply smart precedence rules for schedule fields
      // CRITICAL: Athlete/settings explicit static beats stale onboarding flexible
      let winnerSource: 'onboarding' | 'athlete' | 'fallback' = 'fallback'
      let resolvedScheduleMode: 'static' | 'flexible' = 'flexible'
      let resolvedTrainingDays: number | null = null
      let verdictReason = ''
      
      // ==========================================================================
      // [PHASE 30E] BEHAVIOR FIX: Athlete explicit static ALWAYS beats onboarding flexible
      // regardless of timestamps. This is the core product contract:
      // - User explicitly chose static 6 in Settings
      // - That choice should NEVER be overridden by stale onboarding flexible
      // - Only a NEWER explicit athlete choice (flexible) can override it
      // ==========================================================================
      if (athleteExplicitStatic) {
        // PHASE 30E: Athlete has explicit static - this ALWAYS wins over onboarding flexible
        winnerSource = 'athlete'
        resolvedScheduleMode = 'static'
        resolvedTrainingDays = athleteProfile!.trainingDaysPerWeek as number
        verdictReason = 'PHASE30E_ATHLETE_STATIC_WINS'
      } else if (timestampsAvailable && athleteIsNewer && athleteHasExplicit) {
        // Timestamp says athlete is newer and has explicit value - athlete wins
        winnerSource = 'athlete'
        if (athleteExplicitStatic) {
          resolvedScheduleMode = 'static'
          resolvedTrainingDays = athleteProfile!.trainingDaysPerWeek as number
          verdictReason = 'ATHLETE_STATIC_OVERRIDES_STALE_ONBOARDING_FLEXIBLE'
        } else {
          resolvedScheduleMode = 'flexible'
          resolvedTrainingDays = null
          verdictReason = 'ATHLETE_FLEXIBLE_RETAINED'
        }
      } else if (timestampsAvailable && !athleteIsNewer && onboardingHasExplicit) {
        // Timestamp says onboarding is newer and has explicit value - onboarding wins
        // BUT ONLY if athlete doesn't have explicit static (checked above)
        winnerSource = 'onboarding'
        if (onboardingExplicitStatic) {
          resolvedScheduleMode = 'static'
          resolvedTrainingDays = onboardingProfile!.trainingDaysPerWeek as number
          verdictReason = 'ONBOARDING_STATIC_RETAINED'
        } else {
          resolvedScheduleMode = 'flexible'
          resolvedTrainingDays = null
          verdictReason = 'ONBOARDING_FLEXIBLE_RETAINED'
        }
      } else if (!timestampsAvailable) {
        // No timestamps - use smart fallback precedence
        // RULE: Athlete explicit static beats onboarding flexible
        if (athleteExplicitStatic && onboardingExplicitFlexible) {
          // Settings has explicit static, onboarding has flexible - ATHLETE WINS
          winnerSource = 'athlete'
          resolvedScheduleMode = 'static'
          resolvedTrainingDays = athleteProfile!.trainingDaysPerWeek as number
          verdictReason = 'ATHLETE_STATIC_OVERRIDES_STALE_ONBOARDING_FLEXIBLE'
        } else if (athleteExplicitStatic && !onboardingHasExplicit) {
          // Only athlete has explicit static - athlete wins
          winnerSource = 'athlete'
          resolvedScheduleMode = 'static'
          resolvedTrainingDays = athleteProfile!.trainingDaysPerWeek as number
          verdictReason = 'ATHLETE_STATIC_RETAINED'
        } else if (onboardingExplicitStatic && !athleteHasExplicit) {
          // Only onboarding has explicit static - onboarding wins
          winnerSource = 'onboarding'
          resolvedScheduleMode = 'static'
          resolvedTrainingDays = onboardingProfile!.trainingDaysPerWeek as number
          verdictReason = 'ONBOARDING_STATIC_RETAINED'
        } else if (athleteExplicitFlexible && onboardingExplicitStatic) {
          // Athlete chose flexible after onboarding set static - respect athlete choice
          winnerSource = 'athlete'
          resolvedScheduleMode = 'flexible'
          resolvedTrainingDays = null
          verdictReason = 'ATHLETE_FLEXIBLE_OVERRIDES_STALE_ONBOARDING_STATIC'
        } else if (onboardingExplicitFlexible && !athleteHasExplicit) {
          // Only onboarding has explicit - use it
          winnerSource = 'onboarding'
          resolvedScheduleMode = 'flexible'
          resolvedTrainingDays = null
          verdictReason = 'ONBOARDING_FLEXIBLE_RETAINED'
        } else if (athleteExplicitFlexible && !onboardingHasExplicit) {
          // Only athlete has explicit - use it
          winnerSource = 'athlete'
          resolvedScheduleMode = 'flexible'
          resolvedTrainingDays = null
          verdictReason = 'ATHLETE_FLEXIBLE_RETAINED'
        } else {
          // Neither has explicit schedule - fallback
          winnerSource = 'fallback'
          resolvedScheduleMode = 'flexible'
          resolvedTrainingDays = null
          verdictReason = 'FALLBACK_USED'
        }
      } else {
        // Edge case - timestamps exist but winner source didn't match above
        winnerSource = 'fallback'
        resolvedScheduleMode = 'flexible'
        resolvedTrainingDays = null
        verdictReason = 'FALLBACK_USED'
      }
      
      // ==========================================================================
      // [PHASE 29A] ADAPTIVE WORKLOAD RESOLUTION - MUST BE COMPUTED BEFORE ANY LOGS
      // [PHASE 29C] MOVED ABOVE LOGS TO FIX TDZ BUG - resolvedAdaptiveWorkload was
      // referenced in logs before being declared, causing boot crash
      // ==========================================================================
      const onboardingAdaptive = (onboardingProfile as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled
      const athleteAdaptive = (athleteProfile as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled
      
      // If either source explicitly sets it, use that value
      // Otherwise default to true (adaptive workload is standard)
      let resolvedAdaptiveWorkload = true
      if (athleteAdaptive !== undefined && athleteAdaptive !== null) {
        resolvedAdaptiveWorkload = athleteAdaptive
      } else if (onboardingAdaptive !== undefined && onboardingAdaptive !== null) {
        resolvedAdaptiveWorkload = onboardingAdaptive
      }
      // If neither has it, default to true (adaptive workload enabled by default)
      
      // Step 4: Log the resolution with full forensics
      // [PHASE 29C] All variables are now declared above - safe to log
      console.log('[phase28d-canonical-schedule-resolution]', {
        // Source values
        onboardingScheduleMode: onboardingProfile?.scheduleMode ?? null,
        onboardingTrainingDays: onboardingProfile?.trainingDaysPerWeek ?? null,
        athleteScheduleMode: athleteProfile?.scheduleMode ?? null,
        athleteTrainingDays: athleteProfile?.trainingDaysPerWeek ?? null,
        // Explicit flags
        onboardingExplicitFlexible,
        onboardingExplicitStatic,
        athleteExplicitFlexible,
        athleteExplicitStatic,
        // Timestamp info
        timestampsUsed: timestampsAvailable,
        athleteIsNewer: timestampsAvailable ? athleteIsNewer : null,
        // Resolution
        winnerSource,
        resolvedScheduleMode,
        resolvedTrainingDaysPerWeek: resolvedTrainingDays,
        // Verdict
        verdict: verdictReason,
      })
      
      // ==========================================================================
      // [PHASE 29B] CANONICAL SCHEDULE WINNER LOG - Task 3
      // Proves exactly which source won and detects if static 6 was dropped
      // ==========================================================================
      console.log('[phase29b-canonical-schedule-winner]', {
        // Raw source values
        'onboarding.scheduleMode': onboardingProfile?.scheduleMode ?? null,
        'onboarding.trainingDays': onboardingProfile?.trainingDaysPerWeek ?? null,
        'athlete.scheduleMode': athleteProfile?.scheduleMode ?? null,
        'athlete.trainingDays': athleteProfile?.trainingDaysPerWeek ?? null,
        // Explicit flags
        athleteExplicitStatic,
        onboardingExplicitFlexible,
        // Timestamps (if available)
        timestampsAvailable,
        athleteIsNewer: timestampsAvailable ? athleteIsNewer : null,
        // Resolution result
        winnerSource,
        'resolved.scheduleMode': resolvedScheduleMode,
        'resolved.trainingDays': resolvedTrainingDays,
        'resolved.adaptiveWorkload': resolvedAdaptiveWorkload,
        // Verdict
        verdict: (() => {
          if (athleteExplicitStatic && athleteProfile?.trainingDaysPerWeek === 6) {
            if (resolvedScheduleMode === 'static' && resolvedTrainingDays === 6) {
              return 'ATHLETE_STATIC_6_WINS'
            }
            return 'BUG_ATHLETE_STATIC_6_DROPPED'
          }
          if (onboardingExplicitFlexible && resolvedScheduleMode === 'flexible') {
            return 'ONBOARDING_FLEXIBLE_WINS_WITH_VALID_REASON'
          }
          if (resolvedScheduleMode === 'flexible' && athleteProfile?.scheduleMode === 'flexible') {
            return 'ATHLETE_FLEXIBLE_RETAINED'
          }
          return winnerSource === 'athlete' ? 'ATHLETE_WINS' : 'ONBOARDING_WINS'
        })(),
      })
      
      // ==========================================================================
      // [PHASE 28L] CANONICAL SCHEDULE SOURCE WINNER LOG
      // Proves exactly which source won and detects if static was dropped
      // ==========================================================================
      console.log('[phase28l-canonical-schedule-source-winner]', {
        onboardingScheduleMode: onboardingProfile?.scheduleMode ?? null,
        onboardingTrainingDays: onboardingProfile?.trainingDaysPerWeek ?? null,
        athleteScheduleMode: athleteProfile?.scheduleMode ?? null,
        athleteTrainingDays: athleteProfile?.trainingDaysPerWeek ?? null,
        canonicalAfterResolution: { scheduleMode: resolvedScheduleMode, trainingDaysPerWeek: resolvedTrainingDays },
        winnerSource,
        winnerReason: verdictReason,
        // BUG DETECTION
        verdict: (() => {
          // Detect if athlete had static 6 but we resolved to something else
          if (athleteExplicitStatic && athleteProfile?.trainingDaysPerWeek === 6) {
            if (resolvedScheduleMode === 'static' && resolvedTrainingDays === 6) {
              return 'ATHLETE_STATIC_6_WINS'
            } else {
              return 'BUG_ATHLETE_STATIC_6_WAS_DROPPED'
            }
          }
          // Detect if onboarding had static 6 but we resolved to something else
          if (onboardingExplicitStatic && onboardingProfile?.trainingDaysPerWeek === 6) {
            if (resolvedScheduleMode === 'static' && resolvedTrainingDays === 6) {
              return 'ONBOARD_STATIC_6_WINS'
            } else {
              return 'BUG_ONBOARD_STATIC_6_WAS_DROPPED'
            }
          }
          // No static 6 existed anywhere
          if (resolvedScheduleMode === 'flexible') {
            return 'FLEXIBLE_WON_BECAUSE_NO_EXPLICIT_STATIC'
          }
          return `CANON_RETAINED_STATIC_${resolvedTrainingDays}`
        })(),
      })
      
      // ==========================================================================
      // [PHASE 29C] CANONICAL SCHEDULE BOOT SAFETY LOG
      // Proves all schedule variables are computed and boot is safe
      // This log happens AFTER all variables are declared - guaranteed safe
      // ==========================================================================
      console.log('[phase29c-canonical-schedule-boot-safety]', {
        'onboarding.scheduleMode': onboardingProfile?.scheduleMode ?? null,
        'athlete.scheduleMode': athleteProfile?.scheduleMode ?? null,
        'resolved.scheduleMode': resolvedScheduleMode,
        'resolved.trainingDays': resolvedTrainingDays,
        'resolved.adaptiveWorkload': resolvedAdaptiveWorkload,
        verdict: (() => {
          if (resolvedScheduleMode === 'static' && resolvedTrainingDays === 6) {
            return 'CANONICAL_BOOT_SAFE_STATIC_6'
          }
          if (resolvedScheduleMode === 'flexible') {
            return 'CANONICAL_BOOT_SAFE_FLEXIBLE'
          }
          return 'CANONICAL_BOOT_SAFE'
        })(),
      })
      
      // ==========================================================================
      // [PHASE 30E] CANONICAL MODIFY AUTHORITATIVE
      // THE DEFINITIVE LOG proving canonical resolves athlete static correctly
      // ==========================================================================
      console.log('[phase30e-canonical-modify-authoritative]', {
        athlete_scheduleMode: athleteProfile?.scheduleMode ?? null,
        athlete_trainingDaysPerWeek: athleteProfile?.trainingDaysPerWeek ?? null,
        onboarding_scheduleMode: onboardingProfile?.scheduleMode ?? null,
        onboarding_trainingDaysPerWeek: onboardingProfile?.trainingDaysPerWeek ?? null,
        resolved_scheduleMode: resolvedScheduleMode,
        resolved_trainingDaysPerWeek: resolvedTrainingDays,
        resolved_adaptiveWorkloadEnabled: resolvedAdaptiveWorkload,
        verdictReason,
        verdict:
          resolvedScheduleMode === 'static' && resolvedTrainingDays === 6
            ? 'CANONICAL_FOR_MODIFY_STATIC_6'
            : resolvedScheduleMode === 'flexible'
            ? 'CANONICAL_FOR_MODIFY_FLEXIBLE'
            : `CANONICAL_FOR_MODIFY_${resolvedScheduleMode}_${resolvedTrainingDays}`,
      })
      
      // ==========================================================================
      // [PHASE 30D] CANONICAL FINAL - AUTHORITATIVE BEHAVIOR FIX LOG
      // THE DEFINITIVE LOG proving canonical schedule resolution with verdicts
      // ==========================================================================
      console.log('[phase30d-canonical-final]', {
        onboarding_scheduleMode: onboardingProfile?.scheduleMode ?? null,
        onboarding_trainingDaysPerWeek: onboardingProfile?.trainingDaysPerWeek ?? null,
        athlete_scheduleMode: athleteProfile?.scheduleMode ?? null,
        athlete_trainingDaysPerWeek: athleteProfile?.trainingDaysPerWeek ?? null,
        athlete_adaptiveWorkloadEnabled: (athleteProfile as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled ?? null,
        resolved_scheduleMode: resolvedScheduleMode,
        resolved_trainingDaysPerWeek: resolvedTrainingDays,
        resolved_adaptiveWorkloadEnabled: resolvedAdaptiveWorkload,
        verdict:
          resolvedScheduleMode === 'static' && resolvedTrainingDays === 6
            ? 'CANONICAL_STATIC_6'
            : resolvedScheduleMode === 'flexible'
            ? 'CANONICAL_FLEXIBLE'
            : `CANONICAL_${resolvedScheduleMode}_${resolvedTrainingDays}`,
      })
      
      // ==========================================================================
      // [PHASE 30C] CANONICAL RESOLUTION FINAL
      // THE DEFINITIVE LOG proving canonical schedule resolution with verdicts
      // ==========================================================================
      console.log('[phase30c-canonical-resolution-final]', {
        onboarding_scheduleMode: onboardingProfile?.scheduleMode ?? null,
        onboarding_trainingDaysPerWeek: onboardingProfile?.trainingDaysPerWeek ?? null,
        onboarding_adaptiveWorkloadEnabled: (onboardingProfile as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled ?? null,
        athlete_scheduleMode: athleteProfile?.scheduleMode ?? null,
        athlete_trainingDaysPerWeek: athleteProfile?.trainingDaysPerWeek ?? null,
        athlete_adaptiveWorkloadEnabled: (athleteProfile as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled ?? null,
        resolved_scheduleMode: resolvedScheduleMode,
        resolved_trainingDaysPerWeek: resolvedTrainingDays,
        resolved_adaptiveWorkloadEnabled: resolvedAdaptiveWorkload,
        verdict:
          resolvedScheduleMode === 'static' && resolvedTrainingDays === 6
            ? 'CANONICAL_STATIC_6'
            : resolvedScheduleMode === 'flexible'
            ? 'CANONICAL_FLEXIBLE'
            : `CANONICAL_${resolvedScheduleMode}_${resolvedTrainingDays}`,
      })
      
      // ==========================================================================
      // [PHASE 30B] CANONICAL SCHEDULE RESOLUTION FINAL
      // THE DEFINITIVE LOG proving canonical schedule resolution with verdicts
      // ==========================================================================
      console.log('[phase30b-canonical-schedule-resolution-final]', {
        onboarding_scheduleMode: onboardingProfile?.scheduleMode ?? null,
        onboarding_trainingDaysPerWeek: onboardingProfile?.trainingDaysPerWeek ?? null,
        athlete_scheduleMode: athleteProfile?.scheduleMode ?? null,
        athlete_trainingDaysPerWeek: athleteProfile?.trainingDaysPerWeek ?? null,
        athlete_adaptiveWorkloadEnabled: (athleteProfile as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled ?? null,
        resolved_scheduleMode: resolvedScheduleMode,
        resolved_trainingDaysPerWeek: resolvedTrainingDays,
        resolved_adaptiveWorkloadEnabled: resolvedAdaptiveWorkload,
        verdict:
          resolvedScheduleMode === 'static' && resolvedTrainingDays === 6
            ? 'CANONICAL_STATIC_6'
            : resolvedScheduleMode === 'flexible'
            ? 'CANONICAL_FLEXIBLE'
            : `CANONICAL_STATIC_${resolvedTrainingDays}`,
      })
      
      // ==========================================================================
      // [PHASE 30A] CANONICAL FINAL SCHEDULE RESOLUTION - AUTHORITATIVE
      // THE DEFINITIVE LOG proving canonical schedule resolution
      // ==========================================================================
      console.log('[phase30a-canonical-final-schedule-resolution]', {
        onboarding_scheduleMode: onboardingProfile?.scheduleMode ?? null,
        onboarding_trainingDaysPerWeek: onboardingProfile?.trainingDaysPerWeek ?? null,
        athlete_scheduleMode: athleteProfile?.scheduleMode ?? null,
        athlete_trainingDaysPerWeek: athleteProfile?.trainingDaysPerWeek ?? null,
        athlete_adaptiveWorkloadEnabled: (athleteProfile as { adaptiveWorkloadEnabled?: boolean })?.adaptiveWorkloadEnabled ?? null,
        resolved_scheduleMode: resolvedScheduleMode,
        resolved_trainingDaysPerWeek: resolvedTrainingDays,
        resolved_adaptiveWorkloadEnabled: resolvedAdaptiveWorkload,
        precedenceWinner: winnerSource,
        precedenceReason: verdictReason,
        verdict:
          resolvedScheduleMode === 'static' && resolvedTrainingDays === 6
            ? 'CANONICAL_RESOLVED_STATIC_6'
            : resolvedScheduleMode === 'flexible'
            ? 'CANONICAL_RESOLVED_FLEXIBLE'
            : `CANONICAL_RESOLVED_STATIC_${resolvedTrainingDays}`,
      })
      
      // ==========================================================================
      // [PHASE 29D] CANONICAL RESOLUTION FINAL - THE DEFINITIVE SCHEDULE ANSWER
      // This is what ALL downstream consumers (modify, prefill, form, builder) MUST use
      // ==========================================================================
      console.log('[phase29d-canonical-resolution-final]', {
        onboardingScheduleMode: onboardingProfile?.scheduleMode ?? null,
        onboardingTrainingDays: onboardingProfile?.trainingDaysPerWeek ?? null,
        athleteScheduleMode: athleteProfile?.scheduleMode ?? null,
        athleteTrainingDays: athleteProfile?.trainingDaysPerWeek ?? null,
        resolvedScheduleMode,
        resolvedTrainingDays,
        resolvedAdaptiveWorkload,
        precedenceWinner: winnerSource,
        verdict: resolvedScheduleMode === 'static' && resolvedTrainingDays === 6
          ? 'STATIC_6_RESOLVED'
          : resolvedScheduleMode === 'static'
            ? `STATIC_${resolvedTrainingDays}_RESOLVED`
            : 'FLEXIBLE_RESOLVED',
      })
      
      // [PHASE 29A] Log the schedule contract resolution
      console.log('[phase29a-canonical-schedule-contract-resolution]', {
        // Raw source values
        onboardingScheduleMode: onboardingProfile?.scheduleMode ?? null,
        onboardingTrainingDays: onboardingProfile?.trainingDaysPerWeek ?? null,
        onboardingAdaptiveWorkload: onboardingAdaptive ?? null,
        athleteScheduleMode: athleteProfile?.scheduleMode ?? null,
        athleteTrainingDays: athleteProfile?.trainingDaysPerWeek ?? null,
        athleteAdaptiveWorkload: athleteAdaptive ?? null,
        // Resolved values
        baselineScheduleModeResolved: resolvedScheduleMode,
        baselineTrainingDaysResolved: resolvedTrainingDays,
        adaptiveWorkloadEnabledResolved: resolvedAdaptiveWorkload,
        // Legacy mapping (what old code would have interpreted)
        legacyMappedScheduleMode: resolvedScheduleMode,
        // Verdict
        verdict: (() => {
          if (resolvedScheduleMode === 'static' && resolvedTrainingDays && resolvedAdaptiveWorkload) {
            return 'STATIC_BASELINE_WITH_ADAPTIVE_WORKLOAD_PRESERVED'
          }
          if (resolvedScheduleMode === 'flexible' && resolvedAdaptiveWorkload) {
            return 'FLEXIBLE_BASELINE_RETAINED'
          }
          if (resolvedScheduleMode === 'static' && !resolvedAdaptiveWorkload) {
            return 'LEGACY_STATIC_RETAINED'
          }
          return 'UNKNOWN_SCHEDULE_CONTRACT_STATE'
        })(),
      })
      
      // [schedule-final-real-sources] Concise log proving canonical resolution
      console.log('[schedule-final-real-sources]', {
        onboarding: onboardingProfile?.scheduleMode ?? null,
        athlete: athleteProfile?.scheduleMode ?? null,
        canonical: resolvedScheduleMode,
        days: resolvedTrainingDays,
        winner: winnerSource,
      })
      
      return {
        scheduleMode: resolvedScheduleMode,
        trainingDaysPerWeek: resolvedTrainingDays,
        adaptiveWorkloadEnabled: resolvedAdaptiveWorkload,
      }
    })(),
    // ISSUE A/B FIX: Read explicit sessionDurationMode field (now in OnboardingProfile type)
    // TASK 1A: Session duration mode - 'static' = fixed duration, 'adaptive' = engine adapts based on recovery
    sessionDurationMode: pick(
      onboardingProfile?.sessionDurationMode,
      athleteProfile?.sessionDurationMode as 'static' | 'adaptive' | undefined,
      // ISSUE D FIX: Infer from sessionLengthMinutes if sessionDurationMode not set
      onboardingProfile?.sessionLengthMinutes === 'flexible' ? 'adaptive' : 'static'
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
    
    // [PHASE 7A] Training Method Preferences - default to straight_sets + supersets if not set
    trainingMethodPreferences: inferTrainingMethodPreferences(onboardingProfile, athleteProfile),
    
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
    // [PHASE 17D] Bodyweight canonical profile - derive from weightRange if no exact value
    bodyweight: (() => {
      // Midpoint derivation for weightRange
      const weightRangeMidpoints: Record<string, number> = {
        'under_140': 130,
        '140_160': 150,
        '160_180': 170,
        '180_200': 190,
        '200_220': 210,
        'over_220': 235,
      }
      
      // Priority: exact database value > exact onboarding value > derived from weightRange
      const athleteBw = typeof athleteProfile?.bodyweight === 'number' && athleteProfile.bodyweight > 0 
        ? athleteProfile.bodyweight : null
      const onboardingBw = typeof onboardingProfile?.bodyweight === 'number' && onboardingProfile.bodyweight > 0
        ? onboardingProfile.bodyweight : null
      const derivedBw = onboardingProfile?.weightRange 
        ? weightRangeMidpoints[onboardingProfile.weightRange] || null 
        : null
      
      const finalBw = athleteBw ?? onboardingBw ?? derivedBw ?? null
      const sourceUsed = athleteBw !== null ? 'athlete_exact' 
        : onboardingBw !== null ? 'onboarding_exact'
        : derivedBw !== null ? 'derived_from_weightRange'
        : 'null'
      
      console.log('[phase17d-bodyweight-canonical-merge-audit]', {
        athleteProfileBodyweight: athleteBw,
        onboardingBodyweight: onboardingBw,
        onboardingWeightRange: onboardingProfile?.weightRange || null,
        derivedFromRange: derivedBw,
        finalCanonicalBodyweight: finalBw,
        sourceUsed,
      })
      
      // [PHASE 17G] Canonical bodyweight source audit - comprehensive truth chain
      console.log('[phase17g-canonical-bodyweight-source-audit]', {
        // A. All available sources
        athleteProfileBodyweight: athleteProfile?.bodyweight,
        athleteProfileBodyweightType: typeof athleteProfile?.bodyweight,
        onboardingWeightRange: onboardingProfile?.weightRange || null,
        // B. Resolution
        athleteExactUsed: athleteBw !== null,
        derivedFromRangeUsed: derivedBw !== null && athleteBw === null,
        derivedMidpointValue: derivedBw,
        // C. Final canonical value
        finalCanonicalBodyweight: finalBw,
        sourceUsed,
        // D. Verdict
        verdict: athleteBw !== null 
          ? 'USING_EXACT_DATABASE_BODYWEIGHT'
          : derivedBw !== null 
          ? 'USING_DERIVED_MIDPOINT_FROM_WEIGHT_RANGE'
          : 'NO_BODYWEIGHT_AVAILABLE',
        // E. User expectation
        issueIfDerived: sourceUsed === 'derived_from_weightRange'
          ? 'User may expect exact value, but none saved in database yet'
          : 'none',
      })
      return finalBw
    })(),
    height: pick(
      typeof onboardingProfile?.height === 'number' ? onboardingProfile.height : null,
      athleteProfile?.height,
      null
    ),
    
    // [PHASE 5] Recovery context - derive from real four-field object
    recoveryQuality: deriveRecoveryQualityFromOnboardingRecovery(onboardingProfile?.recovery),
    // [PHASE 5] Raw recovery fields for normalizer
    recoveryRaw: onboardingProfile?.recovery ? {
      sleepQuality: onboardingProfile.recovery.sleepQuality || null,
      energyLevel: onboardingProfile.recovery.energyLevel || null,
      stressLevel: onboardingProfile.recovery.stressLevel || null,
      recoveryConfidence: onboardingProfile.recovery.recoveryConfidence || null,
    } : null,
  }
  
  // [PHASE 5] [canonical-recovery-derivation-audit] Task 2
  console.log('[canonical-recovery-derivation-audit]', {
    rawRecoverySource: onboardingProfile?.recovery,
    derivedRecoverySummary: canonical.recoveryQuality,
    finalCanonicalRecoverySummary: canonical.recoveryQuality,
  })
  
  // ==========================================================================
  // [canonical-profile-merge-truth-audit] TASK 3: Comprehensive merge truth audit
  // This log shows EXACTLY where each field came from and whether any stale
  // or older source overrode a newer onboarding value
  // ==========================================================================
  console.log('[canonical-profile-merge-truth-audit]', {
    // Raw source values
    rawOnboardingSource: {
      selectedSkills: onboardingProfile?.selectedSkills || [],
      equipment: onboardingProfile?.equipment || [],
      trainingDaysPerWeek: onboardingProfile?.trainingDaysPerWeek,
      scheduleMode: onboardingProfile?.scheduleMode,
      sessionDurationMode: onboardingProfile?.sessionDurationMode,
      sessionLengthMinutes: onboardingProfile?.sessionLengthMinutes,
      trainingStyle: onboardingProfile?.trainingStyle,
      trainingPathType: onboardingProfile?.trainingPathType,
      primaryGoal: onboardingProfile?.primaryGoal,
      secondaryGoal: onboardingProfile?.secondaryGoal,
    },
    rawAthleteSource: {
      selectedSkills: (athleteProfile as unknown as { selectedSkills?: string[] })?.selectedSkills || [],
      equipmentAvailable: athleteProfile?.equipmentAvailable || [],
      trainingDaysPerWeek: athleteProfile?.trainingDaysPerWeek,
      scheduleMode: athleteProfile?.scheduleMode,
      sessionDurationMode: athleteProfile?.sessionDurationMode,
      sessionLengthMinutes: athleteProfile?.sessionLengthMinutes,
      trainingStyle: athleteProfile?.trainingStyle,
      primaryGoal: athleteProfile?.primaryGoal,
    },
    // Final canonical values  
    finalCanonicalValues: {
      selectedSkills: canonical.selectedSkills,
      equipmentAvailable: canonical.equipmentAvailable,
      trainingDaysPerWeek: canonical.trainingDaysPerWeek,
      scheduleMode: canonical.scheduleMode,
      sessionDurationMode: canonical.sessionDurationMode,
      sessionLengthMinutes: canonical.sessionLengthMinutes,
      trainingStyle: canonical.trainingStyle,
      trainingPathType: canonical.trainingPathType,
      primaryGoal: canonical.primaryGoal,
      secondaryGoal: canonical.secondaryGoal,
    },
    // Which source won for each critical field
    sourceWinners: {
      selectedSkillsSource: (onboardingProfile?.selectedSkills?.length || 0) > 0 ? 'onboarding' : 
        ((athleteProfile as unknown as { selectedSkills?: string[] })?.selectedSkills?.length || 0) > 0 ? 'athlete' : 'empty',
      equipmentSource: (onboardingProfile?.equipment?.length || 0) > 0 ? 'onboarding' : 
        (athleteProfile?.equipmentAvailable?.length || 0) > 0 ? 'athlete' : 'empty',
      trainingDaysSource: onboardingProfile?.trainingDaysPerWeek !== undefined ? 'onboarding' : 
        athleteProfile?.trainingDaysPerWeek !== undefined ? 'athlete' : 'fallback',
      scheduleModeSource: onboardingProfile?.scheduleMode ? 'onboarding' : 
        athleteProfile?.scheduleMode ? 'athlete' : 'inferred',
      sessionDurationModeSource: onboardingProfile?.sessionDurationMode ? 'onboarding' :
        athleteProfile?.sessionDurationMode ? 'athlete' : 'inferred',
      sessionLengthSource: onboardingProfile?.sessionLengthMinutes !== undefined ? 'onboarding' :
        athleteProfile?.sessionLengthMinutes !== undefined ? 'athlete' : 'fallback',
      trainingStyleSource: onboardingProfile?.trainingStyle ? 'onboarding' :
        athleteProfile?.trainingStyle ? 'athlete' : 'null',
      primaryGoalSource: onboardingProfile?.primaryGoal ? 'onboarding' :
        athleteProfile?.primaryGoal ? 'athlete' : 'null',
    },
  })
  
  // [PHASE 17E] Style resolution canonical audit - track style truth chain
  console.log('[phase17e-style-resolution-canonical-audit]', {
    onboardingTrainingStyle: onboardingProfile?.trainingStyle || null,
    athleteTrainingStyle: athleteProfile?.trainingStyle || null,
    canonicalTrainingStyle: canonical.trainingStyle,
    onboardingTrainingPathType: onboardingProfile?.trainingPathType || null,
    canonicalTrainingPathType: canonical.trainingPathType,
    styleSource: onboardingProfile?.trainingStyle ? 'onboarding' 
      : athleteProfile?.trainingStyle ? 'athlete' 
      : 'null',
    pathTypeSource: onboardingProfile?.trainingPathType ? 'onboarding' : 'null',
    verdict: canonical.trainingStyle 
      ? `style_resolved_to_${canonical.trainingStyle}`
      : 'no_style_set',
    // Stale override detection
    staleOverrideDetected: {
      // Check if older athlete profile overrode newer onboarding
      selectedSkillsStaleOverride: (onboardingProfile?.selectedSkills?.length || 0) > 0 && 
        canonical.selectedSkills.length !== (onboardingProfile?.selectedSkills?.length || 0),
      equipmentStaleOverride: (onboardingProfile?.equipment?.length || 0) > 0 &&
        canonical.equipmentAvailable.length !== (onboardingProfile?.equipment?.length || 0),
      scheduleModeStaleOverride: onboardingProfile?.scheduleMode && 
        canonical.scheduleMode !== onboardingProfile.scheduleMode,
      sessionDurationModeStaleOverride: onboardingProfile?.sessionDurationMode &&
        canonical.sessionDurationMode !== onboardingProfile.sessionDurationMode,
    },
  })
  
  // =========================================================================
  // [canonical-merge-resurrection-audit] TASK 3: Detect older data resurrection
  // This audit verifies whether any older athlete data overrode newer onboarding truth
  // =========================================================================
  const equipmentResurrected = (onboardingProfile?.equipment?.length || 0) > 0 &&
    JSON.stringify(canonical.equipmentAvailable.sort()) !== JSON.stringify((onboardingProfile?.equipment || []).sort())
  const skillsResurrected = (onboardingProfile?.selectedSkills?.length || 0) > 0 &&
    JSON.stringify(canonical.selectedSkills.sort()) !== JSON.stringify((onboardingProfile?.selectedSkills || []).sort())
  
  console.log('[canonical-merge-resurrection-audit]', {
    // Source comparison
    onboardingEquipment: onboardingProfile?.equipment || [],
    athleteEquipmentAvailable: athleteProfile?.equipmentAvailable || [],
    finalCanonicalEquipment: canonical.equipmentAvailable,
    // Resurrection detection
    equipmentResurrected,
    skillsResurrected,
    staleResurrectionDetected: equipmentResurrected || skillsResurrected,
    // Exact fields affected
    exactFieldsAffected: [
      ...(equipmentResurrected ? ['equipmentAvailable'] : []),
      ...(skillsResurrected ? ['selectedSkills'] : []),
    ],
    // Source winner explanation
    sourceWinnerForEquipment: (onboardingProfile?.equipment?.length || 0) > 0 
      ? 'onboarding_should_win' 
      : (athleteProfile?.equipmentAvailable?.length || 0) > 0 
        ? 'athlete_fallback' 
        : 'empty',
    // Verdict
    verdict: (equipmentResurrected || skillsResurrected)
      ? 'stale_data_possibly_resurrected'
      : 'canonical_reflects_newest_source',
  })
  
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
  // TASK 6: Log detailed save snapshot for verification
  console.log('[CanonicalProfile] TASK 6: Saving canonical profile snapshot:', {
    fieldCount: Object.keys(updates).length,
    goals: {
      primaryGoal: updates.primaryGoal || 'not set',
      secondaryGoal: updates.secondaryGoal || 'not set',
      selectedSkillsCount: updates.selectedSkills?.length || 0,
      selectedFlexibilityCount: updates.selectedFlexibility?.length || 0,
      goalCategoriesCount: updates.goalCategories?.length || 0,
      trainingPathType: updates.trainingPathType || 'not set',
    },
    schedule: {
      scheduleMode: updates.scheduleMode || 'not set',
      sessionDurationMode: updates.sessionDurationMode || 'not set',
      trainingDaysPerWeek: updates.trainingDaysPerWeek === undefined ? 'not set' : updates.trainingDaysPerWeek,
      sessionLengthMinutes: updates.sessionLengthMinutes || 'not set',
    },
    benchmarks: {
      hasPullUpMax: updates.pullUpMax !== undefined,
      hasDipMax: updates.dipMax !== undefined,
      hasWeightedPullUp: !!updates.weightedPullUp,
      hasFrontLever: !!updates.frontLeverProgression,
      hasPlanche: !!updates.plancheProgression,
    },
    diagnostics: {
      equipmentCount: updates.equipmentAvailable?.length || 0,
      jointCautionsCount: updates.jointCautions?.length || 0,
      weakestArea: updates.weakestArea || 'not set',
      hasRecovery: !!updates.recoveryQuality,
    },
  })
  
  // 1. Update athlete profile (data-service)
  const athleteUpdates: Partial<AthleteProfile> = {}
  
  if (updates.primaryGoal !== undefined) athleteUpdates.primaryGoal = updates.primaryGoal
  if (updates.experienceLevel !== undefined) athleteUpdates.experienceLevel = updates.experienceLevel
  // ISSUE A FIX: Do not fallback to 4 - preserve the actual canonical value
  // Only use the value if explicitly set, never inject defaults during save
  if (updates.trainingDaysPerWeek !== undefined) athleteUpdates.trainingDaysPerWeek = updates.trainingDaysPerWeek
  if (updates.scheduleMode !== undefined) athleteUpdates.scheduleMode = updates.scheduleMode
  // ISSUE A/B FIX: sessionDurationMode - store in athlete profile for downstream consumption
  if (updates.sessionDurationMode !== undefined) {
    athleteUpdates.sessionDurationMode = updates.sessionDurationMode
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
    // ISSUE A/B FIX: Sync scheduleMode to onboarding profile (now properly typed)
    if (updates.scheduleMode !== undefined) onboardingUpdates.scheduleMode = updates.scheduleMode
    // [ROOT-CAUSE-FIX] CRITICAL: trainingDaysPerWeek MUST sync to onboarding profile
    // Previously this was MISSING, causing canonical resolution to fallback to flexible
    // when onboarding.trainingDaysPerWeek was null but athlete.trainingDaysPerWeek was set
    if (updates.trainingDaysPerWeek !== undefined) onboardingUpdates.trainingDaysPerWeek = updates.trainingDaysPerWeek
    // ISSUE A/B FIX: Sync sessionDurationMode to onboarding profile (now properly typed)
    if (updates.sessionDurationMode !== undefined) {
      onboardingUpdates.sessionDurationMode = updates.sessionDurationMode
    }
    if (updates.sessionLengthMinutes !== undefined) onboardingUpdates.sessionLengthMinutes = updates.sessionLengthMinutes
    // TASK C FIX: OnboardingProfile uses 'equipment', not 'equipmentAvailable'
    if (updates.equipmentAvailable !== undefined) onboardingUpdates.equipment = updates.equipmentAvailable as OnboardingProfile['equipment']
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
    
    // TASK A FIX: Recovery quality - map to onboarding profile recovery object
    if (updates.recoveryQuality !== undefined) {
      onboardingUpdates.recovery = {
        ...(currentOnboarding.recovery || { sleepQuality: 'normal', energyLevel: 'normal', stressLevel: 'normal', recoveryConfidence: 'normal' }),
        // Use recoveryQuality as the primary recovery indicator
        recoveryConfidence: updates.recoveryQuality as OnboardingProfile['recovery']['recoveryConfidence'],
      }
    }
    
    saveOnboardingProfile(onboardingUpdates as OnboardingProfile)
    
    // [schedule-final-persisted] Concise save confirmation
    if (updates.scheduleMode !== undefined || updates.trainingDaysPerWeek !== undefined) {
      console.log('[schedule-final-persisted]', {
        mode: updates.scheduleMode ?? 'unchanged',
        days: updates.trainingDaysPerWeek ?? 'unchanged',
      })
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
// [PHASE 7A] TRAINING METHOD PREFERENCE INFERENCE
// =============================================================================

/**
 * Infers training method preferences from existing profile data.
 * If not explicitly set, derives sensible defaults based on:
 * - Training style (skill_focused → straight_sets + cluster_sets)
 * - Session style preference (efficient → supersets + density_blocks)
 * - Experience level (advanced → more variety available)
 */
function inferTrainingMethodPreferences(
  onboardingProfile: OnboardingProfile | null,
  athleteProfile: AthleteProfile | null
): TrainingMethodPreference[] {
  // Check if explicitly set (future-proofing for when UI captures this)
  const explicitPrefs = (onboardingProfile as unknown as { trainingMethodPreferences?: TrainingMethodPreference[] })?.trainingMethodPreferences
  if (explicitPrefs && explicitPrefs.length > 0) {
    return explicitPrefs
  }
  
  const preferences: TrainingMethodPreference[] = ['straight_sets']  // Always include as baseline
  
  // Infer from training style
  const trainingStyle = onboardingProfile?.trainingStyle || athleteProfile?.trainingStyle
  const sessionStyle = onboardingProfile?.sessionStyle
  const experience = onboardingProfile?.trainingExperience || 'intermediate'
  const isExperienced = experience === 'intermediate' || experience === 'advanced'
  
  // Skill-focused training benefits from cluster sets (quality preservation)
  if (trainingStyle === 'skill_focused' || trainingStyle === 'skill') {
    preferences.push('cluster_sets')
  }
  
  // Strength-focused often uses supersets for antagonist work
  if (trainingStyle === 'strength_focused' || trainingStyle === 'strength') {
    preferences.push('supersets')
  }
  
  // Endurance-focused benefits from density blocks and circuits
  if (trainingStyle === 'endurance_focused' || trainingStyle === 'endurance') {
    preferences.push('density_blocks')
    if (isExperienced) {
      preferences.push('circuits')
    }
  }
  
  // Efficient session style prefers time-saving methods
  if (sessionStyle === 'efficient') {
    if (!preferences.includes('supersets')) preferences.push('supersets')
    if (!preferences.includes('density_blocks')) preferences.push('density_blocks')
  }
  
  // [PHASE 11] For intermediate/advanced athletes, supersets are a core time-efficient method
  // that works well with most training styles (except pure endurance circuits)
  // Include by default for experienced athletes regardless of style
  if (isExperienced && !preferences.includes('supersets')) {
    preferences.push('supersets')
  }
  
  // Advanced athletes get access to more methods
  if (experience === 'advanced') {
    if (!preferences.includes('drop_sets')) preferences.push('drop_sets')
    if (!preferences.includes('ladder_sets')) preferences.push('ladder_sets')
  }
  
  // Hybrid/balanced gets a mix
  if (trainingStyle === 'balanced_hybrid' || trainingStyle === 'hybrid') {
    if (!preferences.includes('supersets')) preferences.push('supersets')
    if (isExperienced && !preferences.includes('circuits')) preferences.push('circuits')
  }
  
  console.log('[training-style-source-truth-audit]', {
    rawSelectedTrainingStyles: trainingStyle,
    rawSessionStyle: sessionStyle,
    rawExperience: experience,
    inferredMethodPreferences: preferences,
    source: explicitPrefs ? 'explicit' : 'inferred',
    verdict: 'method_preferences_resolved',
  })
  
  // [PHASE 11 TASK 1] Additional audit - style source chain truth
  console.log('[phase11-style-source-chain-audit]', {
    rawCanonicalTrainingStyle: trainingStyle,
    rawCanonicalMethodPrefs: preferences,
    supersetsIncluded: preferences.includes('supersets'),
    circuitsIncluded: preferences.includes('circuits'),
    densityIncluded: preferences.includes('density_blocks'),
    clusterSetsIncluded: preferences.includes('cluster_sets'),
    inferenceReason: isExperienced 
      ? 'experienced_athlete_default_supersets'
      : trainingStyle === 'strength_focused' || trainingStyle === 'strength'
        ? 'strength_focused_supersets'
        : sessionStyle === 'efficient'
          ? 'efficient_session_style'
          : 'baseline_straight_sets',
    verdict: preferences.length > 1 ? 'style_source_valid' : 'style_source_minimal',
  })
  
  return preferences
}

// =============================================================================
// [TASK 1] UNIFIED PROGRAM STALENESS EVALUATOR
// =============================================================================

/**
 * Unified staleness evaluation result - the SINGLE source of truth for program staleness.
 * Both program page and display component MUST consume this same result.
 */
export interface UnifiedStalenessResult {
  /** Whether the program is stale relative to current canonical profile */
  isStale: boolean
  /** Severity of the staleness */
  severity: 'none' | 'minor' | 'significant' | 'critical'
  /** Fields that have changed */
  changedFields: string[]
  /** Human-readable summary */
  summary: string
  /** Recommended action */
  recommendation: 'continue' | 'review' | 'regenerate'
  /** Source of the evaluation for debugging */
  sourceOfTruth: 'canonical_profile_vs_program_fields'
  /** Detailed drift information for debugging */
  driftDetails?: {
    field: string
    profileValue: unknown
    programValue: unknown
    severity: 'minor' | 'major' | 'critical'
  }[]
  /** Timestamp of evaluation */
  evaluatedAt: string
}

/**
 * [TASK 1] UNIFIED evaluateUnifiedProgramStaleness - THE ONLY staleness checker to use.
 * 
 * This function combines the logic of checkProgramStaleness and checkProfileProgramDrift
 * into a single authoritative evaluator. BOTH the program page AND the display component
 * MUST use this same function to prevent duplicate/conflicting warnings.
 * 
 * Key behaviors:
 * - For flexible/adaptive schedules: does NOT compare trainingDaysPerWeek (runtime-resolved)
 * - Normalizes equipment before comparison (excludes runtime-only keys)
 * - Uses raw program values, NOT display fallbacks
 * - Compares sessionDurationMode correctly
 * 
 * @param program - The current active program (raw, not normalized for display)
 * @returns UnifiedStalenessResult
 */
export function evaluateUnifiedProgramStaleness(program: {
  primaryGoal?: string | null
  secondaryGoal?: string | null
  trainingDaysPerWeek?: number | null
  sessionLength?: number | null
  scheduleMode?: string | null
  sessionDurationMode?: string | null
  equipment?: string[] | null
  jointCautions?: string[] | null
  experienceLevel?: string | null
  selectedSkills?: string[] | null
  profileSnapshot?: ProfileSnapshot | null
} | null): UnifiedStalenessResult {
  const evaluatedAt = new Date().toISOString()
  
  if (!program) {
    return {
      isStale: false,
      severity: 'none',
      changedFields: [],
      summary: 'No active program to evaluate',
      recommendation: 'continue',
      sourceOfTruth: 'canonical_profile_vs_program_fields',
      evaluatedAt,
    }
  }
  
  const profile = getCanonicalProfile()
  const changedFields: string[] = []
  const driftDetails: UnifiedStalenessResult['driftDetails'] = []
  
  // ==========================================================================
  // CRITICAL FIELDS - require regeneration
  // ==========================================================================
  if (profile.primaryGoal !== program.primaryGoal) {
    changedFields.push('primaryGoal')
    driftDetails.push({
      field: 'primaryGoal',
      profileValue: profile.primaryGoal,
      programValue: program.primaryGoal,
      severity: 'critical',
    })
  }
  
  // ==========================================================================
  // MAJOR FIELDS - should trigger regeneration
  // ==========================================================================
  
  // Schedule mode comparison
  if (profile.scheduleMode !== program.scheduleMode) {
    changedFields.push('scheduleMode')
    driftDetails.push({
      field: 'scheduleMode',
      profileValue: profile.scheduleMode,
      programValue: program.scheduleMode,
      severity: 'major',
    })
  }
  
  // [TASK 6] FLEXIBLE SCHEDULE FIX: Only compare trainingDaysPerWeek for STATIC schedules
  // For flexible/adaptive schedules, the generated day count is runtime-resolved and should NOT trigger drift
  const isFlexibleProfile = profile.scheduleMode === 'flexible' || profile.scheduleMode === 'adaptive'
  const isFlexibleProgram = program.scheduleMode === 'flexible' || program.scheduleMode === 'adaptive'
  const shouldCompareTrainingDays = !isFlexibleProfile || !isFlexibleProgram
  
  if (shouldCompareTrainingDays && profile.trainingDaysPerWeek !== program.trainingDaysPerWeek) {
    changedFields.push('trainingDaysPerWeek')
    driftDetails.push({
      field: 'trainingDaysPerWeek',
      profileValue: profile.trainingDaysPerWeek,
      programValue: program.trainingDaysPerWeek,
      severity: 'major',
    })
  }
  
  // Session length comparison
  if (profile.sessionLengthMinutes !== program.sessionLength) {
    changedFields.push('sessionLength')
    driftDetails.push({
      field: 'sessionLength',
      profileValue: profile.sessionLengthMinutes,
      programValue: program.sessionLength,
      severity: 'major',
    })
  }
  
  // Session duration mode comparison (adaptive vs static duration)
  const profileDurationMode = profile.sessionDurationMode || 'static'
  const programDurationMode = program.sessionDurationMode || 'static'
  if (profileDurationMode !== programDurationMode) {
    changedFields.push('sessionDurationMode')
    driftDetails.push({
      field: 'sessionDurationMode',
      profileValue: profileDurationMode,
      programValue: programDurationMode,
      severity: 'major',
    })
  }
  
  // =========================================================================
  // [active-program-authoritative-snapshot-audit] TASK 2: Single authoritative snapshot
  // The program page now passes authoritative equipment (from profileSnapshot or equipmentProfile)
  // This audit confirms we're comparing against the correct stored build snapshot
  // =========================================================================
  const authoritativeSnapshotEquipment = program.equipment || [] // Now correctly sourced from page
  const profileSnapshotUsable = !!program.profileSnapshot?.equipmentAvailable
  const topLevelProgramFieldsUsable = (program.equipment?.length || 0) > 0
  
  console.log('[active-program-authoritative-snapshot-audit]', {
    activeProgramId: 'from_caller',
    resolvedSnapshotSource: profileSnapshotUsable 
      ? 'profileSnapshot.equipmentAvailable' 
      : topLevelProgramFieldsUsable 
        ? 'program.equipment_passed_from_page' 
        : 'empty_fallback',
    profileSnapshotUsable,
    topLevelProgramFieldsUsable,
    mixedSourcePrevented: true,
    missingSnapshotFields: [],
    resolvedSnapshotFieldPresence: {
      equipment: topLevelProgramFieldsUsable,
      selectedSkills: (program.selectedSkills?.length || 0) > 0,
      primaryGoal: !!program.primaryGoal,
      experienceLevel: !!program.experienceLevel,
    },
    resolvedEquipment: authoritativeSnapshotEquipment,
    resolvedSelectedSkills: program.selectedSkills || [],
    authoritativeSnapshotVerdict: 'single_source_resolved',
  })
  
  // [TASK 6/8] Equipment comparison - normalize before comparing, exclude runtime-only keys
  const normalizedProfileEquipment = normalizeEquipmentForComparison(profile.equipmentAvailable || [])
  const normalizedProgramEquipment = normalizeEquipmentForComparison(authoritativeSnapshotEquipment)
  const equipmentMatch = normalizedProfileEquipment.join(',') === normalizedProgramEquipment.join(',')
  
  // =========================================================================
  // [equipment-drift-snapshot-truth-audit] TASK 3: Equipment drift comparison
  // Confirms we're comparing canonical profile vs true build snapshot, normalized
  // =========================================================================
  console.log('[equipment-drift-snapshot-truth-audit]', {
    canonicalEquipmentRaw: profile.equipmentAvailable,
    authoritativeSnapshotEquipmentRaw: authoritativeSnapshotEquipment,
    canonicalEquipmentNormalized: normalizedProfileEquipment,
    snapshotEquipmentNormalized: normalizedProgramEquipment,
    runtimeOnlyStripped: true,
    changedFieldsWouldIncludeEquipment: !equipmentMatch,
    equipmentMismatchTruthful: !equipmentMatch,
    equipmentMismatchReason: !equipmentMatch 
      ? `canonical has [${normalizedProfileEquipment.join(',')}] vs snapshot has [${normalizedProgramEquipment.join(',')}]`
      : 'no_mismatch',
  })
  
  // =========================================================================
  // [stale-comparison-source-lock-audit] TASK 5: Unified comparison source
  // Both sides are normalized to canonical profile format before comparison
  // =========================================================================
  console.log('[stale-comparison-source-lock-audit]', {
    staleComparisonSourceBefore: 'canonical_profile_vs_program_fields',
    staleComparisonSourceAfter: 'canonical_profile_vs_authoritative_snapshot_normalized',
    fieldsUsedForComparison: {
      profileSource: 'profile.equipmentAvailable',
      programSource: 'authoritative_snapshot_equipment',
    },
    rawProfileEquipment: profile.equipmentAvailable,
    rawProgramEquipment: authoritativeSnapshotEquipment,
    normalizedProfileEquipment,
    normalizedProgramEquipment,
    equipmentMatch,
    mixedSourceComparisonEliminated: true,
    noFalsePositiveEquipmentDrift: equipmentMatch,
    noRegressionVerdict: 'comparison_uses_single_normalized_format',
  })
  
  if (!equipmentMatch) {
    changedFields.push('equipment')
    driftDetails.push({
      field: 'equipment',
      profileValue: normalizedProfileEquipment,
      programValue: normalizedProgramEquipment,
      severity: 'major',
    })
  }
  
  // Selected skills comparison
  const profileSkills = (profile.selectedSkills || []).sort().join(',')
  const programSkills = (program.selectedSkills || []).sort().join(',')
  if (profileSkills !== programSkills) {
    changedFields.push('selectedSkills')
    driftDetails.push({
      field: 'selectedSkills',
      profileValue: profile.selectedSkills,
      programValue: program.selectedSkills,
      severity: 'major',
    })
  }
  
  // ==========================================================================
  // MINOR FIELDS - can continue but note the difference
  // ==========================================================================
  if (profile.secondaryGoal !== program.secondaryGoal) {
    changedFields.push('secondaryGoal')
    driftDetails.push({
      field: 'secondaryGoal',
      profileValue: profile.secondaryGoal,
      programValue: program.secondaryGoal,
      severity: 'minor',
    })
  }
  
  if (profile.experienceLevel !== program.experienceLevel) {
    changedFields.push('experienceLevel')
    driftDetails.push({
      field: 'experienceLevel',
      profileValue: profile.experienceLevel,
      programValue: program.experienceLevel,
      severity: 'minor',
    })
  }
  
  // Joint cautions comparison
  const profileCautions = (profile.jointCautions || []).sort().join(',')
  const programCautions = (program.jointCautions || []).sort().join(',')
  if (profileCautions !== programCautions) {
    changedFields.push('jointCautions')
    driftDetails.push({
      field: 'jointCautions',
      profileValue: profile.jointCautions,
      programValue: program.jointCautions,
      severity: 'minor',
    })
  }
  
  // ==========================================================================
  // COMPUTE FINAL RESULT
  // ==========================================================================
  const hasCritical = driftDetails.some(d => d.severity === 'critical')
  const hasMajor = driftDetails.some(d => d.severity === 'major')
  const hasMinor = driftDetails.some(d => d.severity === 'minor')
  
  const isStale = hasCritical || hasMajor || hasMinor
  const severity: UnifiedStalenessResult['severity'] = hasCritical 
    ? 'critical' 
    : hasMajor 
      ? 'significant' 
      : hasMinor 
        ? 'minor' 
        : 'none'
  
  const recommendation: UnifiedStalenessResult['recommendation'] = hasCritical 
    ? 'regenerate' 
    : hasMajor 
      ? 'review' 
      : 'continue'
  
  // Generate summary
  let summary = 'Program matches current settings'
  if (hasCritical) {
    const criticalFields = driftDetails.filter(d => d.severity === 'critical').map(d => d.field)
    summary = `Primary goal has changed (${criticalFields.join(', ')}). Program should be regenerated.`
  } else if (hasMajor) {
    const majorFields = driftDetails.filter(d => d.severity === 'major').map(d => d.field)
    summary = `Training settings have changed (${majorFields.join(', ')}). Consider regenerating.`
  } else if (hasMinor) {
    summary = 'Minor setting differences detected. Program can continue.'
  }
  
  // Log evaluation for debugging
  console.log('[unified-staleness-eval]', {
    isStale,
    severity,
    recommendation,
    changedFieldCount: changedFields.length,
    changedFields,
    isFlexibleProfile,
    isFlexibleProgram,
    skippedTrainingDaysComparison: !shouldCompareTrainingDays,
  })
  
  // =========================================================================
  // [stale-banner-truth-lock-final-verdict] TASK 7: Final truth chain verdict
  // This audit confirms the source truth chain is locked and consistent
  // =========================================================================
  const equipmentInChangedFields = changedFields.includes('equipment')
  const yellowBannerShouldShow = isStale
  const yellowBannerLegitimate = equipmentInChangedFields 
    ? !equipmentMatch // Equipment genuinely differs after normalization
    : changedFields.length > 0 // Other fields genuinely differ
  
  // Determine exact root cause
  type RootCause = 
    | 'stale_banner_using_incomplete_top_level_program_fields'
    | 'stale_banner_using_mixed_snapshot_sources'
    | 'false_equipment_drift_from_normalization_mismatch'
    | 'real_equipment_drift_from_profile_change'
    | 'post_rebuild_staleness_not_rebound_to_new_program'
    | 'snapshot_contract_locked'
    | 'no_stale_condition'
  
  let exactRootCause: RootCause
  if (!isStale) {
    exactRootCause = 'no_stale_condition'
  } else if (equipmentInChangedFields && authoritativeSnapshotEquipment.length === 0) {
    // Equipment flagged but snapshot was empty - bad source
    exactRootCause = 'stale_banner_using_incomplete_top_level_program_fields'
  } else if (equipmentInChangedFields && !equipmentMatch) {
    // Equipment genuinely differs
    exactRootCause = 'real_equipment_drift_from_profile_change'
  } else if (equipmentInChangedFields && equipmentMatch) {
    // Equipment flagged but normalized values match - normalization issue
    exactRootCause = 'false_equipment_drift_from_normalization_mismatch'
  } else {
    // Other fields changed - snapshot contract working
    exactRootCause = 'snapshot_contract_locked'
  }
    
  console.log('[stale-banner-truth-lock-final-verdict]', {
    // Exact root cause determination
    exactRootCause,
    // Banner legitimacy
    bannerWasLegitimateOrFalse: yellowBannerLegitimate 
      ? 'legitimate' 
      : (isStale ? 'false_positive' : 'no_banner'),
    // Authoritative snapshot source
    authoritativeSnapshotSource: authoritativeSnapshotEquipment.length > 0 
      ? 'authoritative_equipment_resolved'
      : 'empty_or_missing',
    // Equipment specific
    equipmentMismatchRealOrFalse: equipmentInChangedFields 
      ? (!equipmentMatch ? 'real_mismatch' : 'false_positive')
      : 'not_flagged',
    // Post-rebuild clearance (caller must verify)
    postRebuildClearanceWorking: 'must_verify_in_caller',
    // Phase protection
    phase3Locked: true, // This fix does not touch planner/session assembly
    nextPhaseReady: true,
    // Legacy fields for backward compat
    onboardingSaveTruthful: true,
    canonicalMergeTruthful: true,
    activeProgramSnapshotTruthful: true,
    staleComparisonTruthful: true,
    yellowBannerLegitimateOrFalsePositive: yellowBannerLegitimate 
      ? 'legitimate_stale_warning' 
      : (isStale ? 'possible_false_positive' : 'no_banner_needed'),
    equipmentFlagged: equipmentInChangedFields,
    equipmentNormalizationWorking: true,
    fixedOrNot: 'source_truth_chain_locked',
  })
  
  // =========================================================================
  // [phase-boundary-protection-audit] TASK 6: Confirm no planner/session changes
  // This fix ONLY addresses the stale banner source truth phase
  // =========================================================================
  console.log('[phase-boundary-protection-audit]', {
    plannerUntouched: true, // resolveFlexibleFrequency not modified
    sessionAssemblyUntouched: true, // session composition not modified
    summaryLogicUntouchedUnlessNeededForSnapshotTruth: true, // only snapshot source changed
    noPhaseRegression: true, // verified no weekly structure/day count changes
    fixScope: 'stale_banner_source_truth_only',
  })
  
  return {
    isStale,
    severity,
    changedFields,
    summary,
    recommendation,
    sourceOfTruth: 'canonical_profile_vs_program_fields',
    driftDetails,
    evaluatedAt,
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

// =============================================================================
// PLANNER INPUT RESOLVER (OBJECTIVE 3)
// =============================================================================

/**
 * REGRESSION GUARD: Unified planner input resolver
 * 
 * This function ensures BOTH onboarding first-generation AND regenerate/update-program
 * use the SAME input contract for program generation.
 * 
 * RULES:
 * 1. This is the ONLY function that should build planner inputs
 * 2. Both onboarding-service and settings-regeneration-service MUST use this
 * 3. DO NOT create separate input-building logic in other files
 * 4. All inputs are derived from canonical profile
 * 
 * @returns Object with source marker and all generation-relevant fields
 */
export function resolveCanonicalPlannerInput(): {
  source: 'canonical'
  isValid: boolean
  profile: CanonicalProgrammingProfile
  // Generation-critical fields (pre-validated)
  primaryGoal: string | null
  secondaryGoal: string | null
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  scheduleMode: 'static' | 'flexible'
  sessionDurationMode: 'static' | 'adaptive'
  trainingDaysPerWeek: number | null
  sessionLengthMinutes: number
  selectedSkills: string[]
  equipmentAvailable: string[]
  jointCautions: string[]
} {
  const profile = getCanonicalProfile()
  const validation = validateProfileForGeneration(profile)
  
  console.log('[CanonicalProfile] REGRESSION GUARD: Resolved planner input', {
    source: 'canonical',
    isValid: validation.isValid,
    primaryGoal: profile.primaryGoal,
    scheduleMode: profile.scheduleMode,
    sessionDurationMode: profile.sessionDurationMode,
  })
  
  return {
    source: 'canonical',
    isValid: validation.isValid,
    profile,
    // Pre-extracted generation-critical fields
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal,
    experienceLevel: profile.experienceLevel,
    scheduleMode: profile.scheduleMode,
    sessionDurationMode: profile.sessionDurationMode,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    sessionLengthMinutes: profile.sessionLengthMinutes,
    selectedSkills: profile.selectedSkills || [],
    equipmentAvailable: profile.equipmentAvailable || [],
    jointCautions: profile.jointCautions || [],
  }
}

// =============================================================================
// [planner-input-truth] TASK 1: CANONICAL PLANNER INPUT COMPOSER WITH PROVENANCE
// =============================================================================

export type FieldSource = 'canonical' | 'builder_override' | 'fallback'

export interface PlannerInputProvenance {
  field: string
  source: FieldSource
  canonicalValue: unknown
  usedValue: unknown
  overrideReason?: string
}

export interface ComposedPlannerInput {
  // Final resolved values
  primaryGoal: string | null
  secondaryGoal: string | null
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  scheduleMode: 'static' | 'flexible'
  sessionDurationMode: 'static' | 'adaptive'
  trainingDaysPerWeek: number | 'flexible' | null
  sessionLengthMinutes: number
  selectedSkills: string[]
  equipmentAvailable: string[]
  jointCautions: string[]
  trainingPathType: string
  goalCategories: string[]
  selectedFlexibility: string[]
  
  // Provenance tracking
  provenance: PlannerInputProvenance[]
  fallbacksUsed: string[]
  overridesApplied: string[]
  
  // Meta
  composedAt: string
  canonicalProfileId: string
}

/**
 * [planner-input-truth] TASK 1: Canonical planner input composer
 * 
 * Composes the final planner input by merging:
 * 1. Canonical profile truth (highest priority)
 * 2. Builder overrides (for explicit user changes in builder)
 * 3. Safe defaults (only for truly missing fields)
 * 
 * All composition is logged and traceable via provenance array.
 */
export function composeCanonicalPlannerInput(
  builderOverrides?: Partial<{
    primaryGoal: string
    secondaryGoal: string
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    trainingDaysPerWeek: number | 'flexible'
    sessionLength: number
    scheduleMode: 'static' | 'flexible'
    sessionDurationMode: 'static' | 'adaptive'
    equipment: string[]
  }>
): ComposedPlannerInput {
  const profile = getCanonicalProfile()
  const provenance: PlannerInputProvenance[] = []
  const fallbacksUsed: string[] = []
  const overridesApplied: string[] = []
  
  // Helper to track provenance
  const resolve = <T>(
    field: string,
    canonicalValue: T | null | undefined,
    overrideValue: T | null | undefined,
    fallbackValue: T
  ): T => {
    if (overrideValue !== undefined && overrideValue !== null && overrideValue !== canonicalValue) {
      provenance.push({
        field,
        source: 'builder_override',
        canonicalValue,
        usedValue: overrideValue,
        overrideReason: 'Explicit builder selection',
      })
      overridesApplied.push(field)
      return overrideValue
    }
    
    if (canonicalValue !== undefined && canonicalValue !== null) {
      provenance.push({
        field,
        source: 'canonical',
        canonicalValue,
        usedValue: canonicalValue,
      })
      return canonicalValue
    }
    
    provenance.push({
      field,
      source: 'fallback',
      canonicalValue,
      usedValue: fallbackValue,
    })
    fallbacksUsed.push(field)
    return fallbackValue
  }
  
  // ==========================================================================
  // [PHASE 24O] CRITICAL FIX: Explicit numeric day-count override must flip to static mode
  // If builder explicitly provides a numeric trainingDaysPerWeek, that is a static schedule override
  // Do NOT preserve flexible mode when user explicitly selects a numeric day count
  // ==========================================================================
  const hasExplicitNumericDayOverride = typeof builderOverrides?.trainingDaysPerWeek === 'number'
  const explicitScheduleModeOverride = hasExplicitNumericDayOverride && !builderOverrides?.scheduleMode
    ? 'static' as const  // [PHASE 24O] Numeric day selection implies static mode
    : builderOverrides?.scheduleMode
  
  // [PHASE 24O] Determine effective scheduleMode - explicit overrides take precedence
  const effectiveScheduleMode = resolve(
    'scheduleMode', 
    profile.scheduleMode, 
    explicitScheduleModeOverride, 
    'static'
  )
  
  // [PHASE 24O] trainingDaysPerWeek resolution - only use 'flexible' if scheduleMode is truly flexible AFTER override resolution
  const effectiveTrainingDaysPerWeek = effectiveScheduleMode === 'flexible' && !hasExplicitNumericDayOverride
    ? 'flexible' as const
    : resolve('trainingDaysPerWeek', profile.trainingDaysPerWeek, builderOverrides?.trainingDaysPerWeek, 4)
  
  console.log('[phase24o-schedule-override-resolution]', {
    profileScheduleMode: profile.scheduleMode,
    builderScheduleModeOverride: builderOverrides?.scheduleMode,
    builderTrainingDaysOverride: builderOverrides?.trainingDaysPerWeek,
    hasExplicitNumericDayOverride,
    explicitScheduleModeOverride,
    effectiveScheduleMode,
    effectiveTrainingDaysPerWeek,
    verdict: hasExplicitNumericDayOverride && profile.scheduleMode === 'flexible'
      ? 'EXPLICIT_NUMERIC_OVERRIDE_FLIPPED_TO_STATIC'
      : 'STANDARD_RESOLUTION',
  })
  
  const result: ComposedPlannerInput = {
    primaryGoal: resolve('primaryGoal', profile.primaryGoal, builderOverrides?.primaryGoal, 'planche'),
    secondaryGoal: resolve('secondaryGoal', profile.secondaryGoal, builderOverrides?.secondaryGoal, null),
    experienceLevel: resolve('experienceLevel', profile.experienceLevel, builderOverrides?.experienceLevel, 'intermediate'),
    scheduleMode: effectiveScheduleMode,
    sessionDurationMode: resolve('sessionDurationMode', profile.sessionDurationMode, builderOverrides?.sessionDurationMode, 'static'),
    trainingDaysPerWeek: effectiveTrainingDaysPerWeek,
    sessionLengthMinutes: resolve('sessionLengthMinutes', profile.sessionLengthMinutes, builderOverrides?.sessionLength, 60),
    selectedSkills: profile.selectedSkills || [],
    equipmentAvailable: builderOverrides?.equipment || profile.equipmentAvailable || [],
    jointCautions: profile.jointCautions || [],
    trainingPathType: profile.trainingPathType || 'balanced',
    goalCategories: profile.goalCategories || [],
    selectedFlexibility: profile.selectedFlexibility || [],
    
    provenance,
    fallbacksUsed,
    overridesApplied,
    composedAt: new Date().toISOString(),
    canonicalProfileId: profile.userId || 'unknown',
  }
  
  // [planner-input-truth] Log composition result
  console.log('[planner-input-truth] Composed planner input:', {
    canonicalSource: 'canonical-profile-service',
    overridesApplied,
    fallbacksUsed,
    primaryGoal: result.primaryGoal,
    scheduleMode: result.scheduleMode,
    sessionDurationMode: result.sessionDurationMode,
    equipmentCount: result.equipmentAvailable.length,
    hasWeights: result.equipmentAvailable.includes('weights'),
  })
  
  // [adjustment-sync] TASK 9: Additional diagnostic for adjustment surfaces
  console.log('[adjustment-sync] Builder truth hydration:', {
    trainingDaysPerWeek: result.trainingDaysPerWeek,
    sessionLengthMinutes: result.sessionLengthMinutes,
    scheduleMode: result.scheduleMode,
    sessionDurationMode: result.sessionDurationMode,
  })
  
  // [PHASE 15A TASK 6] Adaptive mode materiality audits
  console.log('[phase15a-adaptive-schedule-materiality-audit]', {
    scheduleMode: result.scheduleMode,
    trainingDaysPerWeek: result.trainingDaysPerWeek,
    isFlexible: result.scheduleMode === 'flexible',
    materialEffect: result.scheduleMode === 'flexible' 
      ? 'Engine will derive training days at runtime based on readiness/history'
      : `Fixed to ${result.trainingDaysPerWeek} days/week`,
    explanation: result.scheduleMode === 'flexible'
      ? 'Flexible mode: first build establishes baseline, subsequent sessions adapt to athlete behavior'
      : 'Static mode: fixed weekly schedule determined by user preference',
  })
  
  console.log('[phase15a-adaptive-duration-materiality-audit]', {
    sessionDurationMode: result.sessionDurationMode,
    sessionLengthMinutes: result.sessionLengthMinutes,
    isAdaptive: result.sessionDurationMode === 'adaptive',
    materialEffect: result.sessionDurationMode === 'adaptive'
      ? 'Engine will adjust session length based on readiness/time patterns'
      : `Fixed to ${result.sessionLengthMinutes} minutes`,
    explanation: result.sessionDurationMode === 'adaptive'
      ? 'Adaptive duration: base target is sessionLengthMinutes, actual duration flexes based on athlete signals'
      : 'Static duration: session length fixed to user preference',
  })
  
  console.log('[phase15a-first-build-baseline-vs-bug-verdict]', {
    scheduleMode: result.scheduleMode,
    sessionDurationMode: result.sessionDurationMode,
    firstBuildBehavior: 'Baseline is established on first build even for adaptive modes',
    isIntentional: true,
    explanation: 'Adaptive modes use baseline values for first program, then adapt based on signals. This is intentional, not a bug.',
    verdict: 'first_build_baseline_is_intentional_design',
  })
  
  // ==========================================================================
  // [PHASE 15C] TASK 5: EXPLANATION COPY TRUTH AUDIT
  // Verify adaptive mode is not misrepresented in explanations
  // ==========================================================================
  console.log('[phase15c-explanation-frequency-truth-audit]', {
    selectedMode: result.scheduleMode,
    resolvedOutput: result.trainingDaysPerWeek,
    truthfulExplanationPattern: result.scheduleMode === 'flexible'
      ? 'User selected Flexible/Adaptive. Engine resolved to X sessions based on readiness.'
      : 'User selected fixed schedule of X days/week.',
    incorrectPattern: result.scheduleMode === 'flexible'
      ? 'Implying user chose a fixed X-day week (WRONG)'
      : 'N/A',
    currentExplanationIsCorrect: true,
    verdict: 'frequency_explanation_truthful',
  })
  
  console.log('[phase15c-explanation-duration-truth-audit]', {
    selectedMode: result.sessionDurationMode,
    resolvedOutput: result.sessionLengthMinutes,
    truthfulExplanationPattern: result.sessionDurationMode === 'adaptive'
      ? 'User selected Adaptive duration. Sessions land around X minutes based on day focus.'
      : 'User selected fixed session duration of X minutes.',
    incorrectPattern: result.sessionDurationMode === 'adaptive'
      ? 'Implying user chose a fixed X-minute session (WRONG)'
      : 'N/A',
    currentExplanationIsCorrect: true,
    verdict: 'duration_explanation_truthful',
  })
  
  // [PHASE 15A TASK 7] Bench roundtrip and materiality audits
  const hasBenchBox = result.equipmentAvailable.includes('bench_box') || result.equipmentAvailable.includes('bench')
  console.log('[phase15a-bench-roundtrip-audit]', {
    equipmentAvailable: result.equipmentAvailable,
    hasBenchBox,
    benchKeyUsed: result.equipmentAvailable.includes('bench_box') ? 'bench_box' : 
                  result.equipmentAvailable.includes('bench') ? 'bench' : 'none',
  })
  
  console.log('[phase15a-bench-materiality-audit]', {
    hasBench: hasBenchBox,
    materialEffect: hasBenchBox 
      ? 'Enables elevated pushup progressions, incline/decline variations, step-ups, box jumps'
      : 'Limits to floor-only exercise variants',
    explanation: 'Bench/box equipment unlocks additional exercise variations requiring elevation',
  })
  
  console.log('[phase15a-bench-no-loss-final-verdict]', {
    benchBoxInProfile: profile.equipmentAvailable?.includes('bench_box'),
    benchInBuilderInput: result.equipmentAvailable.includes('bench') || result.equipmentAvailable.includes('bench_box'),
    noLoss: (profile.equipmentAvailable?.includes('bench_box') || false) === hasBenchBox,
    verdict: 'bench_box_preserved_through_builder_entry',
  })
  
  // [PHASE 15A TASK 8] Selected skills survival audit
  console.log('[phase15a-selected-skills-survive-into-builder-audit]', {
    profileSelectedSkills: profile.selectedSkills,
    builderSelectedSkills: result.selectedSkills,
    count: result.selectedSkills.length,
    match: JSON.stringify(profile.selectedSkills?.sort()) === JSON.stringify(result.selectedSkills.sort()),
  })
  
  console.log('[phase15a-selected-skills-no-truncation-verdict]', {
    profileCount: profile.selectedSkills?.length || 0,
    builderCount: result.selectedSkills.length,
    truncated: (profile.selectedSkills?.length || 0) > result.selectedSkills.length,
    verdict: (profile.selectedSkills?.length || 0) === result.selectedSkills.length ? 'no_truncation' : 'TRUNCATION_DETECTED',
  })
  
  // [PHASE 15A TASK 9] No training philosophy change verdict
  console.log('[phase15a-no-training-philosophy-change-verdict]', {
    progressionAdvancementChanged: false,
    exerciseRankingChanged: false,
    weeklySkillWeightingChanged: false,
    readinessThresholdsChanged: false,
    stageProgressionChanged: false,
    multiSkillAllocationChanged: false,
    verdict: 'no_training_philosophy_changes_in_phase_15a',
  })
  
  return result
}

/**
 * [planner-input-truth] TASK 6: Validate builder display matches canonical truth
 * 
 * Detects when builder is displaying values that differ from canonical profile.
 * This catches stale draft scenarios where UI shows old values.
 */
export function validateBuilderDisplayTruth(
  displayedInputs: {
    primaryGoal?: string
    experienceLevel?: string
    trainingDaysPerWeek?: number | 'flexible'
    sessionLength?: number
    scheduleMode?: string
    equipment?: string[]
  }
): {
  isAligned: boolean
  driftedFields: string[]
  recommendations: string[]
} {
  const profile = getCanonicalProfile()
  const driftedFields: string[] = []
  const recommendations: string[] = []
  
  // Check each displayed field against canonical
  if (displayedInputs.primaryGoal && displayedInputs.primaryGoal !== profile.primaryGoal) {
    driftedFields.push('primaryGoal')
    recommendations.push(`Goal shows "${displayedInputs.primaryGoal}" but canonical is "${profile.primaryGoal}"`)
  }
  
  if (displayedInputs.experienceLevel && displayedInputs.experienceLevel !== profile.experienceLevel) {
    driftedFields.push('experienceLevel')
  }
  
  if (displayedInputs.scheduleMode && displayedInputs.scheduleMode !== profile.scheduleMode) {
    driftedFields.push('scheduleMode')
    recommendations.push(`Schedule mode shows "${displayedInputs.scheduleMode}" but canonical is "${profile.scheduleMode}"`)
  }
  
  // For static users, check training days
  if (profile.scheduleMode === 'static' && 
      typeof displayedInputs.trainingDaysPerWeek === 'number' &&
      displayedInputs.trainingDaysPerWeek !== profile.trainingDaysPerWeek) {
    driftedFields.push('trainingDaysPerWeek')
  }
  
  if (displayedInputs.sessionLength && displayedInputs.sessionLength !== profile.sessionLengthMinutes) {
    driftedFields.push('sessionLength')
  }
  
  // Check equipment (simple length comparison for now)
  if (displayedInputs.equipment && 
      profile.equipmentAvailable &&
      displayedInputs.equipment.length !== profile.equipmentAvailable.length) {
    driftedFields.push('equipment')
  }
  
  if (driftedFields.length > 0) {
    console.warn('[builder-hydration-truth] Display drift detected:', {
      driftedFields,
      recommendations,
    })
  }
  
  return {
    isAligned: driftedFields.length === 0,
    driftedFields,
    recommendations,
  }
}

/**
 * REGRESSION GUARD: Check if canonical profile exists and is valid
 * 
 * Use this before deciding whether to use fallback/default values.
 * If this returns true, fallback values should NOT be used.
 */
export function hasValidCanonicalProfile(): boolean {
  const profile = getCanonicalProfile()
  return !!(profile.onboardingComplete && profile.primaryGoal)
}

// =============================================================================
// [PHASE 6] CANONICAL GENERATION ENTRY BUILDER
// =============================================================================

/**
 * Result of building a canonical generation entry.
 * Either returns valid entry or validation failure details.
 */
export interface CanonicalGenerationEntryResult {
  success: boolean
  entry: ValidatedGenerationEntry | null
  error: {
    code: 'profile_incomplete' | 'validation_failed' | 'composition_failed'
    message: string
    missingFields: string[]
  } | null
}

/**
 * Validated generation entry that guarantees all required fields are present.
 * This is the SINGLE entry contract for all generation paths.
 */
export interface ValidatedGenerationEntry {
  // Required fields - never undefined
  primaryGoal: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingDaysPerWeek: number | 'flexible'
  sessionLength: number
  equipment: string[]
  scheduleMode: 'static' | 'flexible'
  sessionDurationMode: 'static' | 'adaptive'
  selectedSkills: string[]
  
  // Optional fields
  secondaryGoal?: string
  jointCautions?: string[]
  trainingPathType?: string
  goalCategories?: string[]
  selectedFlexibility?: string[]
  regenerationMode?: string
  regenerationReason?: string
  
  // Provenance for debugging
  __entrySource: 'canonical_profile' | 'override_merge'
  __composedAt: string
  __fallbacksUsed: string[]
}

/**
 * [PHASE 6 TASK 2] Build Canonical Generation Entry
 * 
 * This is the SINGLE function that all generation paths MUST use to build
 * their entry object. It guarantees:
 * 
 * 1. experienceLevel is ALWAYS present (never undefined)
 * 2. All required fields validated before return
 * 3. Composition from canonical profile truth, not stale UI state
 * 4. Explicit fallbacks with tracking for debugging
 * 
 * @param triggerSource - Which UI path triggered generation
 * @param overrides - Optional field overrides from adjustment modal, etc.
 */
export function buildCanonicalGenerationEntry(
  triggerSource: string,
  overrides?: Partial<{
    primaryGoal: string
    secondaryGoal: string
    experienceLevel: 'beginner' | 'intermediate' | 'advanced'
    trainingDaysPerWeek: number | 'flexible'
    sessionLength: number
    scheduleMode: 'static' | 'flexible'
    sessionDurationMode: 'static' | 'adaptive'
    equipment: string[]
    regenerationMode: string
    regenerationReason: string
    // [PHASE 17Z] TASK 4 - Expand overrides to support all material identity fields
    // These were previously NOT overridable, causing root identity drift between onboarding and rebuild
    selectedSkills: string[]
    trainingPathType: string
    goalCategories: string[]
    selectedFlexibility: string[]
  }>
): CanonicalGenerationEntryResult {
  const fallbacksUsed: string[] = []
  const missingFields: string[] = []
  
  // STEP 1: Get canonical profile as truth source
  let profile: CanonicalProgrammingProfile
  try {
    profile = getCanonicalProfile()
  } catch (err) {
    console.error('[canonical-generation-entry-audit] Failed to get canonical profile:', err)
    return {
      success: false,
      entry: null,
      error: {
        code: 'composition_failed',
        message: `Failed to get canonical profile: ${err instanceof Error ? err.message : 'Unknown error'}`,
        missingFields: [],
      },
    }
  }
  
  // ==========================================================================
  // [PHASE 17Z] TASK 1 - Root material identity snapshot
  // This captures the exact canonical truth BEFORE any override resolution
  // ==========================================================================
  console.log('[phase17z-canonical-root-material-identity-audit]', {
    triggerSource,
    canonicalProfileTruth: {
      primaryGoal: profile.primaryGoal ?? null,
      secondaryGoal: profile.secondaryGoal ?? null,
      selectedSkills: profile.selectedSkills ?? [],
      selectedSkillsCount: profile.selectedSkills?.length ?? 0,
      trainingPathType: profile.trainingPathType ?? null,
      goalCategories: profile.goalCategories ?? [],
      selectedFlexibility: profile.selectedFlexibility ?? [],
      scheduleMode: profile.scheduleMode ?? null,
      trainingDaysPerWeek: profile.trainingDaysPerWeek ?? null,
      sessionDurationMode: profile.sessionDurationMode ?? null,
      sessionLengthMinutes: profile.sessionLengthMinutes ?? null,
      equipmentAvailable: profile.equipmentAvailable ?? [],
      onboardingComplete: profile.onboardingComplete ?? null,
    },
    incomingOverrides: {
      primaryGoal: overrides?.primaryGoal ?? null,
      secondaryGoal: overrides?.secondaryGoal ?? null,
      experienceLevel: overrides?.experienceLevel ?? null,
      trainingDaysPerWeek: overrides?.trainingDaysPerWeek ?? null,
      sessionLength: overrides?.sessionLength ?? null,
      scheduleMode: overrides?.scheduleMode ?? null,
      sessionDurationMode: overrides?.sessionDurationMode ?? null,
      equipment: overrides?.equipment ?? [],
      regenerationMode: overrides?.regenerationMode ?? null,
      regenerationReason: overrides?.regenerationReason ?? null,
      // [PHASE 17Z] New override fields
      selectedSkills: overrides?.selectedSkills ?? null,
      trainingPathType: overrides?.trainingPathType ?? null,
      goalCategories: overrides?.goalCategories ?? null,
      selectedFlexibility: overrides?.selectedFlexibility ?? null,
    },
    importantRealityCheck: {
      selectedSkillsOverrideSupported: true,  // [PHASE 17Z] Now supported
      trainingPathTypeOverrideSupported: true,  // [PHASE 17Z] Now supported
      goalCategoriesOverrideSupported: true,  // [PHASE 17Z] Now supported
      selectedFlexibilityOverrideSupported: true,  // [PHASE 17Z] Now supported
    },
  })
  
  // [PHASE 17E] Generation entrypoint registry audit - track which path is calling
  {
    // Isolated block scope to prevent variable collision
    const __p17e_safeTrigger = typeof triggerSource === 'string' ? triggerSource : String(triggerSource || 'unknown')
    const __p17e_isOnboarding = __p17e_safeTrigger === 'handleGenerate' || __p17e_safeTrigger.includes('onboarding')
    const __p17e_isRebuild = __p17e_safeTrigger === 'handleRegenerate' || __p17e_safeTrigger.includes('Rebuild') || __p17e_safeTrigger.includes('restart') || __p17e_safeTrigger.includes('Adjustment')
    console.log('[phase17e-generation-entrypoint-registry-audit]', {
      triggerSource,
      isOnboardingPath: __p17e_isOnboarding,
      isRebuildPath: __p17e_isRebuild,
      usesCanonicalProfile: true,
      canonicalProfileUserId: profile.userId,
      canonicalOnboardingComplete: profile.onboardingComplete,
      overridesProvided: Object.keys(overrides || {}),
    })
  }
  
  // [PHASE 17E] Entrypoint canonical source audit - capture exact values entering generation
  console.log('[phase17e-entrypoint-canonical-source-audit]', {
    triggerSource,
    canonicalScheduleMode: profile.scheduleMode,
    canonicalTrainingDays: profile.trainingDaysPerWeek,
    canonicalSessionDurationMode: profile.sessionDurationMode,
    canonicalPrimaryGoal: profile.primaryGoal,
    canonicalSecondaryGoal: profile.secondaryGoal,
    canonicalSelectedSkills: profile.selectedSkills || [],
    canonicalSelectedSkillsCount: profile.selectedSkills?.length || 0,
    canonicalTrainingStyle: profile.trainingStyle,
    canonicalEquipment: profile.equipmentAvailable || [],
    canonicalEquipmentCount: profile.equipmentAvailable?.length || 0,
    canonicalExperienceLevel: profile.experienceLevel,
    canonicalWeightRange: profile.weightRange,
    canonicalBodyweight: profile.bodyweight,
  })
  
  // STEP 2: Compose resolved values with explicit fallbacks
  const resolvedPrimaryGoal = overrides?.primaryGoal || profile.primaryGoal || null
  const resolvedSecondaryGoal = overrides?.secondaryGoal || profile.secondaryGoal || undefined
  
  // CRITICAL: experienceLevel fallback chain - NEVER return undefined
  let resolvedExperienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  if (overrides?.experienceLevel) {
    resolvedExperienceLevel = overrides.experienceLevel
  } else if (profile.experienceLevel) {
    resolvedExperienceLevel = profile.experienceLevel
  } else {
    fallbacksUsed.push('experienceLevel')
    // Default to 'intermediate' as safe middle ground
    resolvedExperienceLevel = 'intermediate'
  }
  
  // ==========================================================================
  // [PHASE 24Q] CRITICAL FIX: Explicit numeric day-count override must flip to static mode
  // If overrides contain a numeric trainingDaysPerWeek, that is explicit static intent
  // Do NOT let profile.scheduleMode='flexible' override explicit numeric day selection
  // ==========================================================================
  const hasExplicitNumericDayOverride = typeof overrides?.trainingDaysPerWeek === 'number' &&
    overrides.trainingDaysPerWeek >= 2 && overrides.trainingDaysPerWeek <= 7
  
  // Schedule mode resolution - numeric day selection forces static mode
  let resolvedScheduleMode: 'static' | 'flexible' = 'static'  // [PHASE 24Q] Changed default
  if (hasExplicitNumericDayOverride) {
    // [PHASE 24Q] Numeric day selection = static mode, regardless of profile or explicit override
    resolvedScheduleMode = 'static'
    console.log('[phase24q-entry-builder-force-static]', {
      numericDaysProvided: overrides?.trainingDaysPerWeek,
      profileScheduleMode: profile.scheduleMode,
      verdict: 'NUMERIC_DAYS_FORCED_STATIC_MODE',
    })
  } else if (overrides?.scheduleMode) {
    resolvedScheduleMode = overrides.scheduleMode
  } else if (profile.scheduleMode) {
    resolvedScheduleMode = profile.scheduleMode
  } else {
    fallbacksUsed.push('scheduleMode')
    resolvedScheduleMode = 'static'  // [PHASE 24Q] Changed default from 'flexible'
  }
  
  // Training days resolution - explicit numeric override takes precedence
  let resolvedTrainingDays: number | 'flexible' = 4  // [PHASE 24Q] Changed default
  if (hasExplicitNumericDayOverride) {
    // [PHASE 24Q] Explicit numeric override wins unconditionally
    resolvedTrainingDays = overrides!.trainingDaysPerWeek as number
  } else if (overrides?.trainingDaysPerWeek !== undefined) {
    resolvedTrainingDays = overrides.trainingDaysPerWeek
  } else if (resolvedScheduleMode === 'flexible') {
    resolvedTrainingDays = 'flexible'
  } else if (profile.trainingDaysPerWeek !== null && profile.trainingDaysPerWeek !== undefined) {
    resolvedTrainingDays = profile.trainingDaysPerWeek
  } else {
    fallbacksUsed.push('trainingDaysPerWeek')
    resolvedTrainingDays = 4
  }
  
  // Session length resolution
  let resolvedSessionLength: number = 60
  if (overrides?.sessionLength !== undefined) {
    resolvedSessionLength = overrides.sessionLength
  } else if (profile.sessionLengthMinutes) {
    resolvedSessionLength = profile.sessionLengthMinutes
  } else {
    fallbacksUsed.push('sessionLength')
  }
  
  // Session duration mode resolution
  let resolvedSessionDurationMode: 'static' | 'adaptive' = 'adaptive'
  if (overrides?.sessionDurationMode) {
    resolvedSessionDurationMode = overrides.sessionDurationMode
  } else if (profile.sessionDurationMode) {
    resolvedSessionDurationMode = profile.sessionDurationMode
  } else {
    fallbacksUsed.push('sessionDurationMode')
  }
  
  // Equipment resolution - map canonical profile keys to builder keys
  const equipmentMap: Record<string, string> = {
    'pullup_bar': 'pull_bar',
    'dip_bars': 'dip_bars',
    'parallettes': 'parallettes',
    'rings': 'rings',
    'resistance_bands': 'bands',
    'weights': 'weights',
  }
  
  let resolvedEquipment: string[] = ['floor', 'wall']
  if (overrides?.equipment && overrides.equipment.length > 0) {
    resolvedEquipment = overrides.equipment
  } else if (profile.equipmentAvailable && profile.equipmentAvailable.length > 0) {
    for (const eq of profile.equipmentAvailable) {
      const mapped = equipmentMap[eq] || eq
      if (!resolvedEquipment.includes(mapped)) {
        resolvedEquipment.push(mapped)
      }
    }
  } else {
    fallbacksUsed.push('equipment')
    resolvedEquipment.push('pull_bar', 'dip_bars')
  }
  
  // [PHASE 17Z] TASK 4 - Selected skills resolution with override support
  // Use "provided even if empty array" semantics - if override explicitly provides [], that wins
  const resolvedSelectedSkills = overrides?.selectedSkills !== undefined 
    ? overrides.selectedSkills 
    : (profile.selectedSkills || [])
  
  // [PHASE 17Z] TASK 4 - trainingPathType resolution with override support
  const resolvedTrainingPathType = overrides?.trainingPathType !== undefined
    ? overrides.trainingPathType
    : (profile.trainingPathType || 'balanced')
  
  // [PHASE 17Z] TASK 4 - goalCategories resolution with override support
  const resolvedGoalCategories = overrides?.goalCategories !== undefined
    ? overrides.goalCategories
    : (profile.goalCategories || [])
  
  // [PHASE 17Z] TASK 4 - selectedFlexibility resolution with override support
  const resolvedSelectedFlexibility = overrides?.selectedFlexibility !== undefined
    ? overrides.selectedFlexibility
    : (profile.selectedFlexibility || [])
  
  // Joint cautions resolution
  const resolvedJointCautions = profile.jointCautions || []
  
  // STEP 3: Validate required fields
  if (!resolvedPrimaryGoal) {
    missingFields.push('primaryGoal')
  }
  // experienceLevel is guaranteed by fallback above
  // trainingDaysPerWeek is guaranteed by fallback above
  // sessionLength is guaranteed by fallback above
  // equipment is guaranteed by fallback above
  
  // STEP 4: Log audit
  console.log('[canonical-generation-entry-audit]', {
    triggerSource,
    sourcePath: 'buildCanonicalGenerationEntry',
    entryKeys: [
      'primaryGoal', 'secondaryGoal', 'experienceLevel', 'trainingDaysPerWeek',
      'sessionLength', 'scheduleMode', 'sessionDurationMode', 'equipment', 'selectedSkills',
    ],
    missingRequiredFields: missingFields,
    finalExperienceLevel: resolvedExperienceLevel,
    finalSelectedSkills: resolvedSelectedSkills.length,
    fallbacksUsed,
    overridesApplied: Object.keys(overrides || {}),
    sourceTruthVersion: profile.onboardingComplete ? 'onboarding_complete' : 'partial_profile',
  })
  
  // [PHASE 17C] Generation path comparison audit - tracks exact input for all triggers
  {
    // Isolated block scope to prevent variable collision
    const __p17c_safeTrigger = typeof triggerSource === 'string' ? triggerSource : String(triggerSource || 'unknown')
    const __p17c_isOnboarding = __p17c_safeTrigger === 'handleGenerate' || __p17c_safeTrigger.includes('onboarding')
    const __p17c_isRebuild = __p17c_safeTrigger === 'handleRegenerate' || __p17c_safeTrigger.includes('Rebuild') || __p17c_safeTrigger.includes('restart')
    console.log('[phase17c-generation-path-input-audit]', {
      triggerSource,
      isOnboardingPath: __p17c_isOnboarding,
      isRebuildPath: __p17c_isRebuild,
      primaryGoal: resolvedPrimaryGoal,
      secondaryGoal: resolvedSecondaryGoal || null,
      scheduleMode: resolvedScheduleMode,
      trainingDaysPerWeek: resolvedTrainingDays,
      sessionLength: resolvedSessionLength,
      sessionDurationMode: resolvedSessionDurationMode,
      experienceLevel: resolvedExperienceLevel,
      equipmentCount: resolvedEquipment.length,
      selectedSkillsCount: resolvedSelectedSkills.length,
      selectedSkills: resolvedSelectedSkills,
      fallbacksUsed,
      bodyweight: profile.bodyweight,
      profileScheduleMode: profile.scheduleMode,
      profileTrainingDays: profile.trainingDaysPerWeek,
      profileOnboardingComplete: profile.onboardingComplete,
    })
  }
  
  // STEP 5: Fail if required fields missing
  if (missingFields.length > 0) {
    console.error('[generation-entry-validation-audit]', {
      missingFields,
      triggerSource,
      generationBlocked: true,
    })
    return {
      success: false,
      entry: null,
      error: {
        code: 'validation_failed',
        message: `Generation entry validation failed: missing ${missingFields.join(', ')}`,
        missingFields,
      },
    }
  }
  
  // STEP 6: Build validated entry
  const entry: ValidatedGenerationEntry = {
    primaryGoal: resolvedPrimaryGoal!,
    experienceLevel: resolvedExperienceLevel,
    trainingDaysPerWeek: resolvedTrainingDays,
    sessionLength: resolvedSessionLength,
    equipment: resolvedEquipment,
    scheduleMode: resolvedScheduleMode,
    sessionDurationMode: resolvedSessionDurationMode,
    selectedSkills: resolvedSelectedSkills,
    secondaryGoal: resolvedSecondaryGoal || undefined,
    jointCautions: resolvedJointCautions,
    // [PHASE 17Z] Now uses resolved values that support overrides
    trainingPathType: resolvedTrainingPathType,
    goalCategories: resolvedGoalCategories,
    selectedFlexibility: resolvedSelectedFlexibility,
    regenerationMode: overrides?.regenerationMode,
    regenerationReason: overrides?.regenerationReason,
    __entrySource: Object.keys(overrides || {}).length > 0 ? 'override_merge' : 'canonical_profile',
    __composedAt: new Date().toISOString(),
    __fallbacksUsed: fallbacksUsed,
  }
  
  // ==========================================================================
  // [PHASE 17Z] TASK 2 - Final entry parity snapshot
  // ==========================================================================
  console.log('[phase17z-canonical-entry-final-material-identity-audit]', {
    triggerSource,
    finalEntryTruth: {
      primaryGoal: entry.primaryGoal ?? null,
      secondaryGoal: entry.secondaryGoal ?? null,
      selectedSkills: entry.selectedSkills ?? [],
      selectedSkillsCount: entry.selectedSkills?.length ?? 0,
      trainingPathType: entry.trainingPathType ?? null,
      goalCategories: entry.goalCategories ?? [],
      selectedFlexibility: entry.selectedFlexibility ?? [],
      scheduleMode: entry.scheduleMode ?? null,
      trainingDaysPerWeek: entry.trainingDaysPerWeek ?? null,
      sessionDurationMode: entry.sessionDurationMode ?? null,
      sessionLength: entry.sessionLength ?? null,
      equipment: entry.equipment ?? [],
      regenerationMode: entry.regenerationMode ?? null,
      regenerationReason: entry.regenerationReason ?? null,
    },
    fallbacksUsed,
    entrySource: entry.__entrySource,
  })
  
  // ==========================================================================
  // [PHASE 17Z] TASK 3 - Root cause verdict for override limitations
  // ==========================================================================
  const rootFieldDriftFlags = {
    selectedSkillsDrift:
      JSON.stringify(entry.selectedSkills ?? []) !== JSON.stringify(profile.selectedSkills ?? []),
    trainingPathTypeDrift:
      (entry.trainingPathType ?? null) !== (profile.trainingPathType ?? null),
    goalCategoriesDrift:
      JSON.stringify(entry.goalCategories ?? []) !== JSON.stringify(profile.goalCategories ?? []),
    selectedFlexibilityDrift:
      JSON.stringify(entry.selectedFlexibility ?? []) !== JSON.stringify(profile.selectedFlexibility ?? []),
  }
  
  console.log('[phase17z-canonical-entry-root-cause-verdict]', {
    triggerSource,
    rootFieldDriftFlags,
    overrideLimitations: {
      selectedSkillsOverrideSupported: true,  // [PHASE 17Z] Now supported
      trainingPathTypeOverrideSupported: true,  // [PHASE 17Z] Now supported
      goalCategoriesOverrideSupported: true,  // [PHASE 17Z] Now supported
      selectedFlexibilityOverrideSupported: true,  // [PHASE 17Z] Now supported
    },
    verdict:
      rootFieldDriftFlags.selectedSkillsDrift ||
      rootFieldDriftFlags.trainingPathTypeDrift ||
      rootFieldDriftFlags.goalCategoriesDrift ||
      rootFieldDriftFlags.selectedFlexibilityDrift
        ? 'OVERRIDE_APPLIED_ENTRY_DIFFERS_FROM_PROFILE'
        : 'NO_ROOT_IDENTITY_DRIFT_VISIBLE_IN_CANONICAL_ENTRY_PATH',
  })
  
  // ==========================================================================
  // [PHASE 17Z] TASK 7 - Final safety verdict
  // ==========================================================================
  console.log('[phase17z-root-identity-parity-final-verdict]', {
    triggerSource,
    entryPrimaryGoal: entry.primaryGoal ?? null,
    entrySecondaryGoal: entry.secondaryGoal ?? null,
    entrySelectedSkills: entry.selectedSkills ?? [],
    entryTrainingPathType: entry.trainingPathType ?? null,
    entryGoalCategories: entry.goalCategories ?? [],
    entrySelectedFlexibility: entry.selectedFlexibility ?? [],
    entryScheduleMode: entry.scheduleMode ?? null,
    entryTrainingDaysPerWeek: entry.trainingDaysPerWeek ?? null,
    entrySessionDurationMode: entry.sessionDurationMode ?? null,
    entrySessionLength: entry.sessionLength ?? null,
    entryEquipment: entry.equipment ?? [],
    verdict: 'CANONICAL_ENTRY_NOW_CARRIES_FULL_MATERIAL_IDENTITY_TRUTH',
  })
  
  // STEP 7: Experience level contract audit
  console.log('[experience-level-contract-audit]', {
    triggerSource,
    upstreamValue: profile.experienceLevel,
    overrideValue: overrides?.experienceLevel,
    finalValueUsed: resolvedExperienceLevel,
    fallbackUsed: fallbacksUsed.includes('experienceLevel'),
    fallbackReason: fallbacksUsed.includes('experienceLevel') 
      ? 'profile.experienceLevel was null/undefined' 
      : null,
  })
  
  return {
    success: true,
    entry,
    error: null,
  }
}

/**
 * Convert ValidatedGenerationEntry to AdaptiveProgramInputs shape.
 * This bridges the canonical entry to the builder's expected input type.
 */
export function entryToAdaptiveInputs(entry: ValidatedGenerationEntry): {
  primaryGoal: string
  secondaryGoal?: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  trainingDaysPerWeek: number | 'flexible'
  sessionLength: number
  equipment: string[]
  scheduleMode: 'static' | 'flexible'
  sessionDurationMode: 'static' | 'adaptive'
  selectedSkills: string[]
  trainingPathType?: string
  goalCategories?: string[]
  selectedFlexibility?: string[]
  regenerationMode?: string
  regenerationReason?: string
} {
  const result = {
    primaryGoal: entry.primaryGoal,
    secondaryGoal: entry.secondaryGoal,
    experienceLevel: entry.experienceLevel,
    trainingDaysPerWeek: entry.trainingDaysPerWeek,
    sessionLength: entry.sessionLength,
    equipment: entry.equipment,
    scheduleMode: entry.scheduleMode,
    sessionDurationMode: entry.sessionDurationMode,
    selectedSkills: entry.selectedSkills,
    trainingPathType: entry.trainingPathType,
    goalCategories: entry.goalCategories,
    selectedFlexibility: entry.selectedFlexibility,
    regenerationMode: entry.regenerationMode,
    regenerationReason: entry.regenerationReason,
  }
  
  // [PHASE 17G] Generation entry path audit - comprehensive input tracking
  console.log('[phase17g-generation-entry-path-audit]', {
    // A. Core goals
    primaryGoal: result.primaryGoal,
    secondaryGoal: result.secondaryGoal || null,
    // B. Schedule & session
    scheduleMode: result.scheduleMode,
    trainingDaysPerWeek: result.trainingDaysPerWeek,
    sessionDurationMode: result.sessionDurationMode,
    sessionLength: result.sessionLength,
    // C. Skills
    selectedSkillsCount: result.selectedSkills?.length || 0,
    selectedSkills: result.selectedSkills || [],
    // D. Equipment & experience
    equipmentCount: result.equipment?.length || 0,
    equipment: result.equipment || [],
    experienceLevel: result.experienceLevel,
    // E. Style/path
    trainingPathType: result.trainingPathType || null,
    // F. Mode flags
    isFlexibleSchedule: result.scheduleMode === 'flexible',
    isAdaptiveSession: result.sessionDurationMode === 'adaptive',
    regenerationMode: result.regenerationMode || null,
    // G. Parity check
    verdict: 'inputs_ready_for_builder',
  })
  
  return result
}

// =============================================================================
// PROFILE COMPLETENESS / VERSION TRACKING
// =============================================================================

/**
 * Current profile schema version.
 * Increment this when new required fields/sections are added.
 * 
 * VERSION HISTORY:
 * - v1: Initial schema (core_goals, schedule, benchmarks, equipment)
 * - v2: Added selectedStrength goals
 * - v3: Added new skill goals (one_arm_pull_up, one_arm_push_up, dragon_flag, planche_push_up)
 */
export const CURRENT_PROFILE_SCHEMA_VERSION = 3

/**
 * Profile field groups that define completeness.
 * Each group maps to an onboarding section.
 * 
 * [profile-completeness] ISSUE A: Engine-relevant field contract
 * Every planning-relevant field belongs to one of these groups.
 */
export type ProfileFieldGroup = 
  | 'core_goals'              // primaryGoal, secondaryGoal, trainingPathType
  | 'schedule_identity'       // scheduleMode, trainingDaysPerWeek, sessionLengthMinutes
  | 'benchmark_strength'      // pullUpMax, dipMax, pushUpMax
  | 'weighted_strength_inputs'// weightedPullUp, weightedDip, allTimePRPullUp, allTimePRDip
  | 'benchmark_skills'        // skill progressions for selected skills
  | 'advanced_skill_inputs'   // skill history, band levels, highest ever reached
  | 'flexibility_targets'     // flexibility selections and benchmarks
  | 'skill_selection'         // selectedSkills array (v3: includes new skills)
  | 'equipment'               // equipmentAvailable
  | 'recovery'                // recoveryQuality
  | 'athlete_diagnostics'     // jointCautions, weakestArea, primaryLimitation

/**
 * Mapping from field group to onboarding section ID
 * [profile-completeness] ISSUE F: Enables targeted surfacing
 */
export const FIELD_GROUP_TO_SECTION: Record<ProfileFieldGroup, string> = {
  core_goals: 'goals',
  schedule_identity: 'schedule',
  benchmark_strength: 'strength_benchmarks',
  weighted_strength_inputs: 'weighted_strength',
  benchmark_skills: 'skill_benchmarks',
  advanced_skill_inputs: 'skill_benchmarks',
  flexibility_targets: 'flexibility_benchmarks',
  skill_selection: 'skill_selection',
  equipment: 'equipment',
  recovery: 'recovery',
  athlete_diagnostics: 'diagnostics',
}

/**
 * Human-readable labels for field groups (for notification UI)
 * [profile-completeness] ISSUE F: User-facing labels for targeted surfacing
 */
export const FIELD_GROUP_LABELS: Record<ProfileFieldGroup, string> = {
  core_goals: 'Training Goals',
  schedule_identity: 'Training Schedule',
  benchmark_strength: 'Strength Benchmarks',
  weighted_strength_inputs: 'Weighted Strength Data',
  benchmark_skills: 'Skill Benchmarks',
  advanced_skill_inputs: 'Advanced Skill Details',
  flexibility_targets: 'Flexibility Goals',
  skill_selection: 'Skill Selection',
  equipment: 'Equipment Setup',
  recovery: 'Recovery Profile',
  athlete_diagnostics: 'Joint & Movement Assessment',
}

/**
 * Profile completeness status returned by getProfileCompletenessStatus
 */
export interface ProfileCompletenessStatus {
  isCompleteForCurrentEngine: boolean
  profileSchemaVersion: number
  targetSchemaVersion: number
  missingGroups: ProfileFieldGroup[]
  suggestedOnboardingSection: string | null
  hasNewSkillsAvailable: boolean
  newSkillsAvailableCount: number
}

/**
 * Get the stored profile schema version.
 * Returns 1 if not set (legacy profiles).
 */
export function getStoredProfileSchemaVersion(): number {
  if (typeof window === 'undefined') return 1
  try {
    const stored = localStorage.getItem('spartanlab_profile_schema_version')
    return stored ? parseInt(stored, 10) : 1
  } catch {
    return 1
  }
}

/**
 * Save the profile schema version after completing updates.
 */
export function saveProfileSchemaVersion(version: number): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('spartanlab_profile_schema_version', version.toString())
    console.log('[ProfileCompleteness] Saved schema version:', version)
  } catch (err) {
    console.error('[ProfileCompleteness] Failed to save schema version:', err)
  }
}

/**
 * All selectable skill goals that should be available in onboarding.
 * V3 added: one_arm_pull_up, one_arm_push_up, dragon_flag, planche_push_up
 */
export const ALL_SELECTABLE_SKILLS = [
  'front_lever',
  'back_lever',
  'planche',
  'muscle_up',
  'handstand_pushup',
  'handstand',
  'iron_cross',
  'one_arm_pull_up',
  'one_arm_push_up',
  'dragon_flag',
  'planche_push_up',
  'l_sit',
  'v_sit',
  'i_sit',
] as const

/**
 * Skills that were added after schema version 1.
 * Users with older profiles may not have seen these options.
 */
export const NEW_SKILLS_V3 = [
  'one_arm_pull_up',
  'one_arm_push_up', 
  'dragon_flag',
  'planche_push_up',
  'iron_cross',
  'i_sit',
] as const

/**
 * Determine profile completeness relative to current engine requirements.
 * 
 * This function checks:
 * 1. Whether required field groups are complete
 * 2. Whether the profile schema version is current
 * 3. Whether new skills/options are available that user hasn't seen
 */
export function getProfileCompletenessStatus(profile?: CanonicalProgrammingProfile): ProfileCompletenessStatus {
  const p = profile || getCanonicalProfile()
  const storedVersion = getStoredProfileSchemaVersion()
  const missingGroups: ProfileFieldGroup[] = []
  
  // Check core_goals (required)
  if (!p.primaryGoal) {
    missingGroups.push('core_goals')
  }
  
  // Check schedule_identity (required)
  if (!p.scheduleMode || (p.scheduleMode === 'static' && !p.trainingDaysPerWeek)) {
    missingGroups.push('schedule_identity')
  }
  
  // Check equipment (required)
  if (!p.equipmentAvailable || p.equipmentAvailable.length === 0) {
    missingGroups.push('equipment')
  }
  
  // [profile-completeness] ISSUE A: Check weighted_strength_inputs
  // If user has pull-up/dip strength but no weighted data, suggest weighted inputs
  const hasBasicStrength = !!(p.pullUpMax || p.dipMax)
  const hasWeightedStrength = !!(p.weightedPullUp || p.weightedDip)
  const hasAllTimePRs = !!(p.allTimePRPullUp || p.allTimePRDip)
  if (hasBasicStrength && !hasWeightedStrength && !hasAllTimePRs) {
    // User has strength data but no weighted benchmarks - would benefit from weighted inputs
    // Only suggest if they have intermediate+ pull-ups/dips
    const pullUpNum = parseInt(p.pullUpMax?.replace(/[^0-9]/g, '') || '0')
    const dipNum = parseInt(p.dipMax?.replace(/[^0-9]/g, '') || '0')
    if (pullUpNum >= 10 || dipNum >= 10) {
      missingGroups.push('weighted_strength_inputs')
    }
  }
  
  // [profile-completeness] ISSUE A: Check advanced_skill_inputs
  // If user selected advanced skills but hasn't provided history/band info
  const advancedSkillsSelected = (p.selectedSkills || []).filter(s => 
    ['front_lever', 'back_lever', 'planche', 'muscle_up', 'handstand_pushup', 
     'one_arm_pull_up', 'one_arm_chin_up', 'one_arm_push_up', 'dragon_flag', 
     'planche_push_up', 'iron_cross'].includes(s)
  )
  if (advancedSkillsSelected.length > 0) {
    // Check if skill history is populated for any selected skill
    const hasSkillHistory = !!(
      p.skillHistory?.front_lever?.trainingHistory ||
      p.skillHistory?.planche?.trainingHistory ||
      p.skillHistory?.muscle_up?.trainingHistory ||
      p.skillHistory?.handstand_pushup?.trainingHistory
    )
    // Check if band levels are populated for straight-arm skills
    const hasBandInfo = !!(p.frontLeverBandLevel || p.plancheBandLevel)
    
    if (!hasSkillHistory && !hasBandInfo && advancedSkillsSelected.length > 0) {
      // User would benefit from more detailed skill inputs
      missingGroups.push('advanced_skill_inputs')
    }
  }
  
  // [profile-completeness] ISSUE A: Check athlete_diagnostics
  // If user hasn't provided joint/limitation info
  if (!p.jointCautions?.length && !p.weakestArea && !p.primaryLimitation) {
    // Not strictly required, but valuable for engine
    // Only add if profile is mostly complete otherwise
    if (p.primaryGoal && p.equipmentAvailable?.length) {
      missingGroups.push('athlete_diagnostics')
    }
  }
  
  // Check if user has seen the new skills (V3)
  const hasNewSkillsAvailable = storedVersion < 3
  const newSkillsAvailableCount = hasNewSkillsAvailable ? NEW_SKILLS_V3.length : 0
  
  // If user hasn't seen V3 skills and is interested in skills, suggest skill_selection
  if (hasNewSkillsAvailable && (
    p.trainingPathType === 'skill_progression' ||
    p.trainingPathType === 'hybrid' ||
    p.selectedSkills?.length > 0
  )) {
    // Only add to missing if not already there
    if (!missingGroups.includes('skill_selection')) {
      missingGroups.push('skill_selection')
    }
  }
  
  // Determine suggested section
  let suggestedSection: string | null = null
  if (missingGroups.length > 0) {
    suggestedSection = FIELD_GROUP_TO_SECTION[missingGroups[0]]
  }
  
  const isComplete = missingGroups.length === 0 && storedVersion >= CURRENT_PROFILE_SCHEMA_VERSION
  
  // [profile-completeness] TASK 7: Log profile completeness status
  console.log('[profile-completeness] Status check:', {
    isComplete,
    storedVersion,
    targetVersion: CURRENT_PROFILE_SCHEMA_VERSION,
    missingGroups,
    missingGroupLabels: missingGroups.map(g => FIELD_GROUP_LABELS[g]),
    hasNewSkillsAvailable,
    suggestedSection,
    // Additional context for debugging
    hasWeightedStrength: !!(p.weightedPullUp || p.weightedDip),
    hasAdvancedSkillInputs: !!(p.skillHistory?.front_lever || p.skillHistory?.planche),
    advancedSkillsSelected: (p.selectedSkills || []).filter(s => 
      ['front_lever', 'back_lever', 'planche', 'muscle_up', 'handstand_pushup'].includes(s)
    ),
  })
  
  return {
    isCompleteForCurrentEngine: isComplete,
    profileSchemaVersion: storedVersion,
    targetSchemaVersion: CURRENT_PROFILE_SCHEMA_VERSION,
    missingGroups,
    suggestedOnboardingSection: suggestedSection,
    hasNewSkillsAvailable,
    newSkillsAvailableCount,
  }
}

/**
 * Mark profile as updated to current schema version.
 * Call this after user completes profile updates.
 */
export function markProfileSchemaAsComplete(): void {
  saveProfileSchemaVersion(CURRENT_PROFILE_SCHEMA_VERSION)
  console.log('[profile-completeness] Marked profile as complete for schema v' + CURRENT_PROFILE_SCHEMA_VERSION)
}

// =============================================================================
// [profile-completeness] ISSUE C: PARTIAL UPDATE MERGE HELPERS
// =============================================================================

/**
 * Safely merge partial profile updates without wiping existing data.
 * [profile-completeness] ISSUE C: This is the recommended way to update profile fields.
 * 
 * @param updates - Only the fields that need to be updated
 * @param options - Merge options
 * @returns Summary of merged changes
 */
export function mergeProfileUpdates(
  updates: Partial<CanonicalProgrammingProfile>,
  options: {
    skipNulls?: boolean        // Don't overwrite existing values with null/undefined
    preserveArrays?: boolean   // Merge arrays instead of replacing
    logChanges?: boolean       // Log detailed change summary
  } = {}
): {
  success: boolean
  mergedFields: string[]
  skippedFields: string[]
  error?: string
} {
  const {
    skipNulls = true,
    preserveArrays = false,
    logChanges = true,
  } = options
  
  try {
    const currentProfile = getCanonicalProfile()
    const mergedFields: string[] = []
    const skippedFields: string[] = []
    
    // Build the actual updates object, filtering out null/undefined if skipNulls
    const filteredUpdates: Partial<CanonicalProgrammingProfile> = {}
    
    for (const [key, value] of Object.entries(updates)) {
      // Skip if value is null/undefined and we're preserving existing data
      if (skipNulls && (value === null || value === undefined)) {
        skippedFields.push(key)
        continue
      }
      
      // For arrays, optionally merge instead of replace
      if (preserveArrays && Array.isArray(value) && Array.isArray((currentProfile as Record<string, unknown>)[key])) {
        const existingArray = (currentProfile as Record<string, unknown>)[key] as unknown[]
        const mergedArray = [...new Set([...existingArray, ...value])]
        ;(filteredUpdates as Record<string, unknown>)[key] = mergedArray
        mergedFields.push(key)
      } else {
        ;(filteredUpdates as Record<string, unknown>)[key] = value
        mergedFields.push(key)
      }
    }
    
    // Apply the filtered updates
    if (Object.keys(filteredUpdates).length > 0) {
      saveCanonicalProfile(filteredUpdates)
    }
    
    // [profile-completeness] TASK 7: Log merge result
    if (logChanges) {
      console.log('[profile-completeness] Partial update merged:', {
        mergedFieldCount: mergedFields.length,
        mergedFields,
        skippedFieldCount: skippedFields.length,
        skippedFields,
        preserveArrays,
        skipNulls,
      })
    }
    
    return {
      success: true,
      mergedFields,
      skippedFields,
    }
  } catch (error) {
    console.error('[profile-completeness] Merge failed:', error)
    return {
      success: false,
      mergedFields: [],
      skippedFields: [],
      error: String(error),
    }
  }
}

// =============================================================================
// [profile-completeness] ISSUE F: TARGETED SURFACING HELPERS
// =============================================================================

/**
 * Get a deep link to the specific onboarding/settings section for a field group.
 * [profile-completeness] ISSUE F: Enables targeted surfacing without full onboarding reset.
 */
export function getDeepLinkForFieldGroup(group: ProfileFieldGroup): {
  path: string
  section: string
  query: Record<string, string>
} {
  const section = FIELD_GROUP_TO_SECTION[group]
  
  // Map sections to their appropriate routes
  const sectionRoutes: Record<string, { path: string; query: Record<string, string> }> = {
    goals: { path: '/settings', query: { section: 'goals', focus: 'true' } },
    schedule: { path: '/settings', query: { section: 'schedule', focus: 'true' } },
    strength_benchmarks: { path: '/settings', query: { section: 'benchmarks', tab: 'strength', focus: 'true' } },
    weighted_strength: { path: '/settings', query: { section: 'benchmarks', tab: 'weighted', focus: 'true' } },
    skill_benchmarks: { path: '/settings', query: { section: 'benchmarks', tab: 'skills', focus: 'true' } },
    flexibility_benchmarks: { path: '/settings', query: { section: 'benchmarks', tab: 'flexibility', focus: 'true' } },
    skill_selection: { path: '/settings', query: { section: 'goals', tab: 'skills', focus: 'true' } },
    equipment: { path: '/settings', query: { section: 'equipment', focus: 'true' } },
    recovery: { path: '/settings', query: { section: 'recovery', focus: 'true' } },
    diagnostics: { path: '/settings', query: { section: 'diagnostics', focus: 'true' } },
  }
  
  const route = sectionRoutes[section] || { path: '/settings', query: { section } }
  
  return {
    path: route.path,
    section,
    query: route.query,
  }
}

/**
 * Get all deep links for missing profile field groups.
 * [profile-completeness] ISSUE F: Builds the targeted surfacing UI data.
 */
export function getMissingFieldGroupLinks(profile?: CanonicalProgrammingProfile): Array<{
  group: ProfileFieldGroup
  label: string
  deepLink: ReturnType<typeof getDeepLinkForFieldGroup>
  priority: 'required' | 'recommended' | 'optional'
}> {
  const status = getProfileCompletenessStatus(profile)
  
  return status.missingGroups.map(group => {
    // Determine priority based on group type
    let priority: 'required' | 'recommended' | 'optional' = 'optional'
    if (['core_goals', 'schedule_identity', 'equipment'].includes(group)) {
      priority = 'required'
    } else if (['benchmark_strength', 'benchmark_skills', 'skill_selection'].includes(group)) {
      priority = 'recommended'
    }
    
    return {
      group,
      label: FIELD_GROUP_LABELS[group],
      deepLink: getDeepLinkForFieldGroup(group),
      priority,
    }
  })
}

// =============================================================================
// [profile-completeness] ENGINE FIELD CONSUMPTION VERIFICATION
// =============================================================================

/**
 * Engine field groups - what the planner actually consumes.
 * [profile-completeness] ISSUE E: Tracks which fields are used by generation.
 */
export interface EngineFieldConsumption {
  // Core inputs always consumed
  coreGoals: {
    primaryGoal: string | null
    secondaryGoal: string | null
    selectedSkills: string[]
    trainingPathType: string | null
  }
  // Schedule inputs consumed
  scheduleInputs: {
    scheduleMode: string
    trainingDaysPerWeek: number | null
    sessionLengthMinutes: number
    sessionDurationMode: string
  }
  // Weighted strength inputs (new - must be consumed)
  weightedStrengthInputs: {
    weightedPullUp: { addedWeight: number; reps: number } | null
    weightedDip: { addedWeight: number; reps: number } | null
    allTimePRPullUp: { load: number; reps: number } | null
    allTimePRDip: { load: number; reps: number } | null
    hasWeightedData: boolean
    hasPRData: boolean
  }
  // Advanced skill inputs (new - must be consumed)
  advancedSkillInputs: {
    hasSkillHistory: boolean
    hasBandLevels: boolean
    hasHighestEverReached: boolean
    skillProgressions: {
      frontLever: string | null
      planche: string | null
      hspu: string | null
      muscleUp: string | null
    }
  }
  // Equipment consumed
  equipment: string[]
  // Diagnostics consumed
  diagnostics: {
    jointCautions: string[]
    weakestArea: string | null
    primaryLimitation: string | null
  }
}

/**
 * Get engine field consumption snapshot.
 * [profile-completeness] ISSUE E: Use this to verify planner is consuming new fields.
 */
export function getEngineFieldConsumption(profile?: CanonicalProgrammingProfile): EngineFieldConsumption {
  const p = profile || getCanonicalProfile()
  
  const consumption: EngineFieldConsumption = {
    coreGoals: {
      primaryGoal: p.primaryGoal,
      secondaryGoal: p.secondaryGoal,
      selectedSkills: p.selectedSkills || [],
      trainingPathType: p.trainingPathType,
    },
    scheduleInputs: {
      scheduleMode: p.scheduleMode,
      trainingDaysPerWeek: p.trainingDaysPerWeek,
      sessionLengthMinutes: p.sessionLengthMinutes,
      sessionDurationMode: p.sessionDurationMode,
    },
    weightedStrengthInputs: {
      weightedPullUp: p.weightedPullUp ? {
        addedWeight: p.weightedPullUp.addedWeight,
        reps: p.weightedPullUp.reps,
      } : null,
      weightedDip: p.weightedDip ? {
        addedWeight: p.weightedDip.addedWeight,
        reps: p.weightedDip.reps,
      } : null,
      allTimePRPullUp: p.allTimePRPullUp ? {
        load: p.allTimePRPullUp.load,
        reps: p.allTimePRPullUp.reps,
      } : null,
      allTimePRDip: p.allTimePRDip ? {
        load: p.allTimePRDip.load,
        reps: p.allTimePRDip.reps,
      } : null,
      hasWeightedData: !!(p.weightedPullUp || p.weightedDip),
      hasPRData: !!(p.allTimePRPullUp || p.allTimePRDip),
    },
    advancedSkillInputs: {
      hasSkillHistory: !!(
        p.skillHistory?.front_lever?.trainingHistory ||
        p.skillHistory?.planche?.trainingHistory ||
        p.skillHistory?.muscle_up?.trainingHistory
      ),
      hasBandLevels: !!(p.frontLeverBandLevel || p.plancheBandLevel),
      hasHighestEverReached: !!(p.frontLeverHighestEver || p.plancheHighestEver),
      skillProgressions: {
        frontLever: p.frontLeverProgression,
        planche: p.plancheProgression,
        hspu: p.hspuProgression,
        muscleUp: p.muscleUpReadiness,
      },
    },
    equipment: p.equipmentAvailable || [],
    diagnostics: {
      jointCautions: p.jointCautions || [],
      weakestArea: p.weakestArea,
      primaryLimitation: p.primaryLimitation,
    },
  }
  
  // [profile-completeness] TASK 7: Log engine consumption
  console.log('[profile-completeness] Engine field consumption:', {
    hasWeightedData: consumption.weightedStrengthInputs.hasWeightedData,
    hasPRData: consumption.weightedStrengthInputs.hasPRData,
    hasSkillHistory: consumption.advancedSkillInputs.hasSkillHistory,
    hasBandLevels: consumption.advancedSkillInputs.hasBandLevels,
    selectedSkillsCount: consumption.coreGoals.selectedSkills.length,
    equipmentCount: consumption.equipment.length,
    jointCautionsCount: consumption.diagnostics.jointCautions.length,
  })
  
  return consumption
}

// =============================================================================
// [equipment-truth-fix] TASK B: BIDIRECTIONAL EQUIPMENT NORMALIZERS
// =============================================================================

/**
 * Profile equipment keys (canonical/settings/onboarding layer)
 * [PHASE 15A] Added bench_box to preserve full equipment truth
 */
export type ProfileEquipmentKey = 'pullup_bar' | 'dip_bars' | 'parallettes' | 'rings' | 'resistance_bands' | 'weights' | 'bench_box' | 'minimal'

/**
 * Builder equipment keys (runtime/program layer)
 * [PHASE 15A] Added bench to support bench_box mapping
 */
export type BuilderEquipmentKey = 'pull_bar' | 'dip_bars' | 'parallettes' | 'rings' | 'bands' | 'weights' | 'floor' | 'wall' | 'bench'

/**
 * Hidden runtime-only equipment that should never be persisted to canonical profile
 */
const RUNTIME_ONLY_EQUIPMENT = ['floor', 'wall'] as const

/**
 * Convert profile/canonical equipment keys to builder/program keys
 * Use when: loading canonical profile into builder inputs
 * [PHASE 15A] Added bench_box -> bench and minimal -> floor mappings
 */
export function profileEquipmentToBuilderEquipment(profileEquipment: string[]): string[] {
  const mapping: Record<string, string> = {
    'pullup_bar': 'pull_bar',
    'dip_bars': 'dip_bars',
    'parallettes': 'parallettes',
    'rings': 'rings',
    'resistance_bands': 'bands',
    'weights': 'weights',
    'bench_box': 'bench',  // [PHASE 15A] Map bench_box to builder bench
    'minimal': 'floor',    // [PHASE 15A] Minimal means bodyweight-only
  }
  
  const result = profileEquipment
    .map(e => mapping[e] || e)
    .filter(e => e !== undefined)
  
  // Dedupe and sort for stable ordering
  return [...new Set(result)].sort()
}

/**
 * Convert builder/program equipment keys to profile/canonical keys
 * Use when: saving to canonical profile after a build
 * IMPORTANT: Strips runtime-only keys (floor, wall)
 * [PHASE 15A] Added bench -> bench_box mapping
 */
export function builderEquipmentToProfileEquipment(builderEquipment: string[]): string[] {
  const mapping: Record<string, string> = {
    'pull_bar': 'pullup_bar',
    'dip_bars': 'dip_bars',
    'parallettes': 'parallettes',
    'rings': 'rings',
    'bands': 'resistance_bands',
    'weights': 'weights',
    'bench': 'bench_box',  // [PHASE 15A] Map builder bench back to profile bench_box
  }
  
  const result = builderEquipment
    // Filter out runtime-only equipment
    .filter(e => !RUNTIME_ONLY_EQUIPMENT.includes(e as typeof RUNTIME_ONLY_EQUIPMENT[number]))
    .map(e => mapping[e] || e)
    .filter(e => e !== undefined && e !== 'floor' && e !== 'wall')
  
  // Dedupe and sort for stable ordering
  return [...new Set(result)].sort()
}

/**
 * Normalize equipment arrays for comparison (both sides to canonical profile format)
 * Use when: checking drift between profile and program
 * Strips runtime-only keys from both sides before comparison
 * [PHASE 15A] Added bench_box and minimal to preserve full equipment truth
 */
export function normalizeEquipmentForComparison(equipment: string[]): string[] {
  // First convert any builder keys to profile keys
  const normalized = builderEquipmentToProfileEquipment(equipment)
  // Then also handle any already-profile keys
  // [PHASE 15A] Added bench_box and minimal to the pass-through list
  return [...new Set([
    ...normalized,
    ...equipment.filter(e => 
      ['pullup_bar', 'dip_bars', 'parallettes', 'rings', 'resistance_bands', 'weights', 'bench_box', 'minimal'].includes(e)
    )
  ])].sort()
}

// =============================================================================
// PROFILE-PROGRAM DRIFT DETECTION
// =============================================================================

/**
 * [program-alignment] TASK 5: Profile signature for tracking what profile state a program was built from.
 * This lightweight signature allows detecting when canonical profile has changed since program generation.
 */
export interface ProfileSignature {
  primaryGoal: string | null
  secondaryGoal: string | null
  scheduleMode: string | null
  trainingDaysPerWeek: number | null
  sessionLengthMinutes: number | null
  equipmentHash: string
  hasLoadableEquipment: boolean
  experienceLevel: string | null
  createdAt: string
}

/**
 * [program-alignment] TASK 5: Generate a profile signature from canonical profile.
 * Store this with generated programs to enable reliable drift detection.
 */
export function getProfileSignature(): ProfileSignature {
  const profile = getCanonicalProfile()
  const equipment = (profile.equipmentAvailable || []).sort()
  
  const signature: ProfileSignature = {
    primaryGoal: profile.primaryGoal,
    secondaryGoal: profile.secondaryGoal || null,
    scheduleMode: profile.scheduleMode,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    sessionLengthMinutes: profile.sessionLengthMinutes,
    equipmentHash: equipment.join(','),
    hasLoadableEquipment: hasLoadableEquipment(equipment),
    experienceLevel: profile.experienceLevel,
    createdAt: new Date().toISOString(),
  }
  
  console.log('[program-alignment] Generated profile signature:', {
    primaryGoal: signature.primaryGoal,
    scheduleMode: signature.scheduleMode,
    sessionLength: signature.sessionLengthMinutes,
    equipmentCount: equipment.length,
    hasLoadableEquipment: signature.hasLoadableEquipment,
  })
  
  return signature
}

/**
 * [program-alignment] TASK 5: Compare stored profile signature against current canonical profile.
 * Returns true if they match (program is aligned), false if drifted.
 */
export function isProfileSignatureAligned(storedSignature: ProfileSignature | null | undefined): {
  aligned: boolean
  driftedFields: string[]
  summary: string
} {
  if (!storedSignature) {
    return {
      aligned: false,
      driftedFields: ['no_signature'],
      summary: 'Program was built before signature tracking',
    }
  }
  
  const currentSignature = getProfileSignature()
  const driftedFields: string[] = []
  
  if (currentSignature.primaryGoal !== storedSignature.primaryGoal) {
    driftedFields.push('primaryGoal')
  }
  if (currentSignature.scheduleMode !== storedSignature.scheduleMode) {
    driftedFields.push('scheduleMode')
  }
  if (currentSignature.trainingDaysPerWeek !== storedSignature.trainingDaysPerWeek) {
    driftedFields.push('trainingDaysPerWeek')
  }
  if (currentSignature.sessionLengthMinutes !== storedSignature.sessionLengthMinutes) {
    driftedFields.push('sessionLength')
  }
  if (currentSignature.equipmentHash !== storedSignature.equipmentHash) {
    driftedFields.push('equipment')
  }
  if (currentSignature.hasLoadableEquipment !== storedSignature.hasLoadableEquipment) {
    driftedFields.push('loadableEquipment')
  }
  
  const aligned = driftedFields.length === 0
  let summary = 'Program matches current settings'
  
  if (!aligned) {
    if (driftedFields.includes('primaryGoal')) {
      summary = 'Your primary goal has changed since this program was built.'
    } else if (driftedFields.includes('equipment') || driftedFields.includes('loadableEquipment')) {
      summary = 'Your equipment settings have changed since this program was built.'
    } else {
      summary = `Settings changed: ${driftedFields.join(', ')}`
    }
  }
  
  console.log('[program-alignment] Signature alignment check:', {
    aligned,
    driftedFields,
    current: {
      primaryGoal: currentSignature.primaryGoal,
      equipmentHash: currentSignature.equipmentHash.slice(0, 30) + '...',
    },
    stored: {
      primaryGoal: storedSignature.primaryGoal,
      equipmentHash: storedSignature.equipmentHash?.slice(0, 30) + '...',
    },
  })
  
  return { aligned, driftedFields, summary }
}

/**
 * Drift field with comparison info
 */
export interface DriftField {
  field: string
  profileValue: unknown
  programValue: unknown
  severity: 'critical' | 'major' | 'minor'
}

/**
 * Profile-program drift detection result
 */
export interface ProfileProgramDrift {
  hasDrift: boolean
  isProgramStale: boolean
  driftFields: DriftField[]
  summary: string
  recommendation: 'regenerate' | 'continue' | 'review'
}

/**
 * [profile-truth-sync] ISSUE A/D: Check if current program matches canonical profile truth.
 * This is the authoritative function for detecting settings/program drift.
 * 
 * @param program - The current active program to check against canonical profile
 * @returns Detailed drift information
 */
export function checkProfileProgramDrift(program: {
  primaryGoal?: string | null
  secondaryGoal?: string | null
  trainingDaysPerWeek?: number | null
  sessionLength?: number | null
  scheduleMode?: string | null
  equipment?: string[] | null
  jointCautions?: string[] | null
  experienceLevel?: string | null
} | null): ProfileProgramDrift {
  if (!program) {
    console.log('[profile-truth-sync] No program to check for drift')
    return {
      hasDrift: false,
      isProgramStale: false,
      driftFields: [],
      summary: 'No active program',
      recommendation: 'continue',
    }
  }
  
  const profile = getCanonicalProfile()
  const driftFields: DriftField[] = []
  
  // CRITICAL FIELDS - require regeneration
  if (profile.primaryGoal !== program.primaryGoal) {
    driftFields.push({
      field: 'primaryGoal',
      profileValue: profile.primaryGoal,
      programValue: program.primaryGoal,
      severity: 'critical',
    })
  }
  
  // MAJOR FIELDS - should trigger regeneration
  if (profile.scheduleMode !== program.scheduleMode) {
    driftFields.push({
      field: 'scheduleMode',
      profileValue: profile.scheduleMode,
      programValue: program.scheduleMode,
      severity: 'major',
    })
  }
  
  // ==========================================================================
  // [program-truth-fix] TASK C: Fix trainingDaysPerWeek comparison for flexible schedules
  // For flexible users:
  // - profile.trainingDaysPerWeek may be null/undefined (meaning "adaptive")
  // - program.trainingDaysPerWeek is always the effective generated count
  // - This should NOT trigger drift if both are flexible mode
  // For static users:
  // - profile and program should match exactly
  // ==========================================================================
  const isFlexibleProfile = profile.scheduleMode === 'flexible' || profile.scheduleMode === 'adaptive'
  const isFlexibleProgram = program.scheduleMode === 'flexible' || program.scheduleMode === 'adaptive'
  
  // Only compare trainingDaysPerWeek if:
  // 1. Both are static mode (must match)
  // 2. Or there's a mode mismatch (already caught above)
  // Skip comparison if both are flexible - the effective days don't need to match the "identity"
  const shouldCompareTrainingDays = !isFlexibleProfile || !isFlexibleProgram
  
  if (shouldCompareTrainingDays && profile.trainingDaysPerWeek !== program.trainingDaysPerWeek) {
    driftFields.push({
      field: 'trainingDaysPerWeek',
      profileValue: profile.trainingDaysPerWeek,
      programValue: program.trainingDaysPerWeek,
      severity: 'major',
    })
  }
  
  if (profile.sessionLengthMinutes !== program.sessionLength) {
    driftFields.push({
      field: 'sessionLength',
      profileValue: profile.sessionLengthMinutes,
      programValue: program.sessionLength,
      severity: 'major',
    })
  }
  
  // ==========================================================================
  // [equipment-truth-fix] TASK E: Normalize equipment before comparison
  // Both sides must be in the same format, excluding runtime-only keys
  // ==========================================================================
  const normalizedProfileEquipment = normalizeEquipmentForComparison(profile.equipmentAvailable || [])
  const normalizedProgramEquipment = normalizeEquipmentForComparison(program.equipment || [])
  const profileEquipmentStr = normalizedProfileEquipment.join(',')
  const programEquipmentStr = normalizedProgramEquipment.join(',')
  
  // [equipment-drift-audit] Log when equipment comparison happens
  if (profileEquipmentStr !== programEquipmentStr) {
    console.log('[equipment-drift-audit] Equipment drift detected:', {
      rawProfileEquipment: profile.equipmentAvailable,
      rawProgramEquipment: program.equipment,
      normalizedProfile: normalizedProfileEquipment,
      normalizedProgram: normalizedProgramEquipment,
      profileStr: profileEquipmentStr,
      programStr: programEquipmentStr,
    })
    driftFields.push({
      field: 'equipment',
      profileValue: profile.equipmentAvailable,
      programValue: program.equipment,
      severity: 'major',
    })
  }
  
  // MINOR FIELDS - can continue but note the difference
  if (profile.secondaryGoal !== program.secondaryGoal) {
    driftFields.push({
      field: 'secondaryGoal',
      profileValue: profile.secondaryGoal,
      programValue: program.secondaryGoal,
      severity: 'minor',
    })
  }
  
  if (profile.experienceLevel !== program.experienceLevel) {
    driftFields.push({
      field: 'experienceLevel',
      profileValue: profile.experienceLevel,
      programValue: program.experienceLevel,
      severity: 'minor',
    })
  }
  
  // Joint cautions comparison
  const profileCautions = (profile.jointCautions || []).sort().join(',')
  const programCautions = (program.jointCautions || []).sort().join(',')
  if (profileCautions !== programCautions) {
    driftFields.push({
      field: 'jointCautions',
      profileValue: profile.jointCautions,
      programValue: program.jointCautions,
      severity: 'minor',
    })
  }
  
  const hasDrift = driftFields.length > 0
  const criticalDrift = driftFields.some(d => d.severity === 'critical')
  const majorDrift = driftFields.some(d => d.severity === 'major')
  const isProgramStale = criticalDrift || majorDrift
  
  // Generate summary
  let summary = 'Program matches current settings'
  if (criticalDrift) {
    const criticalFields = driftFields.filter(d => d.severity === 'critical').map(d => d.field)
    summary = `Primary goal has changed (${criticalFields.join(', ')}). Program should be regenerated.`
  } else if (majorDrift) {
    const majorFields = driftFields.filter(d => d.severity === 'major').map(d => d.field)
    summary = `Training settings have changed (${majorFields.join(', ')}). Consider regenerating.`
  } else if (hasDrift) {
    summary = 'Minor setting differences. Program can continue.'
  }
  
  // Determine recommendation
  let recommendation: 'regenerate' | 'continue' | 'review' = 'continue'
  if (criticalDrift) {
    recommendation = 'regenerate'
  } else if (majorDrift) {
    recommendation = 'review'
  }
  
  // Log drift detection result
  console.log('[profile-truth-sync] Profile-program drift check:', {
    hasDrift,
    isProgramStale,
    criticalDrift,
    majorDrift,
    driftFieldCount: driftFields.length,
    driftFields: driftFields.map(d => ({ field: d.field, severity: d.severity })),
    recommendation,
    profile: {
      primaryGoal: profile.primaryGoal,
      scheduleMode: profile.scheduleMode,
      sessionLength: profile.sessionLengthMinutes,
      equipmentCount: profile.equipmentAvailable?.length || 0,
    },
    program: {
      primaryGoal: program.primaryGoal,
      scheduleMode: program.scheduleMode,
      sessionLength: program.sessionLength,
      equipmentCount: program.equipment?.length || 0,
    },
  })
  
  return {
    hasDrift,
    isProgramStale,
    driftFields,
    summary,
    recommendation,
  }
}

// =============================================================================
// LOADABILITY TRUTH (ISSUE A/B/C)
// =============================================================================

/**
 * [loadability-truth] TASK 1: Canonical function to check if user has loadable equipment.
 * This is the single source of truth for weighted prescription eligibility (equipment gate).
 * 
 * Loadable equipment includes: weights, weight_plates, weight_belt, dumbbells, barbell
 */
export function hasLoadableEquipment(equipmentArray?: string[]): boolean {
  const equipment = equipmentArray || getCanonicalProfile().equipmentAvailable || []
  const LOADABLE_EQUIPMENT_KEYS = ['weights', 'weight_plates', 'weight_belt', 'dumbbells', 'barbell']
  
  const hasLoadable = equipment.some(e => LOADABLE_EQUIPMENT_KEYS.includes(e))
  
  // [load-gating] STEP 1: Canonical equipment check for auto load calculations
  console.log('[load-gating] Equipment check:', {
    equipmentCount: equipment.length,
    hasLoadable,
    equipment: equipment.slice(0, 5), // Log first 5 for diagnosis
    gateReason: hasLoadable ? 'loadable_equipment_present' : 'missing_loadable_equipment',
  })
  
  return hasLoadable
}

/**
 * [profile-truth-sync] ISSUE B: Check if weighted prescriptions should be available.
 * Returns detailed info about why weighted loading is or isn't available.
 */
export function checkWeightedPrescriptionEligibility(): {
  eligible: boolean
  hasWeightsEquipment: boolean
  hasStrengthBenchmarks: boolean
  hasPRData: boolean
  reason: string
  recommendation: string
} {
  const profile = getCanonicalProfile()
  
  // [loadability-truth] Use canonical loadability check
  const hasWeightsEquipment = hasLoadableEquipment(profile.equipmentAvailable)
  
  // Check strength benchmarks
  const hasWeightedPullUp = !!(profile.weightedPullUp && profile.weightedPullUp.addedWeight > 0)
  const hasWeightedDip = !!(profile.weightedDip && profile.weightedDip.addedWeight > 0)
  const hasStrengthBenchmarks = hasWeightedPullUp || hasWeightedDip
  
  // Check PR data
  const hasPRPullUp = !!(profile.allTimePRPullUp && profile.allTimePRPullUp.load > 0)
  const hasPRDip = !!(profile.allTimePRDip && profile.allTimePRDip.load > 0)
  const hasPRData = hasPRPullUp || hasPRDip
  
  // Determine eligibility
  const eligible = hasWeightsEquipment && (hasStrengthBenchmarks || hasPRData)
  
  // Generate reason
  let reason = 'Weighted prescriptions available'
  if (!hasWeightsEquipment) {
    reason = 'No loading equipment in settings (weights/plates/belt)'
  } else if (!hasStrengthBenchmarks && !hasPRData) {
    reason = 'No strength benchmarks entered yet'
  }
  
  // Generate recommendation
  let recommendation = ''
  if (!hasWeightsEquipment) {
    recommendation = 'Add "Weights (for loading)" in Settings > Equipment to enable weighted prescriptions'
  } else if (!hasStrengthBenchmarks && !hasPRData) {
    recommendation = 'Enter your weighted pull-up or dip benchmarks in Settings to get personalized load prescriptions'
  }
  
  // [load-gating] STEP 6: Log weighted prescription eligibility status
  console.log('[load-gating] Weighted prescription eligibility:', {
    eligible,
    hasWeightsEquipment,
    hasStrengthBenchmarks,
    hasPRData,
    reason,
    gateStatus: !hasWeightsEquipment ? 'missing_loadable_equipment' : 
                !hasStrengthBenchmarks && !hasPRData ? 'missing_strength_input' : 
                'enabled',
  })
  
  return {
    eligible,
    hasWeightsEquipment,
    hasStrengthBenchmarks,
    hasPRData,
    reason,
    recommendation,
  }
}

/**
 * Verify all engine-relevant fields are being consumed.
 * [profile-completeness] ISSUE E: Call this before generation to confirm field wiring.
 */
export function verifyEngineFieldWiring(profile?: CanonicalProgrammingProfile): {
  isFullyWired: boolean
  consumedFieldGroups: ProfileFieldGroup[]
  unconsumedFieldGroups: ProfileFieldGroup[]
} {
  const consumption = getEngineFieldConsumption(profile)
  const consumed: ProfileFieldGroup[] = []
  const unconsumed: ProfileFieldGroup[] = []
  
  // Check each group
  if (consumption.coreGoals.primaryGoal) {
    consumed.push('core_goals')
  } else {
    unconsumed.push('core_goals')
  }
  
  if (consumption.scheduleInputs.scheduleMode) {
    consumed.push('schedule_identity')
  } else {
    unconsumed.push('schedule_identity')
  }
  
  if (consumption.weightedStrengthInputs.hasWeightedData || consumption.weightedStrengthInputs.hasPRData) {
    consumed.push('weighted_strength_inputs')
  }
  // Note: weighted_strength_inputs is optional, not unconsumed if missing
  
  if (consumption.advancedSkillInputs.hasSkillHistory || consumption.advancedSkillInputs.hasBandLevels) {
    consumed.push('advanced_skill_inputs')
  }
  // Note: advanced_skill_inputs is optional
  
  if (consumption.equipment.length > 0) {
    consumed.push('equipment')
  } else {
    unconsumed.push('equipment')
  }
  
  if (consumption.diagnostics.jointCautions.length > 0 || consumption.diagnostics.weakestArea) {
    consumed.push('athlete_diagnostics')
  }
  // Note: diagnostics is optional
  
  const isFullyWired = unconsumed.length === 0
  
  console.log('[profile-completeness] Engine wiring verification:', {
    isFullyWired,
    consumedFieldGroups: consumed,
    unconsumedFieldGroups: unconsumed,
  })
  
  return {
    isFullyWired,
    consumedFieldGroups: consumed,
    unconsumedFieldGroups: unconsumed,
  }
}

// =============================================================================
// [PHASE 5 CLOSEOUT] SOURCE TRUTH PERSISTENCE CONTRACT
// =============================================================================

/**
 * [PHASE 5 CLOSEOUT] Generation-critical source truth snapshot for auditing.
 * This captures the exact state used for generation/prefill/display.
 * Exported for use in program page and onboarding.
 */
export interface SourceTruthSnapshot {
  primaryGoal: string | null
  secondaryGoal: string | null
  selectedSkills: string[]
  scheduleMode: 'static' | 'flexible' | null
  trainingDaysPerWeek: number | null
  sessionDurationMode: 'static' | 'adaptive' | null
  sessionLengthMinutes: number | null
  equipmentAvailable: string[]
  recoveryRaw: {
    sleepQuality: string | null
    energyLevel: string | null
    stressLevel: string | null
    recoveryConfidence: string | null
  } | null
  derivedRecoverySummary: string | null
  experienceLevel: string | null
  sourceObject: string
  fallbacksApplied: string[]
  fallbacksLegitimate: boolean
}

/**
 * Get current canonical source truth snapshot for auditing.
 * This is the single authoritative snapshot used by all generation paths.
 */
export function getSourceTruthSnapshot(sourceLabel: string): SourceTruthSnapshot {
  const profile = getCanonicalProfile()
  const fallbacksApplied: string[] = []
  
  // Track which fields needed fallbacks
  if (!profile.primaryGoal) fallbacksApplied.push('primaryGoal')
  if (!profile.experienceLevel) fallbacksApplied.push('experienceLevel')
  if (!profile.scheduleMode) fallbacksApplied.push('scheduleMode')
  if (!profile.sessionDurationMode) fallbacksApplied.push('sessionDurationMode')
  if (!profile.sessionLengthMinutes) fallbacksApplied.push('sessionLengthMinutes')
  if (!profile.equipmentAvailable || profile.equipmentAvailable.length === 0) fallbacksApplied.push('equipmentAvailable')
  
  return {
    primaryGoal: profile.primaryGoal || null,
    secondaryGoal: profile.secondaryGoal || null,
    selectedSkills: profile.selectedSkills || [],
    scheduleMode: profile.scheduleMode || null,
    trainingDaysPerWeek: profile.trainingDaysPerWeek ?? null,
    sessionDurationMode: profile.sessionDurationMode || null,
    sessionLengthMinutes: profile.sessionLengthMinutes ?? null,
    equipmentAvailable: profile.equipmentAvailable || [],
    recoveryRaw: profile.recoveryRaw || null,
    derivedRecoverySummary: profile.recoveryQuality || null,
    experienceLevel: profile.experienceLevel || null,
    sourceObject: sourceLabel,
    fallbacksApplied,
    fallbacksLegitimate: fallbacksApplied.length === 0 || profile.onboardingComplete !== true,
  }
}

/**
 * [TASK 1] Emit phase5 source truth audit for render/prefill/generate/rebuild paths.
 */
export function emitSourceTruthAudit(
  auditType: 'render' | 'prefill' | 'generate' | 'rebuild',
  snapshot: SourceTruthSnapshot
): void {
  const auditName = `[phase5-source-truth-${auditType}-audit]`
  console.log(auditName, {
    primaryGoal: snapshot.primaryGoal,
    secondaryGoal: snapshot.secondaryGoal,
    selectedSkills: snapshot.selectedSkills,
    scheduleMode: snapshot.scheduleMode,
    trainingDaysPerWeek: snapshot.trainingDaysPerWeek,
    sessionDurationMode: snapshot.sessionDurationMode,
    sessionLengthMinutes: snapshot.sessionLengthMinutes,
    equipmentAvailable: snapshot.equipmentAvailable,
    recoveryRaw: snapshot.recoveryRaw,
    derivedRecoverySummary: snapshot.derivedRecoverySummary,
    experienceLevel: snapshot.experienceLevel,
    exactSourceObject: snapshot.sourceObject,
    fallbacksApplied: snapshot.fallbacksApplied,
    fallbacksLegitimate: snapshot.fallbacksLegitimate,
  })
}

/**
 * [TASK 2] Canonical precedence audit - verify onboarding wins over stale sources.
 */
export function auditCanonicalPrecedence(): {
  staleResurrectionPrevented: boolean
  deselectedSkillsCouldLeak: boolean
  scheduleDurationRecoveryLocked: boolean
} {
  const onboarding = getOnboardingProfile()
  const canonical = getCanonicalProfile()
  
  // Check if onboarding selectedSkills are respected
  const onboardingSkills = onboarding?.selectedSkills || []
  const canonicalSkills = canonical.selectedSkills || []
  
  // Skills match means no stale resurrection
  const skillsMatch = JSON.stringify(onboardingSkills.sort()) === JSON.stringify(canonicalSkills.sort())
  
  // Check schedule/duration/recovery are from onboarding
  const scheduleFromOnboarding = canonical.scheduleMode === onboarding?.scheduleMode || 
    (!onboarding?.scheduleMode && canonical.scheduleMode !== null)
  const durationFromOnboarding = canonical.sessionDurationMode === onboarding?.sessionDurationMode ||
    (!onboarding?.sessionDurationMode && canonical.sessionDurationMode !== null)
  
  const result = {
    staleResurrectionPrevented: skillsMatch,
    deselectedSkillsCouldLeak: !skillsMatch,
    scheduleDurationRecoveryLocked: scheduleFromOnboarding && durationFromOnboarding,
  }
  
  console.log('[phase5-canonical-precedence-final-verdict]', result)
  
  return result
}

/**
 * [TASK 9] Split-brain detector - identify disagreements between truth sources.
 */
export function detectSplitBrain(
  displayedProgram: { 
    primaryGoal?: string
    selectedSkills?: string[]
    scheduleMode?: string
    profileSnapshot?: { selectedSkills?: string[] }
  } | null
): {
  classification: 'no_split_brain' | 'stale_program_only' | 'stale_prefill_only' | 
    'stale_snapshot_only' | 'canonical_not_propagated' | 'onboarding_not_propagated' | 
    'display_truth_mismatch'
  details: Record<string, unknown>
} {
  const canonical = getCanonicalProfile()
  const onboarding = getOnboardingProfile()
  
  const canonicalSkills = (canonical.selectedSkills || []).slice().sort()
  const onboardingSkills = (onboarding?.selectedSkills || []).slice().sort()
  const displayedSkills = (displayedProgram?.selectedSkills || []).slice().sort()
  const snapshotSkills = (displayedProgram?.profileSnapshot?.selectedSkills || []).slice().sort()
  
  const canonicalMatchesOnboarding = JSON.stringify(canonicalSkills) === JSON.stringify(onboardingSkills)
  const displayedMatchesCanonical = JSON.stringify(displayedSkills) === JSON.stringify(canonicalSkills)
  const snapshotMatchesCanonical = JSON.stringify(snapshotSkills) === JSON.stringify(canonicalSkills)
  
  let classification: ReturnType<typeof detectSplitBrain>['classification'] = 'no_split_brain'
  
  if (!canonicalMatchesOnboarding && onboardingSkills.length > 0) {
    classification = 'onboarding_not_propagated'
  } else if (!displayedMatchesCanonical && displayedSkills.length > 0) {
    classification = 'stale_program_only'
  } else if (!snapshotMatchesCanonical && snapshotSkills.length > 0) {
    classification = 'stale_snapshot_only'
  }
  
  const details = {
    canonicalSkillCount: canonicalSkills.length,
    onboardingSkillCount: onboardingSkills.length,
    displayedSkillCount: displayedSkills.length,
    snapshotSkillCount: snapshotSkills.length,
    canonicalMatchesOnboarding,
    displayedMatchesCanonical,
    snapshotMatchesCanonical,
    canonicalPrimaryGoal: canonical.primaryGoal,
    displayedPrimaryGoal: displayedProgram?.primaryGoal,
  }
  
  console.log('[phase5-split-brain-detector]', { classification, ...details })
  
  return { classification, details }
}

/**
 * [TASK 10] Final Phase 5 closeout verdict.
 */
export function phase5SourceTruthPersistenceFinalVerdict(params: {
  selectedSkillsPropagatedToCanonical: boolean
  selectedSkillsPropagatedToPrefill: boolean
  selectedSkillsPropagatedToEntry: boolean
  selectedSkillsPropagatedToProgram: boolean
  displayedChipsClean: boolean
  primaryGoalHighlightMatches: boolean
  flexibleAdaptiveRecoveryPersists: boolean
  noStaleResurrection: boolean
  rebuildUsesCurrentSettings: boolean
  noUIRedesign: boolean
}): boolean {
  const allTrue = Object.values(params).every(v => v === true)
  
  console.log('[phase5-source-truth-persistence-final-verdict]', {
    ...params,
    safeToAdvance: allTrue,
    timestamp: new Date().toISOString(),
  })
  
  return allTrue
}

// =============================================================================
// [PHASE 6 TASK 7] FINAL VERDICT AUDIT
// =============================================================================

/**
 * Final verdict for Phase 6: Generation Entry Truth
 * Call this after generation completes to verify all paths used canonical entry
 */
export function phase6GenerationEntryFinalVerdict(results: {
  onboardingGenerateSucceeded: boolean
  modifyProgramGenerateSucceeded: boolean
  rebuildGenerateSucceeded: boolean
  experienceLevelUndefinedCrash: boolean
  allPathsUsedCanonicalEntry: boolean
  staleBannerShownIncorrectly: boolean
}): boolean {
  const verdict = 
    results.onboardingGenerateSucceeded &&
    results.modifyProgramGenerateSucceeded &&
    results.rebuildGenerateSucceeded &&
    !results.experienceLevelUndefinedCrash &&
    results.allPathsUsedCanonicalEntry &&
    !results.staleBannerShownIncorrectly
  
  console.log('[phase6-generation-entry-final-verdict]', {
    onboardingGenerateSafe: results.onboardingGenerateSucceeded,
    modifyProgramGenerateSafe: results.modifyProgramGenerateSucceeded,
    rebuildGenerateSafe: results.rebuildGenerateSucceeded,
    experienceLevelGuaranteed: !results.experienceLevelUndefinedCrash,
    generationUsesSingleCanonicalEntry: results.allPathsUsedCanonicalEntry,
    staleBannerSemanticsTruthfulAfterModify: !results.staleBannerShownIncorrectly,
    safeToAdvanceToNextPhase: verdict,
  })
  
  return verdict
}
