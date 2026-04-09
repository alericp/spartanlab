/**
 * DB TRUTH SCORING BRIDGE
 * 
 * Translates Programming Truth Bundle data into normalized scoring/calibration
 * inputs that can be consumed by existing generation owners:
 * - doctrine-exercise-scorer.ts (main exercise ranking)
 * - prescription-contract.ts (prescription calibration)
 * - session-architecture-truth.ts (progression depth)
 * 
 * This is a PURE TRANSLATION LAYER - it does not replace existing engines,
 * only feeds them better inputs when DB truth is available.
 */

import type { ProgrammingTruthBundle, TruthConfidence } from './programming-truth-bundle-contract'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Score modifiers for main exercise ranking based on DB truth
 */
export interface DBTruthRankingModifiers {
  // Progression-based modifiers
  progressionConfidence: TruthConfidence
  progressionScoreModifier: number  // -20 to +20 based on progression state
  conservativeSelectionBias: boolean  // True if progression data suggests conservative choices
  
  // Envelope-based modifiers  
  envelopeConfidence: TruthConfidence
  toleranceModifier: number  // -15 to +15 based on performance envelope
  densityPreference: 'low' | 'medium' | 'high'
  
  // Constraint-based modifiers
  constraintPenalties: Map<string, number>  // Movement pattern -> penalty score
  activeConstraintCount: number
  
  // Training response modifiers
  adherenceModifier: number  // -10 to +10 based on adherence patterns
  fatigueRiskModifier: number  // -15 to +15 based on response history
  
  // Meta
  totalModifierRange: [number, number]  // Min/max total modifier that can be applied
  sourceConfidence: TruthConfidence
  sourceSections: string[]
}

/**
 * Progression depth recommendation based on DB truth
 */
export interface DBTruthProgressionDepth {
  skill: string
  recommendedDepth: 'conservative' | 'moderate' | 'progressive'
  currentLevelFromDB: number | null
  progressScoreFromDB: number | null
  confidenceLevel: TruthConfidence
  adjustmentReason: string
  
  // Specific recommendations
  preferBasicVariant: boolean
  allowAdvancedVariant: boolean
  suggestedVariantBias: number  // -2 to +2 steps from default
}

/**
 * Prescription calibration inputs based on DB truth
 */
export interface DBTruthPrescriptionCalibration {
  // Sets calibration
  setsModifier: number  // -2 to +2 from template
  setsConfidence: TruthConfidence
  setsReason: string
  
  // Volume calibration (reps/hold time)
  volumeModifier: number  // Percentage adjustment (-20% to +20%)
  volumeConfidence: TruthConfidence
  volumeReason: string
  
  // Rest calibration
  restModifier: number  // Seconds adjustment (-30 to +30)
  restConfidence: TruthConfidence
  restReason: string
  
  // Intensity calibration
  intensityModifier: number  // RPE/RIR adjustment (-1 to +1)
  intensityConfidence: TruthConfidence
  intensityReason: string
  
  // Density calibration
  densityAggression: 'conservative' | 'moderate' | 'aggressive'
  densityConfidence: TruthConfidence
  
  // Meta
  overallCalibrationConfidence: TruthConfidence
  calibrationApplied: boolean
  sourceSections: string[]
}

// =============================================================================
// MAIN BRIDGE FUNCTIONS
// =============================================================================

/**
 * Build ranking modifiers from Programming Truth Bundle
 * Used by doctrine-exercise-scorer to adjust candidate scores
 */
