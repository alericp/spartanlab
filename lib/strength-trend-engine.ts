// Strength Trend Engine
// Analyzes strength progress direction over time

import type { ExerciseType, StrengthRecord } from './strength-service'

// =============================================================================
// TYPES
// =============================================================================

export type TrendDirection = 'improving' | 'stable' | 'regressing' | 'insufficient_data'

export interface StrengthTrend {
  exercise: ExerciseType
  direction: TrendDirection
  label: string
  confidence: 'high' | 'medium' | 'low'
  recentAvg1RM: number | null
  previousAvg1RM: number | null
  percentChange: number | null
  recordCount: number
  explanation: string
}

export interface RecentPerformance {
  exercise: ExerciseType
  bestRecent: StrengthRecord | null
  bestAllTime: StrengthRecord | null
  recentRecords: StrengthRecord[]
  daysSinceLastLog: number | null
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TREND_LABELS: Record<TrendDirection, string> = {
  improving: 'Improving',
  stable: 'Stable',
  regressing: 'Regressing',
  insufficient_data: 'More Data Needed',
}

// How many days to consider "recent"
const RECENT_WINDOW_DAYS = 28
// Minimum records needed for trend analysis
const MIN_RECORDS_FOR_TREND = 3
// Threshold for considering change significant
const IMPROVEMENT_THRESHOLD = 0.03 // 3%
const REGRESSION_THRESHOLD = -0.05 // -5%

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Get records within a time window
 */
function getRecordsInWindow(
  records: StrengthRecord[],
  windowDays: number,
  referenceDate: Date = new Date()
): StrengthRecord[] {
  const cutoff = new Date(referenceDate)
  cutoff.setDate(cutoff.getDate() - windowDays)
  
  return records.filter(r => new Date(r.dateLogged) >= cutoff)
}

/**
 * Calculate average 1RM from records
 */
function calculateAverage1RM(records: StrengthRecord[]): number | null {
  if (records.length === 0) return null
  const sum = records.reduce((acc, r) => acc + r.estimatedOneRM, 0)
  return sum / records.length
}

/**
 * Get recent and previous period averages for comparison
 */
function getPeriodAverages(
  records: StrengthRecord[],
  recentDays: number = 14,
  previousDays: number = 14
): { recentAvg: number | null; previousAvg: number | null } {
  const now = new Date()
  
  // Recent period: last N days
  const recentCutoff = new Date(now)
  recentCutoff.setDate(recentCutoff.getDate() - recentDays)
  
  // Previous period: N to 2N days ago
  const previousStart = new Date(now)
  previousStart.setDate(previousStart.getDate() - (recentDays + previousDays))
  
  const recentRecords = records.filter(r => {
    const date = new Date(r.dateLogged)
    return date >= recentCutoff
  })
  
  const previousRecords = records.filter(r => {
    const date = new Date(r.dateLogged)
    return date >= previousStart && date < recentCutoff
  })
  
  return {
    recentAvg: calculateAverage1RM(recentRecords),
    previousAvg: calculateAverage1RM(previousRecords),
  }
}

/**
 * Calculate trend direction from period comparison
 */
function determineTrendDirection(
  recentAvg: number | null,
  previousAvg: number | null,
  recordCount: number
): { direction: TrendDirection; percentChange: number | null } {
  if (recordCount < MIN_RECORDS_FOR_TREND) {
    return { direction: 'insufficient_data', percentChange: null }
  }
  
  if (recentAvg === null || previousAvg === null) {
    return { direction: 'insufficient_data', percentChange: null }
  }
  
  const percentChange = (recentAvg - previousAvg) / previousAvg
  
  if (percentChange >= IMPROVEMENT_THRESHOLD) {
    return { direction: 'improving', percentChange }
  }
  
  if (percentChange <= REGRESSION_THRESHOLD) {
    return { direction: 'regressing', percentChange }
  }
  
  return { direction: 'stable', percentChange }
}

/**
 * Calculate strength trend for an exercise
 */
export function calculateStrengthTrend(
  records: StrengthRecord[],
  exercise: ExerciseType
): StrengthTrend {
  // Filter to this exercise and sort by date
  const exerciseRecords = records
    .filter(r => r.exercise === exercise)
    .sort((a, b) => new Date(b.dateLogged).getTime() - new Date(a.dateLogged).getTime())
  
  const recentRecords = getRecordsInWindow(exerciseRecords, RECENT_WINDOW_DAYS)
  const { recentAvg, previousAvg } = getPeriodAverages(exerciseRecords)
  const { direction, percentChange } = determineTrendDirection(
    recentAvg,
    previousAvg,
    exerciseRecords.length
  )
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (exerciseRecords.length >= 6 && recentRecords.length >= 2) {
    confidence = 'high'
  } else if (exerciseRecords.length >= MIN_RECORDS_FOR_TREND) {
    confidence = 'medium'
  }
  
  // Generate explanation
  let explanation = ''
  switch (direction) {
    case 'improving':
      explanation = `Your ${formatExerciseName(exercise)} strength is trending upward. Keep building momentum.`
      break
    case 'stable':
      explanation = `Your ${formatExerciseName(exercise)} strength is steady. Consider progressive overload to break through.`
      break
    case 'regressing':
      explanation = `Your ${formatExerciseName(exercise)} numbers have dropped recently. Check recovery and training load.`
      break
    default:
      explanation = `Log more ${formatExerciseName(exercise)} sessions to establish a clear trend.`
  }
  
  return {
    exercise,
    direction,
    label: TREND_LABELS[direction],
    confidence,
    recentAvg1RM: recentAvg,
    previousAvg1RM: previousAvg,
    percentChange,
    recordCount: exerciseRecords.length,
    explanation,
  }
}

/**
 * Get recent performance summary for an exercise
 */
export function getRecentPerformance(
  records: StrengthRecord[],
  exercise: ExerciseType
): RecentPerformance {
  const exerciseRecords = records
    .filter(r => r.exercise === exercise)
    .sort((a, b) => new Date(b.dateLogged).getTime() - new Date(a.dateLogged).getTime())
  
  const recentRecords = getRecordsInWindow(exerciseRecords, RECENT_WINDOW_DAYS)
  
  // Best recent (highest 1RM in last 28 days)
  const bestRecent = recentRecords.length > 0
    ? recentRecords.reduce((best, r) => r.estimatedOneRM > best.estimatedOneRM ? r : best)
    : null
  
  // Best all-time
  const bestAllTime = exerciseRecords.length > 0
    ? exerciseRecords.reduce((best, r) => r.estimatedOneRM > best.estimatedOneRM ? r : best)
    : null
  
  // Days since last log
  let daysSinceLastLog: number | null = null
  if (exerciseRecords.length > 0) {
    const lastDate = new Date(exerciseRecords[0].dateLogged)
    const now = new Date()
    daysSinceLastLog = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
  }
  
  return {
    exercise,
    bestRecent,
    bestAllTime,
    recentRecords,
    daysSinceLastLog,
  }
}

/**
 * Calculate all exercise trends
 */
export function calculateAllTrends(
  records: StrengthRecord[]
): Record<ExerciseType, StrengthTrend> {
  return {
    weighted_pull_up: calculateStrengthTrend(records, 'weighted_pull_up'),
    weighted_dip: calculateStrengthTrend(records, 'weighted_dip'),
    weighted_muscle_up: calculateStrengthTrend(records, 'weighted_muscle_up'),
  }
}

/**
 * Format exercise name for display
 */
function formatExerciseName(exercise: ExerciseType): string {
  const names: Record<ExerciseType, string> = {
    weighted_pull_up: 'weighted pull-up',
    weighted_dip: 'weighted dip',
    weighted_muscle_up: 'weighted muscle-up',
  }
  return names[exercise]
}

/**
 * Get overall strength momentum across all exercises
 */
export function getOverallMomentum(
  trends: Record<ExerciseType, StrengthTrend>
): { status: TrendDirection; explanation: string } {
  const directions = Object.values(trends).map(t => t.direction)
  
  const improving = directions.filter(d => d === 'improving').length
  const regressing = directions.filter(d => d === 'regressing').length
  const hasData = directions.filter(d => d !== 'insufficient_data').length
  
  if (hasData === 0) {
    return {
      status: 'insufficient_data',
      explanation: 'Log more strength records across exercises to see overall momentum.',
    }
  }
  
  if (improving > regressing && improving >= 1) {
    return {
      status: 'improving',
      explanation: 'Your overall strength is trending upward. Maintain consistency.',
    }
  }
  
  if (regressing > improving && regressing >= 1) {
    return {
      status: 'regressing',
      explanation: 'Your overall strength has declined recently. Prioritize recovery.',
    }
  }
  
  return {
    status: 'stable',
    explanation: 'Your strength is holding steady. Consider introducing new stimuli.',
  }
}
