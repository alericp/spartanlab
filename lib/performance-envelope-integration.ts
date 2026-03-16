/**
 * Performance Envelope Integration
 * 
 * Connects Performance Envelope Modeling to program generation,
 * adaptive progression, workout logging, SkillState, and Constraint Detection.
 */

import { getAthleteEnvelopes, getOrCreateEnvelope, recordSignal, updateEnvelopeFromSignals } from './performance-envelope-service'
import { generateEnvelopeInsight, getEnvelopeBasedRecommendations, type PerformanceEnvelope, type TrainingResponseSignal } from './performance-envelope-engine'
import type { MovementFamily } from './movement-family-registry'
import type { WorkoutLog } from './workout-log-service'
import type { SkillState, SkillKey } from './skill-state-service'

// =============================================================================
// SKILL-TO-MOVEMENT-FAMILY MAPPING
// =============================================================================

/**
 * Maps skills to their primary and secondary movement families for envelope tracking
 */
const SKILL_TO_MOVEMENT_FAMILIES: Record<SkillKey, {
  primary: MovementFamily[]
  secondary: MovementFamily[]
}> = {
  front_lever: {
    primary: ['straight_arm_pull', 'horizontal_pull'],
    secondary: ['compression_core', 'scapular_control'],
  },
  back_lever: {
    primary: ['straight_arm_pull'],
    secondary: ['scapular_control', 'mobility'],
  },
  planche: {
    primary: ['straight_arm_push', 'horizontal_push'],
    secondary: ['compression_core', 'scapular_control', 'joint_integrity'],
  },
  hspu: {
    primary: ['vertical_push'],
    secondary: ['compression_core', 'joint_integrity'],
  },
  muscle_up: {
    primary: ['explosive_pull', 'vertical_pull', 'dip_pattern'],
    secondary: ['transition', 'scapular_control'],
  },
  l_sit: {
    primary: ['compression_core'],
    secondary: ['scapular_control', 'joint_integrity'],
  },
}

/**
 * Get relevant movement families for a skill
 */
export function getSkillMovementFamilies(skill: SkillKey): MovementFamily[] {
  const mapping = SKILL_TO_MOVEMENT_FAMILIES[skill]
  if (!mapping) return []
  return [...mapping.primary, ...mapping.secondary]
}

/**
 * Get primary movement families for a skill (most important for envelope tracking)
 */
export function getSkillPrimaryFamilies(skill: SkillKey): MovementFamily[] {
  return SKILL_TO_MOVEMENT_FAMILIES[skill]?.primary || []
}

/**
 * Get envelope-based rep range recommendation for program generation
 */
export async function getEnvelopeRepRange(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
): Promise<{ min: number; max: number; confidence: number }> {
  try {
    const envelope = await getOrCreateEnvelope(athleteId, movementFamily, goalType)
    return {
      min: envelope.preferredRepRangeMin,
      max: envelope.preferredRepRangeMax,
      confidence: envelope.confidenceScore,
    }
  } catch (error) {
    console.warn('[Envelope] Could not get rep range:', error)
    // Return conservative defaults
    return { min: 3, max: 6, confidence: 0 }
  }
}

/**
 * Get envelope-based volume recommendation for program generation
 */
export async function getEnvelopeVolume(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
): Promise<{ weeklyMin: number; weeklyMax: number; setsPerSession: number; confidence: number }> {
  try {
    const envelope = await getOrCreateEnvelope(athleteId, movementFamily, goalType)
    return {
      weeklyMin: envelope.preferredWeeklyVolumeMin,
      weeklyMax: envelope.preferredWeeklyVolumeMax,
      setsPerSession: Math.round((envelope.preferredSetRangeMin + envelope.preferredSetRangeMax) / 2),
      confidence: envelope.confidenceScore,
    }
  } catch (error) {
    console.warn('[Envelope] Could not get volume:', error)
    return { weeklyMin: 8, weeklyMax: 15, setsPerSession: 4, confidence: 0 }
  }
}

/**
 * Get envelope-based density recommendation for program generation
 */
export async function getEnvelopeDensity(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
): Promise<{ preferredDensity: 'low_density' | 'moderate_density' | 'high_density'; confidence: number }> {
  try {
    const envelope = await getOrCreateEnvelope(athleteId, movementFamily, goalType)
    return {
      preferredDensity: envelope.preferredDensityLevel,
      confidence: envelope.confidenceScore,
    }
  } catch (error) {
    console.warn('[Envelope] Could not get density:', error)
    return { preferredDensity: 'moderate_density', confidence: 0 }
  }
}

/**
 * Record workout performance for envelope learning
 * Now properly tracks weekly volume by movement family
 */
export async function recordWorkoutEnvelopeSignals(
  athleteId: string,
  workoutLog: WorkoutLog,
  movementFamilyResults: Array<{
    movementFamily: MovementFamily
    goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
    repsPerformed: number
    setsPerformed: number
    performanceMetric: number
    difficultyRating: 'easy' | 'normal' | 'hard'
    weeklyVolumePrior?: number // Sets completed in this family this week BEFORE session
    performanceVsPrevious?: 'improved' | 'maintained' | 'declined' | 'unknown'
    qualityRating?: 'poor' | 'moderate' | 'good' | 'excellent'
    restSecondsUsed?: number
  }>
): Promise<void> {
  try {
    for (const result of movementFamilyResults) {
      // Calculate rep zone from reps
      const repZone = result.repsPerformed <= 3 ? 'strength_low' as const :
                     result.repsPerformed <= 6 ? 'strength_mid' as const :
                     result.repsPerformed <= 10 ? 'hypertrophy' as const :
                     result.repsPerformed <= 15 ? 'endurance' as const : 'high_rep' as const
      
      // Calculate weekly volume context
      const weeklyVolumePrior = result.weeklyVolumePrior || 0
      const weeklyVolumeAfter = weeklyVolumePrior + result.setsPerformed
      
      const signal: TrainingResponseSignal = {
        athleteId,
        movementFamily: result.movementFamily,
        goalType: result.goalType,
        
        // Performance data
        repsPerformed: result.repsPerformed,
        setsPerformed: result.setsPerformed,
        repRange: result.repsPerformed <= 3 ? 'low' : result.repsPerformed <= 6 ? 'moderate' : 'high',
        repZone,
        performanceMetric: result.performanceMetric,
        performanceVsPrevious: result.performanceVsPrevious || 'unknown',
        
        // Session context
        sessionDensity: (workoutLog.sessionDensity as 'low_density' | 'moderate_density' | 'high_density') || 'moderate_density',
        restSecondsUsed: result.restSecondsUsed || 120,
        sessionDurationMinutes: workoutLog.sessionDurationMinutes || 0,
        
        // Weekly volume context (movement-family specific)
        weeklyVolumePrior,
        weeklyVolumeAfter,
        weeklySessionCount: 1, // Will be properly calculated by the signal processor
        
        // Response indicators
        difficultyRating: result.difficultyRating,
        completionRatio: workoutLog.completionRatio || 1,
        qualityRating: result.qualityRating || 'moderate',
        sessionTruncated: workoutLog.timeCompressedFlag || false,
        exercisesSkipped: workoutLog.skippedExercises?.length || 0,
        exercisesSubstituted: workoutLog.substitutedExercises?.length || 0,
        
        // Progression tracking
        progressionAdjustment: 'none',
        wasDeloadSession: workoutLog.wasDeloadSession || false,
        
        // Metadata
        recordedAt: new Date(workoutLog.sessionDate),
        dataQuality: workoutLog.logQuality === 'complete' ? 'complete' : 
                     workoutLog.logQuality === 'partial' ? 'partial' : 'partial',
      }

      await recordSignal(signal)

      // Update envelope with new signal
      await updateEnvelopeFromSignals(
        athleteId,
        result.movementFamily,
        result.goalType
      )
    }
  } catch (error) {
    console.warn('[Envelope] Could not record signals:', error)
  }
}

