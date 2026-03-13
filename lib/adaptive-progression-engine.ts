// Adaptive Progression Engine
// Intelligent progression decisions for skills, strength, flexibility, and mobility
// Integrates with band tracking, RPE tracking, and fatigue systems

import {
  type ResistanceBandColor,
  BAND_ASSISTANCE_LEVEL,
  ALL_BAND_COLORS,
} from './band-progression-engine'
import { getWorkoutLogs, type WorkoutLog, type WorkoutExercise } from './workout-log-service'
import { getStoredRPESessions, type StoredRPESession } from './fatigue-score-calculator'
import { getFatigueTrainingDecision, type TrainingDecision } from './fatigue-decision-engine'
import { getDailyReadiness } from './daily-readiness'

// =============================================================================
// TYPES
// =============================================================================

export type ProgressionDecision =
  | 'PROGRESS'           // Ready to advance
  | 'MAINTAIN'           // Stay at current level
  | 'REGRESS'            // Step back temporarily
  | 'DELOAD'             // Recovery needed
  | 'REDUCE_BAND'        // Decrease band assistance
  | 'INCREASE_WEIGHT'    // Add load
  | 'INCREASE_HOLD'      // Extend hold time
  | 'INCREASE_REPS'      // Add reps
  | 'ADD_ACCESSORY'      // Add support work
  | 'CHANGE_VARIATION'   // Try different exercise

export type ExerciseType = 'static_skill' | 'dynamic_strength' | 'weighted' | 'flexibility' | 'mobility'

export interface PerformanceRecord {
  date: string
  exerciseId: string
  exerciseName: string
  exerciseType: ExerciseType
  sets: number
  reps?: number
  holdSeconds?: number
  weight?: number
  bandColor?: ResistanceBandColor
  rpe?: number
  completed: boolean
  failed?: boolean
  targetReps?: number
  targetHold?: number
}

export interface ExerciseHistory {
  exerciseId: string
  exerciseName: string
  exerciseType: ExerciseType
  records: PerformanceRecord[]
  lastNSessions: number // How many sessions to analyze
}

export interface ProgressionAnalysis {
  exerciseId: string
  exerciseName: string
  exerciseType: ExerciseType
  decision: ProgressionDecision
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
  coachMessage: string
  
  // Specific recommendations
  recommendations: {
    nextBand?: ResistanceBandColor
    nextWeight?: number
    weightIncrement?: number
    nextHoldTarget?: number
    nextRepTarget?: number
    suggestedVariation?: string
    accessoryToAdd?: string
  }
  
  // Performance signals
  signals: {
    consistentCompletion: boolean
    rpeInRange: boolean
    improving: boolean
    plateaued: boolean
    declining: boolean
    readyForChallenge: boolean
  }
  
  // Historical context
  context: {
    sessionsAnalyzed: number
    avgRPE: number | null
    completionRate: number
    trendDirection: 'improving' | 'stable' | 'declining'
    daysSinceLastProgress: number | null
  }
}

export interface SkillProgressionStatus {
  skillId: string
  skillName: string
  currentLevel: string
  progressionReadiness: 'not_ready' | 'approaching' | 'ready' | 'overdue'
  estimatedSessionsToProgress: number | null
  blockers: string[]
  coachTip: string
}

export interface FlexibilityProgressionStatus {
  skillId: string
  currentDepth: 'beginner' | 'intermediate' | 'advanced' | 'full'
  rangeImprovement: 'none' | 'slight' | 'moderate' | 'significant'
  canProgressPosition: boolean
  nextPosition?: string
  coachTip: string
}

