// Athlete Calibration Engine
// Converts onboarding answers into internal athlete traits for smarter program generation
// These calibrations help SpartanLab generate more realistic, leverage-aware training

import type {
  OnboardingProfile,
  HeightRange,
  WeightRange,
  PullUpCapacity,
  PushUpCapacity,
  DipCapacity,
  LSitCapacity,
  TrainingTimeRange,
  WeeklyTrainingDays,
  OnboardingGoal,
} from './athlete-profile'
import { getOnboardingProfile } from './athlete-profile'

// =============================================================================
// CALIBRATION TYPES
// =============================================================================

export type LeverageProfile = 'compact' | 'average' | 'long_lever'
export type BodyMassProfile = 'light' | 'moderate' | 'heavy'
export type StrengthTier = 'very_low' | 'low' | 'moderate' | 'strong' | 'elite'
export type CoreCompressionTier = 'very_low' | 'low' | 'moderate' | 'strong'
export type SessionCapacity = 'short' | 'medium' | 'high'
export type ConsistencyCapacity = 'low' | 'moderate' | 'high'
export type EnduranceCompatibility = 'low' | 'moderate' | 'high'
export type FatigueSensitivity = 'high' | 'moderate' | 'low'
export type CompressionSkillReadiness = 'limited' | 'developing' | 'good'
export type FlexibilityGoal = 'pancake' | 'toe_touch' | 'front_splits' | 'side_splits' | 'none'

export interface AthleteCalibration {
  // Physical profile
  leverageProfile: LeverageProfile
  bodyMassProfile: BodyMassProfile
  
  // Strength tiers
  pullStrengthTier: StrengthTier
  pushStrengthTier: StrengthTier
  coreCompressionTier: CoreCompressionTier
  
  // Capacity
  sessionCapacity: SessionCapacity
  consistencyCapacity: ConsistencyCapacity
  enduranceCompatibility: EnduranceCompatibility
  fatigueSensitivity: FatigueSensitivity
  
  // Skill readiness
  compressionSkillReadiness: CompressionSkillReadiness
  lSitReadiness: 'not_ready' | 'building' | 'developing' | 'solid'
  vSitReadiness: 'not_ready' | 'early' | 'possible'
  
  // Flexibility goals
  flexibilityGoals: FlexibilityGoal[]
  
  // Flags for program generation
  needsMorePullStrength: boolean
  needsMorePushStrength: boolean
  needsCompressionWork: boolean
  canHandleEnduranceBlocks: boolean
  shouldConserveVolume: boolean
  hasFlexibilityGoals: boolean
  
  // Suggested adjustments
  suggestedProgressionLevel: 'very_conservative' | 'conservative' | 'standard' | 'aggressive'
  suggestedVolumeModifier: number // 0.7 to 1.2
  suggestedRestModifier: number // 0.8 to 1.3
  
  // Metadata
  calibrationComplete: boolean
  calibrationDate: string | null
}

// =============================================================================
// CALIBRATION RULES
// =============================================================================

// Height score: lower = shorter
function getHeightScore(height: HeightRange | null): number {
  if (!height) return 3
  const scores: Record<HeightRange, number> = {
    'under_5_4': 1,
    '5_4_to_5_7': 2,
    '5_7_to_5_10': 3,
    '5_10_to_6_1': 4,
    '6_1_to_6_4': 5,
    'over_6_4': 6,
  }
  return scores[height]
}

// Weight score: lower = lighter
function getWeightScore(weight: WeightRange | null): number {
  if (!weight) return 3
  const scores: Record<WeightRange, number> = {
    'under_140': 1,
    '140_160': 2,
    '160_180': 3,
    '180_200': 4,
    '200_220': 5,
    'over_220': 6,
  }
  return scores[weight]
}

