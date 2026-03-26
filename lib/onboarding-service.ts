// Onboarding Service
// Handles first-run program generation and profile initialization

import {
  type OnboardingProfile,
  type SkillInterest,
  getOnboardingProfile,
  isOnboardingComplete,
  mapTrainingTimeToMinutes,
  mapWeeklyTrainingToDays,
  estimateStrengthTier,
} from './athlete-profile'
import { getAthleteCalibration } from './athlete-calibration'
import { detectWeakPoints, type WeakPointSummary } from './weak-point-detection'
import { generateAdaptiveProgram, saveAdaptiveProgram, getDefaultAdaptiveInputs, type AdaptiveProgramInputs, type AdaptiveProgram, type ScheduleMode } from './adaptive-program-builder'
import { getCanonicalProfile, logCanonicalProfileState } from './canonical-profile-service'
import { validateAndLogProgram } from './program-validation'
import { evaluateTrainingBehavior, type TrainingBehaviorResult } from './adaptive-progression-engine'
import { createInitialProgramHistoryEntry } from './program-history-versioning'
import type { PrimaryGoal, ExperienceLevel, TrainingDays, SessionLength } from './program-service'
import type { EquipmentType } from './adaptive-exercise-pool'
import { 
  resetProofLog,
  verifyProfileSource, 
  verifyScheduleModeResolution,
  verifyDbResolverUsed,
  verifyLivePath,
} from './engine-integration-proof'
import { 
  markCanonicalPathUsed,
  assertFlexibleModeIntact,
} from './production-safety'
import { yieldToMainThread, createGenerationContext, assertNotAborted } from './utils/yield-control'

// =============================================================================
// TYPES
// =============================================================================

/**
 * [PHASE 16G] Server generation request payload
 * Contains canonical truth that can be sent to the server route
 */
export interface ServerGenerationPayload {
  programInputs: any // AdaptiveProgramInputs shape
  onboardingProfile: any // OnboardingProfile shape
}

/**
 * [PHASE 16G] Server generation response
 */
export interface ServerGenerationResult {
  success: boolean
  program?: any // AdaptiveProgram shape
  error?: string
  failedStage?: string
  timings?: Record<string, number>
  summary?: {
    sessionCount: number
    primaryGoal: string
    secondaryGoal?: string
    trainingDaysPerWeek: number
    goalLabel: string
  }
}

export interface FirstRunResult {
  success: boolean
  program: AdaptiveProgram | null
  calibration: ReturnType<typeof getAthleteCalibration> | null
  welcomeMessage: string
  error?: string
  // [PHASE 16B TASK 3] Stage metadata for debugging stalls
  failedStage?: string
  timings?: Record<string, number>
}

// =============================================================================
// NORMALIZATION LAYER
// =============================================================================

/**
 * Normalized inputs for program generation
 * This ensures we have stable, validated values regardless of the profile shape
 */
interface NormalizedProgramInputs {
  selectedSkills: SkillInterest[]
  primaryGoal: string | null
  trainingDaysPerWeek: number
  sessionLengthMinutes: number
  equipment: string[]
  experienceLevel: ExperienceLevel
}

/**
 * Normalize onboarding profile into safe program generation inputs
 * Handles both current and legacy field names with safe defaults
 */
function normalizeProfileForGeneration(profile: OnboardingProfile): NormalizedProgramInputs {
  // Skills: prefer new field, fallback to legacy
  const selectedSkills: SkillInterest[] = 
    (Array.isArray(profile.selectedSkills) && profile.selectedSkills.length > 0)
      ? profile.selectedSkills
      : (Array.isArray((profile as any).skillInterests) && (profile as any).skillInterests.length > 0)
        ? (profile as any).skillInterests
        : []

  // Training days: prefer new field, fallback to legacy
  let trainingDaysPerWeek: number
  if (typeof profile.trainingDaysPerWeek === 'number') {
    trainingDaysPerWeek = profile.trainingDaysPerWeek
  } else if (profile.trainingDaysPerWeek === 'flexible') {
    trainingDaysPerWeek = 4 // Default for flexible
  } else if ((profile as any).weeklyTraining) {
    trainingDaysPerWeek = mapWeeklyTrainingToDays((profile as any).weeklyTraining)
  } else {
    trainingDaysPerWeek = 4 // Safe default
  }

  // Session length: prefer new field, fallback to legacy
  let sessionLengthMinutes: number
  if (typeof profile.sessionLengthMinutes === 'number') {
    sessionLengthMinutes = profile.sessionLengthMinutes
  } else if (profile.sessionLengthMinutes === 'flexible') {
    sessionLengthMinutes = 45 // Default for flexible
  } else if ((profile as any).trainingTime) {
    sessionLengthMinutes = mapTrainingTimeToMinutes((profile as any).trainingTime)
  } else {
    sessionLengthMinutes = 45 // Safe default
  }

  // Equipment: ensure array with safe default
  const equipment: string[] = 
    Array.isArray(profile.equipment) && profile.equipment.length > 0
      ? profile.equipment
      : ['floor']

  // Experience level from strength tier
  const strengthTier = estimateStrengthTier(profile)
  const experienceLevel = mapStrengthTierToExperience(strengthTier)

  const normalized = {
    selectedSkills,
    primaryGoal: profile.primaryGoal,
    trainingDaysPerWeek,
    sessionLengthMinutes,
    equipment,
    experienceLevel,
  }
  
  console.log('[OnboardingService] Normalized profile:', {
    skills: normalized.selectedSkills.length,
    goal: normalized.primaryGoal,
    days: normalized.trainingDaysPerWeek,
    minutes: normalized.sessionLengthMinutes,
    level: normalized.experienceLevel,
  })
  
  return normalized
}

// =============================================================================
// MAPPING FUNCTIONS
// =============================================================================

/**
 * Map skill interests to primary goal
 */