export interface MobilityProgressionStatus {
  skillId: string
  currentLoad: number | null
  loadTolerance: 'low' | 'moderate' | 'good' | 'excellent'
  canIncreaseLoad: boolean
  suggestedLoadIncrease?: number
  rpeAverage: number | null
  coachTip: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SESSIONS_TO_ANALYZE = 5
const MIN_SESSIONS_FOR_DECISION = 2

// Progression thresholds
const PROGRESSION_THRESHOLDS = {
  // Sessions needed to confirm readiness
  SESSIONS_FOR_PROGRESS: 2,
  SESSIONS_FOR_PLATEAU: 5,
  SESSIONS_FOR_REGRESS: 2,
  
  // RPE thresholds
  RPE_EASY: 6,
  RPE_TARGET_LOW: 7,
  RPE_TARGET_HIGH: 8,
  RPE_HARD: 9,
  RPE_MAX: 10,
  
  // Completion thresholds
  COMPLETION_EXCELLENT: 95,
  COMPLETION_GOOD: 85,
  COMPLETION_ACCEPTABLE: 70,
  COMPLETION_POOR: 50,
  
  // Hold time targets (seconds)
  HOLD_MIN_PROGRESS: 8,
  HOLD_TARGET_LOW: 10,
  HOLD_TARGET_HIGH: 15,
  HOLD_MASTERY: 20,
  
  // Weight increments (lbs)
  WEIGHT_INCREMENT_UPPER: 2.5,
  WEIGHT_INCREMENT_LOWER: 5,
  WEIGHT_INCREMENT_HEAVY: 5,
}

// Coach messages for each decision type
const COACH_MESSAGES: Record<ProgressionDecision, string[]> = {
  PROGRESS: [
    "You're ready to level up.",
    "Time to progress to the next stage.",
    "Great consistency. Let's advance.",
  ],
  MAINTAIN: [
    "Stay at this level for now.",
    "Keep building strength here.",
    "More time at this level will help.",
  ],
  REGRESS: [
    "Let's step back to build a stronger foundation.",
    "A temporary step back will help long-term.",
    "Focus on quality at an easier level.",
  ],
  DELOAD: [
    "Your body needs recovery.",
    "Take it easy this session.",
    "Recovery is part of progress.",
  ],
  REDUCE_BAND: [
    "Ready to reduce band assistance.",
    "Try a lighter band next session.",
    "You're getting stronger. Less help needed.",
  ],
  INCREASE_WEIGHT: [
    "Add a small amount of weight.",
    "Time to increase the load.",
    "You're ready for more resistance.",
  ],
  INCREASE_HOLD: [
    "Extend your hold time slightly.",
    "Try holding a bit longer.",
    "Your control is improving. Hold longer.",
  ],
  INCREASE_REPS: [
    "Add another rep next session.",
    "Push for one more rep.",
    "Your endurance is improving.",
  ],
  ADD_ACCESSORY: [
    "Add some accessory work to break the plateau.",
    "Support exercises will help you progress.",
    "Time to add complementary exercises.",
  ],
  CHANGE_VARIATION: [
    "Try a different variation to break the plateau.",
    "A new angle might help.",
    "Switch up the exercise for fresh stimulus.",
  ],
}

// =============================================================================
// PERFORMANCE HISTORY FUNCTIONS
// =============================================================================

/**
 * Extract performance records for a specific exercise from workout logs
 */
export function getExerciseHistory(
  exerciseId: string,
  exerciseName: string,
  exerciseType: ExerciseType,
  sessionCount: number = SESSIONS_TO_ANALYZE
): ExerciseHistory {
  const logs = getWorkoutLogs()
  const rpeSessions = getStoredRPESessions()
  
  // Find all instances of this exercise
  const records: PerformanceRecord[] = []
  
  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime()
  )
  
  for (const log of sortedLogs) {
    // Find matching exercise in this workout
    const exercise = log.exercises.find(e => 
      e.id === exerciseId || 
      e.name.toLowerCase() === exerciseName.toLowerCase()
    )
    
    if (exercise) {
      // Get RPE data if available
      const rpeSession = rpeSessions.find(s => s.workoutId === log.id)
      const rpeData = rpeSession?.exercises.find(e => 
        e.exerciseId === exerciseId || e.exerciseName === exerciseName
      )
      
      const avgRPE = rpeData?.sets.length 
        ? rpeData.sets.reduce((sum, s) => sum + s.actualRPE, 0) / rpeData.sets.length
        : undefined
      
      records.push({
        date: log.sessionDate,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        exerciseType,
        sets: exercise.sets,
        reps: exercise.reps,
        holdSeconds: exercise.holdSeconds,
        weight: exercise.load,
        bandColor: exercise.band?.bandColor,
        rpe: avgRPE,
        completed: exercise.completed,
        failed: !exercise.completed,
      })
      
      if (records.length >= sessionCount) break
    }
  }
  