// Infer leverage profile from height + weight
function inferLeverageProfile(height: HeightRange | null, weight: WeightRange | null): LeverageProfile {
  const heightScore = getHeightScore(height)
  const weightScore = getWeightScore(weight)
  
  // Compact: shorter + lighter
  if (heightScore <= 2 && weightScore <= 3) return 'compact'
  if (heightScore <= 3 && weightScore <= 2) return 'compact'
  
  // Long lever: taller + heavier
  if (heightScore >= 5 && weightScore >= 4) return 'long_lever'
  if (heightScore >= 4 && weightScore >= 5) return 'long_lever'
  if (heightScore >= 5) return 'long_lever' // Tall regardless of weight
  
  return 'average'
}

// Infer body mass profile from weight
function inferBodyMassProfile(weight: WeightRange | null): BodyMassProfile {
  const score = getWeightScore(weight)
  if (score <= 2) return 'light'
  if (score <= 4) return 'moderate'
  return 'heavy'
}

// Convert pull-up capacity to strength tier
function inferPullStrengthTier(pullups: PullUpCapacity | null): StrengthTier {
  if (!pullups) return 'low'
  const mapping: Record<PullUpCapacity, StrengthTier> = {
    '0_3': 'very_low',
    '4_7': 'low',
    '8_12': 'moderate',
    '13_17': 'strong',
    '18_22': 'strong',
    '23_plus': 'elite',
  }
  return mapping[pullups]
}

// Convert push-up capacity to strength tier
function inferPushUpStrengthTier(pushups: PushUpCapacity | null): StrengthTier {
  if (!pushups) return 'low'
  const mapping: Record<PushUpCapacity, StrengthTier> = {
    '0_10': 'very_low',
    '10_25': 'low',
    '25_40': 'moderate',
    '40_60': 'strong',
    '60_plus': 'elite',
  }
  return mapping[pushups]
}

// Convert dip capacity to strength tier
function inferDipStrengthTier(dips: DipCapacity | null): StrengthTier {
  if (!dips) return 'low'
  const mapping: Record<DipCapacity, StrengthTier> = {
    '0': 'very_low',
    '1_5': 'low',
    '6_10': 'low',
    '11_15': 'moderate',
    '16_20': 'strong',
    '21_25': 'strong',
    '25_plus': 'elite',
  }
  return mapping[dips]
}

// Combined push strength from push-ups and dips (takes the higher of the two)
function inferPushStrengthTier(pushups: PushUpCapacity | null, dips: DipCapacity | null): StrengthTier {
  const pushupTier = inferPushUpStrengthTier(pushups)
  const dipTier = inferDipStrengthTier(dips)
  
  const tierOrder: StrengthTier[] = ['very_low', 'low', 'moderate', 'strong', 'elite']
  const pushupIndex = tierOrder.indexOf(pushupTier)
  const dipIndex = tierOrder.indexOf(dipTier)
  
  // Return the better of the two
  return tierOrder[Math.max(pushupIndex, dipIndex)]
}

// Convert L-sit capacity to core compression tier
function inferCoreCompressionTier(lsit: LSitCapacity | null): CoreCompressionTier {
  if (!lsit) return 'low'
  const mapping: Record<LSitCapacity, CoreCompressionTier> = {
    'none': 'very_low',
    'under_10': 'low',
    '10_20': 'moderate',
    '20_plus': 'strong',
  }
  return mapping[lsit]
}

// Infer session capacity from training time
function inferSessionCapacity(time: TrainingTimeRange | null): SessionCapacity {
  if (!time) return 'medium'
  const mapping: Record<TrainingTimeRange, SessionCapacity> = {
    '10_20': 'short',
    '20_30': 'short',
    '30_45': 'medium',
    '45_60': 'high',
    '60_plus': 'high',
  }
  return mapping[time]
}

// Infer consistency capacity from weekly training
function inferConsistencyCapacity(weekly: WeeklyTrainingDays | null): ConsistencyCapacity {
  if (!weekly) return 'moderate'
  const mapping: Record<WeeklyTrainingDays, ConsistencyCapacity> = {
    '2': 'low',
    '3': 'moderate',
    '4': 'high',
    '5_plus': 'high',
  }
  return mapping[weekly]
}

