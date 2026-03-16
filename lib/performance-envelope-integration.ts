/**
 * Performance Envelope Integration
 * 
 * Connects Performance Envelope Modeling to program generation,
 * adaptive progression, and workout logging.
 */

import { getAthleteEnvelopes, getOrCreateEnvelope, recordSignal, updateEnvelopeFromSignals } from './performance-envelope-service'
import { generateEnvelopeInsight, getEnvelopeBasedRecommendations, type PerformanceEnvelope, type TrainingResponseSignal } from './performance-envelope-engine'
import type { MovementFamily } from './movement-family-registry'
import type { WorkoutLog } from './workout-log-service'

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
