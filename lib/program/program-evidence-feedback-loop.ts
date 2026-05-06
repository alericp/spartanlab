// =============================================================================
// [AB11-3 / AB11-4] PROGRAM EVIDENCE FEEDBACK LOOP — PURE TYPED CONTRACT
// =============================================================================
//
// Source-truth-only translator from canonical evidence rows
// (benchmark/calibration via `lib/benchmark-testing-engine.ts`, completed-set
// evidence via `lib/program/performance-feedback-adaptation-contract.ts`)
// into typed `*EvidenceSignal` rows + a single `ProgramEvidenceFeedbackSummary`
// the AB11-5 visible proof surface can render.
//
// CONTRACTS:
//   - PURE. No I/O. No DB. No `fetch`. No React. No global state.
//   - DOES NOT mutate any program. Producers feed it canonical evidence;
//     it returns typed signals + summary objects only.
//   - DOES NOT invent data. When evidence is missing/ambiguous, it
//     returns a neutral `summarizeNoEvidence()` summary so the UI can
//     honestly render "no evidence yet" without lying about adaptation.
//   - DOES NOT create parallel storage. Benchmark data must come from the
//     existing `Benchmark` shape (or the narrow `LatestBenchmarkSummary`
//     projection the calibration card already builds from
//     `GET /api/benchmarks?action=list`). Workout data must come from the
//     existing `CompletedSetEvidence` shape (Phase L) or from the
//     `performanceAdaptation` stamps already attached to the canonical
//     program by `applyFuturePrescriptionMutations`.
//
// CONSUMERS (AB11-5):
//   - `components/programs/FeedbackLoopProofCard.tsx` (compact UI proof)
//   - `components/programs/CalibrationCheckpointCard.tsx` (benchmark proof,
//     using the latest map it already fetches)
//   - `app/(app)/program/page.tsx` (workout proof, using the program's
//     existing performanceAdaptation stamps)
// =============================================================================

import {
  BASELINE_TESTS,
  type Benchmark,
  type BenchmarkMovementFamily,
  type TestCategory,
  type TestUnit,
} from '../benchmark-testing-engine'
// Reuse the canonical narrow projection the calibration recommender
// already owns. The map key supplies `testName`, so this is the SAME
// shape the calibration card constructs from `GET /api/benchmarks?action=list`.
import type { LatestBenchmarkSummary } from './program-calibration-recommendation'
import type {
  CompletedSetEvidence,
  ExerciseClass,
  ExercisePerformanceAdaptationStamp,
  FutureMutationType,
  PhaseLProgramShape,
} from './performance-feedback-adaptation-contract'

// =============================================================================
// PUBLIC ENUMS
// =============================================================================

/**
 * Where the evidence row came from. Both sides of the loop:
 *   benchmark / calibration  → AB11-3
 *   workout_log / completed_set / session_completion / trend_intelligence
 *                            → AB11-4
 */
export type ProgramEvidenceSource =
  | 'benchmark'
  | 'calibration'
  | 'workout_log'
  | 'completed_set'
  | 'session_completion'
  | 'trend_intelligence'

/**
 * Coarse training domain a signal informs. Domains are intentionally narrow
 * so we cannot accidentally let strength evidence influence mobility (or
 * vice versa).
 */
export type ProgramEvidenceDomain =
  | 'skill'
  | 'strength'
  | 'mobility'
  | 'endurance'
  | 'readiness'
  | 'recovery'
  | 'unknown'

/**
 * The action the program/calibration layer is being asked (or confirmed)
 * to take. Bounded; safety-first; conservative under conflict.
 */
export type ProgramEvidenceDecision =
  | 'progress'
  | 'hold'
  | 'deload'
  | 'adjust_volume'
  | 'adjust_intensity'
  | 'adjust_rest'
  | 'adjust_skill_progression'
  | 'maintain'
  | 'no_change'

/**
 * How the signal interpreter read the latest comparable result.
 */
export type BenchmarkEvidenceInterpretation =
  | 'baseline_established'
  | 'improved'
  | 'regressed'
  | 'stable'
  | 'insufficient_history'
  | 'unknown'

/**
 * How a workout-side signal was completed relative to its prescription.
 * Mirrors the qualitative buckets the Phase-L resolver already classifies
 * but lifted to a stable, JSON-safe enum the UI can render.
 */
