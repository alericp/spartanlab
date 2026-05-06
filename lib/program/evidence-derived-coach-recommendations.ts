/**
 * ============================================================================
 * AB13-1 / AB13-2 / AB13-6 — EVIDENCE-DERIVED COACH RECOMMENDATIONS
 * ============================================================================
 *
 * Pure, typed derivation that turns the existing AB12-1 calibration plan
 * + the AB12-2 generation-influence stamp + (AB13-6) the AB13-4 shaping
 * proof into a small bundle of honest "AI Coach" recommendations the
 * Program page can render verbatim.
 *
 * AB13-2 upgrade:
 *   - Adds a deterministic actionability layer on top of every status
 *     branch (active / observe / suppressed / waiting / degraded).
 *   - New fields are derived from the SAME canonical AB11/AB12 truth
 *     this helper already consumes — no new evidence source, no new
 *     storage, no fake AI.
 *   - Active state still requires `influence.status === 'active'` AND
 *     `influence.allowedToMutateProgram === true`, so the new
 *     `truthStatusLabel: 'Applied to this program'` line cannot fire
 *     under AB12-2 default hooks. Same gate, more clarity.
 *
 * AB13-6 upgrade (renderer-only proof surfacing):
 *   - Accepts an optional `shapingProof` input sourced verbatim from
 *     `program.evidenceCalibrationShapingProof` (stamped by the AB13-4
 *     pass in `lib/program/evidence-calibration-program-shaping.ts`).
 *   - Derives THREE optional renderer-friendly fields on the primary
 *     recommendation: `programShapingProofStatus`,
 *     `programShapingProofLabel`, `programShapingProofDetail`. The
 *     renderer (EvidenceCoachRecommendationCard) reads these verbatim
 *     and shows ONE subtle line so the user can distinguish:
 *        - applied + capped N exercises,
 *        - active + no exercise required capping,
 *        - skipped (safe reason),
 *        - unavailable (older program — line is omitted).
 *   - Adds NO new structural hook, NO new shaping behavior, NO new
 *     storage. The proof is read-only canonical AB13-4 truth.
 *   - Active gate is unchanged: the existing `appliedToProgram` rule
 *     still requires `influence.status === 'active'` AND
 *     `influence.allowedToMutateProgram === true`. Shaping proof
 *     CANNOT promote a non-active recommendation to applied.
 *
 * Truth source funnel (MUST NOT diverge):
 *
 *   AB11 evidence summary (program.performanceAdaptation stamps)
 *     -> AB12-1 ProgramEvidenceCalibrationPlan
 *     -> AB12-2 EvidenceCalibrationGenerationInfluence
 *     -> AB13-4 EvidenceCalibrationShapingProof (optional)
 *     -> AB13-1/AB13-2/AB13-6 EvidenceCoachRecommendationBundle (this file)
 *     -> Program page passes the bundle to the renderer
 *     -> EvidenceCoachRecommendationCard renders verbatim
 *
 * Contract guarantees:
 *
 *   1. NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`.
 *   2. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *      Safe to call inside server actions and inside a render path.
 *   3. The helper NEVER fabricates evidence. If `influence` is null, or
 *      `inactive`, the bundle is empty (`primary === null`).
 *   4. The helper NEVER claims `appliedToProgram: true` unless
 *      `influence.status === 'active'` AND
 *      `influence.allowedToMutateProgram === true`.
 *   5. Every visible string the renderer shows is computed here. The
 *      renderer is dumb — it cannot invent labels, chips, or actions.
 *   6. AB13-6 helperVersion stamp.
 */

import type {
  ProgramEvidenceCalibrationPlan,
  ProgramCalibrationPlanConfidence,
  ProgressionAggressiveness,
  VolumeBias,
  IntensityBias,
  RecoveryBias,
} from './evidence-aware-program-calibration-governor'
import type { EvidenceCalibrationGenerationInfluence } from './evidence-calibration-generation-influence'
import type { EvidenceCalibrationShapingProof } from './evidence-calibration-program-shaping'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EvidenceCoachRecommendationStatus =
  | 'active'
  | 'observe'
  | 'suppressed'
  | 'waiting'
  | 'degraded'

