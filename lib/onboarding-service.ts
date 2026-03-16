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
import { generateAdaptiveProgram, type AdaptiveProgramInputs, type AdaptiveProgram } from './adaptive-program-builder'
import { evaluateTrainingBehavior, type TrainingBehaviorResult } from './adaptive-progression-engine'
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
 */
export function generateFirstProgram(): FirstRunResult {
  try {
    const profile = getOnboardingProfile()
    
    if (!profile || !isOnboardingComplete()) {
      return {
        success: false,
        program: null,
        calibration: null,
        welcomeMessage: 'Please complete onboarding first.',
        error: 'Onboarding incomplete',
      }
    }
    
    // Get calibration from profile
    const calibration = getAthleteCalibration()
    
    // Determine experience level from strength tier
    const strengthTier = estimateStrengthTier(profile)
    const experienceLevel = mapStrengthTierToExperience(strengthTier)
    
    // Map onboarding data to program inputs
    const programInputs: AdaptiveProgramInputs = {
      primaryGoal: mapSkillInterestsToPrimaryGoal(profile.skillInterests, profile.primaryGoal),
      experienceLevel,
      trainingDaysPerWeek: mapTrainingDays(mapWeeklyTrainingToDays(profile.weeklyTraining!)),
      sessionLength: mapSessionLength(mapTrainingTimeToMinutes(profile.trainingTime!)),
      equipment: mapEquipment(profile.equipment),
    }
    
    // Generate the program
    const program = generateAdaptiveProgram(programInputs)
    
    // Save program to localStorage for dashboard
    if (typeof window !== 'undefined') {
      localStorage.setItem('spartanlab_first_program', JSON.stringify(program))
      localStorage.setItem('spartanlab_onboarding_complete', 'true')
    }
    
    return {
      success: true,
      program,
      calibration,
      welcomeMessage: getWelcomeMessage(profile, experienceLevel),
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
export function getOnboardingSummary(): {
  strengthTier: string
  primaryGoal: string
  skillInterests: string[]
  trainingDays: number
  sessionLength: number
  hasFlexibilityGoals: boolean
  likesEndurance: boolean
} | null {
  const profile = getOnboardingProfile()
  if (!profile) return null
  
  return {
    strengthTier: estimateStrengthTier(profile),
    primaryGoal: profile.primaryGoal || 'general',
    skillInterests: profile.skillInterests,
    trainingDays: mapWeeklyTrainingToDays(profile.weeklyTraining || '3'),
    sessionLength: mapTrainingTimeToMinutes(profile.trainingTime || '30_45'),
    hasFlexibilityGoals: (profile.flexibilityGoals || []).length > 0,
    likesEndurance: profile.enduranceInterest === 'yes' || profile.enduranceInterest === 'occasionally',
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
 */
export function getProgramReasoning(program: AdaptiveProgram | null): ProgramReasoning {
  const profile = getOnboardingProfile()
  const calibration = getAthleteCalibration()
  
  // Weak point detection
  const weakPointSummary = detectWeakPoints()
  
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
    detectedSkills.push({ skill: 'Front lever', level: flLabels[profile.frontLever.progression] || profile.frontLever.progression })
  }
  
  if (profile?.planche?.progression && profile.planche.progression !== 'none' && profile.planche.progression !== 'unknown') {
    const plLabels: Record<string, string> = {
      'lean': 'Lean',
      'tuck': 'Tuck',
      'adv_tuck': 'Advanced tuck',
      'straddle': 'Straddle',
      'full': 'Full',
    }
    detectedSkills.push({ skill: 'Planche', level: plLabels[profile.planche.progression] || profile.planche.progression })
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
  const skillInterests = profile?.skillInterests || []
  
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
  
  // Volume level
  const trainingDays = profile?.weeklyTraining ? mapWeeklyTrainingToDays(profile.weeklyTraining) : 3
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
  if (program && program.sessions.length > 0) {
    const session = program.sessions[0]
    const totalExercises = session.blocks.reduce((sum, block) => sum + block.exercises.length, 0)
    
    // Determine primary focus from session blocks
    let primaryFocus = 'Strength and skill development'
    if (session.blocks.some(b => b.name.toLowerCase().includes('skill'))) {
      const skillBlock = session.blocks.find(b => b.name.toLowerCase().includes('skill'))
      primaryFocus = skillBlock?.name || 'Skill progression'
    } else if (session.blocks.some(b => b.name.toLowerCase().includes('pull'))) {
      primaryFocus = 'Pulling strength'
    } else if (session.blocks.some(b => b.name.toLowerCase().includes('push'))) {
      primaryFocus = 'Pushing strength'
    }
    
    firstSession = {
      title: session.name,
      estimatedMinutes: session.estimatedMinutes || 45,
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
}