export type WorkoutCompletionQuality =
  | 'exceeded'
  | 'completed'
  | 'barely_completed'
  | 'missed'
  | 'skipped'
  | 'abandoned'
  | 'unknown'

export type WorkoutFatigueSignal =
  | 'low'
  | 'normal'
  | 'elevated'
  | 'high'
  | 'unknown'

// =============================================================================
// PUBLIC SIGNALS
// =============================================================================

export interface BenchmarkEvidenceSignal {
  source: 'benchmark' | 'calibration'
  /** Benchmark id when available (only present when caller has full Benchmark rows). */
  benchmarkId?: string
  testName: string
  movementFamily: BenchmarkMovementFamily
  testCategory: TestCategory
  testValue: number
  testUnit: TestUnit
  testedAt: string
  /** % vs prior (engine-canonical). null = no prior result, so this row established a baseline. */
  changePercent: number | null
  isBaseline: boolean
  domain: ProgramEvidenceDomain
  interpretation: BenchmarkEvidenceInterpretation
  decision: ProgramEvidenceDecision
  /** 0..1 honesty band — never invented; always derived from category/changePercent. */
  confidence: number
  reason: string
}

export interface WorkoutEvidenceSignal {
  source:
    | 'workout_log'
    | 'completed_set'
    | 'session_completion'
    | 'trend_intelligence'
  exerciseName: string
  exerciseId?: string
  sessionId?: string
  setNumber?: number
  domain: ProgramEvidenceDomain
  completionQuality: WorkoutCompletionQuality
  fatigueSignal: WorkoutFatigueSignal
  decision: ProgramEvidenceDecision
  confidence: number
  reason: string
}

/**
 * The single typed summary AB11-5 renders. Producers may emit a
 * benchmark-only summary, a workout-only summary, a merged summary, or a
 * neutral "no evidence yet" summary — all use this same shape.
 */
export interface ProgramEvidenceFeedbackSummary {
  benchmarkSignalsUsed: number
  workoutSignalsUsed: number
  domainsAffected: ProgramEvidenceDomain[]
  decisionsApplied: ProgramEvidenceDecision[]
  /** ISO of the most recent contributing evidence (benchmark testedAt OR workout adaptation `computedAt`). */
  latestEvidenceAt: string | null
  /** One short athlete-facing sentence; never invented copy. */
  summaryText: string
  /** ≤3 short proof lines for the compact UI. Empty = nothing to say. */
  proofLines: string[]
  /** 0..1, average across contributing signals. */
  confidence: number
  /**
   * `true` when at least one contributing signal carried a decision other
   * than `no_change` / `maintain`, OR when at least one Phase-L stamp was
   * actually `applied`. `false` for neutral / considered-only summaries.
   */
  changedProgram: boolean
}

// =============================================================================
// DOMAIN MAP (canonical, derived from BASELINE_TESTS catalog)
// =============================================================================

/**
 * Coarse domain map keyed by movement family. We MUST keep this aligned to
 * the catalog in `lib/benchmark-testing-engine.ts`; if a new family is
 * added there without a domain mapping here, we fall through to `unknown`.
 */
function domainForMovementFamily(
  family: BenchmarkMovementFamily,
): ProgramEvidenceDomain {
  switch (family) {
    case 'vertical_pull':
    case 'horizontal_pull':
    case 'vertical_push':
    case 'dip_pattern':
    case 'explosive_pull':
    case 'compression_core':
      return 'strength'
    case 'straight_arm_pull':
    case 'straight_arm_push':
    case 'ring_support':
    case 'handstand':
      return 'skill'
  }
}

function domainForTestCategory(cat: TestCategory): ProgramEvidenceDomain {
  switch (cat) {
    case 'strength':
      return 'strength'
    case 'skill':
      return 'skill'
    case 'endurance':
      return 'endurance'
    case 'flexibility':
      return 'mobility'
  }
}

function domainForExerciseClass(cls: ExerciseClass): ProgramEvidenceDomain {
  switch (cls) {
    case 'straight_arm_skill':
      return 'skill'
    case 'weighted_strength':
    case 'bodyweight_strength':
      return 'strength'
    case 'mobility':
      return 'mobility'
    case 'accessory':
    case 'unknown':
      return 'unknown'
  }
}

// =============================================================================
// BENCHMARK INTERPRETATION RULES (AB11-3)
// =============================================================================

