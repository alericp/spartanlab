/**
 * [TEMP-INSTRUMENTATION]
 *
 * Server-side audit writer for the grouped-body funnel.
 *
 * Why this exists:
 *   The client-side [FUNNEL-AUDIT] probe in AdaptiveSessionCard.tsx POSTs to
 *   /api/public/_funnel-audit on every card mount. In the deployed preview
 *   that POST is never producing rows in public.funnel_audit_log (confirmed
 *   zero rows after multiple user navigations). Rather than adding yet more
 *   client-side telemetry, this helper captures the same Stage 1 truth
 *   SERVER-SIDE at generation time, using the exact program payload the
 *   builder produced. It runs inside the single shared generation pipeline
 *   (executeAuthoritativeGeneration) so it fires on every fresh build,
 *   regenerate, modify, and onboarding-first-program path.
 *
 * Scope:
 *   One INSERT per session per generation into the existing funnel_audit_log
 *   table. Best-effort: any DB/shape error is swallowed so the generation
 *   response is never blocked on telemetry.
 *
 * Removal:
 *   Delete this file, the single call in authoritative-program-generation.ts,
 *   and (in the same cleanup turn) the client POST + public route + temp
 *   table once the root cause is identified.
 */
import { getSqlClient } from '@/lib/db'

interface MinimalExercise {
  id?: string
  name?: string
  category?: string
  method?: string
  methodLabel?: string
  blockId?: string
  selectionReason?: string
}

interface MinimalStyledGroup {
  groupType?: string
  members?: unknown[]
}

interface MinimalSession {
  dayNumber?: number | string
  exercises?: MinimalExercise[]
  styleMetadata?: {
    styledGroups?: MinimalStyledGroup[]
  }
}

interface MinimalProgram {
  id?: string
  sessions?: MinimalSession[]
}

export async function writeServerSideFunnelAuditForProgram(
  program: MinimalProgram,
  triggerSource: string,
): Promise<void> {
  try {
    const sql = await getSqlClient()
    if (!sql) return

    const sessions = Array.isArray(program?.sessions) ? program.sessions : []

    for (const session of sessions) {
      const dayNumber =
        typeof session?.dayNumber === 'number'
          ? session.dayNumber
          : typeof session?.dayNumber === 'string'
            ? Number.parseInt(session.dayNumber, 10) || null
            : null

      const exercises = Array.isArray(session?.exercises) ? session.exercises : []
      const styledGroups = Array.isArray(session?.styleMetadata?.styledGroups)
        ? session.styleMetadata!.styledGroups!
        : []

      const s1StyledGroupsCount = styledGroups.length
      const s1NonStraight = styledGroups.filter(
        (g) => g?.groupType && g.groupType !== 'straight',
      ).length
      const s1ExCount = exercises.length
      const s1ExWithBlockId = exercises.filter((e) => !!e?.blockId).length
      const s1ExWithNonStraightMethod = exercises.filter(
        (e) => !!e?.method && e.method !== 'straight',
      ).length

      // Same verdict table the client probe uses, restricted to Stage 1 facts
      // (server doesn't render, so Stage 6/7/8 don't exist here). This lets
      // the agent read the SAME verdict keywords from the SAME column.
      let verdict: string
      if (s1StyledGroupsCount === 0 && s1ExWithBlockId === 0 && s1ExWithNonStraightMethod === 0) {
        verdict = 'STAGE1_FLAT_NO_UPSTREAM_GROUPED_TRUTH'
      } else if (s1NonStraight === 0 && s1ExWithNonStraightMethod === 0) {
        verdict = 'STAGE1_ONLY_STRAIGHT_GROUPED_TRUTH'
      } else {
        verdict = 'STAGE1_GROUPED_TRUTH_PRESENT_SERVER_SIDE'
      }

      // Sample up to 6 exercises for payload so we can see names + methods
      const exerciseSample = exercises.slice(0, 8).map((e) => ({
        name: e?.name ?? null,
        category: e?.category ?? null,
        method: e?.method ?? null,
        methodLabel: e?.methodLabel ?? null,
        blockId: e?.blockId ?? null,
        isPrimary: !!e?.selectionReason?.includes('primary'),
      }))

      const payload = {
        source: 'server_side_generation',
        triggerSource,
        programId: program?.id ?? null,
        day: dayNumber,
        s1_styledGroups: s1StyledGroupsCount,
        s1_nonStraight: s1NonStraight,
        s1_exCount: s1ExCount,
        s1_exWithBlockId: s1ExWithBlockId,
        s1_exWithNonStraightMethod: s1ExWithNonStraightMethod,
        styledGroupTypes: styledGroups.map((g) => g?.groupType ?? null),
        exerciseSample,
        verdict,
      }

      const id = `fa_srv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

      try {
        await sql`
          insert into public.funnel_audit_log
            (id, day_number, verdict, selected_variant, payload)
          values
            (${id}, ${dayNumber}, ${verdict}, ${triggerSource}, ${JSON.stringify(payload)}::jsonb)
        `
      } catch (insertErr) {
        // swallow per-row insert errors so the generation path is never blocked
        console.log(
          '[v0] [FUNNEL-AUDIT-SERVER] server-insert-error',
          (insertErr as Error)?.message,
        )
      }
    }
  } catch (outerErr) {
    // swallow top-level errors for the same reason
    console.log(
      '[v0] [FUNNEL-AUDIT-SERVER] server-outer-error',
      (outerErr as Error)?.message,
    )
  }
}
