import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-service-server'
import { runFullAudit, auditSkill } from '@/lib/skill-audit-system'
import type { SkillType } from '@/lib/training-principles-engine'
import { runWhenAuthenticated } from '@/lib/server/athlete-ownership'

/**
 * GET /api/audit
 * Run system-wide skill audit for an authenticated Clerk user.
 * The audit is diagnostic and does not accept an athlete id.
 */
export async function GET(request: Request) {
  const { userId } = await getSession()
  const { searchParams } = new URL(request.url)
  const skill = searchParams.get('skill') as SkillType | null

  const result = await runWhenAuthenticated({
    authenticatedUserId: userId,
    load: async () => {
      if (skill) {
        return { result: auditSkill(skill) }
      }

      const audit = runFullAudit()
      return {
        summary: audit.summary,
        systemStatus: audit.systemStatus,
        results: audit.results,
        timestamp: new Date().toISOString(),
      }
    },
  })

  return NextResponse.json(result.body, { status: result.status })
}
