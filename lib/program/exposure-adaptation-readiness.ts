/**
 * EXPOSURE / ADAPTATION READINESS ENGINE
 * 
 * =============================================================================
 * DOCTRINE: ADAPTATION RUNWAY GATES PROGRESSION
 * =============================================================================
 * 
 * This layer enforces a critical distinction:
 * - "Can perform it now" (current response) 
 * - "Has earned it" (accumulated exposure)
 * - "Is adapted enough to progress it repeatedly" (adaptation readiness)
 * 
 * PRIORITY RULE:
 * ADAPTATION / EXPOSURE READINESS can CAP current-performance optimism.
 * 
 * Meaning:
 * - Current good response does NOT automatically unlock deeper progression
 * - Historical ceiling does NOT unlock progression
 * - Recent good completion does NOT automatically allow dense methods
 * - If exposure/adaptation runway is low, progression/method/load must stay capped
 */

import type { ProgrammingTruthBundle, TruthConfidence } from './programming-truth-bundle-contract'
import type { SkillFamily, SkillFamilyTruth } from './skill-specific-truth-resolution'
import { resolveSkillFamilyTruth, mapSkillToFamily } from './skill-specific-truth-resolution'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Exposure level - how much accumulated work the athlete has done
 */
export type ExposureLevel = 'none' | 'low' | 'moderate' | 'high'

/**
 * Adaptation readiness - tissue/neurological preparedness
 */
export type AdaptationReadiness = 'unready' | 'building' | 'ready' | 'highly_ready'

/**
 * Permission levels for various training decisions
 */
export type ProgressionPermission = 'block' | 'hold' | 'allow_small_step' | 'allow_full_step'
export type DensityPermission = 'reduce' | 'maintain' | 'allow_increase'
export type LoadPermission = 'soften' | 'maintain' | 'push'
export type MethodPermission = 'straight_sets_only' | 'light_grouping_ok' | 'full_method_ok'
export type AdvancedVariantPermission = 'blocked' | 'cautious' | 'allowed'

/**
 * Family-specific readiness contract
 */
export interface FamilyReadinessContract {
  family: SkillFamily
  
  // Exposure assessment
  recentExposureLevel: ExposureLevel
  exposureWeeksCount: number | null  // Estimated weeks with this family
  exposureSessionsCount: number | null  // Estimated sessions with this family
  
  // Adaptation assessment
  adaptationReadiness: AdaptationReadiness
  adaptationScore: number  // 0-100 normalized
  
  // Permission gates
  progressionPermission: ProgressionPermission
  densityPermission: DensityPermission
  loadPermission: LoadPermission
  methodPermission: MethodPermission
  advancedVariantPermission: AdvancedVariantPermission
  
  // Meta
  readinessReason: string
  readinessConfidence: TruthConfidence
  currentResponseSignal: 'good' | 'moderate' | 'poor' | 'unknown'
  cappedDueToReadiness: boolean
}

/**
 * Advanced family classification
 */
const ADVANCED_FAMILIES: SkillFamily[] = [
  'front_lever',
  'back_lever',
  'planche',
  'hspu',
  'muscle_up',
  'rings_strength',
]

const WEIGHTED_FAMILIES: SkillFamily[] = [
  'weighted_pull',
  'weighted_dip',
]

// =============================================================================
// MAIN RESOLUTION FUNCTION
// =============================================================================

/**
 * Resolve exposure/adaptation readiness for a skill family
 * 
 * Uses available bundle truth to estimate:
 * 1. How much exposure the athlete has accumulated
 * 2. Whether they are adapted enough to progress
 * 3. Permission levels for progression/density/load/methods
 */
