/**
 * POST /api/program/advance-week
 * 
 * Advances the active program to the next week WITHOUT regenerating.
 * This is a simple state mutation that only updates the weekNumber field.
 * 
 * CRITICAL: This route does NOT call any program generation logic.
 * It only modifies the persisted weekNumber and returns success/failure.
 */

import { NextResponse } from 'next/server'

// Note: The actual advancement logic runs client-side since the program
// is stored in localStorage. This route exists for:
// 1. Future migration to server-side storage
// 2. Consistent API pattern
// 3. Potential auth/logging needs

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    
    // Optional: target week for specific advancement
    const targetWeek = body.targetWeek as number | undefined
    
    // Since the program is in localStorage, we return instructions
    // for the client to perform the advancement
    return NextResponse.json({
      success: true,
      action: 'advance_week',
      targetWeek: targetWeek || null,
      message: 'Week advancement should be performed client-side using week-advancement-service',
      clientInstructions: {
        import: '@/lib/week-advancement-service',
        function: targetWeek ? 'advanceToWeek' : 'advanceToNextWeek',
        args: targetWeek ? [targetWeek] : [],
      },
    })
  } catch (err) {
    console.error('[api/program/advance-week] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/program/advance-week
 * 
 * Returns the current week progression state.
 */
export async function GET() {
  // This is informational - actual state comes from client
  return NextResponse.json({
    message: 'Use client-side getWeekProgressionState() for current week info',
    clientInstructions: {
      import: '@/lib/week-advancement-service',
      function: 'getWeekProgressionState',
    },
  })
}