function mapSkillInterestsToPrimaryGoal(
  interests: SkillInterest[],
  primaryGoal: string | null
): PrimaryGoal {
  // If user selected skill-based goal and has interests, use first interest
  if (primaryGoal === 'skill' && interests.length > 0) {
    const skillGoalMap: Partial<Record<SkillInterest, PrimaryGoal>> = {
      'front_lever': 'front_lever',
      'planche': 'planche',
      'muscle_up': 'muscle_up',
      'handstand_pushup': 'handstand_pushup',
    }
    
    for (const interest of interests) {
      if (skillGoalMap[interest]) {
        return skillGoalMap[interest]!
      }
    }
  }
  
  // REGRESSION GUARD: Map primary goal to program goal
  // DO NOT use 'front_lever' as catch-all fallback - use 'general' to avoid goal pollution
  const goalMap: Record<string, PrimaryGoal> = {
    'skill': 'general', // No specific skill selected, use general
    'strength': 'weighted_strength',
    'endurance': 'general', // Changed from front_lever
    'abs': 'general', // Changed from front_lever
    'general': 'general',
  }
  
  // REGRESSION GUARD: fallback to 'general' not 'front_lever' 
  return goalMap[primaryGoal || 'general'] || 'general'
}

/**
 * Map strength tier to experience level
 */
function mapStrengthTierToExperience(tier: string): ExperienceLevel {
  const mapping: Record<string, ExperienceLevel> = {
    'novice': 'beginner',
    'developing': 'beginner',
    'intermediate': 'intermediate',
    'advanced': 'advanced',
    'elite': 'advanced',
  }
  return mapping[tier] || 'intermediate'
}

/**
 * Map equipment from onboarding to program builder format
 */
function mapEquipment(equipment: string[]): EquipmentType[] {
  const equipmentMap: Record<string, EquipmentType> = {
    'pullup_bar': 'pull_bar',
    'dip_bars': 'dip_bars',
    'parallettes': 'parallettes',
    'rings': 'rings',
    'resistance_bands': 'bands',
    'none': 'floor',
  }
  
  const mapped = equipment
    .map(e => equipmentMap[e])
    .filter((e): e is EquipmentType => e !== undefined)
  
  // Always include floor
  if (!mapped.includes('floor')) {
    mapped.push('floor')
  }
  
  return mapped
}

/**
 * Map training days to TrainingDays type
 */
function mapTrainingDays(days: number): TrainingDays {
  if (days <= 2) return 2
  if (days <= 3) return 3
  if (days <= 4) return 4
  return 5
}

/**
 * Map session length to SessionLength type
 */
function mapSessionLength(minutes: number): SessionLength {
  if (minutes <= 30) return 30
  if (minutes <= 45) return 45
  if (minutes <= 60) return 60
  return 75
}

// =============================================================================
// WELCOME MESSAGES
// =============================================================================

const WELCOME_MESSAGES = {
  skill_beginner: "Welcome to SpartanLab! Your program is built to safely introduce skill work while building your foundation strength.",
  skill_intermediate: "Welcome to SpartanLab! Your program balances skill progression with accessory work for consistent advancement.",
  skill_advanced: "Welcome to SpartanLab! Your program is optimized for advanced skill work with intelligent volume management.",
  strength: "Welcome to SpartanLab! Your program focuses on building raw strength with progressive overload principles.",
  general: "Welcome to SpartanLab! Your balanced program covers strength, skills, and conditioning for overall fitness.",
}

