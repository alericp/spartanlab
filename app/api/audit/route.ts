import { NextResponse } from 'next/server'
import { runFullAudit, auditSkill, type AuditResult } from '@/lib/skill-audit-system'
import type { SkillType } from '@/lib/training-principles-engine'

/**
 * GET /api/audit
 * Run system-wide skill audit
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const skill = searchParams.get('skill') as SkillType | null

  if (skill) {
    // Audit single skill
    const result = auditSkill(skill)
    return NextResponse.json({ result })
  }

  // Run full system audit
  const audit = runFullAudit()
  
  return NextResponse.json({
    summary: audit.summary,
    systemStatus: audit.systemStatus,
    results: audit.results,
    timestamp: new Date().toISOString(),
  })
}
