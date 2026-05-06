/**
 * [PHASE AB7] EXERCISE PROGRESSION PRESCRIPTION RESOLVER
 *
 * Pure, display-time helper that converts the row-level truth already attached
 * to an exercise (performanceAdaptation.coachDecision, performanceAdaptation
 * .trendIntelligence, adaptive-dosage-resolver progressionMode, exercise
 * shape: hold / weighted / band-assisted / skill / accessory) into a single
 * compact athlete-facing progression instruction line.
 *
 * Design contract:
 *   - Pure: no React, no DOM, no I/O, no async, no localStorage, no DB.
 *   - unknown-safe: never trusts shape; reads with type guards.
 *   - Truth ladder (must be respected, in order):
 *       1. exercise.performanceAdaptation.coachDecision.action
 *       2. exercise.progressionMode (AdaptiveProgressionMode)
 *       3. exercise shape (hold / weighted / band-assisted / skill)
 *       4. fallback / not_applicable
 *   - NEVER emits "add reps" or "add load" when the coach decision says
 *     reduce_volume / lower_rpe_target / extend_rest / deload_candidate.
 *   - Returns shouldRender:false on warm-up/cooldown rows by default, and
 *     when no trustworthy progression intent can be inferred.
 *   - Output strings are short (one phrase) so the row stays compact.
 *
 * Call site: components/programs/AdaptiveSessionCard.tsx renders one line
 * directly under the Phase O Trend / Coach line. Tagged with
 * `data-ab7-progression`, `data-ab7-verdict`, `data-ab7-source` for QA proof
 * without any visible debug clutter.
 */

export type ExerciseProgressionPrescriptionVerdict =
  | 'progress_reps'
  | 'progress_hold_time'
  | 'progress_load'
  | 'reduce_assistance'
  | 'harder_variation'
  | 'maintain_quality'
  | 'maintain_insufficient_data'
  | 'regress_or_deload'
  | 'technique_focus'
  | 'not_applicable'

export type ExerciseProgressionPrescriptionSource =
  | 'coach_decision'
  | 'adaptive_dosage'
  | 'exercise_shape'
  | 'clarity_hint'
  | 'fallback'

export interface ExerciseProgressionPrescription {
  shouldRender: boolean
  verdict: ExerciseProgressionPrescriptionVerdict
  /** Short label, e.g. "Progression", "Maintain", "Technique first". */
  label: string
  /** One-line athlete-facing instruction. */
  shortText: string
  /** Optional longer hover/title text. */
  detailText?: string
  confidence: 'low' | 'medium' | 'high'
  source: ExerciseProgressionPrescriptionSource
  /** Stable QA attributes: `{ verdict, source, basis }`. */
  dataAttributes: Record<string, string>
}

export interface ResolveExerciseProgressionPrescriptionInput {
  exercise: unknown
  exerciseName: string
  reps?: string | number | null
  sets?: number | string | null
  rest?: string | number | null
  rpe?: number | string | null
  /** When true, the resolver returns shouldRender:false unless a clear
   *  hold-time progression is genuinely useful. */
  isWarmupCooldown?: boolean
}

// ----------------------------------------------------------------------------
// unknown-safe readers
// ----------------------------------------------------------------------------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function readString(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}

function readBool(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null
}

function readPath(o: unknown, ...keys: string[]): unknown {
  let cur: unknown = o
  for (const k of keys) {
    if (!isPlainObject(cur)) return undefined
    cur = cur[k]
  }
  return cur
}

// ----------------------------------------------------------------------------
// classifiers
// ----------------------------------------------------------------------------

const SKILL_HOLD_PATTERNS = [
  /planche/i,
  /front lever/i,
  /back lever/i,
  /\bv[- ]?sit\b/i,
  /\bl[- ]?sit\b/i,
  /maltese/i,
  /iron cross/i,
  /handstand hold/i,
  /handstand press/i,
  /tuck (?:planche|front lever|back lever)/i,
  /straddle (?:planche|front lever|back lever)/i,
  /full (?:planche|front lever|back lever)/i,
  /one[- ]?arm/i,
]

const HOLD_TIME_PATTERNS = [
  /\bhold\b/i,
  /\blean\b/i,
  /\bhang\b/i,
  /\bplank\b/i,
  /\bbridge\b/i,
  /\bisometric\b/i,
]

const WEIGHTED_PATTERNS = [
  /weighted/i,
  /barbell/i,
  /dumbbell/i,
  /kettlebell/i,
  /\bdb\b/i,
  /\bkb\b/i,
  /\bbb\b/i,
  /\bgoblet\b/i,
  /loaded/i,
]