export function resolveExposureReadiness(
  bundle: ProgrammingTruthBundle | null,
  skill: string
): FamilyReadinessContract {
  const family = mapSkillToFamily(skill)
  const skillTruth = resolveSkillFamilyTruth(bundle, skill)
  
  // Default contract - conservative when no data
  const defaultContract: FamilyReadinessContract = {
    family,
    recentExposureLevel: 'none',
    exposureWeeksCount: null,
    exposureSessionsCount: null,
    adaptationReadiness: 'unready',
    adaptationScore: 0,
    progressionPermission: 'hold',
    densityPermission: 'maintain',
    loadPermission: 'maintain',
    methodPermission: 'straight_sets_only',
    advancedVariantPermission: 'cautious',
    readinessReason: 'no_exposure_data_available',
    readinessConfidence: 'none',
    currentResponseSignal: 'unknown',
    cappedDueToReadiness: false,
  }
  
  if (!bundle) {
    return defaultContract
  }
  
  const contract: FamilyReadinessContract = { ...defaultContract }
  
  // 1. EXTRACT EXPOSURE SIGNALS FROM BUNDLE
  const exposureSignals = extractExposureSignals(bundle, family, skillTruth)
  contract.recentExposureLevel = exposureSignals.level
  contract.exposureWeeksCount = exposureSignals.weeks
  contract.exposureSessionsCount = exposureSignals.sessions
  
  // 2. CALCULATE ADAPTATION READINESS
  const adaptationAssessment = assessAdaptationReadiness(
    exposureSignals,
    skillTruth,
    family
  )
  contract.adaptationReadiness = adaptationAssessment.readiness
  contract.adaptationScore = adaptationAssessment.score
  
  // 3. DETERMINE PERMISSION LEVELS (respecting exposure caps)
  const permissions = determinePermissions(
    contract.recentExposureLevel,
    contract.adaptationReadiness,
    skillTruth,
    family
  )
  
  contract.progressionPermission = permissions.progression
  contract.densityPermission = permissions.density
  contract.loadPermission = permissions.load
  contract.methodPermission = permissions.method
  contract.advancedVariantPermission = permissions.advancedVariant
  contract.currentResponseSignal = skillTruth.recentResponse.toleranceSignal
  contract.cappedDueToReadiness = permissions.wasCapped
  
  // 4. BUILD REASON STRING
  contract.readinessReason = buildReadinessReason(contract, skillTruth)
  contract.readinessConfidence = computeReadinessConfidence(bundle, family)
  
  return contract
}

// =============================================================================
// EXPOSURE SIGNAL EXTRACTION
// =============================================================================

interface ExposureSignals {
  level: ExposureLevel
  weeks: number | null
  sessions: number | null
  dataPoints: number
}

function extractExposureSignals(
  bundle: ProgrammingTruthBundle,
  family: SkillFamily,
  skillTruth: SkillFamilyTruth
): ExposureSignals {
  let dataPoints = 0
  let estimatedWeeks: number | null = null
  let estimatedSessions: number | null = null
  
  // Signal 1: Skill progression data indicates ongoing work
  if (skillTruth.currentEarnedState.lastUpdated) {
    const lastUpdate = new Date(skillTruth.currentEarnedState.lastUpdated)
    const now = new Date()
    const weeksSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    
    // If updated recently, they have ongoing exposure
    if (weeksSinceUpdate <= 4) {
      dataPoints += 2
      estimatedWeeks = Math.max(1, 4 - weeksSinceUpdate)  // Minimum 1 week recent exposure
    }
  }
  
  // Signal 2: Progress score indicates accumulated work
  const progressScore = skillTruth.currentEarnedState.progressScore
  if (progressScore !== null) {
    dataPoints += 1
    // Higher progress score = more accumulated exposure
    if (progressScore > 0.7) {
      estimatedWeeks = (estimatedWeeks ?? 0) + 8
    } else if (progressScore > 0.4) {
      estimatedWeeks = (estimatedWeeks ?? 0) + 4
    } else if (progressScore > 0.2) {
      estimatedWeeks = (estimatedWeeks ?? 0) + 2
    }
  }
  
  // Signal 3: Training response history
  if (bundle.trainingResponse?.meta?.available) {
    const totalWorkouts = bundle.trainingResponse.totalWorkoutsLogged || 0
    dataPoints += 1
    
    // Estimate sessions with this family based on total and skill selection
    // This is approximate - in reality need workout-level family tracking
    if (totalWorkouts > 20) {
      estimatedSessions = Math.floor(totalWorkouts * 0.3)  // Assume ~30% overlap
    } else if (totalWorkouts > 10) {
      estimatedSessions = Math.floor(totalWorkouts * 0.4)
    } else {
      estimatedSessions = Math.floor(totalWorkouts * 0.5)
    }
  }
  
  // Signal 4: Performance envelope indicates established pattern
  const envelope = bundle.performanceEnvelopes?.byMovementFamily?.[family]
  if (envelope?.dataPointsCount && envelope.dataPointsCount > 0) {
    dataPoints += 2
    estimatedSessions = Math.max(estimatedSessions ?? 0, envelope.dataPointsCount)
  }
  
  // Signal 5: Benchmark history for the family
  const hasBenchmarkHistory = checkBenchmarkHistory(bundle, family)
  if (hasBenchmarkHistory) {
    dataPoints += 1
    estimatedWeeks = Math.max(estimatedWeeks ?? 0, 4)
  }
  
  // Determine exposure level
  let level: ExposureLevel = 'none'
  if (dataPoints >= 4 && (estimatedWeeks ?? 0) >= 6) {
    level = 'high'
  } else if (dataPoints >= 2 && (estimatedWeeks ?? 0) >= 3) {
    level = 'moderate'
  } else if (dataPoints >= 1 || (estimatedWeeks ?? 0) >= 1) {
    level = 'low'
  }
  
  return {
    level,
    weeks: estimatedWeeks,
    sessions: estimatedSessions,
    dataPoints,
  }
}

