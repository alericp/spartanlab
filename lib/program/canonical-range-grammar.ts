// =============================================================================
// CANONICAL PRESCRIPTION RANGE GRAMMAR (Step 5C of 19)
//
// Single source of truth for the rep / hold ranges that may appear in a
// final visible prescription. Every authoritative dosage path must snap
// its computed (min, max) pair to one of the approved coaching bands
// defined here, so the program never displays arithmetic / interpolated
// ranges like "7-12", "5-11", "6-13", "4-9", "3-10", "2-8".
//
// This module is intentionally:
//   - pure (no external deps),
//   - small (no doctrine, no DB, no I/O),
//   - additive (no schema changes, no behavior change for already-canonical
//     ranges).
//
// Two responsibilities:
//   1. CANONICAL BANDS  — the only ranges that may leave the resolver.
//   2. INTENSITY-DAY LADDER — given a movement intent + day intensity,
//      pick the appropriate canonical band so high / moderate / low days
//      visibly differ for the same movement family.
//
// Step 5C does NOT replace the Step 5 / 5A / 5B resolver — it is the
// final sanity gate that runs at the END of the resolver and at the
// loader boundary so stale persisted strings can never display a weird
// range either.
// =============================================================================

// -----------------------------------------------------------------------------
// PUBLIC TYPES
// -----------------------------------------------------------------------------

/**
 * Day-level training intensity. Drives which canonical band an intent
 * resolves to. Sourced from session intent / spine-session-type by the
 * caller — defaults to 'moderate' if unknown.
 */
export type DayIntensity =
  | 'high' // CNS-heavy, max strength / power emphasis
  | 'moderate' // strength volume / repeatable output
  | 'low' // technical focus / recovery-aware / skill quality
  | 'mixed' // balanced expression
  | 'density' // density / endurance emphasis
  | 'compressed' // 30/45 minute compressed session

/**
 * Movement intent as understood by the prescription pipeline. Maps to
 * AdaptivePurpose in the resolver — listing both the canonical
 * coaching intents and a 'unknown' tail so legacy paths still work.
 */
export type RangeIntent =
  | 'max_strength'
  | 'strength_volume'
  | 'hypertrophy_support'
  | 'power_output'
  | 'power_endurance'
  | 'unilateral_strength'
  | 'skill_strength'
  | 'muscle_up_support'
  | 'hspu_strength'
  | 'hspu_prerequisite'
  | 'planche_skill_strength'
  | 'technique_practice'
  | 'endurance'
  | 'unknown'

export interface CanonicalRepBand {
  min: number
  max: number
}

export interface CanonicalHoldBand {
  min: number
  max: number
}

// -----------------------------------------------------------------------------
// APPROVED BANDS
// -----------------------------------------------------------------------------

/**
 * The full list of approved REP bands. Anything that leaves the
 * resolver as a rep prescription must collapse to one of these.
 *
 * Notable exclusions: 7-12, 5-11, 6-13, 4-9, 3-10, 2-8, 7-10, 7-11.
 * Those are the textbook arithmetic-interpolation outputs that this
 * module exists to eliminate.
 */
export const CANONICAL_REP_BANDS: ReadonlyArray<CanonicalRepBand> = [
  { min: 1, max: 3 },
  { min: 2, max: 3 },
  { min: 2, max: 4 },
  { min: 3, max: 5 },
  { min: 4, max: 6 },
  { min: 5, max: 8 },
  { min: 6, max: 8 },
  { min: 8, max: 10 },
  { min: 8, max: 12 },
  { min: 10, max: 12 },
  { min: 10, max: 15 },
  { min: 12, max: 15 },
  { min: 15, max: 20 },
]

/**
 * The full list of approved HOLD bands (seconds). Holds are allowed
 * to be tighter than reps — short canonical bands and exact targets
 * both pass the gate.
 */