/**
 * Get coaching insight from envelopes
 */
export async function getEnvelopeCoachingInsights(athleteId: string): Promise<string[]> {
  try {
    const envelopes = await getAthleteEnvelopes(athleteId)
    const insights: string[] = []

    // Only include high-confidence envelopes
    const highConfidence = envelopes.filter(e => e.confidenceScore >= 0.4)

    for (const envelope of highConfidence) {
      const insight = generateEnvelopeInsight(envelope)
      if (insight) {
        insights.push(insight)
      }
    }

    return insights.slice(0, 3) // Return top 3 insights
  } catch (error) {
    console.warn('[Envelope] Could not get coaching insights:', error)
    return []
  }
}

/**
 * Detect fatigue trend from envelope analysis
 */
export async function detectFatigueTrendFromEnvelopes(athleteId: string): Promise<{
  hasFatigueConcern: boolean
  affectedFamilies: string[]
  recommendation: string
}> {
  try {
    const envelopes = await getAthleteEnvelopes(athleteId)

    const decliningEnvelopes = envelopes.filter(e => e.performanceTrend === 'declining' && e.confidenceScore >= 0.5)

    if (decliningEnvelopes.length === 0) {
      return { hasFatigueConcern: false, affectedFamilies: [], recommendation: '' }
    }

    const familiesAtRisk = decliningEnvelopes.map(e => e.movementFamily)

    return {
      hasFatigueConcern: true,
      affectedFamilies: familiesAtRisk,
      recommendation: `Performance decline detected in ${familiesAtRisk.join(', ')}. Consider reducing volume or intensity for recovery.`,
    }
  } catch (error) {
    console.warn('[Envelope] Could not detect fatigue trend:', error)
    return { hasFatigueConcern: false, affectedFamilies: [], recommendation: '' }
  }
}

/**
 * Enhanced fatigue detection using athlete's learned thresholds
 * Compares current weekly volume against learned fatigue thresholds
 */
export interface EnvelopeFatigueSignal {
  movementFamily: MovementFamily
  currentWeeklyVolume: number
  fatigueThreshold: number
  percentageOfThreshold: number
  isApproachingThreshold: boolean
  isExceedingThreshold: boolean
  confidenceInThreshold: number
  recommendation: string
  severity: 'low' | 'moderate' | 'elevated' | 'high'
}

export async function detectEnvelopeFatigueRisk(
  athleteId: string,
  currentWeeklyVolumes: Map<MovementFamily, number>
): Promise<{
  overallRisk: 'low' | 'moderate' | 'elevated' | 'high'
  familySignals: EnvelopeFatigueSignal[]
  needsDeload: boolean
  deloadRecommendation: string
  coachingNote: string
}> {
  try {
    const envelopes = await getAthleteEnvelopes(athleteId)
    const familySignals: EnvelopeFatigueSignal[] = []
    
    for (const [family, currentVolume] of currentWeeklyVolumes) {
      const envelope = envelopes.find(e => e.movementFamily === family)
      
      if (!envelope || envelope.confidenceScore < 0.3) {
        // Not enough data - use conservative defaults
        continue
      }
      
      const threshold = envelope.fatigueThreshold
      const percentageOfThreshold = threshold > 0 ? (currentVolume / threshold) * 100 : 0
      
      // Determine fatigue severity
      let severity: EnvelopeFatigueSignal['severity'] = 'low'
      let recommendation = ''
      
      if (percentageOfThreshold >= 120) {
        severity = 'high'
        recommendation = `${formatFamilyName(family)} volume (${currentVolume} sets) significantly exceeds your learned threshold (${threshold}). Consider immediate reduction.`
      } else if (percentageOfThreshold >= 100) {
        severity = 'elevated'
        recommendation = `${formatFamilyName(family)} volume at threshold (${currentVolume}/${threshold} sets). Quality may decline.`
      } else if (percentageOfThreshold >= 85) {
        severity = 'moderate'
        recommendation = `${formatFamilyName(family)} approaching volume threshold (${currentVolume}/${threshold} sets). Monitor performance.`
      } else {
        severity = 'low'
        recommendation = `${formatFamilyName(family)} volume within productive range.`
      }
      
      familySignals.push({
        movementFamily: family,
        currentWeeklyVolume: currentVolume,
        fatigueThreshold: threshold,
        percentageOfThreshold,
        isApproachingThreshold: percentageOfThreshold >= 85,
        isExceedingThreshold: percentageOfThreshold >= 100,
        confidenceInThreshold: envelope.fatigueThresholdConfidence,
        recommendation,
        severity,
      })
    }
    
    // Calculate overall risk
    const highRiskCount = familySignals.filter(s => s.severity === 'high').length
    const elevatedRiskCount = familySignals.filter(s => s.severity === 'elevated').length
    const moderateRiskCount = familySignals.filter(s => s.severity === 'moderate').length
    
    let overallRisk: 'low' | 'moderate' | 'elevated' | 'high' = 'low'
    if (highRiskCount >= 2 || (highRiskCount >= 1 && elevatedRiskCount >= 2)) {
      overallRisk = 'high'
    } else if (highRiskCount >= 1 || elevatedRiskCount >= 2) {
      overallRisk = 'elevated'
    } else if (elevatedRiskCount >= 1 || moderateRiskCount >= 2) {
      overallRisk = 'moderate'
    }
    
    // Determine if deload is needed
    const needsDeload = overallRisk === 'high' || (overallRisk === 'elevated' && highRiskCount > 0)
    
    // Generate coaching note
    let coachingNote = ''
    if (overallRisk === 'high') {
      coachingNote = 'Multiple movement families are at or exceeding your learned fatigue thresholds. A deload or reduced volume block is recommended.'
    } else if (overallRisk === 'elevated') {
      const atRisk = familySignals.filter(s => s.severity === 'elevated' || s.severity === 'high')
      coachingNote = `${atRisk.map(s => formatFamilyName(s.movementFamily)).join(' and ')} volume is approaching limits. Consider reducing or maintaining current levels.`
    } else if (overallRisk === 'moderate') {
      coachingNote = 'Training load is manageable but approaching productive limits for some movement families.'
    } else {
      coachingNote = 'Training load is well within your learned recovery capacity.'
    }
    
    return {
      overallRisk,
      familySignals,
      needsDeload,
      deloadRecommendation: needsDeload 
        ? 'Reduce volume by 40-50% for 1 week, prioritizing the high-risk movement families.'
        : '',
      coachingNote,
    }
  } catch (error) {
    console.warn('[Envelope] Could not detect fatigue risk:', error)
    return {
      overallRisk: 'low',
      familySignals: [],
      needsDeload: false,
      deloadRecommendation: '',
      coachingNote: 'Unable to assess envelope-based fatigue. Using standard fatigue detection.',
    }
  }
}