  return {
    exerciseId,
    exerciseName,
    exerciseType,
    records,
    lastNSessions: records.length,
  }
}

/**
 * Calculate completion rate from records
 */
function calculateCompletionRate(records: PerformanceRecord[]): number {
  if (records.length === 0) return 0
  const completed = records.filter(r => r.completed).length
  return (completed / records.length) * 100
}

/**
 * Calculate average RPE from records
 */
function calculateAverageRPE(records: PerformanceRecord[]): number | null {
  const withRPE = records.filter(r => r.rpe !== undefined)
  if (withRPE.length === 0) return null
  return withRPE.reduce((sum, r) => sum + (r.rpe || 0), 0) / withRPE.length
}

/**
 * Determine performance trend
 */
function determineTrend(records: PerformanceRecord[]): 'improving' | 'stable' | 'declining' {
  if (records.length < 3) return 'stable'
  
  // Compare first half to second half
  const midpoint = Math.floor(records.length / 2)
  const recent = records.slice(0, midpoint)
  const older = records.slice(midpoint)
  
  const recentCompletion = calculateCompletionRate(recent)
  const olderCompletion = calculateCompletionRate(older)
  
  const diff = recentCompletion - olderCompletion
  
  if (diff > 10) return 'improving'
  if (diff < -10) return 'declining'
  return 'stable'
}

// =============================================================================
// PROGRESSION ANALYSIS
// =============================================================================

/**
 * Analyze an exercise and determine progression decision
 */
export function analyzeExerciseProgression(
  exerciseId: string,
  exerciseName: string,
  exerciseType: ExerciseType,
  currentTargets?: {
    targetReps?: number
    targetHold?: number
    targetWeight?: number
    currentBand?: ResistanceBandColor
  }
): ProgressionAnalysis {
  const history = getExerciseHistory(exerciseId, exerciseName, exerciseType)
  const fatigueDecision = getFatigueTrainingDecision()
  const readiness = getDailyReadiness()
  
  const records = history.records
  const completionRate = calculateCompletionRate(records)
  const avgRPE = calculateAverageRPE(records)
  const trend = determineTrend(records)
  
  // Check if we have enough data
  if (records.length < MIN_SESSIONS_FOR_DECISION) {
    return createAnalysis(exerciseId, exerciseName, exerciseType, 'MAINTAIN', 'low',
      'Not enough data to make a progression decision.',
      'Keep training consistently to build a performance baseline.',
      { completionRate, avgRPE, trend, sessionsAnalyzed: records.length }
    )
  }
  
  // Check fatigue/recovery first
  if (fatigueDecision.decision === 'DELOAD_RECOMMENDED' || 
      readiness.readinessTier === 'low') {
    return createAnalysis(exerciseId, exerciseName, exerciseType, 'DELOAD', 'high',
      'Recovery signals indicate a need for reduced intensity.',
      getRandomMessage('DELOAD'),
      { completionRate, avgRPE, trend, sessionsAnalyzed: records.length }
    )
  }
  
  // Analyze based on exercise type
  switch (exerciseType) {
    case 'static_skill':
      return analyzeStaticSkill(history, currentTargets, { completionRate, avgRPE, trend })
    case 'dynamic_strength':
    case 'weighted':
      return analyzeStrengthExercise(history, currentTargets, { completionRate, avgRPE, trend })
    case 'flexibility':
      return analyzeFlexibility(history, { completionRate, avgRPE, trend })
    case 'mobility':
      return analyzeMobility(history, currentTargets, { completionRate, avgRPE, trend })
    default:
      return analyzeStrengthExercise(history, currentTargets, { completionRate, avgRPE, trend })
  }
}

