// =============================================================================
// EXERCISE PRESCRIPTION UNIT TRUTH (Step 4B of 19)
//
// Single authority for deciding whether an exercise's prescription should be
// expressed in REPS or in SECONDS / TIME-BASED HOLD.
//
// Why this exists
// ----------------
// Several upstream layers (mode detection, doctrine materialization, weekly
// scaling, variant compression) can independently rewrite an exercise's
// `repsOrTime` string. If any one of them drops the unit context (e.g. emits
// "8-15 reps" for an isometric "Wall Handstand Hold"), the user sees a
// prescription that contradicts the exercise identity.
//
// This helper is a small, deterministic safety net the renderer and the live
// workout normalizer call right before display. It does NOT regenerate the
// prescription. It only:
//
//   1. Detects an isometric / hold exercise from name + metadata flags.
//   2. Flags a unit conflict when reps are prescribed for a hold.
//   3. Repairs the conflict by mapping the rep range or single number into a
//      sensible time-based hold range (using the exercise's own
//      `defaultRepsOrTime` when that is already time-based, otherwise a safe
//      default tied to difficulty).
//
// The helper is intentionally narrow in scope: it leaves rep-based exercises
// alone, leaves already-time-based exercises alone, and only repairs the
// hold/reps mismatch case. It is extensible for other conflict classes.
// =============================================================================

export type PrescriptionDisplayUnit = 'reps' | 'seconds' | 'distance' | 'rounds' | 'unknown'

export interface PrescriptionUnitTruthInput {
  /** Exercise display name. Used for name-based hold detection. */
  name?: string | null
  /** Optional exercise id. Used as a secondary signal. */
  id?: string | null
  /** Optional category (skill / strength / accessory / mobility / cooldown / etc.). */
  category?: string | null
  /** Optional pool flag set by adaptive-exercise-pool entries. */
  isIsometric?: boolean
  /**
   * Optional pool default. If present and time-based, this is the most trusted
   * source for the corrected hold range because it was authored by a coach.
   */
  defaultRepsOrTime?: string | null
  /** Optional difficulty hint used to pick a fallback hold range. */
  difficultyLevel?: string | null
  /** The current displayed prescription value. May be reps, hold, or generic. */
  repsOrTime?: string | null
}

export interface PrescriptionUnitTruthResult {
  /** The unit the exercise SHOULD display. */
  unit: PrescriptionDisplayUnit
  /** Final, repaired repsOrTime string. Always safe to render. */
  repsOrTime: string
  /** True iff the input prescription contradicted the exercise identity. */
  conflict: boolean
  /** True iff this exercise is treated as an isometric hold. */
  isHold: boolean
  /** Short, user-readable diagnostic when a conflict was repaired. */
  conflictReason?: string
}

// -----------------------------------------------------------------------------
// Name-based detection
// -----------------------------------------------------------------------------

/**
 * Phrases inside an exercise name that indicate a STATIC isometric hold.
 *
 * If a name matches one of these, the prescription must be time-based.
 */
const STATIC_HOLD_NAME_PATTERNS: RegExp[] = [
  // Generic suffixes
  /\bhold\b/i,
  /\bsupport\s+hold\b/i,
  /\blever\s+hold\b/i,
  // Common static skills
  /\bplanche\s+lean\b/i,
  /\bplanche\s+hold\b/i,
  /\bfront\s+lever\s+hold\b/i,
  /\bback\s+lever\s+hold\b/i,
  /\bl[\s-]?sit\s+hold\b/i,
  /\bv[\s-]?sit\s+hold\b/i,
  /\bmanna\s+hold\b/i,
  /\bcross\s+hold\b/i,
  /\bmaltese\s+hold\b/i,
  /\bring\s+support\b/i,
  /\bturned\s+out\s+support\b/i,
  // Handstand line / box / pike static
  /\bhandstand\s+hold\b/i,
  /\bhandstand\s+line\s+hold\b/i,
  /\bbox\s+pike\s+(?:handstand\s+)?hold\b/i,
  /\belevated\s+pike\s+hold\b/i,
  // Dead / active hangs
  /\bactive\s+hang\b/i,
  /\bdead\s+hang\b/i,
  /\bgerman\s+hang\b/i,
  /\bskin[\s-]?the[\s-]?cat\s+hold\b/i,
  // Generic static positions
  /\bhollow\s+body\s+hold\b/i,
  /\barch\s+hold\b/i,
  /\bplank\s+hold\b/i,
  /\bwall\s+sit\b/i,
]

