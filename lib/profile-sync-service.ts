// Profile Sync Service
// Ensures AthleteProfile stays in sync with OnboardingProfile
// Single source of truth for all athlete training data

import { getOnboardingProfile, isOnboardingComplete, type OnboardingProfile } from './athlete-profile'
import { saveAthleteProfile, getAthleteProfile, type AthleteProfile } from './data-service'
import type { AthleteProfile as DomainAthleteProfile } from '@/types/domain'

// =============================================================================
// ONBOARDING -> ATHLETE PROFILE MAPPING
// =============================================================================

/**
 * Maps comprehensive OnboardingProfile to the simplified AthleteProfile
 * Call this after onboarding completes to ensure data consistency
 */
export function mapOnboardingToAthleteProfile(onboarding: OnboardingProfile): Partial<AthleteProfile> {
  // Map training experience to experience level
  let experienceLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  if (onboarding.trainingExperience === 'new' || onboarding.trainingExperience === 'some') {
    experienceLevel = 'beginner'
  } else if (onboarding.trainingExperience === 'advanced') {
    experienceLevel = 'advanced'
  }
  
  // Map pull-up capacity to numeric max
  const pullUpMaxMap: Record<string, number | null> = {
    '0': 0,
    '1_3': 2,
    '4_7': 5,
    '8_12': 10,
    '13_17': 15,
    '18_22': 20,
    '23_plus': 25,
    'unknown': null,
  }
  
  // Map dip capacity to numeric max
  const dipMaxMap: Record<string, number | null> = {
    '0': 0,
    '1_5': 3,
    '6_10': 8,
    '11_15': 13,
    '16_20': 18,
    '21_25': 23,
    '25_plus': 30,
    'unknown': null,
  }
  
  // Map push-up capacity to numeric max
  const pushUpMaxMap: Record<string, number | null> = {
    '0_10': 5,
    '10_25': 17,
    '25_40': 32,
    '40_60': 50,
    '60_plus': 70,
    'unknown': null,
  }
  
  return {
    // Physical attributes
    sex: onboarding.sex ?? undefined,
    experienceLevel,
    trainingDaysPerWeek: typeof onboarding.trainingDaysPerWeek === 'number' 
      ? onboarding.trainingDaysPerWeek 
      : 4,
    sessionLengthMinutes: typeof onboarding.sessionLengthMinutes === 'number'
      ? onboarding.sessionLengthMinutes as 30 | 45 | 60 | 90
      : 60,
    
    // Goals
    primaryGoal: onboarding.selectedSkills?.[0] ?? onboarding.primaryGoal ?? null,
    
    // Equipment
    equipmentAvailable: onboarding.equipment?.filter((e): e is any => 
      ['pullup_bar', 'dip_bars', 'parallettes', 'rings', 'resistance_bands'].includes(e)
    ) ?? [],
    
    // Strength benchmarks (mapped to numeric values)
    pullUpMax: onboarding.pullUpMax ? pullUpMaxMap[onboarding.pullUpMax] ?? null : null,
    dipMax: onboarding.dipMax ? dipMaxMap[onboarding.dipMax] ?? null : null,
    
    // Joint cautions for protocol recommendations and exercise selection
    jointCautions: onboarding.jointCautions ?? [],
    
    // Weakest area for programming emphasis
    weakestArea: onboarding.weakestArea ?? null,
    
    // Meta
    onboardingComplete: true,
  }
}

/**
 * Sync onboarding data to AthleteProfile
 * Call this when onboarding completes or when user updates their profile
 */
export function syncOnboardingToProfile(): AthleteProfile | null {
  const onboarding = getOnboardingProfile()
  if (!onboarding || !isOnboardingComplete()) {
    return null
  }
  
  const profileData = mapOnboardingToAthleteProfile(onboarding)
  return saveAthleteProfile(profileData)
}

// =============================================================================
// PROFILE UPDATE HELPERS
// =============================================================================