/**
 * Pure interpretation. Only consults fields that exist on `Benchmark`.
 *
 * Conservative thresholds:
 *   |Δ| ≤ 5%   → stable
 *   Δ > +5%    → improved
 *   Δ < -5%    → regressed
 *   Δ === null → baseline_established (first datapoint) or insufficient_history
 *               depending on isBaseline
 */
function interpretBenchmark(b: {
  changePercent: number | null
  isBaseline: boolean
}): BenchmarkEvidenceInterpretation {
  if (b.changePercent === null) {
    return b.isBaseline ? 'baseline_established' : 'insufficient_history'
  }
  if (!Number.isFinite(b.changePercent)) return 'unknown'
  if (b.changePercent > 5) return 'improved'
  if (b.changePercent < -5) return 'regressed'
  return 'stable'
}

function decideFromBenchmark(
  interp: BenchmarkEvidenceInterpretation,
  domain: ProgramEvidenceDomain,
): ProgramEvidenceDecision {
  switch (interp) {
    case 'baseline_established':
      // First datapoint never authorizes progression on its own; it is a
      // truthful starting point. Calibration recommendation downstream may
      // shift priority away from retesting (already wired in AB11-2 via
      // `alreadyTested` deprioritization).
      return 'no_change'
    case 'improved':
      // Progression is allowed cautiously; for skill domain we still prefer
      // `adjust_skill_progression` over open-ended `progress` so the skill
      // engine remains the final author of the regression ladder.
      return domain === 'skill' ? 'adjust_skill_progression' : 'progress'
    case 'regressed':
      // Conservative: hold first, downstream readiness/Phase-L decides if
      // a deeper deload is warranted.
      return 'hold'
    case 'stable':
      return 'maintain'
    case 'insufficient_history':
    case 'unknown':
      return 'no_change'
  }
}

function confidenceForBenchmark(
  interp: BenchmarkEvidenceInterpretation,
  changePercent: number | null,
): number {
  // Honest band: a single benchmark is medium-low confidence at best.
  // We cap at 0.7 so AB11-5 cannot show a high-confidence claim from one
  // datapoint.
  switch (interp) {
    case 'baseline_established':
      return 0.4
    case 'improved':
    case 'regressed': {
      const mag = changePercent === null ? 0 : Math.min(Math.abs(changePercent), 30)
      return Math.min(0.4 + mag / 100, 0.7)
    }
    case 'stable':
      return 0.5
    case 'insufficient_history':
      return 0.2
    case 'unknown':
      return 0
  }
}

function reasonForBenchmark(
  interp: BenchmarkEvidenceInterpretation,
  testDisplayName: string,
  changePercent: number | null,
): string {
  const pct =
    changePercent === null
      ? null
      : `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`
  switch (interp) {
    case 'baseline_established':
      return `Established baseline for ${testDisplayName}.`
    case 'improved':
      return pct
        ? `${testDisplayName} improved (${pct}) since last test.`
        : `${testDisplayName} improved since last test.`
    case 'regressed':
      return pct
        ? `${testDisplayName} regressed (${pct}); holding progression for safety.`
        : `${testDisplayName} regressed; holding progression for safety.`
    case 'stable':
      return `${testDisplayName} held steady; maintaining current dose.`
    case 'insufficient_history':
      return `Not enough history yet for ${testDisplayName}.`
    case 'unknown':
      return `${testDisplayName}: unable to interpret latest result.`
  }
}

// =============================================================================
// BENCHMARK BUILDERS (AB11-3)
// =============================================================================

/**
 * Build typed signals from full `Benchmark` rows (server-side path or any
 * caller that has access to the wider `Benchmark` shape from
 * `lib/benchmark-testing-engine.ts`).
 *
 * Keeps the LATEST row per testName so we never double-count history.
 */
