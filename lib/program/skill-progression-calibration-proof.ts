/**
 * [PHASE AB8 — SKILL PROGRESSION CALIBRATION PROOF]
 *
 * Pure, display-time resolver that converts an exercise row's existing
 * winner-provenance + execution truth + coaching metadata into a single
 * compact athlete-facing line answering:
 *
 *   "Was this exercise actually calibrated to the athlete's current skill
 *    progression truth?"
 *
 * Truth precedence (high → low):
 *   1. exercise.dbTruthWinnerProvenance       (durable post-rerank stamp;
 *                                              defined in `lib/adaptive-program-builder.ts`
 *                                              at the AdaptiveExercise type
 *                                              and stamped at the canonical
 *                                              join site after rerank)
 *   2. exercise.executionTruth                (skill identity + current
 *                                              working progression; supports
 *                                              live-execution authority)
 *   3. exercise.skillGraphPosition            (display-only signal; never
 *                                              used as final winner proof
 *                                              alone)
 *   4. exercise.coachingMeta.skillSupportTargets
 *                                             (only used to render a
 *                                              support-row note when the
 *                                              row clearly is support, not
 *                                              direct skill)
 *   5. exercise name / category (last-resort skill-family fingerprint)
 *
 * The resolver NEVER:
 *   - invents calibration proof from name alone
 *   - claims direct calibration when only support targets exist
 *   - contradicts a conservative AB7 progression line — every conservative
 *     verdict here uses conservative-leaning copy
 *   - throws (never reads a property on null/undefined; everything routes
 *     through `unknown`-safe accessors)
 *
 * Pure module: no React, no DOM, no network, no DB, no localStorage, no
 * async. Safe to import anywhere.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type SkillProgressionCalibrationVerdict =
  | 'current_progression_used'
  | 'readiness_capped'
  | 'current_over_history'
  | 'conservative_current_truth'
  | 'progressive_current_truth'
  | 'support_only'
  | 'not_calibrated'

export type SkillProgressionCalibrationSource =
  | 'db_truth_winner'
  | 'execution_truth'
  | 'skill_graph'
  | 'support_target'
  | 'fallback'

export interface SkillProgressionCalibrationProof {
  shouldRender: boolean
  verdict: SkillProgressionCalibrationVerdict
  label: string
  shortText: string
  detailText?: string
  source: SkillProgressionCalibrationSource
  confidence: 'low' | 'medium' | 'high'
  /**
   * Stable HTML data-* attributes for QA / DOM / screenshot proof. Always
   * populated even when `shouldRender === false` (consumer decides whether
   * to spread them onto the rendered element).
   */
  dataAttributes: Record<string, string>
}

export interface ResolveSkillProgressionCalibrationProofInput {
  exercise: unknown
  exerciseName: string
  isWarmupCooldown?: boolean
}

// ---------------------------------------------------------------------------
// Unknown-safe readers (no `as any`, no suppressions)
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readPath(root: unknown, path: ReadonlyArray<string>): unknown {
  let current: unknown = root
  for (const segment of path) {
    if (!isRecord(current)) return undefined
    current = current[segment]
  }
  return current
}

function readString(root: unknown, path: ReadonlyArray<string>): string | null {
  const v = readPath(root, path)
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}

function readBool(root: unknown, path: ReadonlyArray<string>): boolean | null {
  const v = readPath(root, path)
  return typeof v === 'boolean' ? v : null
}

function readNumber(root: unknown, path: ReadonlyArray<string>): number | null {
  const v = readPath(root, path)
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function readStringArray(root: unknown, path: ReadonlyArray<string>): string[] {
  const v = readPath(root, path)
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const item of v) {
    if (typeof item === 'string' && item.trim().length > 0) out.push(item)
  }
  return out
}

// ---------------------------------------------------------------------------
// Skill-family fingerprint (used only to decide whether the row is "skill
// related enough" to surface a calibration proof line; never used as the
// proof itself)
// ---------------------------------------------------------------------------

const SKILL_FAMILY_PATTERNS: ReadonlyArray<RegExp> = [
  /\bplanche\b/i,
  /\bfront[- ]?lever\b/i,
  /\bback[- ]?lever\b/i,
  /\bv[- ]?sit\b/i,
  /\bl[- ]?sit\b/i,
  /\bmaltese\b/i,
  /\biron[- ]?cross\b/i,
  /\bmuscle[- ]?up\b/i,
  /\bhandstand\b/i,
  /\bone[- ]?arm\b/i,
  /\bhspu\b/i,
  /\bpike\s+push/i,
  /\bring\s+(?:dip|row|support)/i,
  /\bskin[- ]?the[- ]?cat\b/i,
  /\btuck\b/i,
  /\bstraddle\b/i,
  /\bpseudo\s+planche/i,
  /\bdragon\s+flag/i,
  /\bhuman\s+flag/i,
  /\bback\s+bridge/i,
  /\bshrimp\s+squat/i,
  /\bpistol\s+squat/i,
]

function isSkillFamilyName(name: string): boolean {
  return SKILL_FAMILY_PATTERNS.some(rx => rx.test(name))
}

