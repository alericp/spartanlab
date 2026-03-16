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
} from '@/lib/benchmark-testing-engine'

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
    
    const body = await request.json()
    const input: BenchmarkInput = {
      movementFamily: body.movementFamily,
      testName: body.testName,
      testCategory: body.testCategory,
      testValue: Number(body.testValue),
      testUnit: body.testUnit,
      bodyweightAtTest: body.bodyweightAtTest ? Number(body.bodyweightAtTest) : undefined,
      testConditions: body.testConditions,
      confidenceScore: body.confidenceScore,
      dataQuality: body.dataQuality,
      isBaseline: body.isBaseline,
      notes: body.notes,
    }
    
    // Validate required fields
    if (!input.movementFamily || !input.testName || !input.testCategory || input.testValue === undefined || !input.testUnit) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        required: ['movementFamily', 'testName', 'testCategory', 'testValue', 'testUnit'] 
      }, { status: 400 })
    }
    
    // Create the benchmark
    const benchmark = await createBenchmark(userId, input)
    
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