export type EvidenceCoachRecommendationSeverity = 'info' | 'notice' | 'caution'

export type EvidenceCoachRecommendationConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'insufficient'

/**
 * AB13-2: deterministic actionability ladder. Mirrors the status ladder
 * but expresses it in user-action terms so the renderer can show a
 * single chip without re-deriving anything.
 *   - `ready`            : a real applied adjustment is in effect.
 *   - `monitor`          : evidence exists but no structural change.
 *   - `collect_evidence` : nothing to act on yet — log/test more.
 *   - `blocked`          : a constraint was detected but suppressed.
 *   - `degraded`         : evidence source is temporarily unavailable.
 */
export type EvidenceCoachActionability =
  | 'ready'
  | 'monitor'
  | 'collect_evidence'
  | 'blocked'
  | 'degraded'

/**
 * AB13-2: mirrors AB12-1 confidence into a renderer-friendly evidence
 * quality label so the card can show an honest data-quality chip
 * without inventing thresholds.
 */
export type EvidenceCoachEvidenceQuality =
  | 'strong'
  | 'moderate'
  | 'limited'
  | 'insufficient'

/**
 * AB13-6: renderer-friendly summary of the AB13-4 shaping proof.
 *   - `applied`           : shaping pass ran AND mutated at least one
 *                           exercise (e.g. capped N RPE targets at 7).
 *   - `checked_no_change` : shaping pass ran but every prescribed RPE
 *                           was already at/below the conservative
 *                           ceiling — nothing in the program needed
 *                           capping. Honest "active, no-op" state.
 *   - `skipped`           : shaping gate was closed for a safe reason
 *                           (status not active, not allowed to mutate,
 *                           or plan did not request the conservative
 *                           direction). User-facing copy avoids raw
 *                           enum names.
 *   - `unavailable`       : no proof was passed to the helper (older
 *                           program generated before AB13-4, or proof
 *                           dropped during normalization). Renderer
 *                           silently omits the line.
 */
export type EvidenceCoachShapingProofStatus =
  | 'applied'
  | 'checked_no_change'
  | 'skipped'
  | 'unavailable'

export interface EvidenceCoachRecommendation {
  // AB13-1 contract (preserved verbatim) ---------------------------------
  id: string
  status: EvidenceCoachRecommendationStatus
  severity: EvidenceCoachRecommendationSeverity
  title: string
  summary: string
  recommendation: string
  why: string[]
  evidenceSource: string[]
  visibleProof: string[]
  confidenceLabel: EvidenceCoachRecommendationConfidence
  appliedToProgram: boolean
  suppressedReason?: string

  // AB13-2 actionability layer (always populated) ------------------------
  /**
   * Short imperative coach label, e.g. "Follow the calibrated
   * adjustment", "Stay the course", "Use safe baseline". Always set.
   */
  coachActionLabel: string
  /**
   * One-sentence coach detail expanding `coachActionLabel`. Always set.
   */
  coachActionDetail: string
  /**
   * What the user should do next, in concrete behavioral terms. Always
   * set. Never fluff — derived from AB11/AB12 truth or a deterministic
   * default per status.
   */
  userNextStep: string
  /**
   * What SpartanLab will do next on its own. Always set. Used to make
   * the loop feel reciprocal without claiming new behavior.
   */
  systemNextStep: string
  /**
   * Truth-status chip, e.g. "Applied to this program",
   * "Detected, not applied", "Monitoring trend", "Needs evidence",
   * "Evidence unavailable". Always set.
   */
  truthStatusLabel: string
  /**
   * Same string as `suppressedReason` when present — exposed under a
   * second name so the renderer can show it as a "Why it is not
   * applied yet" note without coupling to the suppressedReason field.
   */
  blockedReason?: string
  /**
   * Renderer-friendly evidence-quality chip. Mirrors `confidenceLabel`
   * for non-waiting states; `insufficient` for waiting/degraded.
   */
  evidenceQualityLabel: EvidenceCoachEvidenceQuality
  /**
   * Single-word actionability chip the renderer can show as-is.
   */
  actionability: EvidenceCoachActionability

