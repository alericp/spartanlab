'use client'

/**
 * [PHASE 4B] PROGRAM MATERIALIZATION STALE NOTICE
 *
 * Single visible surface that tells the user their saved program predates
 * doctrine materialization (Phase 4A). Renders the one user-facing action
 * required to fix it: a "Regenerate with Doctrine" button that calls the
 * existing canonical regenerate handler (`onRegenerate`), which dispatches
 * through `/api/program/regenerate` → `executeAuthoritativeGeneration` →
 * builder + doctrine selection + materialization stamp.
 *
 * Truth contract:
 *   - Reads ONLY `program.doctrineIntegration.{methodDecisionVersion,
 *     materializationRollup, allSessionsFlat}` — fields that the Phase 4A
 *     wrapper writes onto every fresh build.
 *   - Renders nothing when the saved program already has the current
 *     `phase_3c.profile_aware.v1` stamp AND at least one session has
 *     real structural change. No fake "doctrine applied" claim against
 *     a stale or all-flat program.
 *   - The button does not duplicate logic — it is a thin call to the
 *     existing `onRegenerate` handler the page already wires for the
 *     "Modify" / "Rebuild From Current Settings" controls. There is no
 *     second route, no second builder, no second normalizer.
 *
 * The notice has THREE honest states:
 *   1. legacy_no_stamp     — saved program predates Phase 4A entirely.
 *   2. stale_stamp_version — program was stamped by an earlier engine version.
 *   3. all_sessions_flat   — program was stamped, but the builder produced
 *                            zero structurally-different sessions (no grouped
 *                            blocks, no row-level method cues). This is a
 *                            legitimate signal to regenerate, NOT a fake
 *                            doctrine claim.
 *
 * The notice HIDES entirely when the program is current AND has real
 * structural change — the rest of the page already proves itself.
 */

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, Info } from 'lucide-react'
import type { AdaptiveProgram } from '@/lib/adaptive-program-builder'
import { METHOD_DECISION_VERSION } from '@/lib/program/method-decision-engine'

interface DoctrineIntegrationMaterializationView {
  methodDecisionVersion?: string | null
  methodDecisionStampedAt?: string | null
  methodDecisionProfileSource?: string | null
  methodDecisionProfileAware?: boolean | null
  allSessionsFlat?: boolean | null
  materializationRollup?: {
    sessionsWithStructuralChange?: number
    totalGroupedBlocks?: number
    totalGroupedSupersets?: number
    totalGroupedCircuits?: number
    totalGroupedDensityBlocks?: number
    totalRowCluster?: number
    totalRowTopSet?: number
    totalRowDropSet?: number
    totalRowRestPause?: number
    totalChangedExercises?: number
    allSessionsFlat?: boolean
  } | null
}

type StaleState =
  | { kind: 'fresh_with_change' }
  | { kind: 'legacy_no_stamp' }
  | { kind: 'stale_stamp_version'; foundVersion: string }
  | { kind: 'all_sessions_flat' }

/**
 * Pure read of program metadata to determine the visible stale state.
 * No side effects. No mutations. Defensive against missing/legacy fields.
 */
export function evaluateMaterializationStaleState(
  program: AdaptiveProgram | null,
): StaleState {
  if (!program) return { kind: 'fresh_with_change' } // hide on no program

  const di = (program as unknown as { doctrineIntegration?: DoctrineIntegrationMaterializationView | null })
    .doctrineIntegration ?? null

  // Path 1 — no stamp at all → legacy.
  if (!di || typeof di !== 'object') {
    return { kind: 'legacy_no_stamp' }
  }
  const version = typeof di.methodDecisionVersion === 'string' ? di.methodDecisionVersion : null
  if (!version) {
    return { kind: 'legacy_no_stamp' }
  }
  // Path 2 — stamp from an older engine version.
  if (version !== METHOD_DECISION_VERSION) {
    return { kind: 'stale_stamp_version', foundVersion: version }
  }
  // Path 3 — current stamp but the builder produced an all-flat program.
  const flag = di.allSessionsFlat ?? di.materializationRollup?.allSessionsFlat ?? false
  if (flag === true) {
    return { kind: 'all_sessions_flat' }
  }
  return { kind: 'fresh_with_change' }
}

interface Props {
  program: AdaptiveProgram | null
  /**
   * Existing canonical regenerate handler. The page already wires this to
   * `handleRegenerate` → `/api/program/regenerate` → authoritative
   * materialized generation. This component MUST NOT call any other route.
   */
  onRegenerate: () => void
}

export function ProgramMaterializationStaleNotice({ program, onRegenerate }: Props) {
  const [isClicking, setIsClicking] = useState(false)
  const state = evaluateMaterializationStaleState(program)

  const handleClick = useCallback(() => {
    if (isClicking) return
    setIsClicking(true)
    try {
      onRegenerate()
    } finally {
      // The handler is fire-and-forget from this strip's perspective; the
      // page owns the actual loading + result lifecycle and will replace
      // `program` via setProgram(newProgram), which causes this component
      // to re-evaluate `state` and hide itself on success.
      // Reset the local click guard quickly so a true failure on the page's
      // side does not permanently block a retry.
      setTimeout(() => setIsClicking(false), 1500)
    }
  }, [isClicking, onRegenerate])

  if (state.kind === 'fresh_with_change') return null

  // Build copy from the actual state — no generic "doctrine applied" claim.
  let title = ''
  let body = ''
  let ariaTag = ''
  if (state.kind === 'legacy_no_stamp') {
    title = 'Doctrine materialization not applied to this program'
    body =
      'This saved program was generated before doctrine materialization was wired. Regenerate to receive a profile-aware program with grouped blocks, set-execution methods, and skill-quality protections.'
    ariaTag = 'legacy_no_stamp'
  } else if (state.kind === 'stale_stamp_version') {
    title = 'Program was stamped by an older engine version'
    body = `Doctrine engine has advanced since this program was built (found ${state.foundVersion}, current ${METHOD_DECISION_VERSION}). Regenerate to apply the latest profile-aware decisions.`
    ariaTag = 'stale_stamp_version'
  } else {
    // all_sessions_flat
    title = 'Doctrine selected zero structural changes for this program'
    body =
      'The current generation produced no grouped blocks, supersets, density work, or row-level set-execution methods. This usually means the doctrine engine and your profile produced an all-straight-set program. Regenerate to give doctrine a fresh pass with your latest settings.'
    ariaTag = 'all_sessions_flat'
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-materialization-stale={ariaTag}
      data-method-decision-version-current={METHOD_DECISION_VERSION}
      className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-400/90" aria-hidden />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-amber-100 leading-snug">{title}</p>
          <p className="text-[12px] text-amber-200/70 leading-snug mt-0.5">{body}</p>
        </div>
      </div>
      <div className="shrink-0 sm:ml-3">
        <Button
          type="button"
          onClick={handleClick}
          disabled={isClicking}
          size="sm"
          className="bg-[#E63946] hover:bg-[#D62828] text-white font-medium gap-1.5"
          data-action="regenerate-with-doctrine"
        >
          {isClicking ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
              <span>Starting…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              <span>Regenerate with Doctrine</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