// Infer endurance compatibility from goal + capacity
function inferEnduranceCompatibility(
  goal: OnboardingGoal | null,
  session: SessionCapacity,
  consistency: ConsistencyCapacity
): EnduranceCompatibility {
  // Endurance goal = high compatibility
  if (goal === 'endurance') return 'high'
  
  // Abs goal often involves circuits
  if (goal === 'abs' && session !== 'short') return 'high'
  
  // General fitness supports endurance
  if (goal === 'general' && session !== 'short') return 'moderate'
  
  // Short sessions = lower endurance compatibility
  if (session === 'short') return 'low'
  
  // Skill/strength focused goals are lower endurance compatibility by default
  if (goal === 'skill' || goal === 'strength') {
    return consistency === 'high' ? 'moderate' : 'low'
  }
  
  return 'moderate'
}

// Infer fatigue sensitivity
function inferFatigueSensitivity(
  bodyMass: BodyMassProfile,
  session: SessionCapacity,
  consistency: ConsistencyCapacity,
  pullTier: StrengthTier,
  pushTier: StrengthTier
): FatigueSensitivity {
  // Heavier athletes may accumulate fatigue faster in calisthenics
  if (bodyMass === 'heavy') {
    return session === 'short' || consistency === 'low' ? 'high' : 'moderate'
  }
  
  // Lower strength = higher fatigue sensitivity
  if (pullTier === 'very_low' || pushTier === 'very_low') return 'high'
  if (pullTier === 'low' && pushTier === 'low') return 'high'
  
  // High strength + high capacity = low fatigue sensitivity
  if ((pullTier === 'strong' || pullTier === 'elite') && 
      (pushTier === 'strong' || pushTier === 'elite') &&
      session === 'high') {
    return 'low'
  }
  
  return 'moderate'
}

// Infer compression skill readiness
function inferCompressionSkillReadiness(
  coreTier: CoreCompressionTier,
  leverage: LeverageProfile,
  bodyMass: BodyMassProfile
): CompressionSkillReadiness {
  // Strong core = good readiness regardless of leverage
  if (coreTier === 'strong') return 'good'
  
  // Long lever + heavy + weak core = limited
  if (leverage === 'long_lever' && bodyMass === 'heavy' && coreTier === 'very_low') {
    return 'limited'
  }
  
  // Moderate core = developing
  if (coreTier === 'moderate') return 'developing'
  
  // Compact leverage helps with compression
  if (leverage === 'compact' && coreTier === 'low') return 'developing'
  
  return 'limited'
}

// Infer L-sit readiness
function inferLSitReadiness(coreTier: CoreCompressionTier): 'not_ready' | 'building' | 'developing' | 'solid' {
  const mapping: Record<CoreCompressionTier, 'not_ready' | 'building' | 'developing' | 'solid'> = {
    'very_low': 'not_ready',
    'low': 'building',
    'moderate': 'developing',
    'strong': 'solid',
  }
  return mapping[coreTier]
}

// Infer V-sit readiness
function inferVSitReadiness(
  coreTier: CoreCompressionTier,
  compression: CompressionSkillReadiness
): 'not_ready' | 'early' | 'possible' {
  if (coreTier === 'strong' && compression === 'good') return 'possible'
  if (coreTier === 'moderate' && compression !== 'limited') return 'early'
  return 'not_ready'
}

// Suggest progression level based on calibration
function suggestProgressionLevel(
  leverage: LeverageProfile,
  bodyMass: BodyMassProfile,
  fatigue: FatigueSensitivity,
  pullTier: StrengthTier,
  pushTier: StrengthTier
): 'very_conservative' | 'conservative' | 'standard' | 'aggressive' {
  // Long lever + heavy = conservative
  if (leverage === 'long_lever' && bodyMass === 'heavy') return 'very_conservative'
  if (leverage === 'long_lever') return 'conservative'
  
  // High fatigue sensitivity = conservative
  if (fatigue === 'high') return 'conservative'
  
  // Elite strength + compact = can be aggressive
  if (pullTier === 'elite' && pushTier === 'elite' && leverage === 'compact') {
    return 'aggressive'
  }
  
  // Strong + low fatigue = standard-to-aggressive
  if ((pullTier === 'strong' || pullTier === 'elite') && fatigue === 'low') {
    return 'standard'
  }
  
  return 'standard'
}