/**
 * Analyze static skill progression (holds)
 */
function analyzeStaticSkill(
  history: ExerciseHistory,
  targets?: { targetHold?: number; currentBand?: ResistanceBandColor },
  context?: { completionRate: number; avgRPE: number | null; trend: string }
): ProgressionAnalysis {
  const records = history.records
  const recentRecords = records.slice(0, PROGRESSION_THRESHOLDS.SESSIONS_FOR_PROGRESS)
  
  // Check for band usage
  const currentBand = targets?.currentBand || records[0]?.bandColor
  const targetHold = targets?.targetHold || PROGRESSION_THRESHOLDS.HOLD_TARGET_HIGH
  
  // Calculate average hold time
  const holdsWithTime = recentRecords.filter(r => r.holdSeconds !== undefined)
  const avgHold = holdsWithTime.length > 0
    ? holdsWithTime.reduce((sum, r) => sum + (r.holdSeconds || 0), 0) / holdsWithTime.length
    : 0
  
  // Check if consistently hitting target
  const hittingTarget = avgHold >= targetHold
  const rpeInRange = context?.avgRPE !== null && 
    context?.avgRPE! <= PROGRESSION_THRESHOLDS.RPE_TARGET_HIGH
  const completionGood = context?.completionRate! >= PROGRESSION_THRESHOLDS.COMPLETION_GOOD
  
  // Decision logic
  let decision: ProgressionDecision = 'MAINTAIN'
  let reasoning = ''
  
  // If using band and performing well, suggest reducing band
  if (currentBand && hittingTarget && rpeInRange && completionGood) {
    const bandLevel = BAND_ASSISTANCE_LEVEL[currentBand]
    if (bandLevel > 1) {
      const nextBandIndex = ALL_BAND_COLORS.indexOf(currentBand) - 1
      const nextBand = nextBandIndex >= 0 ? ALL_BAND_COLORS[nextBandIndex] : undefined
      
      decision = 'REDUCE_BAND'
      reasoning = `Consistently hitting ${avgHold.toFixed(0)}s holds with RPE ${context?.avgRPE?.toFixed(1)}. Ready for less assistance.`
      
      return createAnalysis(
        history.exerciseId, history.exerciseName, 'static_skill',
        decision, 'high', reasoning, getRandomMessage(decision),
        { ...context!, sessionsAnalyzed: records.length },
        { nextBand }
      )
    }
  }
  
  // If no band and performing well, progress to harder variation or longer hold
  if (!currentBand && hittingTarget && rpeInRange && completionGood) {
    if (avgHold >= PROGRESSION_THRESHOLDS.HOLD_MASTERY) {
      decision = 'PROGRESS'
      reasoning = `Mastery level achieved (${avgHold.toFixed(0)}s holds). Ready for next progression.`
    } else {
      decision = 'INCREASE_HOLD'
      reasoning = `Good consistency at ${avgHold.toFixed(0)}s. Increase hold target.`
      
      return createAnalysis(
        history.exerciseId, history.exerciseName, 'static_skill',
        decision, 'high', reasoning, getRandomMessage(decision),
        { ...context!, sessionsAnalyzed: records.length },
        { nextHoldTarget: Math.min(targetHold + 2, PROGRESSION_THRESHOLDS.HOLD_MASTERY) }
      )
    }
  }
  
  // Check for plateau
  if (context?.trend === 'stable' && records.length >= PROGRESSION_THRESHOLDS.SESSIONS_FOR_PLATEAU) {
    decision = 'ADD_ACCESSORY'
    reasoning = `Performance has plateaued over ${records.length} sessions. Add support work.`
    
    return createAnalysis(
      history.exerciseId, history.exerciseName, 'static_skill',
      decision, 'medium', reasoning, getRandomMessage(decision),
      { ...context!, sessionsAnalyzed: records.length }
    )
  }
  
  // Check for decline
  if (context?.trend === 'declining' || context?.completionRate! < PROGRESSION_THRESHOLDS.COMPLETION_POOR) {
    decision = 'REGRESS'
    reasoning = 'Performance declining. Step back to rebuild strength.'
    
    return createAnalysis(
      history.exerciseId, history.exerciseName, 'static_skill',
      decision, 'medium', reasoning, getRandomMessage(decision),
      { ...context!, sessionsAnalyzed: records.length }
    )
  }
  
  // Default: maintain
  reasoning = 'Building consistency at current level.'
  return createAnalysis(
    history.exerciseId, history.exerciseName, 'static_skill',
    'MAINTAIN', 'medium', reasoning, getRandomMessage('MAINTAIN'),
    { ...context!, sessionsAnalyzed: records.length }
  )
}