export function buildRankingModifiersFromBundle(
  bundle: ProgrammingTruthBundle | null,
  targetSkills: string[]
): DBTruthRankingModifiers {
  // Default/fallback modifiers when no bundle available
  const defaultModifiers: DBTruthRankingModifiers = {
    progressionConfidence: 'none',
    progressionScoreModifier: 0,
    conservativeSelectionBias: false,
    envelopeConfidence: 'none',
    toleranceModifier: 0,
    densityPreference: 'medium',
    constraintPenalties: new Map(),
    activeConstraintCount: 0,
    adherenceModifier: 0,
    fatigueRiskModifier: 0,
    totalModifierRange: [-30, 30],
    sourceConfidence: 'none',
    sourceSections: [],
  }
  
  if (!bundle) {
    return defaultModifiers
  }
  
  const modifiers = { ...defaultModifiers }
  const sourceSections: string[] = []
  
  // 1. PROGRESSION-BASED MODIFIERS
  if (bundle.skillProgressions.meta.available) {
    sourceSections.push('skill_progressions')
    modifiers.progressionConfidence = bundle.skillProgressions.meta.confidence
    
    // Calculate average progress score for target skills
    let totalProgressScore = 0
    let skillsWithData = 0
    
    for (const skill of targetSkills) {
      const normalizedSkill = skill.replace(/_/g, '').toLowerCase()
      const data = bundle.skillProgressions.bySkill[normalizedSkill] || 
                   bundle.skillProgressions.bySkill[skill]
      
      if (data?.progressScore !== null && data?.progressScore !== undefined) {
        totalProgressScore += data.progressScore
        skillsWithData++
      }
    }
    
    if (skillsWithData > 0) {
      const avgProgressScore = totalProgressScore / skillsWithData
      
      // Convert progress score (0-1) to ranking modifier (-20 to +20)
      // Low progress = conservative bias (negative modifier for advanced exercises)
      // High progress = progressive bias (positive modifier for challenging exercises)
      if (avgProgressScore < 0.3) {
        modifiers.progressionScoreModifier = -15  // Penalize advanced selections
        modifiers.conservativeSelectionBias = true
      } else if (avgProgressScore < 0.5) {
        modifiers.progressionScoreModifier = -5
        modifiers.conservativeSelectionBias = true
      } else if (avgProgressScore > 0.8) {
        modifiers.progressionScoreModifier = 10  // Boost challenging selections
      } else if (avgProgressScore > 0.6) {
        modifiers.progressionScoreModifier = 5
      }
    }
  }
  
  // 2. ENVELOPE-BASED MODIFIERS
  if (bundle.performanceEnvelopes.meta.available) {
    sourceSections.push('performance_envelopes')
    modifiers.envelopeConfidence = bundle.performanceEnvelopes.meta.confidence
    
    // Check envelope data for tolerance signals
    const envelopes = bundle.performanceEnvelopes.byMovementFamily
    const families = Object.keys(envelopes)
    
    if (families.length > 0) {
      let totalConfidence = 0
      let avgDensity = 0
      let count = 0
      
      for (const family of families) {
        const envelope = envelopes[family]
        if (envelope.confidenceScore !== null) {
          totalConfidence += envelope.confidenceScore
          count++
        }
        if (envelope.preferredDensityLevel) {
          avgDensity += envelope.preferredDensityLevel === 'high' ? 3 : 
                        envelope.preferredDensityLevel === 'medium' ? 2 : 1
        }
      }
      
      if (count > 0) {
        const avgConfidence = totalConfidence / count
        // High confidence envelopes allow more aggressive selection
        modifiers.toleranceModifier = avgConfidence > 0.7 ? 10 : 
                                       avgConfidence > 0.5 ? 5 : 0
      }
      
      if (families.length > 0) {
        const densityAvg = avgDensity / families.length
        modifiers.densityPreference = densityAvg > 2.5 ? 'high' : 
                                       densityAvg > 1.5 ? 'medium' : 'low'
      }
    }
  }
  
  // 3. CONSTRAINT-BASED PENALTIES
  if (bundle.constraintHistory.meta.available) {
    sourceSections.push('constraint_history')
    
    const riskFlags = bundle.constraintHistory.activeJointRiskFlags
    modifiers.activeConstraintCount = riskFlags.length
    
    for (const flag of riskFlags) {
      // Map constraint flags to movement pattern penalties
      const patterns = getConstraintAffectedPatterns(flag)
      for (const pattern of patterns) {
        const existing = modifiers.constraintPenalties.get(pattern) || 0
        modifiers.constraintPenalties.set(pattern, existing - 8)  // -8 per constraint
      }
    }
  }
  
  // 4. TRAINING RESPONSE MODIFIERS
  if (bundle.trainingResponse.meta.available) {
    sourceSections.push('training_response')
    
    if (bundle.trainingResponse.hasEarnedHistory) {
      // Adherence pattern affects exercise complexity tolerance
      const adherence = bundle.trainingResponse.recentAdherencePattern
      modifiers.adherenceModifier = adherence === 'consistent' ? 5 :
                                    adherence === 'improving' ? 3 :
                                    adherence === 'declining' ? -5 :
                                    adherence === 'sporadic' ? -8 : 0
      
      // Consistency signal affects fatigue-sensitive selections
      const consistency = bundle.trainingResponse.consistencySignal
      modifiers.fatigueRiskModifier = consistency === 'high' ? 5 :
                                       consistency === 'medium' ? 0 :
                                       consistency === 'low' ? -10 : 0
    }
  }
  
  // Calculate overall source confidence
  modifiers.sourceSections = sourceSections
  modifiers.sourceConfidence = sourceSections.length >= 3 ? 'high' :
                                sourceSections.length >= 2 ? 'medium' :
                                sourceSections.length >= 1 ? 'low' : 'none'
  
  return modifiers
}

