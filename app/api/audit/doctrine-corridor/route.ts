/**
 * GET /api/audit/doctrine-corridor
 *
 * Phase 1 read-only audit endpoint that walks the doctrine truth corridor
 * (source-batches → runtime contract → builder → final program → Program page)
 * and returns a machine-readable PASS/FAIL map.
 *
 * This route is diagnostic only:
 * - Does not change generation behavior.
 * - Does not write to the doctrine DB.
 * - Does not require auth changes.
 * - Does not return user-private data (only structural doctrine readiness).
 *
 * The companion route at /api/audit/doctrine-db remains untouched.
 */

import { NextResponse } from 'next/server'
import { buildDoctrineCorridorReport } from '@/lib/doctrine/doctrine-corridor-audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const report = await buildDoctrineCorridorReport()
    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        phase: 'doctrine_corridor_audit_phase1',
        verdict: 'BLOCKED',
        blocker: error instanceof Error ? error.message : 'unknown_audit_error',
      },
      { status: 500 },
    )
  }
}
