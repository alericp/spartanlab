import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  createBenchmark,
  getUserBenchmarks,
  getProgressTestTriggers,
  getAllBenchmarkTrends,
  generateProgressFeedback,
  getBaselineTests,
  calculateReadinessAdjustment,
  detectLimiterFromBenchmarks,
  type BenchmarkInput,
  type BenchmarkMovementFamily,
  type TestCategory,
  type TestUnit,
  type TestCondition,
  type DataQuality,
} from '@/lib/benchmark-testing-engine'

// =============================================================================
// [AB11-2] NARROW POST VALIDATION
// =============================================================================
// The Calibration Checkpoint card now submits real user input. We harden
// the POST body with the canonical unions so a malformed client cannot
// persist garbage. The arrays below are the *runtime* sources of truth;
// if the type-level unions in `lib/benchmark-testing-engine.ts` ever
// drift, TypeScript will fail at the `satisfies` checks below — that is
// the point.
// =============================================================================

const MOVEMENT_FAMILIES = [
  'vertical_pull',
  'horizontal_pull',
  'vertical_push',
  'dip_pattern',
  'straight_arm_pull',
  'straight_arm_push',
  'compression_core',
  'explosive_pull',
  'ring_support',
  'handstand',
] as const satisfies readonly BenchmarkMovementFamily[]

const TEST_CATEGORIES = [
  'strength',
  'skill',
  'endurance',
  'flexibility',
] as const satisfies readonly TestCategory[]

const TEST_UNITS = [
  'reps',
  'seconds',
  'kg',
  'lbs',
  'progression_level',
  'percentage',
] as const satisfies readonly TestUnit[]

const TEST_CONDITIONS = [
  'fresh',
  'fatigued',
  'post_workout',
  'unknown',
] as const satisfies readonly TestCondition[]

const DATA_QUALITIES = [
  'self_reported',
  'video_verified',
  'coached',
] as const satisfies readonly DataQuality[]

function isMovementFamily(v: unknown): v is BenchmarkMovementFamily {
  return typeof v === 'string' && (MOVEMENT_FAMILIES as readonly string[]).includes(v)
}
function isTestCategory(v: unknown): v is TestCategory {
  return typeof v === 'string' && (TEST_CATEGORIES as readonly string[]).includes(v)
}
function isTestUnit(v: unknown): v is TestUnit {
  return typeof v === 'string' && (TEST_UNITS as readonly string[]).includes(v)
}
function isTestCondition(v: unknown): v is TestCondition {
  return typeof v === 'string' && (TEST_CONDITIONS as readonly string[]).includes(v)
}
function isDataQuality(v: unknown): v is DataQuality {
  return typeof v === 'string' && (DATA_QUALITIES as readonly string[]).includes(v)
}