// Suggest volume modifier
function suggestVolumeModifier(
  session: SessionCapacity,
  fatigue: FatigueSensitivity,
  bodyMass: BodyMassProfile
): number {
  let modifier = 1.0
  
  if (session === 'short') modifier -= 0.15
  if (session === 'high') modifier += 0.1
  
  if (fatigue === 'high') modifier -= 0.15
  if (fatigue === 'low') modifier += 0.1
  
  if (bodyMass === 'heavy') modifier -= 0.1
  
  return Math.max(0.7, Math.min(1.2, modifier))
}

// Suggest rest modifier (higher = more rest)
function suggestRestModifier(
  fatigue: FatigueSensitivity,
  bodyMass: BodyMassProfile,
  leverage: LeverageProfile
): number {
  let modifier = 1.0
  
  if (fatigue === 'high') modifier += 0.2
  if (fatigue === 'low') modifier -= 0.1
  
  if (bodyMass === 'heavy') modifier += 0.15
  if (leverage === 'long_lever') modifier += 0.1
  
  return Math.max(0.8, Math.min(1.3, modifier))
}

// =============================================================================
// MAIN CALIBRATION FUNCTION
// =============================================================================

export function calibrateAthleteProfile(profile: OnboardingProfile | null): AthleteCalibration {
  // Default calibration for missing data
  if (!profile) {
    return getDefaultCalibration()
  }
  
  // Infer traits
  const leverageProfile = inferLeverageProfile(profile.heightRange, profile.weightRange)
  const bodyMassProfile = inferBodyMassProfile(profile.weightRange)
  const pullStrengthTier = inferPullStrengthTier(profile.pullUpCapacity)
  const pushStrengthTier = inferPushStrengthTier(profile.pushUpCapacity, profile.dipCapacity)
  const coreCompressionTier = inferCoreCompressionTier(profile.lSitCapacity)
  const sessionCapacity = inferSessionCapacity(profile.trainingTime)
  const consistencyCapacity = inferConsistencyCapacity(profile.weeklyTraining)
  
  const enduranceCompatibility = inferEnduranceCompatibility(
    profile.primaryGoal,
    sessionCapacity,
    consistencyCapacity
  )
  
  const fatigueSensitivity = inferFatigueSensitivity(
    bodyMassProfile,
    sessionCapacity,
    consistencyCapacity,
    pullStrengthTier,
    pushStrengthTier
  )
  
  const compressionSkillReadiness = inferCompressionSkillReadiness(
    coreCompressionTier,
    leverageProfile,
    bodyMassProfile
  )
  
  const lSitReadiness = inferLSitReadiness(coreCompressionTier)
  const vSitReadiness = inferVSitReadiness(coreCompressionTier, compressionSkillReadiness)
  
  // Determine flags
  const needsMorePullStrength = pullStrengthTier === 'very_low' || pullStrengthTier === 'low'
  const needsMorePushStrength = pushStrengthTier === 'very_low' || pushStrengthTier === 'low'
  const needsCompressionWork = coreCompressionTier === 'very_low' || coreCompressionTier === 'low'
  const canHandleEnduranceBlocks = enduranceCompatibility !== 'low' && fatigueSensitivity !== 'high'
  const shouldConserveVolume = fatigueSensitivity === 'high' || sessionCapacity === 'short'
  
  // Suggest adjustments
  const suggestedProgressionLevel = suggestProgressionLevel(
    leverageProfile,
    bodyMassProfile,
    fatigueSensitivity,
    pullStrengthTier,
    pushStrengthTier
  )
  const suggestedVolumeModifier = suggestVolumeModifier(sessionCapacity, fatigueSensitivity, bodyMassProfile)
  const suggestedRestModifier = suggestRestModifier(fatigueSensitivity, bodyMassProfile, leverageProfile)
  
  return {
    leverageProfile,
    bodyMassProfile,
    pullStrengthTier,
    pushStrengthTier,
    coreCompressionTier,
    sessionCapacity,
    consistencyCapacity,
    enduranceCompatibility,
    fatigueSensitivity,
    compressionSkillReadiness,
    lSitReadiness,
    vSitReadiness,
    needsMorePullStrength,
    needsMorePushStrength,
    needsCompressionWork,
    canHandleEnduranceBlocks,
    shouldConserveVolume,
    flexibilityGoals: [],  // Will be set from onboarding when flexibility goals are added
    hasFlexibilityGoals: false,
    suggestedProgressionLevel,
    suggestedVolumeModifier,
    suggestedRestModifier,
    calibrationComplete: true,
    calibrationDate: new Date().toISOString(),
  }
}