/**
 * Update training schedule in AthleteProfile
 * Can be called from settings page
 */
export function updateTrainingSchedule(
  trainingDaysPerWeek: number,
  sessionLengthMinutes: 30 | 45 | 60 | 90
): AthleteProfile {
  return saveAthleteProfile({
    trainingDaysPerWeek,
    sessionLengthMinutes,
  })
}

/**
 * Update strength benchmarks in AthleteProfile
 * Can be called after workout logging or manual update
 */
export function updateStrengthBenchmarks(benchmarks: {
  pullUpMax?: number | null
  dipMax?: number | null
}): AthleteProfile {
  return saveAthleteProfile(benchmarks)
}

/**
 * Update primary goal in AthleteProfile
 */
export function updatePrimaryGoal(primaryGoal: string | null): AthleteProfile {
  return saveAthleteProfile({ primaryGoal })
}

/**
 * Update equipment availability
 */
export function updateEquipment(equipmentAvailable: AthleteProfile['equipmentAvailable']): AthleteProfile {
  return saveAthleteProfile({ equipmentAvailable })
}

// =============================================================================
// PROFILE CHANGE DETECTION
// =============================================================================

/**
 * Check if profile has changed significantly enough to warrant program regeneration
 */
export function hasSignificantProfileChange(
  previous: AthleteProfile,
  current: AthleteProfile
): boolean {
  // Training schedule changes
  if (previous.trainingDaysPerWeek !== current.trainingDaysPerWeek) return true
  if (previous.sessionLengthMinutes !== current.sessionLengthMinutes) return true
  
  // Goal changes
  if (previous.primaryGoal !== current.primaryGoal) return true
  
  // Experience level changes
  if (previous.experienceLevel !== current.experienceLevel) return true
  
  // Equipment changes (significant if core equipment added/removed)
  const coreEquipment = ['pullup_bar', 'dip_bars', 'rings']
  const prevCore = previous.equipmentAvailable?.filter(e => coreEquipment.includes(e)) ?? []
  const currCore = current.equipmentAvailable?.filter(e => coreEquipment.includes(e)) ?? []
  if (prevCore.length !== currCore.length || !prevCore.every(e => currCore.includes(e))) {
    return true
  }
  
  // Joint cautions changes (affects exercise selection)
  const prevJoints = previous.jointCautions ?? []
  const currJoints = current.jointCautions ?? []
  if (prevJoints.length !== currJoints.length || !prevJoints.every(j => currJoints.includes(j))) {
    return true
  }
  
  // Weakest area changes (affects programming emphasis)
  if (previous.weakestArea !== current.weakestArea) return true
  
  // Training style changes (affects programming methodology)
  const prevStyle = (previous as AthleteProfile & { trainingStyle?: string }).trainingStyle
  const currStyle = (current as AthleteProfile & { trainingStyle?: string }).trainingStyle
  if (prevStyle !== currStyle) return true
  
  return false
}

/**
 * Get a description of what changed for user messaging
 */
