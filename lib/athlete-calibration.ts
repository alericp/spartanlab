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
  LSitHoldCapacity,
  TrainingTimeRange,
  WeeklyTrainingDays,
  OnboardingGoal,
  PrimaryGoalType,
  ReadinessScores,
  SkillHistoryEntry,
  TendonAdaptationLevel,
  SkillGoal,
} from './athlete-profile'
import { getOnboardingProfile } from './athlete-profile'
import { getAthleteProfile, type AthleteProfile as DataServiceAthleteProfile } from './data-service'
import type { AthleteProfile } from '@/types/domain'

// Unified profile input type - accepts both OnboardingProfile and AthleteProfile
type CalibrationProfile = OnboardingProfile | AthleteProfile | null

// =============================================================================
// PROFILE TYPE CONVERSION HELPERS
// =============================================================================

// Map numeric height (in inches) to HeightRange
function mapHeightToRange(height: number | null): HeightRange | null {
  if (height === null) return null
  if (height < 64) return 'under_5_4'
  if (height < 67) return '5_4_to_5_7'
  if (height < 70) return '5_7_to_5_10'
  if (height < 73) return '5_10_to_6_1'
  if (height < 76) return '6_1_to_6_4'
  return 'over_6_4'
}

// Map numeric weight (in lbs) to WeightRange
function mapWeightToRange(weight: number | null): WeightRange | null {
  if (weight === null) return null
  if (weight < 140) return 'under_140'
  if (weight < 160) return '140_160'
  if (weight < 180) return '160_180'
  if (weight < 200) return '180_200'
  if (weight < 220) return '200_220'
  return 'over_220'
}

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
  
  // Readiness scores (from quick calibration questions)
  readinessScores: {
    strengthPotential: number      // 0-100
    skillAdaptation: number        // 0-100
    recoveryTolerance: number      // 0-100
    volumeTolerance: number        // 0-100
  } | null
  
  // Tendon adaptation scores (from skill training history)
  tendonAdaptation: {
    front_lever: TendonAdaptationLevel
    planche: TendonAdaptationLevel
    muscle_up: TendonAdaptationLevel
    handstand_pushup: TendonAdaptationLevel
    handstand: TendonAdaptationLevel
    l_sit: TendonAdaptationLevel
    v_sit: TendonAdaptationLevel
  } | null
  
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
// Handles both legacy and new property formats, plus "unknown" values
function inferPullStrengthTier(pullups: PullUpCapacity | null): StrengthTier {
  // Handle null or "unknown" - default to safe beginner estimate
  if (!pullups || pullups === 'unknown') return 'low'
  const mapping: Record<string, StrengthTier> = {
    // New format
    '0': 'very_low',
    '1_3': 'very_low',
    '4_7': 'low',
    '8_12': 'moderate',
    '13_17': 'strong',
    '18_22': 'strong',
    '23_plus': 'elite',
    // Legacy format
    '0_3': 'very_low',
  }
  return mapping[pullups] ?? 'low'
}

// Convert numeric pull-up count to strength tier (for AthleteProfile)
function inferPullStrengthTierFromNumber(pullups: number | null): StrengthTier {
  if (pullups === null || pullups === undefined) return 'low'
  if (pullups <= 3) return 'very_low'
  if (pullups <= 7) return 'low'
  if (pullups <= 12) return 'moderate'
  if (pullups <= 22) return 'strong'
  return 'elite'
}

// Convert numeric push-up/dip counts to strength tier (unified)
function inferPushStrengthTierUnified(
  pushups: number | PushUpCapacity | null,
  dips: number | DipCapacity | null
): StrengthTier {
  // Handle numeric values
  if (typeof pushups === 'number' || typeof dips === 'number') {
    const pushTier = typeof pushups === 'number' ? inferPushStrengthFromNumber(pushups) : 'low'
    const dipTier = typeof dips === 'number' ? inferDipStrengthFromNumber(dips) : 'low'
    return combineTiers(pushTier, dipTier)
  }
  // Handle string values
  return inferPushStrengthTier(pushups as PushUpCapacity | null, dips as DipCapacity | null)
}

function inferPushStrengthFromNumber(pushups: number | null): StrengthTier {
  if (pushups === null) return 'low'
  if (pushups <= 10) return 'very_low'
  if (pushups <= 25) return 'low'
  if (pushups <= 40) return 'moderate'
  if (pushups <= 60) return 'strong'
  return 'elite'
}