export function buildBenchmarkEvidenceSignals(
  benchmarks: readonly Benchmark[],
): BenchmarkEvidenceSignal[] {
  if (!Array.isArray(benchmarks) || benchmarks.length === 0) return []

  // Sort by testDate descending then keep the first row per testName.
  const sorted = [...benchmarks].sort((a, b) => {
    const ta = Date.parse(a.testDate ?? a.createdAt ?? '') || 0
    const tb = Date.parse(b.testDate ?? b.createdAt ?? '') || 0
    return tb - ta
  })

  const seen = new Set<string>()
  const signals: BenchmarkEvidenceSignal[] = []
  for (const b of sorted) {
    if (!b || typeof b.testName !== 'string') continue
    if (seen.has(b.testName)) continue
    seen.add(b.testName)

    const interp = interpretBenchmark({
      changePercent: b.changePercent,
      isBaseline: b.isBaseline,
    })
    const domain =
      domainForTestCategory(b.testCategory) === 'skill' ||
      domainForMovementFamily(b.movementFamily) === 'skill'
        ? 'skill'
        : domainForTestCategory(b.testCategory)
    const decision = decideFromBenchmark(interp, domain)
    const confidence = confidenceForBenchmark(interp, b.changePercent)

    // We resolve the human-readable display name from BASELINE_TESTS when
    // available so reason copy never invents text the catalog wouldn't.
    const def = BASELINE_TESTS.find((t) => t.testName === b.testName)
    const displayName = def?.displayName ?? b.testName

    signals.push({
      source: b.isBaseline ? 'calibration' : 'benchmark',
      benchmarkId: b.id,
      testName: b.testName,
      movementFamily: b.movementFamily,
      testCategory: b.testCategory,
      testValue: b.testValue,
      testUnit: b.testUnit,
      testedAt: b.testDate ?? b.createdAt ?? new Date(0).toISOString(),
      changePercent: b.changePercent,
      isBaseline: b.isBaseline,
      domain,
      interpretation: interp,
      decision,
      confidence,
      reason: reasonForBenchmark(interp, displayName, b.changePercent),
    })
  }
  return signals
}

/**
 * Build typed signals from the narrow `LatestBenchmarkSummary` projection
 * the calibration card already constructs client-side. We don't have the
 * benchmark id, isBaseline, or testCategory directly — we resolve them
 * via the catalog by `testName` (taken from the map KEY) so the signal
 * still carries canonical fields. Tests not in the catalog are skipped
 * (rather than guessed).
 *
 * Input contract: the SAME `Map<string, LatestBenchmarkSummary>` shape
 * that `program-calibration-recommendation.ts` already documents and
 * `CalibrationCheckpointCard` already builds via `buildLatestMap`. The
 * helper derives `testName` from the map key, so the value type does
 * NOT need to repeat it.
 *
 * `LatestBenchmarkSummaryRow` (kept exported for back-compat with
 * callers who already have a `testName`-bearing row) is now structurally
 * compatible: it adds `testName` on top of `LatestBenchmarkSummary`, so
 * existing callers that pass it continue to type-check.
 */
export interface LatestBenchmarkSummaryRow extends LatestBenchmarkSummary {
  testName: string
}

export function buildBenchmarkEvidenceSignalsFromLatestMap(
  latest:
    | ReadonlyMap<string, LatestBenchmarkSummary>
    | null
    | undefined,
): BenchmarkEvidenceSignal[] {
  if (!latest || latest.size === 0) return []
  const signals: BenchmarkEvidenceSignal[] = []
  for (const [testName, row] of latest.entries()) {
    const def = BASELINE_TESTS.find((t) => t.testName === testName)
    if (!def) continue // never invent movementFamily / category
    const isBaseline = row.changePercent === null
    const interp = interpretBenchmark({
      changePercent: row.changePercent,
      isBaseline,
    })
    const domain =
      domainForTestCategory(def.testCategory) === 'skill' ||
      domainForMovementFamily(def.movementFamily) === 'skill'
        ? 'skill'
        : domainForTestCategory(def.testCategory)
    const decision = decideFromBenchmark(interp, domain)
    const confidence = confidenceForBenchmark(interp, row.changePercent)
    signals.push({
      source: isBaseline ? 'calibration' : 'benchmark',
      testName,
      movementFamily: def.movementFamily,
      testCategory: def.testCategory,
      testValue: row.testValue,
      testUnit: row.testUnit,
      testedAt: row.testDate,
      changePercent: row.changePercent,
      isBaseline,
      domain,
      interpretation: interp,
      decision,
      confidence,
      reason: reasonForBenchmark(interp, def.displayName, row.changePercent),
    })
  }
  return signals
}

// =============================================================================
// WORKOUT INTERPRETATION RULES (AB11-4)
// =============================================================================

