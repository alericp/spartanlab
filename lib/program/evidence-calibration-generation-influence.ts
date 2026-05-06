/**
 * ============================================================================
 * AB12-2 — EVIDENCE CALIBRATION GENERATION INFLUENCE CONTRACT
 * ============================================================================
 *
 * Pure, typed bridge from an AB12-1 `ProgramEvidenceCalibrationPlan` to a
 * bounded `EvidenceCalibrationGenerationInfluence` object that the
 * authoritative program-generation service stamps on every successfully
 * generated program.
 *
 * The influence object is intentionally narrower than the plan:
 *
 *   - It distinguishes constraints that actually reached a builder hook
 *     from constraints that the plan recommended but no safe builder
 *     hook exists for yet (`appliedConstraints` vs `suppressedConstraints`).
 *   - It carries an honest `status` ladder (`inactive` | `metadata_only` |
 *     `active` | `degraded`) so the UI can distinguish "evidence
 *     observed but not yet influencing the builder" from "evidence is
 *     actively shaping the program".
 *   - It carries its own compact `proof.label / summary / chips`
 *     derived from the same plan inputs, so the visible chip set
 *     reflects only what was *actually applied at generation time*,
 *     not what the live client-side plan currently recommends.
 *
 * Contract guarantees:
 *
 *   1. NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`.
 *   2. Pure function — no I/O, no DB, no React, no global state, no
 *      fetch, no localStorage. Safe to call inside server actions and
 *      inside a render path.
 *   3. Backward-compatible. Every consumer field is optional or
 *      deterministically derivable from the plan.
 *   4. No fake "applied". A constraint can only show as applied when
 *      the caller explicitly declares a structural hook for it via
 *      `options.structuralHooks`. AB12-2 default: only the
 *      `benchmarkRetestPrompt` hook is active (it is a UI-level prompt,
 *      not a builder mutation), so all structural constraints
 *      (`progressionAggressiveness`, `volumeBias`, `intensityBias`,
 *      `recoveryBias`) are reported as `suppressed` until AB12-3 wires
 *      them into the actual builder.
 *   5. Safety wins ties. `degraded` always downgrades to a
 *      conservative-only baseline. Low confidence always suppresses
 *      aggressive intent.
 *   6. Stable audit stamp via `influenceVersion`. Downstream consumers
 *      can verify the producer.
 *
 * This file consumes ONLY:
 *   - `ProgramEvidenceCalibrationPlan` (AB12-1 governor output)
 * It exports ONLY pure functions and types.
 */

import type {
  ProgramEvidenceCalibrationPlan,
  ProgramCalibrationPlanStatus,
  ProgramCalibrationPlanConfidence,
  ProgressionAggressiveness,
  VolumeBias,
  IntensityBias,
  RecoveryBias,
} from './evidence-aware-program-calibration-governor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Honest 4-state ladder for AB12-2 influence at generation time.
 *
 * - `inactive` — plan was `not_applicable` or null, or no constraints
 *   were resolvable. Generation proceeded with zero influence and the
 *   UI must NOT claim calibration shaped the program.
 * - `metadata_only` — plan was `no_evidence` (or `applied` but every
 *   structural constraint is currently suppressed). The proof is
 *   recorded on the program for audit, but generation proceeded
 *   exactly as it would have without the plan.
 * - `active` — plan was `applied` AND at least one constraint reached
 *   a real builder hook (per `options.structuralHooks`). The UI may
 *   claim "influencing next program".
 * - `degraded` — plan was `degraded`. Builder behavior must remain at
 *   the safe baseline; only the conservative `progressionAggressiveness`
 *   chip is honest. The UI must say "Evidence unavailable".
 */
export type EvidenceCalibrationInfluenceStatus =
  | 'inactive'
  | 'metadata_only'
  | 'active'
  | 'degraded'

/**
 * Names of the structural-builder constraints AB12-2 may track.
 * `benchmarkRetestPrompt` is *not* a structural mutation — it is a
 * UI-level prompt, so it is reported alongside but separately.
 */
export type EvidenceCalibrationConstraintName =
  | 'progressionAggressiveness'
  | 'volumeBias'
  | 'intensityBias'
  | 'recoveryBias'

/**
 * Caller-supplied declaration of which constraints currently have a
 * real, audited structural hook in the generation pipeline. AB12-2
 * defaults every structural hook to `false` (suppressed) — AB12-3 is
 * the prompt that flips one or more to `true` after wiring an actual
 * builder knob.
 *
 * `benchmarkRetestPrompt` is always available because it is a UI
 * prompt, not a builder mutation; the caller can still set it to
 * `false` to silence the prompt for a specific intent.
 */
