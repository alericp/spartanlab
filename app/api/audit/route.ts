import { NextResponse } from 'next/server'
import { getCurrentUserServer, getSession } from '@/lib/auth-service-server'
import { runFullAudit, auditSkill } from '@/lib/skill-audit-system'
import type { SkillType } from '@/lib/training-principles-engine'
import { checkOwnerByEmail } from '@/lib/owner-access'
import { decideOwnerAccess } from '@/lib/server/athlete-ownership'

/**
 * GET /api/audit
 * Diagnostic skill audit. Owner email only. Does not accept an athlete id.
 */
export async function GET(request: Request) {
  const { userId } = await getSession()
  const user = await getCurrentUserServer()
  const access = decideOwnerAccess(userId, user?.email ?? null, checkOwnerByEmail)
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { searchParams } = new URL(request.url)
  const skill = searchParams.get('skill') as SkillType | null

  if (skill) {
    return NextResponse.json({ result: auditSkill(skill) })
  }

  const audit = runFullAudit()
  return NextResponse.json({
    summary: audit.summary,
    systemStatus: audit.systemStatus,
    results: audit.results,
    timestamp: new Date().toISOString(),
  })
}