/**
 * Build progression depth recommendation from bundle
 * Used by exercise selection to choose appropriate variants
 */
export function buildProgressionDepthFromBundle(
  bundle: ProgrammingTruthBundle | null,
  skill: string
): DBTruthProgressionDepth {
  const normalizedSkill = skill.replace(/_/g, '').toLowerCase()
  
  // Default recommendation
  const defaultDepth: DBTruthProgressionDepth = {
    skill,
    recommendedDepth: 'moderate',
    currentLevelFromDB: null,
    progressScoreFromDB: null,
    confidenceLevel: 'none',
    adjustmentReason: 'no_db_truth_available',
    preferBasicVariant: false,
    allowAdvancedVariant: true,
    suggestedVariantBias: 0,
  }
  
  if (!bundle?.skillProgressions?.meta?.available) {
    return defaultDepth
  }
  
  const progressionData = bundle.skillProgressions.bySkill[normalizedSkill] || 
                          bundle.skillProgressions.bySkill[skill]
  
  if (!progressionData) {
    return { ...defaultDepth, adjustmentReason: 'skill_not_in_db_progressions' }
  }
  
  const depth = { ...defaultDepth }
  depth.currentLevelFromDB = progressionData.currentLevel ?? null
  depth.progressScoreFromDB = progressionData.progressScore ?? null
  depth.confidenceLevel = bundle.skillProgressions.meta.confidence
  
  // Determine depth based on progress score
  const progressScore = progressionData.progressScore
  
  if (progressScore !== null && progressScore !== undefined) {
    if (progressScore < 0.25) {
      depth.recommendedDepth = 'conservative'
      depth.preferBasicVariant = true
      depth.allowAdvancedVariant = false
      depth.suggestedVariantBias = -2
      depth.adjustmentReason = 'low_progress_score_suggests_consolidation'
    } else if (progressScore < 0.5) {
      depth.recommendedDepth = 'conservative'
      depth.preferBasicVariant = true
      depth.allowAdvancedVariant = false
      depth.suggestedVariantBias = -1
      depth.adjustmentReason = 'moderate_low_progress_suggests_basic_focus'
    } else if (progressScore > 0.8) {
      depth.recommendedDepth = 'progressive'
      depth.preferBasicVariant = false
      depth.allowAdvancedVariant = true
      depth.suggestedVariantBias = 1
      depth.adjustmentReason = 'high_progress_score_allows_advancement'
    } else if (progressScore > 0.65) {
      depth.recommendedDepth = 'moderate'
      depth.preferBasicVariant = false
      depth.allowAdvancedVariant = true
      depth.suggestedVariantBias = 0
      depth.adjustmentReason = 'solid_progress_maintains_current_depth'
    } else {
      depth.recommendedDepth = 'moderate'
      depth.preferBasicVariant = false
      depth.allowAdvancedVariant = false
      depth.suggestedVariantBias = 0
      depth.adjustmentReason = 'mid_range_progress_holds_steady'
    }
  }
  
  return depth
}