export interface EvidenceCalibrationStructuralHooks {
  progressionAggressiveness?: boolean
  volumeBias?: boolean
  intensityBias?: boolean
  recoveryBias?: boolean
  benchmarkRetestPrompt?: boolean
}

export interface EvidenceCalibrationGenerationInfluence {
  /** Honest 4-state ladder. See `EvidenceCalibrationInfluenceStatus`. */
  status: EvidenceCalibrationInfluenceStatus
  /**
   * Source plan's governor version, copied for audit. Allows the UI
   * (and any future consumer) to verify the producer chain.
   */
  sourceGovernorVersion:
    | 'ab12-1-evidence-aware-calibration-governor'
    | 'unknown'
  /** Confidence inherited from the plan; downgraded to `low` for `degraded`. */
  confidence: ProgramCalibrationPlanConfidence
  /**
   * True iff status is `active` AND at least one structural constraint
   * is currently in `appliedConstraints`. Consumers MAY treat this as
   * the gate for displaying "influencing next program" copy.
   */
  allowedToMutateProgram: boolean
  /**
   * Resolved structural-constraint values. `null` means "the plan did
   * not engage with this knob" OR "the constraint is currently
   * suppressed because no builder hook exists for it yet". Use
   * `appliedConstraints` to distinguish.
   */
  progressionAggressiveness: ProgressionAggressiveness | null
  volumeBias: VolumeBias | null
  intensityBias: IntensityBias | null
  recoveryBias: RecoveryBias | null
  /**
   * UI-level retest prompt. Always honest because it does not mutate
   * the program — it only adds a soft suggestion to the proof surface.
   */
  benchmarkRetestPrompt: boolean
  /**
   * Constraint names that actually reached a real builder/UI hook.
   * AB12-2 default: at most `benchmarkRetestPrompt` (when the plan
   * requested it). Structural builder constraints are always in
   * `suppressedConstraints` in AB12-2.
   */
  appliedConstraints: string[]
  /**
   * Constraint names the plan recommended but no safe builder hook
   * exists for yet. Each entry MUST appear in either
   * `suppressedConstraints` or `appliedConstraints`, never both.
   */
  suppressedConstraints: string[]
  /**
   * Human-readable reason summary. Derived from the AB12-1 plan's
   * `reasons[]` (which are themselves derived from AB11 proofLines),
   * trimmed to ≤3 entries. NEVER hand-written.
   */
  reasonSummary: string[]
  /**
   * Compact visible proof, derived from real fields. The UI strip
   * renders these directly — no copy is invented at the component
   * layer.
   */
  proof: {
    /** Short status label. e.g. "Evidence calibration influencing next program". */
    label: string
    /** One sentence summarizing what was applied or suppressed. */
    summary: string
    /** Up to ~5 chips, each describing one applied or suppressed constraint. */
    chips: string[]
  }
  /** Stable audit stamp. */
  influenceVersion: 'ab12-2-evidence-calibration-generation-influence'
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INFLUENCE_VERSION =
  'ab12-2-evidence-calibration-generation-influence' as const

const ALL_STRUCTURAL_CONSTRAINTS: readonly EvidenceCalibrationConstraintName[] = [
  'progressionAggressiveness',
  'volumeBias',
  'intensityBias',
  'recoveryBias',
] as const

// AB12-2 default: only the UI-level retest prompt is wired. Every
// structural builder constraint defaults to suppressed because the
// 31k-line `lib/adaptive-program-builder.ts` has no audited safe knob
// for them in AB12-2. AB12-3 will flip individual hooks to `true` as
// it wires each knob with a guarded reduction.
const DEFAULT_STRUCTURAL_HOOKS: Required<EvidenceCalibrationStructuralHooks> = {
  progressionAggressiveness: false,
  volumeBias: false,
  intensityBias: false,
  recoveryBias: false,
  benchmarkRetestPrompt: true,
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Convert an AB12-1 calibration plan into an AB12-2 generation
 * influence object.
 *
 * Decision rules (in order, first match wins):
 *
 *   1. Plan is null/undefined OR `not_applicable` → `inactive`.
 *      No constraints, no chips, no summary copy.
 *   2. Plan is `degraded` → `degraded`.
 *      Confidence forced to `low`. Only the conservative
 *      `progressionAggressiveness` chip is honest. All structural
 *      constraints reported as suppressed regardless of caller hooks
 *      (degraded means we don't trust the signal enough to mutate).
 *   3. Plan is `no_evidence` → `metadata_only`.
 *      Generation proceeded as it would have without the plan, but the
 *      proof is recorded on the program. If the plan included
 *      `benchmarkRetestPrompt` AND the caller declared the prompt
 *      hook, that ONE constraint may show as applied.
 *   4. Plan is `applied` → `active` if at least one structural
 *      constraint reaches a hook, else `metadata_only`. Every
 *      structural constraint the plan recommended is partitioned into
 *      `appliedConstraints` (caller declared a hook) or
 *      `suppressedConstraints` (no hook).
 *
 * Pure. No I/O. Safe to call from server actions, route handlers, and
 * render paths.
 */
export function buildEvidenceCalibrationGenerationInfluence(
  plan: ProgramEvidenceCalibrationPlan | null | undefined,
  options?: { structuralHooks?: EvidenceCalibrationStructuralHooks },
): EvidenceCalibrationGenerationInfluence {
  const hooks: Required<EvidenceCalibrationStructuralHooks> = {
    ...DEFAULT_STRUCTURAL_HOOKS,
    ...(options?.structuralHooks ?? {}),
  }

  // Rule 1: inactive
  if (!plan || plan.status === 'not_applicable') {
    return {
      status: 'inactive',
      sourceGovernorVersion: plan?.governorVersion ?? 'unknown',
      confidence: plan?.confidence ?? 'low',
      allowedToMutateProgram: false,
      progressionAggressiveness: null,
      volumeBias: null,
      intensityBias: null,
      recoveryBias: null,
      benchmarkRetestPrompt: false,
      appliedConstraints: [],
      suppressedConstraints: [],
      reasonSummary: [],
      proof: {
        label: 'Evidence calibration inactive',
        summary:
          'No evidence inputs available — generation proceeded with the standard baseline.',
        chips: [],
      },
      influenceVersion: INFLUENCE_VERSION,
    }
  }

  // Rule 2: degraded
  if (plan.status === 'degraded') {
    return {
      status: 'degraded',
      sourceGovernorVersion: plan.governorVersion,
      confidence: 'low',
      allowedToMutateProgram: false,
      // Only the conservative progression chip survives a degraded
      // signal — and even that is reported as suppressed because we
      // do not actually mutate generation under degraded.
      progressionAggressiveness: 'conservative',
      volumeBias: null,
      intensityBias: null,
      recoveryBias: null,
      benchmarkRetestPrompt: false,
      appliedConstraints: [],
      // List structural constraints the plan tried to set so the audit
      // is complete.
      suppressedConstraints: collectPlanRequestedConstraints(plan),
      reasonSummary: trimReasons(plan.reasons),
      proof: {
        label: 'Evidence unavailable — safe baseline',
        summary:
          'Evidence source temporarily unavailable. Generation used the conservative baseline; no calibration was applied.',
        chips: ['progression: conservative (suppressed)'],
      },
      influenceVersion: INFLUENCE_VERSION,
    }
  }

  // Plan is `no_evidence` or `applied`. Partition every constraint
  // into applied vs suppressed using the caller's declared hooks.
  const requested = collectPlanRequestedConstraints(plan)
  const applied: string[] = []
  const suppressed: string[] = []

  // Resolved values default to null; we only set them when the
  // constraint reaches a hook AND the plan asked for it.
  let progressionAggressiveness: ProgressionAggressiveness | null = null
  let volumeBias: VolumeBias | null = null
  let intensityBias: IntensityBias | null = null
  let recoveryBias: RecoveryBias | null = null

  for (const name of ALL_STRUCTURAL_CONSTRAINTS) {
    const planValue = readConstraint(plan, name)
    if (planValue == null) continue
    if (hooks[name]) {
      applied.push(formatConstraintChip(name, planValue, true))
      switch (name) {
        case 'progressionAggressiveness':
          progressionAggressiveness = planValue as ProgressionAggressiveness
          break
        case 'volumeBias':
          volumeBias = planValue as VolumeBias
          break
        case 'intensityBias':
          intensityBias = planValue as IntensityBias
          break
        case 'recoveryBias':
          recoveryBias = planValue as RecoveryBias
          break
      }
    } else {
      suppressed.push(formatConstraintChip(name, planValue, false))
    }
  }

  // Benchmark retest prompt — UI-level, always available unless the
  // caller explicitly disables the hook.
  const wantsBenchmarkPrompt = plan.constraints.benchmarkRetestPrompt === true
  const benchmarkRetestPrompt =
    wantsBenchmarkPrompt && hooks.benchmarkRetestPrompt === true
  if (wantsBenchmarkPrompt) {
    if (benchmarkRetestPrompt) {
      applied.push('benchmark retest suggested')
    } else {
      suppressed.push('benchmark retest suggested (suppressed)')
    }
  }

  // Confidence: low confidence forces non-aggressive intent regardless
  // of plan-resolved value. (We already derived from plan, but
  // surface-level safety: when confidence is `low` AND
  // progressionAggressiveness was applied as `aggressive`, drop it.)
  let resolvedConfidence: ProgramCalibrationPlanConfidence = plan.confidence
  if (
    resolvedConfidence === 'low' &&
    progressionAggressiveness === 'aggressive'
  ) {
    progressionAggressiveness = 'standard'
    // Re-tag the corresponding chip if present.
    const idx = applied.findIndex((c) => c.startsWith('progression:'))
    if (idx >= 0) {
      applied[idx] = formatConstraintChip(
        'progressionAggressiveness',
        'standard',
        true,
      )
    }
  }

  // Status resolution.
  // - `applied` plan with at least one structural hook applied → `active`
  // - `applied` plan with zero structural hooks but a UI prompt fired → `metadata_only` with reasonSummary preserved
  // - `no_evidence` plan → `metadata_only`
  const hasStructuralApplied =
    progressionAggressiveness !== null ||
    volumeBias !== null ||
    intensityBias !== null ||
    recoveryBias !== null
  const status: EvidenceCalibrationInfluenceStatus =
    plan.status === 'applied' && hasStructuralApplied ? 'active' : 'metadata_only'

  const allowedToMutateProgram = status === 'active'

  const label =
    status === 'active'
      ? 'Evidence calibration influencing next program'
      : plan.status === 'no_evidence'
        ? 'Evidence calibration waiting'
        : 'Evidence calibration observed — Program influence pending'

  const summary = buildSummary({
    planStatus: plan.status,
    status,
    appliedCount: applied.length,
    suppressedCount: suppressed.length,
  })

  // Compose final chip list: applied chips first (positive proof),
  // then up to two suppressed chips for honesty. Hard cap at 5.
  const chips: string[] = [
    ...applied,
    ...suppressed.slice(0, Math.max(0, 5 - applied.length)),
  ].slice(0, 5)

  return {
    status,
    sourceGovernorVersion: plan.governorVersion,
    confidence: resolvedConfidence,
    allowedToMutateProgram,
    progressionAggressiveness,
    volumeBias,
    intensityBias,
    recoveryBias,
    benchmarkRetestPrompt,
    appliedConstraints: applied,
    suppressedConstraints: suppressed,
    reasonSummary: trimReasons(plan.reasons),
    proof: { label, summary, chips },
    influenceVersion: INFLUENCE_VERSION,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers — pure
// ---------------------------------------------------------------------------

function readConstraint(
  plan: ProgramEvidenceCalibrationPlan,
  name: EvidenceCalibrationConstraintName,
): string | null {
  const v = plan.constraints[name]
  if (typeof v === 'string') return v
  return null
}

function collectPlanRequestedConstraints(
  plan: ProgramEvidenceCalibrationPlan,
): string[] {
  const out: string[] = []
  for (const name of ALL_STRUCTURAL_CONSTRAINTS) {
    const v = readConstraint(plan, name)
    if (v != null) {
      out.push(formatConstraintChip(name, v, false))
    }
  }
  if (plan.constraints.benchmarkRetestPrompt === true) {
    out.push('benchmark retest suggested (suppressed)')
  }
  return out
}

function formatConstraintChip(
  name: EvidenceCalibrationConstraintName,
  value: string,
  applied: boolean,
): string {
  const label = (() => {
    switch (name) {
      case 'progressionAggressiveness':
        return `progression: ${value}`
      case 'volumeBias':
        return `volume: ${value}`
      case 'intensityBias':
        return `intensity: ${value}`
      case 'recoveryBias':
        return `recovery: ${value}`
    }
  })()
  return applied ? label : `${label} (suppressed)`
}

function trimReasons(reasons: readonly string[] | undefined): string[] {
  if (!reasons || reasons.length === 0) return []
  return reasons.slice(0, 3)
}

function buildSummary(args: {
  planStatus: ProgramCalibrationPlanStatus
  status: EvidenceCalibrationInfluenceStatus
  appliedCount: number
  suppressedCount: number
}): string {
  const { planStatus, status, appliedCount, suppressedCount } = args
  if (status === 'active') {
    return `Evidence calibration shaping the next program (${appliedCount} constraint${appliedCount === 1 ? '' : 's'} applied${suppressedCount > 0 ? `, ${suppressedCount} pending wiring` : ''}).`
  }
  if (planStatus === 'no_evidence') {
    return appliedCount > 0
      ? 'Evidence calibration waiting — only the benchmark retest prompt was surfaced.'
      : 'Evidence calibration waiting — complete benchmarks or workouts to personalize calibration.'
  }
  // metadata_only with applied plan but no structural hooks yet.
  return suppressedCount > 0
    ? `Evidence observed (${suppressedCount} constraint${suppressedCount === 1 ? '' : 's'} pending builder wiring in AB12-3).`
    : 'Evidence observed — no actionable constraints recommended.'
}