function classifyCompletionQuality(
  ev: CompletedSetEvidence,
): WorkoutCompletionQuality {
  if (ev.completed === false) return 'skipped'
  // Holds (seconds)
  if (
    typeof ev.prescribedHoldSeconds === 'number' &&
    ev.prescribedHoldSeconds > 0
  ) {
    if (typeof ev.actualHoldSeconds !== 'number') return 'unknown'
    const ratio = ev.actualHoldSeconds / ev.prescribedHoldSeconds
    if (ratio >= 1.15) return 'exceeded'
    if (ratio >= 1.0) return 'completed'
    if (ratio >= 0.85) return 'barely_completed'
    return 'missed'
  }
  // Reps
  if (typeof ev.prescribedReps === 'number' && ev.prescribedReps > 0) {
    if (typeof ev.actualReps !== 'number') return 'unknown'
    const ratio = ev.actualReps / ev.prescribedReps
    if (ratio >= 1.15) return 'exceeded'
    if (ratio >= 1.0) return 'completed'
    if (ratio >= 0.85) return 'barely_completed'
    return 'missed'
  }
  // No prescribed target available — only honest classification.
  return 'unknown'
}

function classifyFatigueSignal(ev: CompletedSetEvidence): WorkoutFatigueSignal {
  // Real RPE wins. Phase-L extractor can fill `actualRPE` from
  // perceivedDifficulty when explicit RPE is missing.
  if (typeof ev.actualRPE === 'number' && Number.isFinite(ev.actualRPE)) {
    if (ev.actualRPE >= 9) return 'high'
    if (ev.actualRPE >= 8) return 'elevated'
    if (ev.actualRPE >= 6) return 'normal'
    return 'low'
  }
  if (Array.isArray(ev.noteFlags)) {
    if (
      ev.noteFlags.includes('pain') ||
      ev.noteFlags.includes('too_hard') ||
      ev.noteFlags.includes('fried')
    ) {
      return 'high'
    }
  }
  return 'unknown'
}

function decideFromWorkout(
  quality: WorkoutCompletionQuality,
  fatigue: WorkoutFatigueSignal,
  domain: ProgramEvidenceDomain,
): ProgramEvidenceDecision {
  // Pain / very high fatigue always wins.
  if (fatigue === 'high') {
    return quality === 'missed' || quality === 'barely_completed'
      ? 'hold'
      : 'adjust_rest'
  }
  switch (quality) {
    case 'missed':
      return fatigue === 'elevated' ? 'hold' : 'adjust_volume'
    case 'barely_completed':
      return fatigue === 'elevated' ? 'adjust_rest' : 'maintain'
    case 'completed':
      return fatigue === 'elevated' ? 'maintain' : 'maintain'
    case 'exceeded':
      // Only authorize progression on low/normal fatigue. For skill domain
      // we route through skill-progression since we don't author the
      // regression ladder here.
      if (fatigue === 'low' || fatigue === 'normal') {
        return domain === 'skill' ? 'adjust_skill_progression' : 'progress'
      }
      return 'maintain'
    case 'skipped':
    case 'abandoned':
      return 'no_change'
    case 'unknown':
      return 'no_change'
  }
}

function confidenceForWorkout(
  quality: WorkoutCompletionQuality,
  fatigue: WorkoutFatigueSignal,
): number {
  // One set is low confidence. Real confidence comes from repeated evidence,
  // which the Phase-O trend layer already scores; here we only use
  // single-row evidence so we cap at 0.6.
  if (quality === 'unknown' || fatigue === 'unknown') return 0.25
  if (quality === 'exceeded' || quality === 'missed') return 0.55
  return 0.4
}

function reasonForWorkout(
  ev: CompletedSetEvidence,
  quality: WorkoutCompletionQuality,
  fatigue: WorkoutFatigueSignal,
): string {
  const exName = typeof ev.exerciseName === 'string' ? ev.exerciseName : 'exercise'
  switch (quality) {
    case 'exceeded':
      return `${exName} exceeded target with ${fatigue} fatigue.`
    case 'completed':
      return `${exName} completed at target with ${fatigue} fatigue.`
    case 'barely_completed':
      return `${exName} barely held target with ${fatigue} fatigue.`
    case 'missed':
      return `${exName} missed target with ${fatigue} fatigue.`
    case 'skipped':
      return `${exName} skipped this exposure.`
    case 'abandoned':
      return `${exName} abandoned mid-session.`
    case 'unknown':
      return `${exName}: not enough signal to interpret yet.`
  }
}

// =============================================================================
// WORKOUT BUILDERS (AB11-4)
// =============================================================================

