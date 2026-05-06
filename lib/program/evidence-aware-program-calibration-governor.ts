// =============================================================================
// [AB12-1] EVIDENCE-AWARE PROGRAM CALIBRATION GOVERNOR
// =============================================================================
//
// Pure, typed bridge from AB11 evidence/recommendation outputs into a
// single bounded `ProgramEvidenceCalibrationPlan`. This is the FIRST AB12
// intelligence surface and it is intentionally narrow:
//
//   - It consumes ONLY canonical AB11 outputs:
//       * `ProgramEvidenceFeedbackSummary`         (AB11-3 / AB11-4)
//       * `ProgramCalibrationRecommendation`       (AB11-1 / AB11-2)
//     It NEVER fetches, NEVER reads the DB, NEVER reads localStorage.
//
//   - It produces ONLY a typed plan (`ProgramEvidenceCalibrationPlan`).
//     It does NOT mutate any program. Structural mutation is deferred to
//     AB12-2; AB12-1 is a metadata/proof-only bridge so we can ship the
//     governor + visible proof without a builder rewrite.
//
//   - When evidence is missing the plan honestly reports
//     `status: 'no_evidence'` and produces NO constraints. When the inputs
//     are entirely absent (e.g. an early-render call before AB11 wiring
//     ran), the plan reports `status: 'not_applicable'` so the UI can
//     hide its surface without crashing.
//
//   - When the benchmark/calibration source failed (recommendation
//     produced but signals could not be summarized) the plan reports
//     `status: 'degraded'` and falls back to safe-baseline guidance —
//     the same conservative defaults a fresh user would receive.
//
//   - Confidence is derived from the average of contributing summary
//     confidences. We bucket to `low | medium | high` so the UI can
//     render a stable badge without leaking 0..1 noise.
//
// CONSUMERS (AB12-1):
//   - `components/programs/FeedbackLoopProofCard.tsx` (renders
//     `visibleProof.chips` + `visibleProof.label` directly).
//   - `components/programs/CalibrationCheckpointCard.tsx` (benchmark
//     side: builds a benchmark-only plan from the same `latestMap`
//     it already fetches).
//   - `app/(app)/program/page.tsx` (workout side: builds a workout-only
//     plan from the canonical `performanceAdaptation` stamps already
//     attached to the program).
//
// CONTRACT: every chip, every reason, every constraint is derived from
// the AB11 inputs; nothing is invented and nothing is hand-written copy
// the UI could disagree with.
// =============================================================================

import type {
  ProgramEvidenceDecision,
  ProgramEvidenceDomain,
  ProgramEvidenceFeedbackSummary,
} from './program-evidence-feedback-loop'
import type {
  CalibrationSafetyStatus,
  ProgramCalibrationRecommendation,
} from './program-calibration-recommendation'

// =============================================================================
// PUBLIC ENUMS
// =============================================================================

/**
 * Coarse status the governor reports for downstream UIs and any future
 * builder integration. Bounded by intent:
 *
 *   - `applied`        : at least one AB11 summary contributed real
 *                        signals (`signalsUsed > 0`) — constraints may
 *                        deviate from the safe defaults.
 *   - `no_evidence`    : AB11 summaries exist but reported zero signals
 *                        (e.g. fresh program, no benchmarks, no
 *                        completed sets). UI shows "waiting" copy.
 *   - `degraded`       : at least one AB11 input was unavailable due to
 *                        a real failure (typed via the input contract).
 *                        Constraints stay at safe defaults.
 *   - `not_applicable` : NEITHER summary was provided. The governor
 *                        cannot speak. UI hides its surface or renders
 *                        a quiet baseline.
 */
export type ProgramCalibrationPlanStatus =
  | 'applied'
  | 'no_evidence'
  | 'degraded'
  | 'not_applicable'

export type ProgramCalibrationPlanConfidence = 'low' | 'medium' | 'high'

/**
 * Bounded soft-influence dial the governor can express. Every value is
 * an INTENT, not a builder mutation — AB12-1 deliberately stops short of
 * structural rewrites. AB12-2 will wire these into the actual builder.
 */
export type ProgressionAggressiveness =
  | 'conservative'
  | 'standard'
  | 'aggressive'

export type VolumeBias = 'reduce' | 'maintain' | 'increase_carefully'

export type IntensityBias = 'cap' | 'maintain' | 'allow_progression'

export type RecoveryBias = 'protect' | 'normal'

// =============================================================================
// PUBLIC OUTPUT
// =============================================================================