/**
 * Analyze strength/weighted exercise progression
 */
function analyzeStrengthExercise(
  history: ExerciseHistory,
  targets?: { targetReps?: number; targetWeight?: number },
  context?: { completionRate: number; avgRPE: number | null; trend: string }
): ProgressionAnalysis {
  const records = history.records
  const recentRecords = records.slice(0, PROGRESSION_THRESHOLDS.SESSIONS_FOR_PROGRESS)
  
  const targetReps = targets?.targetReps || 8
  const currentWeight = records[0]?.weight || 0
  
  // Calculate average reps achieved
  const repsWithData = recentRecords.filter(r => r.reps !== undefined)
  const avgReps = repsWithData.length > 0
    ? repsWithData.reduce((sum, r) => sum + (r.reps || 0), 0) / repsWithData.length
    : 0
  
  // Check conditions
  const hittingTarget = avgReps >= targetReps
  const rpeInRange = context?.avgRPE !== null && 
    context?.avgRPE! <= PROGRESSION_THRESHOLDS.RPE_TARGET_HIGH
  const rpeEasy = context?.avgRPE !== null && 
    context?.avgRPE! <= PROGRESSION_THRESHOLDS.RPE_EASY
  const completionGood = context?.completionRate! >= PROGRESSION_THRESHOLDS.COMPLETION_GOOD
  
  let decision: ProgressionDecision = 'MAINTAIN'
  let reasoning = ''
  
  // Ready for weight increase
  if (hittingTarget && rpeInRange && completionGood && recentRecords.length >= 2) {
    // If weighted exercise
    if (currentWeight > 0 || history.exerciseType === 'weighted') {
      decision = 'INCREASE_WEIGHT'
      const increment = PROGRESSION_THRESHOLDS.WEIGHT_INCREMENT_UPPER
      reasoning = `Consistently hitting ${avgReps.toFixed(0)} reps at RPE ${context?.avgRPE?.toFixed(1)}. Add ${increment} lbs.`
      
      return createAnalysis(
        history.exerciseId, history.exerciseName, history.exerciseType,
        decision, 'high', reasoning, getRandomMessage(decision),
        { ...context!, sessionsAnalyzed: records.length },
        { nextWeight: currentWeight + increment, weightIncrement: increment }
      )
    }
    
    // If bodyweight, increase reps
    if (rpeEasy) {
      decision = 'INCREASE_REPS'
      reasoning = `Consistently completing ${avgReps.toFixed(0)} reps easily. Add one more rep.`
      
      return createAnalysis(
        history.exerciseId, history.exerciseName, history.exerciseType,
        decision, 'high', reasoning, getRandomMessage(decision),
        { ...context!, sessionsAnalyzed: records.length },
        { nextRepTarget: targetReps + 1 }
      )
    }
  }
  
  // Check for decline
  if (context?.trend === 'declining' || context?.completionRate! < PROGRESSION_THRESHOLDS.COMPLETION_POOR) {
    decision = 'REGRESS'
    reasoning = 'Performance declining. Reduce load temporarily.'
    
    return createAnalysis(
      history.exerciseId, history.exerciseName, history.exerciseType,
      decision, 'medium', reasoning, getRandomMessage(decision),
      { ...context!, sessionsAnalyzed: records.length }
    )
  }
  
  // Check for plateau
  if (context?.trend === 'stable' && records.length >= PROGRESSION_THRESHOLDS.SESSIONS_FOR_PLATEAU) {
    decision = 'CHANGE_VARIATION'
    reasoning = `Plateau detected over ${records.length} sessions. Try a variation.`
    
    return createAnalysis(
      history.exerciseId, history.exerciseName, history.exerciseType,
      decision, 'medium', reasoning, getRandomMessage(decision),
      { ...context!, sessionsAnalyzed: records.length }
    )
  }
  
  // Default: maintain
  reasoning = 'Building strength at current level.'
  return createAnalysis(
    history.exerciseId, history.exerciseName, history.exerciseType,
    'MAINTAIN', 'medium', reasoning, getRandomMessage('MAINTAIN'),
    { ...context!, sessionsAnalyzed: records.length }
  )
}