function inferDipStrengthFromNumber(dips: number | null): StrengthTier {
  if (dips === null) return 'low'
  if (dips === 0) return 'very_low'
  if (dips <= 5) return 'low'
  if (dips <= 15) return 'moderate'
  if (dips <= 25) return 'strong'
  return 'elite'
}

function combineTiers(a: StrengthTier, b: StrengthTier): StrengthTier {
  const tierOrder: StrengthTier[] = ['very_low', 'low', 'moderate', 'strong', 'elite']
  const aIdx = tierOrder.indexOf(a)
  const bIdx = tierOrder.indexOf(b)
  // Use the higher tier (optimistic)
  return tierOrder[Math.max(aIdx, bIdx)]
}

// Convert numeric L-sit hold seconds to core tier
function inferCoreTierFromSeconds(seconds: number | null): CoreCompressionTier {
  if (seconds === null || seconds === 0) return 'low'
  if (seconds < 10) return 'low'
  if (seconds < 20) return 'moderate'
  return 'strong'
}

// Convert push-up capacity to strength tier
function inferPushUpStrengthTier(pushups: PushUpCapacity | null): StrengthTier {
  // Handle null or "unknown" - default to safe beginner estimate
  if (!pushups || pushups === 'unknown') return 'low'
  const mapping: Record<string, StrengthTier> = {
    '0_10': 'very_low',
    '10_25': 'low',
    '25_40': 'moderate',
    '40_60': 'strong',
    '60_plus': 'elite',
  }
  return mapping[pushups] ?? 'low'
}