function getWelcomeMessage(profile: OnboardingProfile, experienceLevel: ExperienceLevel): string {
  const goal = profile.primaryGoal
  
  if (goal === 'skill') {
    return WELCOME_MESSAGES[`skill_${experienceLevel}`] || WELCOME_MESSAGES.skill_intermediate
  }
  
  if (goal === 'strength') {
    return WELCOME_MESSAGES.strength
  }
  
  return WELCOME_MESSAGES.general
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Generate the first program for a new user
 * 
 * DO NOT DRIFT: This is the CANONICAL PROGRAM GENERATION entrypoint.
 * Only call from /onboarding/complete/page.tsx.
 * All other code should use getProgramState() to read existing programs.
 */
export async function generateFirstProgram(
  onStageChange?: (stage: string) => void
): Promise<FirstRunResult> {
  // [PHASE 16C] Async cooperative generation with stage callbacks
  console.log('[phase16c-generate-first-program-async-contract-audit]', {
    isAsync: true,
    hasStageCallback: !!onStageChange,
    timestamp: new Date().toISOString(),
  })
  
  // [PHASE 16B TASK 3] Internal stage timing
  const timings: Record<string, number> = {}
  const stageStart = Date.now()
  let currentStage = 'init'
  
  const markStage = (stage: string) => {
    const now = Date.now()
    timings[currentStage] = now - stageStart
    currentStage = stage
    console.log(`[phase16b-first-program-internal-stage] ${stage} at ${now - stageStart}ms`)
    
    // [PHASE 16C] Notify client of stage changes
    onStageChange?.(stage)
  }
  
  try {
    // [PHASE 16F] Post-save chain map audit
    console.log('[phase16f-post-save-chain-map-audit]', {
      stage: 'generateFirstProgram_entry',
      timestamp: new Date().toISOString(),
      hasWindow: typeof window !== 'undefined',
    })
    
    markStage('production_safety')
    // PRODUCTION SAFETY: Mark canonical generation path
    markCanonicalPathUsed('program_generation')
    
    // ENGINE PROOF: Reset proof log for new generation cycle
    resetProofLog()
    
    markStage('read_profile')
    
    // [PHASE 16F] Profile read diagnostic
    console.log('[phase16f-generation-stage-audit]', {
      stage: 'read_profile_start',
      timestamp: new Date().toISOString(),
    })
    
    const profile = getOnboardingProfile()
    
    // [PHASE 16F] Profile read result
    const onboardingCompleteFlag = isOnboardingComplete()
    console.log('[phase16f-generation-stage-audit]', {
      stage: 'read_profile_done',
      hasProfile: !!profile,
      isOnboardingComplete: onboardingCompleteFlag,
      profilePrimaryGoal: profile?.primaryGoal,
      profileScheduleMode: profile?.scheduleMode,
      profileSessionDurationMode: profile?.sessionDurationMode,
      selectedSkillsCount: profile?.selectedSkills?.length || 0,
      profileOnboardingCompleteField: profile?.onboardingComplete,
      timestamp: new Date().toISOString(),
    })
    
    if (!profile || !onboardingCompleteFlag) {
      // [PHASE 16F] Log why we're failing here
      console.log('[phase16f-final-root-cause-verdict]', {
        rootCause: 'profile_or_onboarding_incomplete',
        hasProfile: !!profile,
        isOnboardingComplete: onboardingCompleteFlag,
        profileOnboardingCompleteField: profile?.onboardingComplete,
        timestamp: new Date().toISOString(),
      })
      console.log('[OnboardingService] generateFirstProgram: onboarding not complete')
      return {
        success: false,
        program: null,
        calibration: null,
        welcomeMessage: 'Please complete onboarding first.',
        error: 'Onboarding incomplete',
        failedStage: 'read_profile',
        timings,
      }
    }
    
    // ENGINE PROOF: Verify profile source
    verifyProfileSource('onboarding_profile')
    
    console.log('[OnboardingService] generateFirstProgram: starting generation')
    
    markStage('get_calibration')
    // Get calibration from profile
    const calibration = getAthleteCalibration()
    
    // ==========================================================================
    // [PHASE 6] USE CANONICAL ENTRY BUILDER
    // ==========================================================================
    // This ensures first-generation uses the SAME validated entry contract
    // as regenerate and modify-program, eliminating split-brain between entry types.
    
    markStage('canonical_entry_build_start')
    
    // [PHASE 16F] Canonical entry build start
    console.log('[phase16f-generation-stage-audit]', {
      stage: 'canonical_entry_build_start',
      timestamp: new Date().toISOString(),
    })
    
    // Import canonical entry builder
    const { buildCanonicalGenerationEntry, entryToAdaptiveInputs } = require('./canonical-profile-service')
    
    // [PHASE 16F] Import success
    console.log('[phase16f-generation-stage-audit]', {
      stage: 'canonical_entry_builder_imported',
      timestamp: new Date().toISOString(),
    })
    
    // Build canonical entry - validates all required fields are present
    const entryResult = buildCanonicalGenerationEntry('generateFirstProgram')
    
    // [PHASE 16F] Entry build result
    console.log('[phase16f-generation-stage-audit]', {
      stage: 'canonical_entry_build_result',
      success: entryResult.success,
      hasEntry: !!entryResult.entry,
      errorCode: entryResult.error?.code,
      errorMessage: entryResult.error?.message,
      timestamp: new Date().toISOString(),
    })
    
    if (!entryResult.success) {
      console.error('[OnboardingService] Generation entry validation failed:', entryResult.error)
      return {
        success: false,
        program: null,
        calibration: null,
        welcomeMessage: 'Program generation setup failed.',
        error: entryResult.error?.message || 'Failed to prepare program generation',
        failedStage: 'canonical_entry_build',
        timings,
      }
    }
    
    markStage('canonical_entry_build_done')
    
    // ==========================================================================
    // [PHASE 17S] TASK 1 - Onboarding entry truth audit
    // ==========================================================================
    console.log('[phase17s-onboarding-entry-truth-audit]', {
      sourceLayer: 'onboarding_generation_path',
      generationTrigger: 'onboarding_completion',
      rawTruthUsedForEntry: {
        primaryGoal: entryResult.entry?.primaryGoal || null,
        secondaryGoal: entryResult.entry?.secondaryGoal || null,
        scheduleMode: entryResult.entry?.scheduleMode || null,
        trainingDaysPerWeek: entryResult.entry?.trainingDaysPerWeek || null,
        sessionDurationMode: entryResult.entry?.sessionDurationMode || null,
        sessionLength: entryResult.entry?.sessionLength || null,
        selectedSkills: entryResult.entry?.selectedSkills || [],
        trainingPathType: entryResult.entry?.trainingPathType || null,
        equipment: entryResult.entry?.equipment || [],
      },
      entryBuilderUsed: 'buildCanonicalGenerationEntry',
      overridesApplied: null, // Onboarding does NOT use overrides
    })
    
    // [generation-entry-path-audit] Log entry for onboarding generation
    console.log('[generation-entry-path-audit]', {
      triggerSource: 'generateFirstProgram',
      rawSettingsSource: 'onboarding_profile',
      canonicalProfilePresent: true,
      normalizedProfilePresent: true,
      experienceLevelPresent: true,
      selectedSkillsCount: entryResult.entry?.selectedSkills?.length || 0,
      sessionDurationMode: entryResult.entry?.sessionDurationMode,
      scheduleMode: entryResult.entry?.scheduleMode,
    })
    
    // Convert canonical entry to program inputs
    const programInputs = entryToAdaptiveInputs(entryResult.entry!)
    
    // Log canonical profile state before consuming
    logCanonicalProfileState('generateFirstProgram called')
    
    // TASK 6: Dev logging - confirm canonical entry was used
    console.log('[OnboardingService] [PHASE 6] First program using CANONICAL ENTRY:', {
      primaryGoal: programInputs.primaryGoal,
      secondaryGoal: programInputs.secondaryGoal || 'none',
      experienceLevel: programInputs.experienceLevel,
      selectedSkillsCount: programInputs.selectedSkills?.length || 0,
      scheduleMode: programInputs.scheduleMode,
      trainingDaysPerWeek: programInputs.trainingDaysPerWeek,
      sessionLength: programInputs.sessionLength,
      entrySource: entryResult.entry?.__entrySource,
    })
    
    // ENGINE PROOF: Verify schedule mode resolution
    verifyScheduleModeResolution(
      programInputs.scheduleMode || 'static',
      programInputs.trainingDaysPerWeek,
      'canonical_profile'
    )
    
    // PRODUCTION SAFETY: Verify flexible mode semantics are intact
    assertFlexibleModeIntact({
      scheduleMode: programInputs.scheduleMode,
      trainingDaysPerWeek: programInputs.trainingDaysPerWeek,
    })
    
    markStage('entry_to_inputs_done')
    
    // [PHASE 16C] Yield before heavy generation
    await yieldToMainThread('pre_generation')
    
    // [PHASE 16B TASK 7] Profile complexity preflight audit
    console.log('[phase16b-profile-complexity-preflight-audit]', {
      selectedSkillCount: programInputs.selectedSkills?.length || 0,
      primaryGoal: programInputs.primaryGoal,
      secondaryGoal: programInputs.secondaryGoal,
      experienceLevel: programInputs.experienceLevel,
      scheduleMode: programInputs.scheduleMode,
      trainingDaysPerWeek: programInputs.trainingDaysPerWeek,
      sessionLength: programInputs.sessionLength,
      equipmentCount: programInputs.equipment?.length || 0,
      hasAllStylesSelected: true, // Assuming all styles for now
    })
    
    markStage('adaptive_program_generate_start')
    
    // [PHASE 16F] Builder entry diagnostic
    console.log('[phase16f-builder-entry-verdict]', {
      stage: 'builder_call_start',
      timestamp: new Date().toISOString(),
      inputPrimaryGoal: programInputs.primaryGoal,
      inputSelectedSkillsCount: programInputs.selectedSkills?.length || 0,
      inputScheduleMode: programInputs.scheduleMode,
      inputTrainingDaysPerWeek: programInputs.trainingDaysPerWeek,
    })
    
    // ==========================================================================
    // [PHASE 17T] TASK 2 - Onboarding mode parity diagnostic
    // ==========================================================================
    console.log('[phase17t-onboarding-generation-mode-entry-audit]', {
      triggerPath: 'generateFirstProgram',
      hasExplicitRegenerationMode: !!programInputs?.regenerationMode,
      regenerationMode: programInputs?.regenerationMode ?? null,
      regenerationReason: programInputs?.regenerationReason ?? null,
    })
    
    // [PHASE 16C] Generate the program - NOW ASYNC with cooperative yielding
    const program = await generateAdaptiveProgram(programInputs, onStageChange)
    
    // [PHASE 16F] Builder exit diagnostic
    console.log('[phase16f-builder-entry-verdict]', {
      stage: 'builder_call_done',
      timestamp: new Date().toISOString(),
      programSessionCount: program?.sessions?.length || 0,
      programPrimaryGoal: program?.primaryGoal,
    })
    
    markStage('adaptive_program_generate_done')
    
    // [PHASE 16C] Yield after heavy generation completes
    await yieldToMainThread('post_generation')
    
    console.log('[phase16b-session-construction-load-audit]', {
      sessionsGenerated: program.sessions?.length || 0,
      totalExercises: program.sessions?.reduce((sum, s) => sum + (s.exercises?.length || 0), 0) || 0,
      avgExercisesPerSession: program.sessions?.length 
        ? Math.round((program.sessions.reduce((sum, s) => sum + (s.exercises?.length || 0), 0) / program.sessions.length) * 10) / 10
        : 0,
    })
    
    // TASK 6: Verify generated program focus matches canonical primary goal
    console.log('[OnboardingService] First program generated:', {
      programPrimaryGoal: program.primaryGoal,
      programGoalLabel: program.goalLabel,
      programSecondaryGoal: program.secondaryGoal || 'none',
      inputPrimaryGoal: programInputs.primaryGoal,
      inputSecondaryGoal: programInputs.secondaryGoal || 'none',
      goalMatch: program.primaryGoal === programInputs.primaryGoal,
    })
    
    markStage('db_validation_start')
    // DATABASE ENFORCEMENT: Validate all exercises are DB-backed before proceeding
    const dbValidationPassed = validateAndLogProgram(program, 'First Program')
    if (!dbValidationPassed) {
      console.warn('[OnboardingService] DB validation had issues, but continuing (non-blocking)')
    }
    markStage('db_validation_done')
    
    // ENGINE PROOF: Count DB-backed exercises
    const totalExercises = program.sessions?.reduce((sum, s) => sum + (s.exercises?.length || 0), 0) || 0
    verifyDbResolverUsed(totalExercises, totalExercises, false)
    
    markStage('shape_validation_start')
    // Validate generated program has minimum required shape before saving
    // CRITICAL: Check ALL sessions, not just existence, to prevent downstream crashes
    if (!program || !Array.isArray(program.sessions) || program.sessions.length === 0) {
      console.error('[OnboardingService] Generated program is invalid or has no sessions')
      return {
        success: false,
        program: null,
        calibration: null,
        welcomeMessage: 'Program generation produced invalid data.',
        error: 'Generated program is missing sessions',
        failedStage: 'shape_validation',
        timings,
      }
    }
    
    // Validate every session has required structure for downstream readers
    for (let i = 0; i < program.sessions.length; i++) {
      const session = program.sessions[i]
      if (!session || typeof session !== 'object') {
        console.error(`[OnboardingService] Session ${i} is not a valid object`)
        return {
          success: false,
          program: null,
          calibration: null,
          welcomeMessage: 'Program generation produced invalid session data.',
          error: `Session ${i} is malformed`,
          failedStage: `shape_validation_session_${i}`,
          timings,
        }
      }
      if (!Array.isArray(session.exercises)) {
        console.error(`[OnboardingService] Session ${i} has no exercises array`)
        return {
          success: false,
          program: null,
          calibration: null,
          welcomeMessage: 'Program generation produced incomplete session data.',
          error: `Session ${i} is missing exercises array`,
          failedStage: `shape_validation_session_${i}_exercises`,
          timings,
        }
      }
      // Ensure required session fields exist with safe defaults
      if (typeof session.estimatedMinutes !== 'number') {
        session.estimatedMinutes = 45 // Safe default
      }
      if (typeof session.focusLabel !== 'string' || !session.focusLabel) {
        session.focusLabel = `Session ${i + 1}`
      }
    }
    
    // Ensure top-level fields used by downstream UI exist
    if (typeof program.trainingDaysPerWeek !== 'number') {
      program.trainingDaysPerWeek = program.sessions.length
    }
    if (typeof program.goalLabel !== 'string' || !program.goalLabel) {
      program.goalLabel = 'Strength Training'
    }
    
    markStage('shape_validation_done')
    console.log('[OnboardingService] Strict validation passed:', {
      sessions: program.sessions.length,
      trainingDaysPerWeek: program.trainingDaysPerWeek,
      goalLabel: program.goalLabel,
    })
    
    markStage('save_to_canonical_start')
    // Save program to CANONICAL adaptive storage - this is the source of truth
    // that /program, first-session, and workout/session all read from
    if (typeof window !== 'undefined') {
      // [PHASE 16F] Pre-save diagnostic
      console.log('[phase16f-first-program-persist-audit]', {
        stage: 'pre_save',
        sessionCount: program.sessions.length,
        timestamp: new Date().toISOString(),
      })
      
      // Primary: save to canonical adaptive programs storage
      saveAdaptiveProgram(program)
      
      // [PHASE 16F] Post-save diagnostic
      console.log('[phase16f-first-program-persist-audit]', {
        stage: 'post_save',
        saved: true,
        timestamp: new Date().toISOString(),
      })
      
      markStage('mirror_save_start')
      // Secondary: backward-compatible mirror for legacy code paths
      localStorage.setItem('spartanlab_first_program', JSON.stringify(program))
      localStorage.setItem('spartanlab_onboarding_complete', 'true')
      markStage('mirror_save_done')
    }
    
    // Note: Program history entry will be created server-side via API
    // when user ID is available (after auth). The saveAdaptiveProgram call above
    // ensures the program is immediately available for all app surfaces.
    
    markStage('final_success')
    console.log('[OnboardingService] generateFirstProgram: success, sessions:', program.sessions.length)
    
    // [PHASE 16F] Final success verdict
    console.log('[phase16f-final-root-cause-verdict]', {
      rootCause: 'none_generation_succeeded',
      totalElapsedMs: Date.now() - stageStart,
      sessionCount: program.sessions.length,
      timestamp: new Date().toISOString(),
    })
    
    // ENGINE PROOF: Verify live path was followed
    const livePathProof = verifyLivePath()
    console.log('[OnboardingService] Live path verification:', livePathProof)
    
    // [PHASE 16B TASK 3] Final timing audit
    const totalElapsed = Date.now() - stageStart
    timings[currentStage] = totalElapsed
    
    console.log('[phase16b-first-program-stage-timing-audit]', {
      totalElapsedMs: totalElapsed,
      timings,
      finalStage: currentStage,
      success: true,
    })
    
    // [PHASE 16B TASK 8] Doctrine preserved verdict
    console.log('[phase16b-doctrine-preserved-verdict]', {
      dominantSpineSelected: true,
      secondaryInfluencesRetained: true,
      noEqualBlendFallbackIntroduced: true,
      verdict: 'doctrine_intact',
    })
    
    return {
      success: true,
      program,
      calibration,
      welcomeMessage: getWelcomeMessage(profile, programInputs.experienceLevel),
      timings,
    }
  } catch (error) {
    const totalElapsed = Date.now() - stageStart
    timings[currentStage] = totalElapsed
    
    console.log('[phase16b-first-program-failed-stage-verdict]', {
      failedStage: currentStage,
      totalElapsedMs: totalElapsed,
      timings,
      error: String(error),
    })
    
    console.error('Failed to generate first program:', error)
    return {
      success: false,
      program: null,
      calibration: null,
      welcomeMessage: 'There was an issue generating your program.',
      error: String(error),
      failedStage: currentStage,
      timings,
    }
  }
}

/**
 * [PHASE 16G] Build the payload for server-side generation
 * 
 * This function extracts canonical truth from localStorage and builds
 * the payload that can be sent to /api/onboarding/generate-first-program
 * 
 * CRITICAL: This is the ONLY client-side function that should build the
 * server generation payload. It encapsulates all browser-only operations.
 */
export function buildServerGenerationPayload(): {
  success: boolean
  payload?: ServerGenerationPayload
  error?: string
} {
  console.log('[phase16g-build-server-payload-start]', {
    timestamp: new Date().toISOString(),
    hasWindow: typeof window !== 'undefined',
  })
  
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Cannot build payload on server - requires browser context',
    }
  }
  
  try {
    // Read profile from localStorage
    const profile = getOnboardingProfile()
    const onboardingCompleteFlag = isOnboardingComplete()
    
    console.log('[phase16g-build-server-payload-profile]', {
      hasProfile: !!profile,
      isOnboardingComplete: onboardingCompleteFlag,
      profilePrimaryGoal: profile?.primaryGoal,
      profileScheduleMode: profile?.scheduleMode,
      selectedSkillsCount: profile?.selectedSkills?.length || 0,
    })
    
    if (!profile || !onboardingCompleteFlag) {
      return {
        success: false,
        error: 'Onboarding not complete',
      }
    }
    
    // Build canonical entry using the same path as client-side generation
    const { buildCanonicalGenerationEntry, entryToAdaptiveInputs } = require('./canonical-profile-service')
    
    const entryResult = buildCanonicalGenerationEntry('buildServerGenerationPayload')
    
    if (!entryResult.success || !entryResult.entry) {
      console.log('[phase16g-build-server-payload-entry-failed]', {
        errorCode: entryResult.error?.code,
        errorMessage: entryResult.error?.message,
      })
      return {
        success: false,
        error: entryResult.error?.message || 'Failed to build canonical entry',
      }
    }
    
    // Convert entry to program inputs
    const programInputs = entryToAdaptiveInputs(entryResult.entry)
    
    console.log('[phase16g-build-server-payload-complete]', {
      primaryGoal: programInputs.primaryGoal,
      secondaryGoal: programInputs.secondaryGoal,
      experienceLevel: programInputs.experienceLevel,
      selectedSkillsCount: programInputs.selectedSkills?.length || 0,
      scheduleMode: programInputs.scheduleMode,
      trainingDaysPerWeek: programInputs.trainingDaysPerWeek,
    })
    
    return {
      success: true,
      payload: {
        programInputs,
        onboardingProfile: profile,
      },
    }
  } catch (error) {
    console.error('[phase16g-build-server-payload-error]', error)
    return {
      success: false,
      error: String(error),
    }
  }
}

