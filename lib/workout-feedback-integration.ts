// Workout Feedback Integration
// Closes the loop by processing workout logs and updating all relevant engine systems
// Ensures the AI learns from actual athlete behavior

import { recordSignal, type TrainingResponseSignal } from './performance-envelope-service'
import { type RepZone, type DensityLevel } from './performance-envelope-engine'
import { saveSkillState, type SkillKey, type SkillStateInput } from './skill-state-service'
import { getExerciseClassification } from './exercise-classification-registry'
import type { MovementFamily, TrainingGoalType } from './movement-family-registry'
import { 
  getActiveProgramVersion, 
  type ProgramVersion 
} from './program-version-service'
import { 
  getWeeklyVolumeForFamily, 
  getWeeklySessionCountForFamily 
} from './volume-analyzer'

// =============================================================================
// TYPES
// =============================================================================

export interface WorkoutLogData {
  userId: string
  workoutId: string
  programVersionId?: string
  completedAt: string
  totalDurationMinutes: number
  difficultyRating: 'easy' | 'normal' | 'hard'
  wasTimeCompressed: boolean
  exercises: ExerciseLogData[]
  notes?: string
}

export interface ExerciseLogData {
  exerciseId: string
  exerciseName: string
  completed: boolean
  skipped: boolean
  replaced: boolean
  replacementId?: string
  sets: SetLogData[]
  progressionAdjusted?: 'up' | 'down' | 'none'
}

export interface SetLogData {
  setNumber: number
  targetReps: number
  actualReps: number
  targetHoldSeconds?: number
  actualHoldSeconds?: number
  weight?: number
  rpe?: number
  notes?: string
}

export interface WorkoutFeedbackResult {
  signalsRecorded: number
  skillStatesUpdated: string[]
  adaptationsTriggered: string[]
  envelopeUpdates: string[]
  warnings: string[]
}

// =============================================================================
// MAIN PROCESSING FUNCTION
// =============================================================================

/**
 * Process a completed workout and update all relevant engine systems
 */
export async function processWorkoutFeedback(
  log: WorkoutLogData
): Promise<WorkoutFeedbackResult> {
  const result: WorkoutFeedbackResult = {
    signalsRecorded: 0,
    skillStatesUpdated: [],
    adaptationsTriggered: [],
    envelopeUpdates: [],
    warnings: [],
  }
  
  try {
    // 1. Process each exercise for envelope signals
    for (const exercise of log.exercises) {
      if (exercise.skipped) continue
      
      const signal = buildEnvelopeSignal(log, exercise)
      if (signal) {
        await recordSignal(signal)
        result.signalsRecorded++
        
        // Track movement family updates
        if (signal.movementFamily) {
          result.envelopeUpdates.push(signal.movementFamily)
        }
      }
    }
    
    // 2. Update skill states for skill exercises
    const skillUpdates = await processSkillUpdates(log)
    result.skillStatesUpdated = skillUpdates.updatedSkills
    
    // 3. Detect adaptation triggers
    const adaptations = detectAdaptationTriggers(log)
    result.adaptationsTriggered = adaptations
    
    // 4. Record any issues or warnings
    if (log.difficultyRating === 'hard' && log.wasTimeCompressed) {
      result.warnings.push('Session was both hard and time-compressed - consider recovery')
    }
    
    const skippedCount = log.exercises.filter(e => e.skipped).length
    if (skippedCount > 2) {
      result.warnings.push(`${skippedCount} exercises skipped - may need program adjustment`)
    }
    
  } catch (error) {
    result.warnings.push(`Error processing feedback: ${error}`)
  }
  
  return result
}

// =============================================================================
// SIGNAL BUILDING
// =============================================================================