function checkBenchmarkHistory(bundle: ProgrammingTruthBundle, family: SkillFamily): boolean {
  const benchmarks = bundle.benchmarks
  if (!benchmarks?.meta?.available) return false
  
  switch (family) {
    case 'front_lever':
      return !!benchmarks.skills.frontLeverProgression || (benchmarks.skills.frontLeverHoldSeconds ?? 0) > 0
    case 'planche':
      return !!benchmarks.skills.plancheProgression || (benchmarks.skills.plancheHoldSeconds ?? 0) > 0
    case 'hspu':
      return !!benchmarks.skills.hspuProgression || (benchmarks.strength.wallHspuReps ?? 0) > 0
    case 'muscle_up':
      return !!benchmarks.skills.muscleUpReadiness
    case 'l_sit':
      return (benchmarks.skills.lSitHoldSeconds ?? 0) > 0
    case 'v_sit':
      return (benchmarks.skills.vSitHoldSeconds ?? 0) > 0
    case 'weighted_pull':
      return (benchmarks.strength.weightedPullUpLoad ?? 0) > 0 || (benchmarks.strength.pullUpMax ?? 0) > 5
    case 'weighted_dip':
      return (benchmarks.strength.weightedDipLoad ?? 0) > 0 || (benchmarks.strength.dipMax ?? 0) > 5
    default:
      return false
  }
}

// =============================================================================
// ADAPTATION READINESS ASSESSMENT
// =============================================================================

interface AdaptationAssessment {
  readiness: AdaptationReadiness
  score: number
}