/**
 * GET /api/benchmarks
 * 
 * Retrieves benchmark data for the current user
 * Query params:
 *   - action: 'list' | 'triggers' | 'trends' | 'tests' | 'limiter'
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('spartanlab_user_id')?.value
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    
    switch (action) {
      case 'list': {
        const benchmarks = await getUserBenchmarks(userId)
        return NextResponse.json({ 
          success: true, 
          benchmarks,
          count: benchmarks.length,
        })
      }
      
      case 'triggers': {
        const triggers = await getProgressTestTriggers(userId)
        return NextResponse.json({ 
          success: true, 
          triggers,
          hasPendingTests: triggers.length > 0,
          highPriorityCount: triggers.filter(t => t.priority === 'high').length,
        })
      }
      
      case 'trends': {
        const periodWeeks = parseInt(searchParams.get('weeks') || '12', 10)
        const trends = await getAllBenchmarkTrends(userId, periodWeeks)
        return NextResponse.json({ 
          success: true, 
          trends,
          improvingCount: trends.filter(t => t.trend === 'improving').length,
          decliningCount: trends.filter(t => t.trend === 'declining').length,
          stableCount: trends.filter(t => t.trend === 'stable').length,
        })
      }
      
      case 'tests': {
        const tests = getBaselineTests()
        return NextResponse.json({ 
          success: true, 
          tests,
          essentialCount: tests.filter(t => t.priority === 'essential').length,
        })
      }
      
      case 'limiter': {
        const benchmarks = await getUserBenchmarks(userId)
        const limiter = detectLimiterFromBenchmarks(benchmarks)
        return NextResponse.json({ 
          success: true, 
          limiter,
          hasSufficientData: benchmarks.length >= 3,
        })
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in benchmarks GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/benchmarks
 * 
 * Creates a new benchmark record
 * Body: BenchmarkInput
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('spartanlab_user_id')?.value
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid body', details: 'Expected JSON object' },
        { status: 400 },
      )
    }
    const raw = body as Record<string, unknown>

    // [AB11-2] Narrow runtime validation. Required fields must satisfy
    // the canonical unions or we reject before hitting the persistence
    // layer.
    if (!isMovementFamily(raw.movementFamily)) {
      return NextResponse.json(
        { error: 'Invalid movementFamily', allowed: MOVEMENT_FAMILIES },
        { status: 400 },
      )
    }
    if (!isTestCategory(raw.testCategory)) {
      return NextResponse.json(
        { error: 'Invalid testCategory', allowed: TEST_CATEGORIES },
        { status: 400 },
      )
    }
    if (!isTestUnit(raw.testUnit)) {
      return NextResponse.json(
        { error: 'Invalid testUnit', allowed: TEST_UNITS },
        { status: 400 },
      )
    }
    if (typeof raw.testName !== 'string' || raw.testName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid testName', details: 'Non-empty string required' },
        { status: 400 },
      )
    }
    const testValueNum = Number(raw.testValue)
    if (!Number.isFinite(testValueNum) || testValueNum <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid testValue',
          details: 'Must be a finite number greater than 0',
        },
        { status: 400 },
      )
    }

    // Optional fields — narrow only when present, otherwise leave
    // undefined so existing engine defaults apply.
    let bodyweightAtTest: number | undefined
    if (
      raw.bodyweightAtTest !== undefined &&
      raw.bodyweightAtTest !== null &&
      raw.bodyweightAtTest !== ''
    ) {
      const bw = Number(raw.bodyweightAtTest)
      if (!Number.isFinite(bw) || bw <= 0) {
        return NextResponse.json(
          {
            error: 'Invalid bodyweightAtTest',
            details: 'Must be a finite number greater than 0 when provided',
          },
          { status: 400 },
        )
      }
      bodyweightAtTest = bw
    }

    let testConditions: TestCondition | undefined
    if (raw.testConditions !== undefined) {
      if (!isTestCondition(raw.testConditions)) {
        return NextResponse.json(
          { error: 'Invalid testConditions', allowed: TEST_CONDITIONS },
          { status: 400 },
        )
      }
      testConditions = raw.testConditions
    }

    let confidenceScore: number | undefined
    if (raw.confidenceScore !== undefined && raw.confidenceScore !== null) {
      const cs = Number(raw.confidenceScore)
      if (!Number.isFinite(cs) || cs < 0 || cs > 1) {
        return NextResponse.json(
          {
            error: 'Invalid confidenceScore',
            details: 'Must be a number between 0 and 1 when provided',
          },
          { status: 400 },
        )
      }
      confidenceScore = cs
    }

    let dataQuality: DataQuality | undefined
    if (raw.dataQuality !== undefined) {
      if (!isDataQuality(raw.dataQuality)) {
        return NextResponse.json(
          { error: 'Invalid dataQuality', allowed: DATA_QUALITIES },
          { status: 400 },
        )
      }
      dataQuality = raw.dataQuality
    }

    let isBaseline: boolean | undefined
    if (raw.isBaseline !== undefined) {
      if (typeof raw.isBaseline !== 'boolean') {
        return NextResponse.json(
          {
            error: 'Invalid isBaseline',
            details: 'Boolean required when provided',
          },
          { status: 400 },
        )
      }
      isBaseline = raw.isBaseline
    }

    let notes: string | undefined
    if (raw.notes !== undefined && raw.notes !== null) {
      if (typeof raw.notes !== 'string') {
        return NextResponse.json(
          {
            error: 'Invalid notes',
            details: 'String required when provided',
          },
          { status: 400 },
        )
      }
      // Cap notes length so we never persist an unbounded blob.
      notes = raw.notes.slice(0, 2000)
    }

    const input: BenchmarkInput = {
      movementFamily: raw.movementFamily,
      testName: raw.testName.trim(),
      testCategory: raw.testCategory,
      testValue: testValueNum,
      testUnit: raw.testUnit,
      bodyweightAtTest,
      testConditions,
      confidenceScore,
      dataQuality,
      isBaseline,
      notes,
    }
    
    // Create the benchmark
    const benchmark = await createBenchmark(userId, input)

    // [PRE-AB6 BUILD GREEN GATE / NULLABLE BENCHMARK GUARD]
    // createBenchmark returns Promise<Benchmark | null> (insert may
    // fail at the persistence layer). Both generateProgressFeedback
    // and calculateReadinessAdjustment require a non-null Benchmark.
    // Surface a real error response instead of force-asserting; the
    // type narrowing below makes `benchmark` Benchmark for the
    // remainder of the function.
    if (!benchmark) {
      return NextResponse.json(
        { error: 'Failed to create benchmark', details: 'Persistence layer returned no record' },
        { status: 500 }
      )
    }

    // Generate feedback
    const feedback = generateProgressFeedback(benchmark)

    // Calculate readiness adjustments
    const readinessAdjustments = calculateReadinessAdjustment(benchmark)
    
    return NextResponse.json({
      success: true,
      benchmark,
      feedback,
      readinessAdjustments,
      message: feedback.headline,
    })
  } catch (error) {
    console.error('Error in benchmarks POST:', error)
    return NextResponse.json(
      { error: 'Failed to create benchmark', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