function formatFamilyName(family: MovementFamily): string {
  return family.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Get personalized program adjustments from envelopes
 */
export async function getEnvelopeBasedProgramAdjustments(
  athleteId: string,
  movementFamilies: MovementFamily[]
): Promise<
  Array<{
    movementFamily: MovementFamily
    repRange: string
    weeklyVolume: string
    sessionDensity: string
    fatigueWarning?: string
  }>
> {
  try {
    const adjustments = []

    for (const family of movementFamilies) {
      // Try to get envelope for strength goal first (most common)
      const envelope = await getOrCreateEnvelope(athleteId, family, 'strength')
      const recs = getEnvelopeBasedRecommendations(envelope)
      adjustments.push({
        movementFamily: family,
        repRange: recs.repRange,
        weeklyVolume: recs.weeklyVolume,
        sessionDensity: recs.sessionDensity,
        fatigueWarning: recs.fatigueWarning,
      })
    }

    return adjustments
  } catch (error) {
    console.warn('[Envelope] Could not get program adjustments:', error)
    return []
  }
}

/**
 * Calculate weekly volume for a movement family from recent logs
 * Used to provide accurate weeklyVolumePrior when recording signals
 */
export function calculateWeeklyVolumeFromLogs(
  logs: WorkoutLog[],
  movementFamily: MovementFamily,
  beforeDate: Date
): number {
  const oneWeekAgo = new Date(beforeDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Map exercise categories to movement families
  const categoryToFamily: Record<string, MovementFamily[]> = {
    'pull': ['vertical_pull', 'horizontal_pull'],
    'push': ['vertical_push', 'horizontal_push'],
    'core': ['compression_core', 'anti_extension_core'],
    'skill': ['straight_arm_pull', 'straight_arm_push'],
    'legs': ['squat', 'hip_hinge'],
    'mobility': ['mobility'],
  }
  
  let totalSets = 0
  
  for (const log of logs) {
    const logDate = new Date(log.sessionDate)
    // Only count logs from the past week, before the current session
    if (logDate >= oneWeekAgo && logDate < beforeDate) {
      for (const exercise of log.exercises) {
        if (exercise.completed) {
          // Check if this exercise's category maps to the target movement family
          const families = categoryToFamily[exercise.category] || []
          if (families.includes(movementFamily)) {
            totalSets += exercise.sets
          }
        }
      }
    }
  }
  
  return totalSets
}

/**
 * Extract movement family results from a workout log
 * Used to automatically generate envelope signals from completed workouts
 */
export function extractMovementFamilyResultsFromLog(
  log: WorkoutLog,
  previousLogs: WorkoutLog[]
): Array<{
  movementFamily: MovementFamily
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
  repsPerformed: number
  setsPerformed: number
  performanceMetric: number
  difficultyRating: 'easy' | 'normal' | 'hard'
  weeklyVolumePrior: number
  performanceVsPrevious: 'improved' | 'maintained' | 'declined' | 'unknown'
  qualityRating: 'poor' | 'moderate' | 'good' | 'excellent'
}> {
  const results: Array<{
    movementFamily: MovementFamily
    goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power'
    repsPerformed: number
    setsPerformed: number
    performanceMetric: number
    difficultyRating: 'easy' | 'normal' | 'hard'
    weeklyVolumePrior: number
    performanceVsPrevious: 'improved' | 'maintained' | 'declined' | 'unknown'
    qualityRating: 'poor' | 'moderate' | 'good' | 'excellent'
  }> = []
  
  // Group exercises by movement family
  const familyGroups = new Map<MovementFamily, {
    totalSets: number
    totalReps: number
    exerciseCount: number
    completedCount: number
  }>()
  
  // Map exercise categories to movement families
  const categoryToFamily: Record<string, MovementFamily> = {
    'pull': 'vertical_pull',
    'push': 'vertical_push',
    'core': 'compression_core',
    'skill': 'straight_arm_pull', // Will be refined based on focus area
    'legs': 'squat',
    'mobility': 'mobility',
  }
  
  // Refine skill category based on focus area
  const focusToFamily: Record<string, MovementFamily> = {
    'planche': 'straight_arm_push',
    'front_lever': 'straight_arm_pull',
    'muscle_up': 'vertical_pull',
    'handstand_pushup': 'vertical_push',
    'weighted_strength': 'vertical_pull',
    'general': 'vertical_pull',
  }
  
  const logDate = new Date(log.sessionDate)
  
  for (const exercise of log.exercises) {
    if (!exercise.completed) continue
    
    // Determine movement family
    let family = categoryToFamily[exercise.category] || 'vertical_pull'
    if (exercise.category === 'skill') {
      family = focusToFamily[log.focusArea] || 'straight_arm_pull'
    }
    
    // Aggregate by family
    const existing = familyGroups.get(family) || {
      totalSets: 0,
      totalReps: 0,
      exerciseCount: 0,
      completedCount: 0,
    }
    
    existing.totalSets += exercise.sets
    existing.totalReps += (exercise.reps || 0) * exercise.sets
    existing.exerciseCount++
    existing.completedCount++
    
    familyGroups.set(family, existing)
  }
  
  // Convert to results
  for (const [family, data] of familyGroups) {
    // Calculate weekly volume prior to this session
    const weeklyVolumePrior = calculateWeeklyVolumeFromLogs(previousLogs, family, logDate)
    
    // Determine goal type from session type
    const goalType = log.sessionType === 'skill' ? 'skill' as const :
                     log.sessionType === 'strength' ? 'strength' as const :
                     'strength' as const
    
    // Calculate quality based on completion
    const completionRatio = data.completedCount / data.exerciseCount
    const qualityRating = completionRatio >= 0.95 ? 'excellent' as const :
                         completionRatio >= 0.8 ? 'good' as const :
                         completionRatio >= 0.6 ? 'moderate' as const : 'poor' as const
    
    // Average reps per set
    const avgReps = data.totalSets > 0 ? Math.round(data.totalReps / data.totalSets) : 5
    
    results.push({
      movementFamily: family,
      goalType,
      repsPerformed: avgReps,
      setsPerformed: data.totalSets,
      performanceMetric: data.totalReps,
      difficultyRating: log.perceivedDifficulty || 'normal',
      weeklyVolumePrior,
      performanceVsPrevious: 'unknown', // Would need historical comparison
      qualityRating,
    })
  }
  
  return results
}

// =============================================================================
// PROGRAM GENERATION HELPERS
// =============================================================================

/**
 * Envelope-based exercise prescription
 * Returns parameters for a specific exercise based on learned athlete response
 */
export interface EnvelopeExercisePrescription {
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  intensity: 'light' | 'moderate' | 'heavy' | 'max'
  densityLevel: 'low_density' | 'moderate_density' | 'high_density'
  
  // Confidence and explanation
  prescriptionConfidence: number
  rationale: string
  
  // Warnings if approaching limits
  volumeWarning?: string
  fatigueWarning?: string
}

/**
 * Get envelope-based exercise prescription
 */
export async function getEnvelopeExercisePrescription(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power',
  currentWeeklyVolume: number,
  sessionContext: {
    isFirstSetOfFamily: boolean
    sessionDensityTarget: 'low_density' | 'moderate_density' | 'high_density'
    availableTimeMinutes: number
  }
): Promise<EnvelopeExercisePrescription> {
  try {
    const envelope = await getOrCreateEnvelope(athleteId, movementFamily, goalType)
    const recs = getEnvelopeBasedRecommendations(envelope)
    
    // Calculate sets based on remaining volume capacity
    const remainingCapacity = Math.max(0, envelope.toleratedWeeklyVolumeMax - currentWeeklyVolume)
    const optimalSets = Math.round((envelope.preferredSetRangeMin + envelope.preferredSetRangeMax) / 2)
    const recommendedSets = Math.min(optimalSets, Math.max(2, remainingCapacity))
    
    // Determine intensity based on goal type and fatigue proximity
    let intensity: 'light' | 'moderate' | 'heavy' | 'max' = 'moderate'
    if (goalType === 'strength') {
      intensity = currentWeeklyVolume < envelope.preferredWeeklyVolumeMin ? 'heavy' : 'moderate'
    } else if (goalType === 'hypertrophy') {
      intensity = 'moderate'
    } else if (goalType === 'endurance') {
      intensity = 'light'
    }
    
    // Adjust for fatigue proximity
    const volumeRatio = currentWeeklyVolume / envelope.fatigueThreshold
    if (volumeRatio > 0.85) {
      intensity = 'light'
    }
    
    // Build prescription
    const prescription: EnvelopeExercisePrescription = {
      sets: recommendedSets,
      repsMin: envelope.preferredRepRangeMin,
      repsMax: envelope.preferredRepRangeMax,
      restSeconds: envelope.preferredDensityLevel === 'high_density' ? 60 :
                   envelope.preferredDensityLevel === 'low_density' ? 150 : 90,
      intensity,
      densityLevel: envelope.preferredDensityLevel,
      prescriptionConfidence: envelope.confidenceScore,
      rationale: buildPrescriptionRationale(envelope, currentWeeklyVolume, remainingCapacity),
    }
    
    // Add warnings
    if (volumeRatio > 0.85) {
      prescription.volumeWarning = `Approaching weekly volume threshold (${Math.round(volumeRatio * 100)}%). Consider lighter work.`
    }
    
    if (volumeRatio > 1.0) {
      prescription.fatigueWarning = `Exceeding learned fatigue threshold. Performance may decline.`
    }
    
    return prescription
  } catch (error) {
    console.warn('[Envelope] Could not get exercise prescription:', error)
    // Return conservative defaults
    return {
      sets: 3,
      repsMin: 5,
      repsMax: 8,
      restSeconds: 90,
      intensity: 'moderate',
      densityLevel: 'moderate_density',
      prescriptionConfidence: 0,
      rationale: 'Using standard defaults. Enable envelope learning with consistent logging.',
    }
  }
}

function buildPrescriptionRationale(
  envelope: PerformanceEnvelope,
  currentVolume: number,
  remainingCapacity: number
): string {
  const familyLabel = formatFamilyName(envelope.movementFamily)
  
  if (envelope.confidenceScore < 0.3) {
    return `Standard ${familyLabel} prescription. More training data will personalize this.`
  }
  
  const parts: string[] = []
  
  // Rep range rationale
  if (envelope.repZoneConfidence > 0.4) {
    parts.push(`${envelope.preferredRepRangeMin}-${envelope.preferredRepRangeMax} reps matches your best response`)
  }
  
  // Volume rationale
  if (envelope.weeklyVolumeConfidence > 0.4) {
    const volumePercent = Math.round((currentVolume / envelope.preferredWeeklyVolumeMax) * 100)
    parts.push(`Weekly volume at ${volumePercent}% of optimal range`)
  }
  
  // Capacity warning
  if (remainingCapacity < 6) {
    parts.push(`${remainingCapacity} sets remaining before fatigue threshold`)
  }
  
  return parts.length > 0 
    ? parts.join('. ') + '.'
    : `${familyLabel} prescription based on your training history.`
}

/**
 * Get full program generation context from all envelopes
 */
export interface ProgramEnvelopeContext {
  envelopes: Map<MovementFamily, PerformanceEnvelope>
  
  // Aggregate insights
  primaryLimitingFamily: MovementFamily | null
  familiesNearFatigueThreshold: MovementFamily[]
  familiesWithHighConfidence: MovementFamily[]
  
  // Programming recommendations
  volumeDistribution: Map<MovementFamily, { recommended: number; max: number }>
  repRangeOverrides: Map<MovementFamily, { min: number; max: number }>
  densityPreferences: Map<MovementFamily, 'low_density' | 'moderate_density' | 'high_density'>
  
  // Coaching summary
  coachingSummary: string
}

export async function getProgramEnvelopeContext(
  athleteId: string,
  targetGoalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power',
  relevantFamilies: MovementFamily[]
): Promise<ProgramEnvelopeContext> {
  const envelopes = new Map<MovementFamily, PerformanceEnvelope>()
  const volumeDistribution = new Map<MovementFamily, { recommended: number; max: number }>()
  const repRangeOverrides = new Map<MovementFamily, { min: number; max: number }>()
  const densityPreferences = new Map<MovementFamily, 'low_density' | 'moderate_density' | 'high_density'>()
  
  const familiesNearFatigueThreshold: MovementFamily[] = []
  const familiesWithHighConfidence: MovementFamily[] = []
  let primaryLimitingFamily: MovementFamily | null = null
  let lowestPerformanceTrend: number | null = null
  
  for (const family of relevantFamilies) {
    try {
      const envelope = await getOrCreateEnvelope(athleteId, family, targetGoalType)
      envelopes.set(family, envelope)
      
      // Track high confidence envelopes
      if (envelope.confidenceScore >= 0.5) {
        familiesWithHighConfidence.push(family)
      }
      
      // Track declining families
      if (envelope.performanceTrend === 'declining' && envelope.trendConfidence > 0.4) {
        familiesNearFatigueThreshold.push(family)
        
        // Track primary limiting family
        const trendScore = envelope.trendConfidence
        if (lowestPerformanceTrend === null || trendScore > lowestPerformanceTrend) {
          lowestPerformanceTrend = trendScore
          primaryLimitingFamily = family
        }
      }
      
      // Build volume distribution
      if (envelope.confidenceScore >= 0.3) {
        volumeDistribution.set(family, {
          recommended: Math.round((envelope.preferredWeeklyVolumeMin + envelope.preferredWeeklyVolumeMax) / 2),
          max: envelope.toleratedWeeklyVolumeMax,
        })
      }
      
      // Build rep range overrides (only if confident)
      if (envelope.repZoneConfidence >= 0.4) {
        repRangeOverrides.set(family, {
          min: envelope.preferredRepRangeMin,
          max: envelope.preferredRepRangeMax,
        })
      }
      
      // Build density preferences
      if (envelope.densityConfidence >= 0.4) {
        densityPreferences.set(family, envelope.preferredDensityLevel)
      }
    } catch (error) {
      console.warn(`[Envelope] Could not get envelope for ${family}:`, error)
    }
  }
  
  // Generate coaching summary
  const summaryParts: string[] = []
  
  if (familiesWithHighConfidence.length > 0) {
    summaryParts.push(`SpartanLab has learned your response patterns for ${familiesWithHighConfidence.length} movement families`)
  }
  
  if (primaryLimitingFamily) {
    summaryParts.push(`${formatFamilyName(primaryLimitingFamily)} may need reduced volume or recovery focus`)
  }
  
  if (repRangeOverrides.size > 0) {
    summaryParts.push(`Rep ranges personalized based on your training history`)
  }
  
  const coachingSummary = summaryParts.length > 0
    ? summaryParts.join('. ') + '.'
    : 'Continue logging workouts to enable personalized programming.'
  
  return {
    envelopes,
    primaryLimitingFamily,
    familiesNearFatigueThreshold,
    familiesWithHighConfidence,
    volumeDistribution,
    repRangeOverrides,
    densityPreferences,
    coachingSummary,
  }
}

/**
 * Check if a deload is recommended based on envelope analysis
 */
export async function shouldRecommendDeload(
  athleteId: string,
  currentWeeklyVolumes: Map<MovementFamily, number>
): Promise<{
  recommendDeload: boolean
  severity: 'mild' | 'moderate' | 'critical'
  affectedFamilies: MovementFamily[]
  rationale: string
  suggestedDuration: number // days
}> {
  const fatigueRisk = await detectEnvelopeFatigueRisk(athleteId, currentWeeklyVolumes)
  
  if (!fatigueRisk.needsDeload) {
    return {
      recommendDeload: false,
      severity: 'mild',
      affectedFamilies: [],
      rationale: 'Training load within productive range.',
      suggestedDuration: 0,
    }
  }
  
  const affectedFamilies = fatigueRisk.familySignals
    .filter(s => s.severity === 'high' || s.severity === 'elevated')
    .map(s => s.movementFamily)
  
  const severity: 'mild' | 'moderate' | 'critical' = 
    fatigueRisk.overallRisk === 'high' ? 'critical' :
    fatigueRisk.overallRisk === 'elevated' ? 'moderate' : 'mild'
  
  return {
    recommendDeload: true,
    severity,
    affectedFamilies,
    rationale: fatigueRisk.coachingNote,
    suggestedDuration: severity === 'critical' ? 7 : severity === 'moderate' ? 5 : 3,
  }
}

// =============================================================================
// SKILLSTATE INTEGRATION
// =============================================================================

/**
 * Get envelope-based insights for a specific skill
 * Aggregates envelope data from all relevant movement families for the skill
 */
export async function getSkillEnvelopeInsights(
  athleteId: string,
  skill: SkillKey,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power' = 'skill'
): Promise<{
  hasData: boolean
  aggregatedConfidence: number
  primaryFamilyInsights: Array<{ family: MovementFamily; insight: string; confidence: number }>
  volumeRecommendation: { weeklyMin: number; weeklyMax: number }
  repRangeRecommendation: { min: number; max: number }
  densityRecommendation: 'low_density' | 'moderate_density' | 'high_density'
  fatigueWarning: string | null
  coachingSummary: string
}> {
  const primaryFamilies = getSkillPrimaryFamilies(skill)
  
  if (primaryFamilies.length === 0) {
    return {
      hasData: false,
      aggregatedConfidence: 0,
      primaryFamilyInsights: [],
      volumeRecommendation: { weeklyMin: 8, weeklyMax: 15 },
      repRangeRecommendation: { min: 3, max: 8 },
      densityRecommendation: 'moderate_density',
      fatigueWarning: null,
      coachingSummary: 'Continue training to build envelope data for this skill.',
    }
  }
  
  const familyInsights: Array<{ family: MovementFamily; insight: string; confidence: number }> = []
  let totalConfidence = 0
  let totalVolume = 0
  let totalRepMin = 0
  let totalRepMax = 0
  let densityVotes: Record<string, number> = { low_density: 0, moderate_density: 0, high_density: 0 }
  let fatigueWarnings: string[] = []
  
  for (const family of primaryFamilies) {
    try {
      const envelope = await getOrCreateEnvelope(athleteId, family, goalType)
      const insight = generateEnvelopeInsight(envelope)
      
      familyInsights.push({
        family,
        insight,
        confidence: envelope.confidenceScore,
      })
      
      totalConfidence += envelope.confidenceScore
      totalVolume += (envelope.preferredWeeklyVolumeMin + envelope.preferredWeeklyVolumeMax) / 2
      totalRepMin += envelope.preferredRepRangeMin
      totalRepMax += envelope.preferredRepRangeMax
      densityVotes[envelope.preferredDensityLevel]++
      
      // Check for fatigue warnings
      if (envelope.performanceTrend === 'declining' && envelope.trendConfidence > 0.4) {
        fatigueWarnings.push(`${formatFamilyName(family)} showing declining performance`)
      }
    } catch (error) {
      console.warn(`[Envelope] Could not get envelope for ${family}:`, error)
    }
  }
  
  const count = familyInsights.length
  if (count === 0) {
    return {
      hasData: false,
      aggregatedConfidence: 0,
      primaryFamilyInsights: [],
      volumeRecommendation: { weeklyMin: 8, weeklyMax: 15 },
      repRangeRecommendation: { min: 3, max: 8 },
      densityRecommendation: 'moderate_density',
      fatigueWarning: null,
      coachingSummary: 'Unable to retrieve envelope data. Using defaults.',
    }
  }
  
  // Calculate aggregated values
  const avgConfidence = totalConfidence / count
  const avgVolume = Math.round(totalVolume / count)
  const avgRepMin = Math.round(totalRepMin / count)
  const avgRepMax = Math.round(totalRepMax / count)
  
  // Find most voted density
  const densityPref = Object.entries(densityVotes).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )[0] as 'low_density' | 'moderate_density' | 'high_density'
  
  // Generate coaching summary
  const skillLabel = skill.replace(/_/g, ' ')
  let summary = ''
  if (avgConfidence < 0.3) {
    summary = `Building ${skillLabel} response profile. Continue logging for personalized recommendations.`
  } else if (avgConfidence < 0.5) {
    summary = `Early ${skillLabel} patterns emerging. ${avgRepMin}-${avgRepMax} reps with ~${avgVolume} weekly sets seems effective.`
  } else {
    summary = `Your ${skillLabel} responds best to ${avgRepMin}-${avgRepMax} reps, ~${avgVolume} weekly sets.`
    if (densityPref === 'low_density') {
      summary += ' Longer rest periods recommended.'
    } else if (densityPref === 'high_density') {
      summary += ' You handle density work well.'
    }
  }
  
  return {
    hasData: true,
    aggregatedConfidence: avgConfidence,
    primaryFamilyInsights: familyInsights,
    volumeRecommendation: { weeklyMin: Math.max(4, avgVolume - 4), weeklyMax: avgVolume + 4 },
    repRangeRecommendation: { min: avgRepMin, max: avgRepMax },
    densityRecommendation: densityPref,
    fatigueWarning: fatigueWarnings.length > 0 ? fatigueWarnings.join('; ') : null,
    coachingSummary: summary,
  }
}

/**
 * Use SkillState changes to inform envelope updates
 * When skill state changes (e.g., milestone reached, regression detected),
 * this provides feedback to the envelope system
 */
export async function feedbackSkillStateToEnvelope(
  athleteId: string,
  skill: SkillKey,
  feedback: {
    changeType: 'improvement' | 'plateau' | 'regression' | 'milestone'
    previousLevel: number
    currentLevel: number
    trainingWeeks: number
  }
): Promise<void> {
  const primaryFamilies = getSkillPrimaryFamilies(skill)
  
  for (const family of primaryFamilies) {
    try {
      // Get current envelope
      const envelope = await getOrCreateEnvelope(athleteId, family, 'skill')
      
      // Apply skill-level feedback to envelope
      // This is a soft signal - doesn't override workout-level data but influences trend
      if (feedback.changeType === 'improvement' || feedback.changeType === 'milestone') {
        // Positive skill progress suggests current training parameters are effective
        // No change needed - the workout signals will naturally reflect this
      } else if (feedback.changeType === 'regression') {
        // Skill regression may indicate volume/intensity issues
        // Flag for review but don't auto-adjust (could be life factors)
        console.log(`[Envelope] Skill regression detected for ${skill} - monitoring ${family} envelope`)
      } else if (feedback.changeType === 'plateau' && feedback.trainingWeeks > 4) {
        // Extended plateau might indicate need for programming adjustment
        console.log(`[Envelope] Extended plateau detected for ${skill} - ${family} may need variation`)
      }
    } catch (error) {
      console.warn(`[Envelope] Could not feed skill state to envelope for ${family}:`, error)
    }
  }
}

// =============================================================================
// CONSTRAINT DETECTION INTEGRATION
// =============================================================================

/**
 * Constraint category to movement family mapping
 * Used to connect detected constraints with their related envelope data
 */
const CONSTRAINT_TO_FAMILIES: Record<string, MovementFamily[]> = {
  pull_strength: ['vertical_pull', 'horizontal_pull'],
  straight_arm_pull: ['straight_arm_pull'],
  straight_arm_push: ['straight_arm_push'],
  compression: ['compression_core'],
  push_strength: ['vertical_push', 'horizontal_push', 'dip_pattern'],
  hip_mobility: ['mobility', 'hinge_pattern'],
  shoulder_mobility: ['mobility', 'scapular_control'],
  wrist_tolerance: ['joint_integrity'],
  core_stability: ['compression_core', 'anti_extension_core'],
  explosive_pull: ['explosive_pull', 'vertical_pull'],
  rings_stability: ['rings_stability', 'rings_strength'],
  scapular_control: ['scapular_control'],
}

/**
 * Get envelope-informed constraint recommendations
 * Uses envelope data to provide more specific constraint intervention guidance
 */
export async function getEnvelopeInformedConstraintGuidance(
  athleteId: string,
  constraintCategory: string,
  constraintSeverity: number
): Promise<{
  hasEnvelopeData: boolean
  recommendedVolume: { weekly: number; perSession: number }
  recommendedRepRange: { min: number; max: number }
  recommendedDensity: 'low_density' | 'moderate_density' | 'high_density'
  progressionPace: 'conservative' | 'moderate' | 'aggressive'
  guidance: string
}> {
  const relatedFamilies = CONSTRAINT_TO_FAMILIES[constraintCategory] || []
  
  if (relatedFamilies.length === 0) {
    return getDefaultConstraintGuidance(constraintSeverity)
  }
  
  // Get envelopes for related families
  let totalVolume = 0
  let totalRepMin = 0
  let totalRepMax = 0
  let totalConfidence = 0
  let envelopeCount = 0
  let hasDecliningTrend = false
  let densityVotes: Record<string, number> = { low_density: 0, moderate_density: 0, high_density: 0 }
  
  for (const family of relatedFamilies) {
    try {
      const envelope = await getOrCreateEnvelope(athleteId, family, 'skill')
      
      if (envelope.confidenceScore > 0.2) {
        totalVolume += (envelope.preferredWeeklyVolumeMin + envelope.preferredWeeklyVolumeMax) / 2
        totalRepMin += envelope.preferredRepRangeMin
        totalRepMax += envelope.preferredRepRangeMax
        totalConfidence += envelope.confidenceScore
        densityVotes[envelope.preferredDensityLevel]++
        envelopeCount++
        
        if (envelope.performanceTrend === 'declining') {
          hasDecliningTrend = true
        }
      }
    } catch (error) {
      // Continue with other families
    }
  }
  
  if (envelopeCount === 0) {
    return getDefaultConstraintGuidance(constraintSeverity)
  }
  
  // Calculate envelope-informed recommendations
  const avgVolume = Math.round(totalVolume / envelopeCount)
  const avgRepMin = Math.round(totalRepMin / envelopeCount)
  const avgRepMax = Math.round(totalRepMax / envelopeCount)
  const avgConfidence = totalConfidence / envelopeCount
  
  // Adjust volume based on constraint severity
  // Higher severity = more conservative volume
  const volumeMultiplier = constraintSeverity > 70 ? 0.6 :
                          constraintSeverity > 50 ? 0.8 :
                          constraintSeverity > 30 ? 0.9 : 1.0
  
  const recommendedWeekly = Math.round(avgVolume * volumeMultiplier)
  const recommendedPerSession = Math.round(recommendedWeekly / 3) // Assume 3 sessions/week
  
  // Find density preference
  const densityPref = Object.entries(densityVotes).reduce((a, b) => 
    a[1] > b[1] ? a : b
  )[0] as 'low_density' | 'moderate_density' | 'high_density'
  
  // Determine progression pace based on constraint severity and trend
  let progressionPace: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  if (constraintSeverity > 60 || hasDecliningTrend) {
    progressionPace = 'conservative'
  } else if (constraintSeverity < 30 && avgConfidence > 0.5) {
    progressionPace = 'aggressive'
  }
  
  // Generate guidance
  const constraintLabel = constraintCategory.replace(/_/g, ' ')
  let guidance = `For ${constraintLabel}: `
  
  if (avgConfidence > 0.4) {
    guidance += `Your envelope data suggests ${avgRepMin}-${avgRepMax} reps, ~${recommendedWeekly} weekly sets. `
  }
  
  if (constraintSeverity > 50) {
    guidance += 'Current constraint severity requires conservative progression. '
  }
  
  if (hasDecliningTrend) {
    guidance += 'Related movement family performance is declining - prioritize recovery. '
  }
  
  if (densityPref === 'low_density') {
    guidance += 'Favor longer rest periods for this work.'
  } else if (densityPref === 'high_density' && constraintSeverity < 40) {
    guidance += 'You handle density work well - circuit formats may be effective.'
  }
  
  return {
    hasEnvelopeData: true,
    recommendedVolume: { weekly: recommendedWeekly, perSession: recommendedPerSession },
    recommendedRepRange: { min: avgRepMin, max: avgRepMax },
    recommendedDensity: densityPref,
    progressionPace,
    guidance: guidance.trim(),
  }
}

/**
 * Default constraint guidance when no envelope data is available
 */
function getDefaultConstraintGuidance(constraintSeverity: number): {
  hasEnvelopeData: boolean
  recommendedVolume: { weekly: number; perSession: number }
  recommendedRepRange: { min: number; max: number }
  recommendedDensity: 'low_density' | 'moderate_density' | 'high_density'
  progressionPace: 'conservative' | 'moderate' | 'aggressive'
  guidance: string
} {
  // Conservative defaults based on constraint severity
  const weekly = constraintSeverity > 60 ? 8 : constraintSeverity > 40 ? 12 : 15
  
  return {
    hasEnvelopeData: false,
    recommendedVolume: { weekly, perSession: Math.round(weekly / 3) },
    recommendedRepRange: { min: 3, max: 8 },
    recommendedDensity: 'moderate_density',
    progressionPace: constraintSeverity > 50 ? 'conservative' : 'moderate',
    guidance: 'Using default guidance. Continue logging to enable personalized recommendations.',
  }
}

/**
 * Check if envelope data suggests constraint may be improving
 * Used by constraint detection to avoid flagging improving areas as constraints
 */
export async function isConstraintImproving(
  athleteId: string,
  constraintCategory: string
): Promise<{
  isImproving: boolean
  confidence: number
  trend: 'improving' | 'stable' | 'declining' | 'unknown'
}> {
  const relatedFamilies = CONSTRAINT_TO_FAMILIES[constraintCategory] || []
  
  if (relatedFamilies.length === 0) {
    return { isImproving: false, confidence: 0, trend: 'unknown' }
  }
  
  let improvingCount = 0
  let stableCount = 0
  let decliningCount = 0
  let totalConfidence = 0
  let envelopeCount = 0
  
  for (const family of relatedFamilies) {
    try {
      const envelope = await getOrCreateEnvelope(athleteId, family, 'skill')
      
      if (envelope.trendConfidence > 0.3) {
        if (envelope.performanceTrend === 'improving') improvingCount++
        else if (envelope.performanceTrend === 'stable') stableCount++
        else if (envelope.performanceTrend === 'declining') decliningCount++
        
        totalConfidence += envelope.trendConfidence
        envelopeCount++
      }
    } catch (error) {
      // Continue with other families
    }
  }
  
  if (envelopeCount === 0) {
    return { isImproving: false, confidence: 0, trend: 'unknown' }
  }
  
  const avgConfidence = totalConfidence / envelopeCount
  
  if (improvingCount > decliningCount && improvingCount >= stableCount) {
    return { isImproving: true, confidence: avgConfidence, trend: 'improving' }
  } else if (decliningCount > improvingCount) {
    return { isImproving: false, confidence: avgConfidence, trend: 'declining' }
  } else {
    return { isImproving: false, confidence: avgConfidence, trend: 'stable' }
  }
}

// =============================================================================
// GRADUAL LEARNING SYSTEM
// =============================================================================

/**
 * Configuration for gradual envelope updates
 * 
 * CORE PRINCIPLE: The system should learn like a coach over months,
 * not swing wildly after one unusual session.
 */
const LEARNING_CONFIG = {
  // Minimum signals before making confident recommendations
  MIN_SIGNALS_FOR_CONFIDENCE: 5,
  MIN_SIGNALS_FOR_HIGH_CONFIDENCE: 12,
  
  // Weight decay for recency (days)
  RECENCY_DECAY_DAYS: 90,
  
  // Maximum single-signal influence on envelope (prevents overreaction)
  MAX_SINGLE_SIGNAL_INFLUENCE: 0.15,
  
  // Smoothing factor for exponential moving average
  EMA_ALPHA: 0.2,
  
  // Minimum days between significant envelope updates
  MIN_DAYS_BETWEEN_MAJOR_UPDATES: 7,
  
  // Data quality thresholds
  MIN_COMPLETION_FOR_QUALITY: 0.7,
  MIN_DATA_QUALITY_FOR_LEARNING: 'partial' as const,
}

/**
 * Gradual envelope update with stability controls
 * 
 * This function ensures the system learns gradually and doesn't overreact
 * to single unusual sessions. Updates are weighted by:
 * - Signal quality (complete logs > partial logs)
 * - Recency (recent signals weighted higher)
 * - Consistency (aligned signals > conflicting signals)
 * - Confidence bounds (low confidence = conservative changes)
 */
export async function applyGradualLearning(
  athleteId: string,
  movementFamily: MovementFamily,
  goalType: 'strength' | 'skill' | 'endurance' | 'hypertrophy' | 'power',
  newSignal: TrainingResponseSignal
): Promise<{
  updated: boolean
  changesMade: string[]
  newConfidence: number
  learningNote: string
}> {
  try {
    const envelope = await getOrCreateEnvelope(athleteId, movementFamily, goalType)
    const changesMade: string[] = []
    
    // Check if signal quality is sufficient for learning
    if (newSignal.dataQuality === 'minimal' || newSignal.completionRatio < LEARNING_CONFIG.MIN_COMPLETION_FOR_QUALITY) {
      return {
        updated: false,
        changesMade: [],
        newConfidence: envelope.confidenceScore,
        learningNote: 'Signal quality too low for envelope updates. Complete more of the session for better learning.',
      }
    }
    
    // Calculate signal weight based on quality and recency
    const signalWeight = calculateSignalWeight(newSignal)
    
    // Cap influence to prevent overreaction
    const boundedWeight = Math.min(signalWeight, LEARNING_CONFIG.MAX_SINGLE_SIGNAL_INFLUENCE)
    
    // Calculate new values using exponential moving average
    const alpha = LEARNING_CONFIG.EMA_ALPHA * boundedWeight
    
    // Update rep range preference (only if signal shows clear rep zone effectiveness)
    if (newSignal.performanceVsPrevious === 'improved' || 
        (newSignal.difficultyRating === 'normal' && newSignal.completionRatio > 0.9)) {
      const newRepMin = smoothUpdate(envelope.preferredRepRangeMin, Math.max(1, newSignal.repsPerformed - 2), alpha)
      const newRepMax = smoothUpdate(envelope.preferredRepRangeMax, newSignal.repsPerformed + 2, alpha)
      
      if (Math.abs(newRepMin - envelope.preferredRepRangeMin) > 0.5) {
        changesMade.push(`Rep range adjusted slightly toward ${Math.round(newRepMin)}-${Math.round(newRepMax)}`)
      }
    }
    
    // Update volume tolerance (track weekly volume patterns)
    if (newSignal.weeklyVolumeAfter > 0) {
      const volumeWasProductive = newSignal.performanceVsPrevious !== 'declined' && 
                                   newSignal.difficultyRating !== 'hard'
      
      if (volumeWasProductive) {
        // This volume level was productive - nudge preferred volume up slightly
        const newPreferred = smoothUpdate(
          (envelope.preferredWeeklyVolumeMin + envelope.preferredWeeklyVolumeMax) / 2,
          newSignal.weeklyVolumeAfter,
          alpha * 0.5 // Volume changes even more conservatively
        )
        changesMade.push(`Volume tolerance refined`)
      } else if (newSignal.weeklyVolumeAfter > envelope.toleratedWeeklyVolumeMax) {
        // Volume exceeded tolerance and performance suffered
        changesMade.push(`Fatigue threshold signal recorded`)
      }
    }
    
    // Update density preference
    if (newSignal.completionRatio > 0.85 && !newSignal.sessionTruncated) {
      if (newSignal.sessionDensity !== envelope.preferredDensityLevel) {
        // Successful session at different density - note but don't immediately change
        changesMade.push(`Density tolerance data recorded`)
      }
    }
    
    // Update confidence score
    const newConfidence = calculateUpdatedConfidence(envelope, newSignal)
    
    // Generate learning note
    let learningNote = ''
    if (changesMade.length === 0) {
      learningNote = 'Session recorded. Envelope stable - current parameters appear effective.'
    } else if (envelope.signalCount < LEARNING_CONFIG.MIN_SIGNALS_FOR_CONFIDENCE) {
      learningNote = `Session ${envelope.signalCount + 1} of ${LEARNING_CONFIG.MIN_SIGNALS_FOR_CONFIDENCE} needed for confident recommendations.`
    } else {
      learningNote = `Envelope updated: ${changesMade.join(', ')}.`
    }
    
    return {
      updated: changesMade.length > 0,
      changesMade,
      newConfidence,
      learningNote,
    }
  } catch (error) {
    console.warn('[Envelope] Could not apply gradual learning:', error)
    return {
      updated: false,
      changesMade: [],
      newConfidence: 0,
      learningNote: 'Unable to update envelope. Error recorded.',
    }
  }
}

/**
 * Calculate signal weight based on quality factors
 */
function calculateSignalWeight(signal: TrainingResponseSignal): number {
  let weight = 0.5 // Base weight
  
  // Quality bonus
  if (signal.dataQuality === 'complete') weight += 0.25
  else if (signal.dataQuality === 'partial') weight += 0.1
  
  // Completion bonus
  weight += signal.completionRatio * 0.15
  
  // Non-truncated bonus
  if (!signal.sessionTruncated) weight += 0.05
  
  // No skips/subs bonus
  if (signal.exercisesSkipped === 0 && signal.exercisesSubstituted === 0) weight += 0.05
  
  // Recency weight
  const daysSinceSignal = (Date.now() - new Date(signal.recordedAt).getTime()) / (24 * 60 * 60 * 1000)
  const recencyWeight = Math.max(0.3, 1 - (daysSinceSignal / LEARNING_CONFIG.RECENCY_DECAY_DAYS))
  
  return weight * recencyWeight
}

/**
 * Smooth update using exponential moving average
 */
function smoothUpdate(current: number, newValue: number, alpha: number): number {
  return current * (1 - alpha) + newValue * alpha
}

/**
 * Calculate updated confidence score
 */
function calculateUpdatedConfidence(
  envelope: PerformanceEnvelope, 
  newSignal: TrainingResponseSignal
): number {
  const signalCount = envelope.signalCount + 1
  
  // Base confidence from signal count
  let confidence = 0
  if (signalCount >= LEARNING_CONFIG.MIN_SIGNALS_FOR_HIGH_CONFIDENCE) {
    confidence = 0.7
  } else if (signalCount >= LEARNING_CONFIG.MIN_SIGNALS_FOR_CONFIDENCE) {
    confidence = 0.4 + (signalCount - LEARNING_CONFIG.MIN_SIGNALS_FOR_CONFIDENCE) * 0.03
  } else {
    confidence = signalCount * 0.08
  }
  
  // Boost from data quality
  if (newSignal.dataQuality === 'complete') confidence += 0.05
  
  // Boost from recent activity
  if (envelope.recentSignalCount > 3) confidence += 0.1
  
  return Math.min(0.95, confidence) // Cap at 0.95 - never fully certain
}

/**
 * Get learning status summary for an athlete
 */
export async function getEnvelopeLearningStatus(
  athleteId: string
): Promise<{
  totalEnvelopes: number
  highConfidenceCount: number
  learningInProgress: number
  needsMoreData: number
  overallLearningProgress: number
  summary: string
}> {
  try {
    const envelopes = await getAthleteEnvelopes(athleteId)
    
    let highConfidenceCount = 0
    let learningInProgress = 0
    let needsMoreData = 0
    
    for (const envelope of envelopes) {
      if (envelope.confidenceScore >= 0.6) {
        highConfidenceCount++
      } else if (envelope.signalCount >= LEARNING_CONFIG.MIN_SIGNALS_FOR_CONFIDENCE) {
        learningInProgress++
      } else {
        needsMoreData++
      }
    }
    
    const totalEnvelopes = envelopes.length
    const overallLearningProgress = totalEnvelopes > 0 
      ? (highConfidenceCount + learningInProgress * 0.5) / totalEnvelopes
      : 0
    
    let summary = ''
    if (totalEnvelopes === 0) {
      summary = 'Start logging workouts to enable personalized programming.'
    } else if (highConfidenceCount > totalEnvelopes * 0.5) {
      summary = `SpartanLab has learned your training response for ${highConfidenceCount} movement families.`
    } else if (learningInProgress > 0) {
      summary = `Building your response profile. ${highConfidenceCount} families learned, ${learningInProgress} in progress.`
    } else {
      summary = 'Early learning phase. Continue consistent logging for personalized recommendations.'
    }
    
    return {
      totalEnvelopes,
      highConfidenceCount,
      learningInProgress,
      needsMoreData,
      overallLearningProgress,
      summary,
    }
  } catch (error) {
    console.warn('[Envelope] Could not get learning status:', error)
    return {
      totalEnvelopes: 0,
      highConfidenceCount: 0,
      learningInProgress: 0,
      needsMoreData: 0,
      overallLearningProgress: 0,
      summary: 'Unable to retrieve learning status.',
    }
  }
}