export function buildWorkoutEvidenceSignals(
  evidence: readonly CompletedSetEvidence[],
): WorkoutEvidenceSignal[] {
  if (!Array.isArray(evidence) || evidence.length === 0) return []
  const signals: WorkoutEvidenceSignal[] = []
  for (const ev of evidence) {
    if (!ev || typeof ev !== 'object') continue
    if (ev.trusted === false) continue // never feed demo/untrusted evidence
    const quality = classifyCompletionQuality(ev)
    const fatigue = classifyFatigueSignal(ev)
    const domain = domainForExerciseClass(ev.exerciseClass ?? 'unknown')
    const decision = decideFromWorkout(quality, fatigue, domain)
    signals.push({
      source: typeof ev.setNumber === 'number' && ev.setNumber > 0
        ? 'completed_set'
        : 'workout_log',
      exerciseName: ev.exerciseName,
      exerciseId: ev.exerciseId,
      sessionId: ev.sessionId,
      setNumber: ev.setNumber,
      domain,
      completionQuality: quality,
      fatigueSignal: fatigue,
      decision,
      confidence: confidenceForWorkout(quality, fatigue),
      reason: reasonForWorkout(ev, quality, fatigue),
    })
  }
  return signals
}

/**
 * Read workout evidence directly off the canonical program's Phase-L
 * `performanceAdaptation` stamps. Producers that don't have the raw
 * `CompletedSetEvidence` ledger (e.g. the Program page) can still derive
 * a faithful summary from the program truth that already carries applied
 * mutations.
 */
export function buildWorkoutEvidenceSignalsFromProgramStamps(
  program: PhaseLProgramShape | null | undefined,
): WorkoutEvidenceSignal[] {
  const sessions = program?.sessions
  if (!Array.isArray(sessions)) return []
  const signals: WorkoutEvidenceSignal[] = []
  for (const sess of sessions) {
    const exercises = sess?.exercises
    if (!Array.isArray(exercises)) continue
    for (const ex of exercises) {
      const stamp = ex?.performanceAdaptation
      if (!stamp || stamp.applied !== true) continue
      const sig = workoutSignalFromStamp(ex.name ?? 'exercise', ex.id, stamp)
      if (sig) signals.push(sig)
    }
  }
  return signals
}

function workoutSignalFromStamp(
  exerciseName: string,
  exerciseId: string | undefined,
  stamp: ExercisePerformanceAdaptationStamp,
): WorkoutEvidenceSignal | null {
  // Map Phase-L mutation → ProgramEvidenceDecision honestly. We DO NOT
  // synthesize a quality/fatigue tier we can't prove from the stamp; we
  // route through the deterministic mutation type so the proof line
  // matches the executable mutation that already shipped.
  const decision = decisionFromMutationType(stamp.mutationType)
  // We can read `signalTypes` to surface the dominant fatigue signal.
  const fatigue: WorkoutFatigueSignal = stamp.signalTypes?.includes(
    'note_pain_warning',
  )
    ? 'high'
    : stamp.signalTypes?.some(
          (t) => t === 'on_target_high_rpe' || t === 'under_target_high_rpe',
        )
      ? 'elevated'
      : 'unknown'
  // Quality is inferred from the mutation type, not invented.
  const quality: WorkoutCompletionQuality =
    stamp.mutationType === 'increase_progression_slightly'
      ? 'exceeded'
      : stamp.mutationType === 'reduce_next_exposure_volume' ||
          stamp.mutationType === 'reduce_rpe_target'
        ? 'missed'
        : stamp.mutationType === 'preserve_prescription'
          ? 'completed'
          : 'unknown'
  return {
    source: 'completed_set',
    exerciseName,
    exerciseId,
    domain: 'unknown', // exercise-class is not on the stamp; downstream merge tolerates this.
    completionQuality: quality,
    fatigueSignal: fatigue,
    decision,
    confidence: stamp.status === 'applied' ? 0.55 : 0.3,
    reason: stamp.userVisibleExplanation,
  }
}

function decisionFromMutationType(m: FutureMutationType): ProgramEvidenceDecision {
  switch (m) {
    case 'reduce_next_exposure_volume':
      return 'adjust_volume'
    case 'hold_progression':
      return 'hold'
    case 'reduce_rpe_target':
      return 'adjust_intensity'
    case 'extend_rest_guidance':
      return 'adjust_rest'
    case 'preserve_prescription':
      return 'maintain'
    case 'increase_progression_slightly':
      return 'progress'
    case 'swap_to_regression_candidate':
      return 'adjust_skill_progression'
    case 'add_recovery_note_only':
      return 'no_change'
  }
}