// Convert dip capacity to strength tier
function inferDipStrengthTier(dips: DipCapacity | null): StrengthTier {
  // Handle null or "unknown" - default to safe beginner estimate
  if (!dips || dips === 'unknown') return 'low'
  const mapping: Record<string, StrengthTier> = {
    '0': 'very_low',
    '1_5': 'low',
    '6_10': 'low',
    '11_15': 'moderate',
    '16_20': 'strong',
    '21_25': 'strong',
    '25_plus': 'elite',
  }
  return mapping[dips] ?? 'low'
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
// Handles both new LSitHoldCapacity and legacy LSitCapacity formats, plus "unknown"
function inferCoreCompressionTier(lsit: LSitCapacity | string | null): CoreCompressionTier {
  // Handle null or "unknown" - default to safe beginner estimate
  if (!lsit || lsit === 'unknown') return 'low'
  const mapping: Record<string, CoreCompressionTier> = {
    // New format (LSitHoldCapacity)
    'none': 'very_low',
    'under_10': 'low',
    '10_20': 'moderate',
    '20_30': 'moderate',
    '30_plus': 'strong',
    // Legacy format (LSitCapacity)
    '20_plus': 'strong',
  }
  return mapping[lsit] ?? 'low'
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

// Infer consistency capacity from weekly training (legacy string format)
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

// Infer session capacity from numeric minutes (new format)
function inferSessionCapacityFromMinutes(minutes: number | null): SessionCapacity | null {
  if (!minutes) return null
  if (minutes <= 30) return 'short'
  if (minutes <= 45) return 'medium'
  return 'high'
}

// Infer consistency capacity from numeric days (new format)
function inferConsistencyCapacityFromDays(days: number | null): ConsistencyCapacity | null {
  if (!days) return null
  if (days <= 2) return 'low'
  if (days <= 3) return 'moderate'
  return 'high'
}

// Infer endurance compatibility from goal + capacity
// Accepts both legacy OnboardingGoal and new PrimaryGoalType
function inferEnduranceCompatibility(
  goal: OnboardingGoal | PrimaryGoalType | null,
  session: SessionCapacity,
  consistency: ConsistencyCapacity
): EnduranceCompatibility {
  // Handle both legacy OnboardingGoal and new PrimaryGoalType formats
  // Endurance goal = high compatibility
  if (goal === 'endurance') return 'high'
  
  // Abs goal often involves circuits (legacy)
  if (goal === 'abs' && session !== 'short') return 'high'
  
  // General fitness / overall_fitness supports endurance
  if ((goal === 'general' || goal === 'overall_fitness') && session !== 'short') return 'moderate'
  
  // Short sessions = lower endurance compatibility
  if (session === 'short') return 'low'
  
  // Skill/strength/muscle_and_strength focused goals are lower endurance compatibility by default
  if (goal === 'skill' || goal === 'strength' || goal === 'muscle_and_strength' || goal === 'skills_and_moves') {
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

export function calibrateAthleteProfile(profile: CalibrationProfile): AthleteCalibration {
  // Default calibration for missing data
  if (!profile) {
    return getDefaultCalibration()
  }
  
  // Detect profile type and extract values accordingly
  // AthleteProfile uses numeric values, OnboardingProfile uses string ranges
  const isAthleteProfile = 'userId' in profile && typeof (profile as AthleteProfile).pullUpMax === 'number'
  
  // Extract height/weight info
  const heightRange = isAthleteProfile 
    ? mapHeightToRange((profile as AthleteProfile).height) 
    : (profile as OnboardingProfile).heightRange
  const weightRange = isAthleteProfile
    ? mapWeightToRange((profile as AthleteProfile).bodyweight)
    : (profile as OnboardingProfile).weightRange
  
  // Extract strength benchmarks
  const pullUpValue = isAthleteProfile
    ? (profile as AthleteProfile).pullUpMax
    : (profile as OnboardingProfile).pullUpMax
  const pushUpValue = isAthleteProfile
    ? (profile as AthleteProfile).pushUpMax
    : (profile as OnboardingProfile).pushUpMax
  const dipValue = isAthleteProfile
    ? (profile as AthleteProfile).dipMax
    : (profile as OnboardingProfile).dipMax
  const lSitValue = isAthleteProfile
    ? (profile as AthleteProfile).lSitHoldSeconds
    : (profile as OnboardingProfile).lSitHold
  
  // Extract training schedule
  const daysPerWeek = typeof profile.trainingDaysPerWeek === 'number' 
    ? profile.trainingDaysPerWeek 
    : null
  const sessionMinutes = typeof profile.sessionLengthMinutes === 'number'
    ? profile.sessionLengthMinutes
    : null
  
  // Infer traits
  const leverageProfile = inferLeverageProfile(heightRange, weightRange)
  const bodyMassProfile = inferBodyMassProfile(weightRange)
  
  // Infer strength tiers based on value type
  const pullStrengthTier = typeof pullUpValue === 'number'
    ? inferPullStrengthTierFromNumber(pullUpValue)
    : inferPullStrengthTier(pullUpValue as PullUpCapacity | null)
  const pushStrengthTier = inferPushStrengthTierUnified(pushUpValue, dipValue)
  const coreCompressionTier = typeof lSitValue === 'number'
    ? inferCoreTierFromSeconds(lSitValue)
    : inferCoreCompressionTier(lSitValue as LSitCapacity | string | null)
  
  // Infer session/training capacity with defaults
  const sessionCapacity = inferSessionCapacityFromMinutes(sessionMinutes) ?? 'medium'
  const consistencyCapacity = inferConsistencyCapacityFromDays(daysPerWeek) ?? 'moderate'
  
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
  
  // Extract readiness scores from onboarding profile (if available)
  const readinessScores = !isAthleteProfile && (profile as OnboardingProfile).readinessCalibration?.scores
    ? {
        strengthPotential: (profile as OnboardingProfile).readinessCalibration!.scores!.strengthPotentialScore,
        skillAdaptation: (profile as OnboardingProfile).readinessCalibration!.scores!.skillAdaptationScore,
        recoveryTolerance: (profile as OnboardingProfile).readinessCalibration!.scores!.recoveryToleranceScore,
        volumeTolerance: (profile as OnboardingProfile).readinessCalibration!.scores!.volumeToleranceScore,
      }
    : null

  // Extract tendon adaptation from skill history (if available)
  const skillHistory = !isAthleteProfile ? (profile as OnboardingProfile).skillHistory : null
  const tendonAdaptation = skillHistory ? {
    front_lever: skillHistory.front_lever?.tendonAdaptationScore ?? 'low' as TendonAdaptationLevel,
    planche: skillHistory.planche?.tendonAdaptationScore ?? 'low' as TendonAdaptationLevel,
    muscle_up: skillHistory.muscle_up?.tendonAdaptationScore ?? 'low' as TendonAdaptationLevel,
    handstand_pushup: skillHistory.handstand_pushup?.tendonAdaptationScore ?? 'low' as TendonAdaptationLevel,
    handstand: skillHistory.handstand?.tendonAdaptationScore ?? 'low' as TendonAdaptationLevel,
    l_sit: skillHistory.l_sit?.tendonAdaptationScore ?? 'low' as TendonAdaptationLevel,
    v_sit: skillHistory.v_sit?.tendonAdaptationScore ?? 'low' as TendonAdaptationLevel,
  } : null

  // Suggest adjustments (enhanced with readiness scores)
  let suggestedProgressionLevel = suggestProgressionLevel(
    leverageProfile,
    bodyMassProfile,
    fatigueSensitivity,
    pullStrengthTier,
    pushStrengthTier
  )
  
  // Adjust progression based on readiness scores if available
  if (readinessScores) {
    // High skill adaptation = can progress faster on skills
    if (readinessScores.skillAdaptation >= 70 && suggestedProgressionLevel === 'conservative') {
      suggestedProgressionLevel = 'standard'
    }
    // Low recovery tolerance = be more conservative
    if (readinessScores.recoveryTolerance < 40 && suggestedProgressionLevel !== 'very_conservative') {
      suggestedProgressionLevel = suggestedProgressionLevel === 'aggressive' ? 'standard' : 'conservative'
    }
  }

  let suggestedVolumeModifier = suggestVolumeModifier(sessionCapacity, fatigueSensitivity, bodyMassProfile)
  let suggestedRestModifier = suggestRestModifier(fatigueSensitivity, bodyMassProfile, leverageProfile)
  
  // Adjust volume/rest based on readiness scores
  if (readinessScores) {
    // Volume tolerance affects how much total work they can handle
    if (readinessScores.volumeTolerance >= 70) {
      suggestedVolumeModifier = Math.min(1.2, suggestedVolumeModifier + 0.1)
    } else if (readinessScores.volumeTolerance < 40) {
      suggestedVolumeModifier = Math.max(0.7, suggestedVolumeModifier - 0.15)
    }
    
    // Recovery tolerance affects rest periods
    if (readinessScores.recoveryTolerance >= 70) {
      suggestedRestModifier = Math.max(0.8, suggestedRestModifier - 0.1)
    } else if (readinessScores.recoveryTolerance < 40) {
      suggestedRestModifier = Math.min(1.3, suggestedRestModifier + 0.15)
    }
  }
  
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
    readinessScores,
    tendonAdaptation,
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
    readinessScores: null,
    tendonAdaptation: null,
    calibrationComplete: false,
    calibrationDate: null,
  }
}

// Get athlete calibration (uses stored profile)
// Tries AthleteProfile first (from TrainingSetup), falls back to OnboardingProfile
export function getAthleteCalibration(): AthleteCalibration {
  // First try the main athlete profile (from profile-repository)
  const athleteProfile = getAthleteProfile()
  if (athleteProfile && athleteProfile.onboardingComplete) {
    return calibrateAthleteProfile(athleteProfile)
  }
  
  // Fall back to onboarding profile (legacy)
  const onboardingProfile = getOnboardingProfile()
  return calibrateAthleteProfile(onboardingProfile)
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

// =============================================================================
// TENDON ADAPTATION HELPERS
// =============================================================================

export interface SkillStartingPoint {
  progressionTier: 'foundation' | 'beginner' | 'intermediate' | 'advanced'
  intensityModifier: number     // 0.7 to 1.1
  volumeModifier: number        // 0.6 to 1.0
  progressionSpeedModifier: number // 0.7 to 1.2
}

/**
 * Get the recommended starting point for a skill based on tendon adaptation.
 * 
 * TENDON LEVEL → STARTING POINT MAPPING:
 * | Tendon Level  | Progression Tier | Intensity | Volume | Speed |
 * |---------------|------------------|-----------|--------|-------|
 * | low           | foundation       | 0.75      | 0.65   | 0.75  |
 * | low_moderate  | foundation+      | 0.82      | 0.75   | 0.9   |
 * | moderate      | beginner         | 0.88      | 0.82   | 1.0   |
 * | moderate_high | beginner+        | 0.94      | 0.88   | 1.1   |
 * | high          | intermediate     | 1.0       | 0.92   | 1.15  |
 * 
 * SAFETY: This must be further constrained by current strength metrics.
 */
export function getSkillStartingPoint(
  tendonLevel: TendonAdaptationLevel,
  currentStrengthTier: StrengthTier,
  readinessScores: { recoveryTolerance: number; skillAdaptation: number } | null
): SkillStartingPoint {
  // Base starting point from tendon adaptation (5-tier system)
  let baseResult: SkillStartingPoint
  
  switch (tendonLevel) {
    case 'low':
      // No adaptation - pure foundation work
      baseResult = {
        progressionTier: 'foundation',
        intensityModifier: 0.75,
        volumeModifier: 0.65,
        progressionSpeedModifier: 0.75,
      }
      break
    case 'low_moderate':
      // Some retained familiarity - foundation with faster ramp
      baseResult = {
        progressionTier: 'foundation',
        intensityModifier: 0.82,
        volumeModifier: 0.75,
        progressionSpeedModifier: 0.9,
      }
      break
    case 'moderate':
      // Solid base - standard beginner progression
      baseResult = {
        progressionTier: 'beginner',
        intensityModifier: 0.88,
        volumeModifier: 0.82,
        progressionSpeedModifier: 1.0,
      }
      break
    case 'moderate_high':
      // Strong base - beginner with accelerated path
      baseResult = {
        progressionTier: 'beginner',
        intensityModifier: 0.94,
        volumeModifier: 0.88,
        progressionSpeedModifier: 1.1,
      }
      break
    case 'high':
      // Recently strong - can enter intermediate (if strength allows)
      baseResult = {
        progressionTier: 'intermediate',
        intensityModifier: 1.0,
        volumeModifier: 0.92,
        progressionSpeedModifier: 1.15,
      }
      break
  }
  
  // SAFETY CONSTRAINT: Never exceed what current strength allows
  // Even with high tendon adaptation, low strength caps the progression tier
  const strengthCap = getStrengthBasedCap(currentStrengthTier)
  const tierOrder = ['foundation', 'beginner', 'intermediate', 'advanced'] as const
  const baseTierIdx = tierOrder.indexOf(baseResult.progressionTier)
  const capTierIdx = tierOrder.indexOf(strengthCap)
  
  if (baseTierIdx > capTierIdx) {
    baseResult.progressionTier = strengthCap
    // Reduce intensity when capped by strength
    baseResult.intensityModifier = Math.min(baseResult.intensityModifier, 0.82)
    // Also slow progression when strength-limited
    baseResult.progressionSpeedModifier = Math.min(baseResult.progressionSpeedModifier, 0.95)
  }
  
  // Adjust based on readiness scores if available
  if (readinessScores) {
    // Low recovery tolerance = reduce volume and intensity
    if (readinessScores.recoveryTolerance < 40) {
      baseResult.volumeModifier *= 0.85
      baseResult.intensityModifier *= 0.9
    }
    
    // High skill adaptation = can progress slightly faster
    if (readinessScores.skillAdaptation >= 70) {
      baseResult.progressionSpeedModifier = Math.min(1.2, baseResult.progressionSpeedModifier * 1.05)
    }
  }
  
  return baseResult
}

/**
 * Get the maximum progression tier allowed by current strength.
 * This is a hard cap that tendon adaptation cannot exceed.
 */
function getStrengthBasedCap(strengthTier: StrengthTier): 'foundation' | 'beginner' | 'intermediate' | 'advanced' {
  switch (strengthTier) {
    case 'very_low':
      return 'foundation'
    case 'low':
      return 'beginner'
    case 'moderate':
      return 'intermediate'
    case 'strong':
    case 'elite':
      return 'advanced'
  }
}

/**
 * Check if an athlete has meaningful tendon adaptation for any skill.
 * Useful for determining if skill history should influence programming.
 * Returns true if any skill has at least low_moderate adaptation.
 */
export function hasAnyTendonAdaptation(calibration: AthleteCalibration): boolean {
  if (!calibration.tendonAdaptation) return false
  
  const scores = Object.values(calibration.tendonAdaptation)
  return scores.some(level => 
    level === 'low_moderate' || 
    level === 'moderate' || 
    level === 'moderate_high' || 
    level === 'high'
  )
}