export const CANONICAL_HOLD_BANDS: ReadonlyArray<CanonicalHoldBand> = [
  { min: 5, max: 8 },
  { min: 6, max: 10 },
  { min: 8, max: 12 },
  { min: 10, max: 15 },
  { min: 15, max: 25 },
  { min: 20, max: 30 },
  { min: 25, max: 45 },
  { min: 30, max: 45 },
  { min: 45, max: 60 },
]

/**
 * Ranges that must NEVER leave the prescription pipeline regardless of
 * intent. Used as the fast-path block check before the snapping step.
 */
const HARD_BLOCKED_REP_RANGES: ReadonlySet<string> = new Set([
  '7-12',
  '7-11',
  '7-10',
  '7-13',
  '5-11',
  '5-10',
  '5-9',
  '6-13',
  '6-11',
  '4-9',
  '4-8',
  '3-10',
  '2-8',
  '9-13',
])

// -----------------------------------------------------------------------------
// INTENSITY-DAY LADDER
// -----------------------------------------------------------------------------

/**
 * Per-intent, per-day-intensity list of canonical bands the resolver
 * is allowed to pick from. The first band is the preferred choice;
 * neighbouring bands are picked when a previously-computed range is
 * closer to them by midpoint distance.
 *
 * Designed so the SAME movement family produces visibly different
 * prescriptions across high / moderate / low days:
 *
 *   max_strength    high     -> 3-5 / 4-6
 *   max_strength    moderate -> 4-6 / 5-8
 *   max_strength    low      -> 4-6 (lower RPE — handled in resolver)
 *
 *   strength_volume high     -> 5-8 / 6-8
 *   strength_volume moderate -> 6-8 / 8-10
 *   strength_volume low      -> 5-8 (quality bias)
 *
 *   power_output    any      -> 2-3 / 2-4 / 3-5 (never broad volume)
 *
 *   skill_strength  high     -> 3-5 / 4-6
 *   skill_strength  moderate -> 4-6 / 5-8
 *   skill_strength  low      -> 3-5 / 4-6 (quality holds elsewhere)
 *
 *   hypertrophy     any      -> 8-10 / 8-12 / 10-12 / 10-15
 *   endurance       density  -> 10-15 / 12-15 / 15-20
 */
function bandsForIntent(
  intent: RangeIntent,
  dayIntensity: DayIntensity,
): CanonicalRepBand[] {
  switch (intent) {
    case 'max_strength':
      if (dayIntensity === 'high') return [{ min: 3, max: 5 }, { min: 4, max: 6 }]
      if (dayIntensity === 'low') return [{ min: 4, max: 6 }, { min: 3, max: 5 }]
      return [{ min: 4, max: 6 }, { min: 5, max: 8 }]

    case 'power_output':
      return [{ min: 2, max: 4 }, { min: 3, max: 5 }, { min: 2, max: 3 }]

    case 'power_endurance':
      return [{ min: 3, max: 5 }, { min: 4, max: 6 }, { min: 5, max: 8 }]

    case 'unilateral_strength':
      return [
        { min: 3, max: 5 },
        { min: 2, max: 4 },
        { min: 4, max: 6 },
        { min: 2, max: 3 },
      ]

    case 'skill_strength':
    case 'hspu_strength':
    case 'planche_skill_strength':
    case 'muscle_up_support':
      if (dayIntensity === 'high') return [{ min: 3, max: 5 }, { min: 4, max: 6 }]
      if (dayIntensity === 'low') return [{ min: 3, max: 5 }, { min: 4, max: 6 }]
      return [
        { min: 4, max: 6 },
        { min: 5, max: 8 },
        { min: 6, max: 8 },
      ]

    case 'strength_volume':
      if (dayIntensity === 'high')
        return [{ min: 5, max: 8 }, { min: 6, max: 8 }]
      if (dayIntensity === 'low')
        return [{ min: 5, max: 8 }, { min: 6, max: 8 }]
      if (dayIntensity === 'density')
        return [{ min: 8, max: 10 }, { min: 8, max: 12 }, { min: 10, max: 12 }]
      return [
        { min: 6, max: 8 },
        { min: 8, max: 10 },
        { min: 5, max: 8 },
      ]

    case 'hypertrophy_support':
      if (dayIntensity === 'low') return [{ min: 8, max: 10 }, { min: 8, max: 12 }]
      if (dayIntensity === 'density')
        return [{ min: 10, max: 12 }, { min: 10, max: 15 }, { min: 8, max: 12 }]
      return [
        { min: 8, max: 12 },
        { min: 8, max: 10 },
        { min: 10, max: 12 },
      ]

    case 'hspu_prerequisite':
      if (dayIntensity === 'high') return [{ min: 5, max: 8 }, { min: 6, max: 8 }]
      return [
        { min: 6, max: 8 },
        { min: 8, max: 10 },
        { min: 8, max: 12 },
      ]

    case 'technique_practice':
      return [{ min: 3, max: 5 }, { min: 4, max: 6 }, { min: 5, max: 8 }]

    case 'endurance':
      return [
        { min: 10, max: 15 },
        { min: 12, max: 15 },
        { min: 15, max: 20 },
        { min: 8, max: 12 },
      ]

    case 'unknown':
    default:
      return [
        { min: 5, max: 8 },
        { min: 6, max: 8 },
        { min: 8, max: 10 },
        { min: 8, max: 12 },
      ]
  }
}

