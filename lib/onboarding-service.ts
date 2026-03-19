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
import { generateAdaptiveProgram, saveAdaptiveProgram, type AdaptiveProgramInputs, type AdaptiveProgram } from './adaptive-program-builder'
import { evaluateTrainingBehavior, type TrainingBehaviorResult } from './adaptive-progression-engine'
import { createInitialProgramHistoryEntry } from './program-history-versioning'
import type { PrimaryGoal, ExperienceLevel, TrainingDays, SessionLength } from './program-service'
import type { EquipmentType } from './adaptive-exercise-pool'

// =============================================================================
// TYPES
// =============================================================================

export interface FirstRunResult {
  success: boolean
  program: AdaptiveProgram | null
  calibration: ReturnType<typeof getAthleteCalibration> | null
  welcomeMessage: string
  error?: string
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
  
  // Map primary goal to program goal
  const goalMap: Record<string, PrimaryGoal> = {
    'skill': 'front_lever', // Default skill
    'strength': 'weighted_strength',
    'endurance': 'front_lever',
    'abs': 'front_lever',
    'general': 'front_lever',
  }
  
  return goalMap[primaryGoal || 'general'] || 'front_lever'
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
 * CRITICAL: This should only be called from /onboarding/complete/page.tsx
 * Other components should read existing program via getProgramState()
 */
export function generateFirstProgram(): FirstRunResult {
  try {
    const profile = getOnboardingProfile()
    
    if (!profile || !isOnboardingComplete()) {
      console.log('[OnboardingService] generateFirstProgram: onboarding not complete')
      return {
        success: false,
        program: null,
        calibration: null,
        welcomeMessage: 'Please complete onboarding first.',
        error: 'Onboarding incomplete',
      }
    }
    
    console.log('[OnboardingService] generateFirstProgram: starting generation')
    
    // Get calibration from profile
    const calibration = getAthleteCalibration()
    
    // Normalize profile to safe inputs (handles legacy + current field names)
    const normalized = normalizeProfileForGeneration(profile)
    
    // Map normalized data to program inputs
    const programInputs: AdaptiveProgramInputs = {
      primaryGoal: mapSkillInterestsToPrimaryGoal(normalized.selectedSkills, normalized.primaryGoal),
      experienceLevel: normalized.experienceLevel,
      trainingDaysPerWeek: mapTrainingDays(normalized.trainingDaysPerWeek),
      sessionLength: mapSessionLength(normalized.sessionLengthMinutes),
      equipment: mapEquipment(normalized.equipment),
    }
    
    // Generate the program
    const program = generateAdaptiveProgram(programInputs)
    
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
    
    console.log('[OnboardingService] Strict validation passed:', {
      sessions: program.sessions.length,
      trainingDaysPerWeek: program.trainingDaysPerWeek,
      goalLabel: program.goalLabel,
    })
    
    // Save program to CANONICAL adaptive storage - this is the source of truth
    // that /program, first-session, and workout/session all read from
    if (typeof window !== 'undefined') {
      // Primary: save to canonical adaptive programs storage
      saveAdaptiveProgram(program)
      
      // Secondary: backward-compatible mirror for legacy code paths
      localStorage.setItem('spartanlab_first_program', JSON.stringify(program))
      localStorage.setItem('spartanlab_onboarding_complete', 'true')
    }
    
    // Note: Program history entry will be created server-side via API
    // when user ID is available (after auth). The saveAdaptiveProgram call above
    // ensures the program is immediately available for all app surfaces.
    
    console.log('[OnboardingService] generateFirstProgram: success, sessions:', program.sessions.length)
    
    return {
      success: true,
      program,
      calibration,
      welcomeMessage: getWelcomeMessage(profile, normalized.experienceLevel),
    }
  } catch (error) {
    console.error('Failed to generate first program:', error)
    return {
      success: false,
      program: null,
      calibration: null,
      welcomeMessage: 'There was an issue generating your program.',
      error: String(error),
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