/**
 * Analyze flexibility progression
 * Flexibility uses exposure model - don't increase hold times beyond 15s
 */
function analyzeFlexibility(
  history: ExerciseHistory,
  context?: { completionRate: number; avgRPE: number | null; trend: string }
): ProgressionAnalysis {
  const records = history.records
  
  // Flexibility progression is about depth and positions, not hold time
  // Check completion consistency
  const completionExcellent = context?.completionRate! >= PROGRESSION_THRESHOLDS.COMPLETION_EXCELLENT
  
  if (completionExcellent && records.length >= 3) {
    return createAnalysis(
      history.exerciseId, history.exerciseName, 'flexibility',
      'PROGRESS', 'medium',
      'Consistent practice. Ready to explore deeper positions.',
      'You can try a deeper fold or new angle.',
      { ...context!, sessionsAnalyzed: records.length }
    )
  }
  
  // Default: maintain exposure
  return createAnalysis(
    history.exerciseId, history.exerciseName, 'flexibility',
    'MAINTAIN', 'medium',
    'Keep up the consistent practice.',
    'Stay with current positions. Depth improves with exposure.',
    { ...context!, sessionsAnalyzed: records.length }
  )
}

/**
 * Analyze mobility progression (strength-based)
 */
function analyzeMobility(
  history: ExerciseHistory,
  targets?: { targetWeight?: number },
  context?: { completionRate: number; avgRPE: number | null; trend: string }
): ProgressionAnalysis {
  const records = history.records
  const currentWeight = records[0]?.weight || 0
  
  const rpeInRange = context?.avgRPE !== null && 
    context?.avgRPE! <= PROGRESSION_THRESHOLDS.RPE_TARGET_HIGH
  const completionGood = context?.completionRate! >= PROGRESSION_THRESHOLDS.COMPLETION_GOOD
  
  // Mobility treated like strength work
  if (rpeInRange && completionGood && records.length >= 2) {
    const increment = PROGRESSION_THRESHOLDS.WEIGHT_INCREMENT_UPPER
    
    return createAnalysis(
      history.exerciseId, history.exerciseName, 'mobility',
      'INCREASE_WEIGHT', 'medium',
      `Good control with RPE ${context?.avgRPE?.toFixed(1)}. Increase load.`,
      'Add a small amount of weight to build end-range strength.',
      { ...context!, sessionsAnalyzed: records.length },
      { nextWeight: currentWeight + increment, weightIncrement: increment }
    )
  }
  
  // Check for struggle
  if (context?.avgRPE !== null && context?.avgRPE! >= PROGRESSION_THRESHOLDS.RPE_HARD) {
    return createAnalysis(
      history.exerciseId, history.exerciseName, 'mobility',
      'MAINTAIN', 'high',
      `High effort (RPE ${context?.avgRPE?.toFixed(1)}). Build control here.`,
      'Focus on quality at current load.',
      { ...context!, sessionsAnalyzed: records.length }
    )
  }
  
  // Default
  return createAnalysis(
    history.exerciseId, history.exerciseName, 'mobility',
    'MAINTAIN', 'medium',
    'Building end-range strength.',
    'Keep practicing loaded positions.',
    { ...context!, sessionsAnalyzed: records.length }
  )
}