/**
 * The single typed object every AB12-1 consumer reads. Do NOT widen this
 * shape without a corresponding governor decision rule and a visible
 * proof rule — chips/labels MUST be derivable from these constraints
 * alone so UI cannot drift.
 */
export interface ProgramEvidenceCalibrationPlan {
  status: ProgramCalibrationPlanStatus
  confidence: ProgramCalibrationPlanConfidence
  /** Short athlete-facing reasons. ≤3 lines. Derived from AB11 summary text + proofLines. */
  reasons: string[]
  constraints: {
    progressionAggressiveness?: ProgressionAggressiveness
    volumeBias?: VolumeBias
    intensityBias?: IntensityBias
    recoveryBias?: RecoveryBias
    /** Skill domain hints when benchmark/workout evidence touched skill domains. */
    skillPriorityBias?: string[]
    /**
     * `true` when the calibration recommendation has at least one
     * recommended test AND the benchmark evidence confidence is low /
     * absent — the user should be nudged to retest or run baseline.
     */
    benchmarkRetestPrompt?: boolean
  }
  visibleProof: {
    /** Short header label, e.g. "Evidence calibration active". */
    label: string
    /** One short sentence; ≤120 chars. */
    summary: string
    /** Compact chips. ≤4 items. Each chip already speaks for itself. */
    chips: string[]
  }
  /** Audit stamp so consumers can verify which governor produced the plan. */
  governorVersion: 'ab12-1-evidence-aware-calibration-governor'
}

// =============================================================================
// PUBLIC INPUT
// =============================================================================

/**
 * Governor input. Every field is optional/nullable so the governor can
 * be called from either side of the loop (benchmark-only consumer,
 * workout-only consumer, or a future merged consumer) without
 * pretending it has data it doesn't.
 *
 * `inputAvailability` is the ONLY way the caller signals "this source
 * existed but failed" vs. "this source was never applicable here". The
 * governor uses it to distinguish `no_evidence` from `degraded`.
 */
export interface EvidenceAwareCalibrationGovernorInput {
  benchmarkSummary?: ProgramEvidenceFeedbackSummary | null
  workoutSummary?: ProgramEvidenceFeedbackSummary | null
  calibrationRecommendation?: ProgramCalibrationRecommendation | null
  /**
   * Optional explicit availability flags. Caller passes `'failed'` when
   * the underlying fetch errored (e.g. `/api/benchmarks` 500'd) so the
   * governor can mark the plan `degraded` instead of `no_evidence`.
   * Defaults to `'ok'` when the corresponding summary is provided and
   * `'absent'` when it is not.
   */
  inputAvailability?: {
    benchmark?: 'ok' | 'failed' | 'absent'
    workout?: 'ok' | 'failed' | 'absent'
  }
}

// =============================================================================
// INTERNAL: confidence bucketing
// =============================================================================