/**
 * Phrases that indicate a DYNAMIC drill that happens to be near static work
 * but is correctly prescribed in reps. Names matching these override the hold
 * patterns above so we don't accidentally flip a rep drill into seconds.
 */
const DYNAMIC_DRILL_NAME_PATTERNS: RegExp[] = [
  /\bshoulder\s+taps?\b/i,
  /\btoe\s+pulls?\b/i,
  /\bheel\s+pulls?\b/i,
  /\balignment\s+reps?\b/i,
  /\bline\s+drill\s+reps?\b/i,
  /\bweight\s+shifts?\b/i,
  /\bwalk[\s-]?ins?\b/i,
  /\bwall\s+walks?\b/i,
  /\bpartial\b/i,
  /\bnegative\b/i,
  /\bpush[\s-]?ups?\b/i,
  /\bpress\b/i,
  /\braises?\b/i,
  /\brows?\b/i,
  /\bdips?\b/i,
  /\bpull[\s-]?ups?\b/i,
  /\bmuscle[\s-]?ups?\b/i,
  /\beccentrics?\b/i,
]

function nameMatches(name: string, patterns: RegExp[]): boolean {
  for (const re of patterns) {
    if (re.test(name)) return true
  }
  return false
}

// -----------------------------------------------------------------------------
// Prescription string parsing
// -----------------------------------------------------------------------------

/**
 * True if the string already encodes a time / hold prescription.
 * Recognizes "30s", "30 sec", "30 seconds", "20-45s", "30s hold",
 * "5 min", "2 minutes", and similar.
 */
export function isTimeBasedPrescription(input: string | null | undefined): boolean {
  if (!input) return false
  const lower = input.toLowerCase()
  // Explicit time tokens
  if (/\d\s*(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes)\b/.test(lower)) {
    return true
  }
  // "hold" suffix is a time signal even without a unit
  if (/\bhold\b/.test(lower)) return true
  return false
}

/**
 * True if the string encodes a rep range / single rep count and nothing else.
 * "8-15", "8-15 reps", "10", "10 reps", "10 each side".
 */
export function isRepsPrescription(input: string | null | undefined): boolean {
  if (!input) return false
  const lower = input.toLowerCase()
  if (isTimeBasedPrescription(lower)) return false
  // Explicit reps token, or digit-only / range with optional "each"/"side"
  if (/\breps?\b/.test(lower)) return true
  if (/^\s*\d+\s*(?:[-–]\s*\d+)?\s*(?:each|side|per\s+side)?\s*$/.test(lower)) return true
  return false
}

interface RepsRangeParse {
  low: number
  high: number
}

function parseRepsRange(input: string): RepsRangeParse | null {
  const m = input.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (m) {
    const lo = parseInt(m[1], 10)
    const hi = parseInt(m[2], 10)
    if (Number.isFinite(lo) && Number.isFinite(hi) && lo > 0 && hi >= lo) {
      return { low: lo, high: hi }
    }
  }
  const single = input.match(/^\s*(\d+)/)
  if (single) {
    const v = parseInt(single[1], 10)
    if (Number.isFinite(v) && v > 0) return { low: v, high: v }
  }
  return null
}

// -----------------------------------------------------------------------------
// Hold-range fallbacks
// -----------------------------------------------------------------------------

/**
 * Default time-based prescription for an isometric whose pool default isn't
 * usable and whose current `repsOrTime` is rep-shaped. Tied to difficulty so
 * beginner exposures don't get aggressive durations.
 */
function fallbackHoldRange(difficultyLevel: string | null | undefined): string {
  switch ((difficultyLevel || '').toLowerCase()) {
    case 'elite':
    case 'advanced':
      return '30-45s'
    case 'intermediate':
      return '20-40s'
    case 'beginner':
    default:
      return '20-30s'
  }
}

