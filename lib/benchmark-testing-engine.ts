/**
 * Baseline and Progress Testing Engine
 * 
 * Measures athlete capability across key movement families and updates
 * SpartanLab's training intelligence. Supports baseline testing, periodic
 * progress tests, benchmark updates, and skill readiness recalibration.
 * 
 * DESIGN PRINCIPLES:
 * - Testing is optional and non-intrusive
 * - Tests are simple, quick, and high-value
 * - Results feed into all training intelligence systems
 * - Plateaus are detected and trigger framework adjustments
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import type { MovementFamily } from './movement-family-registry'
import type { SkillKey, SkillState } from './skill-state-service'

// =============================================================================
// LAZY DATABASE CONNECTION
// Do NOT initialize at module scope - this allows the module to be imported
// even when DATABASE_URL is absent (e.g., during first-run onboarding)
// =============================================================================

let _sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> | null {
  if (_sql) return _sql
  
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.log('[BenchmarkTesting] DATABASE_URL not available - DB features disabled')
    return null
  }
  
  _sql = neon(connectionString)
  return _sql
}

// =============================================================================
// TYPES
// =============================================================================

export type BenchmarkMovementFamily =
  | 'vertical_pull'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'dip_pattern'
  | 'straight_arm_pull'
  | 'straight_arm_push'
  | 'compression_core'
  | 'explosive_pull'
  | 'ring_support'
  | 'handstand'

export type TestCategory = 'strength' | 'skill' | 'endurance' | 'flexibility'

export type TestCondition = 'fresh' | 'fatigued' | 'post_workout' | 'unknown'

export type DataQuality = 'self_reported' | 'video_verified' | 'coached'

export type TestUnit = 'reps' | 'seconds' | 'kg' | 'lbs' | 'progression_level' | 'percentage'

/**
 * Core benchmark record
 */
export interface Benchmark {
  id: string
  userId: string
  movementFamily: BenchmarkMovementFamily
  testName: string
  testCategory: TestCategory
  testValue: number
  testUnit: TestUnit
  bodyweightAtTest: number | null
  testConditions: TestCondition
  confidenceScore: number
  dataQuality: DataQuality
  previousValue: number | null
  previousTestDate: string | null
  changePercent: number | null
  isBaseline: boolean
  triggeredRecalibration: boolean
  plateauDetected: boolean
  notes: string | null
  testDate: string
  createdAt: string
  updatedAt: string
}

/**
 * Benchmark input for creating/updating
 */
export interface BenchmarkInput {
  movementFamily: BenchmarkMovementFamily
  testName: string
  testCategory: TestCategory
  testValue: number
  testUnit: TestUnit
  bodyweightAtTest?: number
  testConditions?: TestCondition
  confidenceScore?: number
  dataQuality?: DataQuality
  isBaseline?: boolean
  notes?: string
}

/**
 * Defined baseline test with metadata
 */
export interface BaselineTestDefinition {
  testName: string
  displayName: string
  movementFamily: BenchmarkMovementFamily
  testCategory: TestCategory
  testUnit: TestUnit
  description: string
  instructions: string
  minimumValue: number
  targetValue: number // "Good" baseline
  excellentValue: number
  skillsAffected: SkillKey[]
  priority: 'essential' | 'recommended' | 'optional'
  estimatedTimeMinutes: number
}

/**
 * Progress test trigger
 */
export interface ProgressTestTrigger {
  triggerType: 'scheduled' | 'plateau_detected' | 'progress_suspected' | 'user_requested' | 'significant_improvement'
  testName: string
  movementFamily: BenchmarkMovementFamily
  reason: string
  priority: 'low' | 'normal' | 'high'
  recommendedDate: Date
  lastTestDate: Date | null
  daysSinceLastTest: number
}

/**
 * Plateau detection result
 */
export interface PlateauDetection {
  isPlateaued: boolean
  movementFamily: BenchmarkMovementFamily
  testName: string
  skillAffected: SkillKey | null
  plateauDurationWeeks: number
  benchmarkValueAtDetection: number
  benchmarkVariance: number
  recommendation: string
  frameworkShiftSuggested: boolean
  suggestedFramework: string | null
}