// =============================================================================
// SUMMARIZERS (used by AB11-5 visible proof)
// =============================================================================

const ACTIVE_DECISIONS: ReadonlySet<ProgramEvidenceDecision> =
  new Set<ProgramEvidenceDecision>([
    'progress',
    'hold',
    'deload',
    'adjust_volume',
    'adjust_intensity',
    'adjust_rest',
    'adjust_skill_progression',
  ])

function uniqueDomains(
  signals: readonly { domain: ProgramEvidenceDomain }[],
): ProgramEvidenceDomain[] {
  const set = new Set<ProgramEvidenceDomain>()
  for (const s of signals) set.add(s.domain)
  return [...set]
}

function uniqueDecisions(
  signals: readonly { decision: ProgramEvidenceDecision }[],
): ProgramEvidenceDecision[] {
  const set = new Set<ProgramEvidenceDecision>()
  for (const s of signals) set.add(s.decision)
  return [...set]
}

function avg(nums: readonly number[]): number {
  if (nums.length === 0) return 0
  let total = 0
  for (const n of nums) total += n
  return total / nums.length
}

function maxIso(values: readonly (string | null | undefined)[]): string | null {
  let best: string | null = null
  let bestT = -Infinity
  for (const v of values) {
    if (typeof v !== 'string') continue
    const t = Date.parse(v)
    if (Number.isFinite(t) && t > bestT) {
      bestT = t
      best = v
    }
  }
  return best
}

export function summarizeBenchmarkEvidence(
  signals: readonly BenchmarkEvidenceSignal[],
): ProgramEvidenceFeedbackSummary {
  if (!Array.isArray(signals) || signals.length === 0) {
    return summarizeNoEvidence('benchmark')
  }
  const domains = uniqueDomains(signals)
  const decisions = uniqueDecisions(signals)
  const changedProgram = signals.some((s) => ACTIVE_DECISIONS.has(s.decision))
  const proofLines = topBenchmarkProofLines(signals, 3)
  const summaryText = changedProgram
    ? 'Calibration evidence shifted your next priority.'
    : 'Calibration evidence reviewed; no change needed yet.'
  return {
    benchmarkSignalsUsed: signals.length,
    workoutSignalsUsed: 0,
    domainsAffected: domains,
    decisionsApplied: decisions,
    latestEvidenceAt: maxIso(signals.map((s) => s.testedAt)),
    summaryText,
    proofLines,
    confidence: clamp01(avg(signals.map((s) => s.confidence))),
    changedProgram,
  }
}

export function summarizeWorkoutEvidence(
  signals: readonly WorkoutEvidenceSignal[],
): ProgramEvidenceFeedbackSummary {
  if (!Array.isArray(signals) || signals.length === 0) {
    return summarizeNoEvidence('workout')
  }
  const domains = uniqueDomains(signals)
  const decisions = uniqueDecisions(signals)
  const changedProgram = signals.some((s) => ACTIVE_DECISIONS.has(s.decision))
  const proofLines = topWorkoutProofLines(signals, 3)
  const summaryText = changedProgram
    ? 'Recent workouts adjusted your next exposures.'
    : 'Workout evidence reviewed; no change needed yet.'
  return {
    benchmarkSignalsUsed: 0,
    workoutSignalsUsed: signals.length,
    domainsAffected: domains,
    decisionsApplied: decisions,
    latestEvidenceAt: null, // workout signals don't carry timestamps directly here
    summaryText,
    proofLines,
    confidence: clamp01(avg(signals.map((s) => s.confidence))),
    changedProgram,
  }
}

