/**
 * ============================================================================
 * AB13-1 — EVIDENCE-DERIVED COACH RECOMMENDATIONS
 * ============================================================================
 *
 * Pure, typed derivation that turns the existing AB12-1 calibration plan
 * + the AB12-2 generation-influence stamp into a small bundle of honest
 * "AI Coach" recommendations the Program page can render verbatim.
 *
 * Truth source funnel (MUST NOT diverge):
 *
 *   AB11 evidence summary (program.performanceAdaptation stamps)
 *     -> AB12-1 ProgramEvidenceCalibrationPlan
 *     -> AB12-2 EvidenceCalibrationGenerationInfluence
 *     -> AB13-1 EvidenceCoachRecommendationBundle (this file)
 *     -> Program page passes the bundle to the renderer
 *     -> EvidenceCoachRecommendationCard renders verbatim
 *
 * Contract guarantees:
 *
 *   1. NO `as any`, NO `@ts-ignore`, NO `@ts-expect-error`.
 *   2. Pure function — no I/O, no DB, no React, no fetch, no localStorage.
 *      Safe to call inside server actions and inside a render path.
 *   3. The helper NEVER fabricates evidence. If `influence` is null, or
 *      `inactive`, the bundle is empty (`primary === null`). The component
 *      then renders nothing.
 *   4. The helper NEVER claims `appliedToProgram: true` unless
 *      `influence.status === 'active'` AND
 *      `influence.allowedToMutateProgram === true`. These two flags
 *      are themselves gated upstream by the AB12-2 `hasStructuralApplied`
 *      check, so under AB12-2 default hooks (every structural hook
 *      `false`) this branch is unreachable. That is intentional: the
 *      recommendation must reflect real shipped state, not aspiration.
 *   5. Every visible string the renderer shows is computed here. The
 *      renderer is dumb — it cannot invent labels or chips.
 *   6. Stable audit stamp via `helperVersion`.
 *
 * AB13-1 scope boundary:
 *   - This helper is the ONLY producer of `EvidenceCoachRecommendation`.
 *   - There is no second helper, no parallel template engine, no LLM.
 *   - All copy is deterministic, derived from the typed unions in the
 *     governor (`ProgressionAggressiveness`, `VolumeBias`, etc.).
 *
 * This file consumes ONLY:
 *   - `ProgramEvidenceCalibrationPlan` (AB12-1)
 *   - `EvidenceCalibrationGenerationInfluence` (AB12-2)
 * It exports ONLY pure functions and types.
 */

import type {
  ProgramEvidenceCalibrationPlan,
  ProgressionAggressiveness,
  VolumeBias,
  IntensityBias,
  RecoveryBias,
} from './evidence-aware-program-calibration-governor'
import type { EvidenceCalibrationGenerationInfluence } from './evidence-calibration-generation-influence'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Honest 5-state ladder for a single coach recommendation. Maps from
 * AB12-2 influence status + AB12-1 plan status, never from generic
 * heuristics.
 */
export type EvidenceCoachRecommendationStatus =
  | 'active'
  | 'observe'
  | 'suppressed'
  | 'waiting'
  | 'degraded'

/**
 * Visual severity hint for the renderer. `info` is the default;
 * `notice` raises attention without alarm; `caution` is reserved for
 * recovery-protection or evidence-degraded states. Never `warning`,
 * never `danger`, never medical language.
 */
export type EvidenceCoachRecommendationSeverity = 'info' | 'notice' | 'caution'

/**
 * Confidence label for the renderer chip. `insufficient` is reserved
 * for waiting/inactive states where there is no signal to be confident
 * about. The other three mirror AB12-1's `ProgramCalibrationPlanConfidence`.
 */
export type EvidenceCoachRecommendationConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'insufficient'

export interface EvidenceCoachRecommendation {
  /** Stable id; useful as a React key and for analytics. */
  id: string
  status: EvidenceCoachRecommendationStatus
  severity: EvidenceCoachRecommendationSeverity
  /** Card title. e.g. "AI Coach Recommendation - Active". */
  title: string
  /** One-sentence summary of what the system is doing. ≤140 chars. */
  summary: string
  /** Imperative coach line. e.g. "Stay with the conservative progression this cycle." */
  recommendation: string
  /**
   * Reasons array, derived from `plan.reasons` (which itself derives
   * from AB11 proofLines). Never invented copy.
   */
  why: string[]
  /**
   * Audit-style list of which canonical sources fed this recommendation.
   * e.g. ["AB11 workout adaptation stamps", "AB12-1 calibration governor"].
   * Renderer shows this as small text so the user can verify lineage.
   */
  evidenceSource: string[]
  /**
   * Compact chips the renderer shows under the recommendation. Mirrors
   * `influence.proof.chips` for consistency with the FeedbackLoopProofCard.
   * Each chip is already self-describing (e.g. "progression: conservative").
   */
  visibleProof: string[]
  confidenceLabel: EvidenceCoachRecommendationConfidence
  /**
   * True iff `influence.status === 'active'` AND
   * `influence.allowedToMutateProgram === true`. Under AB12-2 default
   * hooks, this is always `false` — that is the honest contract.
   */
  appliedToProgram: boolean
  /**
   * Set ONLY when `status === 'suppressed'`. Explains why the
   * detected adjustment was not applied (so the user does not
   * misread the surface as a bug).
   */
  suppressedReason?: string
}