/**
 * Benchmark trend analysis
 */
export interface BenchmarkTrend {
  testName: string
  movementFamily: BenchmarkMovementFamily
  trend: 'improving' | 'stable' | 'declining'
  trendStrength: number // 0-1
  periodWeeks: number
  startValue: number
  currentValue: number
  changePercent: number
  dataPoints: number
  confidenceScore: number
}

/**
 * Progress feedback for UI
 */
export interface ProgressFeedback {
  headline: string
  message: string
  testName: string
  previousValue: number | null
  currentValue: number
  changePercent: number | null
  trend: 'improved' | 'maintained' | 'declined'
  feedbackTone: 'positive' | 'neutral' | 'encouraging'
}

// =============================================================================
// BASELINE TEST DEFINITIONS
// =============================================================================

export const BASELINE_TESTS: BaselineTestDefinition[] = [
  // PULL STRENGTH
  {
    testName: 'max_pull_ups',
    displayName: 'Max Pull-Ups',
    movementFamily: 'vertical_pull',
    testCategory: 'strength',
    testUnit: 'reps',
    description: 'Maximum consecutive pull-ups with good form',
    instructions: 'Perform as many pull-ups as possible with full range of motion. Start from a dead hang, pull chin over bar, return to full extension.',
    minimumValue: 1,
    targetValue: 10,
    excellentValue: 20,
    skillsAffected: ['front_lever', 'muscle_up', 'back_lever'],
    priority: 'essential',
    estimatedTimeMinutes: 3,
  },
  {
    testName: 'weighted_pull_3rm',
    displayName: 'Weighted Pull-Up 3RM',
    movementFamily: 'vertical_pull',
    testCategory: 'strength',
    testUnit: 'kg',
    description: 'Maximum added weight for 3 clean pull-ups',
    instructions: 'Find the maximum weight you can add and complete 3 clean pull-ups. Rest 3-5 minutes between attempts.',
    minimumValue: 0,
    targetValue: 20,
    excellentValue: 40,
    skillsAffected: ['front_lever', 'muscle_up'],
    priority: 'recommended',
    estimatedTimeMinutes: 10,
  },
  
  // PUSH STRENGTH
  {
    testName: 'max_dips',
    displayName: 'Max Dips',
    movementFamily: 'dip_pattern',
    testCategory: 'strength',
    testUnit: 'reps',
    description: 'Maximum consecutive parallel bar dips',
    instructions: 'Perform as many dips as possible with full range of motion. Lower until upper arms are parallel to ground or below, press to full lockout.',
    minimumValue: 1,
    targetValue: 15,
    excellentValue: 30,
    skillsAffected: ['muscle_up', 'hspu', 'planche'],
    priority: 'essential',
    estimatedTimeMinutes: 3,
  },
  {
    testName: 'max_push_ups',
    displayName: 'Max Push-Ups',
    movementFamily: 'vertical_push',
    testCategory: 'strength',
    testUnit: 'reps',
    description: 'Maximum consecutive push-ups with good form',
    instructions: 'Perform as many push-ups as possible. Chest to ground, full arm extension at top, body in a straight line throughout.',
    minimumValue: 1,
    targetValue: 30,
    excellentValue: 50,
    skillsAffected: ['planche', 'hspu'],
    priority: 'recommended',
    estimatedTimeMinutes: 3,
  },
  
  // COMPRESSION / CORE
  {
    testName: 'l_sit_hold',
    displayName: 'L-Sit Hold',
    movementFamily: 'compression_core',
    testCategory: 'skill',
    testUnit: 'seconds',
    description: 'Maximum L-sit hold duration on parallettes or floor',
    instructions: 'Hold an L-sit with legs parallel to ground, arms straight, shoulders depressed. Time until form breaks.',
    minimumValue: 5,
    targetValue: 20,
    excellentValue: 45,
    skillsAffected: ['l_sit', 'front_lever', 'planche'],
    priority: 'essential',
    estimatedTimeMinutes: 2,
  },
  {
    testName: 'hollow_hold',
    displayName: 'Hollow Body Hold',
    movementFamily: 'compression_core',
    testCategory: 'endurance',
    testUnit: 'seconds',
    description: 'Maximum hollow body hold duration',
    instructions: 'Lie on back, press lower back into floor, lift legs and shoulders off ground. Hold until form breaks.',
    minimumValue: 15,
    targetValue: 45,
    excellentValue: 90,
    skillsAffected: ['front_lever', 'back_lever', 'planche'],
    priority: 'recommended',
    estimatedTimeMinutes: 2,
  },
  
  // SKILL READINESS
  {
    testName: 'tuck_front_lever_hold',
    displayName: 'Tuck Front Lever Hold',
    movementFamily: 'straight_arm_pull',
    testCategory: 'skill',
    testUnit: 'seconds',
    description: 'Maximum tuck front lever hold duration',
    instructions: 'From a hang, pull into tuck front lever position with back parallel to ground. Time until form breaks.',
    minimumValue: 0,
    targetValue: 15,
    excellentValue: 30,
    skillsAffected: ['front_lever'],
    priority: 'recommended',
    estimatedTimeMinutes: 2,
  },
  {
    testName: 'wall_handstand_hold',
    displayName: 'Wall Handstand Hold',
    movementFamily: 'handstand',
    testCategory: 'skill',
    testUnit: 'seconds',
    description: 'Maximum wall handstand hold (chest to wall)',
    instructions: 'Kick up to wall handstand facing the wall, chest close to wall. Time until coming down.',
    minimumValue: 10,
    targetValue: 45,
    excellentValue: 90,
    skillsAffected: ['hspu'],
    priority: 'recommended',
    estimatedTimeMinutes: 3,
  },
  {
    testName: 'ring_support_hold',
    displayName: 'Ring Support Hold',
    movementFamily: 'ring_support',
    testCategory: 'skill',
    testUnit: 'seconds',
    description: 'Maximum ring support hold duration',
    instructions: 'Hold a ring support position with arms straight and rings turned out slightly. Time until form breaks.',
    minimumValue: 10,
    targetValue: 30,
    excellentValue: 60,
    skillsAffected: ['muscle_up'],
    priority: 'optional',
    estimatedTimeMinutes: 2,
  },
]