  // AB13-6 shaping-proof surface (optional; only present on the primary) ---
  /**
   * Honest summary status of the AB13-4 shaping pass for THIS program.
   * Omitted when no proof is available (older programs / unavailable).
   */
  programShapingProofStatus?: EvidenceCoachShapingProofStatus
  /**
   * Short user-facing label, e.g. "Program shaping applied",
   * "Program shaping checked", "Program shaping not applied". Always
   * paired with `programShapingProofDetail` when present.
   */
  programShapingProofLabel?: string
  /**
   * One-sentence honest detail derived from the AB13-4 shaping proof.
   * Never references raw enum names like `ranShapingPass`,
   * `cappedExerciseCount`, or `skippedReason`.
   */
  programShapingProofDetail?: string
}

export interface EvidenceCoachRecommendationBundle {
  primary: EvidenceCoachRecommendation | null
  supporting: EvidenceCoachRecommendation[]
  derivedFrom: 'ab11+ab12' | 'ab12-only' | 'inactive'
  helperVersion: 'ab13-6-evidence-coach-shaping-proof'
}

const HELPER_VERSION =
  'ab13-6-evidence-coach-shaping-proof' as const

const EMPTY_BUNDLE: EvidenceCoachRecommendationBundle = {
  primary: null,
  supporting: [],
  derivedFrom: 'inactive',
  helperVersion: HELPER_VERSION,
}

// ---------------------------------------------------------------------------
// Public derivation
// ---------------------------------------------------------------------------