const BAND_ASSISTED_PATTERNS = [
  /band[- ]assisted/i,
  /assisted (?:pull|chin|dip|muscle)/i,
  /banded (?:pull|chin|dip|muscle)/i,
  /\bband (?:pull|chin|dip|muscle|assist)/i,
]

const SKILL_FAMILY_PATTERNS = [
  /hspu|handstand push/i,
  /pike push/i,
  /\bmuscle[- ]?up\b/i,
  /pseudo planche/i,
  /\bskin the cat\b/i,
  /\btuck\b/i,
  /\bstraddle\b/i,
]

function isHoldRow(name: string, reps?: string | number | null): boolean {
  if (typeof reps === 'string' && /\d\s*s\b|sec|second|hold/i.test(reps)) return true
  return HOLD_TIME_PATTERNS.some((re) => re.test(name)) ||
    SKILL_HOLD_PATTERNS.some((re) => re.test(name))
}

function isSkillHoldRow(name: string): boolean {
  return SKILL_HOLD_PATTERNS.some((re) => re.test(name))
}

function isWeightedRow(name: string): boolean {
  return WEIGHTED_PATTERNS.some((re) => re.test(name))
}

function isBandAssistedRow(name: string): boolean {
  return BAND_ASSISTED_PATTERNS.some((re) => re.test(name))
}

function isSkillFamilyRow(name: string): boolean {
  return SKILL_FAMILY_PATTERNS.some((re) => re.test(name)) ||
    isSkillHoldRow(name)
}

// ----------------------------------------------------------------------------
// (1) coachDecision mapping  -- highest priority truth
// ----------------------------------------------------------------------------

interface CoachDecisionMapped {
  verdict: ExerciseProgressionPrescriptionVerdict
  label: string
  shortText: string
  confidence: 'low' | 'medium' | 'high'
}

function mapCoachDecisionAction(
  action: string,
  hasHoldShape: boolean,
): CoachDecisionMapped | null {
  switch (action) {
    case 'hold_progression':
      // If the row is a hold/skill row, the most useful progression cue is
      // "add seconds when quality is repeatable"; otherwise, hold dose.
      return hasHoldShape
        ? {
            verdict: 'progress_hold_time',
            label: 'Progression',
            shortText: 'Hold this progression. Add clean seconds only when every set holds repeatable position.',
            confidence: 'high',
          }
        : {
            verdict: 'maintain_quality',
            label: 'Hold progression',
            shortText: 'Hold this progression until quality is repeatable.',
            confidence: 'high',
          }
    case 'small_progression':
      return {
        verdict: 'progress_reps',
        label: 'Small progression',
        shortText: 'Small increase is allowed if reps stay clean at target RPE.',
        confidence: 'high',
      }
    case 'preserve_current_dose':
      return {
        verdict: 'maintain_quality',
        label: 'Hold dose',
        shortText: 'Keep this dose stable before progressing.',
        confidence: 'high',
      }
    case 'maintain_and_monitor':
      return {
        verdict: 'maintain_insufficient_data',
        label: 'Maintain',
        shortText: 'Maintain and monitor the next logged sets.',
        confidence: 'medium',
      }
    case 'technique_focus':
      return {
        verdict: 'technique_focus',
        label: 'Technique first',
        shortText: 'Progress only after form stays clean.',
        confidence: 'high',
      }
    case 'reduce_volume':
      return {
        verdict: 'regress_or_deload',
        label: 'Conservative',
        shortText: 'Reduce volume before progressing.',
        confidence: 'high',
      }
    case 'lower_rpe_target':
      return {
        verdict: 'maintain_quality',
        label: 'RPE cap',
        shortText: 'Keep effort lower before progressing.',
        confidence: 'high',
      }
    case 'extend_rest':
      return {
        verdict: 'maintain_quality',
        label: 'Recovery first',
        shortText: 'Use longer rest before adding difficulty.',
        confidence: 'medium',
      }
    case 'deload_candidate':
      return {
        verdict: 'regress_or_deload',
        label: 'Deload candidate',
        shortText: 'Step back temporarily if fatigue persists.',
        confidence: 'high',
      }
    case 'insufficient_data_no_change':
      return {
        verdict: 'maintain_insufficient_data',
        label: 'Maintain',
        shortText: 'Maintain until more logged sets confirm readiness.',
        confidence: 'medium',
      }
    default:
      return null
  }
}

// ----------------------------------------------------------------------------
// (2) AdaptiveProgressionMode mapping  -- second priority truth
// ----------------------------------------------------------------------------

interface ProgressionModeMapped {
  verdict: ExerciseProgressionPrescriptionVerdict
  label: string
  shortText: string
  confidence: 'low' | 'medium' | 'high'
}