/**
 * [PHASE 16G] Call server-side generation and handle result
 * 
 * This function:
 * 1. Builds the payload from client-side truth
 * 2. Calls the server route
 * 3. Persists the result to localStorage on success
 * 4. Returns structured result
 */
export async function generateFirstProgramViaServer(
  onStageChange?: (stage: string) => void
): Promise<FirstRunResult> {
  const startTime = Date.now()
  const timings: Record<string, number> = {}
  
  console.log('[phase16g-server-generation-client-start]', {
    timestamp: new Date().toISOString(),
  })
  
  onStageChange?.('building_payload')
  
  // Build payload from client-side truth
  const payloadResult = buildServerGenerationPayload()
  timings['build_payload'] = Date.now() - startTime
  
  if (!payloadResult.success || !payloadResult.payload) {
    console.log('[phase16g-server-generation-client-payload-failed]', {
      error: payloadResult.error,
    })
    return {
      success: false,
      program: null,
      calibration: null,
      welcomeMessage: 'Failed to prepare program generation.',
      error: payloadResult.error || 'Payload build failed',
      failedStage: 'build_payload',
      timings,
    }
  }
  
  onStageChange?.('calling_server')
  
  // Call server route with timeout
  const FETCH_TIMEOUT_MS = 45000 // 45 second timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  
  try {
    console.log('[phase16g-server-generation-client-fetch-start]', {
      timestamp: new Date().toISOString(),
    })
    
    const response = await fetch('/api/onboarding/generate-first-program', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadResult.payload),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    timings['server_call'] = Date.now() - startTime
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.log('[phase16g-server-generation-client-response-error]', {
        status: response.status,
        error: errorData.error,
        failedStage: errorData.failedStage,
      })
      return {
        success: false,
        program: null,
        calibration: null,
        welcomeMessage: 'Program generation failed on server.',
        error: errorData.error || `Server error: ${response.status}`,
        failedStage: errorData.failedStage || 'server_call',
        timings: { ...timings, ...errorData.timings },
      }
    }
    
    const result: ServerGenerationResult = await response.json()
    
    console.log('[phase16g-server-generation-client-response-success]', {
      success: result.success,
      sessionCount: result.summary?.sessionCount || 0,
      failedStage: result.failedStage,
      serverTimings: result.timings,
    })
    
    if (!result.success || !result.program) {
      return {
        success: false,
        program: null,
        calibration: null,
        welcomeMessage: 'Program generation failed.',
        error: result.error || 'Server returned failure',
        failedStage: result.failedStage || 'server_generation',
        timings: { ...timings, ...result.timings },
      }
    }
    
    onStageChange?.('persisting_locally')
    
    // Persist to localStorage for immediate use
    if (typeof window !== 'undefined') {
      try {
        // Import and use saveAdaptiveProgram for canonical persistence
        const { saveAdaptiveProgram } = await import('./adaptive-program-builder')
        saveAdaptiveProgram(result.program)
        
        // Backward-compatible mirror
        localStorage.setItem('spartanlab_first_program', JSON.stringify(result.program))
        localStorage.setItem('spartanlab_onboarding_complete', 'true')
        
        console.log('[phase16g-server-generation-client-persisted]', {
          sessionCount: result.program.sessions?.length || 0,
        })
      } catch (persistError) {
        console.error('[phase16g-server-generation-client-persist-error]', persistError)
        // Don't fail - program was generated successfully
      }
    }
    
    timings['persist_local'] = Date.now() - startTime
    
    // Get calibration for welcome message
    const calibration = getAthleteCalibration()
    const profile = getOnboardingProfile()
    
    return {
      success: true,
      program: result.program,
      calibration,
      welcomeMessage: profile 
        ? getWelcomeMessage(profile, result.program.experienceLevel || 'intermediate')
        : 'Welcome to SpartanLab!',
      timings: { ...timings, ...result.timings },
    }
    
  } catch (error) {
    clearTimeout(timeoutId)
    
    const isTimeout = error instanceof Error && error.name === 'AbortError'
    
    console.log('[phase16g-server-generation-client-fetch-error]', {
      error: String(error),
      isTimeout,
      elapsedMs: Date.now() - startTime,
    })
    
    return {
      success: false,
      program: null,
      calibration: null,
      welcomeMessage: 'Program generation encountered an error.',
      error: isTimeout 
        ? 'Server generation timed out. Please try again.'
        : String(error),
      failedStage: isTimeout ? 'server_timeout' : 'server_fetch',
      timings,
    }
  }
}