// -----------------------------------------------------------------------------
// SNAP API
// -----------------------------------------------------------------------------

export interface RepBandSnapResult {
  band: CanonicalRepBand
  display: string
  changed: boolean
  reason?: string
}

export interface HoldBandSnapResult {
  band: CanonicalHoldBand
  display: string
  changed: boolean
  reason?: string
}

/**
 * Snap an arbitrary (min, max) rep pair to the most-appropriate
 * canonical band for a given intent and day intensity.
 *
 * Selection rules:
 *   1. If (min,max) is already in the intent-appropriate band list
 *      AND not on the hard-blocked list, return as-is.
 *   2. Otherwise pick the candidate with the smallest distance between
 *      midpoints.
 *
 * Per-side flag is preserved by the caller — this function only
 * resolves the numeric range.
 */
export function snapToCanonicalRepBand(
  rawMin: number,
  rawMax: number,
  intent: RangeIntent,
  dayIntensity: DayIntensity = 'moderate',
): RepBandSnapResult {
  const safeMin = Math.max(1, Math.round(rawMin))
  const safeMax = Math.max(safeMin, Math.round(rawMax))
  const candidates = bandsForIntent(intent, dayIntensity)

  const blocked = HARD_BLOCKED_REP_RANGES.has(`${safeMin}-${safeMax}`)

  // Already matches one of the intent-appropriate canonical bands.
  if (!blocked) {
    const exact = candidates.find((b) => b.min === safeMin && b.max === safeMax)
    if (exact) {
      return {
        band: exact,
        display: formatRepBand(exact),
        changed: false,
      }
    }
  }

  // Otherwise pick the candidate with the closest midpoint.
  const center = (safeMin + safeMax) / 2
  let best = candidates[0]
  let bestDist = Math.abs((best.min + best.max) / 2 - center)
  for (let i = 1; i < candidates.length; i++) {
    const b = candidates[i]
    const d = Math.abs((b.min + b.max) / 2 - center)
    if (d < bestDist) {
      best = b
      bestDist = d
    }
  }

  return {
    band: best,
    display: formatRepBand(best),
    changed: best.min !== safeMin || best.max !== safeMax,
    reason: blocked
      ? `Snapped blocked range ${safeMin}-${safeMax} -> ${best.min}-${best.max} (${intent}, ${dayIntensity})`
      : `Snapped ${safeMin}-${safeMax} -> ${best.min}-${best.max} for ${intent} on ${dayIntensity} day`,
  }
}

/**
 * Snap an arbitrary (min, max) hold-second pair to a canonical hold
 * band. Tight ranges (<= 5s spread) and short single-second targets
 * are preserved unchanged — only broad arbitrary spreads (e.g.
 * "23-47s") are normalized.
 */