function buildEnvelopeSignal(
  log: WorkoutLogData,
  exercise: ExerciseLogData
): TrainingResponseSignal | null {
  // Get exercise classification to determine movement family
  const classification = getExerciseClassification(exercise.exerciseId)
  const movementFamily = classification?.primaryFamily || inferMovementFamily(exercise.exerciseName)
  
  if (!movementFamily) return null
  
  // Calculate metrics from sets
  const completedSets = exercise.sets.filter(s => s.actualReps > 0 || (s.actualHoldSeconds && s.actualHoldSeconds > 0))
  if (completedSets.length === 0) return null
  
  const totalReps = completedSets.reduce((sum, s) => sum + s.actualReps, 0)
  const avgReps = Math.round(totalReps / completedSets.length)
  const maxHold = Math.max(...completedSets.map(s => s.actualHoldSeconds || 0))
  const avgRpe = completedSets.filter(s => s.rpe).reduce((sum, s) => sum + (s.rpe || 0), 0) / 
                 (completedSets.filter(s => s.rpe).length || 1)
  
  // Calculate completion ratio
  const targetReps = exercise.sets.reduce((sum, s) => sum + s.targetReps, 0)
  const completionRatio = targetReps > 0 ? Math.min(1, totalReps / targetReps) : 1
  
  // Determine goal type
  const goalType = inferGoalType(exercise, classification)
  
  // Calculate performance score (0-100)
  const performanceScore = calculatePerformanceScore(exercise, completionRatio, avgRpe)
  
  // Get weekly volume context (movement-family specific)
  const sessionDate = new Date(log.completedAt)
  const weeklyVolumePrior = getWeeklyVolumeForFamily(movementFamily, sessionDate)
  const weeklySessionCount = getWeeklySessionCountForFamily(movementFamily, sessionDate)
  
  // Classify rep zone (granular)
  const repZone = classifyRepZone(avgReps)
  
  // Determine session density
  const sessionDensity = inferSessionDensity(log.totalDurationMinutes, log.exercises.length, completedSets.length)
  
  // Determine performance vs previous (simplified - would need historical context)
  const performanceVsPrevious = inferPerformanceComparison(performanceScore, exercise.progressionAdjusted)
  
  // Calculate quality rating
  const qualityRating = calculateQualityRating(completionRatio, log.difficultyRating, avgRpe)
  
  // Determine data quality
  const dataQuality = determineDataQuality(exercise, log)
  
  // Build enhanced signal
  const signal: TrainingResponseSignal = {
    athleteId: log.userId,
    movementFamily,
    goalType,
    
    // Performance data
    repsPerformed: avgReps,
    setsPerformed: completedSets.length,
    repRange: avgReps <= 3 ? 'low' : avgReps <= 6 ? 'moderate' : 'high',
    repZone,
    performanceMetric: maxHold > 0 ? maxHold : performanceScore,
    performanceVsPrevious,
    
    // Session context
    sessionDensity,
    restSecondsUsed: estimateRestSeconds(sessionDensity),
    sessionDurationMinutes: log.totalDurationMinutes,
    
    // Weekly volume context (movement-family specific)
    weeklyVolumePrior,
    weeklyVolumeAfter: weeklyVolumePrior + completedSets.length,
    weeklySessionCount: weeklySessionCount + 1,
    
    // Response indicators
    difficultyRating: log.difficultyRating,
    completionRatio,
    qualityRating,
    sessionTruncated: log.wasTimeCompressed,
    exercisesSkipped: log.exercises.filter(e => e.skipped).length,
    exercisesSubstituted: log.exercises.filter(e => e.replaced).length,
    
    // Progression tracking
    progressionAdjustment: exercise.progressionAdjusted === 'up' ? 'increased' :
                           exercise.progressionAdjusted === 'down' ? 'decreased' :
                           exercise.progressionAdjusted === 'none' ? 'maintained' : 'none',
    wasDeloadSession: false, // Would need deload context
    
    // Metadata
    recordedAt: new Date(log.completedAt),
    dataQuality,
  }
  
  return signal
}

/**
 * Classify reps into granular rep zone
 */
function classifyRepZone(reps: number): RepZone {
  if (reps <= 3) return 'strength_low'
  if (reps <= 6) return 'strength_mid'
  if (reps <= 10) return 'hypertrophy'
  if (reps <= 15) return 'endurance'
  return 'high_rep'
}

/**
 * Infer session density from duration and exercise count
 */
function inferSessionDensity(
  durationMinutes: number,
  exerciseCount: number,
  setCount: number
): DensityLevel {
  if (exerciseCount === 0 || setCount === 0) return 'moderate_density'
  
  // Minutes per set is a good proxy for density
  const minutesPerSet = durationMinutes / setCount
  
  // < 2 min/set = high density (circuit style)
  // 2-4 min/set = moderate density (standard training)
  // > 4 min/set = low density (strength/skill focus with long rest)
  if (minutesPerSet < 2) return 'high_density'
  if (minutesPerSet > 4) return 'low_density'
  return 'moderate_density'
}