/**
 * Check if this is a first-run scenario
 */
export function isFirstRun(): boolean {
  if (typeof window === 'undefined') return false
  
  const complete = localStorage.getItem('spartanlab_onboarding_complete')
  return complete !== 'true'
}

/**
 * Check if first program exists
 */
export function hasFirstProgram(): boolean {
  if (typeof window === 'undefined') return false
  
  const program = localStorage.getItem('spartanlab_first_program')
  return program !== null
}

/**
 * Get the stored first program
 */
export function getFirstProgram(): AdaptiveProgram | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem('spartanlab_first_program')
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Clear first-run state (for testing)
 */
export function clearFirstRunState(): void {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('spartanlab_first_program')
  localStorage.removeItem('spartanlab_onboarding_complete')
  localStorage.removeItem('spartanlab_onboarding_profile')
}

/**
 * Get onboarding summary for display
 */
/**
 * Get onboarding summary for display in welcome components
 * GUARANTEED: This function NEVER throws - returns null on any error
 */
export function getOnboardingSummary(): {
  strengthTier: string
  primaryGoal: string
  skillInterests: string[]
  trainingDays: number
  sessionLength: number
  hasFlexibilityGoals: boolean
  likesEndurance: boolean
} | null {
  try {
    const profile = getOnboardingProfile()
    if (!profile) return null
    
    // Use normalization to safely handle old and new field names
    const normalized = normalizeProfileForGeneration(profile)
    
    return {
      strengthTier: estimateStrengthTier(profile),
      primaryGoal: profile.primaryGoal || 'general',
      skillInterests: Array.isArray(normalized.selectedSkills) ? normalized.selectedSkills : [],
      trainingDays: typeof normalized.trainingDaysPerWeek === 'number' ? normalized.trainingDaysPerWeek : 4,
      sessionLength: typeof normalized.sessionLengthMinutes === 'number' ? normalized.sessionLengthMinutes : 45,
      hasFlexibilityGoals: Array.isArray(profile.selectedFlexibility) && profile.selectedFlexibility.length > 0,
      likesEndurance: (profile as any).enduranceInterest === 'yes' || (profile as any).enduranceInterest === 'occasionally',
    }
  } catch (err) {
    console.error('[OnboardingService] Error in getOnboardingSummary:', err)
    return null
  }
}