/**
 * Build prescription calibration from bundle
 * Used by prescription-contract to adjust sets/reps/rest/intensity
 */
export function buildPrescriptionCalibrationFromBundle(
  bundle: ProgrammingTruthBundle | null,
  exerciseCategory: string,
  movementFamily?: string
): DBTruthPrescriptionCalibration {
  // Default calibration (no changes)
  const defaultCalibration: DBTruthPrescriptionCalibration = {
    setsModifier: 0,
    setsConfidence: 'none',
    setsReason: 'no_db_truth',
    volumeModifier: 0,
    volumeConfidence: 'none',
    volumeReason: 'no_db_truth',
    restModifier: 0,
    restConfidence: 'none',
    restReason: 'no_db_truth',
    intensityModifier: 0,
    intensityConfidence: 'none',
    intensityReason: 'no_db_truth',
    densityAggression: 'moderate',
    densityConfidence: 'none',
    overallCalibrationConfidence: 'none',
    calibrationApplied: false,
    sourceSections: [],
  }
  
  if (!bundle) {
    return defaultCalibration
  }
  
  const calibration = { ...defaultCalibration }
  const sourceSections: string[] = []
  
  // 1. ENVELOPE-BASED CALIBRATION
  if (bundle.performanceEnvelopes.meta.available && movementFamily) {
    const envelope = bundle.performanceEnvelopes.byMovementFamily[movementFamily]
    
    if (envelope) {
      sourceSections.push('performance_envelopes')
      
      // Volume calibration from preferred rep ranges
      if (envelope.preferredRepRangeMin !== null && envelope.preferredRepRangeMax !== null) {
        // Adjust volume target based on envelope preference
        const envelopeCenter = (envelope.preferredRepRangeMin + envelope.preferredRepRangeMax) / 2
        const templateCenter = 8  // Typical template center
        const diff = envelopeCenter - templateCenter
        
        calibration.volumeModifier = Math.round((diff / templateCenter) * 100)
        calibration.volumeModifier = Math.max(-20, Math.min(20, calibration.volumeModifier))
        calibration.volumeConfidence = envelope.confidenceScore && envelope.confidenceScore > 0.6 ? 'medium' : 'low'
        calibration.volumeReason = `envelope_preferred_range_${envelope.preferredRepRangeMin}-${envelope.preferredRepRangeMax}`
      }
      
      // Density calibration
      if (envelope.preferredDensityLevel) {
        calibration.densityAggression = envelope.preferredDensityLevel as 'conservative' | 'moderate' | 'aggressive'
        calibration.densityConfidence = 'medium'
      }
      
      // Rest calibration based on fatigue threshold
      if (envelope.fatigueThreshold !== null) {
        // Lower fatigue threshold = need more rest
        if (envelope.fatigueThreshold < 0.4) {
          calibration.restModifier = 30  // Add 30s rest
          calibration.restConfidence = 'medium'
          calibration.restReason = 'low_fatigue_threshold_needs_more_rest'
        } else if (envelope.fatigueThreshold > 0.7) {
          calibration.restModifier = -15  // Reduce rest slightly
          calibration.restConfidence = 'low'
          calibration.restReason = 'high_fatigue_tolerance_allows_less_rest'
        }
      }
    }
  }
  
  // 2. BENCHMARK-BASED CALIBRATION
  if (bundle.benchmarks.meta.available) {
    sourceSections.push('benchmarks')
    
    // Use benchmark data to inform intensity calibration
    const strengthBenchmarks = bundle.benchmarks.strength
    const hasStrongBenchmarks = 
      (strengthBenchmarks.pullUpMax && strengthBenchmarks.pullUpMax > 12) ||
      (strengthBenchmarks.dipMax && strengthBenchmarks.dipMax > 15) ||
      (strengthBenchmarks.weightedPullUpLoad && strengthBenchmarks.weightedPullUpLoad > 20)
    
    if (hasStrongBenchmarks) {
      // Strong benchmarks allow slightly higher intensity
      calibration.intensityModifier = 0.5  // +0.5 RPE target
      calibration.intensityConfidence = 'medium'
      calibration.intensityReason = 'strong_benchmarks_allow_higher_intensity'
    }
    
    const hasWeakBenchmarks = 
      (strengthBenchmarks.pullUpMax !== null && strengthBenchmarks.pullUpMax < 5) ||
      (strengthBenchmarks.dipMax !== null && strengthBenchmarks.dipMax < 5)
    
    if (hasWeakBenchmarks) {
      // Weak benchmarks = be conservative
      calibration.intensityModifier = -0.5
      calibration.intensityConfidence = 'medium'
      calibration.intensityReason = 'developing_benchmarks_need_conservative_intensity'
      calibration.setsModifier = -1
      calibration.setsConfidence = 'low'
      calibration.setsReason = 'reduced_sets_for_developing_strength'
    }
  }
  
  // 3. TRAINING RESPONSE CALIBRATION
  if (bundle.trainingResponse.meta.available && bundle.trainingResponse.hasEarnedHistory) {
    sourceSections.push('training_response')
    
    const adherence = bundle.trainingResponse.recentAdherencePattern
    
    if (adherence === 'declining' || adherence === 'sporadic') {
      // Poor adherence = reduce volume to improve completion
      calibration.setsModifier = Math.min(calibration.setsModifier, -1)
      calibration.setsConfidence = 'medium'
      calibration.setsReason = 'reduced_volume_for_adherence_recovery'
    } else if (adherence === 'consistent') {
      // Good adherence = can handle normal or slightly higher volume
      calibration.setsModifier = Math.max(calibration.setsModifier, 0)
      if (calibration.setsReason === 'no_db_truth') {
        calibration.setsReason = 'consistent_adherence_maintains_volume'
        calibration.setsConfidence = 'low'
      }
    }
  }
  
  // Calculate overall confidence
  calibration.sourceSections = sourceSections
  calibration.calibrationApplied = sourceSections.length > 0
  calibration.overallCalibrationConfidence = sourceSections.length >= 2 ? 'medium' :
                                              sourceSections.length >= 1 ? 'low' : 'none'
  
  return calibration
}