// Default calibration when no profile exists
export function getDefaultCalibration(): AthleteCalibration {
  return {
    leverageProfile: 'average',
    bodyMassProfile: 'moderate',
    pullStrengthTier: 'moderate',
    pushStrengthTier: 'moderate',
    coreCompressionTier: 'low',
    sessionCapacity: 'medium',
    consistencyCapacity: 'moderate',
    enduranceCompatibility: 'moderate',
    fatigueSensitivity: 'moderate',
    compressionSkillReadiness: 'developing',
    lSitReadiness: 'building',
    vSitReadiness: 'not_ready',
    needsMorePullStrength: false,
    needsMorePushStrength: false,
needsCompressionWork: true,
  canHandleEnduranceBlocks: true,
  shouldConserveVolume: false,
  flexibilityGoals: [],
  hasFlexibilityGoals: false,
  suggestedProgressionLevel: 'standard',
    suggestedVolumeModifier: 1.0,
    suggestedRestModifier: 1.0,
    calibrationComplete: false,
    calibrationDate: null,
  }
}

// Get athlete calibration (uses stored profile)
export function getAthleteCalibration(): AthleteCalibration {
  const profile = getOnboardingProfile()
  return calibrateAthleteProfile(profile)
}

// =============================================================================
// COMPRESSION SKILL SUPPORT
// =============================================================================

export interface CompressionSkillGuidance {
  skill: 'l_sit' | 'v_sit' | 'i_sit'
  readiness: 'not_ready' | 'can_begin' | 'developing' | 'ready'
  prerequisitesMet: boolean
  focusAreas: string[]
  suggestedExercises: string[]
  warnings: string[]
}

export function getCompressionSkillGuidance(
  skill: 'l_sit' | 'v_sit' | 'i_sit',
  calibration: AthleteCalibration
): CompressionSkillGuidance {
  const { coreCompressionTier, compressionSkillReadiness, lSitReadiness, vSitReadiness } = calibration
  
  if (skill === 'l_sit') {
    return {
      skill: 'l_sit',
      readiness: lSitReadiness === 'solid' ? 'ready' : 
                 lSitReadiness === 'developing' ? 'developing' :
                 lSitReadiness === 'building' ? 'can_begin' : 'not_ready',
      prerequisitesMet: coreCompressionTier !== 'very_low',
      focusAreas: coreCompressionTier === 'very_low' 
        ? ['Core compression basics', 'Hip flexor activation', 'Scapula depression']
        : ['Hold time extension', 'Leg straightening', 'Shoulder stability'],
      suggestedExercises: coreCompressionTier === 'very_low'
        ? ['Tucked L-sit', 'Hanging knee raises', 'Compression pulses']
        : ['L-sit holds', 'Straddle L-sit', 'Elevated L-sit'],
      warnings: calibration.leverageProfile === 'long_lever' 
        ? ['Longer limbs require more compression strength - be patient']
        : [],
    }
  }
  
  if (skill === 'v_sit') {
    const isReady = vSitReadiness === 'possible'
    const canStart = vSitReadiness === 'early'
    
    return {
      skill: 'v_sit',
      readiness: isReady ? 'developing' : canStart ? 'can_begin' : 'not_ready',
      prerequisitesMet: lSitReadiness === 'solid' || lSitReadiness === 'developing',
      focusAreas: !canStart && !isReady
        ? ['Develop solid L-sit first', 'Build hip flexor strength', 'Improve pike flexibility']
        : ['V-sit compression', 'Leg lift control', 'Balance point'],
      suggestedExercises: !canStart && !isReady
        ? ['L-sit holds', 'Pike compression', 'Seated leg lifts']
        : ['V-sit attempts', 'V-sit negatives', 'Elevated V-sit practice'],
      warnings: lSitReadiness !== 'solid' 
        ? ['Build a solid L-sit before progressing to V-sit']
        : [],
    }
  }
  
  // I-sit (manna progression)
  return {
    skill: 'i_sit',
    readiness: 'not_ready',
    prerequisitesMet: vSitReadiness === 'possible' && coreCompressionTier === 'strong',
    focusAreas: ['Master V-sit first', 'Extreme hip flexion', 'Advanced compression'],
    suggestedExercises: ['V-sit holds', 'Manna progressions', 'Reverse plank leans'],
    warnings: vSitReadiness !== 'possible' 
      ? ['I-sit requires a solid V-sit foundation - focus there first']
      : ['I-sit is an advanced skill requiring exceptional compression'],
  }
}