export function mergeProgramEvidenceSummaries(
  benchmarkSummary: ProgramEvidenceFeedbackSummary | null | undefined,
  workoutSummary: ProgramEvidenceFeedbackSummary | null | undefined,
): ProgramEvidenceFeedbackSummary {
  const a = benchmarkSummary ?? summarizeNoEvidence('benchmark')
  const b = workoutSummary ?? summarizeNoEvidence('workout')
  const benchmarkSignalsUsed = a.benchmarkSignalsUsed
  const workoutSignalsUsed = b.workoutSignalsUsed
  if (benchmarkSignalsUsed === 0 && workoutSignalsUsed === 0) {
    return summarizeNoEvidence('both')
  }
  const domainsSet = new Set<ProgramEvidenceDomain>([
    ...a.domainsAffected,
    ...b.domainsAffected,
  ])
  const decisionsSet = new Set<ProgramEvidenceDecision>([
    ...a.decisionsApplied,
    ...b.decisionsApplied,
  ])
  const changedProgram = a.changedProgram || b.changedProgram
  // Up to 3 lines: prefer benchmark first then workout to show the longer
  // arc before the most recent micro-adjustment.
  const proofLines = [...a.proofLines, ...b.proofLines].slice(0, 3)
  const confidences: number[] = []
  if (benchmarkSignalsUsed > 0) confidences.push(a.confidence)
  if (workoutSignalsUsed > 0) confidences.push(b.confidence)
  const summaryText = changedProgram
    ? benchmarkSignalsUsed > 0 && workoutSignalsUsed > 0
      ? 'Tests and recent workouts updated your plan.'
      : benchmarkSignalsUsed > 0
        ? a.summaryText
        : b.summaryText
    : 'Evidence reviewed; no change needed yet.'
  return {
    benchmarkSignalsUsed,
    workoutSignalsUsed,
    domainsAffected: [...domainsSet],
    decisionsApplied: [...decisionsSet],
    latestEvidenceAt: maxIso([a.latestEvidenceAt, b.latestEvidenceAt]),
    summaryText,
    proofLines,
    confidence: clamp01(avg(confidences)),
    changedProgram,
  }
}

/**
 * Neutral, honest summary for any "no evidence" case. AB11-5 renders this
 * as the onboarding-baseline copy — never a failure state.
 */
export function summarizeNoEvidence(
  scope: 'benchmark' | 'workout' | 'both',
): ProgramEvidenceFeedbackSummary {
  const text =
    scope === 'benchmark'
      ? 'No calibration tests logged yet — recommendation uses your onboarding baseline.'
      : scope === 'workout'
        ? 'No completed workouts to learn from yet — using your onboarding baseline.'
        : 'No benchmark or workout evidence yet — using your onboarding baseline until you log tests or workouts.'
  return {
    benchmarkSignalsUsed: 0,
    workoutSignalsUsed: 0,
    domainsAffected: [],
    decisionsApplied: [],
    latestEvidenceAt: null,
    summaryText: text,
    proofLines: [],
    confidence: 0,
    changedProgram: false,
  }
}

// =============================================================================
// PROOF LINE HELPERS (compact athlete-facing strings — never marketing)
// =============================================================================

function topBenchmarkProofLines(
  signals: readonly BenchmarkEvidenceSignal[],
  limit: number,
): string[] {
  // Prefer signals that actually changed something (active decisions),
  // then improved/regressed, then baseline_established. This matches the
  // AB11-5 rule: "name the evidence honestly".
  const ranked = [...signals].sort((a, b) => {
    const aw = signalWeight(a)
    const bw = signalWeight(b)
    return bw - aw
  })
  const out: string[] = []
  for (const s of ranked) {
    if (out.length >= limit) break
    out.push(s.reason)
  }
  return out
}

function signalWeight(s: BenchmarkEvidenceSignal): number {
  if (s.interpretation === 'regressed') return 4
  if (s.interpretation === 'improved') return 3
  if (s.interpretation === 'stable') return 2
  if (s.interpretation === 'baseline_established') return 1
  return 0
}

function topWorkoutProofLines(
  signals: readonly WorkoutEvidenceSignal[],
  limit: number,
): string[] {
  const ranked = [...signals].sort((a, b) => {
    const aw = workoutSignalWeight(a)
    const bw = workoutSignalWeight(b)
    return bw - aw
  })
  const out: string[] = []
  const seenExercises = new Set<string>()
  for (const s of ranked) {
    if (out.length >= limit) break
    // Avoid showing the same exercise three times.
    const key = s.exerciseId ?? s.exerciseName
    if (seenExercises.has(key)) continue
    seenExercises.add(key)
    out.push(s.reason)
  }
  return out
}

function workoutSignalWeight(s: WorkoutEvidenceSignal): number {
  // Pain / high fatigue dominates; then missed, then exceeded, then completed.
  if (s.fatigueSignal === 'high') return 5
  if (s.completionQuality === 'missed') return 4
  if (s.completionQuality === 'exceeded') return 3
  if (s.completionQuality === 'barely_completed') return 2
  if (s.completionQuality === 'completed') return 1
  return 0
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}