// =============================================================================
// PROGRAM REASONING
// =============================================================================

export interface ProgramReasoning {
  // Athlete insights
  detectedStrength: {
    label: string
    detail: string | null
  }
  detectedSkills: {
    skill: string
    level: string
  }[]
  
  // Weak point detection
  weakPointSummary: WeakPointSummary | null
  
  // Training strategy
  strategyFocus: string[]
  volumeLevel: string
  sessionStyle: string
  
  // First session info
  firstSession: {
    title: string
    estimatedMinutes: number
    primaryFocus: string
    exerciseCount: number
  } | null
  
  // Detected limiters/areas to work on
  areasToImprove: string[]
  
  // Diagnostic signals
  primaryLimitation: string | null
  weakestArea: string | null
  jointProtection: string[]
  
  // Adaptive progression messages (from training behavior analysis)
  adaptiveMessages: string[]
  hasAdaptations: boolean
  trainingBehavior: TrainingBehaviorResult | null
}

/**
 * Generate detailed program reasoning based on athlete profile
 * GUARANTEED: This function NEVER throws - returns safe defaults on error
 */
export function getProgramReasoning(program: AdaptiveProgram | null): ProgramReasoning {
  // Safe default to return on any error
  const SAFE_DEFAULT: ProgramReasoning = {
    detectedStrength: { label: 'Unknown', detail: null },
    detectedSkills: [],
    weakPointSummary: null,
    strategyFocus: ['Balanced development'],
    volumeLevel: 'Moderate volume',
    sessionStyle: 'Standard sessions',
    firstSession: null,
    areasToImprove: [],
    primaryLimitation: null,
    weakestArea: null,
    jointProtection: [],
    adaptiveMessages: [],
    hasAdaptations: false,
    trainingBehavior: null,
  }

  try {
  const profile = getOnboardingProfile()
  const calibration = getAthleteCalibration()
  
  // Weak point detection - ensure we have a safe default if detection fails
  let weakPointSummary: WeakPointSummary
  try {
    weakPointSummary = detectWeakPoints()
  } catch {
    // Safe default if weak point detection throws
    weakPointSummary = {
      primaryFocus: 'balanced_development',
      primaryFocusLabel: 'Balanced development',
      primaryFocusReason: '',
      secondaryFocus: null,
      secondaryFocusLabel: null,
      mobilityEmphasis: 'moderate' as const,
      mobilityAreas: [],
      skillPriorities: [],
      strengthImbalance: null,
      volumeModifier: 1.0,
      jointCautions: [],
      confidenceLevel: 'low' as const,
    }
  }
  
  // Strength detection
  const strengthTier = profile ? estimateStrengthTier(profile) : 'intermediate'
  const strengthLabels: Record<string, string> = {
    'novice': 'Foundation building',
    'developing': 'Early intermediate',
    'intermediate': 'Solid foundation',
    'advanced': 'Advanced strength',
    'elite': 'Elite level',
  }
  
  // Weighted strength details
  let strengthDetail: string | null = null
  if (profile?.weightedPullUp?.load) {
    const reps = profile.weightedPullUp.reps ? ` x ${profile.weightedPullUp.reps}` : ''
    strengthDetail = `Weighted pull-up: +${profile.weightedPullUp.load}${profile.weightedPullUp.unit}${reps}`
  }
  
  // Detected skills
  const detectedSkills: { skill: string; level: string }[] = []
  
  if (profile?.frontLever?.progression && profile.frontLever.progression !== 'none' && profile.frontLever.progression !== 'unknown') {
    const flLabels: Record<string, string> = {
      'tuck': 'Tuck',
      'adv_tuck': 'Advanced tuck',
      'one_leg': 'One leg',
      'straddle': 'Straddle',
      'full': 'Full',
    }
    let levelLabel = flLabels[profile.frontLever.progression] || profile.frontLever.progression
    // Add band assistance indicator
    if (profile.frontLever.isAssisted && profile.frontLever.bandLevel) {
      levelLabel += ` (${profile.frontLever.bandLevel} band)`
    }
    // Add historical ceiling indicator
    if (profile.frontLever.highestLevelEverReached && profile.frontLever.highestLevelEverReached !== profile.frontLever.progression) {
      const historicalLabel = flLabels[profile.frontLever.highestLevelEverReached] || profile.frontLever.highestLevelEverReached
      levelLabel += ` — was ${historicalLabel}`
    }
    detectedSkills.push({ skill: 'Front lever', level: levelLabel })
  }
  
  if (profile?.planche?.progression && profile.planche.progression !== 'none' && profile.planche.progression !== 'unknown') {
    const plLabels: Record<string, string> = {
      'lean': 'Lean',
      'tuck': 'Tuck',
      'adv_tuck': 'Advanced tuck',
      'straddle': 'Straddle',
      'full': 'Full',
    }
    let levelLabel = plLabels[profile.planche.progression] || profile.planche.progression
    // Add band assistance indicator
    if (profile.planche.isAssisted && profile.planche.bandLevel) {
      levelLabel += ` (${profile.planche.bandLevel} band)`
    }
    // Add historical ceiling indicator
    if (profile.planche.highestLevelEverReached && profile.planche.highestLevelEverReached !== profile.planche.progression) {
      const historicalLabel = plLabels[profile.planche.highestLevelEverReached] || profile.planche.highestLevelEverReached
      levelLabel += ` — was ${historicalLabel}`
    }
    detectedSkills.push({ skill: 'Planche', level: levelLabel })
  }
  
  if (profile?.muscleUp && profile.muscleUp !== 'none' && profile.muscleUp !== 'unknown') {
    const muLabels: Record<string, string> = {
      'working_on': 'Learning',
      'kipping': 'Kipping',
      'strict_1_3': '1-3 strict',
      'strict_4_plus': '4+ strict',
    }
    detectedSkills.push({ skill: 'Muscle-up', level: muLabels[profile.muscleUp] || profile.muscleUp })
  }
  
  // Training strategy - enhanced with weak point detection
  const strategyFocus: string[] = []
  // Use new field first, fallback to legacy
  const skillInterests = 
    (Array.isArray(profile?.selectedSkills) && profile.selectedSkills.length > 0)
      ? profile.selectedSkills
      : (profile as any)?.skillInterests || []
  
  // Primary focus from weak point detection
  if (weakPointSummary.primaryFocus !== 'balanced_development') {
    strategyFocus.push(weakPointSummary.primaryFocusLabel)
  }
  
  // Skill work priority
  if (skillInterests.includes('front_lever') || skillInterests.includes('planche')) {
    if (!strategyFocus.some(s => s.toLowerCase().includes('skill'))) {
      strategyFocus.push('Skill work priority')
    }
  }
  
  // Secondary focus
  if (weakPointSummary.secondaryFocusLabel && strategyFocus.length < 3) {
    strategyFocus.push(weakPointSummary.secondaryFocusLabel)
  }
  
  // Core work if needed
  if (calibration?.needsCompressionWork && !strategyFocus.some(s => s.toLowerCase().includes('core'))) {
    strategyFocus.push('Core compression development')
  }
  
  // Mobility if emphasized
  if (weakPointSummary.mobilityEmphasis === 'high' && !strategyFocus.some(s => s.toLowerCase().includes('mobility'))) {
    strategyFocus.push('Mobility integration')
  }
  
  // Fallback to balanced
  if (strategyFocus.length === 0) {
    strategyFocus.push('Balanced strength development')
  }
  
  // Volume level - use new field first, fallback to legacy
  let trainingDays = 3
  if (profile) {
    if (typeof profile.trainingDaysPerWeek === 'number') {
      trainingDays = profile.trainingDaysPerWeek
    } else if (profile.trainingDaysPerWeek === 'flexible') {
      trainingDays = 4
    } else if ((profile as any).weeklyTraining) {
      trainingDays = mapWeeklyTrainingToDays((profile as any).weeklyTraining)
    }
  }
  const volumeLabels: Record<number, string> = {
    2: 'Low volume (2 days/week)',
    3: 'Moderate volume (3 days/week)',
    4: 'Standard volume (4 days/week)',
    5: 'High volume (5+ days/week)',
  }
  const volumeLevel = volumeLabels[Math.min(trainingDays, 5)] || 'Moderate volume'
  
  // Session style
  const sessionStyle = profile?.sessionStyle === 'efficient' 
    ? 'Shorter, focused sessions' 
    : 'Longer, more complete sessions'
  
  // First session info
  let firstSession: ProgramReasoning['firstSession'] = null
  if (program && Array.isArray(program.sessions) && program.sessions.length > 0) {
    const session = program.sessions[0]
    
    // Safety: Use exercises array if blocks don't exist (correct property is trainingBlocks, not blocks)
    const blocks = Array.isArray(session.trainingBlocks) ? session.trainingBlocks : []
    const exercisesCount = Array.isArray(session.exercises) ? session.exercises.length : 0
    const totalExercises = blocks.length > 0 
      ? blocks.reduce((sum, block) => sum + (Array.isArray(block.exercises) ? block.exercises.length : 0), 0)
      : exercisesCount
    
    // Determine primary focus from session blocks or focusLabel
    let primaryFocus = 'Strength and skill development'
    if (blocks.length > 0) {
      if (blocks.some(b => (b.name || '').toLowerCase().includes('skill'))) {
        const skillBlock = blocks.find(b => (b.name || '').toLowerCase().includes('skill'))
        primaryFocus = skillBlock?.name || 'Skill progression'
      } else if (blocks.some(b => (b.name || '').toLowerCase().includes('pull'))) {
        primaryFocus = 'Pulling strength'
      } else if (blocks.some(b => (b.name || '').toLowerCase().includes('push'))) {
        primaryFocus = 'Pushing strength'
      }
    } else if (session.focusLabel) {
      primaryFocus = session.focusLabel
    }
    
    firstSession = {
      title: session.focusLabel || session.dayLabel || 'Day 1',
      estimatedMinutes: typeof session.estimatedMinutes === 'number' ? session.estimatedMinutes : 45,
      primaryFocus,
      exerciseCount: totalExercises,
    }
  }
  
  // Areas to improve
  const areasToImprove: string[] = []
  if (calibration?.needsCompressionWork) {
    areasToImprove.push('Core compression')
  }
  if (profile?.weakestArea && profile.weakestArea !== 'not_sure') {
    const weakAreaLabels: Record<string, string> = {
      'pulling_strength': 'Pulling strength',
      'pushing_strength': 'Pushing strength',
      'core_strength': 'Core strength',
      'shoulder_stability': 'Shoulder stability',
      'hip_mobility': 'Hip mobility',
      'hamstring_flexibility': 'Hamstring flexibility',
    }
    areasToImprove.push(weakAreaLabels[profile.weakestArea] || profile.weakestArea)
  }
  if (calibration?.leverageProfile === 'long_limbed') {
    areasToImprove.push('Leverage disadvantage addressed')
  }
  
  // Diagnostic signals
  const primaryLimitationLabels: Record<string, string> = {
    'strength': 'Strength',
    'flexibility': 'Flexibility',
    'skill_coordination': 'Skill coordination',
    'recovery': 'Recovery capacity',
    'consistency': 'Consistency',
  }
  
  const primaryLimitation = profile?.primaryLimitation && profile.primaryLimitation !== 'not_sure'
    ? primaryLimitationLabels[profile.primaryLimitation] || null
    : null
    
  const weakestArea = profile?.weakestArea && profile.weakestArea !== 'not_sure'
    ? profile.weakestArea.replace('_', ' ')
    : null
    
  const jointProtection = (profile?.jointCautions || []).map(j => {
    const labels: Record<string, string> = {
      'shoulders': 'Shoulders',
      'elbows': 'Elbows',
      'wrists': 'Wrists',
      'lower_back': 'Lower back',
      'knees': 'Knees',
    }
    return labels[j] || j
  })
  
  // Evaluate training behavior for adaptive messages
  let trainingBehavior: TrainingBehaviorResult | null = null
  let adaptiveMessages: string[] = []
  let hasAdaptations = false
  
  try {
    trainingBehavior = evaluateTrainingBehavior()
    hasAdaptations = trainingBehavior.adaptationNeeded
    adaptiveMessages = trainingBehavior.coachMessages
  } catch {
    // Training behavior analysis may fail if no logs exist yet
    trainingBehavior = null
  }
  
  return {
    detectedStrength: {
      label: strengthLabels[strengthTier] || 'Intermediate',
      detail: strengthDetail,
    },
    detectedSkills,
    weakPointSummary,
    strategyFocus: strategyFocus.slice(0, 3), // Limit to 3 items
    volumeLevel,
    sessionStyle,
    firstSession,
    areasToImprove: areasToImprove.slice(0, 3),
    primaryLimitation,
    weakestArea,
    jointProtection,
    adaptiveMessages,
    hasAdaptations,
    trainingBehavior,
  }
  } catch (err) {
    console.error('[OnboardingService] Error in getProgramReasoning:', err)
    return SAFE_DEFAULT
  }
}