function assessAdaptationReadiness(
  exposure: ExposureSignals,
  skillTruth: SkillFamilyTruth,
  family: SkillFamily
): AdaptationAssessment {
  let score = 0
  
  // Component 1: Exposure base (40% of score)
  switch (exposure.level) {
    case 'high': score += 40; break
    case 'moderate': score += 25; break
    case 'low': score += 10; break
    default: score += 0
  }
  
  // Component 2: Recent response quality (25% of score)
  const tolerance = skillTruth.recentResponse.toleranceSignal
  if (tolerance === 'good') score += 25
  else if (tolerance === 'moderate') score += 15
  else if (tolerance === 'poor') score += 0
  else score += 10  // Unknown is neutral
  
  // Component 3: Adherence pattern (20% of score)
  const adherence = skillTruth.recentResponse.adherencePattern
  if (adherence === 'consistent') score += 20
  else if (adherence === 'improving') score += 15
  else if (adherence === 'sporadic') score += 5
  else if (adherence === 'declining') score += 0
  else score += 10  // Unknown is neutral
  
  // Component 4: No pain markers bonus (15% of score)
  if (!skillTruth.recentResponse.painMarkers) {
    score += 15
  }
  
  // Penalty for advanced families without sufficient exposure
  if (ADVANCED_FAMILIES.includes(family) && exposure.level === 'low') {
    score = Math.min(score, 40)  // Cap at 40 for low-exposure advanced work
  }
  
  // Determine readiness tier
  let readiness: AdaptationReadiness
  if (score >= 80) {
    readiness = 'highly_ready'
  } else if (score >= 55) {
    readiness = 'ready'
  } else if (score >= 30) {
    readiness = 'building'
  } else {
    readiness = 'unready'
  }
  
  return { readiness, score }
}

// =============================================================================
// PERMISSION DETERMINATION
// =============================================================================

interface PermissionDecisions {
  progression: ProgressionPermission
  density: DensityPermission
  load: LoadPermission
  method: MethodPermission
  advancedVariant: AdvancedVariantPermission
  wasCapped: boolean
}