// =============================================================================
// SKILL STATUS FUNCTIONS
// =============================================================================

/**
 * Get progression status for a specific skill
 */
export function getSkillProgressionStatus(
  skillId: string,
  skillName: string,
  currentLevel: string
): SkillProgressionStatus {
  const analysis = analyzeExerciseProgression(skillId, skillName, 'static_skill')
  
  let readiness: SkillProgressionStatus['progressionReadiness'] = 'not_ready'
  let estimatedSessions: number | null = null
  const blockers: string[] = []
  
  if (analysis.decision === 'PROGRESS' || analysis.decision === 'REDUCE_BAND') {
    readiness = 'ready'
  } else if (analysis.signals.improving) {
    readiness = 'approaching'
    estimatedSessions = 2
  } else if (analysis.signals.plateaued) {
    readiness = 'not_ready'
    blockers.push('Plateau detected')
  }
  
  if (!analysis.signals.consistentCompletion) {
    blockers.push('Inconsistent completion')
  }
  if (!analysis.signals.rpeInRange) {
    blockers.push('RPE too high')
  }
  
  return {
    skillId,
    skillName,
    currentLevel,
    progressionReadiness: readiness,
    estimatedSessionsToProgress: estimatedSessions,
    blockers,
    coachTip: analysis.coachMessage,
  }
}

/**
 * Get flexibility progression status
 */
export function getFlexibilityProgressionStatus(skillId: string): FlexibilityProgressionStatus {
  const analysis = analyzeExerciseProgression(skillId, skillId, 'flexibility')
  
  return {
    skillId,
    currentDepth: 'intermediate', // Would need actual tracking
    rangeImprovement: analysis.signals.improving ? 'moderate' : 'slight',
    canProgressPosition: analysis.decision === 'PROGRESS',
    coachTip: analysis.coachMessage,
  }
}

/**
 * Get mobility progression status
 */
export function getMobilityProgressionStatus(skillId: string): MobilityProgressionStatus {
  const analysis = analyzeExerciseProgression(skillId, skillId, 'mobility')
  
  return {
    skillId,
    currentLoad: analysis.recommendations.nextWeight ? analysis.recommendations.nextWeight - (analysis.recommendations.weightIncrement || 0) : null,
    loadTolerance: analysis.signals.rpeInRange ? 'good' : 'moderate',
    canIncreaseLoad: analysis.decision === 'INCREASE_WEIGHT',
    suggestedLoadIncrease: analysis.recommendations.weightIncrement,
    rpeAverage: analysis.context.avgRPE,
    coachTip: analysis.coachMessage,
  }
}

// =============================================================================
// BULK ANALYSIS
// =============================================================================

/**
 * Analyze all exercises in recent workouts and return progression recommendations
 */
export function analyzeAllProgressions(): ProgressionAnalysis[] {
  const logs = getWorkoutLogs().slice(0, 10) // Last 10 workouts
  const analyzed = new Set<string>()
  const results: ProgressionAnalysis[] = []
  
  for (const log of logs) {
    for (const exercise of log.exercises) {
      if (analyzed.has(exercise.id)) continue
      analyzed.add(exercise.id)
      
      // Determine exercise type
      let type: ExerciseType = 'dynamic_strength'
      if (exercise.holdSeconds !== undefined) {
        type = 'static_skill'
      } else if (exercise.load !== undefined && exercise.load > 0) {
        type = 'weighted'
      }
      
      const analysis = analyzeExerciseProgression(exercise.id, exercise.name, type)
      results.push(analysis)
    }
  }
  
  return results
}

/**
 * Get exercises ready for progression
 */
export function getReadyToProgress(): ProgressionAnalysis[] {
  const all = analyzeAllProgressions()
  return all.filter(a => 
    a.decision === 'PROGRESS' || 
    a.decision === 'REDUCE_BAND' || 
    a.decision === 'INCREASE_WEIGHT' ||
    a.decision === 'INCREASE_REPS' ||
    a.decision === 'INCREASE_HOLD'
  )
}