// =============================================================================
// ENDURANCE FINISHER SUPPORT
// =============================================================================

export interface EnduranceFinisherGuidance {
  recommended: boolean
  type: 'density_block' | 'circuit' | 'ab_finisher' | 'none'
  duration: number // minutes
  intensity: 'light' | 'moderate' | 'challenging'
  reason: string
}

export function getEnduranceFinisherGuidance(
  calibration: AthleteCalibration,
  goal: OnboardingGoal | null,
  sessionMinutes: number
): EnduranceFinisherGuidance {
  const { canHandleEnduranceBlocks, enduranceCompatibility, fatigueSensitivity, sessionCapacity } = calibration
  
  // Short sessions = no finisher
  if (sessionMinutes < 25 || sessionCapacity === 'short') {
    return {
      recommended: false,
      type: 'none',
      duration: 0,
      intensity: 'light',
      reason: 'Session too short for finisher - focus on main work',
    }
  }
  
  // High fatigue sensitivity = skip or very light
  if (fatigueSensitivity === 'high' && !canHandleEnduranceBlocks) {
    return {
      recommended: false,
      type: 'none',
      duration: 0,
      intensity: 'light',
      reason: 'Rest and recovery prioritized over additional conditioning',
    }
  }
  
  // Abs goal = ab finisher
  if (goal === 'abs') {
    return {
      recommended: true,
      type: 'ab_finisher',
      duration: sessionMinutes >= 45 ? 6 : 4,
      intensity: fatigueSensitivity === 'high' ? 'light' : 'moderate',
      reason: 'Core-focused finisher aligned with your goal',
    }
  }
  
  // Endurance goal = density block
  if (goal === 'endurance') {
    return {
      recommended: true,
      type: 'density_block',
      duration: sessionMinutes >= 60 ? 8 : 6,
      intensity: fatigueSensitivity === 'low' ? 'challenging' : 'moderate',
      reason: 'Endurance density work supports your conditioning goal',
    }
  }
  
  // General fitness = circuit
  if (goal === 'general' && enduranceCompatibility !== 'low') {
    return {
      recommended: true,
      type: 'circuit',
      duration: 5,
      intensity: 'moderate',
      reason: 'General conditioning circuit for overall fitness',
    }
  }
  
  // Skill/strength goals = occasional light finisher if compatible
  if (canHandleEnduranceBlocks && sessionMinutes >= 45) {
    return {
      recommended: true,
      type: 'ab_finisher',
      duration: 4,
      intensity: 'light',
      reason: 'Light core finisher that supports skill development',
    }
  }
  
  return {
    recommended: false,
    type: 'none',
    duration: 0,
    intensity: 'light',
    reason: 'Focus on main skill/strength work',
  }
}

