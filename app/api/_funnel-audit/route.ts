// [TEMP-INSTRUMENTATION] Narrow, removable server sink for the existing
// client-side [FUNNEL-AUDIT] probe in components/programs/AdaptiveSessionCard.tsx.
//
// Purpose: make the per-card audit payload land in SERVER logs so it is
// captured by the platform log stream even if client console output is not
// available. Server-only console.log with a distinctive marker; no DB writes,
// no state, no response body beyond 204.
//
// Remove this file and the companion useEffect in AdaptiveSessionCard.tsx
// once the tested session's first-failing-stage verdict has been captured.
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    // Distinctive marker so the line is trivially greppable in server logs.
    console.log('[v0] [FUNNEL-AUDIT-SERVER]', JSON.stringify(payload))
  } catch (err) {
    console.log('[v0] [FUNNEL-AUDIT-SERVER] parse-error', (err as Error)?.message)
  }
  return new NextResponse(null, { status: 204 })
}