/**
 * Map a rep count to a coaching-credible hold duration.
 *
 * Used only when an isometric has no usable pool default and we have to repair
 * a rep range coming from upstream. Keeps the magnitude proportional so a
 * "5-8 reps" target on a hold becomes a short hold and "12-15 reps" becomes a
 * longer hold.
 */
function repsRangeToHoldRange(low: number, high: number): string {
  // Clamp into a coaching-credible band per side.
  const mapOne = (n: number): number => {
    if (n <= 5) return 15
    if (n <= 8) return 20
    if (n <= 10) return 25
    if (n <= 12) return 30
    if (n <= 15) return 40
    return 45
  }
  const lo = mapOne(low)
  const hi = mapOne(high)
  if (lo === hi) return `${lo}s`
  return `${lo}-${hi}s`
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Resolve the user-visible prescription unit truth for a single exercise.
 *
 * - Rep-based exercises pass through unchanged.
 * - Already-time-based isometrics pass through unchanged.
 * - Isometric / hold exercises whose current prescription is rep-shaped get
 *   repaired into a time-based hold using:
 *     1. The exercise's pool `defaultRepsOrTime` if that is time-based, else
 *     2. A proportional rep-to-hold mapping when a rep range is parseable, else
 *     3. A safe difficulty-tied fallback (e.g. "20-30s" for beginner).
 */
export function resolveExercisePrescriptionUnitTruth(
  input: PrescriptionUnitTruthInput
): PrescriptionUnitTruthResult {
  const name = (input.name || '').trim()
  const current = (input.repsOrTime || '').trim()

  // 1. Identify whether this exercise is a hold.
  const isDynamicByName = name && nameMatches(name, DYNAMIC_DRILL_NAME_PATTERNS)
  const isStaticByName = name && nameMatches(name, STATIC_HOLD_NAME_PATTERNS)
  // Name signal beats metadata. A "Pike Shoulder Taps" in a hold-tagged
  // accessory bucket should still be reps. A "Wall Handstand Hold" with no
  // metadata flag should still be a hold.
  const isHold = isStaticByName ? true : isDynamicByName ? false : !!input.isIsometric

  // 2. Pass-through for non-holds. The renderer already handles rep formatting.
  if (!isHold) {
    return {
      unit: current && isTimeBasedPrescription(current) ? 'seconds' : 'reps',
      repsOrTime: current,
      conflict: false,
      isHold: false,
    }
  }

  // 3. Hold path. If the current value is already time-based, accept it.
  if (current && isTimeBasedPrescription(current)) {
    return {
      unit: 'seconds',
      repsOrTime: current,
      conflict: false,
      isHold: true,
    }
  }

  // 4. Hold path with rep-shaped or empty current value -> conflict, repair.
  // Prefer the pool's authored default if it is time-based.
  const poolDefault = (input.defaultRepsOrTime || '').trim()
  if (poolDefault && isTimeBasedPrescription(poolDefault)) {
    return {
      unit: 'seconds',
      repsOrTime: poolDefault,
      conflict: !!current && current !== poolDefault,
      isHold: true,
      conflictReason: current
        ? `Hold exercise had reps "${current}"; restored authored hold "${poolDefault}".`
        : undefined,
    }
  }

  // Try to map a rep range we can parse.
  const range = current ? parseRepsRange(current) : null
  if (range) {
    const repaired = repsRangeToHoldRange(range.low, range.high)
    return {
      unit: 'seconds',
      repsOrTime: repaired,
      conflict: true,
      isHold: true,
      conflictReason: `Hold exercise had reps "${current}"; mapped to time-based "${repaired}".`,
    }
  }

  // Last-resort safe default tied to difficulty.
  const fallback = fallbackHoldRange(input.difficultyLevel)
  return {
    unit: 'seconds',
    repsOrTime: fallback,
    conflict: !!current,
    isHold: true,
    conflictReason: current
      ? `Hold exercise had unrecognized prescription "${current}"; using safe default "${fallback}".`
      : undefined,
  }
}