export function deriveEvidenceCoachRecommendations(args: {
  plan: ProgramEvidenceCalibrationPlan | null
  influence: EvidenceCalibrationGenerationInfluence | null
  /**
   * AB13-6: optional shaping proof read verbatim from
   * `program.evidenceCalibrationShapingProof`. When omitted/null the
   * helper derives no shaping-proof line and the renderer silently
   * skips that surface (existing behavior preserved). When present the
   * helper produces ONE honest user-facing line per the rules in
   * `buildProgramShapingProofFields`.
   */
  shapingProof?: EvidenceCalibrationShapingProof | null
}): EvidenceCoachRecommendationBundle {
  const { plan, influence, shapingProof } = args

  // AB13-6: pre-derive the shaping-proof fields ONCE so every primary
  // literal below can spread them uniformly. Returns `undefined` when
  // there is nothing user-facing to show, keeping the AB13-1 contract
  // (every existing primary literal stays valid).
  const shapingFields = buildProgramShapingProofFields(shapingProof ?? null)

  // Rule 1: nothing to show.
  if (!influence || influence.status === 'inactive') {
    return EMPTY_BUNDLE
  }

  // Rule 2: degraded.
  if (influence.status === 'degraded') {
    const action = buildCoachActionFields('degraded', {
      influence,
      plan,
    })
    const primary: EvidenceCoachRecommendation = {
      id: 'evidence-coach-degraded',
      status: 'degraded',
      severity: 'caution',
      title: 'Evidence unavailable - safe baseline',
      summary:
        'SpartanLab cannot read the latest evidence right now, so the program is using the conservative baseline.',
      recommendation:
        'Continue training as planned. SpartanLab will resume calibrating as soon as evidence is available again.',
      why:
        influence.reasonSummary.length > 0
          ? influence.reasonSummary
          : ['Evidence source temporarily unavailable.'],
      evidenceSource: ['AB12-1 calibration governor'],
      visibleProof: influence.proof.chips,
      confidenceLabel: 'low',
      appliedToProgram: false,
      ...action,
      ...(shapingFields ?? {}),
    }
    return {
      primary,
      supporting: [],
      derivedFrom: 'ab12-only',
      helperVersion: HELPER_VERSION,
    }
  }

  // Rule 3: active.
  if (influence.status === 'active' && influence.allowedToMutateProgram) {
    const recommendation = buildActiveRecommendationCopy({
      progressionAggressiveness: influence.progressionAggressiveness,
      volumeBias: influence.volumeBias,
      intensityBias: influence.intensityBias,
      recoveryBias: influence.recoveryBias,
    })

    const watchNext = buildWatchNextCopy({
      progressionAggressiveness: influence.progressionAggressiveness,
      recoveryBias: influence.recoveryBias,
    })

    const why: string[] = [
      ...(influence.reasonSummary.length > 0
        ? influence.reasonSummary
        : ['Recent training evidence supports this adjustment.']),
      ...(watchNext ? [watchNext] : []),
    ].slice(0, 4)

    const severity: EvidenceCoachRecommendationSeverity =
      influence.recoveryBias === 'protect' ||
      influence.progressionAggressiveness === 'conservative'
        ? 'notice'
        : 'info'

    const action = buildCoachActionFields('active', { influence, plan })

    const primary: EvidenceCoachRecommendation = {
      id: 'evidence-coach-active',
      status: 'active',
      severity,
      title: 'AI Coach Recommendation - Active',
      summary: buildActiveSummary(influence.appliedConstraints.length),
      recommendation,
      why,
      evidenceSource: [
        'AB11 workout adaptation stamps',
        'AB12-1 calibration governor',
        'AB12-2 generation influence',
      ],
      visibleProof: influence.appliedConstraints,
      confidenceLabel: influence.confidence,
      appliedToProgram: true,
      ...action,
      ...(shapingFields ?? {}),
    }

    const supporting: EvidenceCoachRecommendation[] = []
    if (influence.suppressedConstraints.length > 0) {
      const supportingAction = buildCoachActionFields('suppressed', {
        influence,
        plan,
      })
      supporting.push({
        id: 'evidence-coach-active-pending',
        status: 'suppressed',
        severity: 'info',
        title: 'Other adjustments pending',
        summary: buildPendingSummary(influence.suppressedConstraints.length),
        recommendation:
          'No action required. SpartanLab will activate these as future safe builder hooks ship.',
        why: [],
        evidenceSource: ['AB12-2 generation influence'],
        visibleProof: influence.suppressedConstraints.slice(0, 3),
        confidenceLabel: influence.confidence,
        appliedToProgram: false,
        suppressedReason:
          'No audited builder hook for this constraint yet (deferred to a future AB phase).',
        ...supportingAction,
        blockedReason:
          supportingAction.blockedReason ??
          'No audited builder hook for this constraint yet (deferred to a future AB phase).',
      })
    }

    return {
      primary,
      supporting,
      derivedFrom: 'ab11+ab12',
      helperVersion: HELPER_VERSION,
    }
  }

  // Rule 4: metadata_only.
  if (influence.status === 'metadata_only') {
    // 4a: no evidence yet.
    if (plan?.status === 'no_evidence') {
      const action = buildCoachActionFields('waiting', { influence, plan })
      const primary: EvidenceCoachRecommendation = {
        id: 'evidence-coach-waiting',
        status: 'waiting',
        severity: 'info',
        title: 'Waiting for evidence',
        summary:
          'SpartanLab needs benchmarks or logged sessions before it can calibrate.',
        recommendation: influence.benchmarkRetestPrompt
          ? 'Complete a benchmark test or log a few workouts so SpartanLab can start calibrating recommendations.'
          : 'Log a few workouts so SpartanLab can start tracking trends.',
        why: [],
        evidenceSource: [],
        visibleProof: [],
        confidenceLabel: 'insufficient',
        appliedToProgram: false,
        ...action,
        ...(shapingFields ?? {}),
      }
      return {
        primary,
        supporting: [],
        derivedFrom: 'ab12-only',
        helperVersion: HELPER_VERSION,
      }
    }

    // 4b: applied plan, but every structural constraint suppressed.
    if (influence.suppressedConstraints.length > 0) {
      const action = buildCoachActionFields('suppressed', { influence, plan })
      const primary: EvidenceCoachRecommendation = {
        id: 'evidence-coach-suppressed',
        status: 'suppressed',
        severity: 'notice',
        title: 'Adjustment detected - not applied yet',
        summary: buildSuppressedSummary(
          influence.suppressedConstraints.length,
        ),
        recommendation:
          'Continue training as planned. SpartanLab will apply the adjustment automatically once the safe builder hook ships.',
        why:
          influence.reasonSummary.length > 0
            ? influence.reasonSummary
            : ['Evidence detected but pending builder wiring.'],
        evidenceSource: [
          'AB11 workout adaptation stamps',
          'AB12-1 calibration governor',
        ],
        visibleProof: influence.suppressedConstraints,
        confidenceLabel: influence.confidence,
        appliedToProgram: false,
        suppressedReason:
          'Structural builder constraints are suppressed by default in AB12-2 until each is wired by a future AB phase.',
        ...action,
        blockedReason:
          action.blockedReason ??
          'Structural builder constraints are suppressed by default in AB12-2 until each is wired by a future AB phase.',
        ...(shapingFields ?? {}),
      }
      return {
        primary,
        supporting: [],
        derivedFrom: 'ab11+ab12',
        helperVersion: HELPER_VERSION,
      }
    }

    // 4c: applied plan with zero suppressed structural constraints.
    const action = buildCoachActionFields('observe', { influence, plan })
    const primary: EvidenceCoachRecommendation = {
      id: 'evidence-coach-observe',
      status: 'observe',
      severity: 'info',
      title: 'Coach Recommendation - Observing',
      summary: 'SpartanLab is watching the trend before changing your program.',
      recommendation: influence.benchmarkRetestPrompt
        ? 'A benchmark retest is suggested so calibration confidence can grow.'
        : 'Keep logging workouts so trends become actionable.',
      why: influence.reasonSummary,
      evidenceSource: [
        'AB11 workout adaptation stamps',
        'AB12-1 calibration governor',
      ],
      visibleProof: influence.proof.chips,
      confidenceLabel: influence.confidence,
      appliedToProgram: false,
      ...action,
      ...(shapingFields ?? {}),
    }
    return {
      primary,
      supporting: [],
      derivedFrom: 'ab11+ab12',
      helperVersion: HELPER_VERSION,
    }
  }

  // Rule 5: fallback (defensive).
  return EMPTY_BUNDLE
}

