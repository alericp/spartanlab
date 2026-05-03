/**
 * Prediction Service
 * 
 * Service layer that integrates the unified prediction engine with
 * existing data services. This is the recommended way to generate
 * predictions in the application.
 */

import { getAthleteProfile, getSkillProgressions } from '../data-service'
import { getPersonalRecords } from '../strength-service'
import { calculateTrainingMomentum } from '../training-momentum-engine'
import { analyzeFatigue, type FatigueIndicators } from '../fatigue-engine'
import { getSkillSessions } from '../skill-session-service'
import { getStrengthRecords } from '../strength-service'
import { getOnboardingProfile } from '../athlete-profile'
import { analyzeWeakPoints, type WeakPointAssessment } from '../weak-point-priority-engine'
import {
  generateUnifiedPrediction,
  generateBatchPredictions,
  SKILL_DIFFICULTY_CONFIG,
  type SkillId,
  type UnifiedSkillPrediction,
  type PredictionInputs,
  type BatchPredictionResult,
} from './skill-progress-prediction-engine'
import {
  normalizeStrengthSupport,
  normalizeConsistencyLevel,
  normalizeTendonLevel,
} from './prediction-normalizers'

// =============================================================================
// SKILL TO EXERCISE MAPPING
// =============================================================================

const SKILL_TO_STRENGTH_EXERCISE: Record<string, 'weighted_pull_up' | 'weighted_dip'> = {
  front_lever: 'weighted_pull_up',
  back_lever: 'weighted_pull_up',
  muscle_up: 'weighted_pull_up',
  one_arm_pull_up: 'weighted_pull_up',
  planche: 'weighted_dip',
  handstand_pushup: 'weighted_dip',
  iron_cross: 'weighted_dip',
  weighted_pull_up: 'weighted_pull_up',
  weighted_dip: 'weighted_dip',
}

// =============================================================================
// MAIN SERVICE FUNCTIONS
// =============================================================================

/**
 * Get a prediction for a single skill
 */
export function getSkillPrediction(skillId: SkillId): UnifiedSkillPrediction {
  const inputs = gatherPredictionInputs(skillId)
  return generateUnifiedPrediction(inputs)
}

/**
 * Get predictions for all active skills
 */
export function getAllSkillPredictions(): BatchPredictionResult {
  const profile = getAthleteProfile()
  const progressions = getSkillProgressions()
  
  // Get active skill IDs from progressions + primary goals
  const activeSkillIds = new Set<SkillId>()
  
  // Add skills with existing progressions
  progressions.forEach(p => {
    if (SKILL_DIFFICULTY_CONFIG[p.skillName]) {
      activeSkillIds.add(p.skillName as SkillId)
    }
  })
  
  // [PREDICTION-SERVICE-CANONICAL-FIELD] Iterate over canonical
  // onboarding skill targets. The previous `primaryGoals` field never
  // existed on `OnboardingProfile`; the canonical skill-target collection
  // is `selectedSkills: SkillGoal[]` (declared on OnboardingProfile in
  // `lib/athlete-profile.ts`). The singular `primaryGoal` is a *single*
  // overall goal type, not a per-skill list — using it here would be
  // wrong both type-wise and semantically. Iterating `selectedSkills`
  // matches the prior intent: surface skill IDs the athlete actively
  // selected as goals so prediction can compute skill-specific outlooks.
  const onboarding = getOnboardingProfile()
  if (onboarding?.selectedSkills) {
    onboarding.selectedSkills.forEach(goal => {
      if (SKILL_DIFFICULTY_CONFIG[goal as SkillId]) {
        activeSkillIds.add(goal as SkillId)
      }
    })
  }
  
  // If no active skills, use defaults
  if (activeSkillIds.size === 0) {
    activeSkillIds.add('front_lever')
    activeSkillIds.add('planche')
    activeSkillIds.add('muscle_up')
    activeSkillIds.add('handstand_pushup')
  }
  
  return generateBatchPredictions(
    Array.from(activeSkillIds),
    (skillId) => gatherPredictionInputs(skillId)
  )
}

/**
 * Get predictions for specific skills
 */
export function getSpecificSkillPredictions(skillIds: SkillId[]): BatchPredictionResult {
  return generateBatchPredictions(
    skillIds,
    (skillId) => gatherPredictionInputs(skillId)
  )
}

/**
 * Get a quick summary for dashboard display
 */