/**
 * Get exercises needing attention (declining or plateaued)
 */
export function getNeedingAttention(): ProgressionAnalysis[] {
  const all = analyzeAllProgressions()
  return all.filter(a => 
    a.decision === 'REGRESS' ||
    a.decision === 'ADD_ACCESSORY' ||
    a.decision === 'CHANGE_VARIATION' ||
    a.signals.declining ||
    a.signals.plateaued
  )
}

// =============================================================================
// DASHBOARD HELPERS
// =============================================================================

export interface ProgressionInsight {
  type: 'ready_to_progress' | 'plateau_detected' | 'good_progress' | 'needs_recovery'
  title: string
  message: string
  exerciseCount: number
  exercises: string[]
}

/**
 * Get progression insights for dashboard
 */
export function getProgressionInsights(): ProgressionInsight[] {
  const insights: ProgressionInsight[] = []
  
  const readyToProgress = getReadyToProgress()
  if (readyToProgress.length > 0) {
    insights.push({
      type: 'ready_to_progress',
      title: 'Ready to Progress',
      message: `${readyToProgress.length} exercise${readyToProgress.length > 1 ? 's' : ''} ready for progression.`,
      exerciseCount: readyToProgress.length,
      exercises: readyToProgress.map(e => e.exerciseName).slice(0, 3),
    })
  }
  
  const needingAttention = getNeedingAttention()
  const plateaued = needingAttention.filter(e => e.signals.plateaued)
  if (plateaued.length > 0) {
    insights.push({
      type: 'plateau_detected',
      title: 'Plateau Detected',
      message: `${plateaued.length} exercise${plateaued.length > 1 ? 's' : ''} may need variation.`,
      exerciseCount: plateaued.length,
      exercises: plateaued.map(e => e.exerciseName).slice(0, 3),
    })
  }
  
  return insights
}

// =============================================================================
// HELPERS
// =============================================================================

function createAnalysis(
  exerciseId: string,
  exerciseName: string,
  exerciseType: ExerciseType,
  decision: ProgressionDecision,
  confidence: 'low' | 'medium' | 'high',
  reasoning: string,
  coachMessage: string,
  context: {
    completionRate: number
    avgRPE: number | null
    trend: string
    sessionsAnalyzed: number
  },
  recommendations?: ProgressionAnalysis['recommendations']
): ProgressionAnalysis {
  return {
    exerciseId,
    exerciseName,
    exerciseType,
    decision,
    confidence,
    reasoning,
    coachMessage,
    recommendations: recommendations || {},
    signals: {
      consistentCompletion: context.completionRate >= PROGRESSION_THRESHOLDS.COMPLETION_GOOD,
      rpeInRange: context.avgRPE !== null && context.avgRPE <= PROGRESSION_THRESHOLDS.RPE_TARGET_HIGH,
      improving: context.trend === 'improving',
      plateaued: context.trend === 'stable' && context.sessionsAnalyzed >= PROGRESSION_THRESHOLDS.SESSIONS_FOR_PLATEAU,
      declining: context.trend === 'declining',
      readyForChallenge: context.completionRate >= PROGRESSION_THRESHOLDS.COMPLETION_EXCELLENT &&
        (context.avgRPE === null || context.avgRPE <= PROGRESSION_THRESHOLDS.RPE_TARGET_LOW),
    },
    context: {
      sessionsAnalyzed: context.sessionsAnalyzed,
      avgRPE: context.avgRPE,
      completionRate: context.completionRate,
      trendDirection: context.trend as 'improving' | 'stable' | 'declining',
      daysSinceLastProgress: null, // Would need progress log
    },
  }
}

function getRandomMessage(decision: ProgressionDecision): string {
  const messages = COACH_MESSAGES[decision]
  return messages[Math.floor(Math.random() * messages.length)]
}