export function getProfileChangeDescription(
  previous: AthleteProfile,
  current: AthleteProfile
): string {
  const changes: string[] = []
  
  if (previous.trainingDaysPerWeek !== current.trainingDaysPerWeek) {
    changes.push('training frequency')
  }
  if (previous.sessionLengthMinutes !== current.sessionLengthMinutes) {
    changes.push('session length')
  }
  if (previous.primaryGoal !== current.primaryGoal) {
    changes.push('primary goal')
  }
  if (previous.experienceLevel !== current.experienceLevel) {
    changes.push('experience level')
  }
  
  // Check training style
  const prevStyle = (previous as AthleteProfile & { trainingStyle?: string }).trainingStyle
  const currStyle = (current as AthleteProfile & { trainingStyle?: string }).trainingStyle
  if (prevStyle !== currStyle) {
    changes.push('training style')
  }
  
  // Check equipment
  const coreEquipment = ['pullup_bar', 'dip_bars', 'rings']
  const prevCore = previous.equipmentAvailable?.filter(e => coreEquipment.includes(e)) ?? []
  const currCore = current.equipmentAvailable?.filter(e => coreEquipment.includes(e)) ?? []
  if (prevCore.length !== currCore.length || !prevCore.every(e => currCore.includes(e))) {
    changes.push('equipment')
  }
  
  // Check joint cautions
  const prevJoints = previous.jointCautions ?? []
  const currJoints = current.jointCautions ?? []
  if (prevJoints.length !== currJoints.length || !prevJoints.every(j => currJoints.includes(j))) {
    changes.push('joint cautions')
  }
  
  // Check weakest area
  if (previous.weakestArea !== current.weakestArea) {
    changes.push('focus area')
  }
  
  if (changes.length === 0) return ''
  if (changes.length === 1) return changes[0]
  if (changes.length === 2) return `${changes[0]} and ${changes[1]}`
  
  return `${changes.slice(0, -1).join(', ')}, and ${changes[changes.length - 1]}`
}

// =============================================================================
// CONSOLIDATED PROFILE ACCESS
// =============================================================================

/**
 * Get the unified athlete profile
 * Returns data from AthleteProfile, enriched with OnboardingProfile data if available
 */
export function getUnifiedProfile(): {
  athleteProfile: AthleteProfile
  onboardingProfile: OnboardingProfile | null
  isComplete: boolean
} {
  const athleteProfile = getAthleteProfile()
  const onboardingProfile = getOnboardingProfile()
  const isComplete = isOnboardingComplete()
  
  return {
    athleteProfile,
    onboardingProfile: isComplete ? onboardingProfile : null,
    isComplete,
  }
}

/**
 * Check if profile needs initial setup
 */
export function needsProfileSetup(): boolean {
  return !isOnboardingComplete()
}

/**
 * Get profile data optimized for program generation
 * Combines both profiles for comprehensive data
 */
export function getProfileForProgramGeneration() {
  const { athleteProfile, onboardingProfile } = getUnifiedProfile()
  
  return {
    // From AthleteProfile (simplified, authoritative)
    experienceLevel: athleteProfile.experienceLevel,
    trainingDaysPerWeek: athleteProfile.trainingDaysPerWeek,
    sessionLengthMinutes: athleteProfile.sessionLengthMinutes,
    primaryGoal: athleteProfile.primaryGoal,
    equipment: athleteProfile.equipmentAvailable,
    
    // From OnboardingProfile (detailed, supplementary)
    selectedSkills: onboardingProfile?.selectedSkills ?? [],
    strengthMetrics: {
      pullUpMax: onboardingProfile?.pullUpMax,
      dipMax: onboardingProfile?.dipMax,
      pushUpMax: onboardingProfile?.pushUpMax,
      weightedPullUp: onboardingProfile?.weightedPullUp,
      weightedDip: onboardingProfile?.weightedDip,
    },
    skillLevels: {
      frontLever: onboardingProfile?.frontLever?.progression,
      planche: onboardingProfile?.planche?.progression,
      muscleUp: onboardingProfile?.muscleUp,
      hspu: onboardingProfile?.hspu?.progression,
      lSit: onboardingProfile?.lSitHold,
      vSit: onboardingProfile?.vSitHold,
    },
    flexibilityMetrics: {
      pancake: onboardingProfile?.pancake?.level,
      toeTouch: onboardingProfile?.toeTouch?.level,
      frontSplits: onboardingProfile?.frontSplits?.level,
      sideSplits: onboardingProfile?.sideSplits?.level,
    },
    injuryFlags: onboardingProfile?.jointCautions ?? [],
    primaryLimitation: onboardingProfile?.primaryLimitation,
    weakestArea: onboardingProfile?.weakestArea,
  }
}