export function getDashboardPredictionSummary(): {
  skills: Array<{
    skillId: string
    skillName: string
    currentLevel: string
    nextLevel: string | null
    timeEstimate: string | null
    readiness: number
    status: 'achieved' | 'on_track' | 'building' | 'needs_data'
  }>
  topLimiter: string | null
  overallReadiness: string
} {
  const batch = getAllSkillPredictions()
  
  const skills = Object.values(batch.predictions).map(p => ({
    skillId: p.skillId,
    skillName: p.skillName,
    currentLevel: p.currentStage.name,
    nextLevel: p.nextStage?.name || null,
    timeEstimate: p.estimatedTimeToNextStage?.displayLabel || null,
    readiness: p.readinessScore,
    status: getStatus(p),
  }))
  
  return {
    skills,
    topLimiter: batch.globalInsights.primaryLimiterPattern 
      ? LIMITER_DISPLAY_NAMES[batch.globalInsights.primaryLimiterPattern] 
      : null,
    overallReadiness: batch.globalInsights.overallReadiness,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function gatherPredictionInputs(skillId: SkillId): PredictionInputs {
  const profile = getAthleteProfile()
  const progressions = getSkillProgressions()
  const personalRecords = getPersonalRecords()
  const momentum = calculateTrainingMomentum()
  const sessions = getSkillSessions()
  const strengthRecords = getStrengthRecords()
  const onboarding = getOnboardingProfile()
  
  // Try to get fatigue indicators (may not be available)
  let fatigue: FatigueIndicators | null = null
  try {
    fatigue = analyzeFatigue()
  } catch {
    // Fatigue data not available
  }
  
  // Try to get weak points (may not be available)
  // REGRESSION GUARD: Fallbacks here are for prediction display only, not generation truth
  // These || fallbacks are acceptable since this is a read-only analysis path
  let weakPointsList: WeakPointAssessment[] | null = null
  try {
    const wpResult = analyzeWeakPoints({
      experienceLevel: profile.experienceLevel as any || 'intermediate',
      primaryOutcome: onboarding?.primaryOutcome || 'skill_mastery',
      // [PREDICTION-SERVICE-CANONICAL-FIELD] `skillGoals` parameter
      // accepts the athlete's chosen skill targets. Canonical
      // OnboardingProfile field is `selectedSkills`; `primaryGoals`
      // never existed.
      skillGoals: onboarding?.selectedSkills,
      trainingDaysPerWeek: profile.trainingDaysPerWeek || 3,  // Prediction display fallback
      sessionLengthMinutes: profile.sessionLengthMinutes || 60,  // Prediction display fallback
      pullUpMax: profile.pullUpMax,
      pushUpMax: profile.pushUpMax,
      dipMax: profile.dipMax,
      lSitHoldSeconds: profile.lSitHoldSeconds,
      currentPlancheLevel: profile.plancheLevel,
      currentFrontLeverLevel: profile.frontLeverLevel,
      currentMuscleUpCapable: profile.hasMuscleUp,
      hasRings: profile.hasRings,
      hasWeights: profile.hasWeights,
      hasPullUpBar: profile.hasPullUpBar,
      hasShoulderIssues: profile.hasShoulderIssues,
      hasElbowIssues: profile.hasElbowIssues,
      hasWristIssues: profile.hasWristIssues,
    })
    weakPointsList = wpResult.weakPoints
  } catch {
    // Weak point data not available
  }
  
  // Find current level for this skill
  const skillProgression = progressions.find(p => p.skillName === skillId)
  const currentLevel = skillProgression?.currentLevel ?? 0
  
  // Count skill-specific sessions
  const skillSessions = sessions.filter(s => s.skillName === skillId)
  const sessionCount = skillSessions.length
  
  // Get relevant strength data
  const strengthExercise = SKILL_TO_STRENGTH_EXERCISE[skillId]
  const relevantStrengthRecord = strengthExercise 
    ? personalRecords[strengthExercise] 
    : null
  const relevantStrength1RM = relevantStrengthRecord?.estimatedOneRM ?? null
  
  // Get strength threshold for current level
  const config = SKILL_DIFFICULTY_CONFIG[skillId]
  const requiredThreshold = config?.strengthThresholdsPerLevel?.[currentLevel] ?? 30
  
  // Normalize strength support
  const strengthSupport = normalizeStrengthSupport(
    relevantStrength1RM,
    profile.bodyweight,
    requiredThreshold
  )
  
  // Normalize consistency
  const consistencyLevel = normalizeConsistencyLevel(momentum)
  
  // Get tendon level from onboarding
  const tendonLevel = normalizeTendonLevel(onboarding?.tendonAdaptationLevel)
  
  return {
    skillId,
    currentLevel,
    experienceLevel: profile.experienceLevel || 'intermediate',
    trainingDaysPerWeek: profile.trainingDaysPerWeek || 3,
    bodyweight: profile.bodyweight,
    sessionCount,
    strengthRecordCount: strengthRecords.length,
    strengthSupport,
    momentum,
    fatigue,
    weakPoints: weakPointsList,
    tendonLevel,
    consistencyLevel,
    relevantStrength1RM,
  }
}

function getStatus(
  prediction: UnifiedSkillPrediction
): 'achieved' | 'on_track' | 'building' | 'needs_data' {
  if (prediction.currentStage.level >= prediction.longTermTarget.level) {
    return 'achieved'
  }
  if (prediction.dataQuality === 'insufficient') {
    return 'needs_data'
  }
  if (prediction.readinessScore >= 70) {
    return 'on_track'
  }
  return 'building'
}

const LIMITER_DISPLAY_NAMES: Record<string, string> = {
  pulling_strength: 'Pulling Strength',
  pushing_strength: 'Pushing Strength',
  straight_arm_tolerance: 'Straight-Arm Strength',
  tendon_conditioning: 'Tendon Conditioning',
  shoulder_mobility: 'Shoulder Mobility',
  scapular_control: 'Scapular Control',
  core_compression: 'Core Compression',
  bodyline_control: 'Bodyline Control',
  grip_strength: 'Grip Strength',
  explosive_power: 'Explosive Power',
  skill_density: 'Skill Practice',
  consistency: 'Training Consistency',
  recovery_fatigue: 'Recovery',
  leverage_bodyweight: 'Leverage / Bodyweight',
  ring_stability: 'Ring Stability',
  none: 'None',
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  gatherPredictionInputs,
}