// ---------------------------------------------------------------------------
// Skill relatedness — the row qualifies for direct calibration proof if any
// strong skill identity signal exists (NOT just the name).
// ---------------------------------------------------------------------------

function isDirectSkillRow(input: {
  exercise: unknown
  name: string
}): boolean {
  // Strongest: explicit sourceSkill on executionTruth contract.
  if (readString(input.exercise, ['executionTruth', 'sourceSkill'])) return true
  // Strong: rerank pinned a skill family.
  if (readString(input.exercise, ['dbTruthWinnerProvenance', 'skillFamilyUsed'])) return true
  // Strong: coaching meta declares skill expression.
  const intent = readString(input.exercise, ['coachingMeta', 'progressionIntent'])
  if (intent === 'skill_expression' || intent === 'skill_practice') return true
  // Weak: row name matches a recognized skill family.
  if (isSkillFamilyName(input.name)) return true
  return false
}

function isClearSupportRow(exercise: unknown): boolean {
  const intent = readString(exercise, ['coachingMeta', 'progressionIntent'])
  const mode = readString(exercise, ['coachingMeta', 'expressionMode'])
  if (intent === 'strength_building' || intent === 'support' || intent === 'strength_support') return true
  if (mode === 'strength_support' || mode === 'support') return true
  return false
}

// ---------------------------------------------------------------------------
// Main resolver
// ---------------------------------------------------------------------------

const NOT_CALIBRATED: SkillProgressionCalibrationProof = {
  shouldRender: false,
  verdict: 'not_calibrated',
  label: '',
  shortText: '',
  source: 'fallback',
  confidence: 'low',
  dataAttributes: {
    'data-ab8-skill-calibration': 'false',
    'data-ab8-verdict': 'not_calibrated',
    'data-ab8-source': 'fallback',
  },
}

