// =============================================================================
// PPX-R7.5 — POST /api/workout-log/delete-evidence
// =============================================================================
// Server-side deletion corridor for workout set evidence. Called non-blockingly
// by lib/workout-log-service.ts.deleteWorkoutLog() after the localStorage
// delete succeeds. Ensures deleted workouts don't feed future adaptation.
//
// Doctrine:
//   - User-scoped: dbUserId is resolved from auth session, NEVER from body.
//   - Only deletes rows for the authenticated user AND the specified log id.
//   - If the route fails, local delete still succeeded — the user's UI is fine.
//   - Returns diagnostic count for dev observability.
// =============================================================================

import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DeleteEvidenceRequestBody {
  workoutLogId: string
}

export async function POST(request: Request) {
  try {
    const { userId: authUserId } = await getSession()
    if (!authUserId) {
      return NextResponse.json(
        { ok: false, reason: 'unauthorized' },
        { status: 401 },
      )
    }

    const currentUser = await getCurrentUserServer()
    const { dbUserId } = await resolveCanonicalDbUserId(
      authUserId,
      currentUser?.email,
      currentUser?.username,
    )
    if (!dbUserId) {
      return NextResponse.json(
        { ok: false, reason: 'no_canonical_user' },
        { status: 401 },
      )
    }

    let body: DeleteEvidenceRequestBody
    try {
      body = (await request.json()) as DeleteEvidenceRequestBody
    } catch {
      return NextResponse.json(
        { ok: false, reason: 'invalid_json' },
        { status: 400 },
      )
    }

    if (!body?.workoutLogId || typeof body.workoutLogId !== 'string') {
      return NextResponse.json(
        { ok: false, reason: 'invalid_payload' },
        { status: 400 },
      )
    }

    const url = process.env.DATABASE_URL
    if (!url) {
      return NextResponse.json(
        { ok: false, reason: 'no_database' },
        { status: 500 },
      )
    }

    const sql = neon(url)
    
    // Delete all evidence rows for this user and workout log id
    const result = await sql`
      DELETE FROM workout_log_set_evidence
      WHERE user_id = ${dbUserId}
        AND workout_log_id = ${body.workoutLogId}
      RETURNING id
    `

    const deletedCount = Array.isArray(result) ? result.length : 0

    console.log('[PPX-R7.5-delete-evidence-result]', {
      dbUserId,
      workoutLogId: body.workoutLogId,
      deletedCount,
    })

    return NextResponse.json({ ok: true, deletedCount })
  } catch (err) {
    console.log('[PPX-R7.5-delete-evidence-route-error]', { error: String(err) })
    return NextResponse.json(
      { ok: false, reason: 'server_error', error: String(err) },
      { status: 500 },
    )
  }
}