export interface EvidenceCoachRecommendationBundle {
  /**
   * The single primary recommendation the renderer shows above the
   * fold. `null` means "do not render the card at all" (state is
   * `inactive` — nothing to show).
   */
  primary: EvidenceCoachRecommendation | null
  /**
   * Up to 2 supporting notes. Used today only for the "other
   * adjustments pending" entry under an active state. Capped at 2 by
   * design to keep the card compact.
   */
  supporting: EvidenceCoachRecommendation[]
  /**
   * Audit hint for the renderer. Tells the UI which truth source
   * actually drove the bundle (so we can verify in dev-tools that
   * AB13-1 read AB11+AB12 correctly, not just one of them).
   */
  derivedFrom: 'ab11+ab12' | 'ab12-only' | 'inactive'
  /** Stable audit stamp. */
  helperVersion: 'ab13-1-evidence-derived-coach-recommendations'
}

const HELPER_VERSION =
  'ab13-1-evidence-derived-coach-recommendations' as const

const EMPTY_BUNDLE: EvidenceCoachRecommendationBundle = {
  primary: null,
  supporting: [],
  derivedFrom: 'inactive',
  helperVersion: HELPER_VERSION,
}

// ---------------------------------------------------------------------------
// Public derivation
// ---------------------------------------------------------------------------

/**
 * Convert (plan + influence) into a bundle. First-match-wins ladder:
 *
 *   1. influence is null/undefined OR `inactive` → empty bundle.
 *   2. influence `degraded` → degraded notice.
 *   3. influence `active` AND `allowedToMutateProgram` → active card.
 *      Optional supporting note for any pending suppressed constraints.
 *   4. influence `metadata_only`:
 *      a. plan `no_evidence` → waiting card.
 *      b. plan `applied` AND has suppressed structural constraints →
 *         suppressed notice (the AB12-2 default state today).
 *      c. plan `applied` AND no suppressed structural constraints →
 *         observe card (a UI-level retest may be the only signal).
 *   5. fallback → empty bundle.
 *
 * Pure. Safe to call from RSC and client components.
 */
export function deriveEvidenceCoachRecommendations(args: {
  plan: ProgramEvidenceCalibrationPlan | null
  influence: EvidenceCalibrationGenerationInfluence | null
}): EvidenceCoachRecommendationBundle {
  const { plan, influence } = args

  // Rule 1: nothing to show.
  if (!influence || influence.status === 'inactive') {
    return EMPTY_BUNDLE
  }

  // Rule 2: degraded.
  if (influence.status === 'degraded') {
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
    }

    const supporting: EvidenceCoachRecommendation[] = []
    if (influence.suppressedConstraints.length > 0) {
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
      }
      return {
        primary,
        supporting: [],
        derivedFrom: 'ab12-only',
        helperVersion: HELPER_VERSION,
      }
    }

    // 4b: applied plan, but every structural constraint suppressed.
    // (This is the AB12-2 default state today.)
    if (influence.suppressedConstraints.length > 0) {
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
      }
      return {
        primary,
        supporting: [],
        derivedFrom: 'ab11+ab12',
        helperVersion: HELPER_VERSION,
      }
    }

    // 4c: applied plan with zero suppressed structural constraints.
    // The only signal is a UI-level retest prompt or no actionable
    // constraints at all → observing.
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
    }
    return {
      primary,
      supporting: [],
      derivedFrom: 'ab11+ab12',
      helperVersion: HELPER_VERSION,
    }
  }

  // Rule 5: fallback (defensive — should be unreachable).
  return EMPTY_BUNDLE
}

// ---------------------------------------------------------------------------
// Internal copy helpers — pure
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

/**
 * Build a deterministic recommendation sentence from the resolved
 * structural constraint values. Each branch mirrors a real bounded dial
 * in the generation influence — no generic copy is allowed.
 */
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
  // Capitalize the first part; lower-case the joining clauses.
  const [head, ...tail] = parts
  return tail.length === 0 ? `${head}.` : `${head}; ${tail.join('; ')}.`
}

/**
 * Optional "what to watch next" line. Only emitted when a real
 * protective dial is active.
 */
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