// ---------------------------------------------------------------------------
// AB13-2 actionability builders — pure
// ---------------------------------------------------------------------------

/**
 * Resolved AB13-2 action layer for a given status. Returned as a
 * partial so callers can spread it onto a recommendation literal and
 * keep their AB13-1 fields without repetition.
 */
type AB13_2Fields = Pick<
  EvidenceCoachRecommendation,
  | 'coachActionLabel'
  | 'coachActionDetail'
  | 'userNextStep'
  | 'systemNextStep'
  | 'truthStatusLabel'
  | 'evidenceQualityLabel'
  | 'actionability'
> & { blockedReason?: string }

function buildCoachActionFields(
  status: EvidenceCoachRecommendationStatus,
  ctx: {
    influence: EvidenceCalibrationGenerationInfluence
    plan: ProgramEvidenceCalibrationPlan | null
  },
): AB13_2Fields {
  const { influence } = ctx
  const evidenceQualityLabel = mapConfidenceToEvidenceQuality(
    status,
    influence.confidence,
  )
  const truthStatusLabel = buildTruthStatusLabel(status)

  switch (status) {
    case 'active': {
      return {
        coachActionLabel: 'Follow the calibrated adjustment',
        coachActionDetail:
          'SpartanLab updated this program based on recent training evidence. The adjustment is in effect now.',
        userNextStep: buildUserNextStep('active', ctx),
        systemNextStep: buildSystemNextStep('active'),
        truthStatusLabel,
        evidenceQualityLabel,
        actionability: 'ready',
      }
    }
    case 'observe': {
      return {
        coachActionLabel: 'Stay the course',
        coachActionDetail:
          'SpartanLab is watching the current trend and waiting for stronger evidence before changing the plan.',
        userNextStep: buildUserNextStep('observe', ctx),
        systemNextStep: buildSystemNextStep('observe'),
        truthStatusLabel,
        evidenceQualityLabel,
        actionability: 'monitor',
      }
    }
    case 'suppressed': {
      const blockedReason =
        'A safe builder hook for this constraint has not shipped yet, so the detected adjustment is held back instead of applied automatically.'
      return {
        coachActionLabel: 'Keep training as written',
        coachActionDetail:
          'SpartanLab detected an adjustment but has not applied it. The suggestion will switch on once the matching builder hook is audited and shipped.',
        userNextStep: buildUserNextStep('suppressed', ctx),
        systemNextStep: buildSystemNextStep('suppressed'),
        truthStatusLabel,
        evidenceQualityLabel,
        actionability: 'blocked',
        blockedReason,
      }
    }
    case 'waiting': {
      return {
        coachActionLabel: 'Create the first signal',
        coachActionDetail:
          'SpartanLab needs a benchmark retest or a few logged workouts before it can calibrate. Until then, train as planned.',
        userNextStep: buildUserNextStep('waiting', ctx),
        systemNextStep: buildSystemNextStep('waiting'),
        truthStatusLabel,
        evidenceQualityLabel,
        actionability: 'collect_evidence',
      }
    }
    case 'degraded': {
      return {
        coachActionLabel: 'Use safe baseline',
        coachActionDetail:
          'Evidence is temporarily unavailable, so SpartanLab is holding the conservative baseline and not making program changes from incomplete data.',
        userNextStep: buildUserNextStep('degraded', ctx),
        systemNextStep: buildSystemNextStep('degraded'),
        truthStatusLabel,
        evidenceQualityLabel,
        actionability: 'degraded',
      }
    }
  }
}

