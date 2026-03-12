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
import { generateAdaptiveProgram, type AdaptiveProgramInputs, type AdaptiveProgram } from './adaptive-program-builder'
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