export function resolveSkillProgressionCalibrationProof(
  input: ResolveSkillProgressionCalibrationProofInput,
): SkillProgressionCalibrationProof {
  const { exercise, exerciseName, isWarmupCooldown } = input

  // Hard guard 1: warm-up / cooldown rows never get a calibration proof line.
  if (isWarmupCooldown === true) return NOT_CALIBRATED

  const safeName = typeof exerciseName === 'string' ? exerciseName : ''
  const skillRelated = isDirectSkillRow({ exercise, name: safeName })

  // -------------------------------------------------------------------------
  // PRIORITY 1: dbTruthWinnerProvenance (final post-rerank winner truth)
  // -------------------------------------------------------------------------
  const provenance = readPath(exercise, ['dbTruthWinnerProvenance'])
  if (isRecord(provenance)) {
    const readinessGated = readBool(provenance, ['readinessGated'])
    const conservativeByCurrentTruth = readBool(provenance, ['conservativeByCurrentTruth'])
    const currentBeatsHistorical = readBool(provenance, ['currentBeatsHistorical'])
    const depthBias = readNumber(provenance, ['depthBias'])
    const depthDelta = readNumber(provenance, ['depthDelta'])
    const precedenceUsed = readString(provenance, ['precedenceUsed'])
    const skillFamilyUsed = readString(provenance, ['skillFamilyUsed'])
    const readinessPermission = readString(provenance, ['readinessPermission'])

    // Build the readable detail text once — it is the same authoritative
    // explanation across all provenance branches and shows on hover/title.
    const detailParts: string[] = []
    if (precedenceUsed) detailParts.push(`precedence: ${precedenceUsed}`)
    if (skillFamilyUsed) detailParts.push(`skill family: ${skillFamilyUsed}`)
    if (readinessPermission) detailParts.push(`readiness: ${readinessPermission}`)
    if (typeof depthBias === 'number') detailParts.push(`depthBias: ${depthBias}`)
    if (typeof depthDelta === 'number') detailParts.push(`depthDelta: ${depthDelta}`)
    const detailText = detailParts.length > 0 ? detailParts.join(' · ') : undefined

    // Stable QA attributes derived from provenance.
    const baseAttrs: Record<string, string> = {
      'data-ab8-skill-calibration': 'true',
      'data-ab8-source': 'db_truth_winner',
      'data-ab8-precedence': precedenceUsed ?? 'none',
      'data-ab8-readiness-gated': readinessGated === null ? 'unknown' : String(readinessGated),
    }

    // 1a. Readiness gating wins over everything below — readiness gate
    //     means current readiness explicitly capped this progression.
    if (readinessGated === true) {
      return {
        shouldRender: true,
        verdict: 'readiness_capped',
        label: 'Skill calibration',
        shortText: 'Readiness capped this progression.',
        detailText,
        source: 'db_truth_winner',
        confidence: 'high',
        dataAttributes: { ...baseAttrs, 'data-ab8-verdict': 'readiness_capped' },
      }
    }

    // 1b. Current skill truth resolved to conservative — softened pick.
    if (conservativeByCurrentTruth === true) {
      return {
        shouldRender: true,
        verdict: 'conservative_current_truth',
        label: 'Skill calibration',
        shortText: 'Current skill truth kept this conservative.',
        detailText,
        source: 'db_truth_winner',
        confidence: 'high',
        dataAttributes: { ...baseAttrs, 'data-ab8-verdict': 'conservative_current_truth' },
      }
    }

    // 1c. Current response beat historical fallback — picked from current
    //     ability rather than the historical ceiling.
    if (currentBeatsHistorical === true) {
      return {
        shouldRender: true,
        verdict: 'current_over_history',
        label: 'Skill calibration',
        shortText: 'Current response beat historical fallback.',
        detailText,
        source: 'db_truth_winner',
        confidence: 'high',
        dataAttributes: { ...baseAttrs, 'data-ab8-verdict': 'current_over_history' },
      }
    }

    // 1d. Positive depth bias / delta — current truth allowed a stronger
    //     variant than the default depth would have permitted. We require
    //     skill-relatedness so positive bias on a generic accessory doesn't
    //     present as a "skill calibration" claim.
    if (skillRelated && (
      (typeof depthBias === 'number' && depthBias > 0) ||
      (typeof depthDelta === 'number' && depthDelta > 0)
    )) {
      return {
        shouldRender: true,
        verdict: 'progressive_current_truth',
        label: 'Skill calibration',
        shortText: 'Current skill truth allowed a stronger variant.',
        detailText,
        source: 'db_truth_winner',
        confidence: 'high',
        dataAttributes: { ...baseAttrs, 'data-ab8-verdict': 'progressive_current_truth' },
      }
    }

    // 1e. Precedence is current/response/readiness_gate AND the row is
    //     skill-related — winner was selected via current-progression truth.
    if (skillRelated && (
      precedenceUsed === 'current' ||
      precedenceUsed === 'response' ||
      precedenceUsed === 'readiness_gate'
    )) {
      return {
        shouldRender: true,
        verdict: 'current_progression_used',
        label: 'Skill calibration',
        shortText: 'Matched to current progression truth.',
        detailText,
        source: 'db_truth_winner',
        confidence: 'high',
        dataAttributes: { ...baseAttrs, 'data-ab8-verdict': 'current_progression_used' },
      }
    }

    // Provenance present but did not establish a meaningful skill claim
    // (e.g. precedenceUsed was 'historical'/'default'/'none' on a generic
    // accessory). Fall through to support / executionTruth / not_calibrated
    // branches below — never invent proof from a neutral provenance.
  }

  // -------------------------------------------------------------------------
  // PRIORITY 2: executionTruth.currentWorkingProgression — when no
  // provenance is available (older saved programs) but the live-execution
  // contract knows the current working level, surface that on direct skill
  // rows. Lower confidence than provenance because no rerank decision is
  // proven.
  // -------------------------------------------------------------------------
  const currentWorkingProgression = readString(exercise, [
    'executionTruth',
    'currentWorkingProgression',
  ])
  if (currentWorkingProgression && skillRelated) {
    const sourceSkill = readString(exercise, ['executionTruth', 'sourceSkill'])
    const historicalCeiling = readString(exercise, ['executionTruth', 'historicalCeiling'])
    const detailParts: string[] = [`current working: ${currentWorkingProgression}`]
    if (sourceSkill) detailParts.push(`skill: ${sourceSkill}`)
    if (historicalCeiling) detailParts.push(`historical ceiling: ${historicalCeiling}`)
    return {
      shouldRender: true,
      verdict: 'current_progression_used',
      label: 'Skill level',
      shortText: 'Using current working progression.',
      detailText: detailParts.join(' · '),
      source: 'execution_truth',
      confidence: 'medium',
      dataAttributes: {
        'data-ab8-skill-calibration': 'true',
        'data-ab8-verdict': 'current_progression_used',
        'data-ab8-source': 'execution_truth',
        'data-ab8-precedence': 'execution_truth',
        'data-ab8-readiness-gated': 'unknown',
      },
    }
  }

  // -------------------------------------------------------------------------
  // PRIORITY 3: skillSupportTargets — only renders on rows that are clearly
  // support/strength_building (not direct skill expression). Low confidence
  // because the row is acknowledged not to be a direct progression jump.
  // -------------------------------------------------------------------------
  const supportTargets = readStringArray(exercise, ['coachingMeta', 'skillSupportTargets'])
  if (supportTargets.length > 0 && isClearSupportRow(exercise) && !skillRelated) {
    return {
      shouldRender: true,
      verdict: 'support_only',
      label: 'Skill support',
      shortText: 'Supports selected skill without direct level jump.',
      detailText: `targets: ${supportTargets.join(', ')}`,
      source: 'support_target',
      confidence: 'low',
      dataAttributes: {
        'data-ab8-skill-calibration': 'true',
        'data-ab8-verdict': 'support_only',
        'data-ab8-source': 'support_target',
        'data-ab8-precedence': 'support_target',
        'data-ab8-readiness-gated': 'unknown',
      },
    }
  }

  // -------------------------------------------------------------------------
  // FALLBACK: no reliable proof — stay silent. Return `shouldRender:false`
  // with a stable `not_calibrated` verdict so callers can still inspect the
  // QA attributes if they choose, but the visible UI renders nothing.
  // -------------------------------------------------------------------------
  return NOT_CALIBRATED
}