function determinePermissions(
  exposureLevel: ExposureLevel,
  adaptationReadiness: AdaptationReadiness,
  skillTruth: SkillFamilyTruth,
  family: SkillFamily
): PermissionDecisions {
  let wasCapped = false
  
  // Current response signal
  const responseIsGood = skillTruth.recentResponse.toleranceSignal === 'good'
  const responseIsDecent = responseIsGood || skillTruth.recentResponse.toleranceSignal === 'moderate'
  const responseIsPoor = skillTruth.recentResponse.toleranceSignal === 'poor'
  
  // ==========================================================================
  // PROGRESSION PERMISSION - most critical gate
  // ==========================================================================
  let progression: ProgressionPermission = 'hold'
  
  if (adaptationReadiness === 'highly_ready') {
    // Full permission if highly adapted
    progression = 'allow_full_step'
  } else if (adaptationReadiness === 'ready') {
    // Allow progression if response is decent
    progression = responseIsGood ? 'allow_full_step' : 'allow_small_step'
  } else if (adaptationReadiness === 'building') {
    // Only small steps when building, regardless of current response
    if (responseIsGood && exposureLevel !== 'low') {
      progression = 'allow_small_step'
    } else {
      progression = 'hold'
      if (responseIsGood) wasCapped = true  // Good response but capped due to readiness
    }
  } else {
    // Unready - block or hold
    progression = responseIsPoor ? 'block' : 'hold'
    if (responseIsGood) wasCapped = true
  }
  
  // Extra restriction for advanced families
  if (ADVANCED_FAMILIES.includes(family)) {
    if (exposureLevel === 'none' || exposureLevel === 'low') {
      if (progression === 'allow_full_step') {
        progression = 'allow_small_step'
        wasCapped = true
      } else if (progression === 'allow_small_step' && exposureLevel === 'none') {
        progression = 'hold'
        wasCapped = true
      }
    }
  }
  
  // ==========================================================================
  // DENSITY PERMISSION
  // ==========================================================================
  let density: DensityPermission = 'maintain'
  
  if (adaptationReadiness === 'highly_ready' && responseIsGood) {
    density = 'allow_increase'
  } else if (adaptationReadiness === 'unready' || responseIsPoor) {
    density = 'reduce'
  }
  
  // ==========================================================================
  // LOAD PERMISSION
  // ==========================================================================
  let load: LoadPermission = 'maintain'
  
  if (adaptationReadiness === 'highly_ready' && responseIsGood) {
    load = 'push'
  } else if (adaptationReadiness === 'unready' || adaptationReadiness === 'building') {
    if (responseIsPoor) {
      load = 'soften'
    } else if (!responseIsGood) {
      load = 'soften'
      if (responseIsDecent) wasCapped = true
    }
  }
  
  // Weighted families need more exposure for load pushing
  if (WEIGHTED_FAMILIES.includes(family)) {
    if (exposureLevel === 'low' && load === 'push') {
      load = 'maintain'
      wasCapped = true
    }
  }
  
  // ==========================================================================
  // METHOD PERMISSION
  // ==========================================================================
  let method: MethodPermission = 'straight_sets_only'
  
  if (adaptationReadiness === 'highly_ready') {
    method = 'full_method_ok'
  } else if (adaptationReadiness === 'ready' && exposureLevel !== 'low') {
    method = 'light_grouping_ok'
  } else if (adaptationReadiness === 'building' && exposureLevel === 'high') {
    method = 'light_grouping_ok'
  }
  
  // ==========================================================================
  // ADVANCED VARIANT PERMISSION
  // ==========================================================================
  let advancedVariant: AdvancedVariantPermission = 'cautious'
  
  if (ADVANCED_FAMILIES.includes(family)) {
    // Advanced families need higher thresholds
    if (adaptationReadiness === 'highly_ready' && exposureLevel === 'high') {
      advancedVariant = 'allowed'
    } else if (adaptationReadiness === 'unready' || exposureLevel === 'none') {
      advancedVariant = 'blocked'
    } else {
      advancedVariant = 'cautious'
    }
  } else {
    // Non-advanced families
    if (adaptationReadiness === 'ready' || adaptationReadiness === 'highly_ready') {
      advancedVariant = 'allowed'
    } else if (adaptationReadiness === 'unready') {
      advancedVariant = 'blocked'
    }
  }
  
  return {
    progression,
    density,
    load,
    method,
    advancedVariant,
    wasCapped,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function buildReadinessReason(
  contract: FamilyReadinessContract,
  skillTruth: SkillFamilyTruth
): string {
  const parts: string[] = []
  
  // Exposure assessment
  parts.push(`exposure:${contract.recentExposureLevel}`)
  
  // Adaptation state
  parts.push(`adaptation:${contract.adaptationReadiness}(${contract.adaptationScore})`)
  
  // Response signal
  parts.push(`response:${skillTruth.recentResponse.toleranceSignal}`)
  
  // Key permissions
  parts.push(`prog:${contract.progressionPermission}`)
  
  // Capped indicator
  if (contract.cappedDueToReadiness) {
    parts.push('CAPPED_BY_READINESS')
  }
  
  return parts.join('|')
}

function computeReadinessConfidence(
  bundle: ProgrammingTruthBundle,
  family: SkillFamily
): TruthConfidence {
  let dataSourceCount = 0
  
  if (bundle.skillProgressions?.meta?.available) dataSourceCount++
  if (bundle.trainingResponse?.meta?.available) dataSourceCount++
  if (bundle.performanceEnvelopes?.meta?.available) dataSourceCount++
  if (bundle.benchmarks?.meta?.available) dataSourceCount++
  if (bundle.constraintHistory?.meta?.available) dataSourceCount++
  
  if (dataSourceCount >= 4) return 'high'
  if (dataSourceCount >= 2) return 'medium'
  if (dataSourceCount >= 1) return 'low'
  return 'none'
}

// =============================================================================
// BATCH RESOLUTION FOR ALL SELECTED SKILLS
// =============================================================================

/**
 * Resolve readiness for all selected skills in one call
 */
export function resolveAllSkillReadiness(
  bundle: ProgrammingTruthBundle | null,
  selectedSkills: string[]
): Map<SkillFamily, FamilyReadinessContract> {
  const readinessMap = new Map<SkillFamily, FamilyReadinessContract>()
  
  for (const skill of selectedSkills) {
    const contract = resolveExposureReadiness(bundle, skill)
    // Use first resolution for each family (in case multiple skills map to same family)
    if (!readinessMap.has(contract.family)) {
      readinessMap.set(contract.family, contract)
    }
  }
  
  return readinessMap
}

/**
 * Get readiness for a specific family, with fallback
 */
export function getReadinessForFamily(
  readinessMap: Map<SkillFamily, FamilyReadinessContract>,
  family: SkillFamily
): FamilyReadinessContract | null {
  return readinessMap.get(family) || null
}

/**
 * Apply readiness gating to a progression depth decision
 */
export function gateProgressionByReadiness(
  suggestedDepth: 'conservative' | 'moderate' | 'progressive',
  readiness: FamilyReadinessContract
): {
  gatedDepth: 'conservative' | 'moderate' | 'progressive'
  wasGated: boolean
  reason: string
} {
  const permission = readiness.progressionPermission
  let gatedDepth = suggestedDepth
  let wasGated = false
  let reason = 'readiness_allows'
  
  if (permission === 'block') {
    if (suggestedDepth !== 'conservative') {
      gatedDepth = 'conservative'
      wasGated = true
      reason = 'blocked_by_readiness'
    }
  } else if (permission === 'hold') {
    if (suggestedDepth === 'progressive') {
      gatedDepth = 'moderate'
      wasGated = true
      reason = 'held_by_readiness'
    }
  } else if (permission === 'allow_small_step') {
    if (suggestedDepth === 'progressive') {
      gatedDepth = 'moderate'  // Allow moderate but not full progressive
      wasGated = true
      reason = 'limited_by_readiness'
    }
  }
  // allow_full_step passes through unchanged
  
  return { gatedDepth, wasGated, reason }
}

/**
 * Apply readiness gating to prescription calibration
 */
export function gatePrescriptionByReadiness(
  suggestedModifiers: {
    setsModifier: number
    intensityModifier: number
    restModifier: number
  },
  readiness: FamilyReadinessContract
): {
  gatedModifiers: typeof suggestedModifiers
  wasGated: boolean
  reason: string
} {
  const gatedModifiers = { ...suggestedModifiers }
  let wasGated = false
  let reason = 'readiness_allows'
  
  // Density permission affects sets
  if (readiness.densityPermission === 'reduce') {
    if (gatedModifiers.setsModifier >= 0) {
      gatedModifiers.setsModifier = Math.min(gatedModifiers.setsModifier - 1, -1)
      wasGated = true
      reason = 'density_reduced_by_readiness'
    }
  } else if (readiness.densityPermission === 'maintain') {
    if (gatedModifiers.setsModifier > 0) {
      gatedModifiers.setsModifier = 0
      wasGated = true
      reason = 'density_capped_by_readiness'
    }
  }
  
  // Load permission affects intensity
  if (readiness.loadPermission === 'soften') {
    if (gatedModifiers.intensityModifier >= 0) {
      gatedModifiers.intensityModifier = Math.min(gatedModifiers.intensityModifier - 0.5, -0.5)
      wasGated = true
      reason = wasGated ? reason + '+load_softened' : 'load_softened_by_readiness'
    }
  } else if (readiness.loadPermission === 'maintain') {
    if (gatedModifiers.intensityModifier > 0) {
      gatedModifiers.intensityModifier = 0
      wasGated = true
      reason = wasGated ? reason + '+load_capped' : 'load_capped_by_readiness'
    }
  }
  
  return { gatedModifiers, wasGated, reason }
}

/**
 * Check if an advanced variant should be blocked by readiness
 */
export function shouldBlockAdvancedVariant(
  readiness: FamilyReadinessContract,
  variantDifficulty: 'basic' | 'intermediate' | 'advanced' | 'elite'
): {
  blocked: boolean
  reason: string
} {
  if (variantDifficulty === 'basic' || variantDifficulty === 'intermediate') {
    return { blocked: false, reason: 'variant_not_advanced' }
  }
  
  if (readiness.advancedVariantPermission === 'blocked') {
    return { blocked: true, reason: 'advanced_blocked_insufficient_readiness' }
  }
  
  if (readiness.advancedVariantPermission === 'cautious' && variantDifficulty === 'elite') {
    return { blocked: true, reason: 'elite_blocked_cautious_readiness' }
  }
  
  return { blocked: false, reason: 'readiness_allows_variant' }
}

// Re-export types for external use
export { mapSkillToFamily }