// =============================================================================
// PROGRAM CALIBRATION ADJUSTMENTS
// =============================================================================

export interface ProgramCalibrationAdjustments {
  adjustExerciseCount: number // +/- from default
  adjustSetsPerExercise: number // +/- from default
  adjustRestSeconds: number // +/- from default
  includeCompressionWork: boolean
  compressionExercises: string[]
  includeEnduranceFinisher: boolean
  finisherGuidance: EnduranceFinisherGuidance | null
  progressionNotes: string[]
  calibrationMessage: string // User-friendly message
}

export function getProgramCalibrationAdjustments(
  calibration: AthleteCalibration,
  goal: OnboardingGoal | null,
  sessionMinutes: number
): ProgramCalibrationAdjustments {
  const { 
    shouldConserveVolume,
    needsCompressionWork,
    suggestedVolumeModifier,
    suggestedRestModifier,
    suggestedProgressionLevel,
    leverageProfile,
    bodyMassProfile,
    compressionSkillReadiness,
    coreCompressionTier,
  } = calibration
  
  const finisherGuidance = getEnduranceFinisherGuidance(calibration, goal, sessionMinutes)
  
  // Calculate adjustments
  let exerciseAdj = 0
  let setsAdj = 0
  let restAdj = 0
  
  if (shouldConserveVolume) {
    exerciseAdj = -1
    setsAdj = -1
  } else if (suggestedVolumeModifier > 1.1) {
    exerciseAdj = 1
  }
  
  // Rest adjustments based on modifier
  if (suggestedRestModifier > 1.15) restAdj = 30
  else if (suggestedRestModifier > 1.05) restAdj = 15
  else if (suggestedRestModifier < 0.9) restAdj = -15
  
  // Compression exercises based on readiness
  const compressionExercises: string[] = []
  if (needsCompressionWork) {
    compressionExercises.push('Tucked L-sit holds')
    compressionExercises.push('Compression pulses')
  } else if (compressionSkillReadiness === 'developing') {
    compressionExercises.push('L-sit holds')
    compressionExercises.push('Straddle compression')
  } else if (compressionSkillReadiness === 'good') {
    compressionExercises.push('L-sit to V-sit attempts')
  }
  
  // Progression notes
  const progressionNotes: string[] = []
  
  if (suggestedProgressionLevel === 'very_conservative') {
    progressionNotes.push('Progressions are scaled conservatively for your body type')
  } else if (suggestedProgressionLevel === 'conservative') {
    progressionNotes.push('Skill progressions adjusted for leverage profile')
  }
  
  if (leverageProfile === 'long_lever') {
    progressionNotes.push('Longer limbs may require extra time on each progression')
  }
  
  if (bodyMassProfile === 'heavy' && (goal === 'skill' || !goal)) {
    progressionNotes.push('Bodyweight-to-strength ratio considered for skill work')
  }
  
  if (coreCompressionTier === 'very_low' || coreCompressionTier === 'low') {
    progressionNotes.push('Core compression work included to support skill development')
  }
  
  // User-friendly message
  let calibrationMessage = 'Built for your current strength and session availability.'
  
  if (calibration.calibrationComplete) {
    if (leverageProfile !== 'average' || bodyMassProfile !== 'moderate') {
      calibrationMessage = 'Your program reflects your body type and current capacity.'
    }
    if (needsCompressionWork) {
      calibrationMessage = 'Your program includes compression work to build your foundation.'
    }
  }
  
  return {
    adjustExerciseCount: exerciseAdj,
    adjustSetsPerExercise: setsAdj,
    adjustRestSeconds: restAdj,
    includeCompressionWork: needsCompressionWork || compressionSkillReadiness === 'developing',
    compressionExercises,
    includeEnduranceFinisher: finisherGuidance.recommended,
    finisherGuidance: finisherGuidance.recommended ? finisherGuidance : null,
    progressionNotes,
    calibrationMessage,
  }
}