/**
 * Estimate rest seconds based on density
 */
function estimateRestSeconds(density: DensityLevel): number {
  switch (density) {
    case 'high_density': return 60
    case 'moderate_density': return 120
    case 'low_density': return 180
    default: return 120
  }
}

/**
 * Infer performance comparison (would be more accurate with historical data)
 */
function inferPerformanceComparison(
  performanceScore: number,
  progressionAdjusted?: 'up' | 'down' | 'none'
): 'improved' | 'maintained' | 'declined' | 'unknown' {
  if (progressionAdjusted === 'up') return 'improved'
  if (progressionAdjusted === 'down') return 'declined'
  if (performanceScore >= 70) return 'maintained'
  if (performanceScore < 50) return 'declined'
  return 'unknown'
}

/**
 * Calculate quality rating based on session metrics
 */
function calculateQualityRating(
  completionRatio: number,
  difficulty: 'easy' | 'normal' | 'hard',
  avgRpe: number
): 'poor' | 'moderate' | 'good' | 'excellent' {
  let score = 0
  
  // Completion contributes 0-40 points
  score += completionRatio * 40
  
  // Difficulty contributes:
  // - 'normal' is ideal (30 points)
  // - 'easy' or 'hard' are less ideal (15-20 points)
  if (difficulty === 'normal') score += 30
  else if (difficulty === 'easy') score += 20
  else score += 15
  
  // RPE in optimal range (7-8.5) adds points
  if (avgRpe >= 7 && avgRpe <= 8.5) score += 30
  else if (avgRpe >= 6 && avgRpe <= 9) score += 20
  else score += 10
  
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'moderate'
  return 'poor'
}

/**
 * Determine data quality based on logging completeness
 */
function determineDataQuality(
  exercise: ExerciseLogData,
  log: WorkoutLogData
): 'complete' | 'partial' | 'minimal' {
  let completenessScore = 0
  
  // Has actual reps for all sets
  const setsWithReps = exercise.sets.filter(s => s.actualReps > 0).length
  if (setsWithReps === exercise.sets.length) completenessScore += 3
  else if (setsWithReps > 0) completenessScore += 1
  
  // Has RPE data
  const setsWithRpe = exercise.sets.filter(s => s.rpe && s.rpe > 0).length
  if (setsWithRpe === exercise.sets.length) completenessScore += 2
  else if (setsWithRpe > 0) completenessScore += 1
  
  // Has difficulty rating
  if (log.difficultyRating) completenessScore += 2
  
  // Has duration
  if (log.totalDurationMinutes > 0) completenessScore += 1
  
  if (completenessScore >= 7) return 'complete'
  if (completenessScore >= 4) return 'partial'
  return 'minimal'
}

function inferMovementFamily(exerciseName: string): MovementFamily | null {
  const name = exerciseName.toLowerCase()
  
  if (name.includes('pull') && !name.includes('apart')) return 'vertical_pull'
  if (name.includes('row')) return 'horizontal_pull'
  if (name.includes('dip')) return 'dip_pattern'
  if (name.includes('push') && name.includes('up')) return 'horizontal_push'
  if (name.includes('front lever')) return 'straight_arm_pull'
  if (name.includes('planche')) return 'straight_arm_push'
  if (name.includes('l-sit') || name.includes('compression')) return 'compression_core'
  if (name.includes('muscle up') || name.includes('muscle-up')) return 'explosive_pull'
  if (name.includes('squat')) return 'squat_pattern'
  if (name.includes('curl')) return 'hypertrophy_accessory'
  
  return null
}