export function snapToCanonicalHoldBand(
  rawMin: number,
  rawMax: number,
): HoldBandSnapResult {
  const safeMin = Math.max(3, Math.round(rawMin))
  const safeMax = Math.max(safeMin, Math.round(rawMax))

  // Tight, modest spreads pass through (intentional precise targets).
  if (safeMax - safeMin <= 5 && safeMax <= 60) {
    return {
      band: { min: safeMin, max: safeMax },
      display: safeMin === safeMax ? `${safeMin}s` : `${safeMin}-${safeMax}s`,
      changed: false,
    }
  }

  const center = (safeMin + safeMax) / 2
  let best = CANONICAL_HOLD_BANDS[0]
  let bestDist = Math.abs((best.min + best.max) / 2 - center)
  for (let i = 1; i < CANONICAL_HOLD_BANDS.length; i++) {
    const b = CANONICAL_HOLD_BANDS[i]
    const d = Math.abs((b.min + b.max) / 2 - center)
    if (d < bestDist) {
      best = b
      bestDist = d
    }
  }

  return {
    band: best,
    display: `${best.min}-${best.max}s`,
    changed: best.min !== safeMin || best.max !== safeMax,
    reason: `Snapped hold ${safeMin}-${safeMax}s -> ${best.min}-${best.max}s`,
  }
}

// -----------------------------------------------------------------------------
// STRING NORMALIZATION (loader sanity gate)
// -----------------------------------------------------------------------------

/**
 * Inspect a stored repsOrTime string and snap it to canonical grammar
 * if it fails the gate. This is the LAST line of defense for
 * persisted programs that were generated before Step 5C — the
 * Program-page card and live workout both consume the loaded session
 * directly, so this single call protects every downstream surface.
 *
 * Returns:
 *   - { changed: false } when the string is already canonical or
 *     not a recognized rep/hold range (AMRAP, "5", "30s each", etc.).
 *   - { changed: true, repsOrTime: <new>, reason } when a weird
 *     range was rewritten.
 */
export function normalizeRepsOrTimeString(
  repsOrTime: string | null | undefined,
  intent: RangeIntent = 'unknown',
  dayIntensity: DayIntensity = 'moderate',
): { repsOrTime: string; changed: boolean; reason?: string } {
  if (!repsOrTime || typeof repsOrTime !== 'string') {
    return { repsOrTime: repsOrTime ?? '', changed: false }
  }

  const trimmed = repsOrTime.trim()
  if (!trimmed) return { repsOrTime, changed: false }

  // Per-side rep range: "3-5 / side" or "4-6 each side"
  const perSide = trimmed.match(
    /^(\d+)\s*-\s*(\d+)\s*(?:reps?\s*)?(?:\/\s*side|each(?:\s+side)?)\b(.*)$/i,
  )
  if (perSide) {
    const lo = parseInt(perSide[1], 10)
    const hi = parseInt(perSide[2], 10)
    const tail = perSide[3] || ''
    const snap = snapToCanonicalRepBand(lo, hi, intent, dayIntensity)
    if (!snap.changed) return { repsOrTime, changed: false }
    return {
      repsOrTime: `${snap.band.min}-${snap.band.max} / side${tail}`,
      changed: true,
      reason: snap.reason,
    }
  }

  // Hold range with seconds suffix: "20-30s", "8-12 sec", "30 seconds"
  const holdRange = trimmed.match(
    /^(\d+)\s*-\s*(\d+)\s*(?:s|sec|secs|seconds?)\b(.*)$/i,
  )
  if (holdRange) {
    const lo = parseInt(holdRange[1], 10)
    const hi = parseInt(holdRange[2], 10)
    const tail = holdRange[3] || ''
    const snap = snapToCanonicalHoldBand(lo, hi)
    if (!snap.changed) return { repsOrTime, changed: false }
    return {
      repsOrTime: `${snap.band.min}-${snap.band.max}s${tail}`,
      changed: true,
      reason: snap.reason,
    }
  }

  // Single-value hold (e.g. "30s", "45 sec") — leave alone.
  if (/^\d+\s*(?:s|sec|secs|seconds?)\b/i.test(trimmed)) {
    return { repsOrTime, changed: false }
  }

  // Plain rep range: "7-12 reps", "8-12", "5-7 reps"
  const repRange = trimmed.match(/^(\d+)\s*-\s*(\d+)(\s*reps?)?\s*$/i)
  if (repRange) {
    const lo = parseInt(repRange[1], 10)
    const hi = parseInt(repRange[2], 10)
    const hadLabel = !!repRange[3]
    // Already canonical AND not blocked? Pass through.
    const exactCanonical = CANONICAL_REP_BANDS.find(
      (b) => b.min === lo && b.max === hi,
    )
    if (exactCanonical && !HARD_BLOCKED_REP_RANGES.has(`${lo}-${hi}`)) {
      return { repsOrTime, changed: false }
    }
    const snap = snapToCanonicalRepBand(lo, hi, intent, dayIntensity)
    if (!snap.changed) return { repsOrTime, changed: false }
    const out = hadLabel
      ? `${snap.band.min}-${snap.band.max} reps`
      : `${snap.band.min}-${snap.band.max}`
    return { repsOrTime: out, changed: true, reason: snap.reason }
  }

  // Single rep count, "X each", AMRAP, mixed-format strings — pass.
  return { repsOrTime, changed: false }
}

