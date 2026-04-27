// =============================================================================
// PHASE N — POST /api/workout-log/save-evidence
// =============================================================================
// Server-side persistence corridor for the canonical WorkoutLog set evidence.
// The client (lib/workout-log-service.ts.saveWorkoutLog) fires this
// non-blockingly AFTER the localStorage save succeeds, so the live workout
// UI is never blocked by network/DB latency. If this route fails, the user's
// workout still saved locally and the existing Phase M `recentWorkoutLogs`
// payload is still the immediate transport — the only thing lost is durable
// server-readable history for that single workout.
//
// Doctrine:
//   - User-scoped: dbUserId is resolved from the auth session, NEVER from
//     the request body. A malicious client cannot persist evidence on
//     behalf of another user.
//   - Idempotent: the underlying writer dedupes by `evidence_hash`, so
//     replaying the same payload is safe.
//   - Untrusted / demo logs are filtered by the writer; we still accept the
//     request and return diagnostic so the client can log it.
// =============================================================================

import { NextResponse } from 'next/server'
import { getSession, getCurrentUserServer } from '@/lib/auth-service-server'
import { resolveCanonicalDbUserId } from '@/lib/subscription-service'
import { persistWorkoutLogSetEvidence } from '@/lib/server/workout-set-evidence-persistence'
import type { MinimalWorkoutLogShape } from '@/lib/program/performance-feedback-adaptation-contract'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SaveEvidenceRequestBody {
  workoutLog: MinimalWorkoutLogShape & { id: string; createdAt?: string }
  programId?: string | null
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

    let body: SaveEvidenceRequestBody
    try {
      body = (await request.json()) as SaveEvidenceRequestBody
    } catch {
      return NextResponse.json(
        { ok: false, reason: 'invalid_json' },
        { status: 400 },
      )
    }

    if (!body?.workoutLog || typeof body.workoutLog !== 'object' || !body.workoutLog.id) {
      return NextResponse.json(
        { ok: false, reason: 'invalid_payload' },
        { status: 400 },
      )
    }

    const result = await persistWorkoutLogSetEvidence({
      dbUserId,
      programId: body.programId ?? null,
      workoutLog: body.workoutLog,
    })

    console.log('[phase-n-save-evidence-result]', {
      dbUserId,
      programId: body.programId ?? null,
      workoutLogId: body.workoutLog.id,
      ...result,
    })

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.log('[phase-n-save-evidence-route-error]', { error: String(err) })
    return NextResponse.json(
      { ok: false, reason: 'server_error', error: String(err) },
      { status: 500 },
    )
  }
}