/**
 * Get all baseline test definitions
 */
export function getBaselineTests(): BaselineTestDefinition[] {
  return BASELINE_TESTS
}

/**
 * Get essential baseline tests only
 */
export function getEssentialBaselineTests(): BaselineTestDefinition[] {
  return BASELINE_TESTS.filter(t => t.priority === 'essential')
}

/**
 * Get baseline tests relevant to a specific skill
 */
export function getTestsForSkill(skill: SkillKey): BaselineTestDefinition[] {
  return BASELINE_TESTS.filter(t => t.skillsAffected.includes(skill))
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Create a new benchmark record
 */
export async function createBenchmark(
  userId: string,
  input: BenchmarkInput
): Promise<Benchmark | null> {
  const sql = getSql()
  if (!sql) {
    console.log('[BenchmarkTesting] createBenchmark: DB unavailable')
    return null
  }
  
  const id = `bench_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  
  // Get previous benchmark for comparison
  const previousBenchmark = await getLatestBenchmark(userId, input.testName)
  
  const previousValue = previousBenchmark?.testValue ?? null
  const previousTestDate = previousBenchmark?.testDate ?? null
  const changePercent = previousValue 
    ? ((input.testValue - previousValue) / previousValue) * 100 
    : null
  
  const result = await sql`
    INSERT INTO benchmarks (
      id, user_id, movement_family, test_name, test_category,
      test_value, test_unit, bodyweight_at_test, test_conditions,
      confidence_score, data_quality, previous_value, previous_test_date,
      change_percent, is_baseline, notes, test_date
    ) VALUES (
      ${id}, ${userId}, ${input.movementFamily}, ${input.testName}, ${input.testCategory},
      ${input.testValue}, ${input.testUnit}, ${input.bodyweightAtTest ?? null}, ${input.testConditions ?? 'unknown'},
      ${input.confidenceScore ?? 80}, ${input.dataQuality ?? 'self_reported'}, ${previousValue}, ${previousTestDate},
      ${changePercent}, ${input.isBaseline ?? false}, ${input.notes ?? null}, NOW()
    )
    RETURNING *
  `
  
  return mapBenchmarkRow(result[0])
}

/**
 * Get latest benchmark for a specific test
 */
export async function getLatestBenchmark(
  userId: string,
  testName: string
): Promise<Benchmark | null> {
  const sql = getSql()
  if (!sql) {
    return null
  }
  
  const results = await sql`
    SELECT * FROM benchmarks
    WHERE user_id = ${userId} AND test_name = ${testName}
    ORDER BY test_date DESC
    LIMIT 1
  `
  
  return results.length > 0 ? mapBenchmarkRow(results[0]) : null
}

/**
 * Get all benchmarks for a user
 */
export async function getUserBenchmarks(userId: string): Promise<Benchmark[]> {
  const sql = getSql()
  if (!sql) {
    return []
  }
  
  const results = await sql`
    SELECT * FROM benchmarks
    WHERE user_id = ${userId}
    ORDER BY test_date DESC
  `
  
  return results.map(mapBenchmarkRow)
}

/**
 * Get benchmark history for a specific test
 */
export async function getBenchmarkHistory(
  userId: string,
  testName: string,
  limitDays: number = 365
): Promise<Benchmark[]> {
  const sql = getSql()
  if (!sql) {
    return []
  }
  
  const results = await sql`
    SELECT * FROM benchmarks
    WHERE user_id = ${userId} 
      AND test_name = ${testName}
      AND test_date > NOW() - INTERVAL '1 day' * ${limitDays}
    ORDER BY test_date ASC
  `
  
  return results.map(mapBenchmarkRow)
}

/**
 * Get benchmarks by movement family
 */
export async function getBenchmarksByFamily(
  userId: string,
  movementFamily: BenchmarkMovementFamily
): Promise<Benchmark[]> {
  const sql = getSql()
  if (!sql) {
    return []
  }
  
  const results = await sql`
    SELECT * FROM benchmarks
    WHERE user_id = ${userId} AND movement_family = ${movementFamily}
    ORDER BY test_date DESC
  `
  
  return results.map(mapBenchmarkRow)
}

function mapBenchmarkRow(row: any): Benchmark {
  return {
    id: row.id,
    userId: row.user_id,
    movementFamily: row.movement_family,
    testName: row.test_name,
    testCategory: row.test_category,
    testValue: Number(row.test_value),
    testUnit: row.test_unit,
    bodyweightAtTest: row.bodyweight_at_test ? Number(row.bodyweight_at_test) : null,
    testConditions: row.test_conditions,
    confidenceScore: row.confidence_score,
    dataQuality: row.data_quality,
    previousValue: row.previous_value ? Number(row.previous_value) : null,
    previousTestDate: row.previous_test_date,
    changePercent: row.change_percent ? Number(row.change_percent) : null,
    isBaseline: row.is_baseline,
    triggeredRecalibration: row.triggered_recalibration,
    plateauDetected: row.plateau_detected,
    notes: row.notes,
    testDate: row.test_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// =============================================================================
// PROGRESS TEST TRIGGERS
// =============================================================================

const MINIMUM_RETEST_DAYS = 14 // Don't recommend retesting within 2 weeks
const SCHEDULED_RETEST_DAYS = 42 // Default retest cadence ~6 weeks
const PLATEAU_CHECK_WEEKS = 6 // Check for plateau after 6 weeks of stagnation

/**
 * Generate progress test recommendations for a user
 */
export async function getProgressTestTriggers(
  userId: string
): Promise<ProgressTestTrigger[]> {
  const triggers: ProgressTestTrigger[] = []
  const benchmarks = await getUserBenchmarks(userId)
  const now = new Date()
  
  // Group by test name to find latest for each
  const latestByTest = new Map<string, Benchmark>()
  for (const b of benchmarks) {
    if (!latestByTest.has(b.testName)) {
      latestByTest.set(b.testName, b)
    }
  }
  
  // Check each essential test
  for (const testDef of BASELINE_TESTS) {
    const latest = latestByTest.get(testDef.testName)
    
    if (!latest) {
      // Never tested - recommend baseline
      triggers.push({
        triggerType: 'user_requested',
        testName: testDef.testName,
        movementFamily: testDef.movementFamily,
        reason: `You haven't recorded a ${testDef.displayName} benchmark yet.`,
        priority: testDef.priority === 'essential' ? 'high' : 'normal',
        recommendedDate: now,
        lastTestDate: null,
        daysSinceLastTest: 0,
      })
      continue
    }
    
    const lastTestDate = new Date(latest.testDate)
    const daysSince = Math.floor((now.getTime() - lastTestDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Skip if tested recently
    if (daysSince < MINIMUM_RETEST_DAYS) continue
    
    // Scheduled retest
    if (daysSince >= SCHEDULED_RETEST_DAYS) {
      triggers.push({
        triggerType: 'scheduled',
        testName: testDef.testName,
        movementFamily: testDef.movementFamily,
        reason: `It's been ${daysSince} days since your last ${testDef.displayName} test.`,
        priority: 'normal',
        recommendedDate: now,
        lastTestDate,
        daysSinceLastTest: daysSince,
      })
    }
    
    // Check for plateau
    if (latest.plateauDetected || daysSince >= PLATEAU_CHECK_WEEKS * 7) {
      const history = await getBenchmarkHistory(userId, testDef.testName, 90)
      const plateau = detectPlateauFromHistory(history, testDef)
      
      if (plateau.isPlateaued) {
        triggers.push({
          triggerType: 'plateau_detected',
          testName: testDef.testName,
          movementFamily: testDef.movementFamily,
          reason: `Your ${testDef.displayName} may have plateaued. Consider retesting to confirm.`,
          priority: 'high',
          recommendedDate: now,
          lastTestDate,
          daysSinceLastTest: daysSince,
        })
      }
    }
  }
  
  return triggers.sort((a, b) => {
    const priorityOrder = { high: 0, normal: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// =============================================================================
// PLATEAU DETECTION
// =============================================================================

/**
 * Detect plateau from benchmark history
 */
export function detectPlateauFromHistory(
  history: Benchmark[],
  testDef: BaselineTestDefinition
): PlateauDetection {
  if (history.length < 2) {
    return {
      isPlateaued: false,
      movementFamily: testDef.movementFamily,
      testName: testDef.testName,
      skillAffected: testDef.skillsAffected[0] || null,
      plateauDurationWeeks: 0,
      benchmarkValueAtDetection: history[0]?.testValue ?? 0,
      benchmarkVariance: 0,
      recommendation: 'Not enough data to detect plateau.',
      frameworkShiftSuggested: false,
      suggestedFramework: null,
    }
  }
  
  // Look at last 3-4 tests
  const recentTests = history.slice(-4)
  const values = recentTests.map(t => t.testValue)
  
  // Calculate variance
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
  const coefficientOfVariation = Math.sqrt(variance) / avg
  
  // Calculate time span
  const firstDate = new Date(recentTests[0].testDate)
  const lastDate = new Date(recentTests[recentTests.length - 1].testDate)
  const weekSpan = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
  
  // Check for improvement
  const firstValue = recentTests[0].testValue
  const lastValue = recentTests[recentTests.length - 1].testValue
  const changePercent = ((lastValue - firstValue) / firstValue) * 100
  
  // Plateau criteria: <5% change over 4+ weeks with low variance
  const isPlateaued = weekSpan >= 4 && Math.abs(changePercent) < 5 && coefficientOfVariation < 0.1
  
  // Generate recommendation
  let recommendation = ''
  let frameworkShiftSuggested = false
  let suggestedFramework: string | null = null
  
  if (isPlateaued) {
    if (testDef.movementFamily === 'vertical_pull' || testDef.movementFamily === 'straight_arm_pull') {
      recommendation = 'Consider shifting to a strength-focused framework with lower reps and more rest.'
      frameworkShiftSuggested = true
      suggestedFramework = 'barseagle_strength'
    } else if (testDef.movementFamily === 'compression_core') {
      recommendation = 'Consider adding dedicated compression work and pike progressions.'
      frameworkShiftSuggested = false
    } else {
      recommendation = 'Consider varying your training stimulus with different rep ranges or exercise variations.'
      frameworkShiftSuggested = true
    }
  } else {
    recommendation = 'Progress is on track. Continue current training approach.'
  }
  
  return {
    isPlateaued,
    movementFamily: testDef.movementFamily,
    testName: testDef.testName,
    skillAffected: testDef.skillsAffected[0] || null,
    plateauDurationWeeks: isPlateaued ? weekSpan : 0,
    benchmarkValueAtDetection: lastValue,
    benchmarkVariance: variance,
    recommendation,
    frameworkShiftSuggested,
    suggestedFramework,
  }
}

// =============================================================================
// TREND ANALYSIS
// =============================================================================

/**
 * Analyze benchmark trend for a specific test
 */
export async function analyzeBenchmarkTrend(
  userId: string,
  testName: string,
  periodWeeks: number = 12
): Promise<BenchmarkTrend | null> {
  const history = await getBenchmarkHistory(userId, testName, periodWeeks * 7)
  
  if (history.length < 2) return null
  
  const testDef = BASELINE_TESTS.find(t => t.testName === testName)
  if (!testDef) return null
  
  const firstValue = history[0].testValue
  const lastValue = history[history.length - 1].testValue
  const changePercent = ((lastValue - firstValue) / firstValue) * 100
  
  // Determine trend
  let trend: 'improving' | 'stable' | 'declining'
  let trendStrength: number
  
  if (changePercent > 5) {
    trend = 'improving'
    trendStrength = Math.min(1, changePercent / 20) // Cap at 20% improvement = 1.0 strength
  } else if (changePercent < -5) {
    trend = 'declining'
    trendStrength = Math.min(1, Math.abs(changePercent) / 20)
  } else {
    trend = 'stable'
    trendStrength = 1 - Math.abs(changePercent) / 5 // Higher strength for more stable
  }
  
  // Calculate confidence based on data points
  const confidenceScore = Math.min(1, 0.3 + (history.length * 0.15))
  
  return {
    testName,
    movementFamily: testDef.movementFamily,
    trend,
    trendStrength,
    periodWeeks,
    startValue: firstValue,
    currentValue: lastValue,
    changePercent,
    dataPoints: history.length,
    confidenceScore,
  }
}

/**
 * Get all benchmark trends for a user
 */
export async function getAllBenchmarkTrends(
  userId: string,
  periodWeeks: number = 12
): Promise<BenchmarkTrend[]> {
  const trends: BenchmarkTrend[] = []
  
  for (const testDef of BASELINE_TESTS) {
    const trend = await analyzeBenchmarkTrend(userId, testDef.testName, periodWeeks)
    if (trend) {
      trends.push(trend)
    }
  }
  
  return trends
}

// =============================================================================
// PROGRESS FEEDBACK
// =============================================================================

/**
 * Generate progress feedback message for a benchmark
 */
export function generateProgressFeedback(
  benchmark: Benchmark,
  testDef?: BaselineTestDefinition
): ProgressFeedback {
  const displayName = testDef?.displayName || benchmark.testName.replace(/_/g, ' ')
  const changePercent = benchmark.changePercent
  const previousValue = benchmark.previousValue
  const currentValue = benchmark.testValue
  
  // Determine trend and tone
  let trend: 'improved' | 'maintained' | 'declined'
  let feedbackTone: 'positive' | 'neutral' | 'encouraging'
  let headline: string
  let message: string
  
  if (changePercent === null || previousValue === null) {
    // First test
    trend = 'maintained'
    feedbackTone = 'neutral'
    headline = `${displayName} Baseline Recorded`
    message = `Your baseline ${displayName} is ${currentValue} ${benchmark.testUnit}. This will be used to track your progress.`
  } else if (changePercent > 5) {
    trend = 'improved'
    feedbackTone = 'positive'
    headline = `${displayName} Improved!`
    message = `Great progress! Your ${displayName} improved from ${previousValue} to ${currentValue} ${benchmark.testUnit} (+${changePercent.toFixed(1)}%).`
  } else if (changePercent < -5) {
    trend = 'declined'
    feedbackTone = 'encouraging'
    headline = `${displayName} Update`
    message = `Your ${displayName} is ${currentValue} ${benchmark.testUnit}, down from ${previousValue}. Fluctuations are normal - keep training consistently.`
  } else {
    trend = 'maintained'
    feedbackTone = 'neutral'
    headline = `${displayName} Holding Steady`
    message = `Your ${displayName} is consistent at ${currentValue} ${benchmark.testUnit}. Stability is good - strength gains will follow.`
  }
  
  return {
    headline,
    message,
    testName: benchmark.testName,
    previousValue,
    currentValue,
    changePercent,
    trend,
    feedbackTone,
  }
}

// =============================================================================
// SKILL STATE INTEGRATION
// =============================================================================

/**
 * Map benchmark movement family to skill readiness adjustment
 */
const BENCHMARK_TO_SKILL_MAP: Record<string, { skill: SkillKey; factor: number }[]> = {
  'max_pull_ups': [
    { skill: 'front_lever', factor: 0.3 },
    { skill: 'muscle_up', factor: 0.4 },
    { skill: 'back_lever', factor: 0.2 },
  ],
  'weighted_pull_3rm': [
    { skill: 'front_lever', factor: 0.4 },
    { skill: 'muscle_up', factor: 0.3 },
  ],
  'max_dips': [
    { skill: 'muscle_up', factor: 0.3 },
    { skill: 'hspu', factor: 0.2 },
    { skill: 'planche', factor: 0.15 },
  ],
  'l_sit_hold': [
    { skill: 'l_sit', factor: 0.6 },
    { skill: 'front_lever', factor: 0.2 },
    { skill: 'planche', factor: 0.15 },
  ],
  'hollow_hold': [
    { skill: 'front_lever', factor: 0.15 },
    { skill: 'back_lever', factor: 0.15 },
    { skill: 'planche', factor: 0.1 },
  ],
  'tuck_front_lever_hold': [
    { skill: 'front_lever', factor: 0.5 },
  ],
  'wall_handstand_hold': [
    { skill: 'hspu', factor: 0.4 },
  ],
  'ring_support_hold': [
    { skill: 'muscle_up', factor: 0.25 },
  ],
}

/**
 * Calculate readiness adjustment from benchmark improvement
 */
export function calculateReadinessAdjustment(
  benchmark: Benchmark
): { skill: SkillKey; adjustment: number }[] {
  const mappings = BENCHMARK_TO_SKILL_MAP[benchmark.testName]
  if (!mappings) return []
  
  const testDef = BASELINE_TESTS.find(t => t.testName === benchmark.testName)
  if (!testDef) return []
  
  // Calculate how the benchmark compares to targets
  const performanceRatio = benchmark.testValue / testDef.targetValue
  const clampedRatio = Math.min(1.5, Math.max(0, performanceRatio)) // Cap at 150%
  
  // Calculate improvement factor from change
  let improvementMultiplier = 1.0
  if (benchmark.changePercent && benchmark.changePercent > 0) {
    improvementMultiplier = 1 + (benchmark.changePercent / 100) * 0.5 // 10% improvement = 1.05x
  }
  
  return mappings.map(m => ({
    skill: m.skill,
    adjustment: clampedRatio * m.factor * improvementMultiplier * 10, // Scale to ~0-15 points
  }))
}

/**
 * Get limiter detection from benchmarks
 */
export function detectLimiterFromBenchmarks(
  benchmarks: Benchmark[]
): { limiter: string; confidence: number; evidence: string } | null {
  if (benchmarks.length === 0) return null
  
  // Group by movement family and find weakest
  const familyScores: Record<string, { score: number; tests: string[] }> = {}
  
  for (const b of benchmarks) {
    const testDef = BASELINE_TESTS.find(t => t.testName === b.testName)
    if (!testDef) continue
    
    const performanceRatio = b.testValue / testDef.targetValue
    const family = b.movementFamily
    
    if (!familyScores[family]) {
      familyScores[family] = { score: 0, tests: [] }
    }
    
    familyScores[family].score += performanceRatio
    familyScores[family].tests.push(b.testName)
  }
  
  // Average scores
  for (const family of Object.keys(familyScores)) {
    familyScores[family].score /= familyScores[family].tests.length
  }
  
  // Find lowest scoring family
  let weakestFamily: string | null = null
  let lowestScore = Infinity
  
  for (const [family, data] of Object.entries(familyScores)) {
    if (data.score < lowestScore) {
      lowestScore = data.score
      weakestFamily = family
    }
  }
  
  if (!weakestFamily) return null
  
  // Map to limiter type
  const limiterMap: Record<string, string> = {
    'vertical_pull': 'pull_strength',
    'horizontal_pull': 'pull_strength',
    'straight_arm_pull': 'straight_arm_pull_strength',
    'vertical_push': 'push_strength',
    'dip_pattern': 'push_strength',
    'straight_arm_push': 'straight_arm_push_strength',
    'compression_core': 'compression_strength',
    'ring_support': 'ring_stability',
    'handstand': 'overhead_stability',
  }
  
  const limiter = limiterMap[weakestFamily] || weakestFamily
  const confidence = Math.min(0.8, 0.3 + (familyScores[weakestFamily].tests.length * 0.15))
  const evidence = `Based on ${familyScores[weakestFamily].tests.join(', ')} benchmarks`
  
  return { limiter, confidence, evidence }
}

// =============================================================================
// ENVELOPE INTEGRATION
// =============================================================================

/**
 * Generate envelope adjustment recommendations from benchmark trends
 */
export interface EnvelopeAdjustment {
  movementFamily: BenchmarkMovementFamily
  adjustmentType: 'volume_increase' | 'volume_decrease' | 'intensity_increase' | 'intensity_decrease' | 'no_change'
  confidence: number
  reason: string
}

export function getEnvelopeAdjustments(
  trends: BenchmarkTrend[]
): EnvelopeAdjustment[] {
  const adjustments: EnvelopeAdjustment[] = []
  
  for (const trend of trends) {
    let adjustmentType: EnvelopeAdjustment['adjustmentType'] = 'no_change'
    let reason = ''
    
    if (trend.trend === 'improving' && trend.trendStrength > 0.5) {
      // Strong improvement - current approach is working
      adjustmentType = 'no_change'
      reason = `${trend.testName} is improving well. Maintain current training approach.`
    } else if (trend.trend === 'declining' && trend.trendStrength > 0.3) {
      // Declining - reduce volume or intensity
      adjustmentType = 'volume_decrease'
      reason = `${trend.testName} is declining. Consider reducing volume to allow recovery.`
    } else if (trend.trend === 'stable' && trend.trendStrength > 0.7) {
      // Very stable plateau - increase stimulus
      adjustmentType = 'intensity_increase'
      reason = `${trend.testName} has plateaued. Consider increasing intensity to drive adaptation.`
    }
    
    adjustments.push({
      movementFamily: trend.movementFamily,
      adjustmentType,
      confidence: trend.confidenceScore * trend.trendStrength,
      reason,
    })
  }
  
  return adjustments
}

// =============================================================================
// CONSERVATIVE ESTIMATES FOR ONBOARDING
// =============================================================================

/**
 * Generate conservative baseline estimates when values are unknown
 */
export function getConservativeEstimates(
  experienceLevel: 'new' | 'some' | 'intermediate' | 'advanced'
): Record<string, number> {
  const multipliers: Record<string, number> = {
    new: 0.3,
    some: 0.5,
    intermediate: 0.75,
    advanced: 1.0,
  }
  
  const mult = multipliers[experienceLevel]
  
  const estimates: Record<string, number> = {}
  
  for (const test of BASELINE_TESTS) {
    // Use target value scaled by experience
    estimates[test.testName] = Math.round(test.targetValue * mult)
  }
  
  return estimates
}

// =============================================================================
// EXPORTS
// =============================================================================
//
// [DUPLICATE-EXPORT-CONTRACT-FIX]
// All public symbols of this module are exported inline at their declaration
// (`export function ...`, `export const ...`). The previous bottom
// `export { ... }` re-export block redeclared every one of them, which
// TypeScript reports as "Cannot redeclare exported variable" /
// "Export declaration conflicts with exported declaration" (TS2300/TS2484).
// We keep the inline declarations as the single canonical export style and
// remove the duplicate block. Public API is unchanged: every symbol is
// still exported with the same name and signature.