/**
 * Quick test predicate used by acceptance audits.
 */
export function isHardBlockedRepRange(min: number, max: number): boolean {
  return HARD_BLOCKED_REP_RANGES.has(`${min}-${max}`)
}

// -----------------------------------------------------------------------------
// DAY-INTENSITY DERIVATION
// -----------------------------------------------------------------------------

/**
 * Derive a DayIntensity from a session intent / spine session type
 * string. Both fields are already produced by
 * lib/program-generation/session-composition-intelligence.ts and
 * survive into the AdaptiveSession via compositionMetadata, so the
 * caller does not need to compute anything new — it just hands us
 * the strings it already has.
 *
 * Heuristic — keep simple, deterministic, and conservative:
 *   - "overload" / "max_strength" / "intensity_focus" / "power"   -> high
 *   - "volume" / "volume_build" / "hypertrophy" / "support"       -> moderate
 *   - "technical" / "skill_practice" / "recovery" / "deload"      -> low
 *   - "density" / "endurance" / "conditioning"                    -> density
 *   - default                                                     -> moderate
 */
export function deriveDayIntensity(
  sessionIntent?: string | null,
  spineSessionType?: string | null,
): DayIntensity {
  const intent = (sessionIntent || '').toLowerCase()
  const spine = (spineSessionType || '').toLowerCase()
  const both = `${intent} ${spine}`

  if (
    /\b(overload|max_strength|max-strength|intensity_focus|intensity-focus|power|peak|cns)\b/.test(
      both,
    )
  ) {
    return 'high'
  }
  if (
    /\b(technical|skill_practice|skill-practice|recovery|deload|reacclimation|reacclimate)\b/.test(
      both,
    )
  ) {
    return 'low'
  }
  if (/\b(density|endurance|conditioning|metcon|finisher_only)\b/.test(both)) {
    return 'density'
  }
  if (
    /\b(volume|volume_build|volume-build|hypertrophy|support|build)\b/.test(
      both,
    )
  ) {
    return 'moderate'
  }
  if (/\bmixed\b/.test(both)) return 'mixed'
  return 'moderate'
}

// -----------------------------------------------------------------------------
// FORMAT HELPERS
// -----------------------------------------------------------------------------

function formatRepBand(b: CanonicalRepBand): string {
  if (b.min === b.max) return `${b.min} reps`
  return `${b.min}-${b.max} reps`
}