function mapProgressionMode(mode: string): ProgressionModeMapped | null {
  switch (mode) {
    case 'add_reps':
      return {
        verdict: 'progress_reps',
        label: 'Progression',
        shortText: 'Add reps until you own the top of the range.',
        confidence: 'high',
      }
    case 'add_load':
      return {
        verdict: 'progress_load',
        label: 'Progression',
        shortText: 'Own the range first, then add small load.',
        confidence: 'high',
      }
    case 'reduce_assistance':
      return {
        verdict: 'reduce_assistance',
        label: 'Progression',
        shortText: 'Hit top reps cleanly, then reduce assistance.',
        confidence: 'high',
      }
    case 'add_reps_then_reduce_assistance':
      return {
        verdict: 'reduce_assistance',
        label: 'Progression',
        shortText: 'Hit the top of the range, then reduce assistance.',
        confidence: 'high',
      }
    case 'add_reps_then_harder_variation':
      return {
        verdict: 'harder_variation',
        label: 'Progression',
        shortText: 'Hit the top of the range, then move to a harder variation.',
        confidence: 'high',
      }
    case 'duration_then_progression':
      return {
        verdict: 'progress_hold_time',
        label: 'Progression',
        shortText: 'Add clean seconds before advancing variation.',
        confidence: 'high',
      }
    case 'maintain':
      return {
        verdict: 'maintain_quality',
        label: 'Maintain',
        shortText: 'Maintain this dose until quality is consistent.',
        confidence: 'medium',
      }
    default:
      return null
  }
}

// ----------------------------------------------------------------------------
// (3) Exercise-shape fallback
// ----------------------------------------------------------------------------

function shapeFallback(name: string, reps?: string | number | null): {
  verdict: ExerciseProgressionPrescriptionVerdict
  label: string
  shortText: string
  confidence: 'low' | 'medium' | 'high'
} | null {
  if (isSkillHoldRow(name)) {
    return {
      verdict: 'progress_hold_time',
      label: 'Progression',
      shortText: 'Add clean seconds only when every set holds repeatable position.',
      confidence: 'medium',
    }
  }
  if (isBandAssistedRow(name)) {
    return {
      verdict: 'reduce_assistance',
      label: 'Progression',
      shortText: 'Hit top reps cleanly, then reduce band assistance.',
      confidence: 'medium',
    }
  }
  if (isWeightedRow(name)) {
    return {
      verdict: 'progress_load',
      label: 'Progression',
      shortText: 'Own the top of the rep range first, then add small load.',
      confidence: 'medium',
    }
  }
  if (isHoldRow(name, reps)) {
    return {
      verdict: 'progress_hold_time',
      label: 'Progression',
      shortText: 'Add seconds only when every set holds clean position.',
      confidence: 'medium',
    }
  }
  if (isSkillFamilyRow(name)) {
    return {
      verdict: 'maintain_quality',
      label: 'Quality first',
      shortText: 'Build clean reps before chasing harder variation.',
      confidence: 'low',
    }
  }
  return null
}

// ----------------------------------------------------------------------------
// resolver
// ----------------------------------------------------------------------------

/**
 * Resolve a row-level progression prescription.
 *
 * Returns a single instruction object whose `shouldRender` field is the
 * caller's render gate. When `false`, the caller MUST render nothing — the
 * resolver could not establish a trustworthy progression intent for this row.
 */