/**
 * Confidence mapping. Waiting and degraded force `insufficient` /
 * `limited` so the chip cannot lie about data quality.
 */
function mapConfidenceToEvidenceQuality(
  status: EvidenceCoachRecommendationStatus,
  confidence: ProgramCalibrationPlanConfidence,
): EvidenceCoachEvidenceQuality {
  if (status === 'waiting') return 'insufficient'
  if (status === 'degraded') return 'limited'
  switch (confidence) {
    case 'high':
      return 'strong'
    case 'medium':
      return 'moderate'
    case 'low':
      return 'limited'
    default:
      return 'insufficient'
  }
}

function buildTruthStatusLabel(
  status: EvidenceCoachRecommendationStatus,
): string {
  switch (status) {
    case 'active':
      return 'Applied to this program'
    case 'observe':
      return 'Monitoring trend'
    case 'suppressed':
      return 'Detected, not applied'
    case 'waiting':
      return 'Needs evidence'
    case 'degraded':
      return 'Evidence unavailable'
  }
}

function buildUserNextStep(
  status: EvidenceCoachRecommendationStatus,
  ctx: {
    influence: EvidenceCalibrationGenerationInfluence
    plan: ProgramEvidenceCalibrationPlan | null
  },
): string {
  const { influence } = ctx
  switch (status) {
    case 'active':
      return 'Train this week as written and log session difficulty so the next calibration cycle has fresh data.'
    case 'observe':
      return 'Log your next sessions with RPE, completion, and notes so the trend can mature into a real adjustment.'
    case 'suppressed':
      return 'Keep logging workouts so the recommendation stays calibrated for the moment the builder hook ships.'
    case 'waiting':
      return influence.benchmarkRetestPrompt
        ? 'Complete a benchmark retest so SpartanLab can calibrate from a known reference point.'
        : 'Log two or three workouts so SpartanLab has enough signal to begin calibrating.'
    case 'degraded':
      return 'Continue training as written and avoid manual overcorrection while evidence is unavailable.'
  }
}