/**
 * Apply ranking modifiers to a candidate score
 */
export function applyRankingModifiers(
  baseScore: number,
  modifiers: DBTruthRankingModifiers,
  exerciseMetadata: {
    isAdvanced?: boolean
    movementPattern?: string
    fatigueLevel?: 'low' | 'medium' | 'high'
  }
): { 
  adjustedScore: number
  totalModifier: number
  modifierBreakdown: string[]
  changed: boolean
} {
  let totalModifier = 0
  const breakdown: string[] = []
  
  // 1. Apply progression modifier (affects advanced exercises more)
  if (modifiers.progressionScoreModifier !== 0) {
    const progressionEffect = exerciseMetadata.isAdvanced 
      ? modifiers.progressionScoreModifier 
      : modifiers.progressionScoreModifier * 0.5
    totalModifier += progressionEffect
    breakdown.push(`progression:${progressionEffect > 0 ? '+' : ''}${progressionEffect}`)
  }
  
  // 2. Apply envelope tolerance modifier
  if (modifiers.toleranceModifier !== 0) {
    totalModifier += modifiers.toleranceModifier
    breakdown.push(`envelope:${modifiers.toleranceModifier > 0 ? '+' : ''}${modifiers.toleranceModifier}`)
  }
  
  // 3. Apply constraint penalties
  if (exerciseMetadata.movementPattern && modifiers.constraintPenalties.has(exerciseMetadata.movementPattern)) {
    const penalty = modifiers.constraintPenalties.get(exerciseMetadata.movementPattern)!
    totalModifier += penalty
    breakdown.push(`constraint:${penalty}`)
  }
  
  // 4. Apply adherence modifier
  if (modifiers.adherenceModifier !== 0) {
    totalModifier += modifiers.adherenceModifier
    breakdown.push(`adherence:${modifiers.adherenceModifier > 0 ? '+' : ''}${modifiers.adherenceModifier}`)
  }
  
  // 5. Apply fatigue risk modifier (affects high-fatigue exercises more)
  if (modifiers.fatigueRiskModifier !== 0 && exerciseMetadata.fatigueLevel === 'high') {
    totalModifier += modifiers.fatigueRiskModifier
    breakdown.push(`fatigue_risk:${modifiers.fatigueRiskModifier > 0 ? '+' : ''}${modifiers.fatigueRiskModifier}`)
  }
  
  // Clamp total modifier to bounds
  totalModifier = Math.max(modifiers.totalModifierRange[0], 
                          Math.min(modifiers.totalModifierRange[1], totalModifier))
  
  return {
    adjustedScore: baseScore + totalModifier,
    totalModifier,
    modifierBreakdown: breakdown,
    changed: totalModifier !== 0,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Map constraint flags to affected movement patterns
 */
function getConstraintAffectedPatterns(constraintFlag: string): string[] {
  const flag = constraintFlag.toLowerCase()
  
  if (flag.includes('shoulder')) {
    return ['overhead_press', 'horizontal_push', 'front_lever', 'planche', 'handstand']
  }
  if (flag.includes('wrist')) {
    return ['handstand', 'planche', 'front_support', 'push_up']
  }
  if (flag.includes('elbow')) {
    return ['straight_arm', 'planche', 'front_lever', 'back_lever']
  }
  if (flag.includes('lower_back') || flag.includes('spine')) {
    return ['deadlift', 'back_lever', 'compression', 'dragon_flag']
  }
  if (flag.includes('hip')) {
    return ['squat', 'compression', 'l_sit', 'v_sit', 'pike']
  }
  
  return []
}

/**
 * Summarize bundle truth usage for logging
 */
export function summarizeBundleTruthUsage(
  rankingModifiers: DBTruthRankingModifiers,
  progressionDepths: DBTruthProgressionDepth[],
  prescriptionCalibration: DBTruthPrescriptionCalibration
): {
  rankingSourced: boolean
  progressionSourced: boolean
  prescriptionSourced: boolean
  totalSourceSections: number
  materialChanges: string[]
} {
  const materialChanges: string[] = []
  
  if (rankingModifiers.sourceConfidence !== 'none') {
    if (rankingModifiers.progressionScoreModifier !== 0) {
      materialChanges.push(`ranking_progression_modifier:${rankingModifiers.progressionScoreModifier}`)
    }
    if (rankingModifiers.toleranceModifier !== 0) {
      materialChanges.push(`ranking_tolerance_modifier:${rankingModifiers.toleranceModifier}`)
    }
    if (rankingModifiers.activeConstraintCount > 0) {
      materialChanges.push(`ranking_constraint_penalties:${rankingModifiers.activeConstraintCount}`)
    }
  }
  
  for (const depth of progressionDepths) {
    if (depth.confidenceLevel !== 'none' && depth.suggestedVariantBias !== 0) {
      materialChanges.push(`progression_${depth.skill}_bias:${depth.suggestedVariantBias}`)
    }
  }
  
  if (prescriptionCalibration.calibrationApplied) {
    if (prescriptionCalibration.setsModifier !== 0) {
      materialChanges.push(`prescription_sets:${prescriptionCalibration.setsModifier > 0 ? '+' : ''}${prescriptionCalibration.setsModifier}`)
    }
    if (prescriptionCalibration.volumeModifier !== 0) {
      materialChanges.push(`prescription_volume:${prescriptionCalibration.volumeModifier > 0 ? '+' : ''}${prescriptionCalibration.volumeModifier}%`)
    }
    if (prescriptionCalibration.restModifier !== 0) {
      materialChanges.push(`prescription_rest:${prescriptionCalibration.restModifier > 0 ? '+' : ''}${prescriptionCalibration.restModifier}s`)
    }
  }
  
  const allSections = new Set([
    ...rankingModifiers.sourceSections,
    ...prescriptionCalibration.sourceSections,
  ])
  
  return {
    rankingSourced: rankingModifiers.sourceConfidence !== 'none',
    progressionSourced: progressionDepths.some(d => d.confidenceLevel !== 'none'),
    prescriptionSourced: prescriptionCalibration.calibrationApplied,
    totalSourceSections: allSections.size,
    materialChanges,
  }
}