export function resolveExerciseProgressionPrescription(
  input: ResolveExerciseProgressionPrescriptionInput,
): ExerciseProgressionPrescription {
  const { exercise, exerciseName, reps, isWarmupCooldown } = input
  const name = exerciseName || ''

  // ---------------------------------------------------------------------------
  // (1) coachDecision wins. If the resolver detected reduce_volume /
  // lower_rpe_target / extend_rest / deload_candidate, no shape fallback may
  // overrule it with "add reps" or "add load".
  // ---------------------------------------------------------------------------
  const coachAction = readString(
    readPath(exercise, 'performanceAdaptation', 'coachDecision', 'action'),
  )
  const coachExplanation = readString(
    readPath(exercise, 'performanceAdaptation', 'coachDecision', 'explanation'),
  )
  const trendConcise = readString(
    readPath(exercise, 'performanceAdaptation', 'trendIntelligence', 'conciseExplanation'),
  )
  const trendConfidence = (() => {
    const c = readPath(exercise, 'performanceAdaptation', 'trendIntelligence', 'confidence')
    return c === 'low' || c === 'medium' || c === 'high' ? c : null
  })()

  const hasHoldShape = isHoldRow(name, reps) || isSkillHoldRow(name)

  if (coachAction) {
    const mapped = mapCoachDecisionAction(coachAction, hasHoldShape)
    if (mapped) {
      const detail =
        coachExplanation ||
        trendConcise ||
        undefined
      const finalConfidence: 'low' | 'medium' | 'high' = trendConfidence ?? mapped.confidence
      return {
        shouldRender: !isWarmupCooldown,
        verdict: mapped.verdict,
        label: mapped.label,
        shortText: mapped.shortText,
        detailText: detail,
        confidence: finalConfidence,
        source: 'coach_decision',
        dataAttributes: {
          'data-ab7-progression': 'true',
          'data-ab7-verdict': mapped.verdict,
          'data-ab7-source': 'coach_decision',
          'data-ab7-basis': coachAction,
        },
      }
    }
  }

  // ---------------------------------------------------------------------------
  // (2) Adaptive dosage progressionMode is a strong second source. Read with
  // unknown-safe accessors to avoid coupling to the AdaptiveExercise type.
  // Prevent a "harder_variation" claim on rows that are clearly not skill-
  // family eligible — even when an upstream stamp said add_reps_then_harder.
  // ---------------------------------------------------------------------------
  const progressionMode = readString(readPath(exercise, 'progressionMode'))
  if (progressionMode) {
    const mapped = mapProgressionMode(progressionMode)
    if (mapped) {
      // Guard: harder variation requires a recognizable skill-family shape.
      if (mapped.verdict === 'harder_variation' && !isSkillFamilyRow(name)) {
        // Soft-degrade: keep the rep-range advice without the variation jump.
        return {
          shouldRender: !isWarmupCooldown,
          verdict: 'progress_reps',
          label: 'Progression',
          shortText: 'Add reps until you own the top of the range.',
          confidence: 'medium',
          source: 'adaptive_dosage',
          dataAttributes: {
            'data-ab7-progression': 'true',
            'data-ab7-verdict': 'progress_reps',
            'data-ab7-source': 'adaptive_dosage',
            'data-ab7-basis': `${progressionMode}_softened`,
          },
        }
      }
      return {
        shouldRender: !isWarmupCooldown,
        verdict: mapped.verdict,
        label: mapped.label,
        shortText: mapped.shortText,
        detailText: trendConcise || undefined,
        confidence: mapped.confidence,
        source: 'adaptive_dosage',
        dataAttributes: {
          'data-ab7-progression': 'true',
          'data-ab7-verdict': mapped.verdict,
          'data-ab7-source': 'adaptive_dosage',
          'data-ab7-basis': progressionMode,
        },
      }
    }
  }

  // ---------------------------------------------------------------------------
  // (3) Exercise-shape fallback. Hold rows get hold-time guidance, weighted
  // rows get reps-then-load, band-assisted rows get reduce-assistance order,
  // and recognizable skill-family rows get a quality-first cue.
  // ---------------------------------------------------------------------------
  if (isWarmupCooldown) {
    return {
      shouldRender: false,
      verdict: 'not_applicable',
      label: '',
      shortText: '',
      confidence: 'low',
      source: 'fallback',
      dataAttributes: {
        'data-ab7-progression': 'false',
        'data-ab7-verdict': 'not_applicable',
        'data-ab7-source': 'fallback',
        'data-ab7-basis': 'warmup_cooldown',
      },
    }
  }

  const shape = shapeFallback(name, reps)
  if (shape) {
    return {
      shouldRender: true,
      verdict: shape.verdict,
      label: shape.label,
      shortText: shape.shortText,
      confidence: shape.confidence,
      source: 'exercise_shape',
      dataAttributes: {
        'data-ab7-progression': 'true',
        'data-ab7-verdict': shape.verdict,
        'data-ab7-source': 'exercise_shape',
        'data-ab7-basis': name.toLowerCase().slice(0, 24),
      },
    }
  }

  // ---------------------------------------------------------------------------
  // (4) No trustworthy source. Render nothing rather than guess. Accessory
  // rows fall through here and stay quiet — the row already shows sets, reps,
  // and RPE which is enough for a practical progression intent on accessory
  // work.
  // ---------------------------------------------------------------------------
  // Honor an explicit `applied:false` performanceAdaptation as a strong
  // "no claim" signal — never over-render on rows the resolver already
  // marked unstamped.
  const applied = readBool(readPath(exercise, 'performanceAdaptation', 'applied'))
  void applied

  return {
    shouldRender: false,
    verdict: 'not_applicable',
    label: '',
    shortText: '',
    confidence: 'low',
    source: 'fallback',
    dataAttributes: {
      'data-ab7-progression': 'false',
      'data-ab7-verdict': 'not_applicable',
      'data-ab7-source': 'fallback',
      'data-ab7-basis': 'no_signal',
    },
  }
}