function buildSystemNextStep(
  status: EvidenceCoachRecommendationStatus,
): string {
  switch (status) {
    case 'active':
      return 'SpartanLab will compare upcoming sessions against this adjustment and re-evaluate next cycle.'
    case 'observe':
      return 'SpartanLab will wait for stronger evidence before escalating into a structural adjustment.'
    case 'suppressed':
      return 'A future AB phase will wire this suppressed constraint into program generation once the builder hook is audited.'
    case 'waiting':
      return 'SpartanLab will begin calibration automatically as soon as enough evidence exists.'
    case 'degraded':
      return 'SpartanLab will resume calibration the moment the evidence source is reachable again.'
  }
}

// ---------------------------------------------------------------------------
// AB13-1 copy helpers — pure (preserved verbatim)
// ---------------------------------------------------------------------------

function buildActiveSummary(appliedCount: number): string {
  return `Calibration is shaping this program (${appliedCount} constraint${appliedCount === 1 ? '' : 's'} applied).`
}

function buildPendingSummary(suppressedCount: number): string {
  return `${suppressedCount} additional constraint${suppressedCount === 1 ? ' is' : 's are'} detected but not yet wired into the program.`
}

function buildSuppressedSummary(suppressedCount: number): string {
  return `Recent evidence suggests ${suppressedCount} adjustment${suppressedCount === 1 ? '' : 's'}, but the safe builder hook is not yet active.`
}

function buildActiveRecommendationCopy(inputs: {
  progressionAggressiveness: ProgressionAggressiveness | null
  volumeBias: VolumeBias | null
  intensityBias: IntensityBias | null
  recoveryBias: RecoveryBias | null
}): string {
  const parts: string[] = []
  switch (inputs.progressionAggressiveness) {
    case 'conservative':
      parts.push('Stay with the conservative progression this cycle')
      break
    case 'aggressive':
      parts.push('Push the planned progression aggressively')
      break
    case 'standard':
      parts.push('Hold the standard progression')
      break
    case null:
      break
  }
  switch (inputs.recoveryBias) {
    case 'protect':
      parts.push('protect recovery before adding load')
      break
    case 'normal':
    case null:
      break
  }
  switch (inputs.volumeBias) {
    case 'reduce':
      parts.push('reduce volume')
      break
    case 'increase_carefully':
      parts.push('add volume carefully')
      break
    case 'maintain':
    case null:
      break
  }
  switch (inputs.intensityBias) {
    case 'cap':
      parts.push('cap intensity for now')
      break
    case 'allow_progression':
      parts.push('allow intensity to progress')
      break
    case 'maintain':
    case null:
      break
  }
  if (parts.length === 0) {
    return 'Continue with the calibrated program as generated.'
  }
  const [head, ...tail] = parts
  return tail.length === 0 ? `${head}.` : `${head}; ${tail.join('; ')}.`
}

function buildWatchNextCopy(inputs: {
  progressionAggressiveness: ProgressionAggressiveness | null
  recoveryBias: RecoveryBias | null
}): string | null {
  if (inputs.recoveryBias === 'protect') {
    return 'Watch sleep, soreness, and morning readiness over the next sessions.'
  }
  if (inputs.progressionAggressiveness === 'conservative') {
    return 'Watch how the next two sessions feel before pushing further.'
  }
  return null
}

