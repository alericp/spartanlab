// [TEMP-INSTRUMENTATION] Removable server sink for the client-side
// [FUNNEL-AUDIT] probe in components/programs/AdaptiveSessionCard.tsx.
//
// Placed under /api/public/ so Clerk's proxy.ts matcher (which includes the
// '/api/public(.*)' pattern in CLERK_PUBLIC_ROUTE_PATTERNS) does not block
// unauthenticated POSTs -- required because the fire-and-forget client
// telemetry runs before we can depend on session cookies propagating through.
//
// Writes each audit payload to public.funnel_audit_log (Neon). The row can
// then be read back server-side on the next turn via queryOne/query from
// lib/db.ts, capturing the runtime verdict without depending on console
// scraping. Also mirrors to stdout with the distinctive [FUNNEL-AUDIT-SERVER]
// marker for parallel log-based inspection.
//
// Remove this file, the /api/public/_funnel-audit directory, the companion
// fetch + dedupe set in AdaptiveSessionCard.tsx, and drop the table in the
// cleanup turn.
import { NextResponse } from 'next/server'
import { getSqlClient } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let payload: any = null
  try {
    payload = await request.json()
  } catch (err) {
    console.log('[v0] [FUNNEL-AUDIT-SERVER] parse-error', (err as Error)?.message)
    return new NextResponse(null, { status: 400 })
  }

  // Distinctive marker so the line is trivially greppable in server logs.
  console.log('[v0] [FUNNEL-AUDIT-SERVER]', JSON.stringify(payload))

  try {
    const sql = await getSqlClient()
    if (sql) {
      const id = `fa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      const dayNumber =
        typeof payload?.day === 'number' ? payload.day : null
      const verdict =
        typeof payload?.verdict === 'string' ? payload.verdict : null
      const selectedVariant =
        typeof payload?.selectedVariant === 'string'
          ? payload.selectedVariant
          : null

      await sql`
        insert into public.funnel_audit_log
          (id, day_number, verdict, selected_variant, payload)
        values
          (${id}, ${dayNumber}, ${verdict}, ${selectedVariant}, ${JSON.stringify(payload)}::jsonb)
      `
    }
  } catch (err) {
    console.log(
      '[v0] [FUNNEL-AUDIT-SERVER] db-insert-error',
      (err as Error)?.message,
    )
  }

  return new NextResponse(null, { status: 204 })
}