function inferGoalType(
  exercise: ExerciseLogData,
  classification: ReturnType<typeof getExerciseClassification>
): TrainingGoalType {
  // Check classification first
  if (classification?.intents) {
    if (classification.intents.includes('skill')) return 'skill'
    if (classification.intents.includes('strength')) return 'strength'
    if (classification.intents.includes('hypertrophy')) return 'hypertrophy'
    if (classification.intents.includes('power')) return 'power'
    if (classification.intents.includes('endurance')) return 'endurance'
    if (classification.intents.includes('mobility')) return 'mobility'
    if (classification.intents.includes('conditioning')) return 'conditioning'
  }
  
  // Infer from exercise name
  const name = exercise.exerciseName.toLowerCase()
  if (name.includes('hold') || name.includes('lever') || name.includes('planche')) return 'skill'
  if (name.includes('weighted') || name.includes('heavy')) return 'strength'
  if (name.includes('curl') || name.includes('raise') || name.includes('fly')) return 'hypertrophy'
  if (name.includes('explosive') || name.includes('clap') || name.includes('plyo')) return 'power'
  if (name.includes('stretch') || name.includes('mobility')) return 'mobility'
  
  return 'strength'
}

function calculatePerformanceScore(
  exercise: ExerciseLogData,
  completionRatio: number,
  avgRpe: number
): number {
  let score = 50 // Base score
  
  // Completion bonus (up to +30)
  score += Math.min(30, completionRatio * 30)
  
  // RPE adjustment (-10 to +10)
  if (avgRpe > 0) {
    if (avgRpe >= 7 && avgRpe <= 8.5) {
      score += 10 // Optimal zone
    } else if (avgRpe < 6) {
      score += 5 // Too easy
    } else if (avgRpe > 9) {
      score -= 10 // Too hard
    }
  }
  
  // Progression bonus/penalty
  if (exercise.progressionAdjusted === 'up') score += 10
  if (exercise.progressionAdjusted === 'down') score -= 5
  
  // Replacement penalty (small)
  if (exercise.replaced) score -= 5
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

// =============================================================================
// SKILL STATE UPDATES
// =============================================================================

interface SkillUpdateResult {
  updatedSkills: string[]
}

async function processSkillUpdates(log: WorkoutLogData): Promise<SkillUpdateResult> {
  const updatedSkills: string[] = []
  const skillExercises = log.exercises.filter(e => isSkillExercise(e))
  
  for (const exercise of skillExercises) {
    const skill = inferSkillFromExercise(exercise)
    if (!skill) continue
    
    // Calculate best metrics from sets
    const holdSets = exercise.sets.filter(s => s.actualHoldSeconds && s.actualHoldSeconds > 0)
    const repSets = exercise.sets.filter(s => s.actualReps > 0)
    
    const bestHold = Math.max(...holdSets.map(s => s.actualHoldSeconds || 0), 0)
    const bestReps = Math.max(...repSets.map(s => s.actualReps), 0)
    
    // Build update
    const update: SkillStateInput = {
      currentLevel: exercise.progressionAdjusted === 'up' ? 1 : 0, // Placeholder - would need current level
      currentBestMetric: bestHold > 0 ? bestHold : bestReps,
      metricType: bestHold > 0 ? 'hold_seconds' : 'reps',
    }
    
    // Update readiness based on difficulty
    if (log.difficultyRating === 'easy') {
      update.readinessScore = 75
    } else if (log.difficultyRating === 'hard') {
      update.readinessScore = 45
    } else {
      update.readinessScore = 60
    }
    
    try {
      await saveSkillState(log.userId, skill, update)
      updatedSkills.push(skill)
    } catch (error) {
      // Log but continue
      console.error(`Failed to update skill state for ${skill}:`, error)
    }
  }
  
  return { updatedSkills }
}

function isSkillExercise(exercise: ExerciseLogData): boolean {
  const name = exercise.exerciseName.toLowerCase()
  const skillKeywords = [
    'front lever', 'back lever', 'planche', 'handstand', 'hspu',
    'muscle up', 'muscle-up', 'l-sit', 'l sit', 'v-sit',
  ]
  return skillKeywords.some(keyword => name.includes(keyword))
}

function inferSkillFromExercise(exercise: ExerciseLogData): SkillKey | null {
  const name = exercise.exerciseName.toLowerCase()
  
  if (name.includes('front lever')) return 'front_lever'
  if (name.includes('back lever')) return 'back_lever'
  if (name.includes('planche')) return 'planche'
  if (name.includes('handstand') || name.includes('hspu')) return 'hspu'
  if (name.includes('muscle up') || name.includes('muscle-up')) return 'muscle_up'
  if (name.includes('l-sit') || name.includes('l sit')) return 'l_sit'
  
  return null
}

// =============================================================================
// ADAPTATION TRIGGERS
// =============================================================================

function detectAdaptationTriggers(log: WorkoutLogData): string[] {
  const triggers: string[] = []
  
  // Multiple hard sessions trigger
  // (Would need historical context - simplified here)
  if (log.difficultyRating === 'hard') {
    triggers.push('hard_session_recorded')
  }
  
  // Frequent skips trigger
  const skippedCount = log.exercises.filter(e => e.skipped).length
  if (skippedCount >= 2) {
    triggers.push('multiple_exercises_skipped')
  }
  
  // Frequent replacements trigger
  const replacedCount = log.exercises.filter(e => e.replaced).length
  if (replacedCount >= 2) {
    triggers.push('multiple_exercises_replaced')
  }
  
  // Time compression pattern
  if (log.wasTimeCompressed) {
    triggers.push('session_time_compressed')
  }
  
  // Progression changes
  const progressionUps = log.exercises.filter(e => e.progressionAdjusted === 'up').length
  const progressionDowns = log.exercises.filter(e => e.progressionAdjusted === 'down').length
  
  if (progressionUps >= 2) {
    triggers.push('multiple_progressions_increased')
  }
  if (progressionDowns >= 2) {
    triggers.push('multiple_progressions_decreased')
  }
  
  return triggers
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Process multiple workout logs (useful for migration or catch-up)
 */
export async function processWorkoutBatch(
  logs: WorkoutLogData[]
): Promise<{
  processed: number
  failed: number
  totalSignals: number
}> {
  let processed = 0
  let failed = 0
  let totalSignals = 0
  
  for (const log of logs) {
    try {
      const result = await processWorkoutFeedback(log)
      processed++
      totalSignals += result.signalsRecorded
    } catch {
      failed++
    }
  }
  
  return { processed, failed, totalSignals }
}

/**
 * Get summary of recent workout patterns for an athlete
 */
export function analyzeWorkoutPatterns(logs: WorkoutLogData[]): {
  avgDifficultyRating: string
  compressionFrequency: number
  commonSkippedFamilies: string[]
  progressionTrend: 'improving' | 'stable' | 'regressing'
} {
  if (logs.length === 0) {
    return {
      avgDifficultyRating: 'normal',
      compressionFrequency: 0,
      commonSkippedFamilies: [],
      progressionTrend: 'stable',
    }
  }
  
  // Calculate average difficulty
  const difficultyScores = { easy: 1, normal: 2, hard: 3 }
  const avgScore = logs.reduce((sum, l) => sum + difficultyScores[l.difficultyRating], 0) / logs.length
  const avgDifficultyRating = avgScore < 1.5 ? 'easy' : avgScore > 2.5 ? 'hard' : 'normal'
  
  // Calculate compression frequency
  const compressionFrequency = logs.filter(l => l.wasTimeCompressed).length / logs.length
  
  // Find commonly skipped movement families
  const skippedFamilies: Record<string, number> = {}
  for (const log of logs) {
    for (const exercise of log.exercises.filter(e => e.skipped)) {
      const family = inferMovementFamily(exercise.exerciseName)
      if (family) {
        skippedFamilies[family] = (skippedFamilies[family] || 0) + 1
      }
    }
  }
  const commonSkippedFamilies = Object.entries(skippedFamilies)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([family]) => family)
  
  // Determine progression trend
  const progressionChanges = logs.flatMap(l => 
    l.exercises.filter(e => e.progressionAdjusted && e.progressionAdjusted !== 'none')
  )
  const ups = progressionChanges.filter(e => e.progressionAdjusted === 'up').length
  const downs = progressionChanges.filter(e => e.progressionAdjusted === 'down').length
  
  let progressionTrend: 'improving' | 'stable' | 'regressing' = 'stable'
  if (ups > downs * 1.5) progressionTrend = 'improving'
  else if (downs > ups * 1.5) progressionTrend = 'regressing'
  
  return {
    avgDifficultyRating,
    compressionFrequency,
    commonSkippedFamilies,
    progressionTrend,
  }
}