// ---------------------------------------------------------------------------
// AB13-6 program shaping proof — pure
// ---------------------------------------------------------------------------

/**
 * AB13-6 fields produced by `buildProgramShapingProofFields`. Returns
 * `undefined` instead of a partial when the proof is not present
 * (older programs / unavailable) so spreading `...(fields ?? {})`
 * preserves the existing AB13-1 / AB13-2 contract verbatim.
 */
type AB13_6ShapingFields = Pick<
  EvidenceCoachRecommendation,
  | 'programShapingProofStatus'
  | 'programShapingProofLabel'
  | 'programShapingProofDetail'
>

/**
 * Derive the AB13-6 user-facing shaping-proof fields from the canonical
 * AB13-4 `EvidenceCalibrationShapingProof`. Pure, deterministic, never
 * fabricates evidence:
 *
 *   - `null` / `undefined`     -> returns `undefined` (renderer omits line).
 *   - `appliedAtLeastOneMutation === true`
 *                              -> 'applied' + capped-count detail.
 *   - `ranShapingPass === true && appliedAtLeastOneMutation === false`
 *                              -> 'checked_no_change' + honest no-op detail.
 *   - `skippedReason !== null` -> 'skipped' + safe user-facing reason.
 *
 * Never references raw enum names like `ranShapingPass`,
 * `cappedExerciseCount`, `skippedReason`, or `ceilingRpe` in user-facing
 * copy. Detail strings are short and coaching-toned.
 */
function buildProgramShapingProofFields(
  proof: EvidenceCalibrationShapingProof | null,
): AB13_6ShapingFields | undefined {
  // AB13-1 contract preservation: when there is nothing to surface, the
  // helper returns `undefined`, the spread is a no-op, and every
  // existing field on the recommendation literal stays unchanged.
  if (!proof) return undefined

  // Applied: the AB13-4 pass actually mutated at least one exercise.
  if (proof.ranShapingPass && proof.appliedAtLeastOneMutation) {
    const n = proof.cappedExerciseCount
    const ceiling = proof.ceilingRpe
    const noun = `working-set RPE target${n === 1 ? '' : 's'}`
    return {
      programShapingProofStatus: 'applied',
      programShapingProofLabel: 'Program shaping applied',
      programShapingProofDetail: `Capped ${n} ${noun} at RPE ${ceiling} this cycle.`,
    }
  }

  // Checked, no change: gate was open but nothing in the program needed
  // capping. Honest "active no-op" — does NOT claim a mutation occurred.
  if (proof.ranShapingPass && !proof.appliedAtLeastOneMutation) {
    return {
      programShapingProofStatus: 'checked_no_change',
      programShapingProofLabel: 'Program shaping checked',
      programShapingProofDetail: `Conservative progression is active, but no exercise needed an RPE cap (every prescribed RPE was already at or below ${proof.ceilingRpe}).`,
    }
  }

  // Skipped: gate was closed for one of the safe AB13-4 reasons. Map
  // each enum to a coaching-toned sentence that never leaks the enum.
  if (proof.skippedReason !== null) {
    return {
      programShapingProofStatus: 'skipped',
      programShapingProofLabel: 'Program shaping not applied',
      programShapingProofDetail: buildShapingSkippedDetail(proof.skippedReason),
    }
  }

  // Defensive: proof object exists but matches none of the known shapes.
  // Treat as unavailable rather than inventing a status.
  return undefined
}

function buildShapingSkippedDetail(
  reason: NonNullable<EvidenceCalibrationShapingProof['skippedReason']>,
): string {
  switch (reason) {
    case 'progression_not_conservative':
      return 'Current evidence does not call for conservative progression on this program.'
    case 'status_not_active':
      return 'The recommendation is being monitored, not applied to this program.'
    case 'not_allowed_to_mutate':
      return 'The recommendation is held back from mutating this program for safety.'
    case 'no_influence':
      return 'No evidence influence was available when this program was generated.'
  }
}