function bucketConfidence(
  scores: readonly number[],
): ProgramCalibrationPlanConfidence {
  if (scores.length === 0) return 'low'
  let total = 0
  for (const s of scores) total += clamp01(s)
  const avg = total / scores.length
  if (avg >= 0.66) return 'high'
  if (avg >= 0.33) return 'medium'
  return 'low'
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

// =============================================================================
// INTERNAL: decision → constraint mapping
// =============================================================================

/**
 * Map AB11 decisions to bounded soft constraints. Conservative when in
 * doubt: a `hold` always implies a slower progression even if a single
 * `progress` decision sneaks through, because safety wins ties.
 */
function constraintsFromDecisions(
  decisions: readonly ProgramEvidenceDecision[],
  domains: readonly ProgramEvidenceDomain[],
): ProgramEvidenceCalibrationPlan['constraints'] {
  const set = new Set<ProgramEvidenceDecision>(decisions)
  const out: ProgramEvidenceCalibrationPlan['constraints'] = {}

  // Recovery bias — strongest safety signal; check first.
  if (set.has('deload') || set.has('adjust_rest')) {
    out.recoveryBias = 'protect'
  }

  // Intensity bias.
  if (set.has('adjust_intensity') || set.has('deload')) {
    out.intensityBias = 'cap'
  } else if (set.has('progress')) {
    out.intensityBias = 'allow_progression'
  } else if (set.has('hold') || set.has('maintain')) {
    out.intensityBias = 'maintain'
  }

  // Volume bias.
  if (set.has('deload') || set.has('adjust_volume')) {
    // Phase-L's `adjust_volume` is always a reduction in current
    // canonical decoder; AB12-2 may distinguish `increase_carefully`
    // when an `exceeded` quality signal accumulates.
    out.volumeBias = 'reduce'
  } else if (set.has('progress')) {
    out.volumeBias = 'increase_carefully'
  } else if (set.has('hold') || set.has('maintain')) {
    out.volumeBias = 'maintain'
  }

  // Progression aggressiveness — safety overrides "progress" when both
  // are present in the decision set.
  if (
    set.has('hold') ||
    set.has('deload') ||
    set.has('adjust_intensity') ||
    set.has('adjust_volume') ||
    set.has('adjust_rest')
  ) {
    out.progressionAggressiveness = 'conservative'
  } else if (set.has('progress')) {
    out.progressionAggressiveness = 'standard'
  }

  // Skill priority bias — only when the skill domain actually
  // contributed AND a skill-level decision exists.
  if (
    domains.includes('skill') &&
    (set.has('adjust_skill_progression') || set.has('hold'))
  ) {
    out.skillPriorityBias = ['skill']
  }

  return out
}

// =============================================================================
// INTERNAL: chip + summary builders
// =============================================================================

function chipsForConstraints(
  c: ProgramEvidenceCalibrationPlan['constraints'],
): string[] {
  const chips: string[] = []
  if (c.progressionAggressiveness) {
    chips.push(`progression: ${c.progressionAggressiveness}`)
  }
  if (c.volumeBias) {
    const label =
      c.volumeBias === 'increase_carefully'
        ? 'volume: increase carefully'
        : `volume: ${c.volumeBias}`
    chips.push(label)
  }
  if (c.intensityBias) {
    const label =
      c.intensityBias === 'allow_progression'
        ? 'intensity: allow progression'
        : `intensity: ${c.intensityBias}`
    chips.push(label)
  }
  if (c.recoveryBias === 'protect') chips.push('recovery: protect')
  if (c.benchmarkRetestPrompt) chips.push('benchmark retest suggested')
  // Cap at 4 to keep the strip compact.
  return chips.slice(0, 4)
}

function reasonsFromSummaries(
  benchmark: ProgramEvidenceFeedbackSummary | null,
  workout: ProgramEvidenceFeedbackSummary | null,
): string[] {
  const out: string[] = []
  // Prefer the proofLines that AB11 already emits — they are derived
  // from real signal `reason` strings in the loop, not invented copy.
  if (benchmark) out.push(...benchmark.proofLines)
  if (workout) out.push(...workout.proofLines)
  // De-dupe and cap at 3 to keep the surface compact.
  const seen = new Set<string>()
  const deduped: string[] = []
  for (const line of out) {
    if (typeof line !== 'string') continue
    const trimmed = line.trim()
    if (!trimmed) continue
    if (seen.has(trimmed)) continue
    seen.add(trimmed)
    deduped.push(trimmed)
    if (deduped.length === 3) break
  }
  return deduped
}

// =============================================================================
// INTERNAL: status resolution
// =============================================================================

interface ResolvedAvailability {
  benchmark: 'ok' | 'failed' | 'absent'
  workout: 'ok' | 'failed' | 'absent'
}

function resolveAvailability(
  input: EvidenceAwareCalibrationGovernorInput,
): ResolvedAvailability {
  const explicit = input.inputAvailability
  return {
    benchmark:
      explicit?.benchmark ??
      (input.benchmarkSummary === undefined || input.benchmarkSummary === null
        ? 'absent'
        : 'ok'),
    workout:
      explicit?.workout ??
      (input.workoutSummary === undefined || input.workoutSummary === null
        ? 'absent'
        : 'ok'),
  }
}

// =============================================================================
// PUBLIC ENTRY POINT
// =============================================================================

/**
 * Build the AB12-1 calibration plan. Pure; safe to call on every render.
 *
 * Decision tree (in order, first match wins):
 *
 *   1. Both inputs absent                       → `not_applicable`
 *   2. At least one input failed                → `degraded`
 *   3. Both inputs present AND both report 0 signals → `no_evidence`
 *   4. Otherwise                                → `applied`
 */
export function buildEvidenceAwareCalibrationPlan(
  input: EvidenceAwareCalibrationGovernorInput,
): ProgramEvidenceCalibrationPlan {
  const availability = resolveAvailability(input)
  const benchmark = input.benchmarkSummary ?? null
  const workout = input.workoutSummary ?? null
  const reco = input.calibrationRecommendation ?? null

  // ---- 1. not_applicable -------------------------------------------------
  if (
    availability.benchmark === 'absent' &&
    availability.workout === 'absent'
  ) {
    return {
      status: 'not_applicable',
      confidence: 'low',
      reasons: [],
      constraints: {},
      visibleProof: {
        label: 'Evidence calibration unavailable',
        summary:
          'No evidence signals are wired into this surface. Calibration will activate once benchmarks or workouts are available.',
        chips: [],
      },
      governorVersion: 'ab12-1-evidence-aware-calibration-governor',
    }
  }

  // ---- 2. degraded -------------------------------------------------------
  if (
    availability.benchmark === 'failed' ||
    availability.workout === 'failed'
  ) {
    // Honest degraded state — keep safe defaults, no structural intent.
    const safetyConstraints: ProgramEvidenceCalibrationPlan['constraints'] = {
      progressionAggressiveness: 'conservative',
    }
    return {
      status: 'degraded',
      confidence: 'low',
      reasons: ['Evidence source unavailable; using safe baseline.'],
      constraints: safetyConstraints,
      visibleProof: {
        label: 'Evidence unavailable',
        summary: 'Using safe baseline until evidence is available again.',
        chips: ['progression: conservative'],
      },
      governorVersion: 'ab12-1-evidence-aware-calibration-governor',
    }
  }

  // ---- 3. no_evidence ----------------------------------------------------
  const benchmarkSignals = benchmark?.benchmarkSignalsUsed ?? 0
  const workoutSignals = workout?.workoutSignalsUsed ?? 0
  const totalSignals = benchmarkSignals + workoutSignals
  if (totalSignals === 0) {
    // Suggest a benchmark retest if the recommendation engine has tests
    // queued — that's a real, actionable next step and not invented.
    const retest =
      reco !== null && reco.recommendedTests.length > 0 ? true : false
    return {
      status: 'no_evidence',
      confidence: 'low',
      reasons: [
        retest
          ? 'No completed benchmarks or workouts yet — start with the recommended baseline tests.'
          : 'No completed benchmarks or workouts yet — calibration will activate after you log results.',
      ],
      constraints: retest ? { benchmarkRetestPrompt: true } : {},
      visibleProof: {
        label: 'Evidence calibration waiting',
        summary: retest
          ? 'Complete the recommended baseline tests to personalize calibration.'
          : 'Complete benchmarks or workouts to personalize calibration.',
        chips: retest ? ['benchmark baseline suggested'] : [],
      },
      governorVersion: 'ab12-1-evidence-aware-calibration-governor',
    }
  }

  // ---- 4. applied --------------------------------------------------------
  // Merge decisions and domains across both summaries — duplicates are
  // fine because Set dedupes downstream.
  const decisions: ProgramEvidenceDecision[] = []
  if (benchmark) decisions.push(...benchmark.decisionsApplied)
  if (workout) decisions.push(...workout.decisionsApplied)

  const domains: ProgramEvidenceDomain[] = []
  if (benchmark) domains.push(...benchmark.domainsAffected)
  if (workout) domains.push(...workout.domainsAffected)

  const constraints = constraintsFromDecisions(decisions, domains)

  // Benchmark retest prompt: the calibration engine has tests queued
  // AND benchmark confidence is low — both real signals, no invention.
  if (
    reco !== null &&
    reco.recommendedTests.length > 0 &&
    (benchmark === null || benchmark.confidence < 0.4)
  ) {
    constraints.benchmarkRetestPrompt = true
  }

  const confidenceScores: number[] = []
  if (benchmark && benchmark.benchmarkSignalsUsed > 0) {
    confidenceScores.push(benchmark.confidence)
  }
  if (workout && workout.workoutSignalsUsed > 0) {
    confidenceScores.push(workout.confidence)
  }
  // Recommendation confidence reinforces the bucket when present (it
  // reflects goal/skill alignment, which is signal we trust).
  if (reco !== null) {
    confidenceScores.push(clamp01(reco.confidence))
  }
  const confidence = bucketConfidence(confidenceScores)

  const reasons = reasonsFromSummaries(benchmark, workout)
  const chips = chipsForConstraints(constraints)

  // The summary text prefers AB11's own summary line(s) so AB12-1
  // visible proof and AB11-5 visible proof never disagree.
  const summary =
    benchmark?.summaryText ??
    workout?.summaryText ??
    'Calibration evidence applied to your program.'

  return {
    status: 'applied',
    confidence,
    reasons,
    constraints,
    visibleProof: {
      label: 'Evidence calibration active',
      summary,
      chips,
    },
    governorVersion: 'ab12-1-evidence-aware-calibration-governor',
  }
}
